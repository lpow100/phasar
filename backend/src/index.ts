import 'dotenv/config'; 
import express, { type Request, type Response } from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import pg from 'pg';
import bcrypt from 'bcrypt';
import cors from 'cors';

const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chat',
    port: 5432,
    password: process.env.DB_PASSWORD, 
});

pool.query('SELECT NOW()', (err) => {
    if (err) console.error('DB Connection Error:', err);
    else console.log('Database Connected');
});

const app = express();
app.use(express.json());
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173'
}));

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', async (message: Buffer) => {
        const messageString = message.toString();

        try {
            // Save to Postgres
            await pool.query('INSERT INTO messages (content) VALUES ($1)', [messageString]);

            // Broadcast
            wss.clients.forEach((client: WebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageString);
                }
            });
        } catch (err) {
            console.error('Save error:', err);
        }
    });
});

interface RegisterRequest {
    username: string;
    password: string;
    password_confirm: string;
    email: string;
}

app.post('/register', async (req: Request, res: Response) => {
    const { username, password, password_confirm, email } = req.body as RegisterRequest;
    
    if (!username || !password || !password_confirm || !email) {
        return res.status(400).send("All fields are required");
    }

    if (password !== password_confirm) {
        return res.status(400).send("Passwords do not match");
    }

    try {
        // 1. Hash the password (10 is the "salt rounds" or work factor)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. Insert into DB
        const result = await pool.query(
            'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username',
            [username, hashedPassword, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Registration failed");
    }
});

app.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body as RegisterRequest;
    
    if (!username || !password) {
        return res.status(400).send("All fields are required");
    }

    try {
        const result = await pool.query(
            'SELECT username, password FROM users WHERE username = $1',
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({ message: "Logged in!", session_id: user.session_id });
        } else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Login failed");
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});