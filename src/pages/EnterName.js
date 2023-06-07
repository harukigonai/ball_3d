import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { socket } from '../socket.js'

export default function EnterName({
    username,
    setUsername,
    gameOnGoing,
    catchInGameWanderer,
}) {
    const onChangeInput = (e) => setUsername(e.target.value)
    const onClickButton = (e) =>
        socket.emit('enter-name', JSON.stringify({ username }))
    const navigate = useNavigate()

    useEffect(() => {
        if (gameOnGoing) navigate('/')
    }, [gameOnGoing, navigate])

    useEffect(() => {
        catchInGameWanderer()
    }, [catchInGameWanderer])

    return (
        <div className="home-background">
            <div className="enter-name-input-and-button">
                <input
                    className="enter-name-input"
                    placeholder="username"
                    onChange={onChangeInput}
                    defaultValue={username}
                />
                <div className="enter-name-button-wrapper">
                    <Link
                        to="/team-selection"
                        className={`enter-name-button ${
                            username === '' ? 'enter-name-button-disabled' : ''
                        }`}
                        onClick={onClickButton}
                    >
                        <p className="home-button-text">Next</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}
