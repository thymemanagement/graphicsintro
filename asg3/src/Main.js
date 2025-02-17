const FRAMERATE = 60
const globalWorld = new World(new Light([0,1,0.3]), new Camera([-30,0.5,70]), [], new Skeleton([-30.5,-0.5,67]))
let averageFPS = 0

function tick(gl, programs, oldTime) {
    return (function () {
        if (!globalWorld.stopped) {
            const newTime = Date.now()
            requestAnimationFrame(tick(gl, programs, newTime))
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

        if (shape_picker.shape === "animal") {
            newPos[1] = -0.5
            globalWorld.skeleton.pos = newPos
        } else {
            let model = null
            if (shape_picker.shape === "gem") {
                model = new Cube(newPos, size.value / 60, color, rotateQ)
                model.shaderType = 'texture'
                model.texture = Model.gemTexture
            } else if (shape_picker.shape === "square") {
                model = new Cube(newPos, size.value / 60, color, rotateQ)
            } else if (shape_picker.shape === "triangle") {
                model = new Cylinder(newPos, size.value / 60, color, rotateQ)
            } else if (shape_picker.shape === "circle") {
                model = new Sphere(newPos, size.value / 60, color, rotateQ)
            }
            globalWorld.addModel(model)
        }   
    }
}

function main() {
    const canvas = document.getElementById("mainCanvas")

    let shape_picker = {shape: "gem"}

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

    const gem = document.getElementById('gemButton')
    gem.onclick = function () { shape_picker.shape = "gem"}
    const square = document.getElementById('squareButton')
    square.onclick = function () { shape_picker.shape = "square" }
    const triangle = document.getElementById('triangleButton')
    triangle.onclick = function () { shape_picker.shape = "triangle" }
    const circle = document.getElementById('circleButton')
    circle.onclick = function () { shape_picker.shape = "circle" }
    const animal = document.getElementById('animalButton')
    animal.onclick = function () { shape_picker.shape = "animal" }

    const hideanimal = document.getElementById('hideanimal')
    hideanimal.onclick = function () {
        globalWorld.showanimal = !globalWorld.showanimal
    }

    document.getElementById("blocks").innerHTML = block_count

    createCapybara()

    loadWebGL(canvas, tick)
}

function createCapybara() {
    const bodyModel = new Cylinder([0,0,0], 0.3, [0x60 / 255, 0x30 / 255, 0x10 / 255], Quaternion.fromYawPitchRoll(degreeToRad(-90), degreeToRad(90), 0))
    const buttModel = new Sphere([0,0,-0.3], 0.3, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    const chestModel = new Sphere([0,0,0.3], 0.3, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    
    const jointModel = new Cylinder([0,0,0], 0.04, [1,0.3,0.5], Quaternion.fromYawPitchRoll(0, degreeToRad(90), 0))
    const secondModel = new Cube([0,0,0], 0.04, [0.4,0.8,0.1])
    const center = globalWorld.skeleton.centerJoint
    center.attachModel(bodyModel)
    center.attachModel(buttModel)
    center.attachModel(chestModel)

    const chest = new Bone(0.3,0,0,0)
    center.attachJoint(chest)

    const butt = new Bone(-0.3,0,0,0)
    center.attachJoint(butt)
1
    const tailModel = new Cube([0,0,0], 0.04, [0x60 / 255, 0x30 / 255, 0x10 / 255])

    const tail1 = new Bone(0.6,180,0,0)
    tail1.attachModel(tailModel)
    center.attachJoint(tail1)

    const tail2 = new Bone(0.1,0,30,0)
    tail2.attachModel(tailModel)
    tail1.attachJoint(tail2)

    const headModel = new Sphere([0,0,0], 0.22, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    const snoutModel = new Cube([0,0,0.2], 0.14, [0x60 / 255, 0x30 / 255, 0x10 / 255])
    const leftEyeModel = new Sphere([0.13,0.13,0.13], 0.03, [0,0,0])
    const rightEyeModel = new Sphere([-0.13,0.13,0.13], 0.03, [0,0,0])

    const head = new Bone(0.4,0,-60,0)
    head.attachModel(headModel)
    head.attachModel(snoutModel)
    head.attachModel(leftEyeModel)
    head.attachModel(rightEyeModel)
    chest.attachJoint(head)

    const legModel = new Cylinder([0,-0.4,0], 0.1, [0x60 / 255, 0x30 / 255, 0x10 / 255])

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
}