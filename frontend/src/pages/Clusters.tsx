import { useEffect, useRef, useState } from "react";
import { getCookieValue } from "../../../cookie-funcs";
import { NavLink } from "react-router-dom";

interface Group {
    group_id: number;
}

function Cluster() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [friendUsername, setFriendUsername] = useState('');
    const [status, setStatus] = useState('');

    const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') createCluster();
    };

    const createCluster = async () => {
        const response = await fetch(`http://localhost:3000/new-cluster`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username:friendUsername, session_id:getCookieValue("RigelSessionID") })
        });

        const json = await response.json();
        if (response.ok) {
            setStatus(json.message);
        } else {
            setStatus(json.error);
        }
    }

    const groupsEndRef = useRef<HTMLDivElement | null>(null);
        
    const scrollToBottom = () => {
        groupsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [groups]);

    const getGroupsName = async (id: number): Promise<string> => {
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
            getGroupsName(groupId).then(setName);
        }, [groupId]);

        return <span>{name}</span>;
    };

    const getGroups = async () => {
        const response = await fetch(`http://localhost:3000/get-user-groups`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'session_id': `Bearer ${getCookieValue("RigelSessionID")}` 
            },
        });

        const json = await response.json();
        setGroups(json.groups);
    }

    useEffect(() => {
        getGroups();
    },[])

    return (
        <>
        <h1>Clustesr</h1>
        Clusters are our version of DMs
        <h2>Create New Cluster</h2>
        <input
                type="text"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                onKeyUp={handleInputKeyPress}
                placeholder="Create a cluster"
            />
        <button onClick={createCluster}>New Cluster</button>
        {status}
        <h2>Your Clusters</h2>
        <div className="messages scrollable">
            {groups
            .filter(group => group !== undefined) // skip invalid messages
            .map(group => (
                <p key={group.group_id}>
                    <NavLink to={`/chat-clusters?group-id=${group.group_id}`}><strong><GroupName groupId={group.group_id}/></strong> </NavLink>
                </p>
            ))}
            <div ref={groupsEndRef}/>
        </div>
        </>
    )
}

export default Cluster