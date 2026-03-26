import 'dotenv/config'; 
import express, { type Request, type Response } from 'express';
import { createServer } from 'node:http';
import pg from 'pg';
import bcrypt from 'bcrypt';
import cors from 'cors';
import crypto from 'crypto';
import initializeWebSockets  from './websockets.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const upload_pfp = multer({ dest: 'user_images/profile_pictures/' });
const port = 3000;

app.use(express.json());
if (process.env.MY_IP) {
    app.use(cors({
        origin: ['http://localhost:5173',process.env.MY_IP]
    }));
} else {
    app.use(cors({
        origin: 'http://localhost:5173'
    }));
}

const server = createServer(app);

initializeWebSockets(server,pool);

interface RegisterRequest {
    username: string;
    password: string;
    password_confirm: string;
    email: string;
}

app.post('/register', async (req: Request, res: Response) => {
    const { username, password, password_confirm, email } = req.body as RegisterRequest;
    
    if (!username || !password || !password_confirm || !email) {
        return res.status(400).json({ error:"All fields are required" });
    }

    if (password !== password_confirm) {
        return res.status(400).json({ error:"Passwords do not match"});
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

interface LoginRequest {
    username: string;
    password: string;
}

app.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body as LoginRequest;
    
    if (!username || !password) {
        return res.status(400).json({error: "All fields are required"});
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
            const session_id = crypto.randomBytes(16).toString('base64url');
            await pool.query(
                'UPDATE users SET session_id = $1 WHERE username = $2',
                [session_id,username]
            )
            res.json({ message: "Logged in!", session_id: session_id });
        } else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Login failed");
    }
});

interface VerifySessionIDRequest {
    session_id: string;
}

app.post('/verify-session-id', async (req: Request, res: Response) => {
    const { session_id } = req.body as VerifySessionIDRequest;

    if (!session_id) {
        return res.status(400).json({ error: "invalid session id" });
    }

    try {
        const result = await pool.query(
            'SELECT id FROM users WHERE session_id = $1',
            [session_id]
        );

        // 1. Check if we actually found a row
        if (result.rows.length > 0) {
            // 2. Return the specific value, not the whole result object
            return res.status(200).json({ user_id: result.rows[0].id });
        } else {
            return res.status(401).json({ error: "incorrect session id" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
    }
});

app.get('/get-user-info/:userid', async (req: Request, res:Response) => {
    const targetUser = req.params.userid;

    if (!targetUser) {
        return res.status(400).json({ error:"Please provide ID" });
    }

    try {
        const user = await pool.query('SELECT username FROM users WHERE id = $1', [+targetUser]);

        return res.status(200).json({ username:user.rows[0]});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error:"Get user failed" });
    }
})

app.get('/get-user-friends', async (req: Request, res:Response) => {
    const authHeader = req.headers['session_id'];
    if (typeof authHeader !== "string") return res.status(401).json({ error: 'Access denied. No id provided.' });
    const session_id = authHeader && authHeader.split(' ')[1];

    if (!session_id) {
        return res.status(401).json({ error: 'Access denied. No id provided.' });
    }

    const user_id = (await pool.query(
        'SELECT id FROM users WHERE session_id = $1',
        [session_id]
    )).rows[0].id;

    const friendships = (await pool.query(
        'SELECT * FROM friendships WHERE user_1 = $1 OR user_2 = $1',
        [user_id]
    )).rows;

    return res.status(200).json({ friendships });
})

interface TargetedUserRequest {
    username: string;
    session_id: string;
}

app.post('/add-friend', async (req: Request, res: Response) => {
    const { username, session_id } = req.body as TargetedUserRequest;

    if (!session_id || !username) {
        return res.status(401).json({ error: 'Please provide username and session id' });
    }

    const user_id = (await pool.query(
        'SELECT id FROM users WHERE session_id = $1',
        [session_id]
    )).rows[0].id;

    const target_id = (await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
    )).rows[0].id;

    const friendship = (await pool.query(
        'SELECT status FROM friendships WHERE (user_1 = $1 AND user_2 = $2) OR (user_1 = $2 AND user_2 = $1)',
        [user_id, target_id]
    )).rows;

    if (friendship.length > 0) return res.status(400).json({ error: 'You already have friendship or pending friendship'});

    await pool.query(
        'INSERT INTO friendships (user_1, user_2, status) VALUES ($1, $2, \'friends\')',
        [user_id, target_id]
    );

    return res.status(200).json({ message:"Sent friend request!" });
})

