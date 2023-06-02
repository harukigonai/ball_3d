import * as THREE from 'three'
import { A, D, DIRECTIONS, S, SHIFT, W, SPACE } from './utils'
import { g } from './ball'

const dt = 0.015

const radius = 0.5
export const height = 2

export class NonPlayableCharacter {
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
        playable: playable,
        orbitControl: orbitControl,
        camera: camera,
        gameClient: gameClient,
    }) {
        this.uuid = uuid

        const geometry = new THREE.CylinderGeometry(radius, radius, height)
        const material = new THREE.MeshLambertMaterial({
            color: 0xaaaaaa,
            side: THREE.FrontSide,
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(0, 3, 0)
    }

    addMeshToScene(scene) {
        scene.add(this.mesh)
    }

    updatePlayerFromGameClient(position) {
        this.mesh.position.set(position.x, position.y, position.z)
    }
}
