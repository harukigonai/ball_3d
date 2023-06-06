import './App.css'
import Home from './pages/Home'
import CanvasWrapper from './pages/CanvasWrapper'
import EnterName from './pages/EnterName'
import TeamSelection from './pages/TeamSelection'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { socket } from './socket'

function Root() {
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [ready, setReady] = useState(false)
    const [team, setTeam] = useState('')

    const exitToHomePage = () => {
        navigate('/')

        setUsername('')
        setReady(false)
        setTeam('')
    }

    useEffect(() => {
        socket.on('return-to-enter-name', (data) => navigate('/enter-name'))
        socket.on('return-to-select-team', (data) =>
            navigate('/team-selection')
        )
    }, [navigate])

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route
                path="/enter-name"
                element={
                    <EnterName username={username} setUsername={setUsername} />
                }
            />
            <Route
                path="/team-selection"
                element={
                    <TeamSelection
                        ready={ready}
                        setReady={setReady}
                        setTeam={setTeam}
                    />
                }
            />
            <Route
                path="/play"
                element={
                    <CanvasWrapper
                        team={team}
                        exitToHomePage={exitToHomePage}
                    />
                }
            />
        </Routes>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <Root />
        </BrowserRouter>
    )
}
