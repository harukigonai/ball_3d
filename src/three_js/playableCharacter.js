import * as THREE from 'three'
import { A, D, DIRECTIONS, S, SHIFT, W, SPACE } from './utils'
import { g } from './ball'
import { player_height, player_radius } from './nonPlayableCharacter'
import { court_length, court_width } from './ground'
import walking_mp3 from './sounds/walking.mp3'
import running_mp3 from './sounds/running.mp3'

const dt = 0.015
export const eyeLevel = 1.7

export class PlayableCharacter {
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

    live

    playerMap

    constructor({
        orbitControl,
        camera,
        gameClient,
        team,
        playerMap,
        listener,
    }) {
        this.orbitControl = orbitControl
        this.camera = camera
        this.gameClient = gameClient
        this.keysPressed = {}

        this.team = team

        this.live = true

        this.playerMap = playerMap
        this.listener = listener

        this.walking_sound = new THREE.Audio(this.listener)
        const audioLoader = new THREE.AudioLoader()
        audioLoader.load(walking_mp3, (buffer) => {
            this.walking_sound.setBuffer(buffer)
        })

        this.running_sound = new THREE.Audio(this.listener)
        audioLoader.load(running_mp3, (buffer) => {
            this.running_sound.setBuffer(buffer)
        })
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

    collidePlayer() {
        this.playerMap.forEach((player, _) => {
            if (player !== this && player.live && this.live) {
                const thisPosXZ = new THREE.Vector3(
                    this.camera.position.x,
                    0,
                    this.camera.position.z
                )
                const playerPosXZ = new THREE.Vector3(
                    player.mesh.position.x,
                    0,
                    player.mesh.position.z
                )

                const distToPlayer = thisPosXZ.distanceTo(playerPosXZ)
                if (distToPlayer <= 2 * player_radius) {
                    const towardPlayerNorm = playerPosXZ
                        .clone()
                        .sub(thisPosXZ)
                        .normalize()
                    const velTowardPlayer = this.vel
                        .clone()
                        .projectOnVector(towardPlayerNorm)
                    if (towardPlayerNorm.dot(velTowardPlayer) > 0) {
                        this.vel = this.vel.clone().sub(velTowardPlayer)
                    }
                }
            }
        })
    }

    update(delta, ballMap) {
        const directionPressed = DIRECTIONS.some(
            (key) => this.keysPressed[key] === true
        )

        let play = ''
        if (directionPressed && this.keysPressed[SHIFT]) {
            play = 'Run'
        } else if (directionPressed) {
            play = 'Walk'
        } else {
            play = 'Idle'
        }

        if (this.live) {
            if (this.mousePressed) {
                if (this.ballGrabbed) {
                    this.dragBallToCamera()
                } else {
                    this.tryGrabBall(ballMap)
                }
            } else if (this.ballGrabbed) {
                this.throwBall()

                this.ballGrabbed.grabbed = false
                this.ballGrabbed = null
            }
        } else if (this.ballGrabbed) {
            this.ballGrabbed.grabbed = false
            this.ballGrabbed = null
        }

        if (this.currentAction !== play) this.currentAction = play

        const acc = new THREE.Vector3()

        if (this.camera.position.y <= eyeLevel) this.vel.y = 0

        if (this.camera.position.y > eyeLevel) {
            acc.y = -g
            this.vel.add(acc.clone().multiplyScalar(dt))
            this.updateCameraTarget(true)
            if (this.walking_sound.isPlaying) this.walking_sound.stop()
            if (this.running_sound.isPlaying) this.running_sound.stop()
        } else if (this.currentAction === 'Idle') {
            this.vel = new THREE.Vector3()
            if (this.keysPressed[SPACE]) {
                this.vel.y = this.jumpSpeed
                this.updateCameraTarget(true)
            } else {
                this.updateCameraTarget(false)
            }
            if (this.walking_sound.isPlaying) this.walking_sound.stop()
            if (this.running_sound.isPlaying) this.running_sound.stop()
        } else {
            if (this.currentAction === 'Run' || this.currentAction === 'Walk') {
                // diagonal movement angle offset
                let directionOffset = this.directionOffset(this.keysPressed)

                // calculate direction
                this.camera.getWorldDirection(this.walkDirection)
                this.walkDirection.y = 0
                this.walkDirection.normalize()
                this.walkDirection.applyAxisAngle(
                    this.rotateAngle,
                    directionOffset
                )

                // run/walk velocity
                let speed
                if (this.currentAction === 'Run') {
                    speed = this.runSpeed
                    if (this.walking_sound.isPlaying) this.walking_sound.stop()
                    if (!this.running_sound.isPlaying) this.running_sound.play()
                } else {
                    speed = this.walkSpeed
                    if (this.running_sound.isPlaying) this.running_sound.stop()
                    if (!this.walking_sound.isPlaying) this.walking_sound.play()
                }

                // move model & camera
                this.vel.x = this.walkDirection.x * speed
                this.vel.z = this.walkDirection.z * speed

                this.collidePlayer()
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

        if (this.camera.position.x > court_width / 2 - player_radius)
            this.camera.position.x = court_width / 2 - player_radius
        else if (this.camera.position.x < -court_width / 2 + player_radius)
            this.camera.position.x = -court_width / 2 + player_radius

        if (this.live) {
            if (this.team === 'red') {
                // Red can walk around in z: [-court_length / 2, 0]
                if (this.camera.position.z > 0 - player_radius)
                    this.camera.position.z = 0 - player_radius
                else if (
                    this.camera.position.z <
                    -court_length / 2 + player_radius
                )
                    this.camera.position.z = -court_length / 2 + player_radius
            } else if (this.team === 'blue') {
                // Red can walk around in z: [0, court_length / 2]
                if (this.camera.position.z < 0 + player_radius)
                    this.camera.position.z = 0 + player_radius
                else if (
                    this.camera.position.z >
                    court_length / 2 - player_radius
                )
                    this.camera.position.z = court_length / 2 - player_radius
            }
        } else if (this.camera.position.z < -court_length / 2 + player_radius)
            this.camera.position.z = -court_length / 2 + player_radius
        else if (this.camera.position.z > court_length / 2 - player_radius)
            this.camera.position.z = court_length / 2 - player_radius

        if (sentUpdate && this.gameClient && this.live) {
            this.gameClient.updatePlayer(
                this.camera.position
                    .clone()
                    .add(
                        new THREE.Vector3(0, -eyeLevel + player_height / 2, 0)
                    ),
                this.vel,
                this.live
            )
        }
    }

    directionOffset() {
        let directionOffset = 0 // w

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
        newVel.multiplyScalar(30)

        if (this.whichMousePressed === 3) {
            this.ballGrabbed.ang_vel = new THREE.Vector3(
                0,
                7.5,
                0
            ).applyQuaternion(this.ballGrabbed.mesh.quaternion)
            const ballUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
                this.ballGrabbed.mesh.quaternion
            )

            this.ballGrabbed.vel = newVel
                .clone()
                .applyAxisAngle(ballUp, -Math.PI / 6)
        } else {
            this.ballGrabbed.vel = newVel
        }

        this.ballGrabbed.live = true

        this.gameClient.updateBall(
            this.ballGrabbed.uuid,
            this.ballGrabbed.mesh.position,
            this.ballGrabbed.mesh.quaternion,
            this.ballGrabbed.vel,
            this.ballGrabbed.ang_vel,
            this.ballGrabbed.live
        )
    }

    dragBallToCamera() {
        const newBallPos = new THREE.Vector3()
        this.camera.getWorldDirection(newBallPos)
        newBallPos.multiplyScalar(player_height / 2 + this.ballGrabbed.r + 0.5)
        newBallPos.add(this.camera.position)

        this.ballGrabbed.dragBallToPosition(newBallPos)

        const ballQuaternion = new THREE.Quaternion()
        this.camera.getWorldQuaternion(ballQuaternion)
        this.ballGrabbed.mesh.setRotationFromQuaternion(ballQuaternion)

        this.ballGrabbed.vel = new THREE.Vector3()
        this.ballGrabbed.ang_vel = new THREE.Vector3()

        this.gameClient.updateBall(
            this.ballGrabbed.uuid,
            this.ballGrabbed.mesh.position,
            this.ballGrabbed.mesh.quaternion,
            this.ballGrabbed.vel,
            this.ballGrabbed.ang_vel,
            this.ballGrabbed.live
        )
    }

    tryGrabBall(ballMap) {
        const worldDirection = new THREE.Vector3()
        this.camera.getWorldDirection(worldDirection)

        for (const [, ball] of ballMap) {
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
