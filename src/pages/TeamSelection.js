import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket.js'
import { ReactComponent as GreenCheckmark } from '../svgs/green_checkmark.svg'

export default function TeamSelection({
    ready,
    setReady,
    setTeam,
    gameOnGoing,
    username,
    catchInGameWanderer,
}) {
    const [redTeam, setRedTeam] = useState([])
    const [blueTeam, setBlueTeam] = useState([])
    const [unselectedTeam, setUnselectedTeam] = useState([])

    const navigate = useNavigate()

    useEffect(() => {
        catchInGameWanderer()
    }, [catchInGameWanderer])

    useEffect(() => {
        if (gameOnGoing) navigate('/')
    }, [gameOnGoing, navigate])

    useEffect(() => {
        if (username === '') navigate('/')
    }, [username, navigate])

    useEffect(() => {
        const teamSelectionInfo = (data) => {
            const packet = JSON.parse(data)

            setRedTeam(packet.redTeam)
            setBlueTeam(packet.blueTeam)
            setUnselectedTeam(packet.unselectedTeam)
        }

        socket.on('team-selection-info', teamSelectionInfo)

        socket.emit('request-team-selection-info', {})

        return () => {
            socket.off('team-selection-info', teamSelectionInfo)
        }
    }, [navigate])

    const selectRedTeam = () => {
        socket.emit('select-team', JSON.stringify({ team: 'red' }))
        setReady(false)
        setTeam('red')
    }
    const selectBlueTeam = () => {
        socket.emit('select-team', JSON.stringify({ team: 'blue' }))
        setReady(false)
        setTeam('blue')
    }

    const confirm = () => {
        socket.emit('confirm-ready', JSON.stringify({ ready: !ready }))
        setReady(!ready)
    }

    return (
        <div className="home-background">
            <div className="team-selection-content">
                {unselectedTeam.length !== 0 ? (
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
                        {redTeam.map(({ username, ready }) => (
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
                        {blueTeam.map(({ username, ready }) => (
                            <div className="team-selection-username">
                                {username}
                                {ready && (
                                    <GreenCheckmark className="team-selection-user-ready" />
                                )}
                            </div>
                        ))}
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
