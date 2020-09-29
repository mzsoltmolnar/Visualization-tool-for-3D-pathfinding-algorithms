const CUBE_SPACING = 1;
const ANIMATION_INTERVAL_ALGO_STEPS_MS = 50;
const ANIMATION_INTERVAL_SHORTEST_PATH_MS = 100;
const INITIAL_START_POIN_ROTATION = new THREE.Euler(1.5708, 0, 0, "XYZ");
const INITIAL_END_POIN_ROTATION = new THREE.Euler(1.5708, 0, 0, "XYZ");
const ANIMATION_START_POINT_ROTATION = new THREE.Vector3(0, 0, 0.025);
const ANIMATION_END_POINT_ROTATION = new THREE.Vector3(0, 0, -0.050);

var startPointCurrentRotation = new THREE.Vector3(0, 0, 0);
var endPointCurrentRotation = new THREE.Vector3(0, 0, 0);

var startPoint = new THREE.Vector3(0, 0, 0);
var endPoint = new THREE.Vector3(0, 0, 0);
var previewHelperPosition = new THREE.Vector3(0, 0, 0);

var visualizer_3d;
var ui;
var blockOfCubes;
var pathfinder;
var intervalID;
/**
 * ground state: "stopped"
 * pathfinder animation steps running: "pathfinding"
 * shortest path animation next: "startShortestPath"
 * shortest path animation running: "shortestPath"
 * finished: "finished"
 */
var state = "stopped";
var isStartStopWallChanged = false;
var animationIntervalAlgoStepsMs = ANIMATION_INTERVAL_ALGO_STEPS_MS;

/** FIRST FUNCTION CALL */
/** Insterting UI html code */
$("#pageLoadingModal").modal("show");
$(document).ready(function () { $("#user-interface").load("view/user_interface.html"); });

function afterUserInterfaceHtmlLoadFinished() { // this function is called from the user_interface.html

  visualizer_3d = new Visualizer_3D();
  ui = new UserInterface(uiChangeOccured);
  visualizer_3d.initializeControls(ui.isTouchEnabled());
  visualizer_3d.addCubeEnteredWhileMouseDownEventHandler(visualizer3DNewCubeEnteredWhileMouseDown);
  visualizer_3d.addNewCubeEnteredEventHandler(visualizer3DNewCubeEntered);
  visualizer_3d.enableOrbitControls(true);

  initializeBlockOfCubes();

  render();

  setTimeout(function () {
    $("#pageLoadingModal").modal("hide");
    ui.showHelpModal();
  }, 2000);
}

/** Everything placed inside this function is executed once per frame update */
function render() {
  requestAnimationFrame(render);

  visualizer_3d.updateControls();

  visualizer_3d.animateRotateStartPoint(ANIMATION_START_POINT_ROTATION);
  visualizer_3d.animateRotateEndPoint(ANIMATION_END_POINT_ROTATION);

  visualizer_3d.render();
}
/** END of render loop */

/** Animation Loop - called in every animationIntervalAlgoStepsMs interval */
var animationLoop = function () {
  if (state === "pathfinding") {
    if (pathfinder.isFinishedAlgortihmSteps() === false) {
      addAlgorithmStep();
    }
    else {
      state = "startShortestPath";
      changeAlgorithmStepsMaterial(MaterialPresets.MATERIAL_ALGORITHM_STEP_PREVIOUS_TRANSPARENT);
      clearInterval(intervalID);
      intervalID = false;
    }
  }

  if (state === "startShortestPath") {
    intervalID = setInterval(animationLoop, ANIMATION_INTERVAL_SHORTEST_PATH_MS);
    state = "shortestPath";
  }

  if (state === "shortestPath") {
    if (pathfinder.isFinishedShortestPathSteps() === false) {
      addAlgorithmShortestPathSteps();
    }
    else {
      state = "stopped";
      clearInterval(intervalID);
      intervalID = false;
      ui.setStartStopButtonBaseState();
    }
  }
};
/** END of animation loop */

