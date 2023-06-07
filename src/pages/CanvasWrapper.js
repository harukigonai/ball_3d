import React, { useEffect, useRef, useState } from 'react'
import Canvas from './Canvas'
import { socket } from '../socket'
import { useNavigate } from 'react-router-dom'

export default function CanvasWrapper({ team, exitToHomePage, inGame }) {
    const canvasRef = useRef(false)
    const [result, setResult] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        if (!inGame) navigate('/')
    })

    useEffect(() => {
        // Get canvas, pass to custom class
        new Canvas(canvasRef.current, setResult, exitToHomePage)

        socket.emit('ready-to-start-game', '')

        return () => {}
    }, [exitToHomePage])

    return (
        <div className="canvas-container">
            <div className="my-team" style={{ backgroundColor: team }} />
            <p className="game-result">{result}</p>
            <canvas ref={canvasRef} />
        </div>
    )
}
