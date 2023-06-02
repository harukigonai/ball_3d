import * as THREE from 'three'

const dt = 0.0015
const rot_vel = 5

export class Sky {
    mesh
    light
    ambient_light
    scene
    r = 100
    num_stars = 1000
    stars_li

    constructor(scene) {
        const color = new THREE.Color('#FDB813')
        const geometry = new THREE.IcosahedronGeometry(1, 15)
        const material = new THREE.MeshBasicMaterial({ color: color })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(0, this.r, 0)

        this.light = new THREE.PointLight(0xffffff, 1, 0)
        this.light.position.set(0, this.r, 0)

        this.ambient_light = new THREE.AmbientLight(0xffffff, 0.5)

        this.stars(scene)

        this.scene = scene
    }

    addMeshToScene(scene) {
        scene.add(this.light)
        scene.add(this.ambient_light)
        scene.add(this.stars_points)
    }

    // Move this until utils.js
    // https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
    gaussianRandom(mean = 0, stdev = 1) {
        const u = 1 - Math.random() // Converting [0,1) to (0,1]
        const v = Math.random()
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
        // Transform to the desired mean and standard deviation:
        return z * stdev + mean
    }

    stars(scene) {
        const geometry = new THREE.BufferGeometry()

        this.stars_li = []
        for (var i = 0; i < this.num_stars; i++) {
            const star = new THREE.Vector3(
                this.gaussianRandom(),
                this.gaussianRandom(),
                this.gaussianRandom()
            )
            star.normalize()
            star.multiplyScalar(this.r * 4)
            this.stars_li.push(star)
        }

        geometry.setFromPoints(this.stars_li)
        const material = new THREE.PointsMaterial({
            color: 0xa8def0,
            size: 2,
            sizeAttenuation: false,
        })
        this.stars_points = new THREE.Points(geometry, material)
    }

    update() {
        this.mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), dt)
        this.light.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), dt)

        const sky_blue = new THREE.Color(0xa8def0)
        const night_sky_blue = new THREE.Color(0x041a40)

        let color_scale = new THREE.Vector3(0, 1, 0).dot(
            this.mesh.position.clone().normalize()
        )
        if (color_scale < 0) {
            color_scale = 0
        }

        sky_blue.r *= color_scale
        sky_blue.g *= color_scale
        sky_blue.b *= color_scale

        sky_blue.r = Math.max(sky_blue.r, night_sky_blue.r)
        sky_blue.g = Math.max(sky_blue.g, night_sky_blue.g)
        sky_blue.b = Math.max(sky_blue.b, night_sky_blue.b)

        this.scene.background = sky_blue

        for (var i = 0; i < this.num_stars; i++) {
            this.stars_li[i].applyAxisAngle(new THREE.Vector3(1, 0, 0), dt)
        }
        this.stars_points.geometry.setFromPoints(this.stars_li)
    }
}
