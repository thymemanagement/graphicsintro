const FORWARD = new Vector3([0,0,1])

class Skeleton extends Model {
    constructor(pos=[0,0,0], scale=1, rotation=new Quaternion(1,0,0,0)) {
        super(pos, scale, [0,0,0], rotation, new LightShader(), [])
        this.centerJoint = new Bone(0,0,0,0)
    }

    update(delta) {
        this.verteces = this.centerJoint.updateBones(new Quaternion(1,0,0,0), new Vector3(0,0,0))
        this.bufferUpdated = false
    }

    /*render(gl, shaders, pvMatrix, halfDir, lightSource) {
        this.centerJoint.render(gl, shaders, pvMatrix, halfDir, lightSource)
    }*/
}

class Bone {
    constructor(length, yaw, pitch, roll) {
        this.length = length
        this.baseRot = Quaternion.fromYawPitchRoll(yaw, pitch, roll)
        this.newRot = new Quaternion(1,0,0,0)
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

    getBoneDirection() {
        let orientMatrix = this.getOrientMatrix()
        let pos = new Vector3([0,0,1])
        return orientMatrix.multiplyVector3(pos)
    }

    getOrientMatrix() {
        return this.getRotation().getRotationMatrix()
    }
    
    getRotation() {
        return this.newRot.multiply(this.baseRot)
    }

    updateBones(lastRotation, lastVector) {
        let newRotation = this.getRotation().multiply(lastRotation)
        let rotateM = newRotation.getRotationMatrix()
        let newVector = rotateM.multiplyVector3(FORWARD).mul(this.length).add(lastVector)

        let newVerteces = this.models.flatMap(model => {
            model.moveTo(new Quaternion(1,0,0,0), newVector)
            return model.getBakedVerteces()
        })
        newVerteces = newVerteces.concat(this.joints.flatMap(joint => joint.updateBones(newRotation, newVector)))
        return newVerteces
    }

    render(gl,shaders, pvMatrix, halfDir, lightSource) {
        this.models.forEach(model => model.render(gl, shaders, pvMatrix, halfDir, lightSource))
        this.joints.forEach(joint => joint.render(gl, shaders, pvMatrix, halfDir, lightSource))
    }
}