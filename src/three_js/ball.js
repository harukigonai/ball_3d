import * as THREE from 'three'
import { court_length, court_width } from './ground'

const dt = 0.015
// const dt = 0.0015 * 2
export const g = 9.8

const e_y = 0.8
const e_horiz = 0.8

const CD = 0.4
const rho = 1.23

const CL = 20

export class Ball {
    uuid

    vel = new THREE.Vector3(0, 0, 0)
    ang_vel = new THREE.Vector3(0, 0, 0)

    m = 2000
    mesh
    r = 0.2
    thick = 0.05
    A = Math.PI * this.r ** 2

    alpha = 1 / 3
    I = this.alpha * this.m * this.r ** 2

    mu_s = 0.8
    mu_k = 0.7

    grabbed = false

    gameClient

    constructor(params) {
        this.uuid = params.uuid

        const geometry = new THREE.SphereGeometry(this.r)
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(
            params.position.x,
            params.position.y,
            params.position.z
        )

        this.vel = params.vel

        const euler = new THREE.Euler(0, 0, 0, 'XYZ')
        this.mesh.setRotationFromEuler(euler)

        this.gameClient = params.gameClient
    }

    addMeshToScene(scene) {
        scene.add(this.mesh)
    }

    collideSurface(normal) {
        const vel_perp = this.vel.clone().projectOnVector(normal)
        const vel_par = this.vel.clone().sub(vel_perp)
        const ang_vel_perp = this.ang_vel.clone().projectOnVector(normal)
        const ang_vel_par = this.ang_vel.clone().sub(ang_vel_perp)

        const new_vel_par = vel_par
            .clone()
            .multiplyScalar((1 - this.alpha * e_horiz) / (1 + this.alpha))
            .add(
                ang_vel_par
                    .clone()
                    .applyAxisAngle(normal, -Math.PI / 2)
                    .multiplyScalar(
                        (this.alpha * (1 + e_horiz) * this.r) / (1 + this.alpha)
                    )
            )
        const new_vel_perp = normal
            .clone()
            .multiplyScalar(e_y * vel_perp.length())
        const new_vel = new_vel_par.clone().add(new_vel_perp)

        const new_ang_vel_par = ang_vel_par
            .clone()
            .multiplyScalar((this.alpha - e_horiz) / (1 + this.alpha))
            .add(
                vel_par
                    .clone()
                    .applyAxisAngle(normal, Math.PI / 2)
                    .multiplyScalar((1 + e_horiz) / ((1 + this.alpha) * this.r))
            )
        const new_ang_vel_perp = ang_vel_perp
        const new_ang_vel = new_ang_vel_par.clone().add(new_ang_vel_perp)

        this.vel = new_vel
        this.ang_vel = new_ang_vel
    }

    updatePos(acc) {
        this.vel.x += acc.x * dt
        this.vel.y += acc.y * dt
        this.vel.z += acc.z * dt

        const newPos = this.mesh.position.clone()
        newPos.x += this.vel.x * dt
        newPos.y += this.vel.y * dt
        newPos.z += this.vel.z * dt
        this.mesh.position.set(newPos.x, newPos.y, newPos.z)
    }

