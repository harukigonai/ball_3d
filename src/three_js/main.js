import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { Sky } from './sky'
import { GameClient } from './gameClient'
import { Ball } from './ball'
import { PlayableCharacter } from './playableCharacter'
import { NonPlayableCharacter } from './nonPlayableCharacter'
import { Ground } from './ground'
import { GameState } from './gameState'

const gameState = new GameState()

const setupScene = (ballMapData, playerMapData, gameClient, gameState) => {
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true

    // Camera
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(0, 1.7, 5)
    addResizeEventListener(camera, renderer)

    document.body.appendChild(renderer.domElement)

    // OrbitControls
    const orbitControls = new PointerLockControls(camera, renderer.domElement)

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

    gameState.ballMap = constructBallMap(ballMapData)
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
        if (player instanceof NonPlayableCharacter) player.addMeshToScene(scene)
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

        gameState.ballMap.forEach((ball, _) => ball.update(gameState.ballMap))

        gameState.playerMap.forEach((player, _) => {
            if (player instanceof PlayableCharacter)
                player.update(mixerUpdateDelta, mousePressed, gameState.ballMap)
        })

        if (sky) sky.update()

        renderer.render(scene, camera)

        requestAnimationFrame(animate)
    }

    animate()
}

const addResizeEventListener = (camera, renderer) =>
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })

const constructBallMap = (ballMapFromSrvr) => {
    const map = new Map(Object.entries(ballMapFromSrvr))
    const ballMap = new Map()
    map.forEach(({ position: position, vel: vel, uuid: uuid }, _) => {
        ballMap.set(
            uuid,
            new Ball({
                position: new THREE.Vector3(position.x, position.y, position.z),
                vel: new THREE.Vector3(vel.x, vel.y, vel.z),
                uuid: uuid,
                gameClient: this,
            })
        )
    })
    return ballMap
}

const constructPlayerMap = (
    playerMapFromSrvr,
    orbitControls,
    camera,
    gameClient
) => {
    const map = new Map(Object.entries(playerMapFromSrvr))
    const playerMap = new Map()
    map.forEach(({ playable: playable, position: position, uuid: uuid }, _) => {
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
                    gameClient: this,
                })
            )
    })
    return playerMap
}

const gameClient = new GameClient({
    setupScene: setupScene,
    gameState: gameState,
})
gameClient.setup()
