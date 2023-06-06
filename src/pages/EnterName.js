import React, { Component, useEffect, useState } from 'react'
import { socket } from '../socket.js'
import { Link } from 'react-router-dom'

export default function EnterName({ username, setUsername }) {
    const onChangeInput = (e) => setUsername(e.target.value)
    const onClickButton = (e) =>
        socket.emit('enter-name', JSON.stringify({ username: username }))

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
