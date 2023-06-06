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
            console.log('update received', packet)
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

    updatePlayer(position, vel, live) {
        socket.emit(
            'updatePlayer',
            JSON.stringify({
                position,
                vel,
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

    handleUpdateBall({ uuid, position, quaternion, vel, ang_vel, live }) {
        const ball = this.gameState.ballMap.get(uuid)
        ball.updateBallFromGameClient(position, quaternion, vel, ang_vel, live)
    }

    handleUpdatePlayer({ uuid, position, vel, live }) {
        const player = this.gameState.playerMap.get(uuid)
        player.updatePlayerFromGameClient(position, vel, live)
    }

    handleGameOver({ result }) {
        this.setResult(result)

        setTimeout(this.exitToHomePage, 5000)
    }
}
