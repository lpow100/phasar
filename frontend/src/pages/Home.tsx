import { NavLink } from "react-router-dom";
import ChatHome from "./ChatHome";
import { getUser } from "../../../cookie-funcs";
import { useEffect, useState } from "react";

function Home() {
    const [navigation, setNavigation] = useState(<></>)

    const getNav = () => {
        getUser().then((user_id) => {
            if (!user_id) {
                setNavigation(
                    <nav>
                        <NavLink to="/register" >Register</NavLink> | <NavLink to="/login" >Login</NavLink>
                    </nav>
                );
            } else {
                setNavigation(
                    <nav>
                        <NavLink to="/friends" >Friends</NavLink> | <NavLink to="/clusters" >Clusters</NavLink>
                    </nav>
                );
            }
        })
    }

    useEffect(() => {
        getNav();
    }, []);

    return (
        <>
            {navigation}
            <h1>Rigel - The Chat App</h1>
            <h2>Chat without a login:</h2>
            <ChatHome />
        </>
    )
}

export default Home