function uiChangeOccured(event) {
  if (event === "sizeChanged") {
    initializeBlockOfCubes();
    ui.updateHideLayersSliderRange();
    /*  let visibleLayersRange = ui.getVisibleLayerRange();
      visualizer_3d.updateVisibleLayers(visibleLayersRange, blockOfCubes);
      visualizer_3d.updateGridHelperYPosition(visibleLayersRange);*/
  }

  if (event === "showLayersChanged") {
    let visibleLayersRange = ui.getVisibleLayerRange();
    visualizer_3d.updateVisibleLayers(visibleLayersRange, blockOfCubes);
    visualizer_3d.updateGridHelperYPosition(visibleLayersRange);
  }

  if (event === "clearWallClicked") {
    clearInterval(intervalID);
    intervalID = false;
    ui.setStartStopButtonBaseState();
    resetWalls();
    state = "stopped";
  }

  if (event === "startClicked") {
    ui.disableUIElements(true);
    if (state === "stopped" || isStartStopWallChanged === true) {
      resetAnimation();
      isStartStopWallChanged = false;
      state = "pathfinding";
      intervalID = setInterval(animationLoop, animationIntervalAlgoStepsMs);
    } else {
      if (state === "shortestPath") {
        intervalID = setInterval(animationLoop, ANIMATION_INTERVAL_SHORTEST_PATH_MS);
      } else {
        intervalID = setInterval(animationLoop, animationIntervalAlgoStepsMs);
      }
    }
  }

  if (event === "pauseClicked") {
    clearInterval(intervalID);
    intervalID = false;
  }

  if (event === "resetClicked") {
    clearInterval(intervalID);
    intervalID = false;
    ui.setStartStopButtonBaseState();
    resetAnimation();
    ui.disableUIElements(false);
    state = "stopped";
  }

  if (event === "orbitControlClicked") {
    visualizer_3d.setGridHelperVisibility(false);
    visualizer_3d.setPreviewHelperVisibility(false);
    if (ui.isTouchEnabled()) { visualizer_3d.enableOrbitControls(true); }
  }

  if (event === "mapEdit") {
    visualizer_3d.setGridHelperVisibility(true);
    visualizer_3d.setPreviewHelperVisibility(true);
    if (ui.isTouchEnabled()) { visualizer_3d.enableOrbitControls(false); }
  }

  if (event === "animationSpeedChanged") {
    animationIntervalAlgoStepsMs = ui.getAnimationSpeedSliderValue();
    //  console.log("Current animation speed: " + animationIntervalAlgoStepsMs);
    // console.log("intervalID: " + intervalID + " state: " + state);
    if ((intervalID !== false) && (state === "pathfinding")) {
      clearInterval(intervalID);
      intervalID = false;
      intervalID = setInterval(animationLoop, animationIntervalAlgoStepsMs);
    }
  }
}

function visualizer3DNewCubeEnteredWhileMouseDown(clickedCubePosition) { // as parameter the clicked cube coordinates will be sent

  if (ui.getCurrentMapEditState() !== "orbitControl") {
    if (ui.getCurrentMapEditState() === "addStartPoint") {
      if (ui.getUIElementsDisabledState() === false) {
        updateStartPoint(clickedCubePosition, startPoint);
        isStartStopWallChanged = true;
      }
    }

    if (ui.getCurrentMapEditState() === "addEndPoint") {
      if (ui.getUIElementsDisabledState() === false) {
        updateEndPoint(clickedCubePosition, endPoint);
        isStartStopWallChanged = true;
      }
    }

    if (ui.getCurrentMapEditState() === "addWall") {
      if (ui.getUIElementsDisabledState() === false) {
        updateAddRemoveWall(clickedCubePosition);
        isStartStopWallChanged = true;
      }
    }
  }
  else { }
}

function visualizer3DNewCubeEntered(enteredCubePosition) {
  if (ui.getCurrentMapEditState() !== "orbitControl") {
    updatePreviewHelperPosition(enteredCubePosition, previewHelperPosition);
  }
}

function updatePreviewHelperPosition(newPosition, oldPosition) {
  /* blockOfCubes[oldPosition.x][oldPosition.y][oldPosition.z].visible = true;
   blockOfCubes[newPosition.x][newPosition.y][newPosition.z].visible = false;*/

  visualizer_3d.updatePreviewHelperPosition(newPosition, CUBE_SPACING);
  oldPosition.copy(newPosition);
}


