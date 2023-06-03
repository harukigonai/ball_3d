import React, { Component, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { socket } from '../socket.js'
import { ReactComponent as GreenCheckmark } from '../svgs/green_checkmark.svg'
import { useNavigate } from 'react-router-dom'

export default function TeamSelection() {
    const [redTeam, setRedTeam] = useState([])
    const [blueTeam, setBlueTeam] = useState([])
    const [unselectedTeam, setUnselectedTeam] = useState([])

    const [ready, setReady] = useState(false)

    const [isConnected, setIsConnected] = useState(socket.connected)

    const navigate = useNavigate()

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

        const teamSelectionInfo = (data) => {
            console.log('Receiving team-selection-info')
            console.log(data)

            const packet = JSON.parse(data)

            setRedTeam(packet.redTeam)
            setBlueTeam(packet.blueTeam)
            setUnselectedTeam(packet.unselectedTeam)
        }

        const startGame = () => {
            console.log('Received start-game')
            navigate('/play')
        }

        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)
        socket.on('team-selection-info', teamSelectionInfo)
        socket.on('start-game', startGame)

        socket.emit('request-team-selection-info', {})

        return () => {
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
        }
    }, [])

    const selectRedTeam = () => {
        socket.emit('select-team', JSON.stringify({ team: 'red' }))
        setReady(false)
    }
    const selectBlueTeam = () => {
        socket.emit('select-team', JSON.stringify({ team: 'blue' }))
        setReady(false)
    }

    const confirm = () => {
        socket.emit('confirm-ready', JSON.stringify({ ready: !ready }))
        setReady(!ready)
    }

    return (
        <div className="home-background">
            <div className="team-selection-content">
                {unselectedTeam.length != 0 ? (
                    <p className="team-selection-message">{`${unselectedTeam.length} player(s) have not chosen a team.`}</p>
                ) : (
                    <></>
                )}
                <div className="team-selection-columns">
                    <div className="team-selection-column">
                        <button
                            className="team-selection-red-team-button"
                            onClick={selectRedTeam}
                        >
                            Red Team
                        </button>
                        {redTeam.map(({ username: username, ready: ready }) => (
                            <div className="team-selection-username">
                                {username}
                                {ready ? (
                                    <GreenCheckmark className="team-selection-user-ready" />
                                ) : (
                                    <></>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="team-selection-column">
                        <button
                            className="team-selection-blue-team-button"
                            onClick={selectBlueTeam}
                        >
                            Blue Team
                        </button>
                        {blueTeam.map(
                            ({ username: username, ready: ready }) => (
                                <div className="team-selection-username">
                                    {username}
                                    {ready && (
                                        <GreenCheckmark className="team-selection-user-ready" />
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
            <button className="team-selection-confirm-button" onClick={confirm}>
                <div className="team-selection-confirm-button-content">
                    {ready ? (
                        <>
                            <p>Confirmed</p>
                            <GreenCheckmark />
                        </>
                    ) : (
                        <p>Confirm</p>
                    )}
                </div>
            </button>
        </div>
    )
}
