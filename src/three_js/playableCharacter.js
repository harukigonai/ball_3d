import * as THREE from 'three'
import { A, D, DIRECTIONS, S, SHIFT, W, SPACE } from './utils'
import { g } from './ball'
import { height } from './nonPlayableCharacter'

const dt = 0.015
const eyeLevel = 1.7

export class PlayableCharacter {
    uuid

    orbitControl
    camera

    // state
    toggleRun = true
    currentAction

    // temporary data
    walkDirection = new THREE.Vector3()
    rotateAngle = new THREE.Vector3(0, 1, 0)
    rotateQuarternion = new THREE.Quaternion()
    cameraTarget = new THREE.Vector3()

    // constants
    fadeDuration = 0.2
    runSpeed = 15
    walkSpeed = 10
    jumpSpeed = 5
    vel = new THREE.Vector3()

    ballGrabbed

    gameClient

    keysPressed

    constructor({
        uuid: uuid,
        orbitControl: orbitControl,
        camera: camera,
        gameClient: gameClient,
    }) {
        this.uuid = uuid
        this.orbitControl = orbitControl
        this.camera = camera
        this.gameClient = gameClient
        this.keysPressed = {}
    }

    addMeshToScene(scene) {
        scene.add(this.mesh)
    }

    addKeyEventListeners() {
        document.addEventListener(
            'keydown',
            (event) => (this.keysPressed[event.key.toLowerCase()] = true),
            false
        )
        document.addEventListener(
            'keyup',
            (event) => (this.keysPressed[event.key.toLowerCase()] = false),
            false
        )
    }

    update(delta, mousePressed, ballMap) {
        const directionPressed = DIRECTIONS.some(
            (key) => this.keysPressed[key] == true
        )

        var play = ''
        if (directionPressed && this.keysPressed[SHIFT]) {
            play = 'Run'
        } else if (directionPressed) {
            play = 'Walk'
        } else {
            play = 'Idle'
        }

        if (mousePressed) {
            if (this.ballGrabbed) {
                this.dragBallToCamera()
            } else {
                this.tryGrabBall(ballMap)
            }
        } else {
            if (this.ballGrabbed) {
                this.throwBall()

                this.ballGrabbed.grabbed = false
                this.ballGrabbed = null
            }
        }

        if (this.currentAction != play) {
            // const toPlay = this.animationsMap.get(play)
            // const current = this.animationsMap.get(this.currentAction)

            // current.fadeOut(this.fadeDuration)
            // toPlay.reset().fadeIn(this.fadeDuration).play()

            this.currentAction = play
        }

        const acc = new THREE.Vector3()

        if (this.camera.position.y <= eyeLevel) this.vel.y = 0

        if (this.camera.position.y > eyeLevel) {
            acc.y = -g
            this.vel.add(acc.clone().multiplyScalar(dt))
            this.updateCameraTarget(true)
        } else if (this.currentAction == 'Idle') {
            this.vel = new THREE.Vector3()
            if (this.keysPressed[SPACE]) {
                this.vel.y = this.jumpSpeed
                this.updateCameraTarget(true)
            } else {
                this.updateCameraTarget(false)
            }
        } else {
            if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
                // diagonal movement angle offset
                var directionOffset = this.directionOffset(this.keysPressed)

                // calculate direction
                this.camera.getWorldDirection(this.walkDirection)
                this.walkDirection.y = 0
                this.walkDirection.normalize()
                this.walkDirection.applyAxisAngle(
                    this.rotateAngle,
                    directionOffset
                )

                // run/walk velocity
                const velocity =
                    this.currentAction == 'Run' ? this.runSpeed : this.walkSpeed

                // move model & camera
                this.vel.x = this.walkDirection.x * velocity
                this.vel.z = this.walkDirection.z * velocity
            }

            if (this.keysPressed[SPACE]) {
                this.vel.y = this.jumpSpeed
            }

            this.vel.add(acc.clone().multiplyScalar(dt))
            this.updateCameraTarget(true)
        }
    }

    updateCameraTarget(sentUpdate) {
        // move camera
        this.camera.position.x += this.vel.x * dt
        this.camera.position.y += this.vel.y * dt
        this.camera.position.z += this.vel.z * dt

        if (sentUpdate && this.gameClient) {
            this.gameClient.updatePlayer(
                this.camera.position
                    .clone()
                    .add(new THREE.Vector3(0, -eyeLevel + height / 2, 0))
            )
        }
    }

    directionOffset() {
        var directionOffset = 0 // w

        if (this.keysPressed[W]) {
            if (this.keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (this.keysPressed[D]) {
                directionOffset = -Math.PI / 4 // w+d
            }
        } else if (this.keysPressed[S]) {
            if (this.keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (this.keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (this.keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (this.keysPressed[D]) {
            directionOffset = -Math.PI / 2 // d
        }

        return directionOffset
    }

    throwBall() {
        const newVel = new THREE.Vector3()
        this.camera.getWorldDirection(newVel)
        newVel.multiplyScalar(15)

        this.ballGrabbed.vel = newVel

        this.gameClient.updateBall(
            this.ballGrabbed.uuid,
            this.ballGrabbed.mesh.position,
            this.ballGrabbed.vel
        )
    }

    dragBallToCamera() {
        const newBallPos = new THREE.Vector3()
        this.camera.getWorldDirection(newBallPos)
        newBallPos.multiplyScalar(2)
        newBallPos.add(this.camera.position)

        this.ballGrabbed.mesh.position.set(
            newBallPos.x,
            newBallPos.y,
            newBallPos.z
        )

        this.gameClient.updateBall(
            this.ballGrabbed.uuid,
            this.ballGrabbed.mesh.position,
            this.ballGrabbed.vel
        )

        this.ballGrabbed.vel = new THREE.Vector3()
        this.ballGrabbed.ang_vel = new THREE.Vector3()
    }

    tryGrabBall(ballMap) {
        const worldDirection = new THREE.Vector3()
        this.camera.getWorldDirection(worldDirection)

        for (let [_, ball] of ballMap) {
            if (this.ballGrabbed) break
            // Distance from camera to ball must be < 2
            const distCameraToBall = ball.mesh.position.distanceTo(
                this.camera.position
            )
            // Angle between cameraDir and camera -> ball must be < 11 deg
            const cameraToBall = ball.mesh.position
                .clone()
                .sub(this.camera.position)
            const angle = cameraToBall.angleTo(worldDirection)

            if (distCameraToBall < 4 && angle < Math.PI / 16) {
                this.ballGrabbed = ball
                this.ballGrabbed.grabbed = true
            }
        }
    }
}