function initializeBlockOfCubes() {
  blockOfCubes = visualizer_3d.generateBlockOfCubes(ui.getCurrentDimensions(), CUBE_SPACING, MaterialPresets.MATERIAL_BASE);
  startPoint = new THREE.Vector3(0, Math.round((blockOfCubes.size.y - 1) / 2), Math.round((blockOfCubes.size.z - 1) / 2));
  endPoint = new THREE.Vector3(blockOfCubes.size.x - 1, Math.round((blockOfCubes.size.y - 1) / 2), Math.round((blockOfCubes.size.z - 1) / 2));
  updatePathfinder(ui.getCurrentlySelectedAlgorithm());
  visualizer_3d.createStartPointAndAddToScene(GeometryPresets.GEOMETRY_POINT_START_SPHERE, MaterialPresets.MATERIAL_POINT_START, startPoint, CUBE_SPACING);
  visualizer_3d.createEndPointAndAddToScene(GeometryPresets.GEOMETRY_POINT_END_CYLINDER, MaterialPresets.MATERIAL_POINT_END, endPoint, CUBE_SPACING);
  visualizer_3d.createPreviewHelperAndAddToScene(previewHelperPosition, CUBE_SPACING)
  visualizer_3d.rotateStartPoint(INITIAL_START_POIN_ROTATION);
  visualizer_3d.rotateEndPoint(INITIAL_END_POIN_ROTATION);
  updateStartPoint(startPoint, startPoint);
  updateEndPoint(endPoint, endPoint);
  updatePreviewHelperPosition(previewHelperPosition, previewHelperPosition);
  //  visualizer_3d.orbitControlsEnabled(true);
  visualizer_3d.setGridHelperVisibility(false);
  visualizer_3d.setPreviewHelperVisibility(false);
  ui.setStartStopButtonBaseState();
  ui.setMapEditButtonsBaseState();
}

function resetWalls() {
  visualizer_3d.clearWalls(blockOfCubes, MaterialPresets.MATERIAL_BASE);
  updatePathfinder(ui.getCurrentlySelectedAlgorithm());
}

function resetAnimation() {
  let x = blockOfCubes.size.x;
  let y = blockOfCubes.size.y;
  let z = blockOfCubes.size.z;

  for (let xi = 0; xi < x; xi++) {
    for (let yi = 0; yi < y; yi++) {
      for (let zi = 0; zi < z; zi++) {
        if (!blockOfCubes[xi][yi][zi].isWall) {
          blockOfCubes[xi][yi][zi].isAlgoPreviousStep = false;
          blockOfCubes[xi][yi][zi].isShortestPath = false;
          blockOfCubes[xi][yi][zi].visible = false;
          blockOfCubes[xi][yi][zi].material = MaterialPresets.MATERIAL_BASE;
        }
      }
    }
  }

  blockOfCubes[startPoint.x][startPoint.y][startPoint.z].isWall = false; // remove the wall from the start point
  blockOfCubes[endPoint.x][endPoint.y][endPoint.z].isWall = false; // remove the wall from the end point
  updateStartPoint(startPoint, startPoint);
  updateEndPoint(endPoint, endPoint);
  updatePathfinder(ui.getCurrentlySelectedAlgorithm());
}

function addAlgorithmStep() {
  let currentCube = pathfinder.getAlgorithmStep();
  blockOfCubes[currentCube.x][currentCube.y][currentCube.z].material = MaterialPresets.MATERIAL_ALGORITHM_STEP;
  blockOfCubes[currentCube.x][currentCube.y][currentCube.z].isAlgoPreviousStep = true; // mark that the specific cube was touched by the pathfinder algo
  if (!blockOfCubes[currentCube.x][currentCube.y][currentCube.z].isHidden) {
    blockOfCubes[currentCube.x][currentCube.y][currentCube.z].visible = true;
  }

  let previousCube = pathfinder.getAlgorithmStepPrevious();
  if (previousCube.x >= 0) {
    blockOfCubes[previousCube.x][previousCube.y][previousCube.z].material = MaterialPresets.MATERIAL_ALGORITHM_STEP_PREVIOUS;
  }
}

