let block_count = 0

class World {
    constructor(camera, skeleton) {
        this.light = new LightSystem()
        this.camera = camera
        this.models = new Model([0,0,0], 1, [0.9,0.2,0.0], new Quaternion(1,0,0,0), new LightShader(), [])
        this.walls = this.generateWalls(WALLS)
        this.skeleton = skeleton
        this.ground = new Cube([0,-101,0], 100, [0.2,0.6,0.3], new Quaternion(1,0,0,0), new RiverShader())
        this.ground.shininess = 20.0
        this.sky = new Cube([0,0,0], 1000, [0.2,0.2,0.7], new Quaternion(1,0,0,0), new BasicShader())

        this.inputs = {lastX: 0, lastY: 0, newX: 0, newY: 0}
        this.lastX = 0
        this.lastY = 0
        this.newX = 0
        this.newY = 0

        this.modelQueue = []
        this.shouldClear = false
        this.stopped = false
        this.showanimal = true

    }

    addModel(model) {
        this.modelQueue.push(model)
    }

    clearModels() {
        this.shouldClear = true
    }

    manageInputs() {
        if (this.shouldClear === true) {
            this.models.clearVerteces()
            this.modelQueue = []
            this.shouldClear = false
        } else {
            this.modelQueue.forEach(model => this.models.concatModel(model))
            this.modelQueue = []
        }
        this.camera.manageInputs(this.inputs)
    }

    update(delta) {
        this.camera.update(delta)
        this.light.update(delta, this.camera)
        //this.skeleton.update(delta)
    }

    render(gl) {
        gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
        this.sky.render(gl, this.camera, this.light)
        this.ground.render(gl, this.camera, this.light)
        this.light.render(gl, this.camera, this.light)
        this.models.render(gl, this.camera, this.light)
        this.walls.render(gl, this.camera, this.light)
        if (this.showanimal) {
            this.skeleton.render(gl, this.camera, this.light)
        }
    }

    generateWalls(wallArray) {
        const offset = new Vector3([-GRID_SIZE/2, -0.5, -GRID_SIZE/2])
        let wallFaces = []
        const cubeFaces = Cube.FACES.map(face => face.map(vertex => vertex.scale(0.5, 0.5, 0.5)))
        const length = wallArray.length
        const wallModel = new Model([0,0,0], 1, [0.9,0.2,0.0], new Quaternion(1,0,0,0), new TextureShader(), [])
        const bake = function (x,y,z) {
            return v => v.translate(new Vector3([x,y,z]).add(offset))
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
        wallModel.setVerteces(wallFaces.flat(2))
        wallModel.shaderType = 'texture'
        return wallModel
    }
}