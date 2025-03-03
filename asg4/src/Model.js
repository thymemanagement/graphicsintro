const SCALE = 1
const FLOAT_SIZE = 4
const GRANITE_PATH = "https://thymemanagement.github.io/graphicsintro/asg3/assets/granite.png"
const AMETHYST_PATH = "https://thymemanagement.github.io/graphicsintro/asg3/assets/amethyst_block.png"

function generateTexture(gl, imgPath) {
    const texture = gl.createTexture()
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const image = new Image();
    image.onload = () => {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };

    image.crossOrigin = "anonymous";
    image.src = imgPath;

    return texture
}

class Vertex {
    constructor(pos, normal, uv, color=[1,0,1]) {
        this.pos = pos
        this.norm = normal
        this.uv = uv
        this.color = color
    }
    
    rotateXZ() {
        const pVal = this.pos.elements
        const nVal = this.norm.elements
        return new Vertex(new Vector3([pVal[2], pVal[1], -pVal[0]]), new Vector3([nVal[2], nVal[1], -nVal[0]]), this.uv, this.color)
    }

    rotateXY() {
        const pVal = this.pos.elements
        const nVal = this.norm.elements
        return new Vertex(new Vector3([pVal[1], -pVal[0], pVal[2]]), new Vector3([nVal[1], -nVal[0], nVal[2]]), this.uv, this.color)
    }

    rotateYZ() {
        const pVal = this.pos.elements
        const nVal = this.norm.elements
        return new Vertex(new Vector3([pVal[0], pVal[2], -pVal[1]]), new Vector3([nVal[0], nVal[2], -nVal[1]]), this.uv, this.color)
    }

    scale(x, y, z) {
        const pVal = this.pos.elements
        const nVal = this.norm.elements
        return new Vertex(new Vector3([x * pVal[0], y * pVal[1], z * pVal[2]]), new Vector3([Math.sign(x) * nVal[0], Math.sign(y) * nVal[1], Math.sign(z) * nVal[2]]), this.uv, this.color)
    }

    changeNormal(normal) {
        return new Vertex(this.pos, normal.normalize(), this.uv, this.color) 
    }

    changeColor(color) {
        return new Vertex(this.pos, this.norm, this.uv, color)
    }

    translate(transVector) {
        return new Vertex(this.pos.add(transVector), this.norm, this.uv, this.color)
    }

    bake(modelMatrix, orientMatrix) {
        return new Vertex(modelMatrix.multiplyVector3(this.pos), orientMatrix.multiplyVector3(this.norm), this.uv, this.color)
    }
}

class Model {
    static wallTexture = null
    static gemTexture = null

    constructor(pos, scale, color, rot, shader, verteces) {
        this.pos = new Vector3(pos)
        this.basePos = new Vector3(pos)
        this.rot = rot
        this.baseRot = rot
        this.scale = scale
        this.verteces = verteces.map(v => v.changeColor(color))

        this.buffer = null
        this.bufferUpdated = false
        this.texture = null
        this.shader = shader

        this.diffuse = 1.0
        this.specular = 0.4
        this.ambient = 0.1
        this.shininess = 80.0
    }

    getVertexCount() {
        return this.verteces.length
    }

    setVerteces(newVerteces) {
        this.verteces = newVerteces
        this.bufferUpdated = false
    } 

    concatModel(other) {
        this.verteces = this.verteces.concat(other.getBakedVerteces())
        this.bufferUpdated = false
    }

    clearVerteces() {
        this.verteces = []
        this.bufferUpdated = false
    }

    loadTextures(gl) {
        if (Model.wallTexture === null) {
            Model.wallTexture = generateTexture(gl, GRANITE_PATH)
        }
        if (Model.gemTexture === null) {
            Model.gemTexture = generateTexture(gl, AMETHYST_PATH)
        }

        if (this.texture === null) {
            this.texture = Model.wallTexture
        }
    }

    initialize(gl) {
        this.loadTextures(gl)
        this.shader.initialize(gl)
        gl.useProgram(this.shader.program)

        this.buffer = gl.createBuffer()
    }

    render(gl, camera, light) {
        if (this.buffer === null) {
            this.initialize(gl)
        }

        gl.useProgram(this.shader.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        if (!this.bufferUpdated) {
            gl.bufferData(gl.ARRAY_BUFFER, this.shader.getVertexData(this.verteces), gl.STATIC_DRAW)
            this.bufferUpdated = true
        }
        this.shader.setVertexArray(gl)

        this.shader.bindVariables(gl, this, camera, light)
        gl.drawArrays(gl.TRIANGLES, 0, this.getVertexCount())
    }

    update(delta) {}

    moveTo(newRotation, newPosition) {
        this.pos = this.basePos.add(newPosition)
        this.rot = this.baseRot.multiply(newRotation)
    }

    getModelMatrix(position, orientMatrix) {
        let M = new Matrix4()
        M.translate(position[0],position[1],position[2])
        M.scale(this.scale, this.scale, this.scale)
        M.multiply(orientMatrix)
        return M
    }

    getOrientMatrix() {
        return this.rot.getRotationMatrix()
    }

    getBakedVerteces() {
        const orientMatrix = this.getOrientMatrix()
        const modelMatrix = this.getModelMatrix(this.pos.elements, orientMatrix)
        return this.verteces.map(vertex => vertex.bake(modelMatrix, orientMatrix))
    }
}

class Cube extends Model {

