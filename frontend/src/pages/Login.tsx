import React, { useState } from 'react';
import { setCookieValue } from '../../../cookie-funcs.ts';

function Register() {
    // 1. Create state to hold form data
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [status, setStatus] = useState("");

    // 2. Update state when user types
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                setStatus(data.message);
                setCookieValue("phasar-session-id",data.session_id,60);
            } else {
                const data = await response.json();
                setStatus(data.error);
            }
        } catch (error) {
            console.error('Error connecting to backend:', error);
        }
    }

    return (
        <>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Username:<br/>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                    />
                </label><br/>
                <label>
                    Password:<br/>
                    <input 
                        type="password" 
                        name="password" // Fixed name here (was "username")
                        value={formData.password} 
                        onChange={handleChange} 
                    />
                </label><br/>
                <input type="submit" value="Submit" />
            </form>
            <p>{status}</p>
        </>
    )
}

export default Register;