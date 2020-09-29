function PathfindingSqHP_AStar(blockOfCubes, startPoint, endPoint) {
    /**
     * NOTE: the Square heuristic penalized A-Star uses the square of the Euclidean distance. This results in an algorithm that touches less nodes than the
     * classical A-Star BUT as a side effect, not every time returns the shortest path.
     * 
     ****************************************
     *--------------------------------------*
     *-----------wwwwwwwwwwww---------------*
     *----------------------w---------------*
     *----------------------w---------------*
     *------S---------------w-----------E---*
     *----------------------w---------------*
     *----------------------w---------------*
     *----------------------w---------------*
     *-----------wwwwwwwwwwww---------------*
     ****************************************
     *
     * One of the edge cases is illustrated above:
     * - S - start point
     * - E - end point
     * - w - walls
     * 
     * In this case, if the S is outside of the "bucket", the shortest path will go to the bottom of the bucket first, then back to the edge
     * of the bucket.

     * The connections between neighbors are bidirectional and have the same weight in each direction, which is 1.
     * 
     */

    var step = new THREE.Vector3(0, 0, 0);
    var stepPrevious = new THREE.Vector3(-1, -1, -1);
    var isTrapped = false;
    var isFinished = false;
    var isShortestPathReady = false;

    const size_x = blockOfCubes.size.x;
    const size_y = blockOfCubes.size.y;
    const size_z = blockOfCubes.size.z;

    step.copy(startPoint);

    var nodes = []; // the array that will hold all of the nodes in 1 dimension
    var shortestPath = [];
    var nodesBlock = new Array(size_x); // the array that will hold the same nodes but can be referenced in 3 dimensions
    let ix = 0, iy = 0, iz = 0; // indexes used in for loops

    // generating the 1 and 3 dimensional arrays, having reference to the same nodes
    for (ix = 0; ix < size_x; ix++) {
        nodesBlock[ix] = new Array(size_y);
        for (iy = 0; iy < size_y; iy++) {
            nodesBlock[ix][iy] = new Array(size_z);
            for (iz = 0; iz < size_z; iz++) {
                let tempNode = getNodeFromBlock(ix, iy, iz, blockOfCubes);
                nodes.push(tempNode);
                nodesBlock[ix][iy][iz] = tempNode;
            }
        }
    }

    addConnectionsToNodes(nodes, nodesBlock);

    nodesBlock[startPoint.x][startPoint.y][startPoint.z].weight = 0;
    nodesBlock[startPoint.x][startPoint.y][startPoint.z].heuristic = getDistance(startPoint, endPoint);
    nodesBlock[startPoint.x][startPoint.y][startPoint.z].previousNode = null;

    function getNodeFromBlock(ix, iy, iz, blockOfCubes) {
        let node = {
            x: ix,
            y: iy,
            z: iz,
            isWall: blockOfCubes[ix][iy][iz].isWall,
            weight: Infinity,
            heuristic: Infinity,
            isVisited: false,
            previousNode: null,
            equals: function (pointObj) {
                if ((this.x === pointObj.x) && (this.y === pointObj.y) && (this.z === pointObj.z)) {
                    return true;
                } else {
                    return false;
                }
            },
        };
        node.adjacentNodes = [];
        return node;
    }

    function addConnectionsToNodes(nodes, nodesBlock) {
        const size_x = nodesBlock.length;
        const size_y = nodesBlock[0].length;
        const size_z = nodesBlock[0][0].length;

        for (let node of nodes) {
            if (node.x < size_x - 1) { node.adjacentNodes.push(nodesBlock[node.x + 1][node.y][node.z]); }
            if (node.x > 0) { node.adjacentNodes.push(nodesBlock[node.x - 1][node.y][node.z]); }
            if (node.y < size_y - 1) { node.adjacentNodes.push(nodesBlock[node.x][node.y + 1][node.z]); }
            if (node.y > 0) { node.adjacentNodes.push(nodesBlock[node.x][node.y - 1][node.z]); }
            if (node.z < size_z - 1) { node.adjacentNodes.push(nodesBlock[node.x][node.y][node.z + 1]); }
            if (node.z > 0) { node.adjacentNodes.push(nodesBlock[node.x][node.y][node.z - 1]); }
        }
    }

    this.getAlgorithmStep = function () {

        // copying the previous step
        stepPrevious.copy(step);

        // generating the next step
        if (!(nodes.length === 0) && !isTrapped && !isFinished) {
            sortNodesByHeuristic(nodes);
            let temp = [];
            for (let nod of nodes) {
                temp.push(nod.heuristic);
            }
            let nodeClosest = nodes.shift();
            if (nodeClosest.isWall) return stepPrevious; // if it is a wall, we skip it
            if (nodeClosest.weight === Infinity) { isTrapped = true; } // we are trapped
            nodeClosest.isVisited = true;
            if (nodeClosest.equals(endPoint) === true) { // if the endpoint was reached
                let nodeCurrent = nodeClosest;

                while (!(nodeCurrent.previousNode === null)) {
                    shortestPath.unshift({
                        x: nodeCurrent.x,
                        y: nodeCurrent.y,
                        z: nodeCurrent.z
                    });
                    nodeCurrent = nodeCurrent.previousNode;
                }
                // adding the start node which has the previous node property null
                shortestPath.unshift({
                    x: nodeCurrent.x,
                    y: nodeCurrent.y,
                    z: nodeCurrent.z,
                });
                isShortestPathReady = true;
                isFinished = true;
            }
            step.copy(nodeClosest);
            updateUnvisitedAdjacentNodes(nodeClosest, endPoint);
            return step;
        }
        else { return stepPrevious; }
    };


    function sortNodesByHeuristic(nodes) {
        nodes.sort(function (node_1, node_2) { return node_1.heuristic - node_2.heuristic; });
    }

    function updateUnvisitedAdjacentNodes(nodeClosest, toNode) {
        let unvisitedAdjacentNodes = nodeClosest.adjacentNodes.filter(function (adjacent) { return !adjacent.isVisited });
        for (let adjacent of unvisitedAdjacentNodes) {
            adjacent.weight = nodeClosest.weight + 1;
            let tempVector = new THREE.Vector3(adjacent.x, adjacent.y, adjacent.z);
            adjacent.heuristic = getDistance(tempVector, toNode) + adjacent.weight;
            adjacent.previousNode = nodeClosest;
        }
    }

    function getDistance(fromNode, toNode) {
        return fromNode.distanceToSquared(toNode);
    }

    this.getAlgorithmStepPrevious = function () {
        return stepPrevious;
    };

    this.isFinishedAlgortihmSteps = function () {
        if (!(nodes.length === 0) && !isTrapped && !isFinished) { return false; }
        else { return true; }
    };


    this.getShortestPathStep = function () {
        if (isShortestPathReady && (shortestPath.length > 0)) {
            return shortestPath.shift();
        }
    };

    this.isFinishedShortestPathSteps = function () {
        if (shortestPath.length > 0) { return false; }
        else { return true; }
    };
}