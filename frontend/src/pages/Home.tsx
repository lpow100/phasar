import { NavLink } from "react-router-dom";

function Home() {
    return (
        <>
            <nav>
                <NavLink to="/register" >Register</NavLink> |  
                <NavLink to="/login" >Login</NavLink>
            </nav>
            <h1>Tachyon - The Chat App</h1>
        </>
    )
}

export default Home