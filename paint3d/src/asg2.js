const VSHADER_SRC = 
"attribute vec4 a_Position;\n" +
"attribute vec4 a_Normal;\n" +
"uniform mat4 u_cameraMatrix;\n" +
"uniform mat4 u_projectionMatrix;\n" +
"uniform mat4 u_orientMatrix;\n" +
"uniform mat4 u_modelMatrix;\n" +
"varying vec4 v_Normal;\n" +
"void main() {\n" +
" gl_Position = u_projectionMatrix * u_cameraMatrix * u_modelMatrix * a_Position;\n" + 
" v_Normal = u_orientMatrix * a_Normal;\n" +
"}\n"

const FSHADER_SRC = 
"precision mediump float;\n" +
"uniform vec4 u_lightSource;\n" + 
"uniform vec3 u_FragColor;\n" + 
"varying vec4 v_Normal;\n" + 
"void main() {\n" +
" float ratio = max(dot(v_Normal, u_lightSource), 0.2);\n" +
" gl_FragColor = vec4(ratio * u_FragColor, 1.0);\n" + 
"}\n"

const FRAMERATE = 60
const globalWorld = new World(new Light([3,4,5]), new Camera([0,0,1]), [], new Skeleton())
let fpscount = null
let averageFPS = 0

function setupWebGL() {
    const canvas = document.getElementById("mainCanvas")
    const gl = getWebGLContext(canvas)
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
    return {canvas: canvas, gl: gl}
}

function connectVariablesToGLSL(gl, vshader, fshader) {
    if (!initShaders(gl, vshader, fshader)) {
        console.log("shaders failed to load")
    }
    let vars = {}

    vars.a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    vars.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal')
    vars.u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix')
    vars.u_cameraMatrix = gl.getUniformLocation(gl.program, 'u_cameraMatrix')
    vars.u_projectionMatrix = gl.getUniformLocation(gl.program, 'u_projectionMatrix')
    vars.u_orientMatrix = gl.getUniformLocation(gl.program, 'u_orientMatrix')

    vars.u_lightSource = gl.getUniformLocation(gl.program, 'u_lightSource')
    vars.u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')

    vars.vertexBuffer = gl.createBuffer()
    vars.normalBuffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, vars.vertexBuffer)

    gl.vertexAttribPointer(vars.a_Position, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vars.a_Position)

    gl.bindBuffer(gl.ARRAY_BUFFER, vars.normalBuffer)

    gl.vertexAttribPointer(vars.a_Normal, 3, gl.FLOAT, true, 0, 0)
    gl.enableVertexAttribArray(vars.a_Normal)

    return vars
}

function tick(gl, vars, oldTime) {
    return (function () {
        if (!globalWorld.stopped) {
            const newTime = Date.now()
            const delta = (newTime - oldTime) / 1000
            globalWorld.update(delta)
            globalWorld.render(gl, vars)
            if (averageFPS === 0) {
                averageFPS = 1 / delta
            } else {
                averageFPS = (averageFPS + (1 / delta)) / 2
                fpscount.innerHTML = (Math.round(1000 * averageFPS) / 1000) + ""
            }
            setTimeout(tick(gl, vars, newTime), 1000 / FRAMERATE)
        }
    })
}

function clearCanvas(gl) {
    globalWorld.clearModels()
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
}

function click(ev, gl, canvas, vars, shape_picker) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect() ;

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    globalWorld.newX = x
    globalWorld.newY = y
    if (ev.buttons !== 1) {
        globalWorld.lastX = x
        globalWorld.lastY = y
    } else if (ev.shiftKey) {
        globalWorld.lastX = x
        globalWorld.lastY = y
        red = document.getElementById("redslider")
        green = document.getElementById("greenslider")
        blue = document.getElementById("blueslider")
        size = document.getElementById("sizeslider")
        yaw = document.getElementById("yawslider")
        pitch = document.getElementById("pitchslider")
        roll = document.getElementById("rollslider")
        let color = [red.value / 255, green.value / 255 , blue.value / 255]
        let position = new Vector3([x,y,0])
        let cameraM = globalWorld.camera.getCameraRotation()
        let newPos = cameraM.multiplyVector3(position).elements

        let model = null
        if (shape_picker.shape === "square") {
            model = new Cube(newPos, size.value / 6, yaw.value, pitch.value, roll.value, color)
        } else if (shape_picker.shape === "triangle") {
            model = new Cylinder(newPos, size.value / 6, yaw.value, pitch.value, roll.value, color)
        } else if (shape_picker.shape === "circle") {
            model = new Sphere(newPos, size.value / 6, yaw.value, pitch.value, roll.value, color)
        }
        globalWorld.addModel(model)
    }
}

