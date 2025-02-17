function generateTexture(gl, imgPath) {
    const texture = gl.createTexture()
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const image = new Image();
    image.onload = () => {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };

    image.crossOrigin = "anonymous";
    image.src = imgPath;

    return texture
}

function swapVertexBuffer(gl, shader, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    gl.vertexAttribPointer(shader.a_Position, 3, gl.FLOAT, false, FLOAT_SIZE * 8, FLOAT_SIZE * 0)
    gl.vertexAttribPointer(shader.a_Normal, 3, gl.FLOAT, true, FLOAT_SIZE * 8, FLOAT_SIZE * 3)
    gl.vertexAttribPointer(shader.a_UV, 2, gl.FLOAT, true, FLOAT_SIZE * 8, FLOAT_SIZE * 6)
}

function setupWebGL(canvas) {
    const gl = getWebGLContext(canvas)
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
    return gl
}

function createGLProgram(gl, vshader, fshader) {
    if (!initShaders(gl, vshader, fshader)) {
        console.log("shaders failed to load")
    }
    let vars = {}

    vars.program = gl.program
    vars.a_Position = gl.getAttribLocation(gl.program, 'a_Position')
    vars.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal')
    vars.a_UV = gl.getAttribLocation(gl.program, 'a_UV')
    vars.u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix')
    vars.u_viewMatrix = gl.getUniformLocation(gl.program, 'u_viewMatrix')
    vars.u_projectionMatrix = gl.getUniformLocation(gl.program, 'u_projectionMatrix')
    vars.u_orientMatrix = gl.getUniformLocation(gl.program, 'u_orientMatrix')

    vars.u_lightSource = gl.getUniformLocation(gl.program, 'u_lightSource')
    vars.u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')
    vars.u_texture = gl.getUniformLocation(gl.program, 'u_texture')

    gl.enableVertexAttribArray(vars.a_Position)
    gl.enableVertexAttribArray(vars.a_Normal)
    gl.enableVertexAttribArray(vars.a_UV)

    gl.uniform1i(vars.u_texture, 0);

    return vars
}

function loadWebGL(canvas, tick) {
    const mainVert = document.getElementById("mainVert").innerHTML
    const uvFrag = document.getElementById("uvFrag").innerHTML
    const basicFrag = document.getElementById("basicFrag").innerHTML
    const textureFrag = document.getElementById("textureFrag").innerHTML
    const riverFrag = document.getElementById("riverFrag").innerHTML

    const programs = {}

    const gl = setupWebGL(canvas)
    programs.uv = createGLProgram(gl, mainVert, uvFrag)
    programs.basic = createGLProgram(gl, mainVert, basicFrag)
    programs.texture = createGLProgram(gl, mainVert, textureFrag)
    programs.river = createGLProgram(gl, mainVert, riverFrag)

    const stop = document.getElementById('stopButton')
    stop.onclick = function () { 
        globalWorld.stopped = !globalWorld.stopped
        setTimeout(tick(gl, programs, Date.now()), 1000 / FRAMERATE)
    }

    setTimeout(tick(gl, programs, Date.now()), 1000 / FRAMERATE)
}