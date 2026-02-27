import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import ChatRoom from './pages/ChatRoom';
import Home from './pages/Home';

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/chat-room" element={<ChatRoom />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default App
