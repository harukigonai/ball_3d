import * as THREE from 'three'

const WIDTH = 100
const LENGTH = 100

export class Ground {
    ground

    constructor() {
        // TEXTURES
        const textureLoader = new THREE.TextureLoader()
        const grass = textureLoader.load('./textures/grass.jpg')
        grass.wrapS = THREE.RepeatWrapping
        grass.wrapT = THREE.RepeatWrapping
        grass.repeat.set(25, 25)

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
