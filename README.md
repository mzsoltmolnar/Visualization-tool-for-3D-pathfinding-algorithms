# Online 3D Pathfinding Algorithm Visualization Tool

My goal with the project was to teach myself WebGL based graphics and related technologies. As a result, the application has an editable 3D environment, which permits the user to build his own obstacle course for pathfinding algorithms in a 3-dimensional space. The 3D editor enables moving the start and endpoints, adding/removing walls (obstacles), and resizing the 3D space available for the algorithm.

The app is desktop- and mobile-optimized (Chrome browser recommended in both cases), [and you can access it here.](https://mzsoltmolnar.github.io/Visualization-tool-for-3D-pathfinding-algorithms/)

Or view a short video demoing the [apps main features here.](https://www.youtube.com/watch?v=W9REW3eIVRQ)

### Table of contents

<!--ts-->
   * [Project Structure](#project-structure)
   * [The Pathfinding Algorithms](#the-pathfinding-algorithms)
   * [Technologies](#technologies)
<!--te-->

<p align="center">
<img width=100% height=100% src="/resources-readme/editing.jpg">
</p>

## Project Structure
The files are structured according to the MVC design pattern. This makes it easier to extend or edit the capabilities of the visualization tool. The app was mainly written in JavaScript, using HTML and CSS to design the 2D control interface.

- **lib:** the used libraries

- **view:** HTML, JS and CSS files related to the 3D visualizer and the 2D user interface panel. Also contains the figures used for the help menu

- **model:** JS files of the pathfinding algorithms

- **controller:** contains a single JS file connecting the 2D and 3D interface with the pathfinders

## The Pathfinding Algorithms

In our case, in the 3D space, the algorithm has 3 degrees of freedom: left-right, back-forth and up-down. Each movement has a cost&nbsp;of&nbsp;1. No diagonal movements are allowed.

- **Dijkstra's algorithm:** Implements the classical version of the algorithm by searching for the endpoint in each possible direction of the 3D space. This algorithm will find the possible shortest path.

- **A-Star:** It is an extension of Dijkstra's algorithm by implementing heuristics. In contrast with Dijkstra's algorithm, A* calculates the direct distance from the actual position to the endpoint, based on their coordinates. This results in a possible shortest path. The algorithm will use the calculated direct distance to move first in the direction of the nodes with the lowest heuristic. This results in a more optimal runtime. In this case, the direct distance is calculated using the Manhattan distance.

- **Square heuristic penalized A-Star:** Same as the previous algorithm, but the direct distance is calculated with Euclidean distance without calculating the result's square root. In some cases, this approach results in a more optimal runtime than using the Manhattan distance, but the returned path is not always the shortest one.

- **Euclidean heuristic penalized A-Star:** Same as the previous algorithm, but the direct distance is calculated with Euclidean distance instead of the Manhattan distance. The runtime is similar to A* with the Manhattan distance.


## Technologies

- [**jQuery v3.5.1:**](https://jquery.com/)

- [**Bootstrap v4.5.2**](https://getbootstrap.com/)

-  [**ThreeJS:**](https://threejs.org/) a lightweight JS 3D library that uses the WebGL renderer

- [**bootstrap-slider.js v11.0.2:**](http://seiyria.com/bootstrap-slider/) extends the capabilities of the standard slider

- **VS Code**

  <hr>
  
  #### For more projects and research, visit my website: https://mzsoltmolnar.github.io/
