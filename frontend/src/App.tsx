import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Friends from './pages/Friends';
import Cluster from './pages/Clusters';
import ClusterChat from './pages/ClusterChat';

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/clusters" element={<Cluster />} />
                    <Route path="/chat-clusters" element={<ClusterChat />} />

                </Routes>
            </BrowserRouter>
        </>
    )
}

export default App
