import { io } from 'socket.io-client'
import { Ball } from './ball'
import * as THREE from 'three'

export class GameClient {
    socket
    ballMap
    playerMap
    setupScene

    constructor({ setupScene: setupScene }) {
        this.socket = io('http://localhost:3000/')
        this.ballMap = new Map()
        this.playerMap = new Map()
        this.setupScene = setupScene
    }

    setup() {
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
                    // ...
                    break
                case 'updateBall':
                    this.handleUpdateBall(packet.content)
                    break
                case 'initBallMap':
                    this.handleInitBallMap(packet.content)

                    this.setupScene(this.ballMap, this.playerMap)
                    break
            }
        })
    }

    updatePlayer(position) {
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

    handleInitBallMap(ballMapFromSrvr) {
        const map = new Map(Object.entries(ballMapFromSrvr))
        map.forEach((ball, uuid) => {
            this.ballMap.set(
                uuid,
                new Ball({
                    position: new THREE.Vector3(
                        ball.position.x,
                        ball.position.y,
                        ball.position.z
                    ),
                    vel: new THREE.Vector3(ball.vel.x, ball.vel.y, ball.vel.z),
                    uuid: ball.uuid,
                    gameClient: this,
                })
            )
        })
    }

    handleInitPlayerMap() {}

    handleUpdateBall(ballFromSrvr) {
        const ball = this.ballMap.get(ballFromSrvr.uuid.toString())

        ball.mesh.position.set(
            ballFromSrvr.position.x,
            ballFromSrvr.position.y,
            ballFromSrvr.position.z
        )
        ball.vel = new THREE.Vector3(
            ballFromSrvr.vel.x,
            ballFromSrvr.vel.y,
            ballFromSrvr.vel.z
        )
        // console.log(ball)
    }

    handleUpdatePlayer() {}
}
