import logo from './logo.svg'
import './App.css'
import Home from './Home'
import CanvasWrapper from './CanvasWrapper'
import TeamSelection from './TeamSelection'

import React from 'react'

import { useState } from 'react'

export default function App() {
    const [page, setPage] = useState('home')

    return <div className="app">{page == 'home' && <Home />}</div>
}
