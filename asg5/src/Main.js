import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js'

const FOV = 75
const ASPECT = 16 / 9
const NEAR = 0.1
const FAR = 100

function main() {
    const canvas = document.getElementById('mainCanvas')
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas})
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR)
    camera.position.z = 0
    camera.position.y = 1

    const scene = new THREE.Scene()

    //textures
    const texLoader = new THREE.TextureLoader()
    const dennisTex = texLoader.load('assets/rp_dennis_posed_004_dif.jpg')
    dennisTex.colorSpace = THREE.SRGBColorSpace
    const boxTex = texLoader.load('assets/Wooden Crate_Crate_BaseColor.png')
    boxTex.colorSpace = THREE.SRGBColorSpace
    const crosshairTex = texLoader.load('assets/crosshair.png')
    crosshairTex.colorSpace = THREE.SRGBColorSpace
    const skyTex = texLoader.load('assets/circular-clouds-sky-texture.jpg')
    skyTex.colorspace = THREE.SRGBColorSpace

    //ambient light
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1)
    scene.add(ambientLight)
    ambientLight.visible = false

    //directional light
    const light = new THREE.DirectionalLight(0xFFFFFF, 3)
    light.position.set(-20, 20, 10)
    light.castShadow = true
    light.shadow.camera.left = 20
    light.shadow.camera.right = -20
    light.shadow.camera.top = 20
    light.shadow.camera.bottom = -20
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    scene.add(light)
    light.visible = false

    //spot light
    const spotLight = new THREE.SpotLight(0xFFFFFF, 6)
    spotLight.angle = Math.PI / 10
    spotLight.position.y = 0.8
    spotLight.position.z = 2

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024

    spotLight.shadow.camera.near = 0.2
    spotLight.shadow.camera.far = 400
    spotLight.shadow.camera.fov = 75
    scene.add(spotLight)
    scene.add(spotLight.target)
    spotLight.target.position.set(0,-0.5, -2)

    //point lights
    const lampGeo = new THREE.ConeGeometry(0.1, 0.2, 16)
    const lamps = []
    function lampInstance(position, color) {
        const pointLight = new THREE.PointLight(color, 0.4)
        pointLight.position.copy(position)
        pointLight.castShadow = true
        scene.add(pointLight)
        const lampMat = new THREE.MeshBasicMaterial({color: color})
        const lamp = new THREE.Mesh(lampGeo, lampMat)
        lamp.position.copy(pointLight.position)
        scene.add(lamp)
        lamps.push(lamp)
    }

    //boxes
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1)
    const boxMaterial = new THREE.MeshStandardMaterial({map: boxTex}) //0x44aa88
    const boxes = []
    function boxInstance(position, size) {
        const box = new THREE.Mesh(cubeGeo, boxMaterial)
        box.position.copy(position)
        box.position.y = (size / 2) - 0.5
        box.scale.set(size, size, size)
        box.castShadow = true
        scene.add(box)
        boxes.push(box)
    }

    //creatures
    class Creature {

        static cylinder = new THREE.CylinderGeometry(0.4, 0.4, 0.6, 30)
        static cone = new THREE.ConeGeometry(0.4, 0.6, 30)
        static sphere = new THREE.SphereGeometry(0.3)

        constructor(position, color) {
            this.position = position
            const material = new THREE.MeshStandardMaterial({color: color})
            const body = new THREE.Mesh(Creature.cylinder, material)
            const torso = new THREE.Mesh(Creature.cone, material)
            const head = new THREE.Mesh(Creature.sphere, material)
            body.position.y = -0.2
            torso.position.y = 0.4
            head.position.y = 1.0
            this.meshs = [body, torso, head]
            this.meshs.forEach(m => {
                m.castShadow = true
                scene.add(m)
            })
        }

        update() {
            this.meshs.forEach(m => {
                m.position.x = this.position.x
                m.position.z = this.position.z
            })
        }
    }

    //sky box
    const bigcube = new THREE.SphereGeometry(40)
    const sky = new THREE.MeshBasicMaterial({color: 0x000004, side: THREE.BackSide})
    const skybox = new THREE.Mesh(bigcube, sky)
    skybox.rotation.z =  (Math.PI) / 2
    scene.add(skybox)

    //floor
    const plane = new THREE.PlaneGeometry(30,30)
    const floorMat = new THREE.MeshStandardMaterial({color: 0x226622, side: THREE.DoubleSide})
    const floor = new THREE.Mesh(plane, floorMat)
    floor.position.y = -0.5
    floor.rotation.x = Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    //canvas texture
    let ctx = document.createElement('canvas').getContext('2d')
    ctx.canvas.width = 256
    ctx.canvas.height = 256
    ctx.fillStyle = 0xFF0000
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    //obj model
    const objLoader = new OBJLoader()
    let objMesh = new THREE.Mesh(cubeGeo, boxMaterial)
    objLoader.load('assets/rp_dennis_posed_004_100k.OBJ', root => {
        objMesh = root
        objMesh.traverse(child => {
            if (child.isMesh) {
                child.material.map = dennisTex
                child.castShadow = true
            }
        })
        objMesh.scale.set(1/100, 1/100, 1/100)
        const randomRadius = (5 * Math.random()) + 5
        const randomAngle = 2 * Math.PI * Math.random()
        objMesh.position.set(randomRadius * Math.cos(randomAngle), -0.5, randomRadius * Math.sin(randomAngle))
        objMesh.lookAt(camera.position.x, objMesh.position.y, camera.position.z)
        if (objMesh.position.z < 0) {
            objMesh.rotation.y -= Math.PI / 2
        } else {
            objMesh.rotation.y += Math.PI / 2
        }
        scene.add(objMesh)
    })

    boxInstance(new THREE.Vector3(3,0,3), 1)
    boxInstance(new THREE.Vector3(-10,0,6), 4)
    boxInstance(new THREE.Vector3(-5,0,-6), 1)
    boxInstance(new THREE.Vector3(7,0,-7), 2)
    boxInstance(new THREE.Vector3(4,0,-7), 1.5)
    boxInstance(new THREE.Vector3(1,0,1), 0.5)
    boxInstance(new THREE.Vector3(9.5,0,6.4), 1)
    boxInstance(new THREE.Vector3(6.4,0,9.5), 1)

    lampInstance(new THREE.Vector3(3,0.6,3), 0xFF0000)
    lampInstance(new THREE.Vector3(4,1.1,-7), 0x00FF00)
    lampInstance(new THREE.Vector3(-5,0.6,-6), 0x0000FF)

    const redcreature = new Creature(new THREE.Vector3(2,0,0), 0xFF0000)
    const bluecreature = new Creature(new THREE.Vector3(4,0,4), 0x0000FF)
    const greencreature = new Creature(new THREE.Vector3(-5,0,3), 0x00FF00)
    const pinkcreature = new Creature(new THREE.Vector3(2,0,2), 0xFF00FF)

    //ui
    const crosshairMat = new THREE.SpriteMaterial({map: crosshairTex, transparent: true})
    const crosshair = new THREE.Sprite(crosshairMat)
    crosshair.scale.set(0.05,0.05,0.05)
    scene.add(crosshair)

    //controls
    const controls = new PointerLockControls(camera, canvas)
    scene.add(controls.object)

    const raycaster = new THREE.Raycaster()

    let dennisFound = false
    canvas.addEventListener( 'click', function () {
        if (!controls.isLocked) {
            controls.lock()
        } else {
            raycaster.setFromCamera(new THREE.Vector2(0,0), camera)

            const intersects =  raycaster.intersectObjects(scene.children)
            intersects.forEach(c => {
                if (c.object.name.includes("dennis")) {
                    if (!dennisFound) {
                        document.getElementById('infotext').innerHTML = "<b>You Found Dennis!</b> Now you can walk around with <b>WASD</b>"
                        light.visible = true
                        ambientLight.visible = true
                        spotLight.visible = false
                        skybox.material = new THREE.MeshBasicMaterial({map: skyTex, side: THREE.BackSide})
                        dennisFound = true
                    }
                }
            })
        }

    } );

    let inputs = {}
    document.onkeydown = function (ev) {
        inputs[ev.code] = true
    }
    document.onkeyup = function (ev) {
        inputs[ev.code] = false
    }

    document.onwheel = function (ev) {
        if (ev.deltaY > 0) {
            if (camera.zoom > 1) {
                camera.zoom -= 0.5
            }
            if (camera.zoom < 1) {
                camera.zoom = 1
            }
            camera.updateProjectionMatrix()
        } else if (ev.deltaY < 0) {
            if (camera.zoom < 8) {
                camera.zoom += 0.5
            }
            if (camera.zoom > 8) {
                camera.zoom = 3
            }
            camera.updateProjectionMatrix()
        }
    }

    //tick
    const fps = document.getElementById("fpscount")
    const xpos = document.getElementById("xpos")
    const zpos = document.getElementById("zpos")
    function tick(lastTime) {
        return function (curTime) {
            const delta = (curTime - lastTime) / 1000
            animate(curTime / 1000)
            update(delta)
            renderer.render(scene, camera)
            //fps.innerHTML = 1 / delta
            //xpos.innerHTML = camera.position.x
            //zpos.innerHTML = camera.position.z
            requestAnimationFrame(tick(curTime))
        }
    }

    //animate. better for things on a timeline
    function animate(curTime) {
        //cube.position.x = Math.sin(curTime)
        redcreature.position.x = 6 * Math.cos(0.2 * curTime)
        redcreature.position.z = 6 * Math.sin(0.2 * curTime)
        bluecreature.position.z = 4 * Math.cos(0.5 * curTime)
        let t1 = (curTime / 8) % 2
        if (t1 > 1) t1 = 1 - (t1 % 1) 
        greencreature.position.x = (-7 * t1) + (-3 * (1 - t1))
        greencreature.position.z = (-6 * t1) + (-10 * (1 - t1))
        let t2 = (curTime / 12) % 3
        if (t2 < 1) {
            t2 = t2 % 1
            pinkcreature.position.x = (5.9 * (1 - t2)) + (5.4 * t2)
            pinkcreature.position.z = (8 * (1 - t2)) + (-9.2 * t2)
        } else if (t2 < 2) {
            t2 = t2 % 1
            pinkcreature.position.x = (5.4 * (1 - t2)) + (-10.8 * t2)
            pinkcreature.position.z = (-9.2 * (1 - t2)) + (-8.4 * t2)
        } else {
            t2 = t2 % 1
            pinkcreature.position.x = (-10.8 * (1 - t2)) + (5.9 * t2)
            pinkcreature.position.z = (-8.4 * (1 - t2)) + (8 * t2)
        }
        //(5.9, 8) (5.4, -9.2) (-10.8, -8.4)
        //skybox.rotation.z = 0.06 * curTime
        //skybox.rotation.x = 0.03 * curTime
    } 

    //update. better for things that might be different frame to frame
    const speed = 3
    let facingDirection = new THREE.Vector3()
    function update(delta) {
        camera.getWorldDirection(facingDirection)
        if (dennisFound) {
            if (inputs['KeyW'] == true) {
                controls.moveForward(speed * delta)
            } else if (inputs['KeyS'] == true) {
                controls.moveForward(speed * -delta)
            }
            if (inputs['KeyA'] == true) {
                controls.moveRight(speed * -delta)
            } else if (inputs['KeyD'] == true) {
                controls.moveRight(speed * delta)
            }
        }
       redcreature.update()
       bluecreature.update()
       greencreature.update()
       pinkcreature.update()
        let forward = camera.position.clone().add(facingDirection)
        crosshair.position.copy(forward)
        spotLight.target.position.copy(forward.clone().add(new THREE.Vector3(0, -0.2, 0)))
        spotLight.position.copy(camera.position.clone().add(new THREE.Vector3(0, -0.2, 0)))
        spotLight.shadow.camera.updateWorldMatrix()
    }

    tick(performance.now())()
}

main()