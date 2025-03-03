class LightSystem {
    constructor() {
        this.sun = new DirectionalLight(new Vector3([0,500,0]), [0.8,0.8,0.5])
        this.point = new PointLight(new Vector3([-30.5,-0.5,67]), [1,0,1], 1)
        this.spot = new SpotLight(new Vector3([-35.5,3,71]), new Vector3([0,1,0]), [1,1,1], 30, 0.7)
        this.ambient = [0.1, 0.1, 0.1]
        this.ambienton = true
    }

    update(delta, camera) {
        this.sun.rotation = this.sun.rotation.multiply(Quaternion.fromAngleAxis(degreeToRad(5 * delta), 1, 0, 0))
        this.sun.update(delta)
        this.sun.lightPos = this.sun.lightPos.add(camera.physics.pos)
        this.point.rotation = this.point.rotation.multiply(Quaternion.fromAngleAxis(degreeToRad(50 * delta), 0, 1, 0))
        this.point.update(delta)
        this.spot.rotation = this.spot.rotation.multiply(Quaternion.fromAngleAxis(degreeToRad(Math.sin(30 * this.spot.cycle)), 0, 0, 1))
        this.spot.update(delta)
    }

    render(gl, camera, light) {
        this.sun.render(gl, camera, light)
        this.point.render(gl, camera, light)
        this.spot.render(gl, camera, light)
    }

    getAmbientLight() {
        if (this.ambienton) {
            return this.ambient
        } else {
            return [0,0,0]
        }
    }
}

class Light {
    constructor(pos, dir, color, model) {
        this.basePos = pos
        this.lightPos = pos
        this.rotation = new Quaternion(1,0,0,0)
        this.baseDir = dir.normalize()
        this.lightDir = this.baseDir
        this.baseColor = color
        this.lightColor = color
        this.on = true
        this.model = model
    }

    getLightDirection() {
        return this.lightDir
    }

    getLightPosition() {
        return this.lightPos
    }

    getLightColor() {
        if (this.on) {
            return this.lightColor
        }
        else {
            return [0,0,0]
        }
    }

    render(gl, camera, light) {
        this.model.moveTo(this.rotation, this.lightPos)
        this.model.render(gl, camera, light)
    }

    update(delta) {

    }
}

class SpotLight extends Light {
    constructor(pos, dir, lightColor, intensity, ratio) {
        super(pos, dir, lightColor, new Cylinder([0,0,0],0.1,lightColor, new Quaternion(1,0,0,0), new LightShader()))
        this.intensity = intensity
        this.ratio = ratio
        this.model.color = lightColor
        this.rotation = Quaternion.fromAngleAxis(degreeToRad(0), 0, 0, 1)
        this.cycle = 0
    }

    update(delta) {
        const rotateMatrix = this.rotation.getRotationMatrix()
        this.lightDir = rotateMatrix.multiplyVector3(this.baseDir).normalize()
        this.lightPos = this.basePos
        this.lightColor = this.baseColor.map(c => c * this.intensity)
        this.model.color = this.lightColor
        this.cycle = ((0.05 * delta) + this.cycle) % (2 * Math.PI)
    }
}

class PointLight extends Light {
    constructor(pos, lightColor, intensity) {
        super(pos, new Vector3(0,1,0), lightColor, new Sphere([0,0,0],0.1,lightColor, new Quaternion(1,0,0,0), new SourceShader()))
        this.intensity = intensity
        this.model.color = lightColor
    }

    update(delta) {
        const rotateMatrix = this.rotation.getRotationMatrix()
        this.lightPos = this.basePos.add(rotateMatrix.multiplyVector3(new Vector3([0,0,-2])))
        this.lightColor = this.baseColor.map(c => c * this.intensity)
        this.model.color = this.lightColor
    }
}

class DirectionalLight extends Light {
    constructor(pos, lightColor) {
        super(pos, pos.normalize(), lightColor, new Sphere([0,0,0],40,lightColor, new Quaternion(1,0,0,0), new BasicShader()))
    }

    getLightDirection() {
        if (this.on) {
            return this.lightDir
        } else {
            return new Vector3([0,-1,0])
        }
    }

    update(delta) {
        const rotateMatrix = this.rotation.getRotationMatrix()
        this.lightDir = rotateMatrix.multiplyVector3(this.baseDir).normalize()
        this.lightPos = rotateMatrix.multiplyVector3(this.basePos)
    }
}