GRID_SIZE = 20

const WALLS = new Array(GRID_SIZE).fill(new Array(GRID_SIZE).fill(0)).map((xs,z) => xs.map((a,x) => rand()))

function rand() {
    return Math.trunc(20 * Math.pow(Math.random(),2))
}
