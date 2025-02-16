const WALLS = new Array(64).fill(new Array(64).fill(0)).map((xs,z) => xs.map((a,x) => Math.abs(x - 32) + Math.abs(z - 32) + rand()))

function rand() {
    return Math.trunc(10 * Math.pow(Math.random(),2))
}
