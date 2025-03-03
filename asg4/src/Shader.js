class Shader {

    static FragVars =
        "precision mediump float;\n" + 
        "uniform vec3 u_dirLightDir;\n" + 
        "uniform vec3 u_dirLightColor;\n" + 
        "uniform vec3 u_pointLightPos;\n" +
        "uniform vec3 u_pointLightColor;\n" +
        "uniform vec3 u_spotLightPos;\n" +
        "uniform vec3 u_spotLightDir;\n" +
        "uniform vec3 u_spotLightColor;\n" +
        "uniform float u_spotRatio;\n" +
        "uniform vec3 u_ambient;\n" +
        "\n" +
        "uniform vec3 u_cameraPos;\n" +
        "\n" +
        "uniform float u_diffuse;\n" +
        "uniform float u_specular;\n" +
        "uniform float u_shininess;\n"
    

    static BlinnPhong = 
        "vec3 spotLight(vec3 lightPos, vec3 spotDir, vec3 lightColor, float ratio, vec3 color) {\n" +
        "   vec3 lightVector = lightPos - v_Position;\n" +
        "   float distance = dot(lightVector, lightVector);\n" +
        "   vec3 lightDir = normalize(lightVector);\n" +
        "   if (dot(lightDir, spotDir) > ratio) {\n" +
        "       vec3 halfReflect = normalize(lightDir + normalize(u_cameraPos - v_Position));\n" + 
        "       float diffuse = min(u_diffuse * max(dot(v_Normal, lightDir), 0.0), 1.0);\n" +
        "       float specular = min(u_specular * pow(max(dot(v_Normal, halfReflect), 0.0), u_shininess), 1.0);\n" +
        "       \n" +
        "       return (1.0/distance) * (specular + diffuse) * lightColor * color;\n" +
        "   } else {\n" +
        "       return vec3(0.0, 0.0, 0.0);\n" +
        "   }\n" +
        "}\n" +
        "\n" +
        "vec3 pointLight(vec3 lightPos, vec3 lightColor, vec3 color) {\n" +
        "   vec3 lightVector = lightPos - v_Position;\n" +
        "   float distance = dot(lightVector, lightVector);\n" +
        "   vec3 lightDir = normalize(lightVector);\n" +
        "   vec3 halfReflect = normalize(lightDir + normalize(u_cameraPos - v_Position));\n" + 
        "   float diffuse = min(u_diffuse * max(dot(v_Normal, lightDir), 0.0), 1.0);\n" +
        "   float specular = min(u_specular * pow(max(dot(v_Normal, halfReflect), 0.0), u_shininess), 1.0);\n" +
        "   \n" +
        "   return (1.0/distance) * (specular + diffuse) * lightColor * color;\n" +
        "}\n" +
        "\n" +
        "vec3 dirLight(vec3 lightDir, vec3 lightColor, vec3 color) {\n" +
        "   vec3 halfReflect = normalize(lightDir + normalize(u_cameraPos - v_Position));\n" + 
        "   float horizon = 5.0 * max(dot(lightDir,vec3(0.0,-1.0,0.0)), 0.0);\n" +
        "   float diffuse = min(u_diffuse * max(dot(v_Normal, lightDir), 0.0), 1.0);\n" +
        "   float specular = min(u_specular * pow(max(dot(v_Normal, halfReflect), 0.0), u_shininess), 1.0);\n" +
        "   \n" +
        "   return max(specular + diffuse - horizon, 0.0) * lightColor * color;\n" +
        "}\n" +
        "\n" +
        "vec3 light(vec3 color) {\n" +
        "   vec3 dirColor = dirLight(u_dirLightDir, u_dirLightColor, color);\n" +
        "   vec3 pointColor = pointLight(u_pointLightPos, u_pointLightColor, color);\n" +
        "   vec3 spotColor = spotLight(u_spotLightPos, u_spotLightDir, u_spotLightColor, u_spotRatio, color);\n" +
        "   vec3 ambColor = u_ambient * color;\n" +
        "   \n" +
        "   return dirColor + pointColor + spotColor + ambColor;\n" +
        "}\n"

    static MainVert =
        "attribute vec4 a_Position;\n" +
        "attribute vec4 a_Normal;\n" + 
        "attribute vec2 a_UV;\n" +
        "attribute vec3 a_FragColor;\n" +
        "uniform mat4 u_pvMatrix;\n" + 
        "uniform mat4 u_modelMatrix;\n" + 
        "uniform mat4 u_orientMatrix;\n" +
        "varying vec3 v_Position;\n" +
        "varying vec3 v_Normal;\n" +
        "varying vec2 v_UV;\n" + 
        "varying vec3 v_FragColor;\n" +
        "\n" + 
        "void main() {\n" +
        "    vec4 position = u_modelMatrix * a_Position;" +
        "    gl_Position = u_pvMatrix * position;\n" + 
        "    v_Position = vec3(position);\n" + 
        "    v_Normal = vec3(u_orientMatrix * a_Normal);\n" +
        "   v_UV = a_UV;\n" +
        "   v_FragColor = a_FragColor;\n" +
        "}"

    constructor(vshader, fshader) {
        this.vshader = vshader
        this.fshader = fshader
        this.program = null
    }

    getVertexData(verteces) {
        return new Float32Array(verteces.flatMap(v => 
            [v.pos.elements[0], v.pos.elements[1], v.pos.elements[2], 
             v.norm.elements[0], v.norm.elements[1], v.norm.elements[2], 
             v.uv[0], v.uv[1], 
             v.color[0], v.color[1], v.color[2]]))
    }

    setVertexArray(gl) {
        gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, FLOAT_SIZE * 11, FLOAT_SIZE * 0)
        gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, true, FLOAT_SIZE * 11, FLOAT_SIZE * 3)
        gl.vertexAttribPointer(this.a_UV, 2, gl.FLOAT, false, FLOAT_SIZE * 11, FLOAT_SIZE * 6)
        gl.vertexAttribPointer(this.a_FragColor, 3, gl.FLOAT, false, FLOAT_SIZE * 11, FLOAT_SIZE * 8)
    }

    initializeCore(gl) {
        if (this.program !== null) return
        if (!initShaders(gl, this.vshader, this.fshader)) {
            console.log("shaders failed to load: ")
        }
    
        this.program = gl.program
    
        this.u_pvMatrix = gl.getUniformLocation(this.program, 'u_pvMatrix')
        this.u_modelMatrix = gl.getUniformLocation(this.program, 'u_modelMatrix')
        this.u_orientMatrix = gl.getUniformLocation(this.program, 'u_orientMatrix')
    
        this.u_dirLightDir = gl.getUniformLocation(this.program, 'u_dirLightDir')
        this.u_dirLightColor = gl.getUniformLocation(this.program, 'u_dirLightColor')
        this.u_pointLightPos = gl.getUniformLocation(this.program, 'u_pointLightPos')
        this.u_pointLightColor = gl.getUniformLocation(this.program, 'u_pointLightColor')
        this.u_spotLightPos = gl.getUniformLocation(this.program, 'u_spotLightPos')
        this.u_spotLightDir = gl.getUniformLocation(this.program, 'u_spotLightDir')
        this.u_spotLightColor = gl.getUniformLocation(this.program, 'u_spotLightColor')
        this.u_spotRatio = gl.getUniformLocation(this.program, 'u_spotRatio')
        this.u_ambient = gl.getUniformLocation(this.program, 'u_ambient')

        this.u_cameraPos = gl.getUniformLocation(this.program, 'u_cameraPos')
    
        this.u_diffuse = gl.getUniformLocation(this.program, 'u_diffuse')
        this.u_specular = gl.getUniformLocation(this.program, 'u_specular')
        this.u_shininess = gl.getUniformLocation(this.program, 'u_shininess')
    }

    initialize(gl) {
        this.initializeCore(gl)

        this.a_Position = gl.getAttribLocation(this.program, 'a_Position')
        this.a_Normal = gl.getAttribLocation(this.program, 'a_Normal')
        this.a_UV = gl.getAttribLocation(this.program, 'a_UV')
        this.a_FragColor = gl.getAttribLocation(this.program, 'a_FragColor')

        gl.enableVertexAttribArray(this.a_Position)
        gl.enableVertexAttribArray(this.a_Normal)
        gl.enableVertexAttribArray(this.a_UV)
        gl.enableVertexAttribArray(this.a_FragColor)
    }

    bindCoreVariables(gl, model, camera, light) {
        let orientMatrix = model.rot.getRotationMatrix()
        let modelMatrix = model.getModelMatrix(model.pos.elements, orientMatrix)
        let sunDir = light.sun.getLightDirection().elements
        let sunColor = light.sun.getLightColor()
        let pointPos = light.point.getLightPosition().elements
        let pointColor = light.point.getLightColor()
        let spotPos = light.spot.getLightPosition().elements
        let spotDir = light.spot.getLightDirection().elements
        let spotColor = light.spot.getLightColor()
        let ambientColor = light.getAmbientLight()
        let cameraPos = camera.getPosition()

        gl.uniform1f(this.u_diffuse, model.diffuse)
        gl.uniform1f(this.u_specular, model.specular)
        gl.uniform1f(this.u_shininess, model.shininess)
        gl.uniformMatrix4fv(this.u_pvMatrix, false, camera.getPVMatrix().elements)
        gl.uniformMatrix4fv(this.u_modelMatrix, false, modelMatrix.elements)
        gl.uniformMatrix4fv(this.u_orientMatrix, false, orientMatrix.elements)
        gl.uniform3f(this.u_cameraPos, cameraPos.elements[0], cameraPos.elements[1], cameraPos.elements[2])
        gl.uniform3f(this.u_dirLightDir, sunDir[0], sunDir[1], sunDir[2])
        gl.uniform3f(this.u_dirLightColor, sunColor[0], sunColor[1], sunColor[2])
        gl.uniform3f(this.u_pointLightPos, pointPos[0], pointPos[1], pointPos[2])
        gl.uniform3f(this.u_pointLightColor, pointColor[0], pointColor[1], pointColor[2])
        gl.uniform3f(this.u_spotLightPos, spotPos[0], spotPos[1], spotPos[2])
        gl.uniform3f(this.u_spotLightDir, spotDir[0], spotDir[1], spotDir[2])
        gl.uniform3f(this.u_spotLightColor, spotColor[0], spotColor[1], spotColor[2])
        gl.uniform1f(this.u_spotRatio, light.spot.ratio)
        gl.uniform3f(this.u_ambient, ambientColor[0], ambientColor[1], ambientColor[2])
    }

    bindVariables(gl, model, camera, light) {
        this.bindCoreVariables(gl, model, camera, light)
    }

}