function main() {
    const env = setupWebGL()
    const vars = connectVariablesToGLSL(env.gl, VSHADER_SRC, FSHADER_SRC)

    const bodyModel = new Cylinder([0,0,0], 3, 0, 90, 0, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    const buttModel = new Sphere([0,0,-0.3], 3, 0, 0, 0, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    const chestModel = new Sphere([0,0,0.3], 3, 0, 0, 0, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    
    const jointModel = new Cylinder([0,0,0], 0.4, 0, 90, 0, [1,0.3,0.5])
    const secondModel = new Cube([0,0,0], 0.4, 0, 0, 0, [0.4,0.8,0.1])
    const center = globalWorld.skeleton.centerJoint
    center.attachModel(bodyModel)
    center.attachModel(buttModel)
    center.attachModel(chestModel)

    const chest = new Bone(0.3,0,0,0)
    center.attachJoint(chest)

    const butt = new Bone(-0.3,0,0,0)
    center.attachJoint(butt)
1
    const tailModel = new Cube([0,0,0], 0.4, 0, 0, 0, [0x60 / 255, 0x30 / 255, 0x10 / 255])

    const tail1 = new Bone(0.6,180,0,0)
    tail1.attachModel(tailModel)
    center.attachJoint(tail1)

    const tail2 = new Bone(0.1,0,30,0)
    tail2.attachModel(tailModel)
    tail1.attachJoint(tail2)

    const headModel = new Sphere([0,0,0], 2.2, 0, 0, 0, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    const snoutModel = new Cube([0,0,0.2], 1.4, 0, 0, 0, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    const leftEyeModel = new Sphere([0.13,0.13,0.13], 0.3, 0, 0, 0, [0,0,0])
    const rightEyeModel = new Sphere([-0.13,0.13,0.13], 0.3, 0, 0, 0, [0,0,0])

    const head = new Bone(0.4,0,-60,0)
    head.attachModel(headModel)
    head.attachModel(snoutModel)
    head.attachModel(leftEyeModel)
    head.attachModel(rightEyeModel)
    chest.attachJoint(head)

    const legModel = new Cylinder([0,-0.4,0], 1, 0, 0, 0, [0x60 / 255, 0x30 / 255, 0x10 / 255])

    const leftarm1 = new Bone(0.2,90,0,0)
    leftarm1.attachModel(legModel)
    chest.attachJoint(leftarm1)

    const leftarm2 = new Bone(0.2,0,-90,0)
    leftarm2.attachModel(legModel)
    leftarm1.attachJoint(leftarm2)

    const rightarm1 = new Bone(0.2,-90,0,0)
    rightarm1.attachModel(legModel)
    chest.attachJoint(rightarm1)

    const rightarm2 = new Bone(0.2,0,-90,0)
    rightarm2.attachModel(legModel)
    rightarm1.attachJoint(rightarm2)

    const leftleg1 = new Bone(0.2,90,0,0)
    leftleg1.attachModel(legModel)
    butt.attachJoint(leftleg1)

    const leftleg2 = new Bone(0.2,0,-90,0)
    leftleg2.attachModel(legModel)
    leftleg1.attachJoint(leftleg2)

    const rightleg1 = new Bone(0.2,-90,0,0)
    rightleg1.attachModel(legModel)
    butt.attachJoint(rightleg1)

    const rightleg2 = new Bone(0.2,0,-90,0)
    rightleg2.attachModel(legModel)
    rightleg1.attachJoint(rightleg2)

    globalWorld.skeleton.centerJoint

    let shape_picker = {shape: "square"}
    env.canvas.onmousedown = function(ev) { 
        click(ev, env.gl, env.canvas, vars, shape_picker)
    }
    env.canvas.onmousemove = function(ev) { 
        click(ev, env.gl, env.canvas, vars, shape_picker)
    }

    const clear = document.getElementById('clearButton')
    clear.onclick = function () { clearCanvas(env.gl) }
    const stop = document.getElementById('stopButton')
    stop.onclick = function () { 
        globalWorld.stopped = !globalWorld.stopped
        setTimeout(tick(env.gl, vars, Date.now()), 1000 / FRAMERATE)
    }
    const remove = document.getElementById('removeButton')
    remove.onclick = function () { globalWorld.seeSkeleton = !globalWorld.seeSkeleton }

    fpscount = document.getElementById("fpscount")

    env.canvas.onwheel = function (ev) {
        if (ev.deltaY < 0) {
            globalWorld.camera.zoom = Math.max((globalWorld.camera.zoom - 0.5), 0)
        } else if (ev.deltaY > 0) {
            globalWorld.camera.zoom = Math.min((globalWorld.camera.zoom + 0.5), 10)
        }
    }

    const square = document.getElementById('squareButton')
    square.onclick = function () { shape_picker.shape = "square" }
    const triangle = document.getElementById('triangleButton')
    triangle.onclick = function () { shape_picker.shape = "triangle" }
    const circle = document.getElementById('circleButton')
    circle.onclick = function () { shape_picker.shape = "circle" }
    setTimeout(tick(env.gl, vars, Date.now()), 1000 / FRAMERATE)

    
}