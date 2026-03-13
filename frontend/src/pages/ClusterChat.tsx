import { useEffect, useRef, useState } from 'react';
import { getCookieValue } from '../../../cookie-funcs.ts';
import { useSearchParams } from 'react-router-dom';
import './ChatHome.css';

interface Message {
    id: number;
    message: string;
    created_at: string; // we’ll format this later
    user_id: number;
    group_id: number;
}

const ClusterChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [searchParams] = useSearchParams();
    
    // Get the Group ID once from the URL
    const urlGroupId = parseInt(searchParams.get('group-id') || '0');

    useEffect(() => {
        if (!urlGroupId) {
            console.log("no group haha")
            return;
        }

        const websocket = new WebSocket('ws://localhost:3000');
        setWs(websocket);

        websocket.onopen = () => {
            console.log(`Connected to Cluster: ${urlGroupId}`);
            // Tell the backend immediately which group we are watching
            const session_id = getCookieValue('RigelSessionID');
            websocket.send(JSON.stringify({ 
                type: 'join_cluster', 
                message: urlGroupId, 
                session_id 
            }));
        };

        websocket.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'cluster_history') {
                console.log(data.messages);
                setMessages(data.messages);
            } else if (data.type === 'message') {
                // Only add if it belongs to this group (extra safety)
                if (data.message.group_id === urlGroupId) {
                    setMessages(prev => [...prev, data.message]);
                }
            }
        };

        return () => websocket.close();
    }, [urlGroupId]); // Re-run if the user switches groups in the UI

    const sendMessage = () => {
        if (ws?.readyState === WebSocket.OPEN && input.trim() !== '' && urlGroupId !== 0) {
            const session_id = getCookieValue('RigelSessionID');
            
            // Explicitly route this to "clusters"
            ws.send(JSON.stringify({ 
                type: "clusters_send", 
                message: { 
                    urlGroupId: urlGroupId, 
                    text: input 
                }, 
                session_id 
            }));
            
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

    const getGroupssName = async (id: number): Promise<string> => {
        if (id === 4) return "Anonymous";
        if (!id) return "";

        try {
            const response = await fetch(`http://localhost:3000/get-group-name/${id}`, {
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
            return json.groupname.name || "Invalid User!";

        } catch (err) {
            console.error("Network failed:", err);
            return "Connection Error";
        }
    }

    const GroupName = ({ groupId }: { groupId: number }) => {
        const [name, setName] = useState("...");

        useEffect(() => {
            getGroupssName(groupId).then(setName);
        }, [groupId]);

        return <span>{name}</span>;
    };

    

    return (
        <div className="cluster-chat">
            <h2><GroupName groupId={urlGroupId}/></h2>
            <div className="messages scrollable">
                {messages.map(msg => (
                    <p key={msg.id}>
                        <strong><UserName userId={msg.user_id} /></strong> 
                        <small> [{new Date(msg.created_at).toLocaleTimeString()}]</small>: {msg.message}
                    </p>
                ))}
                <div ref={messagesEndRef}/>
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyUp={handleInputKeyPress}
                placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send</button>
            {/* Input fields... */}
        </div>
    );
};

export default ClusterChat;