class LightShader extends Shader {
    static LightVert =
        "attribute vec4 a_Position;\n" +
        "attribute vec4 a_Normal;\n" + 
        "attribute vec3 a_FragColor;\n" +
        "uniform mat4 u_pvMatrix;\n" + 
        "uniform mat4 u_modelMatrix;\n" + 
        "uniform mat4 u_orientMatrix;\n" +
        "varying vec3 v_Position;\n" +
        "varying vec3 v_Normal;\n" +
        "varying vec3 v_FragColor;\n" +
        "\n" + 
        "void main() {\n" +
        "    vec4 position = u_modelMatrix * a_Position;" +
        "    gl_Position = u_pvMatrix * position;\n" + 
        "    v_Position = vec3(position);\n" + 
        "    v_Normal = vec3(u_orientMatrix * a_Normal);\n" +
        "    v_FragColor = a_FragColor;\n" +
        "}"

    static LightFrag = 
        Shader.FragVars +
        "\n" +
        "varying vec3 v_Position;\n" +
        "varying vec3 v_Normal;\n" +
        "varying vec3 v_FragColor;\n" +
        "\n" + 
        Shader.BlinnPhong +
        "\n" + 
        "void main() {\n" +
        "    gl_FragColor = vec4(light(v_FragColor),1.0);\n" +
        "}"
    
