import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Friends from './pages/Friends';
import Cluster from './pages/Clusters';
import ClusterChat from './pages/ClusterChat';
import Header from './pages/Header';
import About from './pages/About';
import Profile from './pages/Profile';

function App() {
    return (
        <>
            <BrowserRouter>
                <Header /> 
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/clusters" element={<Cluster />} />
                    <Route path="/chat-clusters" element={<ClusterChat />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default App
