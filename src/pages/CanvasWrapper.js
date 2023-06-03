import React, { Component, useEffect, useRef } from 'react'
import Canvas from './Canvas'
import { socket } from '../socket'

export default function CanvasWrapper() {
    const canvasRef = useRef(false)

    useEffect(() => {
        // Get canvas, pass to custom class
        let canvas = canvasRef.current
        canvas = new Canvas(canvas)

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
        <div class="canvasContainer">
            <canvas ref={canvasRef} />
        </div>
    )
}
