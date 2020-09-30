const MaterialPresets = {
    MATERIAL_BASE: new THREE.MeshLambertMaterial({ color: 0x000000 }),
    MATERIAL_ALGORITHM_STEP: new THREE.MeshLambertMaterial({ color: 0xff3878 }),
    MATERIAL_ALGORITHM_STEP_PREVIOUS: new THREE.MeshLambertMaterial({ color: 0x08ecfc }),
    MATERIAL_ALGORITHM_STEP_PREVIOUS_TRANSPARENT: new THREE.MeshLambertMaterial({ color: 0xe8fbff, opacity: 0.1, transparent: true }),
    MATERIAL_SHORTEST_PATH_STEP: new THREE.MeshLambertMaterial({ color: 0xfbfe47 }),
    MATERIAL_POINT_START: new THREE.MeshLambertMaterial({ color: 0x4ddb2a }),
    MATERIAL_POINT_END: new THREE.MeshLambertMaterial({ color: 0xfc681e }),
    MATERIAL_WALL: new THREE.MeshPhongMaterial({ color: 0x5b00a6 }),
};

const GeometryPresets = {
    GEOMETRY_BASE_CUBE: new THREE.BoxGeometry(1, 1, 1),
    GEOMETRY_POINT_END_CYLINDER: new THREE.CylinderGeometry(0.39, 0.39, 0.1, 16, 2, false, 0, 6.3),
    GEOMETRY_POINT_START_SPHERE: new THREE.TorusGeometry(0.39, 0.1, 16, 3, 6.28),
};