    constructor() {
        super(LightShader.LightVert, LightShader.LightFrag)
    }

    getVertexData(verteces) {
        return new Float32Array(verteces.flatMap(v => 
            [v.pos.elements[0], v.pos.elements[1], v.pos.elements[2], 
             v.norm.elements[0], v.norm.elements[1], v.norm.elements[2], 
             v.color[0], v.color[1], v.color[2]]))
    }

    setVertexArray(gl) {
        gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, FLOAT_SIZE * 9, FLOAT_SIZE * 0)
        gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, true, FLOAT_SIZE * 9, FLOAT_SIZE * 3)
        gl.vertexAttribPointer(this.a_FragColor, 3, gl.FLOAT, false, FLOAT_SIZE * 9, FLOAT_SIZE * 6)
    }

    initialize(gl) {
        this.initializeCore(gl)

        this.a_Position = gl.getAttribLocation(this.program, 'a_Position')
        this.a_Normal = gl.getAttribLocation(this.program, 'a_Normal')
        this.a_FragColor = gl.getAttribLocation(this.program, 'a_FragColor')

        gl.enableVertexAttribArray(this.a_Position)
        gl.enableVertexAttribArray(this.a_Normal)
        gl.enableVertexAttribArray(this.a_FragColor)
    }
}

class UVShader extends Shader {
    static UVFrag = 
        Shader.FragVars +
        "\n" +
        "varying vec3 v_Position;\n" +
        "varying vec3 v_Normal;\n" +
        "varying vec2 v_UV;\n" +
        "varying vec3 v_FragColor;\n" +
        "\n" + 
        Shader.BlinnPhong +
        "\n" + 
        "void main() {\n" +
        "    vec3 left = mix(vec3(1.0,1.0,1.0),vec3(0.0,0.0,0.0),v_UV[1]);\n" +
        "    vec3 right = mix(u_FragColor, vec3(0.0,0.0,0.0), v_UV[1]);\n" +
        "    vec3 color = light(mix(left, right, v_UV[0]));\n" +
        "    gl_FragColor = vec4(color,1.0);\n" +
        "}"
    
