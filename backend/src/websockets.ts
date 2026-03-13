import type { Server, IncomingMessage, ServerResponse } from 'node:http';
import { type Server as WSSever, WebSocketServer, WebSocket } from 'ws';
import { Pool } from 'pg';

interface IncomingRigelMessage {
  session_id: string;
  message: any;
  type: string;
}

function initializeWebSockets(server:Server<typeof IncomingMessage, typeof ServerResponse>, pool:Pool) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', async (ws: WebSocket) => {
        const messages = (await pool.query(`
            SELECT * FROM rigel_messages
            ORDER BY created_at ASC
            LIMIT 50`));
        ws.send(JSON.stringify({ type: 'history', messages:messages.rows }));
        ws.on('message', async (rawMessage: Buffer) => {
            const messageString = rawMessage.toString();

            let data: IncomingRigelMessage;
            try {
                data = JSON.parse(messageString);
            } catch {
                console.error('Invalid message format:', messageString);
                return;
            }

            const { type, session_id, message } = data;
            if (!session_id || !message) return;

            if (type == "star") parseStarMessage(wss,session_id,message.text,pool);
            else if (type == "clusters") parseStarMessage(wss,session_id,message.text,pool);
            else if (type == "join_cluster") respondClusterHistory(ws,message,pool);
            else if (type == "clusters_send") parseClusterMessage(wss,session_id,message.urlGroupId,message.text,pool);
            else {
                console.log(`I don't know what to do with message type: ${type}`)
            }
        });
    });
}

async function parseStarMessage(wss:WSSever<typeof WebSocket, typeof IncomingMessage>, session_id:string, message:string,pool:Pool) {
    try {
        const userResult = await pool.query(
            'SELECT id, username FROM users WHERE session_id = $1',
            [session_id]
        );

        let saved;
        if (userResult.rowCount === 0) {
            console.warn('Unknown session_id:', session_id);
            saved = await pool.query(
                'INSERT INTO rigel_messages (message, user_id) VALUES ($1, 4) RETURNING *',
                [message]
            );
        } else {

            const user = userResult.rows[0];

            saved = await pool.query(
                'INSERT INTO rigel_messages (message, user_id) VALUES ($1, $2) RETURNING *',
                [message, user.id]
            );
        }

        // Broadcast to all clients
        const savedRow = saved.rows[0];

        const broadcastData = {
            type: 'message',
            message: {
                id: savedRow.id,
                message: savedRow.message,
                created_at: savedRow.created_at,
                user_id: savedRow.user_id,
            }
        };

        wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(broadcastData));
            }
        });

    } catch (err) {
        console.error('Save error:', err);
    }
}

async function parseClusterMessage(wss:WSSever<typeof WebSocket, typeof IncomingMessage>, session_id:string,group_id:number, message:string,pool:Pool) {
    try {
        const userResult = await pool.query(
            'SELECT id, username FROM users WHERE session_id = $1',
            [session_id]
        );

        let saved;
        if (userResult.rowCount === 0) {
            console.warn('Unknown session_id:', session_id);
            return;
        }

        const user = userResult.rows[0];

        const group = await pool.query(
            'SELECT group_id FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group_id,user.id]
        );

        if (group.rowCount === 0) {
            console.error('Unknown group_id:', group_id);
            return;
        }

        saved = await pool.query(
            'INSERT INTO group_messages (message, user_id, group_id) VALUES ($1, $2, $3) RETURNING *',
            [message, user.id, group_id]
        );

        // Broadcast to all clients
        const savedRow = saved.rows[0];

        const broadcastData = {
            type: 'message',
            message: {
                id: savedRow.id,
                message: savedRow.message,
                created_at: savedRow.created_at,
                user_id: savedRow.user_id,
                group_id: group_id
            }
        };

        wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(broadcastData));
            }
        });

    } catch (err) {
        console.error('Save error:', err);
    }
}

async function respondClusterHistory(ws: WebSocket, group_id: number, pool:Pool) { 
    const messages = (await pool.query(`
        SELECT * FROM group_messages
        WHERE group_id = $1
        ORDER BY created_at ASC
        LIMIT 50`,
        [group_id]
    ));
    ws.send(JSON.stringify({ type: 'cluster_history', messages:messages.rows }));
}

export default initializeWebSockets;