function Visualizer_3D() {
    const BOUNDING_BOX_COLOR = 0x04c6d4;
    const HELPER_GRID_COLOR_UPPER = 0x024c69;
    const HELPER_GRID_COLOR_LOWER = 0x024c69;
    const HELPER_CUBE_COLOR = 0x04c6d4;
    const RENDERER_BACKGROUND_COLOR = 0x010121;

    const CAMERA_FOV = 75;
    const CAMERA_INITIAL_POSITION = new THREE.Vector3(-3, 9, 13);
    const CAMERA_INITIAL_LOOK_AT = new THREE.Vector3(9, 0, 0);
    const CAMERA_LIMIT_NEAR = 0.1;
    const CAMERA_LIMIT_FAR = 1000;
    const CONTROL_DAMPING = 0.2;

    const CUBE_SIZE = 1;

    const HELPER_GRID_OFFSET_UPPER = -0.5;
    const HELPER_GRID_OFFSET_LOWER = 0.5;

    const MOUSE_LEFT_BUTTON = 0;  // left click to orbit
    const MOUSE_RIGHT_BUTTON = 2; // right click to edit the map

    var cubeEnteredWhileMouseDown;
    var newCubeEntered;
    var isMouseLeftButtonDown = false;
    var isMouseRightButtonDown = false;
    var isTouchInProgress = false;
    var isTouchControl = false;
    var lastSelectedCubeCoordinates = new THREE.Vector3(0, 0, 0);
    var lastEnderedCubeCoordinates = new THREE.Vector3(0, 0, 0);

    var startPoint3DObject;
    var endPoint3DObject;
    var previewHelperBaseBox; // used to change the position of the preview cube
    var previewHelper3DObject;
    var editingGridHelperUpper;
    var editingGridHelperLower;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_LIMIT_NEAR, CAMERA_LIMIT_FAR);
    // maybe change the logarithmicDepthBuffer to false or delete the property - if there is a huge scale difference on the scene
    var renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false });
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.background = new THREE.Color(RENDERER_BACKGROUND_COLOR);
    //renderer.setClearColor(RENDERER_BACKGROUND_COLOR); // this is actually the "background" color

    document.body.appendChild(renderer.domElement);
    camera.position.set(CAMERA_INITIAL_POSITION.x, CAMERA_INITIAL_POSITION.y, CAMERA_INITIAL_POSITION.z);
    camera.lookAt(CAMERA_INITIAL_LOOK_AT);

    controls.enableDamping = true;
    controls.dampingFactor = CONTROL_DAMPING;

    /** Adding lights to the scene */
    var light = new THREE.HemisphereLight(0xffffff, 0x000088);
    light.position.set(- 1, 1.5, 1);
    scene.add(light);

    var light = new THREE.HemisphereLight(0xffffff, 0x880000, 0.5);
    light.position.set(- 1, - 1.5, - 1);
    scene.add(light);

    window.addEventListener("resize", onWindowResize, false);

    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    function onMouseDown(event) {
        if (event.target.nodeName != "CANVAS") { return; } // filter false click, performed indirectly on the canvas
        if (event.button === MOUSE_LEFT_BUTTON) {
            isMouseLeftButtonDown = true;
        }
        if (event.button === MOUSE_RIGHT_BUTTON) {
            isMouseRightButtonDown = true;
            let obj = getFirstRaycastableObjectMouse(event);
            if (obj !== undefined) {
                lastSelectedCubeCoordinates.copy(obj.array3DCoordinates);
                cubeEnteredWhileMouseDown(obj.array3DCoordinates);
            }
        }
    }

    function onMouseUp(event) {
        if (event.target.nodeName != "CANVAS") { return; }
        if (isTouchControl) {
            if (!controls.enabled) {
                isMouseRightButtonDown = false;
            }
        } else {
            if (event.button === MOUSE_LEFT_BUTTON) {
                isMouseLeftButtonDown = false;
            }
            if (event.button === MOUSE_RIGHT_BUTTON) {
                isMouseRightButtonDown = false;
            }
        }
    }

    function onMouseMove(event) {
        if (event.target.nodeName != "CANVAS") { return; }
        if (!isMouseLeftButtonDown) { // prevent event trigger while orbiting
            let obj = getFirstRaycastableObjectMouse(event);
            if (obj !== undefined) {
                if (obj.array3DCoordinates.equals(lastEnderedCubeCoordinates) === false) {
                    lastEnderedCubeCoordinates.copy(obj.array3DCoordinates);
                    newCubeEntered(obj.array3DCoordinates);
                }
                if (isMouseRightButtonDown === true) {
                    if (obj.array3DCoordinates.equals(lastSelectedCubeCoordinates) === false) {
                        lastSelectedCubeCoordinates.copy(obj.array3DCoordinates);
                        cubeEnteredWhileMouseDown(obj.array3DCoordinates);
                    }
                }
            }
        }
    }

    function onTouchStart(event) {
        if (event.target.nodeName != "CANVAS") { return; }
        if (!controls.enabled) {
            isTouchInProgress = true;
            let obj = getFirstRaycastableObjectTouch(event);
            if (obj !== undefined) {
                lastEnderedCubeCoordinates.copy(obj.array3DCoordinates);
                cubeEnteredWhileMouseDown(obj.array3DCoordinates);
            }
        }
    }

    function onTouchEnd(event) {
        if (event.target.nodeName != "CANVAS") { return; }
        if (!controls.enabled) {
            isTouchInProgress = false;
        }
    }

    function onTouchMove(event) {
        if (event.target.nodeName != "CANVAS") { return; }
        if (!controls.enabled) { // prevent event trigger while orbiting
            let obj = getFirstRaycastableObjectTouch(event);
            if (obj !== undefined) {
                if (obj.array3DCoordinates.equals(lastEnderedCubeCoordinates) === false) {
                    lastEnderedCubeCoordinates.copy(obj.array3DCoordinates);
                    newCubeEntered(obj.array3DCoordinates);
                }
                if (isTouchInProgress === true) {
                    if (obj.array3DCoordinates.equals(lastSelectedCubeCoordinates) === false) {
                        lastSelectedCubeCoordinates.copy(obj.array3DCoordinates);
                        cubeEnteredWhileMouseDown(obj.array3DCoordinates);
                    }
                }
            }
        }
    }

    function getFirstRaycastableObjectMouse(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(scene.children);
        for (let element of intersects) {
            let obj = element.object;
            if (obj.isRaycastable === true) { return obj; }
        }
        return undefined;
    }

    function getFirstRaycastableObjectTouch(event) {
        // based on: https://stackoverflow.com/a/41993300/14132176
        let touch = { x: 0, y: 0 };
        touch.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        touch.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(touch, camera);
        var intersects = raycaster.intersectObjects(scene.children);
        for (let element of intersects) {
            let obj = element.object;
            if (obj.isRaycastable) { return obj; }
        }
        return undefined;
    }

    this.generateBlockOfCubes = function (blockSize, cubeSpacing, cubeMaterial) {
        // cubeSpacing = 1 means there is no gap between the cubes. 1.5 means there is a 0.5 cube gap between two cubes.
        for (let i = scene.children.length - 1; i >= 0; i--) {
            let child = scene.children[i];
            if (child.isRemovable) { // check if the selected object can be removed (we don't want to remove the camera, light etc.)
                scene.remove(child);
            }
        }

        let cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

        var blockOfCubes = new Array(blockSize.x);

        for (let x = 0; x < blockOfCubes.length; x++) {
            blockOfCubes[x] = new Array(blockSize.y);
            for (let y = 0; y < blockOfCubes[x].length; y++) {
                blockOfCubes[x][y] = new Array(blockSize.z);
                for (let z = 0; z < blockOfCubes[x][y].length; z++) {
                    //    var material = new THREE.MeshPhongMaterial({ color: 0x00FFFF, opacity: 0.1, transparent: true });
                    blockOfCubes[x][y][z] = new THREE.Mesh(cubeGeometry, cubeMaterial);;
                    blockOfCubes[x][y][z].isRemovable = true; // can be removed from scene when generating a new block
                    blockOfCubes[x][y][z].isWall = false; // will be used by raycasting to mark it a wall
                    blockOfCubes[x][y][z].isRaycastable = true; // detected by the raycaster
                    blockOfCubes[x][y][z].isStartOrEnd = false; // mark if it is a start or end point   
                    blockOfCubes[x][y][z].isAlgoPreviousStep = false; // mark if it was touched by an algorithm step
                    blockOfCubes[x][y][z].isShortestPath = false; // mark if it was touched by the shortest path animation
                    blockOfCubes[x][y][z].array3DCoordinates = new THREE.Vector3(x, y, z);
                    blockOfCubes[x][y][z].isHidden = false; // this is modified ONLY by this.updateVisibleLayers function
                    blockOfCubes[x][y][z].visible = false;
                    blockOfCubes[x][y][z].position.set(x * cubeSpacing, y * cubeSpacing, z * cubeSpacing);
                    scene.add(blockOfCubes[x][y][z]);
                }
            }
        }

        let boundingBox = new THREE.BoxHelper(scene, BOUNDING_BOX_COLOR);
        boundingBox.isRemovable = true;
        boundingBox.isRaycastable = false;
        scene.add(boundingBox);

        let orbitCenter = new THREE.Vector3(blockSize.x * cubeSpacing / 2, blockSize.y * cubeSpacing / 2, blockSize.z * cubeSpacing / 2);
        controls.target = orbitCenter;

        editingGridHelperUpper = new THREE.GridHelperXZ(blockSize.x * cubeSpacing, blockSize.z * cubeSpacing, blockSize.x, blockSize.z, HELPER_GRID_COLOR_UPPER, HELPER_GRID_COLOR_UPPER);
        editingGridHelperLower = new THREE.GridHelperXZ(blockSize.x * cubeSpacing, blockSize.z * cubeSpacing, blockSize.x, blockSize.z, HELPER_GRID_COLOR_LOWER, HELPER_GRID_COLOR_LOWER);
        editingGridHelperUpper.position.set((blockSize.x * cubeSpacing) / 2 + HELPER_GRID_OFFSET_UPPER, blockSize.y * cubeSpacing - CUBE_SIZE + HELPER_GRID_OFFSET_UPPER, (blockSize.z * cubeSpacing) / 2 + HELPER_GRID_OFFSET_UPPER);
        editingGridHelperLower.position.set((blockSize.x * cubeSpacing) / 2 - HELPER_GRID_OFFSET_LOWER, (blockSize.y - blockSize.y + 1) * cubeSpacing - CUBE_SIZE + HELPER_GRID_OFFSET_LOWER, (blockSize.z * cubeSpacing) / 2 - HELPER_GRID_OFFSET_LOWER);
        editingGridHelperUpper.isRemovable = true;
        editingGridHelperLower.isRemovable = true;
        scene.add(editingGridHelperUpper);
        scene.add(editingGridHelperLower);

        blockOfCubes.size = blockSize;
        blockOfCubes.cubeSpacing = cubeSpacing;
        return blockOfCubes;
    };

    this.addCubeEnteredWhileMouseDownEventHandler = function (eventHandler) {
        cubeEnteredWhileMouseDown = eventHandler;
    };

    this.addNewCubeEnteredEventHandler = function (eventHandler) {
        newCubeEntered = eventHandler;
    };

    this.addWallToggleEventHandler = function (eventHandler) {
        wallToggleEvent = eventHandler;
    };

    this.updateVisibleLayers = function (visibleLayers, blockOfCubes) {
        /**
         * The last visible upper row is 1 cube unit abow the upper grid helper position
         * The LAYER_SHIFT compensates this.
         * The last visible lower row is 1 cube unit below the lower grid helper position
         * 
         *  */
        const LAYER_SHIFT = 1;

        let dimensionX = blockOfCubes.size.x;
        let dimensionY = blockOfCubes.size.y;
        let dimensionZ = blockOfCubes.size.z;

        let limitUpper = visibleLayers.max;
        let limitLower = visibleLayers.min;

        if (limitUpper > dimensionY) limitUpper = dimensionY;
        if (limitLower < 0) limitLower = 0;

        for (let y = 0; y < limitLower - LAYER_SHIFT; y++)
            for (let x = 0; x < dimensionX; x++)
                for (let z = 0; z < dimensionZ; z++) {
                    if (!blockOfCubes[x][y][z].isStartOrEnd && !blockOfCubes[x][y][z].isShortestPath && (blockOfCubes[x][y][z].isAlgoPreviousStep || blockOfCubes[x][y][z].isWall)) {
                        blockOfCubes[x][y][z].visible = false;

                    }
                    blockOfCubes[x][y][z].isRaycastable = false;
                    blockOfCubes[x][y][z].isHidden = true;
                }

        for (let y = limitLower - LAYER_SHIFT; y < limitUpper; y++)
            for (let x = 0; x < dimensionX; x++)
                for (let z = 0; z < dimensionZ; z++) {
                    if (!blockOfCubes[x][y][z].isStartOrEnd && !blockOfCubes[x][y][z].isShortestPath && (blockOfCubes[x][y][z].isAlgoPreviousStep || blockOfCubes[x][y][z].isWall)) {
                        blockOfCubes[x][y][z].visible = true;

                    }
                    blockOfCubes[x][y][z].isRaycastable = true;
                    blockOfCubes[x][y][z].isHidden = false;
                }

        for (let y = limitUpper; y < dimensionY; y++)
            for (let x = 0; x < dimensionX; x++)
                for (let z = 0; z < dimensionZ; z++) {
                    if (!blockOfCubes[x][y][z].isStartOrEnd && !blockOfCubes[x][y][z].isShortestPath && (blockOfCubes[x][y][z].isAlgoPreviousStep || blockOfCubes[x][y][z].isWall)) {
                        blockOfCubes[x][y][z].visible = false;
                    }
                    blockOfCubes[x][y][z].isRaycastable = false;
                    blockOfCubes[x][y][z].isHidden = true;
                }
    };

    this.clearWalls = function (blockOfCubes, material) {
        let dimensionX = blockOfCubes.size.x;
        let dimensionY = blockOfCubes.size.y;
        let dimensionZ = blockOfCubes.size.z;

        for (let x = 0; x < dimensionX; x++)
            for (let y = 0; y < dimensionY; y++)
                for (let z = 0; z < dimensionZ; z++) {
                    if (blockOfCubes[x][y][z].isWall === true) {
                        blockOfCubes[x][y][z].material = material;
                        blockOfCubes[x][y][z].isWall = false;
                        blockOfCubes[x][y][z].visible = false;
                    }
                }
    };

    this.initializeControls = function (isTouchEnabled) {
        isTouchControl = isTouchEnabled;
        if (isTouchEnabled) {
            controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            }
            controls.mouseButtons = { // use the default settings in case of a touch enabled device
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
            window.addEventListener("touchstart", onTouchStart, false);
            window.addEventListener("touchend", onTouchEnd, false);
            window.addEventListener("touchcancel", onTouchEnd, false);
            window.addEventListener("touchmove", onTouchMove, false);
        } else {
            controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.PAN,
                RIGHT: THREE.MOUSE.DISABLE // just a random value, not present in the doc, the button is not used by the controls
            };
            window.addEventListener("mousedown", onMouseDown, false);
            window.addEventListener("mouseup", onMouseUp, false);
            window.addEventListener("mousemove", onMouseMove, false);
        }
    };

    this.enableOrbitControls = function (isEnabled) {
        controls.enabled = isEnabled;
    }

    this.updateControls = function () {
        controls.update();
    };

    this.render = function () {
        renderer.render(scene, camera);
    };

    this.setGridHelperVisibility = function (isVisible) {
        editingGridHelperUpper.visible = isVisible;
        editingGridHelperLower.visible = isVisible;
    };

    this.setPreviewHelperVisibility = function (isVisible) {
        previewHelper3DObject.visible = isVisible;
    };

    this.createStartPointAndAddToScene = function (geometry, material, position, cubeSpacing) {
        startPoint3DObject = new THREE.Mesh(geometry, material);
        startPoint3DObject.position.set(position.x * cubeSpacing, position.y * cubeSpacing, position.z * cubeSpacing);
        startPoint3DObject.isRemovable = true;
        scene.add(startPoint3DObject);
    };

    this.createEndPointAndAddToScene = function (geometry, material, position, cubeSpacing) {
        endPoint3DObject = new THREE.Mesh(geometry, material);
        endPoint3DObject.position.set(position.x * cubeSpacing, position.y * cubeSpacing, position.z * cubeSpacing);
        endPoint3DObject.isRemovable = true;
        scene.add(endPoint3DObject);
    };

    this.createPreviewHelperAndAddToScene = function (position, cubeSpacing) {
        previewHelperBaseBox = new THREE.Box3();
        previewHelperBaseBox.setFromCenterAndSize(new THREE.Vector3(position.x * cubeSpacing, position.y * cubeSpacing, position.z * cubeSpacing), new THREE.Vector3(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE));
        previewHelper3DObject = new THREE.Box3Helper(previewHelperBaseBox, HELPER_CUBE_COLOR);
        previewHelper3DObject.isRemovable = true;
        scene.add(previewHelper3DObject);
    };

    this.updateGridHelperYPosition = function (positionsY) {
        // modifying the Y position component
        editingGridHelperUpper.position.setComponent(1, positionsY.max * blockOfCubes.cubeSpacing - CUBE_SIZE + HELPER_GRID_OFFSET_UPPER);
        editingGridHelperLower.position.setComponent(1, positionsY.min * blockOfCubes.cubeSpacing - CUBE_SIZE - HELPER_GRID_OFFSET_LOWER + 1);
    };

    this.updateStartPointPosition = function (position, cubeSpacing) {
        startPoint3DObject.position.set(position.x * cubeSpacing, position.y * cubeSpacing, position.z * cubeSpacing);
    };

    this.updateEndPointPosition = function (position, cubeSpacing) {
        endPoint3DObject.position.set(position.x * cubeSpacing, position.y * cubeSpacing, position.z * cubeSpacing);
    };

    this.updatePreviewHelperPosition = function (position, cubeSpacing) {
        previewHelperBaseBox.setFromCenterAndSize(position.multiplyScalar(cubeSpacing), new THREE.Vector3(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE));
    };

    this.rotateStartPoint = function (rotation) {
        startPoint3DObject.rotation.copy(rotation);
    };

    this.rotateEndPoint = function (rotation) {
        endPoint3DObject.rotation.copy(rotation);
    };

    this.animateRotateStartPoint = function (rotation) {
        startPoint3DObject.rotation.x += rotation.x;
        startPoint3DObject.rotation.y += rotation.y;
        startPoint3DObject.rotation.z += rotation.z;
    };

    this.animateRotateEndPoint = function (rotation) {
        endPoint3DObject.rotation.x += rotation.x;
        endPoint3DObject.rotation.y += rotation.y;
        endPoint3DObject.rotation.z += rotation.z;
    };
}
