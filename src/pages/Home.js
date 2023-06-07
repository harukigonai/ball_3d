import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home({ gameOnGoing, catchInGameWanderer }) {
    const navigate = useNavigate()
    const onEnterClick = () => {
        if (!gameOnGoing) navigate('/enter-name')
    }

    useEffect(() => {
        catchInGameWanderer()
    }, [catchInGameWanderer])

    return (
        <div className="home-background">
            <div className="home-title-and-enter">
                <p className="home-title">Ball 3D</p>
                <div className="home-button-wrapper">
                    <button
                        to="/enter-name"
                        className="home-button"
                        onClick={onEnterClick}
                    >
                        <p className="home-button-text">Enter</p>
                    </button>
                </div>
            </div>
        </div>
    )
}