    constructor() {
        super(Shader.MainVert, UVShader.UVFrag)
    }

}

class RiverShader extends Shader {
    static RiverFrag = 
        Shader.FragVars +
        "\n" +
        "varying vec3 v_Position;\n" +
        "varying vec3 v_Normal;\n" +
        "varying vec2 v_UV;\n" +
        "varying vec3 v_FragColor;\n" +
        "\n" + 
        Shader.BlinnPhong +
        "\n" + 
        "void main() {\n" +
        "    float riverEdge = 0.32 + (0.05 * cos(4.0 * v_UV[1]));\n" +
        "    float riverWidth = 0.06 + (0.03 * sin(0.5 * v_UV[1]));\n" +
        "    if (v_UV[0] > riverEdge && v_UV[0] < riverEdge + riverWidth) {\n" +
        "        gl_FragColor = vec4(light(vec3(0.035,0.058,0.38)), 1.0);\n" +
        "    } else {\n" +
        "        vec3 left = mix(vec3(1.0,1.0,1.0),vec3(0.0,0.0,0.0),v_UV[1]);\n" +
        "        vec3 right = mix(v_FragColor, vec3(0.0,0.0,0.0), v_UV[1]);\n" +
        "        gl_FragColor = vec4(light(mix(left, right, v_UV[0])),1.0);\n" +
        "    }\n" +
        "}"
    
    constructor() {
        super(Shader.MainVert, RiverShader.RiverFrag)
    }

}

class TextureShader extends Shader {

