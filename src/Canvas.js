import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { Sky } from './three_js/sky'
import { GameClient } from './three_js/gameClient'
import { Ball } from './three_js/ball'
import { PlayableCharacter } from './three_js/playableCharacter'
import { NonPlayableCharacter } from './three_js/nonPlayableCharacter'
import { Ground } from './three_js/ground'
import { GameState } from './three_js/gameState'

export default class Canvas {
    canvasRef
    gameState
    renderer

    constructor(canvasRef) {
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

        console.log('uhh')

        // this.scene = new THREE.Scene()
        // this.renderer = new THREE.WebGLRenderer({
        //     canvas: canvasRef,
        //     antialias: false,
        // })
        // this.renderer.setSize(window.innerWidth, window.innerHeight)
        // this.renderer.setPixelRatio(window.devicePixelRatio)
        // this.renderer.shadowMap.enabled = true

        // // Create meshes, materials, etc.
        // // this.scene.add(myNewMesh)

        // this.update()

        this.connectToGameServer()
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
            renderer.setSize(window.innerWidth, window.innerHeight)
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

        gameState.ballMap = constructBallMap(ballMapData, gameClient)
        gameState.playerMap = constructPlayerMap(
            playerMapData,
            orbitControls,
            camera,
            gameClient
        )

        // Setup scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xa8def0)

        gameState.ballMap.forEach((ball, _) => ball.addMeshToScene(scene))

        gameState.playerMap.forEach((player, _) => {
            if (player instanceof NonPlayableCharacter)
                player.addMeshToScene(scene)
            else if (player instanceof PlayableCharacter)
                player.addKeyEventListeners()
        })

        const ground = new Ground()
        ground.addMeshToScene(scene)

        const sky = new Sky(scene)
        sky.addMeshToScene(scene)

        const clock = new THREE.Clock()
        const animate = () => {
            let mixerUpdateDelta = clock.getDelta()

            gameState.ballMap.forEach((ball, _) =>
                ball.update(gameState.ballMap)
            )

            gameState.playerMap.forEach((player, _) => {
                if (player instanceof PlayableCharacter)
                    player.update(
                        mixerUpdateDelta,
                        mousePressed,
                        gameState.ballMap
                    )
            })

            if (sky) sky.update()

            renderer.render(scene, camera)

            requestAnimationFrame(animate)
        }

        animate()
    }

    constructBallMap(ballMapFromSrvr, gameClient) {
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
                })
            )
        })
        return ballMap
    }

    constructPlayerMap(playerMapFromSrvr, orbitControls, camera, gameClient) {
        const map = new Map(Object.entries(playerMapFromSrvr))
        const playerMap = new Map()
        map.forEach(
            ({ playable: playable, position: position, uuid: uuid }, _) => {
                if (playable)
                    playerMap.set(
                        uuid,
                        new PlayableCharacter({
                            orbitControls: orbitControls,
                            camera: camera,
                            gameClient: gameClient,
                        })
                    )
                else
                    playerMap.set(
                        uuid,
                        new NonPlayableCharacter({
                            position: new THREE.Vector3(
                                position.x,
                                position.y,
                                position.z
                            ),
                            uuid: uuid,
                            gameClient: gameClient,
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
        })
        this.gameClient.setup()
    }

    // ******************* PUBLIC EVENTS ******************* //
    updateValue(value) {
        // Whatever you need to do with React props
    }

    onMouseMove() {
        // Mouse moves
    }

    onWindowResize(vpW, vpH) {
        this.renderer.setSize(vpW, vpH)
    }

    // // ******************* RENDER LOOP ******************* //
    // update(t) {
    //     this.renderer.render(this.scene, this.camera)

    //     requestAnimationFrame(this.update.bind(this))
    // }
}
