import logo from './logo.svg'
import './App.css'
import Home from './pages/Home'
import CanvasWrapper from './pages/CanvasWrapper'
import EnterName from './pages/EnterName'
import TeamSelection from './pages/TeamSelection'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React, { useState } from 'react'

export default function App() {
    const [page, setPage] = useState('home')

    const homeButtonOnClick = (e) => {
        setPage('teamSelection')
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/enter-name" element={<EnterName />} />
                <Route path="/team-selection" element={<TeamSelection />} />
                <Route path="/play" element={<CanvasWrapper />} />
            </Routes>
        </BrowserRouter>
    )
}
