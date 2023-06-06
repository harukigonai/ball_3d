import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { Sky } from '../three_js/sky'
import { GameClient } from '../three_js/gameClient'
import { Ball } from '../three_js/ball'
import { PlayableCharacter, eyeLevel } from '../three_js/playableCharacter'
import {
    NonPlayableCharacter,
    player_height,
} from '../three_js/nonPlayableCharacter'
import { Ground } from '../three_js/ground'
import { GameState } from '../three_js/gameState'

export default class Canvas {
    canvasRef

    gameState

    renderer

    constructor(canvasRef, setResult, exitToHomePage) {
        this.canvasRef = canvasRef
        this.gameState = new GameState()

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvasRef,
            antialias: true,
        })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.shadowMap.enabled = true

        this.setResult = setResult
        this.exitToHomePage = exitToHomePage
        this.connectToGameServer()
    }

    setupScene(
        ballMapData,
        playerMapData,
        gameClient,
        gameState,
        { renderer, constructBallMap, constructPlayerMap }
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

            renderer.setSize(window.innerWidth, window.innerHeight)
        })

        // OrbitControls
        const orbitControls = new PointerLockControls(
            camera,
            renderer.domElement
        )

        renderer.domElement.addEventListener('click', () => {
            orbitControls.lock()
        })

        // Setup scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xa8def0)

        const listener = new THREE.AudioListener()
        camera.add(listener)

        gameState.ballMap = constructBallMap(
            ballMapData,
            gameClient,
            scene,
            listener
        )

        gameState.playerMap = constructPlayerMap(
            playerMapData,
            orbitControls,
            camera,
            gameClient,
            scene,
            listener
        )

        gameState.ballMap.forEach((ball, _) => ball.addMeshToScene())

        let me
        let meLive = true
        gameState.playerMap.forEach((player, _) => {
            if (player instanceof NonPlayableCharacter) player.addMeshToScene()
            else if (player instanceof PlayableCharacter) {
                player.addKeyEventListeners()
                renderer.domElement.addEventListener('pointerdown', (e) => {
                    player.mousePressed = true
                    player.whichMousePressed = e.which
                })
                renderer.domElement.addEventListener('pointerup', () => {
                    player.mousePressed = false
                })
                me = player
            }
        })

        const ground = new Ground({ scene })
        ground.addMeshToScene()

        const sky = new Sky({ scene })
        sky.addMeshToScene()

        const clock = new THREE.Clock()
        const animate = () => {
            const mixerUpdateDelta = clock.getDelta()

            gameState.playerMap.forEach((player, _) => {
                if (player instanceof PlayableCharacter) {
                    player.update(mixerUpdateDelta, gameState.ballMap)
                }
            })

            gameState.ballMap.forEach((ball, _) =>
                ball.update(gameState.ballMap, gameState.playerMap)
            )

            if (meLive && !me.live) {
                this.setResult('Out')
                meLive = false
            }

            if (sky) sky.update()

            renderer.render(scene, camera)

            requestAnimationFrame(animate)
        }

        animate()
    }

    constructBallMap(ballMapFromSrvr, gameClient, scene, listener) {
        const map = new Map(Object.entries(ballMapFromSrvr))
        const ballMap = new Map()

        map.forEach(({ position, vel, uuid }, _) => {
            ballMap.set(
                uuid,
                new Ball({
                    position: new THREE.Vector3(
                        position.x,
                        position.y,
                        position.z
                    ),
                    vel: new THREE.Vector3(vel.x, vel.y, vel.z),
                    uuid,
                    gameClient,
                    scene,
                    listener,
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
        scene,
        listener
    ) {
        const map = new Map(Object.entries(playerMapFromSrvr))
        const playerMap = new Map()
        map.forEach(
            ({ playable, uuid, position, vel, team, facing, name }, _) => {
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
                            orbitControls,
                            camera,
                            gameClient,
                            team,
                            playerMap,
                            listener,
                        })
                    )
                } else {
                    playerMap.set(
                        uuid,
                        new NonPlayableCharacter({
                            position: new THREE.Vector3(
                                position.x,
                                position.y,
                                position.z
                            ),
                            uuid,
                            team,
                            scene,
                            name,
                        })
                    )
                }
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