app.post('/new-cluster', async (req: Request, res: Response) => {
    const { username, session_id } = req.body as TargetedUserRequest;

    if (!session_id || !username) {
        return res.status(401).json({ error: 'Please provide username and session id' });
    }

    // Clean and standard approach
    const user = (await pool.query(
        'SELECT id, username FROM users WHERE session_id = $1',
        [session_id]
    )).rows[0];

    const target = (await pool.query(
        'SELECT id, username FROM users WHERE username = $1',
        [username]
    )).rows[0];
    
    if (!target || !user) return res.status(401).json({ error: 'Invalid username and session id' });

    const group_id = (await pool.query(
        'INSERT INTO groups (name) VALUES ($1) RETURNING (id)',
        [`${user.username} and ${target.username}`]
    )).rows[0].id;

    await pool.query(
        'INSERT INTO group_members (user_id, group_id) VALUES ($1, $2)',
        [user.id, group_id]
    );

    await pool.query(
        'INSERT INTO group_members (user_id, group_id) VALUES ($1, $2)',
        [target.id, group_id]
    );

    return res.status(200).json({ message:"Created cluster" });
})

app.get('/get-group-name/:groupid', async (req: Request, res:Response) => {
    const targetGroup = req.params.groupid;

    if (!targetGroup) {
        return res.status(400).json({ error:"Please provide ID" });
    }

    try {
        const user = await pool.query('SELECT name FROM groups WHERE id = $1', [targetGroup]);

        return res.status(200).json({ groupname:user.rows[0]});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error:"Get user failed" });
    }
})

app.get('/get-user-groups', async (req: Request, res:Response) => {
    const authHeader = req.headers['session_id'];
    if (typeof authHeader !== "string") return res.status(401).json({ error: 'Access denied. No id provided.' });
    const session_id = authHeader && authHeader.split(' ')[1];

    if (!session_id) {
        return res.status(401).json({ error: 'Access denied. No id provided.' });
    }

    const user_id = (await pool.query(
        'SELECT id FROM users WHERE session_id = $1',
        [session_id]
    )).rows[0].id;

    if (!session_id) return res.status(401).json({ error: 'Access denied. Bad id.' });

    const groups = (await pool.query(
        'SELECT group_id FROM group_members WHERE user_id = $1',
        [user_id]
    )).rows;

    return res.status(200).json({ groups });
})

async function get_image_path(id: number) {
    let image_json;
    try {
        image_json = (await pool.query(
            'SELECT filename, type FROM images WHERE id = $1',
            [id] 
        )).rows[0];
    } catch (err) {
        console.error(err);
        return "INVALID IMAGE!";
    }

    if (image_json.type === "pfp") {
        return path.join(__dirname, '../user_images/profile_pictures', image_json.filename);
    } else if (image_json.type === "chat") {
        return path.join(__dirname, '../user_images/chat_images', image_json.filename);
    }
    return "INVALID IMAGE!"
}

app.get('/user-pfp/:userid', async (req: Request, res: Response) => {
    const user_id = req.params.userid;
    
    console.log(user_id);

    if (!user_id) {
        res.sendFile(await get_image_path(1), (err) => {
            if (err) {
                res.status(404).send('Image not found');
            }
        });
        return;
    }

    const image_id = (await pool.query(
        'SELECT pfp_image FROM users WHERE id = $1',
        [user_id]
    )).rows[0];

    const filePath = await get_image_path(image_id.pfp_image);

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Image not found');
        }
    });
});

interface UploadPfpRequest {
    session_id: string;
}

app.post('/upload_pfp', upload_pfp.single('image'), async (req: Request, res: Response) => {
  const file = req.file;
  const { session_id } = req.body as UploadPfpRequest;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  console.log('File received:', file.originalname);

  const image_id = await pool.query(
    'INSERT INTO images (filename, type) VALUES ($1, $2) RETURNING id',
    [file.filename,'pfp']
  );

  console.log(image_id.rows[0].id, session_id);

 await pool.query(
    'UPDATE users SET pfp_image = $1 WHERE session_id = $2',
    [image_id.rows[0].id, session_id]
  );
  
  res.status(200).json({
    message: 'File uploaded successfully',
    filename: file.filename
  });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});