class Physics {
    constructor(pos) {
        this.pos = new Vector3(pos)
        this.vel = new Vector3([0,0,0])
        this.acc = new Vector3([0,0,0])
        this.accRate = 10
        this.maxSpeed = 40
        this.friction = 10
        this.gravity = 9.8
        this.movingDirection = new Vector3([0,0,0])
    }

    updateMovingDirection(dir) {
        this.movingDirection = dir
    }

    update(delta) {
        this.acc = this.movingDirection.mul(this.accRate)
        this.vel = this.vel.add(this.acc.mul(delta))
        
        let drift = Vector3.dot(this.vel.normalize(), this.movingDirection)
        if (this.vel.magnitude() === 0) drift = 1
        const frictionForce = this.friction * (1 - Math.abs(drift)) * delta
        this.vel = this.vel.add(this.vel.normalize().mul(-1 * frictionForce))

        const speed = this.vel.magnitude()
        if (speed > this.maxSpeed) {
            this.vel = this.vel.mul(this.maxSpeed/speed)
        }
        if (speed < 0.1 && this.movingDirection.magnitude() === 0) {
            this.vel = new Vector3([0,0,0])
        }

        document.getElementById("speed").innerHTML = Math.trunc(this.vel.magnitude() * 100) / 100
        document.getElementById("moving").innerHTML = Math.trunc(this.acc.magnitude() * 100) / 100

        this.pos = this.pos.add(this.vel.mul(delta))
    }

}