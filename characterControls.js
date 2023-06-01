import * as THREE from 'three'
import { A, D, DIRECTIONS, S, W } from './utils'

export class CharacterControls {
    model
    mixer
    animationsMap = new Map() // Walk, Run, Idle
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
    runVelocity = 25
    walkVelocity = 2

    ballGrabbed

    gameClient

    constructor(
        model,
        mixer,
        animationsMap,
        orbitControl,
        camera,
        currentAction,
        gameClient
    ) {
        this.model = model
        this.mixer = mixer
        this.animationsMap = animationsMap
        this.currentAction = currentAction
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play()
            }
        })
        this.orbitControl = orbitControl
        this.camera = camera
        this.updateCameraTarget(0, 0)
        this.gameClient = gameClient
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun
    }

    update(delta, keysPressed, mousePressed, ballMap) {
        const directionPressed = DIRECTIONS.some(
            (key) => keysPressed[key] == true
        )

        var play = ''
        if (directionPressed && this.toggleRun) {
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
            const toPlay = this.animationsMap.get(play)
            const current = this.animationsMap.get(this.currentAction)

            current.fadeOut(this.fadeDuration)
            toPlay.reset().fadeIn(this.fadeDuration).play()

            this.currentAction = play
        }

        this.mixer.update(delta)

        if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
            // diagonal movement angle offset
            var directionOffset = this.directionOffset(keysPressed)

            // calculate direction
            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // run/walk velocity
            const velocity =
                this.currentAction == 'Run'
                    ? this.runVelocity
                    : this.walkVelocity

            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta
            this.updateCameraTarget(moveX, moveZ)
        }
    }

    updateCameraTarget(moveX, moveZ) {
        // console.log(this.gameClient)
        // this.gameClient.updatePlayer()
        if (this.gameClient) {
            this.gameClient.updatePlayer(this.camera.position)
        }

        // move camera
        this.camera.position.x += moveX
        this.camera.position.z += moveZ
    }

    directionOffset(keysPressed) {
        var directionOffset = 0 // w

        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 // w+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 // w+d
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2 // s+a
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2 // s+d
            } else {
                directionOffset = Math.PI // s
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2 // a
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2 // d
        }

        return directionOffset
    }

    throwBall() {
        const newVel = new THREE.Vector3()
        this.camera.getWorldDirection(newVel)
        newVel.multiplyScalar(15)
        console.log(newVel)

        this.ballGrabbed.vel = newVel
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
