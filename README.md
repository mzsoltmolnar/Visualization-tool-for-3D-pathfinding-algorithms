# 3D Pathfinding Algorithm Visualization Tool

My goal with the project was to teach myself WebGL based graphics and related technologies. As a result, the application has an editable 3D environment, which permits the user to build his own obstacle course for pathfinding algorithms in a 3-dimensional space. The 3D editor enables moving the start and endpoints, adding/removing walls (obstacles), and resizing the 3D space available for the algorithm.<br><br>
The app is desktop- and mobile-optimized (Chrome browser recommended in both cases), and you can [access it here.](https://mzsoltmolnar.github.io/Visualization-tool-for-3D-pathfinding-algorithms/)

## Project Structur
The files are structured according to the MVC design pattern. This makes it easier to extend or edit the capabilities of the visualization tool.

- **lib:** the used libraries

- **view:** html, js and css files related to the 3D visualizer and the user interface panel

- **model:** js files of the pathfinding algorithms

- **controller:** contains a single js file connecting the 2D and 3D interface with the pathfinders

## The Pathfinding Algorithms
