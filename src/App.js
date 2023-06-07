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

    const [inGame, setInGame] = useState(false)
    const [gameOnGoing, setGameOnGoing] = useState(false)

    const catchInGameWanderer = () => {
        if (inGame) {
            setUsername('')
            setReady(false)
            setTeam('')

            setInGame(false)

            socket.emit('in-game-wanderer', {})

            navigate('/')
        }
    }

    const exitToHomePage = () => {
        navigate('/')

        setUsername('')
        setReady(false)
        setTeam('')

        setGameOnGoing(false)
        setInGame(false)
    }

    useEffect(() => {
        const returnToEnterNameHandler = () => navigate('/enter-name')
        const returnToSelectTeamHandler = () => navigate('/team-selection')
        const gameOnGoingHandler = () => {
            setGameOnGoing(true)

            setUsername('')
            setReady(false)
            setTeam('')

            setGameOnGoing(false)
            setInGame(false)

            navigate('/')
        }
        const gameNotOnGoingHandler = () => {
            setGameOnGoing(false)
            setInGame(false)
        }
        const startGameHandler = () => {
            setGameOnGoing(true)
            setInGame(true)

            navigate('/play')
        }

        socket.on('return-to-enter-name', returnToEnterNameHandler)
        socket.on('return-to-select-team', returnToSelectTeamHandler)

        socket.on('game-on-going', gameOnGoingHandler)
        socket.on('game-not-on-going', gameNotOnGoingHandler)
        socket.on('start-game', startGameHandler)

        return () => {
            socket.off('return-to-enter-name', returnToEnterNameHandler)
            socket.off('return-to-select-team', returnToSelectTeamHandler)

            socket.off('game-on-going', gameOnGoingHandler)
            socket.off('game-not-on-going', gameNotOnGoingHandler)
            socket.off('start-game', startGameHandler)
        }
    }, [inGame, navigate])

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Home
                        gameOnGoing={gameOnGoing}
                        catchInGameWanderer={catchInGameWanderer}
                    />
                }
            />
            <Route
                path="/enter-name"
                element={
                    <EnterName
                        username={username}
                        setUsername={setUsername}
                        gameOnGoing={gameOnGoing}
                        catchInGameWanderer={catchInGameWanderer}
                    />
                }
            />
            <Route
                path="/team-selection"
                element={
                    <TeamSelection
                        ready={ready}
                        setReady={setReady}
                        setTeam={setTeam}
                        gameOnGoing={gameOnGoing}
                        catchInGameWanderer={catchInGameWanderer}
                        username={username}
                    />
                }
            />
            <Route
                path="/play"
                element={
                    <CanvasWrapper
                        team={team}
                        exitToHomePage={exitToHomePage}
                        inGame={inGame}
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
