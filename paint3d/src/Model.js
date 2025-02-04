const SCALE = 0.1

//why the hell doesn't JS have a proper modulus?????
//taken from https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
Math.mod = function (x, n) {
    "use strict";
    return ((x % n) + n) % n;
  };

class Vertex {
    constructor(x, y, z, xn, yn, zn) {
        let nCoords = [xn, yn, zn]

        this.pos = [x,y,z]
        this.norm = [xn, yn, zn]
    }
    
    rotateXZ() {
        return new Vertex(this.pos[2], this.pos[1], this.pos[0], this.norm[2], this.norm[1], this.norm[0])
    }

    rotateXY() {
        return new Vertex(this.pos[1], this.pos[0], this.pos[2], this.norm[1], this.norm[0], this.norm[2])
    }

    rotateYZ() {
        return new Vertex(this.pos[0], this.pos[2], this.pos[1], this.norm[0], this.norm[2], this.norm[1])
    }

    scale(x, y, z) {
        return new Vertex(x * this.pos[0], y * this.pos[1], z * this.pos[2], x * this.norm[0], y * this.norm[1], z * this.norm[2])
    }

    changeNormal(xn, yn, zn) {
        return new Vertex(this.pos[0], this.pos[1], this.pos[2], xn, yn, zn) 
    }
}

class Model {
    constructor(pos, color, scale, verts, norms) {
        this.pos = pos
        this.rot = {yaw: 0, pitch: 0, roll: 0}
        this.color = color
        this.scale = scale
        this.verts = verts
        this.norms = norms
    }

    getYaw() {
        return this.rot.yaw
    }

    setYaw(yaw) {
        this.rot.yaw = Math.mod(yaw, 360)
    }

    getRoll() {
        return this.rot.roll
    }

    setRoll(roll) {
        this.rot.roll = Math.mod(roll, 360)
    }

    getPitch() {
        return this.rot.pitch
    }

    setPitch(pitch) {
        this.rot.pitch = Math.max(-90,Math.min(90,pitch))
    }

    getVertices() {
        return this.verts
    }

    getNormals() {
        return this.norms
    }

    update(delta) {

    }

    //this is drawCube(). Techinically it can draw any model, but if you give it cube vertices it'll draw a cube.
    //the math for calculating the verteces of a cube are in the Cube class below
    render(gl, vars, rotateMatrix=new Matrix4(), translateMatrix=new Matrix4()) {
        let newOrient = this.getOrientMatrix().multiply(rotateMatrix)
        let newModel = new Matrix4().multiply(translateMatrix).multiply(this.getModelMatrix(this.getOrientMatrix(), rotateMatrix))
        gl.uniformMatrix4fv(vars.u_modelMatrix, false, newModel.elements)
        gl.uniformMatrix4fv(vars.u_orientMatrix, false, newOrient.elements)
        gl.uniform3f(vars.u_FragColor, this.color[0], this.color[1], this.color[2])
        gl.bindBuffer(gl.ARRAY_BUFFER, vars.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.getVertices(), gl.STATIC_DRAW)
        gl.bindBuffer(gl.ARRAY_BUFFER, vars.normalBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.getNormals(), gl.STATIC_DRAW)
        gl.drawArrays(gl.TRIANGLES, 0, this.getVertices().length / 3)
    }

    getModelMatrix(orientM, rotateMatrix) {
        let M = new Matrix4()
        let v = new Vector3(this.pos)
        let newPos = rotateMatrix.multiplyVector3(v).elements
        M.translate(newPos[0],newPos[1],newPos[2])
        M.scale(this.scale, this.scale, this.scale)
        M.multiply(orientM)
        return M
    }

    getOrientMatrix() {
        let M = new Matrix4()
        M.rotate(this.getRoll(),0,0,1)
        M.rotate(this.getYaw(),0,1,0)
        M.rotate(this.getPitch(),1,0,0)
        return M
    }
}

class Cube extends Model {

    static FACE1 = [[-SCALE, -SCALE, SCALE], [-SCALE, SCALE, SCALE], [SCALE, -SCALE, SCALE]]
    static FACE2 = [[-SCALE, SCALE, SCALE], [SCALE, SCALE, SCALE], [SCALE, -SCALE, SCALE]]
    static FACE3 = [[-SCALE, SCALE, -SCALE], [-SCALE, -SCALE, -SCALE], [SCALE, -SCALE, -SCALE]]
    static FACE4 = [[SCALE, SCALE, -SCALE], [-SCALE, SCALE, -SCALE], [SCALE, -SCALE, -SCALE]]
    static TRI = Cube.generateCubeTriangles()
    static VERT = getModelVertices(Cube.TRI)
    static NORM = getModelNormals(Cube.TRI)

    constructor(pos, scale, yaw, pitch, roll, color) {
        super(pos, color, scale, Cube.VERT, Cube.NORM)
        this.setYaw(yaw)
        this.setPitch(pitch)
        this.setRoll(roll)
    }

