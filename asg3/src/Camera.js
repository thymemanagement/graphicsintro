class Camera {
    constructor(pos) {
        this.physics = new Physics(pos)
        this.worldSpin = Quaternion.fromAngleAxis(0,0,1,0)
        this.worldYaw = 0
        this.worldPitch = 0
        this.fov = 50
        this.sensitivity = 100
        this.grounded = true
        this.speed = 1
        this.acc = 1
        this.maxspeed
        this.movingDirection = new Vector3([0,0,0])

    }

    manageInputs(inputs) {
        this.newRotation(inputs.lastX - inputs.newX, inputs.lastY - inputs.newY)
        inputs.lastX = inputs.newX
        inputs.lastY = inputs.newY

        const rot = this.grounded ? this.getCameraYawOnly() : this.getCameraRotation()
        let newDirection = new Vector3([0,0,0])
        if (inputs['KeyW'] == true) {
            newDirection = newDirection.add(rot.multiplyVector3(new Vector3([0,0,-1])))
        } else if (inputs['KeyS'] == true) {
            newDirection = newDirection.add(rot.multiplyVector3(new Vector3([0,0,1])))
        }
        if (inputs['KeyA'] == true) {
            newDirection = newDirection.add(rot.multiplyVector3(new Vector3([-1,0,0])))
        } else if (inputs['KeyD'] == true) {
            newDirection = newDirection.add(rot.multiplyVector3(new Vector3([1,0,0])))
        }
        if (inputs['KeyQ'] == true) {
            newDirection = newDirection.add(new Vector3([0,1,0]))
        } else if (inputs['KeyE'] == true) {
            newDirection = newDirection.add(new Vector3([0,-1,0]))
        }
        this.movingDirection = newDirection.normalize()
        this.physics.updateMovingDirection(this.movingDirection)
    }

    update(delta) {
        //let angle = degreeToRad(delta * 10)
        //this.worldSpin = this.worldSpin.rotateByAngleAxis(angle, 0, 1, 0)
        this.physics.update(delta)
    }

    newRotation(yaw, pitch) {
        this.worldYaw = Math.mod((this.worldYaw - (this.sensitivity * yaw)),360)
        this.worldPitch = Math.min(90,Math.max(-90,(this.sensitivity * pitch + this.worldPitch)))
    }

    attachVariables(gl, shaders) {
        Object.entries(shaders).forEach(([key, shader]) => {
            gl.useProgram(shader.program)
            gl.uniformMatrix4fv(shader.u_viewMatrix, false, this.getViewMatrix().elements)
            gl.uniformMatrix4fv(shader.u_projectionMatrix, false, this.getProjectionMatrix().elements)
        })
    }

    getViewMatrix() {
        let m = new Matrix4()
        let physPos = this.physics.pos.elements
        m.rotate(this.worldPitch, 1, 0, 0)
        m.rotate(this.worldYaw, 0, 1, 0)
        m.translate(-physPos[0],-physPos[1],-physPos[2])
        m.multiply(this.worldSpin.getRotationMatrix())
        return m
    }

    getCameraRotation() {
        let m = new Matrix4()
        m.rotate(-this.worldYaw, 0, 1, 0)
        m.rotate(-this.worldPitch, 1, 0, 0)
        return m
    }
    
    getCameraYawOnly() {
        return new Matrix4().rotate(-this.worldYaw, 0, 1, 0)
    }

    getProjectionMatrix() {
        return new Matrix4().setPerspective(this.fov,1,0.1,1000)
    }
}