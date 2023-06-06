import * as THREE from 'three'
import grass_jpg from './textures/grass.jpg'

export const court_width = 30
export const court_length = 60
const divider_thickness = 1

export class Ground {
    mesh

    redDivider

    blueDivider

    constructor({ scene }) {
        // TEXTURES
        const loadingManager = new THREE.LoadingManager()
        const textureLoader = new THREE.TextureLoader(loadingManager)
        const grass = textureLoader.load(grass_jpg)

        grass.wrapS = THREE.RepeatWrapping
        grass.wrapT = THREE.RepeatWrapping
        grass.repeat.set(15, 15)

        let geometry = new THREE.PlaneGeometry(
            court_width,
            court_length,
            512,
            512
        )

        let material = new THREE.MeshLambertMaterial({
            map: grass,
            color: 0xaaaaaa,
            side: THREE.FrontSide,
        })

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.receiveShadow = true
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.position.y = -0.05

        geometry = new THREE.PlaneGeometry(court_width, divider_thickness)
        material = new THREE.MeshBasicMaterial({
            color: 'red',
            side: THREE.DoubleSide,
        })
        this.redDivider = new THREE.Mesh(geometry, material)
        this.redDivider.rotation.x = -Math.PI / 2
        this.redDivider.position.z = -divider_thickness / 2

        material = new THREE.MeshBasicMaterial({
            color: 'blue',
            side: THREE.DoubleSide,
        })
        this.blueDivider = new THREE.Mesh(geometry, material)
        this.blueDivider.rotation.x = -Math.PI / 2
        this.blueDivider.position.z = divider_thickness / 2

        this.scene = scene
    }

    addMeshToScene() {
        this.scene.add(this.mesh)
        this.scene.add(this.redDivider)
        this.scene.add(this.blueDivider)
    }
}
