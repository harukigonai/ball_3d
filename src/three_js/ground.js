import * as THREE from 'three'
import grass_jpg from './textures/grass.jpg'

const WIDTH = 20
const LENGTH = 40

export class Ground {
    ground

    constructor() {
        // TEXTURES
        const loadingManager = new THREE.LoadingManager()
        const textureLoader = new THREE.TextureLoader(loadingManager)
        const grass = textureLoader.load(grass_jpg)

        grass.wrapS = THREE.RepeatWrapping
        grass.wrapT = THREE.RepeatWrapping
        grass.repeat.set(15, 15)

        const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512)

        const material = new THREE.MeshLambertMaterial({
            map: grass,
            color: 0xaaaaaa,
            side: THREE.FrontSide,
        })

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.receiveShadow = true
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.position.y = -0.05
    }

    addMeshToScene(scene) {
        scene.add(this.mesh)
    }
}
