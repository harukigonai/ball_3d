import { socket } from '../socket'

export class GameClient {
    socket

    ballMap

    playerMap

    setupScene

    gameState

    renderer

    setupSceneArgs

    initDone

    setResult

    constructor({
        setupScene,
        setupSceneArgs,
        gameState,
        setResult,
        exitToHomePage,
    }) {
        this.ballMap = new Map()
        this.playerMap = new Map()

        this.setupScene = setupScene
        this.setupSceneArgs = setupSceneArgs
        this.gameState = gameState

        this.initDone = false
        this.setResult = setResult
        this.exitToHomePage = exitToHomePage
    }

    setup() {
        // receive a message from the server
        socket.on('init', (data) => {
            const packet = JSON.parse(data)

            if (!this.initDone) {
                this.initDone = true

                this.setupScene(
                    packet.ballMap,
                    packet.playerMap,
                    this,
                    this.gameState,
                    this.setupSceneArgs
                )
            }
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

        socket.on('game-over', (data) => {
            const packet = JSON.parse(data)

            this.handleGameOver(packet)
        })
    }

    updatePlayer(position, live) {
        socket.emit(
            'updatePlayer',
            JSON.stringify({
                position,
                live,
            })
        )
    }

    updateBall(uuid, position, quaternion, vel, ang_vel, live) {
        socket.emit(
            'updateBall',
            JSON.stringify({
                uuid,
                position,
                quaternion,
                vel,
                ang_vel,
                live,
            })
        )
    }

    handleUpdateBall(ballFromSrvr) {
        const ball = this.gameState.ballMap.get(ballFromSrvr.uuid)
        ball.updateBallFromGameClient(
            ballFromSrvr.position,
            ballFromSrvr.quaternion,
            ballFromSrvr.vel,
            ballFromSrvr.ang_vel,
            ballFromSrvr.live
        )
    }

    handleUpdatePlayer(playerFromSrvr) {
        const player = this.gameState.playerMap.get(playerFromSrvr.uuid)
        player.updatePlayerFromGameClient(
            playerFromSrvr.position,
            playerFromSrvr.vel,
            playerFromSrvr.live
        )
    }

    handleGameOver(resultFromServer) {
        const { result } = resultFromServer

        this.setResult(result)

        setTimeout(this.exitToHomePage, 5000)
    }
}
