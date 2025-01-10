//zero vector
const zeroV = new Vector3([0,0,0])

//small class serving as container for various canvas details. Specifically height, width, and canvas context
class CanvasEnv {
    constructor(canvas) {
        this.context = canvas.getContext('2d')
        this.width = canvas.width
        this.height = canvas.height
    }

    //finds the x coordinate of the center of the current canvas
    getCenterX() {
        return Math.floor(this.width / 2)
    }

    //finds the y coordinate of the center of the current canvas
    getCenterY() {
        return Math.floor(this.height / 2)
    }

    //helper method that changes the fill style to a plain text value
    changeColor(color) {
        this.context.fillStyle = color
    }

    //helper method that changes the fill style to an rgb value
    changeColorRGB(r,g,b) {
        this.context.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", 1.0)" 
    }

    //drawVector as described in step 2. Just as a method of CanvasEnv so I can pull canvas info without using global variables.
    drawVector(v, color) {
        this.context.strokeStyle = color
        this.context.beginPath()
        this.context.moveTo(this.getCenterX(), this.getCenterY())
        this.context.lineTo(this.getCenterX() + (v.elements[0] * 20), this.getCenterY() + (-v.elements[1] * 20))
        this.context.stroke()
    }
}

//angleBetween as described in step 7
function angleBetween(v1, v2) {
    const dot = Vector3.dot(v1,v2)
    const mag1 = v1.magnitude()
    const mag2 = v2.magnitude()
    return (Math.acos(dot / (mag1 * mag2)) * 360) / (2 * Math.PI)
}

//fills in the back of the canvas with black
function drawBackground(env) {
    env.changeColorRGB(0,0,0)
    env.context.fillRect(0, 0, env.width, env.height)
} 

//trick to have a draw function that remembers the canvas context
//as opposed to pulling it from the document every time
//this function is called in main() which redefines draw() below with this function's results
function generateDrawFunction(env) {
    return function (v1, v2=zeroV, v3=zeroV, v4=zeroV) {
        drawBackground(env)
        env.drawVector(v1, "red")
        env.drawVector(v2, "blue")
        env.drawVector(v3, "green")
        env.drawVector(v4, "green")
    }
}

let draw = function() {}

//function written for steps 3-4
function handleDrawEvent() {
    x1 = Number(document.getElementById('xcoord1').value)
    y1 = Number(document.getElementById('ycoord1').value)
    x2 = Number(document.getElementById('xcoord2').value)
    y2 = Number(document.getElementById('ycoord2').value)
    draw(new Vector3([x1, y1, 0]), new Vector3([x2, y2, 0]))
}

//function written for steps 5-8
function handleDrawOperationEvent() {
    x1 = Number(document.getElementById('xcoord1').value)
    y1 = Number(document.getElementById('ycoord1').value)
    x2 = Number(document.getElementById('xcoord2').value)
    y2 = Number(document.getElementById('ycoord2').value)
    op = document.getElementById('operation').value
    scalar = Number(document.getElementById('scalar').value)
    v1 = new Vector3([x1, y1, 0])
    v2 = new Vector3([x2, y2, 0])
    v1op = new Vector3([x1, y1, 0])
    v2op = new Vector3([x2, y2, 0])
    switch (op) {
        case 'add':
            v1op.add(v2op)
            draw(v1,v2,v1op)
            break
        case 'sub':
            v1op.sub(v2op)
            draw(v1,v2,v1op)
            break
        case 'mul':
            v1op.mul(scalar)
            v2op.mul(scalar)
            draw(v1,v2,v1op,v2op)
            break
        case 'div':
            v1op.div(scalar)
            v2op.div(scalar)
            draw(v1,v2,v1op,v2op)
            break
        case 'mag':
            console.log("v1 magnitude: " + v1op.magnitude())
            console.log("v2 magnitude: " + v2op.magnitude())
            draw(v1,v2)
            break
        case 'norm':
            v1op.normalize()
            v2op.normalize()
            draw(v1,v2,v1op,v2op)
            break
        case 'angle':
            console.log("Angle: " + angleBetween(v1op,v2op))
            draw(v1,v2)
            break
        case 'cross':
            const area = Vector3.cross(v1op, v2op).magnitude() / 2
            console.log("Area of the triangle: " + area)
            draw(v1,v2)
            break
        default:
            console.log("Unknown operation " + op)
            draw(v1,v2)
    }
}

//main function as described in step 2. Actual drawVector called in draw()
function main() {
    const canvas = document.getElementById('mainCanvas')
    if (!canvas) {
        console.log("Failed to find the canvas. Where's the canvas?")
        return
    }
    env = new CanvasEnv(canvas)
    draw = generateDrawFunction(env)

    draw(new Vector3([2.25,2.25,0]))
}