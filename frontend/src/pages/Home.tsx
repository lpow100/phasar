import { NavLink } from "react-router-dom";
import ChatHome from "./ChatHome";
import { getUser } from "../../../cookie-funcs";
import { useEffect, useState } from "react";

function Home() {
    

    return (
        <>
            <h1>Rigel - The Chat App</h1>
            <h2>Chat without a login:</h2>
            <ChatHome />
        </>
    )
}

export default Home