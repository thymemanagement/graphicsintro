GRID_SIZE = 200

const WALLS = new Array(GRID_SIZE).fill(new Array(GRID_SIZE).fill(0)).map((xs,z) => xs.map((a,x) => Math.trunc(5 * (-2 + Math.cos(1.37 * ((2 * Math.PI * x)/ GRID_SIZE))) + 5 * (1 + Math.sin(0.56 * ((2 * Math.PI * z)/ GRID_SIZE))) + rand())))

function rand() {
    return Math.trunc(10 * Math.pow(Math.random(),2))
}
