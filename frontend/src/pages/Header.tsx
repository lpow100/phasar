import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getUser } from "../../../cookie-funcs";
import './Header.css';

function Header() {
    const [navigation, setNavigation] = useState(<></>)

    const getNav = () => {
        getUser().then((user_id) => {
            if (!user_id) {
                setNavigation(
                    <nav>
                        <NavLink to="/about" >About</NavLink> | <NavLink to="/register" >Register</NavLink> | <NavLink to="/login" >Login</NavLink> 
                    </nav>
                );
            } else {
                setNavigation(
                    <nav>
                        <NavLink to="/about" >About</NavLink> | <NavLink to="/friends" >Friends</NavLink> | <NavLink to="/clusters" >Clusters</NavLink> 
                    </nav>
                );
            }
        })
    }

    useEffect(() => {
        getNav();
    }, []);
    
    return (
        <header className="header">
            <h1><NavLink style={{color: "#FFFFFF"}} to="/" >Rigel</NavLink></h1>
            {navigation}
        </header>
    )
}

export default Header;