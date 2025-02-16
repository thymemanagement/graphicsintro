//why the hell doesn't JS have a proper modulus?????
//taken from https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
Math.mod = function (x, n) {
    "use strict";
    return ((x % n) + n) % n;
  };

class Quaternion {
    constructor(r, i, j, k) {
        this.r = r
        this.i = i
        this.j = j
        this.k = k
    }

    static fromAngleAxis(angle, xaxis, yaxis, zaxis) {
        const norm = Math.sqrt(xaxis * xaxis + yaxis * yaxis + zaxis * zaxis)
        const angleSin = Math.sin(angle/2)
        let r = Math.cos(angle/2) 
        let i = angleSin * (xaxis / norm)
        let j = angleSin * (yaxis / norm)
        let k = angleSin * (zaxis / norm)
        return new Quaternion(r, i, j, k)
    }

    static fromYawPitchRoll(yaw, pitch, roll) {
        const yawQ = Quaternion.fromAngleAxis(yaw, 0, 1, 0)
        const pitchQ = Quaternion.fromAngleAxis(pitch, 1, 0, 0)
        const rollQ = Quaternion.fromAngleAxis(roll, 0, 0, 1)
        return rollQ.multiply(yawQ).multiply(pitchQ)
    }

    rotateByAngleAxis(angle, xaxis, yaxis, zaxis) {
        return Quaternion.fromAngleAxis(angle, xaxis, yaxis, zaxis).multiply(this)
    }

    getAngle() {
        return 2 * Math.acos(this.r)
    }

    getRotationMatrix() {
        let rotMat = new Matrix4()
        let e = rotMat.elements 
        e[0] = 1 - 2 * (this.j * this.j + this.k * this.k); e[4] = 2 * (this.i * this.j - this.k * this.r);     e[8]  = 2 * (this.i * this.k + this.j * this.r);
        e[1] = 2 * (this.i * this.j + this.k * this.r);     e[5] = 1 - 2 * (this.i * this.i + this.k * this.k); e[9]  = 2 * (this.j * this.k - this.i * this.r);
        e[2] = 2 * (this.i * this.k - this.j * this.r);     e[6] = 2 * (this.j * this.k + this.i * this.r);     e[10] = 1 - 2 * (this.i * this.i + this.j * this.j)
        return rotMat
    }

    //returns a new quaternion that is the product of this and another quaternion, multiplied on the right
    multiply(other) {
        return new Quaternion((this.r * other.r) + -(this.i * other.i) + -(this.j * other.j) + -(this.k * other.k),
                              (this.r * other.i) +  (this.i * other.r) +  (this.j * other.k) + -(this.k * other.j),
                              (this.r * other.j) + -(this.i * other.k) +  (this.j * other.r) +  (this.k * other.i),
                              (this.r * other.k) +  (this.i * other.j) + -(this.j * other.i) +  (this.k * other.r))
    }
}

function degreeToRad(degrees) {
    return (Math.mod(degrees,360) * 2 * Math.PI) / 360
}

