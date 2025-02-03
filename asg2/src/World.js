class World {
    constructor(light, camera, models, skeleton) {
        this.light = light
        this.camera = camera
        this.models = models
        this.skeleton = skeleton
        this.modelQueue = []
        this.shouldClear = false
        this.stopped = false
        this.lastX = 0
        this.lastY = 0
        this.newX = 0
        this.newY = 0
    }

    addModel(model) {
        this.modelQueue.push(model)
    }

    clearModels() {
        this.shouldClear = true
    }

    update(delta) {
        if (this.shouldClear === true) {
            this.models = []
            this.modelQueue = []
            this.shouldClear = false
        } else {
            this.models = this.models.concat(this.modelQueue)
            this.modelQueue = []
        }
        this.camera.newRotation(this.lastX - this.newX, this.lastY - this.newY)
        this.camera.update(delta)
        this.light.update(delta)
        this.skeleton.update(delta)
        this.lastX = this.newX
        this.lastY = this.newY
    }

    render(gl, vars) {
        gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
        this.light.attachVariables(gl, vars)
        this.camera.attachVariables(gl, vars)
        this.models.forEach((model) => {
            model.render(gl, vars)
        })
        this.skeleton.render(gl, vars)
    }
}

class Light {
    constructor(pos) {
        this.norm = new Vector3(pos).normalize().elements
    }

    update(delta) {

    }

    attachVariables(gl, vars) {
        gl.uniform4f(vars.u_lightSource, this.norm[0], this.norm[1], this.norm[2], 1.0)
    }
}

class Camera {
    constructor(pos) {
        this.pos = pos
        this.worldAngle = 0
        this.worldAxis = new Vector3([0,1,0])
        this.worldYaw = 0
        this.worldPitch = 0
        this.fov = 50
        this.sensitivity = 100
        this.zoom = 2

    }

    update(delta) {
        this.worldAngle += (delta * 10) % 360
    }

    newRotation(yaw, pitch) {
        this.worldYaw = (this.worldYaw - (this.sensitivity * yaw)) % 360
        this.worldPitch = Math.min(90,Math.max(-90,(this.sensitivity * pitch + this.worldPitch)))
    }

    attachVariables(gl, vars) {
        gl.uniformMatrix4fv(vars.u_cameraMatrix, false, this.getCameraMatrix().elements)
        gl.uniformMatrix4fv(vars.u_projectionMatrix, false, this.getProjectionMatrix().elements)
    }

    getCameraMatrix() {
        let axis = this.worldAxis.elements
        let m = new Matrix4()
        m.translate(-this.pos[0],-this.pos[1],-(this.pos[2]+this.zoom))
        m.rotate(this.worldPitch, 1, 0, 0)
        m.rotate(this.worldYaw, 0, 1, 0)
        m.rotate(this.worldAngle, axis[0], axis[1], axis[2])
        return m
    }

    getCameraRotation() {
        let axis = this.worldAxis.elements
        let m = new Matrix4()
        m.rotate(-this.worldPitch, 1, 0, 0)
        m.rotate(-this.worldYaw, 0, 1, 0)
        m.rotate(-this.worldAngle, axis[0], axis[1], axis[2])
        return m
    }

    getProjectionMatrix() {
        return new Matrix4().setPerspective(this.fov,1,0.1,200)
    }
}