    static TextureVert =
        "attribute vec4 a_Position;\n" +
        "attribute vec4 a_Normal;\n" + 
        "attribute vec2 a_UV;\n" +
        "uniform mat4 u_pvMatrix;\n" + 
        "uniform mat4 u_modelMatrix;\n" + 
        "uniform mat4 u_orientMatrix;\n" +
        "varying vec3 v_Position;\n" +
        "varying vec3 v_Normal;\n" +
        "varying vec2 v_UV;\n" + 
        "\n" + 
        "void main() {\n" +
        "    vec4 position = u_modelMatrix * a_Position;" +
        "    gl_Position = u_pvMatrix * position;\n" + 
        "    v_Position = vec3(position);\n" + 
        "    v_Normal = vec3(u_orientMatrix * a_Normal);\n" +
        "   v_UV = a_UV;\n" +
        "}"

    static TextureFrag = 
        Shader.FragVars +
        "uniform sampler2D u_texture;\n" +
        "\n" +
        "varying vec3 v_Position;\n" +
        "varying vec3 v_Normal;\n" +
        "varying vec2 v_UV;\n" +
        "\n" + 
        Shader.BlinnPhong +
        "\n" + 
        "void main() {\n" +
        "    vec3 image = light(vec3(texture2D(u_texture, v_UV)));\n" +
        "    gl_FragColor = vec4(image,1.0);\n" +
        "}"
    
    constructor() {
        super(TextureShader.TextureVert, TextureShader.TextureFrag)
    }

    getVertexData(verteces) {
        return new Float32Array(verteces.flatMap(v => 
            [v.pos.elements[0], v.pos.elements[1], v.pos.elements[2], 
             v.norm.elements[0], v.norm.elements[1], v.norm.elements[2], 
             v.uv[0], v.uv[1]]))
    }

    setVertexArray(gl) {
        gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, FLOAT_SIZE * 8, FLOAT_SIZE * 0)
        gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, true, FLOAT_SIZE * 8, FLOAT_SIZE * 3)
        gl.vertexAttribPointer(this.a_UV, 2, gl.FLOAT, false, FLOAT_SIZE * 8, FLOAT_SIZE * 6)
    }

    initialize(gl) {
        this.initializeCore(gl)

        this.a_Position = gl.getAttribLocation(this.program, 'a_Position')
        this.a_Normal = gl.getAttribLocation(this.program, 'a_Normal')
        this.a_UV = gl.getAttribLocation(this.program, 'a_UV')
    
        gl.enableVertexAttribArray(this.a_Position)
        gl.enableVertexAttribArray(this.a_Normal)
        gl.enableVertexAttribArray(this.a_UV)
    
        this.u_texture = gl.getUniformLocation(this.program, 'u_texture')
        gl.uniform1i(this.u_texture, 0);
    }

    bindVariables(gl, model, camera, light) {
        this.bindCoreVariables(gl, model, camera, light)
        gl.bindTexture(gl.TEXTURE_2D, model.texture)
    }
}

class BasicShader extends Shader {
    static BasicVert =
        "attribute vec4 a_Position;\n" +
        "attribute vec3 a_FragColor;\n" +
        "uniform mat4 u_pvMatrix;\n" + 
        "uniform mat4 u_modelMatrix;\n" +
        "varying vec3 v_FragColor;\n" +
        "\n" + 
        "void main() {\n" +
        "    vec4 position = u_modelMatrix * a_Position;" +
        "    gl_Position = u_pvMatrix * position;\n" +
        "    v_FragColor = a_FragColor;\n" +
        "}"

    static BasicFrag = 
        "precision mediump float;\n" + 
        "uniform vec3 u_lightSource;\n" + 
        "\n" +
        "varying vec3 v_FragColor;\n" +
        "\n" +
        "void main() {\n" +
        "    float horizon = 3.0 * max(dot(u_lightSource,vec3(0.0,-1.0,0.0)), 0.0);\n" +
        "    gl_FragColor = vec4((1.0 - horizon) * v_FragColor,1.0);\n" +
        "}"
    
    constructor() {
        super(BasicShader.BasicVert, BasicShader.BasicFrag)
    }

    getVertexData(verteces) {
        return new Float32Array(verteces.flatMap(v => 
            [v.pos.elements[0], v.pos.elements[1], v.pos.elements[2], 
             v.color[0], v.color[1], v.color[2]]))
    }

