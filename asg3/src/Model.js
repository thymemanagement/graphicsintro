const SCALE = 1

class Vertex {
    constructor(x, y, z, xn, yn, zn, u, v) {
        let nCoords = [xn, yn, zn]

        this.pos = [x,y,z]
        this.norm = [xn, yn, zn]
        this.uv = [u,v]
    }
    
    rotateXZ() {
        return new Vertex(this.pos[2], this.pos[1], -this.pos[0], this.norm[2], this.norm[1], -this.norm[0], this.uv[0], this.uv[1])
    }

    rotateXY() {
        return new Vertex(this.pos[1], -this.pos[0], this.pos[2], this.norm[1], -this.norm[0], this.norm[2], this.uv[0], this.uv[1])
    }

    rotateYZ() {
        return new Vertex(this.pos[0], this.pos[2], -this.pos[1], this.norm[0], this.norm[2], -this.norm[1], this.uv[0], this.uv[1])
    }

    scale(x, y, z) {
        return new Vertex(x * this.pos[0], y * this.pos[1], z * this.pos[2], Math.sign(x) * this.norm[0], Math.sign(y) * this.norm[1], Math.sign(z) * this.norm[2], this.uv[0], this.uv[1])
    }

    changeNormal(xn, yn, zn) {
        return new Vertex(this.pos[0], this.pos[1], this.pos[2], xn, yn, zn, this.uv[0], this.uv[1]) 
    }
}

class Model {
    constructor(pos, color, scale, data) {
        this.pos = pos
        this.rot = new Quaternion(1,0,0,0)
        this.color = color
        this.scale = scale
        this.vData = data
        this.vCount = data.length / 8
    }

    getVertexData() {
        return this.vData
    }

    getVertexCount() {
        return this.vCount
    }

    update(delta) {

    }

    //this is drawCube(). Techinically it can draw any model, but if you give it cube vertices it'll draw a cube.
    //the math for calculating the verteces of a cube are in the Cube class below
    render(gl, vars) {
        let orient = this.getOrientMatrix()
        let model = this.getModelMatrix(orient)
        gl.uniformMatrix4fv(vars.u_modelMatrix, false, model.elements)
        gl.uniformMatrix4fv(vars.u_orientMatrix, false, orient.elements)
        gl.uniform3f(vars.u_FragColor, this.color[0], this.color[1], this.color[2])
        gl.bufferData(gl.ARRAY_BUFFER, this.getVertexData(), gl.STATIC_DRAW)
        gl.drawArrays(gl.TRIANGLES, 0, this.getVertexCount())
    }

    getModelMatrix(orientMatrix) {
        let M = new Matrix4()
        M.translate(this.pos[0],this.pos[1],this.pos[2])
        M.scale(this.scale, this.scale, this.scale)
        M.multiply(orientMatrix)
        return M
    }

    getOrientMatrix() {
        return this.rot.getRotationMatrix()
    }

    //generates a vertex array that can be passed to GLSL from an array of arrays of vertices
    static generateVertices(triangles) {
        return new Float32Array(triangles.flat(2).flatMap(v => v.pos))
    }
    
    static generateNormals(triangles) {
        return new Float32Array(triangles.flat(2).flatMap(v => v.norm))
    }
    
    static generateVertexData(triangles) {
        return new Float32Array(triangles.flat(2).flatMap(v => v.pos.concat(v.norm).concat(v.uv)))
    }
}

class Cube extends Model {

    static FACES = [Cube.generateFace(SCALE,  0, false, 0, 1, 0, 1),
                    Cube.generateFace(SCALE,  0, true,  0, 1, 0, 1),
                    Cube.generateFace(SCALE,  1, false, 0, 1, 0, 1),
                    Cube.generateFace(SCALE,  1, true,  0, 1, 0, 1),
                    Cube.generateFace(SCALE, -1, false, 0, 1, 0, 1),
                    Cube.generateFace(SCALE, -1, true,  0, 1, 0, 1)]
    static VDATA = Model.generateVertexData(Cube.FACES)

    constructor(pos, scale, color, rotation=new Quaternion(1,0,0,0)) {
        super(pos, color, scale, Cube.VDATA)
        this.rot = rotation
    }

    //generates all the vertex data for a single square face. 
    //direction: number whose sign tells you how to rotate the face. -1 is top/bottom, 0 is front/back, 1 is left/right
    //flip: boolean that indicates whether the face should be flipped before being rotated. e.g. false is front, true is back 
    static generateFace(scale, direction, flip, uleft, uright, vtop, vbottom) {
        const z = flip ? -1 : 1
        const trueleft = flip ? uright : uleft
        const trueright = flip ? uleft : uright
        let normal = [0,0,z]
        let verteces = [new Vertex(-scale, -scale, z * scale, 0, 0, z, trueleft,  vbottom),
                        new Vertex(-scale,  scale, z * scale, 0, 0, z, trueleft,  vtop),
                        new Vertex( scale, -scale, z * scale, 0, 0, z, trueright, vbottom),
                        new Vertex(-scale,  scale, z * scale, 0, 0, z, trueleft,  vtop),
                        new Vertex( scale,  scale, z * scale, 0, 0, z, trueright, vtop),
                        new Vertex( scale, -scale, z * scale, 0, 0, z, trueright, vbottom)]
        if (direction > 0) {
            verteces = verteces.map(v => v.rotateXZ())
        } else if (direction < 0) {
            verteces = verteces.map(v => v.rotateYZ())
        }
        return verteces
    }

    bake() {
        const orientMatrix = this.getOrientMatrix()
        const modelMatrix = this.getModelMatrix(orientMatrix)
        const bakedFaces = Cube.FACES.map(face => face.map(vertex => {
            const vPos = modelMatrix.multiplyVector3(new Vector3(vertex.pos)).elements
            const vNorm = orientMatrix.multiplyVector3(new Vector3(vertex.norm)).elements
            return new Vertex(vPos[0], vPos[1], vPos[2], vNorm[0], vNorm[1], vNorm[2], vertex.uv[0], vertex.uv[1])
        }))
        return bakedFaces
    }
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
        return new Vertex(SCALE * x, (SCALE * height) + offset, SCALE * z, x, height, z, 1, 0) //TODO: Circle UV
    })
}

class Cylinder extends Model {
    static SEGMENT = 30
    static TRI = Cylinder.generateCylinder()
    static VDATA = Model.generateVertexData(Cylinder.TRI)

    constructor(pos, scale, color, rotation=new Quaternion(1,0,0,0)) {
        super(pos, color, scale, Cylinder.VDATA)
        this.rot = rotation
    }

    static generateCylinder() {
        const angleVs = generateCircle(0, SCALE, this.SEGMENT)
        let triangles = []
        let topcenter = new Vertex(0,SCALE,0,0,1,0,1,0) //TODO: Cylinder UV
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
    static H_SEGMENT = 15
    static TRI = Sphere.generateSphere()
    static VDATA = Model.generateVertexData(Sphere.TRI)

    constructor(pos, scale, color, rotation=new Quaternion(1,0,0,0)) {
        super(pos, color, scale, Sphere.VDATA)
        this.rot = rotation
    }

    static generateSphere() {
        const circles = new Array(Sphere.H_SEGMENT).fill(0).map((x,i) => {
            return generateCircle(i / Sphere.H_SEGMENT, 0, Sphere.R_SEGMENT)
        })
        circles.push(generateCircle((1 - (1 / (2 * Sphere.H_SEGMENT))), 0, Sphere.R_SEGMENT))
        const top = new Vertex(0, SCALE, 0, 0, 1, 0, 1, 0) //TODO: Circle UV
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
