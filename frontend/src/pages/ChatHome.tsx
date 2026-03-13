import { useEffect, useRef, useState } from 'react';
import { getCookieValue } from '../../../cookie-funcs.ts';
import './ChatHome.css';

interface Message {
    id: number;
    message: string;
    created_at: string; // we’ll format this later
    user_id: number;
}

const ChatHome: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {

        const websocket = new WebSocket('ws://localhost:3000');
        setWs(websocket);

        websocket.onopen = () => console.log('Connected to WebSocket server');

        websocket.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if (data.type === 'history' && Array.isArray(data.messages)) {
                setMessages(data.messages); // just set once instead of forEach
            } else if (data.type === 'message') {
                setMessages(prev => [...prev, data.message]); // append live message
            } else {
                console.warn('Unknown message type or invalid format:', data);
            }
        };

        websocket.onclose = () => console.log('Disconnected from WebSocket server');
        websocket.onerror = (err) => console.error('WebSocket error:', err);

        return () => websocket.close();
    }, []);

    const sendMessage = () => {
        if (ws && ws.readyState === WebSocket.OPEN && input.trim() !== '') {
            const session_id = getCookieValue('RigelSessionID');
            ws.send(JSON.stringify({ type:"star", message: {text: input}, session_id }));
            setInput('');
        }
    };

    const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') sendMessage();
    };

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatDate = (iso: string) => new Date(iso).toLocaleTimeString();

    const getUsersName = async (id: number): Promise<string> => {
        if (id === 4) return "Anonymous";
        if (!id) return "";

        try {
            const response = await fetch(`http://localhost:3000/get-user-info/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Don't forget your session token here eventually!
                },
            });

            if (!response.ok) {
                console.error("Server error:", await response.text());
                return "Error!";
            }

            const json = await response.json();
            
            // Check your nesting! 
            // Based on your previous backend code: { user: { username: "..." } }
            return json.username.username || "Invalid User!";

        } catch (err) {
            console.error("Network failed:", err);
            return "Connection Error";
        }
    }

    const UserName = ({ userId }: { userId: number }) => {
        const [name, setName] = useState("...");

        useEffect(() => {
            getUsersName(userId).then(setName);
        }, [userId]);

        return <span>{name}</span>;
    };

    return (
        <div className="star">
            <h2>The Star</h2>
            <div className="messages scrollable">
                {messages
                .filter(msg => msg.id !== undefined) // skip invalid messages
                .map(msg => (
                    <p key={msg.id}>
                        <strong><UserName userId={msg.user_id} /></strong> [{new Date(msg.created_at).toLocaleTimeString()}]: {msg.message}
                    </p>
                ))}
                <div ref={messagesEndRef}/>
                </div>
            <br/>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyUp={handleInputKeyPress}
                placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatHome;