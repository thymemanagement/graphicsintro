let block_count = 0

class World {
    constructor(light, camera, models, skeleton) {
        this.light = light
        this.camera = camera
        this.models = models
        this.walls = this.generateWalls(WALLS)
        this.skeleton = skeleton
        this.ground = new Cube([0,-101,0], 100, [0.2,0.6,0.3])
        this.sky = new Cube([0,0,0],200,[0.2,0.2,0.7])
        this.sky.shaderType = 'basic'
        this.ground.shaderType = 'river'

        this.inputs = {lastX: 0, lastY: 0, newX: 0, newY: 0}
        this.lastX = 0
        this.lastY = 0
        this.newX = 0
        this.newY = 0

        this.modelQueue = []
        this.shouldClear = false
        this.stopped = false
        this.showanimal = false

    }

    addModel(model) {
        this.modelQueue.push(model)
    }

    clearModels() {
        this.shouldClear = true
    }

    manageInputs() {
        if (this.shouldClear === true) {
            this.models = []
            this.modelQueue = []
            this.shouldClear = false
        } else {
            this.models = this.models.concat(this.modelQueue)
            this.modelQueue = []
        }
        this.camera.manageInputs(this.inputs)
    }

    update(delta) {
        this.camera.update(delta)
        this.light.update(delta)
        this.skeleton.update(delta)
    }

    render(gl, shaders) {
        gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
        this.light.attachVariables(gl, shaders)
        this.camera.attachVariables(gl, shaders)
        this.sky.render(gl, shaders)
        this.ground.render(gl, shaders)
        this.models.forEach((model) => {
            model.render(gl, shaders)
        })
        this.walls.render(gl, shaders)
        if (this.showanimal) {
            this.skeleton.render(gl, shaders)
        }
    }

    generateWalls(wallArray) {
        const xoffset = -GRID_SIZE/2
        const zoffset = -GRID_SIZE/2
        const yoffset = -0.5
        let wallFaces = []
        const cubeFaces = Cube.FACES
        const length = wallArray.length
        const bake = function (x,y,z) {
            return v => v.scale(0.5,0.5,0.5).translate(x + xoffset, y + yoffset, z + zoffset)
        }
        wallArray.forEach((row, z) => {
            const width = row.length
            row.forEach((stack, x) => {
                for (let y = 0; y < stack; y++) {
                    let newFaces = []
                    if (z === length - 1 || wallArray[z+1][x] <= y) newFaces.push(cubeFaces[0].map(bake(x,y,z)))
                    if (z === 0 || wallArray[z-1][x] <= y) newFaces.push(cubeFaces[1].map(bake(x,y,z)))
                    if (x === width - 1 || wallArray[z][x+1] <= y) newFaces.push(cubeFaces[2].map(bake(x,y,z)))
                    if (x === 0 || wallArray[z][x-1] <= y) newFaces.push(cubeFaces[3].map(bake(x,y,z)))
                    if (y === stack - 1) newFaces.push(cubeFaces[4].map(bake(x,y,z)))
                    wallFaces = wallFaces.concat(newFaces)
                    block_count++
                }
            })
        })
        const wallModel = new Model([0,0,0],[0.9,0.2,0.0], 1, Model.generateVertexData(wallFaces))
        wallModel.shaderType = 'texture'
        return wallModel
    }
}

class Light {
    constructor(pos) {
        this.norm = new Vector3(pos).normalize()
        this.rotation = new Quaternion(1,0,0,0)
    }

    update(delta) {
        this.rotation = this.rotation.multiply(Quaternion.fromAngleAxis(degreeToRad(20 * delta), 1, 0, 0))
    }

    attachVariables(gl, shaders) {
        const lightPos = this.rotation.getRotationMatrix().multiplyVector3(this.norm).normalize().elements
        Object.entries(shaders).forEach(([key, shader]) => {
            gl.useProgram(shader.program)
            gl.uniform4f(shader.u_lightSource, lightPos[0], lightPos[1], lightPos[2], 1.0)
        })
    }
}