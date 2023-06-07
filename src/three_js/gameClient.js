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

    constructor({ setupScene, gameState, setResult, exitToHomePage }) {
        this.ballMap = new Map()
        this.playerMap = new Map()

        this.setupScene = setupScene
        this.gameState = gameState

        this.initDone = false
        this.setResult = setResult
        this.exitToHomePage = exitToHomePage
    }

    initHandler(data) {
        const packet = JSON.parse(data)

        if (!this.initDone) {
            this.initDone = true

            this.setupScene(packet.ballMap, packet.playerMap, this)
        }
    }

    updatePlayerHandler(data) {
        const packet = JSON.parse(data)
        this.handleUpdatePlayer(packet)
    }

    updateBallHandler(data) {
        const packet = JSON.parse(data)

        this.handleUpdateBall(packet)
    }

    gameOverHandler(data) {
        const packet = JSON.parse(data)

        console.log(this.handleGameOver)

        this.handleGameOver(packet)
    }

    setup() {
        socket.on('init', this.initHandler.bind(this))

        socket.on('updatePlayer', this.updatePlayerHandler.bind(this))

        socket.on('updateBall', this.updateBallHandler.bind(this))

        socket.on('game-over', this.gameOverHandler.bind(this))
    }

    destroy() {
        socket.off('init', this.initHandler.bind(this))

        socket.on('updatePlayer', this.updatePlayerHandler.bind(this))

        socket.on('updateBall', this.updateBallHandler.bind(this))

        socket.on('game-over', this.gameOverHandler.bind(this))
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
