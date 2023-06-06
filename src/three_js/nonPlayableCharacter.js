import * as THREE from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import fontFile from './fonts/Source Code Pro Medium_Regular.json'

export const player_radius = 0.5
export const player_height = 2

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

    live

    name

    scene

    constructor({ position, uuid, team, scene, name }) {
        this.uuid = uuid

        let geometry = new THREE.CylinderGeometry(
            player_radius,
            player_radius,
            player_height
        )
        let material = new THREE.MeshLambertMaterial({
            color: 0xaaaaaa,
            side: THREE.FrontSide,
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(position.x, position.y, position.z)

        this.vel = new THREE.Vector3()

        this.live = true
        this.scene = scene

        this.name = name

        this.team = team

        const loader = new FontLoader()
        const font = loader.parse(fontFile)

        this.name = name
        geometry = new TextGeometry(this.name, {
            font,
            size: 0.5,
            height: 0.1,
        })
        material = new THREE.MeshPhongMaterial({
            color: this.team,
        })
        this.nameMesh = new THREE.Mesh(geometry, material)
        this.nameMesh.position.set(
            this.mesh.position.x,
            this.mesh.position.y + player_height / 2 + 0.1,
            this.mesh.position.z
        )

        const namePositionOffset = this.name.length * 0.2
        if (this.team === 'blue') {
            this.nameMesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI)
            this.nameMesh.position.x += namePositionOffset
        } else {
            this.nameMesh.position.x -= namePositionOffset
        }
    }

    addMeshToScene() {
        this.scene.add(this.mesh)
        this.scene.add(this.nameMesh)
    }

    updatePlayerFromGameClient(position, vel, live) {
        this.mesh.position.set(position.x, position.y, position.z)
        this.nameMesh.position.set(
            this.mesh.position.x,
            this.mesh.position.y + player_height / 2 + 1,
            this.mesh.position.z
        )
        this.vel = vel
        this.live = live

        if (!this.live) {
            this.scene.remove(this.mesh)
            this.scene.remove(this.nameMesh)
        }
    }
}
