import React, { Component, useEffect, useRef, useState } from 'react'
import Canvas from './Canvas'
import { socket } from '../socket'

export default function CanvasWrapper({ team, exitToHomePage }) {
    const canvasRef = useRef(false)
    const [result, setResult] = useState('')

    useEffect(() => {
        // Get canvas, pass to custom class
        let canvas = canvasRef.current
        canvas = new Canvas(canvas, setResult, exitToHomePage)

        const handleResize = () => {
            canvas.onWindowResize(window.innerWidth, window.innerHeight)
        }

        // Init any event listeners
        window.addEventListener('resize', handleResize)

        socket.emit('ready-to-start-game', '')

        return () => {
            // Remove any event listeners
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <div className="canvas-container">
            <div className="my-team" style={{ backgroundColor: team }} />
            <p className="game-result">{result}</p>
            <canvas ref={canvasRef} />
        </div>
    )
}
