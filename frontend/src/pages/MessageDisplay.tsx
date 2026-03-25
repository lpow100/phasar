import React, { useEffect, useState } from 'react';

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

interface Message {
    id: number;
    message: string;
    created_at: string; // we’ll format this later
    user_id: number;
}

interface MessageDisplayProps {
  message: Message;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
    return (
        <div >
            <img 
                src={`http://localhost:3000/user-pfp/${message.user_id}`} 
                alt="Profile" 
                className="mini-pfp" 
                onError={(e) => {
                    // Fallback if the specific user image is missing in public folder
                    e.currentTarget.src = "/user_images/profile_pictures/defaultPfp.jpg";
                }}
            />
            <strong><UserName userId={message.user_id} /></strong> 
            <small> [{new Date(message.created_at).toLocaleTimeString()}]</small>: {message.message}
        </div>
    );
};

export default MessageDisplay;