function addAlgorithmShortestPathSteps() {
  let currentCube = pathfinder.getShortestPathStep();
  blockOfCubes[currentCube.x][currentCube.y][currentCube.z].material = MaterialPresets.MATERIAL_SHORTEST_PATH_STEP;
  blockOfCubes[currentCube.x][currentCube.y][currentCube.z].visible = true;
  blockOfCubes[currentCube.x][currentCube.y][currentCube.z].isShortestPath = true;
}

function changeAlgorithmStepsMaterial(material) {
  let x = blockOfCubes.size.x;
  let y = blockOfCubes.size.y;
  let z = blockOfCubes.size.z;

  for (let xi = 0; xi < x; xi++) {
    for (let yi = 0; yi < y; yi++) {
      for (let zi = 0; zi < z; zi++) {
        if (blockOfCubes[xi][yi][zi].isAlgoPreviousStep === true) {
          blockOfCubes[xi][yi][zi].material = material;
        }
      }
    }
  }
}

function updatePathfinder(type) {
  if (type == "dijkstra") { pathfinder = new PathfindingDijkstra(blockOfCubes, startPoint, endPoint); }
  else if (type == "astar") { pathfinder = new PathfindingAStar(blockOfCubes, startPoint, endPoint); }
  else if (type == "sqhpastar") { pathfinder = new PathfindingSqHP_AStar(blockOfCubes, startPoint, endPoint); }
  else if (type == "euclhpastar") { pathfinder = new PathfindingEuclideanHP_AStar(blockOfCubes, startPoint, endPoint); }
  else { pathfinder = new PathfindingDijkstra(blockOfCubes, startPoint, endPoint); } // the default is Dijkstra
}

function updateStartPoint(newPosition, oldPosition) {
  // hiding the cube in the main block and placing the start point 3D object there
  if (blockOfCubes[oldPosition.x][oldPosition.y][oldPosition.z].isWall === true) {
    blockOfCubes[oldPosition.x][oldPosition.y][oldPosition.z].visible = true;
  }
  blockOfCubes[oldPosition.x][oldPosition.y][oldPosition.z].isStartOrEnd = false;

  if (blockOfCubes[newPosition.x][newPosition.y][newPosition.z].isWall === true) {
    blockOfCubes[newPosition.x][newPosition.y][newPosition.z].visible = false;
  }
  blockOfCubes[newPosition.x][newPosition.y][newPosition.z].isStartOrEnd = true;
  visualizer_3d.updateStartPointPosition(newPosition, CUBE_SPACING);
  oldPosition.copy(newPosition);
}

function updateEndPoint(newPosition, oldPosition) {
  if (blockOfCubes[oldPosition.x][oldPosition.y][oldPosition.z].isWall === true) {
    blockOfCubes[oldPosition.x][oldPosition.y][oldPosition.z].visible = true;
  }
  blockOfCubes[oldPosition.x][oldPosition.y][oldPosition.z].isStartOrEnd = false;

  if (blockOfCubes[newPosition.x][newPosition.y][newPosition.z].isWall === true) {
    blockOfCubes[newPosition.x][newPosition.y][newPosition.z].visible = false;
  }
  blockOfCubes[newPosition.x][newPosition.y][newPosition.z].isStartOrEnd = true;
  visualizer_3d.updateEndPointPosition(newPosition, CUBE_SPACING);
  oldPosition.copy(newPosition);
}

function updateAddRemoveWall(newPosition) {
  if (!newPosition.equals(startPoint) && !newPosition.equals(endPoint)) {
    if (blockOfCubes[newPosition.x][newPosition.y][newPosition.z].isWall === false) {
      blockOfCubes[newPosition.x][newPosition.y][newPosition.z].material = MaterialPresets.MATERIAL_WALL;
      blockOfCubes[newPosition.x][newPosition.y][newPosition.z].isWall = true;
      blockOfCubes[newPosition.x][newPosition.y][newPosition.z].visible = true;
    }
    else {
      blockOfCubes[newPosition.x][newPosition.y][newPosition.z].material = MaterialPresets.MATERIAL_BASE;
      blockOfCubes[newPosition.x][newPosition.y][newPosition.z].isWall = false;
      blockOfCubes[newPosition.x][newPosition.y][newPosition.z].visible = false;
    }
  }
}