    //function that generates all the vertices of a cube as a array of triangles
    static generateCubeTriangles() {
        const face1 = generateTriangle(Cube.FACE1, [0,0,1])
        const face2 = generateTriangle(Cube.FACE2, [0,0,1])
        const face3 = generateTriangle(Cube.FACE3, [0,0,-1])
        const face4 = generateTriangle(Cube.FACE4, [0,0,-1])
        const faces = [face1, face2, face3, face4]
        const yaw = faces.map(face => face.map(v => v.rotateXZ()))
        const pitch = faces.map(face => face.map(v => v.rotateYZ()))
        return faces.concat(yaw).concat(pitch)
    }
}

class Cylinder extends Model {
    static SEGMENT = 30
    static TRI = Cylinder.generateCylinder()
    static VERT = getModelVertices(Cylinder.TRI)
    static NORM = getModelNormals(Cylinder.TRI)

    constructor(pos, scale, yaw, pitch, roll, color) {
        super(pos, color, scale, Cylinder.VERT, Cylinder.NORM)
        this.setYaw(yaw)
        this.setPitch(pitch)
        this.setRoll(roll)
    }

    static generateCylinder() {
        const angleVs = generateCircle(0, SCALE, this.SEGMENT)
        let triangles = []
        let topcenter = new Vertex(0,SCALE,0,0,1,0)
        let bottomcenter = topcenter.scale(1,-1,1)
        for (let i = 0; i < this.SEGMENT; i++) {
            let v1top = angleVs[i]
            let v2top = angleVs[Math.mod(i-1,this.SEGMENT)]
            let v1bot = v1top.scale(1,-1,1)
            let v2bot = v2top.scale(1,-1,1)

            triangles.push([v1top, v1bot, v2bot])
            triangles.push([v1top, v2bot, v2top])
            triangles.push([v1top.changeNormal(0,1,0), v2top.changeNormal(0,1,0), topcenter])
            triangles.push([v1bot.changeNormal(0,-1,0), v2bot.changeNormal(0,-1,0), bottomcenter])
        }
        return triangles
    }
}

class Sphere extends Model {
    static R_SEGMENT = 30
    static H_SEGMENT = 20
    static TRI = Sphere.generateSphere()
    static VERT = getModelVertices(Sphere.TRI)
    static NORM = getModelNormals(Sphere.TRI)

    constructor(pos, scale, yaw, pitch, roll, color) {
        super(pos, color, scale, Sphere.VERT, Sphere.NORM)
        this.setYaw(yaw)
        this.setPitch(pitch)
        this.setRoll(roll)
    }

    static generateSphere() {
        const circles = new Array(Sphere.H_SEGMENT).fill(0).map((x,i) => {
            return generateCircle(i / Sphere.H_SEGMENT, 0, Sphere.R_SEGMENT)
        })
        circles.push(generateCircle((1 - (1 / (2 * Sphere.H_SEGMENT))), 0, Sphere.R_SEGMENT))
        const top = new Vertex(0, SCALE, 0, 0, 1, 0)
        const lowerCircles = circles.map(circle => circle.map(v => v.scale(1,-1,1)))
        const bottom = top.scale(1,-1,1)

        let topTris = Sphere.generateHalf(top, circles)
        let bottomTris = Sphere.generateHalf(bottom, lowerCircles)
        return topTris.concat(bottomTris)
    }

    static generateHalf(cap, circles) {
        return circles.flatMap((circle, i, cs) => {
            if (i >= (cs.length - 1)) {
                return circle.flatMap((x,i) => {
                    let v1 = circle[i]
                    let v2 = circle[Math.mod(i+1, Sphere.R_SEGMENT)]

                    return [[v1,cap,v2]]
                })
            } else {
                let circleAbove = cs[i+1]
                return circle.flatMap((x,i) => {
                    let v1 = circle[i]
                    let v2 = circle[Math.mod(i+1, Sphere.R_SEGMENT)]
                    let v3 = circleAbove[i]
                    let v4 = circleAbove[Math.mod(i+1, Sphere.R_SEGMENT)]

                    return [[v1,v4,v2],[v1,v3,v4]]
                })
            }
        })
    }
}

function generateTriangle(face, norm) {
    return face.map(f => new Vertex(f[0], f[1], f[2], norm[0], norm[1], norm[2]))
}

//generates a vertex array that can be passed to GLSL from an array of arrays of vertices
function getModelVertices(triangles) {
    return new Float32Array(triangles.flat(2).flatMap(v => v.pos))
}

function getModelNormals(triangles) {
    return new Float32Array(triangles.flat(2).flatMap(v => v.norm))
}

function generateCircle(height, offset, segCount) {
    let angle = (2 * Math.PI) / segCount
    let radius = Math.sqrt(1 - Math.pow(height, 2))
    let angles = [0]
    for (i = 1; i < segCount; i++) {
        angles.push((2 * Math.PI) - (angle * i))
    }
    return angles.map(a => {
        let x = radius * Math.cos(a)
        let z = radius * Math.sin(a)
        return new Vertex(SCALE * x, (SCALE * height) + offset, SCALE * z, x, height, z)
    })
}