    static FACES = [Cube.generateFace(SCALE,  0, false, 0, 1, 0, 1),
                    Cube.generateFace(SCALE,  0, true,  0, 1, 0, 1),
                    Cube.generateFace(SCALE,  1, false, 0, 1, 0, 1),
                    Cube.generateFace(SCALE,  1, true,  0, 1, 0, 1),
                    Cube.generateFace(SCALE, -1, false, 0, 1, 0, 1),
                    Cube.generateFace(SCALE, -1, true,  0, 1, 0, 1)]
    static VERTS = Cube.FACES.flat(2)

    constructor(pos, scale, color, rotation=new Quaternion(1,0,0,0), shader=new LightShader()) {
        super(pos, scale, color, rotation, shader, Cube.VERTS)
    }

    //generates all the vertex data for a single square face. 
    //direction: number whose sign tells you how to rotate the face. -1 is top/bottom, 0 is front/back, 1 is left/right
    //flip: boolean that indicates whether the face should be flipped before being rotated. e.g. false is front, true is back 
    static generateFace(scale, direction, flip, uleft, uright, vtop, vbottom) {
        const z = flip ? -1 : 1
        const trueleft = flip ? uright : uleft
        const trueright = flip ? uleft : uright
        let normal = [0,0,z]
        let verteces = [new Vertex(new Vector3([-scale, -scale, z * scale]), new Vector3([0, 0, z]), [trueleft,  vbottom]),
                        new Vertex(new Vector3([-scale,  scale, z * scale]), new Vector3([0, 0, z]), [trueleft,  vtop]),
                        new Vertex(new Vector3([ scale, -scale, z * scale]), new Vector3([0, 0, z]), [trueright, vbottom]),
                        new Vertex(new Vector3([-scale,  scale, z * scale]), new Vector3([0, 0, z]), [trueleft,  vtop]),
                        new Vertex(new Vector3([ scale,  scale, z * scale]), new Vector3([0, 0, z]), [trueright, vtop]),
                        new Vertex(new Vector3([ scale, -scale, z * scale]), new Vector3([0, 0, z]), [trueright, vbottom])]
        if (direction > 0) {
            verteces = verteces.map(v => v.rotateXZ())
        } else if (direction < 0) {
            verteces = verteces.map(v => v.rotateYZ())
        }
        return verteces
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
        return new Vertex(new Vector3([SCALE * x, (SCALE * height) + offset, SCALE * z]), new Vector3([x, height, z]), [1, 0]) //TODO: Circle UV
    })
}

class Cylinder extends Model {
    static SEGMENT = 30
    static VERTS = Cylinder.generateCylinder().flat(2)

    constructor(pos, scale, color, rotation=new Quaternion(1,0,0,0), shader=new LightShader()) {
        super(pos, scale, color, rotation, shader, Cylinder.VERTS)
    }

    static generateCylinder() {
        const angleVs = generateCircle(0, SCALE, this.SEGMENT)
        let triangles = []
        let topcenter = new Vertex(new Vector3([0,SCALE,0]),new Vector3([0,1,0]), [1,0]) //TODO: Cylinder UV
        let bottomcenter = topcenter.scale(1,-1,1)
        for (let i = 0; i < this.SEGMENT; i++) {
            let v1top = angleVs[i]
            let v2top = angleVs[Math.mod(i-1,this.SEGMENT)]
            let v1bot = v1top.scale(1,-1,1)
            let v2bot = v2top.scale(1,-1,1)

            triangles.push([v1top, v1bot, v2bot])
            triangles.push([v1top, v2bot, v2top])
            triangles.push([v1top.changeNormal(new Vector3([0,1,0])), v2top.changeNormal(new Vector3([0,1,0])), topcenter])
            triangles.push([v1bot.changeNormal(new Vector3([0,-1,0])), v2bot.changeNormal(new Vector3([0,-1,0])), bottomcenter])
        }
        return triangles
    }
}

class Sphere extends Model {
    static R_SEGMENT = 40
    static H_SEGMENT = 40
    static VERTS = Sphere.generateSphere().flat(2)

    constructor(pos, scale, color, rotation=new Quaternion(1,0,0,0), shader=new LightShader()) {
        super(pos, scale, color, rotation, shader, Sphere.VERTS)
        this.rot = rotation
    }

    static generateSphere() {
        const circles = new Array(Sphere.H_SEGMENT).fill(0).map((x,i) => {
            return generateCircle(i / Sphere.H_SEGMENT, 0, Sphere.R_SEGMENT)
        })
        circles.push(generateCircle((1 - (1 / (2 * Sphere.H_SEGMENT))), 0, Sphere.R_SEGMENT))
        const top = new Vertex(new Vector3([0, SCALE, 0]), new Vector3([0, 1, 0]), [1, 0]) //TODO: Circle UV
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