    updateAng(ang_acc) {
        this.ang_vel.x += ang_acc.x * dt
        this.ang_vel.y += ang_acc.y * dt
        this.ang_vel.z += ang_acc.z * dt

        const delta_angle = new THREE.Quaternion()
            .setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.ang_vel.x * dt)
            .multiply(
                new THREE.Quaternion().setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    this.ang_vel.y * dt
                )
            )
            .multiply(
                new THREE.Quaternion().setFromAxisAngle(
                    new THREE.Vector3(0, 0, 1),
                    this.ang_vel.z * dt
                )
            )

        this.mesh.applyQuaternion(delta_angle)
    }

    dragBallToPosition(position) {
        if (position.y < this.r) position.y = this.r

        if (position.x > court_width / 2 - this.r)
            position.x = court_width / 2 - this.r
        else if (position.x < -court_width / 2 + this.r)
            position.x = -court_width / 2 + this.r

        if (position.z > court_length / 2 - this.r)
            position.z = court_length / 2 - this.r
        else if (position.z < -court_length / 2 + this.r)
            position.z = -court_length / 2 + this.r

        this.mesh.position.set(position.x, position.y, position.z)
    }

    update(ballMap) {
        if (this.mesh.position.y < this.r) {
            this.mesh.position.y = this.r
            if (Math.abs(this.vel.y) < 0.5) {
                this.vel.y = 0
                this.rollOnGround()
                return
            }

            this.collideSurface(new THREE.Vector3(0, 1, 0))
        }

        if (this.mesh.position.x > court_width / 2 - this.r) {
            this.mesh.position.x = court_width / 2 - this.r

            this.collideSurface(new THREE.Vector3(-1, 0, 0))
        } else if (this.mesh.position.x < -court_width / 2 + this.r) {
            this.mesh.position.x = -court_width / 2 + this.r

            this.collideSurface(new THREE.Vector3(1, 0, 0))
        }
        if (this.mesh.position.z > court_length / 2 - this.r) {
            this.mesh.position.z = court_length / 2 - this.r

            this.collideSurface(new THREE.Vector3(0, 0, -1))
        } else if (this.mesh.position.z < -court_length / 2 + this.r) {
            this.mesh.position.z = -court_length / 2 + this.r

            this.collideSurface(new THREE.Vector3(0, 0, 1))
        }

        ballMap.forEach((ball, _) => {
            if (this != ball) {
                const distBetBalls = this.mesh.position.distanceTo(
                    ball.mesh.position
                )
                if (distBetBalls < 2 * this.r) {
                    this.collideBall(ball)
                }
            }
        })

        if (this.grabbed) {
            return
        }

        const F_grav = new THREE.Vector3(0, -this.m * g, 0)
        const F_drag = this.vel
            .clone()
            .normalize()
            .multiplyScalar((-1 / 2) * CD * rho * this.A * this.vel.lengthSq())
        const F_magnus = new THREE.Vector3()
            .crossVectors(
                this.ang_vel.clone().normalize(),
                this.vel.clone().normalize()
            )
            .multiplyScalar((1 / 2) * CL * rho * this.A * this.vel.lengthSq())

        const sum_of_F = new THREE.Vector3()
            .add(F_grav)
            .add(F_drag)
            .add(F_magnus)
        const acc = sum_of_F.divideScalar(this.m)

        this.updatePos(acc)
        this.updateAng(new THREE.Vector3(0, 0, 0))
    }

    rollOnGround() {
        const sum_of_F = new THREE.Vector3()
        const sum_of_T = new THREE.Vector3()

        const slip_cond_x_dir = this.vel.x + this.ang_vel.z * this.r
        const slip_cond_z_dir = this.vel.z - this.ang_vel.x * this.r

        const F_n = this.mu_s * this.m * g
        const F_sf = new THREE.Vector3(
            -1 * Math.sign(slip_cond_x_dir) * this.mu_s * F_n,
            0,
            -1 * Math.sign(slip_cond_z_dir) * this.mu_s * F_n
        )

        const r_vec = new THREE.Vector3(0, -this.r, 0)
        const T_sf = r_vec.clone().cross(F_sf)

        sum_of_F.add(F_sf)
        sum_of_T.add(T_sf)

        const acc = sum_of_F.divideScalar(this.m)
        const ang_acc = sum_of_T.divideScalar(this.I)

        const new_vel = acc.clone().multiplyScalar(dt).add(this.vel)
        const new_ang_vel = ang_acc.clone().multiplyScalar(dt).add(this.ang_vel)

        const new_slip_cond_x_dir = new_vel.x + new_ang_vel.z * this.r
        const new_slip_cond_z_dir = new_vel.z - new_ang_vel.x * this.r
        if (
            !(
                Math.abs(slip_cond_x_dir + new_slip_cond_x_dir) < 0.001 &&
                Math.abs(slip_cond_z_dir + new_slip_cond_z_dir) < 0.001
            )
        ) {
            this.updatePos(acc)
            this.updateAng(ang_acc)

            this.vel.multiplyScalar(0.99)
            this.ang_vel.multiplyScalar(0.99)
        } else {
            this.vel = new THREE.Vector3()
            this.ang_vel = new THREE.Vector3()
        }
    }

    collideBall(ball) {
        // https://en.wikipedia.org/wiki/Elastic_collision
        const x1Minusx2 = this.mesh.position.clone().sub(ball.mesh.position)
        const x2Minusx1 = x1Minusx2.clone().negate()

        const v1Minusv2 = this.vel.clone().sub(ball.vel)
        const v2Minusv1 = v1Minusv2.clone().negate()

        if (!this.grabbed)
            this.vel.sub(
                x1Minusx2
                    .clone()
                    .multiplyScalar(
                        ((2 * ball.m) / (this.m + ball.m)) *
                            (v1Minusv2.dot(x1Minusx2) / (this.r + ball.r) ** 2)
                    )
            )
        if (!ball.grabbed)
            ball.vel.sub(
                x2Minusx1
                    .clone()
                    .multiplyScalar(
                        ((2 * this.m) / (this.m + ball.m)) *
                            (v2Minusv1.dot(x2Minusx1) / (this.r + ball.r) ** 2)
                    )
            )

        const midpoint = this.mesh.position
            .clone()
            .add(ball.mesh.position)
            .multiplyScalar(0.5)
        const ballToThisNorm = x1Minusx2.clone().normalize()
        const thisToBallNorm = x2Minusx1.clone().normalize()
        const newThisPos = midpoint
            .clone()
            .add(ballToThisNorm.multiplyScalar(this.r + 0.01))
        const newBallPos = midpoint
            .clone()
            .add(thisToBallNorm.multiplyScalar(ball.r + 0.01))

        this.mesh.position.set(newThisPos.x, newThisPos.y, newThisPos.z)
        ball.mesh.position.set(newBallPos.x, newBallPos.y, newBallPos.z)
    }

    updateBallFromGameClient(position, vel) {
        this.mesh.position.set(position.x, position.y, position.z)
        this.vel = new THREE.Vector3(vel.x, vel.y, vel.z)
    }
}
