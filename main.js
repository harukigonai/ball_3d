import { Character } from './character'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { Sky } from './sky'
import { GameClient } from './gameClient'
import { Ground } from './ground'

const setupScene = (ballMap, playerMap) => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xa8def0)

    ballMap.forEach((ball, _) => {
        ball.addMeshToScene(scene)
    })

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true

    document.body.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(0, 1.7, 5)
    addResizeEventListener(camera, renderer)

    // CONTROLS
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

    const ground = new Ground()
    ground.addMeshToScene(scene)

    const sky = new Sky(scene)
    sky.addMeshToScene(scene)

    const character = new Character(orbitControls, camera, gameClient, scene)
    character.addKeyEventListeners()

    const clock = new THREE.Clock()
    const animate = () => {
        let mixerUpdateDelta = clock.getDelta()
        if (character) character.update(mixerUpdateDelta, mousePressed, ballMap)

        ballMap.forEach((ball, _) => ball.update(ballMap))

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

const gameClient = new GameClient({
    setupScene: setupScene,
})
gameClient.setup()
