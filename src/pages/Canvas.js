import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { Sky } from '../three_js/sky'
import { GameClient } from '../three_js/gameClient'
import { Ball } from '../three_js/ball'
import { PlayableCharacter } from '../three_js/playableCharacter'
import {
    NonPlayableCharacter,
    player_height,
} from '../three_js/nonPlayableCharacter'
import { Ground } from '../three_js/ground'
import { GameState } from '../three_js/gameState'
import { eyeLevel } from '../three_js/playableCharacter'

export default class Canvas {
    canvasRef
    gameState
    renderer

    constructor(canvasRef, setResult, exitToHomePage) {
        this.canvasRef = canvasRef
        console.log(this.canvasRef)
        this.gameState = new GameState()

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasRef,
            antialias: true,
        })
        console.log(window.innerWidth, window.innerHeight)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.shadowMap.enabled = true

        this.setResult = setResult
        this.exitToHomePage = exitToHomePage
        this.connectToGameServer()
    }

    onWindowResize(vpW, vpH) {
        console.log(vpW, vpH)
        this.renderer.setSize(vpW, vpH)
        // this.canvasRef.style.width = vpW
        // this.canvasRef.style.height = vpH
        // console.log(this.canvasRef.style)
    }

    setupScene(
        ballMapData,
        playerMapData,
        gameClient,
        gameState,
        {
            renderer: renderer,
            constructBallMap: constructBallMap,
            constructPlayerMap: constructPlayerMap,
        }
    ) {
        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        camera.position.set(0, 1.7, 5)

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()

            // console.log(renderer.domElement.width)
            // renderer.setSize(window.innerWidth, window.innerHeight)
        })

        // OrbitControls
        const orbitControls = new PointerLockControls(
            camera,
            renderer.domElement
        )

        renderer.domElement.addEventListener('click', function () {
            orbitControls.lock()
        })

        let mousePressed = false
        renderer.domElement.addEventListener('pointerdown', function () {
            mousePressed = true
        })
        renderer.domElement.addEventListener('pointerup', function () {
            mousePressed = false
        })

        // Setup scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xa8def0)

        gameState.ballMap = constructBallMap(ballMapData, gameClient, scene)

        gameState.playerMap = constructPlayerMap(
            playerMapData,
            orbitControls,
            camera,
            gameClient,
            scene
        )

        gameState.ballMap.forEach((ball, _) => ball.addMeshToScene())

        gameState.playerMap.forEach((player, _) => {
            if (player instanceof NonPlayableCharacter) player.addMeshToScene()
            else if (player instanceof PlayableCharacter)
                player.addKeyEventListeners()
        })

        const ground = new Ground({ scene })
        ground.addMeshToScene()

        const sky = new Sky({ scene })
        sky.addMeshToScene()

        const clock = new THREE.Clock()
        const animate = () => {
            let mixerUpdateDelta = clock.getDelta()

            gameState.playerMap.forEach((player, _) => {
                if (player instanceof PlayableCharacter)
                    player.update(
                        mixerUpdateDelta,
                        mousePressed,
                        gameState.ballMap
                    )
            })

            gameState.ballMap.forEach((ball, _) =>
                ball.update(gameState.ballMap, gameState.playerMap)
            )

            if (sky) sky.update()

            renderer.render(scene, camera)

            requestAnimationFrame(animate)
        }

        animate()
    }

    constructBallMap(ballMapFromSrvr, gameClient, scene) {
        const map = new Map(Object.entries(ballMapFromSrvr))
        const ballMap = new Map()

        map.forEach(({ position: position, vel: vel, uuid: uuid }, _) => {
            ballMap.set(
                uuid,
                new Ball({
                    position: new THREE.Vector3(
                        position.x,
                        position.y,
                        position.z
                    ),
                    vel: new THREE.Vector3(vel.x, vel.y, vel.z),
                    uuid: uuid,
                    gameClient: gameClient,
                    scene: scene,
                })
            )
        })

        return ballMap
    }

    constructPlayerMap(
        playerMapFromSrvr,
        orbitControls,
        camera,
        gameClient,
        scene
    ) {
        const map = new Map(Object.entries(playerMapFromSrvr))
        const playerMap = new Map()
        map.forEach(
            (
                {
                    playable: playable,
                    uuid: uuid,
                    position: position,
                    vel: vel,
                    team: team,
                    facing: facing,
                },
                _
            ) => {
                if (playable) {
                    camera.position.x = position.x
                    camera.position.y =
                        position.y - player_height / 2 + eyeLevel
                    camera.position.z = position.z
                    camera.lookAt(
                        new THREE.Vector3(facing.x, facing.y, facing.z).add(
                            camera.position
                        )
                    )

                    playerMap.set(
                        uuid,
                        new PlayableCharacter({
                            orbitControls: orbitControls,
                            camera: camera,
                            gameClient: gameClient,
                            team: team,
                            playerMap: playerMap,
                        })
                    )
                } else
                    playerMap.set(
                        uuid,
                        new NonPlayableCharacter({
                            position: new THREE.Vector3(
                                position.x,
                                position.y,
                                position.z
                            ),
                            uuid: uuid,
                            team: team,
                            scene: scene,
                        })
                    )
            }
        )
        return playerMap
    }

    connectToGameServer() {
        this.gameClient = new GameClient({
            setupScene: this.setupScene,
            setupSceneArgs: {
                renderer: this.renderer,
                constructBallMap: this.constructBallMap,
                constructPlayerMap: this.constructPlayerMap,
            },
            gameState: this.gameState,
            setResult: this.setResult,
            exitToHomePage: this.exitToHomePage,
        })
        this.gameClient.setup()
    }
}
