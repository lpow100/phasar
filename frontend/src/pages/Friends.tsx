import { useEffect, useRef, useState } from "react";
import { getCookieValue, getUser } from "../../../cookie-funcs";
import { getHttpUrl } from "../env_ip";

interface Friend {
    id: number;
    user_1: number;
    user_2: number;
    created_at: string; // we’ll format this later
    status: number;
}

function Friends() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendUsername, setFriendUsername] = useState('');
    const [status, setStatus] = useState('');

    const handleInputChange = (event: React.KeyboardEvent<HTMLInputElement>) => {
        setFriendUsername(event.currentTarget.value);
    }

    const getFriends = async () => {
        const response = await fetch(getHttpUrl(`get-user-friends`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'session_id': `Bearer ${getCookieValue("RigelSessionID")}` 
            },
        });

        const json = await response.json();
        setFriends(json.friendships);
    }

    const addFriend = async () => {
        const response = await fetch(getHttpUrl(`add-friend`), {
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

    useEffect(() => {
        getFriends();
    },[])

    const getUsersName = async (id: number): Promise<string> => {
        if (id === 4) return "Anonymous";
        if (!id) return "";

        try {
            const response = await fetch(getHttpUrl(`get-user-info/${id}`), {
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

    const UserName = ({ userId1, userId2 }: { userId1: number, userId2: number }) => {
        const [name, setName] = useState("...");

        useEffect(() => {
            const resolveIdsAndFetch = async () => {
                // 1. Wait for your own user data
                const my_user = await getUser(); 
                if (!my_user) return;

                const friendId = (my_user === userId1) ? userId2 : userId1;
                console.log(my_user);

                // 3. Fetch the name of the friendId
                const friendName = await getUsersName(friendId);
                setName(friendName);
            };

            resolveIdsAndFetch();
        }, [userId1, userId2]); // Re-run if IDs change

        return <span>{name}</span>;
    };

    const friendsEndRef = useRef<HTMLDivElement | null>(null);
    
    const scrollToBottom = () => {
        friendsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [Friends]);

    return (
        <>
            <h1>Friends</h1>
            <h2>Add a friend</h2>
            <input type="text" placeholder="Enter your friend's username" onKeyUp={handleInputChange}/><br />
            <button onClick={addFriend}> + Add Friend</button><br />
            {status}
            <h2>Your Friends</h2>
            <div className="messages scrollable">
                {friends
                .filter(friend => friend.id !== undefined)
                .map(friend => (
                    <p key={friend.id}>
                        <strong><UserName userId1={friend.user_1} userId2={friend.user_2} /></strong> {friend.status}
                    </p>
                ))}
                <div ref={friendsEndRef}/>
            </div>
        </>
    )
}

export default Friends