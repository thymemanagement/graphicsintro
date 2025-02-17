const FRAMERATE = 60
const globalWorld = new World(new Light([0,1,0.3]), new Camera([-30,0,70]), [], new Skeleton())
let averageFPS = 0

function tick(gl, programs, oldTime) {
    return (function () {
        if (!globalWorld.stopped) {
            const newTime = Date.now()
            const delta = (newTime - oldTime) / 1000
            globalWorld.manageInputs()
            globalWorld.update(delta)
            globalWorld.render(gl, programs)
            if (averageFPS === 0 || Math.trunc(newTime/1000) % 10 === 0) {
                averageFPS = 1 / delta
            } else {
                averageFPS = (averageFPS + (1 / delta)) / 2
                document.getElementById("fpscount").innerHTML = (Math.round(1000 * averageFPS) / 1000) + ""
            }
            requestAnimationFrame(tick(gl, programs, newTime))
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
        let position = new Vector3([x,y,-2])
        let cameraM = globalWorld.camera.getCameraRotation()
        let newPos = cameraM.multiplyVector3(position).add(globalWorld.camera.physics.pos).elements
        let rotateQ = Quaternion.fromYawPitchRoll(degreeToRad(yaw.value), degreeToRad(pitch.value), degreeToRad(roll.value))

        let model = null
        if (shape_picker.shape === "square") {
            model = new Cube(newPos, size.value / 60, color, rotateQ)
            model.shaderType = 'texture'
            model.texture = Model.gemTexture
        } else if (shape_picker.shape === "triangle") {
            model = new Cylinder(newPos, size.value / 60, color, rotateQ)
        } else if (shape_picker.shape === "circle") {
            model = new Sphere(newPos, size.value / 60, color, rotateQ)
        }
        globalWorld.addModel(model)
    }
}

function main() {
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

    loadWebGL(canvas, tick)
}