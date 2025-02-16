const VSHADER_SRC = 
"attribute vec4 a_Position;\n" +
"attribute vec4 a_Normal;\n" +
"attribute vec2 a_UV;\n" +
"uniform mat4 u_viewMatrix;\n" +
"uniform mat4 u_projectionMatrix;\n" +
"uniform mat4 u_orientMatrix;\n" +
"uniform mat4 u_modelMatrix;\n" +
"varying vec4 v_Normal;\n" +
"varying vec2 v_UV;\n" +
"void main() {\n" +
" gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * a_Position;\n" + 
" v_Normal = u_orientMatrix * a_Normal;\n" +
" v_UV = a_UV;\n" +
"}\n"

const FSHADER_SRC = 
"precision mediump float;\n" +
"uniform vec4 u_lightSource;\n" + 
"uniform vec3 u_FragColor;\n" + 
"varying vec4 v_Normal;\n" + 
"varying vec2 v_UV;\n" +
"void main() {\n" +
" vec3 left = mix(vec3(1.0,1.0,1.0),vec3(0.0,0.0,0.0),v_UV[1]);\n" +
" vec3 right = mix(u_FragColor, vec3(0.0,0.0,0.0), v_UV[1]);\n" +
" float ratio = max(dot(v_Normal, u_lightSource), 0.2);\n" +
" gl_FragColor = vec4(ratio * mix(left, right, v_UV[0]),1.0);\n" + 
"}\n"

const FRAMERATE = 60
const globalWorld = new World(new Light([3,4,5]), new Camera([0,0,70]), [], new Skeleton())
let averageFPS = 0

function setupWebGL() {
    const canvas = document.getElementById("mainCanvas")
    const gl = getWebGLContext(canvas)
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0.2,0.2,0.7,1.0)
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
    return gl
}

function connectVariablesToGLSL(gl, vshader, fshader) {
    if (!initShaders(gl, vshader, fshader)) {
        console.log("shaders failed to load")
    }
    let vars = {}

    vars.a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    vars.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal')
    vars.a_UV = gl.getAttribLocation(gl.program, 'a_UV')
    vars.u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix')
    vars.u_viewMatrix = gl.getUniformLocation(gl.program, 'u_viewMatrix')
    vars.u_projectionMatrix = gl.getUniformLocation(gl.program, 'u_projectionMatrix')
    vars.u_orientMatrix = gl.getUniformLocation(gl.program, 'u_orientMatrix')

    vars.u_lightSource = gl.getUniformLocation(gl.program, 'u_lightSource')
    vars.u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')

    gl.enableVertexAttribArray(vars.a_Position)
    gl.enableVertexAttribArray(vars.a_Normal)
    gl.enableVertexAttribArray(vars.a_UV)

    return vars
}

async function loadWebGL() {
    const mainVert = await fetch("https://thymemanagement.github.io/graphicsintro/asg3/assets/main.vert")
        .then(response => response.text())
    const uvFrag = await fetch("https://thymemanagement.github.io/graphicsintro/asg3/assets/uv.frag")
        .then(response => response.text())

    const gl = setupWebGL()
    const vars = connectVariablesToGLSL(gl, mainVert, uvFrag)

    const stop = document.getElementById('stopButton')
    stop.onclick = function () { 
        globalWorld.stopped = !globalWorld.stopped
        setTimeout(tick(gl, vars, Date.now()), 1000 / FRAMERATE)
    }

    setTimeout(tick(gl, vars, Date.now()), 1000 / FRAMERATE)
}

function tick(gl, vars, oldTime) {
    return (function () {
        if (!globalWorld.stopped) {
            const newTime = Date.now()
            const delta = (newTime - oldTime) / 1000
            globalWorld.manageInputs()
            globalWorld.update(delta)
            globalWorld.render(gl, vars)
            if (averageFPS === 0 || Math.trunc(newTime/1000) % 10 === 0) {
                averageFPS = 1 / delta
            } else {
                averageFPS = (averageFPS + (1 / delta)) / 2
                document.getElementById("fpscount").innerHTML = (Math.round(1000 * averageFPS) / 1000) + ""
            }
            requestAnimationFrame(tick(gl, vars, newTime))
        }
    })
}

function clearCanvas() {
    globalWorld.clearModels()
}

function click(ev, canvas, shape_picker) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect() ;

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    globalWorld.inputs.newX = x
    globalWorld.inputs.newY = y
    if (ev.buttons !== 1) {
        globalWorld.inputs.lastX = x
        globalWorld.inputs.lastY = y
    } else if (ev.shiftKey) {
        globalWorld.inputs.lastX = x
        globalWorld.inputs.lastY = y
        red = document.getElementById("redslider")
        green = document.getElementById("greenslider")
        blue = document.getElementById("blueslider")
        size = document.getElementById("sizeslider")
        yaw = document.getElementById("yawslider")
        pitch = document.getElementById("pitchslider")
        roll = document.getElementById("rollslider")
        let color = [red.value / 255, green.value / 255 , blue.value / 255]
        let position = new Vector3([x+70,y,0])
        let cameraM = globalWorld.camera.getCameraRotation()
        let newPos = cameraM.multiplyVector3(position).elements

        let rotateQ = Quaternion.fromYawPitchRoll(degreeToRad(yaw.value), degreeToRad(pitch.value), degreeToRad(roll.value))

        let model = null
        if (shape_picker.shape === "square") {
            model = new Cube(newPos, size.value / 60, color, rotateQ)
        } else if (shape_picker.shape === "triangle") {
            model = new Cylinder(newPos, size.value / 60, color, rotateQ)
        } else if (shape_picker.shape === "circle") {
            model = new Sphere(newPos, size.value / 60, color, rotateQ)
        }
        globalWorld.addModel(model)
    }
}

function main() {
    loadWebGL()

    const canvas = document.getElementById("mainCanvas")

    let shape_picker = {shape: "square"}

    const clear = document.getElementById('clearButton')
    clear.onclick = function () { clearCanvas() }
    const grounded = document.getElementById('groundedButton')
    grounded.onclick = function () {
        globalWorld.camera.grounded = !globalWorld.camera.grounded
    }

    canvas.onmousedown = function(ev) { 
        click(ev, canvas, shape_picker)
    }
    canvas.onmousemove = function(ev) { 
        click(ev, canvas, shape_picker)
    }
    document.onkeydown = function (ev) {
        globalWorld.inputs[ev.code] = true
    }
    document.onkeyup = function (ev) {
        globalWorld.inputs[ev.code] = false
    }

    const square = document.getElementById('squareButton')
    square.onclick = function () { shape_picker.shape = "square" }
    const triangle = document.getElementById('triangleButton')
    triangle.onclick = function () { shape_picker.shape = "triangle" }
    const circle = document.getElementById('circleButton')
    circle.onclick = function () { shape_picker.shape = "circle" }

    document.getElementById("blocks").innerHTML = block_count
}