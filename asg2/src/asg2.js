const VSHADER_SRC = 
"attribute vec4 a_Vertex;\n" +
"uniform mat4 u_modelMatrix;\n" +
"void main() {\n" +
" gl_Position = u_modelMatrix * a_Vertex;\n" + 
" ;\n" +
"}\n"

const FSHADER_SRC = 
"precision mediump float;\n" +
"uniform vec4 u_FragColor;\n" + 
"void main() {\n" +
" gl_FragColor = u_FragColor;\n" + 
"}\n"

const TRIANGLE = new Float32Array([0, 0.1, -0.1, -0.1, 0.1, -0.1])
const SQUARE = new Float32Array([-0.1, 0.1, -0.1, -0.1, 0.1, -0.1, 0.1, 0.1, -0.1, 0.1, 0.1, -0.1])

function generateCircle(segCount) {
    let angle = (2 * Math.PI) / segCount
    let angles = [0]
    for (i = 1; i < segCount; i++) {
        angles.push((2 * Math.PI) - (angle * i))
    }
    verteces = []
    for (a in angles) {
        if (a == 0) {
            verteces = verteces.concat([0,0,
                0.1 * Math.cos(angles[segCount - 1]),0.1 * Math.sin(angles[segCount - 1]),
                0.1 * Math.cos(angles[a]), 0.1 * Math.sin(angles[a])])
        } else {
             verteces = verteces.concat([0,0,
                0.1 * Math.cos(angles[a]),0.1 * Math.sin(angles[a]),
                0.1 * Math.cos(angles[a-1]), 0.1 * Math.sin(angles[a-1])])
        }
    }
    return new Float32Array(verteces)
}

class Point {
    constructor(x, y, r, g, b, size, segments, shape) {
        this.x = x
        this.y = y
        this.r = r
        this.g = g
        this.b = b
        this.size = size
        this.segments = segments
        this.shape = shape
    }

}

function generateModelMatrix(s, xtrans, ytrans) {
    return new Matrix4().translate(xtrans,ytrans,0).scale(s, s, satisfies)
}

function main() {
    const env = setupWebGL()
    const vars = connectVariablesToGLSL(env.gl, VSHADER_SRC, FSHADER_SRC)

    let gl_points = []
    let shape_picker = {shape: "square"}
    env.canvas.onmousedown = function(ev) { 
        click(ev, env.gl, env.canvas, vars, gl_points, shape_picker)
    }
    env.canvas.onmousemove = function(ev) { 
        click(ev, env.gl, env.canvas, vars, gl_points, shape_picker)
    }

    const clear = document.getElementById('clearButton')
    clear.onclick = function () { clearCanvas(env.gl, env.canvas, vars, shape_picker) }

    const square = document.getElementById('squareButton')
    square.onclick = function () { shape_picker.shape = "square" }
    const triangle = document.getElementById('triangleButton')
    triangle.onclick = function () { shape_picker.shape = "triangle" }
    const circle = document.getElementById('circleButton')
    circle.onclick = function () { shape_picker.shape = "circle" }

    const draw = document.getElementById('drawButton')
    draw.onclick = function () { drawMyPicture(env.gl, env.canvas, vars, shape_picker) }
}

function setupWebGL() {
    const canvas = document.getElementById("mainCanvas")
    const gl = getWebGLContext(canvas)
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return {canvas: canvas, gl: gl}
}

