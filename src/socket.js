import { io } from 'socket.io-client'

const URL =
    process.env.NODE_ENV === 'production'
        ? 'https://ball-3d-server.herokuapp.com'
        : 'http://localhost:4000'

export const socket = io(URL)
