import React, { useEffect, useRef, useState } from 'react'
import Canvas from './Canvas'
import { socket } from '../socket'

export default function CanvasWrapper({ team, exitToHomePage }) {
    const canvasRef = useRef(false)
    const [result, setResult] = useState('')

    useEffect(() => {
        // Get canvas, pass to custom class
        let canvas = canvasRef.current
        new Canvas(canvas, setResult, exitToHomePage)

        socket.emit('ready-to-start-game', '')
    }, [exitToHomePage])

    return (
        <div className="canvas-container">
            <div className="my-team" style={{ backgroundColor: team }} />
            <p className="game-result">{result}</p>
            <canvas ref={canvasRef} />
        </div>
    )
}
