import React, { Component, useEffect, useState } from 'react'
import { socket } from '../socket.js'
import { Link } from 'react-router-dom'

export default function TeamSelection() {
    const [username, setUsername] = useState('')
    const [isConnected, setIsConnected] = useState(socket.connected)

    useEffect(() => {
        function onConnect() {
            setIsConnected(true)

            socket.send(
                JSON.stringify({
                    type: 'hello from client',
                    content: [3, '4'],
                })
            )
        }

        function onDisconnect() {
            setIsConnected(false)
            console.log('disconnected')
        }

        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)

        return () => {
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
        }
    }, [])

    const onChangeInput = (e) => setUsername(e.target.value)
    const onClickButton = (e) => {
        socket.emit('enter-name', JSON.stringify({ username: username }))
        console.log('emitting to socket')
    }

    return (
        <div className="home-background">
            <div className="enter-name-input-and-button">
                <input
                    className="enter-name-input"
                    placeholder="username"
                    onChange={onChangeInput}
                />
                <div className="enter-name-button-wrapper">
                    <Link
                        to="/team-selection"
                        className={
                            'enter-name-button ' +
                            (username == '' ? 'enter-name-button-disabled' : '')
                        }
                        onClick={onClickButton}
                    >
                        <p className="home-button-text">Next</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}
