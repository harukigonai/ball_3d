import { KeyDisplay } from './utils'
import { CharacterControls } from './characterControls'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Ball } from './ball'
import { Sun } from './sun'
import { GameClient } from './gameClient'

// SCENE
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xa8def0)

const ballMap = new Map()

const setupScene = () => {
    for (let i = 0; i < 10000; i++) {}
    console.log(ballMap.length)

    for (let [_, ball] of ballMap) {
        const ballMesh = ball.mesh
        scene.add(ballMesh)

        console.log(ballMesh)
    }

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )

    camera.position.y = 1.7
    camera.position.z = 5
    camera.position.x = 0

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true

    // CONTROLS
    const orbitControls = new PointerLockControls(camera, renderer.domElement)
    // orbitControls.enableDamping = true
    // orbitControls.minDistance = 5
    // orbitControls.maxDistance = 15
    // orbitControls.enablePan = false
    // orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
    // orbitControls.update()
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

    // LIGHTS
    light()

    // FLOOR
    generateFloor()

    const sun = new Sun(scene)
    const sunMesh = sun.returnMesh()
    scene.add(sunMesh)

    // MODEL WITH ANIMATIONS
    var characterControls
    new GLTFLoader().load('models/Soldier.glb', function (gltf) {
        const model = gltf.scene
        model.traverse(function (object) {
            if (object.isMesh) object.castShadow = true
        })
        // scene.add(model)

        const gltfAnimations = gltf.animations
        const mixer = new THREE.AnimationMixer(model)
        const animationsMap = new Map()
        gltfAnimations
            .filter((a) => a.name != 'TPose')
            .forEach((a) => {
                animationsMap.set(a.name, mixer.clipAction(a))
            })

        characterControls = new CharacterControls(
            model,
            mixer,
            animationsMap,
            orbitControls,
            camera,
            'Idle',
            gameClient
        )
    })

    // CONTROL KEYS
    const keysPressed = {}
    const keyDisplayQueue = new KeyDisplay()
    document.addEventListener(
        'keydown',
        (event) => {
            keyDisplayQueue.down(event.key)
            if (event.shiftKey && characterControls) {
                characterControls.switchRunToggle()
            } else {
                keysPressed[event.key.toLowerCase()] = true
            }
        },
        false
    )
    document.addEventListener(
        'keyup',
        (event) => {
            keyDisplayQueue.up(event.key)
            keysPressed[event.key.toLowerCase()] = false
        },
        false
    )

    const clock = new THREE.Clock()
    // ANIMATE
    function animate() {
        let mixerUpdateDelta = clock.getDelta()
        if (characterControls) {
            characterControls.update(
                mixerUpdateDelta,
                keysPressed,
                mousePressed,
                ballMap
            )
        }

        ballMap.forEach((ball, _) => {
            ball.update(ballMap)
        })

        if (sun) {
            sun.update()
        }

        // orbitControls.update()
        renderer.render(scene, camera)
        requestAnimationFrame(animate)
    }
    document.body.appendChild(renderer.domElement)
    animate()

    // RESIZE HANDLER
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        keyDisplayQueue.updatePosition()
    }
    window.addEventListener('resize', onWindowResize)

    function generateFloor() {
        // TEXTURES
        const textureLoader = new THREE.TextureLoader()
        const grass = textureLoader.load('./textures/grass.jpg')
        grass.wrapS = THREE.RepeatWrapping
        grass.wrapT = THREE.RepeatWrapping
        grass.repeat.set(25, 25)

        const WIDTH = 100
        const LENGTH = 100

        const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512)

        const material = new THREE.MeshLambertMaterial({
            map: grass,
            color: 0xaaaaaa,
            side: THREE.FrontSide,
        })

        const floor = new THREE.Mesh(geometry, material)
        floor.receiveShadow = true
        floor.rotation.x = -Math.PI / 2
        floor.position.y = -0.05
        scene.add(floor)
    }

    function light() {
        // scene.add(new THREE.AmbientLight(0xffffff, 0.7))

        const dirLight = new THREE.DirectionalLight(0xffffff, 1)
        dirLight.position.set(-60, 100, -10)
        dirLight.castShadow = true
        dirLight.shadow.camera.top = 50
        dirLight.shadow.camera.bottom = -50
        dirLight.shadow.camera.left = -50
        dirLight.shadow.camera.right = 50
        dirLight.shadow.camera.near = 0.1
        dirLight.shadow.camera.far = 200
        dirLight.shadow.mapSize.width = 4096
        dirLight.shadow.mapSize.height = 4096
        // scene.add(dirLight)
    }

    // function frisbee() {
    //     const frisbee = new Frisbee()
    //     scene.add(frisbee.returnMesh())
    // }
}

const gameClient = new GameClient({
    ballMap: ballMap,
    setupScene: setupScene,
})
gameClient.setup()