function connectVariablesToGLSL(gl, vshader, fshader) {
    if (!initShaders(gl, vshader, fshader)) {
        console.log("shaders failed to load")
    }

    const u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix')
    const a_Vertex = gl.getAttribLocation(gl.program, 'a_Vertex')
    const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')

    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

    gl.vertexAttribPointer(a_Vertex, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(a_Vertex)

    return {u_modelMatrix: u_modelMatrix, u_FragColor: u_FragColor, vbuffer: vertexBuffer}
}

function renderAllShapes(gl, vars, points) {
    gl.clear(gl.COLOR_BUFFER_BIT)

    for (p in points) {
        let point = points[p]
        let mMatrix = generateModelMatrix(point.x, point.y, point.size)
        gl.uniformMatrix4fv(vars.u_modelMatrix, false, mMatrix.elements)
        gl.uniform4f(vars.u_FragColor, point.r, point.g, point.b, 1.0)
        if (point.shape === "triangle") {
            gl.bufferData(gl.ARRAY_BUFFER, TRIANGLE, gl.STATIC_DRAW)
        } else if (point.shape === "square") {
            gl.bufferData(gl.ARRAY_BUFFER, SQUARE, gl.STATIC_DRAW)
        } else if (point.shape === "circle") {
            gl.bufferData(gl.ARRAY_BUFFER, generateCircle(point.segments / 3), gl.STATIC_DRAW)
        }
        gl.drawArrays(gl.TRIANGLES, 0, point.segments)
    }
}

function click(ev, gl, canvas, vars, points, shape_picker) {
    if (ev.buttons !== 1) return
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect() ;
  
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    red = document.getElementById("redslider")
    green = document.getElementById("greenslider")
    blue = document.getElementById("blueslider")
    size = document.getElementById("sizeslider")
    segment = document.getElementById("segmentslider")

    let segCount = 0
    if (shape_picker.shape === "square") {
        segCount = 6
    } else if (shape_picker.shape === "triangle") {
        segCount = 3
    } else {
        segCount = segment.value * 3
    }

    let point = new Point(x,y,red.value / 255, green.value / 255 , blue.value / 255, size.value / 6, segCount, shape_picker.shape)
    points.push(point);
    renderAllShapes(gl, vars, points)
}

function clearCanvas(gl, canvas, vars, shape_picker) {
    let new_points = []
    canvas.onmousedown = function(ev) { 
        click(ev, gl, canvas, vars, new_points, shape_picker)
    }
    canvas.onmousemove = function(ev) { 
        click(ev, gl, canvas, vars, new_points, shape_picker)
    }
    gl.clear(gl.COLOR_BUFFER_BIT)
}

const myPicture = [
    new Point(-0.04,0.23,0,0,1,4.166666666666667,3, "triangle"),
    new Point(-0.405,-0.18,0.49411764705882355,0,1,2.8333333333333335,3, "triangle"),
    new Point(-0.06,-0.165,0.49411764705882355,0,1,2.8333333333333335,3, "triangle"),
    new Point(0.28,-0.175,0.49411764705882355,0,1,2.8333333333333335,3, "triangle"),
    new Point(-0.555,-0.575,1,0,1,1.3333333333333333,3, "triangle"),
    new Point(-0.05,-0.565,1,0,1,1.3333333333333333,3, "triangle"),
    new Point(0.455,-0.58,1,0,1,1.3333333333333333,3, "triangle"),
    new Point(-0.565,-0.755,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(-0.57,-0.82,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(-0.575,-0.89,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(-0.07,-0.74,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(-0.085,-0.81,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(-0.09,-0.87,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(0.465,-0.755,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(0.46,-0.825,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(0.46,-0.905,1,0,0,0.3333333333333333,3, "triangle"),
    new Point(0.145,0.255,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(0.245,0.115,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(0.28,0.005,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(0.395,-0.185,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(-0.175,0.325,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(-0.23,0.155,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(-0.355,0.03,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(-0.485,-0.14,0.3568627450980392,1,0,0.3333333333333333,3, "triangle"),
    new Point(0.365,0.73,0,1,0,0.6666666666666666,3, "triangle"),
    new Point(0.65,0.75,0,1,0,0.6666666666666666,3, "triangle"),
    new Point(0.275,0.495,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle"),
    new Point(0.365,0.425,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle"),
    new Point(0.365,0.42,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle"),
    new Point(0.455,0.365,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle"),
    new Point(0.55,0.365,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle"),
    new Point(0.645,0.38,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle"),
    new Point(0.72,0.43,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle"),
    new Point(0.81,0.48,0.2,0.6352941176470588,0.48627450980392156,0.6666666666666666,3, "triangle")
  ]

  function drawMyPicture(gl, canvas, vars, shape_picker) {
    console.log("I tried :(") 
    let new_points = [...myPicture]
    canvas.onmousedown = function(ev) { 
        click(ev, gl, canvas, vars, new_points, shape_picker)
    }
    canvas.onmousemove = function(ev) { 
        click(ev, gl, canvas, vars, new_points, shape_picker)
    }
    renderAllShapes(gl, vars, new_points)
}