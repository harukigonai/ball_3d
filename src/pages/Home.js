import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <div className="home-background">
            <div className="home-title-and-enter">
                <p className="home-title">Ball 3D</p>
                <div className="home-button-wrapper">
                    <Link to="/enter-name" className="home-button">
                        <p className="home-button-text">Enter</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}
