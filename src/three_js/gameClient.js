import { io } from 'socket.io-client'
import { Ball } from './ball'
import { PlayableCharacter } from './playableCharacter'
import { NonPlayableCharacter } from './nonPlayableCharacter'
import * as THREE from 'three'

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
        this.socket = io('http://localhost:4000/')
        this.ballMap = new Map()
        this.playerMap = new Map()

        this.setupScene = setupScene
        this.setupSceneArgs = setupSceneArgs
        this.gameState = gameState

        console.log(gameState)
    }

    setup() {
        console.log('2')

        this.socket.addEventListener('open', () => {
            // send a message to the server
            this.socket.send(
                JSON.stringify({
                    type: 'hello from client',
                    content: [3, '4'],
                })
            )
        })

        // receive a message from the server
        this.socket.addEventListener('message', (data) => {
            const packet = JSON.parse(data)

            switch (packet.type) {
                case 'updatePlayer':
                    this.handleUpdatePlayer(packet.content)
                    break
                case 'updateBall':
                    this.handleUpdateBall(packet.content)
                    break
                case 'init':
                    this.setupScene(
                        packet.content.ballMap,
                        packet.content.playerMap,
                        this,
                        this.gameState,
                        this.setupSceneArgs
                    )
                    break
            }
        })
    }

    updatePlayer(position) {
        console.log('Sent updatePlayer')
        this.socket.send(
            JSON.stringify({
                type: 'updatePlayer',
                content: {
                    position: position,
                },
            })
        )
    }

    updateBall(uuid, position, vel) {
        this.socket.send(
            JSON.stringify({
                type: 'updateBall',
                content: {
                    uuid: uuid,
                    position: position,
                    vel: vel,
                },
            })
        )
    }

    handleUpdateBall(ballFromSrvr) {
        const ball = this.gameState.ballMap.get(ballFromSrvr.uuid)
        ball.updateBallFromGameClient(ballFromSrvr.position, ballFromSrvr.vel)
    }

    handleUpdatePlayer(playerFromSrvr) {
        console.log(
            'handleUpdatePlayer',
            playerFromSrvr,
            this.gameState,
            playerFromSrvr.uuid
        )
        const player = this.gameState.playerMap.get(playerFromSrvr.uuid)
        player.updatePlayerFromGameClient(playerFromSrvr.position)
    }
}
