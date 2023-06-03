import { io } from 'socket.io-client'
import { Ball } from './ball'
import { PlayableCharacter } from './playableCharacter'
import { NonPlayableCharacter } from './nonPlayableCharacter'
import * as THREE from 'three'
import { socket } from '../socket'

export class GameClient {
    socket
    ballMap
    playerMap
    setupScene
    gameState
    renderer
    setupSceneArgs

    constructor({
        setupScene: setupScene,
        setupSceneArgs: setupSceneArgs,
        gameState: gameState,
    }) {
        this.ballMap = new Map()
        this.playerMap = new Map()

        this.setupScene = setupScene
        this.setupSceneArgs = setupSceneArgs
        this.gameState = gameState
    }

    setup() {
        // receive a message from the server
        socket.on('init', (data) => {
            const packet = JSON.parse(data)

            this.setupScene(
                packet.ballMap,
                packet.playerMap,
                this,
                this.gameState,
                this.setupSceneArgs
            )

            console.log('Completed init')
            console.log(packet)
        })

        // receive a message from the server
        socket.on('updatePlayer', (data) => {
            const packet = JSON.parse(data)

            this.handleUpdatePlayer(packet)
        })

        // receive a message from the server
        socket.on('updateBall', (data) => {
            const packet = JSON.parse(data)

            this.handleUpdateBall(packet)
        })
    }

    updatePlayer(position) {
        socket.emit(
            'updatePlayer',
            JSON.stringify({
                position: position,
            })
        )
    }

    updateBall(uuid, position, vel) {
        socket.emit(
            'updateBall',
            JSON.stringify({
                uuid: uuid,
                position: position,
                vel: vel,
            })
        )
    }

    handleUpdateBall(ballFromSrvr) {
        const ball = this.gameState.ballMap.get(ballFromSrvr.uuid)
        ball.updateBallFromGameClient(ballFromSrvr.position, ballFromSrvr.vel)
    }

    handleUpdatePlayer(playerFromSrvr) {
        const player = this.gameState.playerMap.get(playerFromSrvr.uuid)
        player.updatePlayerFromGameClient(playerFromSrvr.position)
    }
}