    setVertexArray(gl) {
        gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, FLOAT_SIZE * 6, FLOAT_SIZE * 0)
        gl.vertexAttribPointer(this.a_FragColor, 3, gl.FLOAT, false, FLOAT_SIZE * 6, FLOAT_SIZE * 3)
    }

    initialize(gl) {
        if (this.program !== null) return
        if (!initShaders(gl, this.vshader, this.fshader)) {
            console.log("shaders failed to load: ")
        }
    
        this.program = gl.program
    
        this.u_pvMatrix = gl.getUniformLocation(this.program, 'u_pvMatrix')
        this.u_modelMatrix = gl.getUniformLocation(this.program, 'u_modelMatrix')
    
        this.u_lightSource = gl.getUniformLocation(this.program, 'u_lightSource')

        this.a_Position = gl.getAttribLocation(this.program, 'a_Position')
        this.a_FragColor = gl.getAttribLocation(this.program, 'a_FragColor')

        gl.enableVertexAttribArray(this.a_Position)
        gl.enableVertexAttribArray(this.a_FragColor)
    }

    bindVariables(gl, model, camera, light) {
        let orientMatrix = model.rot.getRotationMatrix()
        let modelMatrix = model.getModelMatrix(model.pos.elements, orientMatrix)
        let lightSource = light.sun.getLightDirection()

        gl.uniformMatrix4fv(this.u_pvMatrix, false, camera.getPVMatrix().elements)
        gl.uniformMatrix4fv(this.u_modelMatrix, false, modelMatrix.elements)
        gl.uniform3f(this.u_lightSource, lightSource.elements[0], lightSource.elements[1], lightSource.elements[2])
    }
}

class SourceShader extends Shader {
    static SourceVert =
        "attribute vec4 a_Position;\n" +
        "uniform mat4 u_pvMatrix;\n" + 
        "uniform mat4 u_modelMatrix;\n" +
        "\n" + 
        "void main() {\n" +
        "    vec4 position = u_modelMatrix * a_Position;" +
        "    gl_Position = u_pvMatrix * position;\n" +
        "}"

    static SourceFrag = 
        "precision mediump float;\n" + 
        "\n" +
        "uniform vec3 u_FragColor;\n" +
        "\n" +
        "void main() {\n" +
        "    gl_FragColor = vec4(u_FragColor,1.0);\n" +
        "}"
    
    constructor() {
        super(SourceShader.SourceVert, SourceShader.SourceFrag)
    }

    getVertexData(verteces) {
        return new Float32Array(verteces.flatMap(v => 
            [v.pos.elements[0], v.pos.elements[1], v.pos.elements[2]]))
    }

    setVertexArray(gl) {
        gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, FLOAT_SIZE * 3, FLOAT_SIZE * 0)
    }

    initialize(gl) {
        if (this.program !== null) return
        if (!initShaders(gl, this.vshader, this.fshader)) {
            console.log("shaders failed to load: ")
        }
    
        this.program = gl.program
    
        this.u_pvMatrix = gl.getUniformLocation(this.program, 'u_pvMatrix')
        this.u_modelMatrix = gl.getUniformLocation(this.program, 'u_modelMatrix')
        this.u_FragColor = gl.getUniformLocation(this.program, 'u_FragColor')

        this.a_Position = gl.getAttribLocation(this.program, 'a_Position')

        gl.enableVertexAttribArray(this.a_Position)
    }

    bindVariables(gl, model, camera, light) {
        let orientMatrix = model.rot.getRotationMatrix()
        let modelMatrix = model.getModelMatrix(model.pos.elements, orientMatrix)
        let color = model.color

        gl.uniformMatrix4fv(this.u_pvMatrix, false, camera.getPVMatrix().elements)
        gl.uniformMatrix4fv(this.u_modelMatrix, false, modelMatrix.elements)
        gl.uniform3f(this.u_FragColor, color[0], color[1], color[2])
    }
}