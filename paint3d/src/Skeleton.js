
class Skeleton extends Model {
    constructor(pos=[0,0,0], scale=1, yaw=0, pitch=0, roll=0) {
        super(pos, [0,0,0], scale, [], [])
        this.setYaw(yaw)
        this.setPitch(pitch)
        this.setRoll(roll)
        this.centerJoint = new Bone(0,0,0,0)
    }

    update(delta) {
       /* const yaw = document.getElementById("armyawslider")
        const pitch = document.getElementById("armpitchslider")

        this.centerJoint.joints[0].setYaw(new Number(yaw.value))
        this.centerJoint.joints[0].setPitch(new Number(pitch.value))*/
    }

    render(gl, vars) {
        this.centerJoint.render(gl, vars, new Vector3([0,0,1]), new Vector3([0,0,0]))
    }
}

class Bone {
    constructor(length, yaw, pitch, roll) {
        this.length = length
        this.baseRot = {yaw: yaw, pitch: pitch, roll: roll}
        this.newRot = {yaw: 0, pitch: 0, roll: 0}
        this.joints = []
        this.models = []
    }

    //adds an input Bone to the current bone heirarchy
    attachJoint(bone) {
        this.joints.push(bone)
    }

    //adds a model to the position of the current bone
    attachModel(model) {
        this.models.push(model)
    }

    getYaw() {
        return (this.baseRot.yaw + this.newRot.yaw) % 360
    }

    getPitch() {
        return Math.max(-180,Math.min(180,this.baseRot.pitch + this.newRot.pitch))
    }

    getRoll() {
        return (this.baseRot.roll + this.newRot.roll) % 360
    }

    setYaw(yaw) {
        this.newRot.yaw = yaw
    }

    setPitch(pitch) {
        this.newRot.pitch = pitch
    }

    setRoll(roll) {
        this.newRot.roll = roll
    }

    getBoneDirection() {
        let orientMatrix = this.getOrientMatrix()
        let pos = new Vector3([0,0,1])
        return orientMatrix.multiplyVector3(pos)
    }

    getOrientMatrix() {
        let M = new Matrix4()
        M.rotate(this.getRoll(),0,0,1)
        M.rotate(this.getYaw(),0,1,0)
        M.rotate(this.getPitch(),1,0,0)
        return M
    }

    render(gl, vars, lastDirection, lastVector) {
        let curDirection = this.getBoneDirection()
        let forward = new Vector3([0,0,1])
        let axis = null
        let angle = (Math.acos(Vector3.dot(lastDirection, forward)) * 360) / (2 * Math.PI)
        if (angle === 0) {
            axis = new Vector3([0,1,0]).elements
        } else {
            axis = Vector3.cross(lastDirection, forward).elements
        }
        let rotateM = new Matrix4().setRotate(-angle,axis[0],axis[1],axis[2])
        let newDirection = rotateM.multiplyVector3(curDirection)
        let newVector = newDirection.mul(this.length).add(lastVector)
        let translateM = new Matrix4().translate(newVector.elements[0],newVector.elements[1],newVector.elements[2])

        this.models.forEach(model => model.render(gl, vars, rotateM, translateM))
        this.joints.forEach(joint => joint.render(gl, vars, newDirection, newVector))
    }
}