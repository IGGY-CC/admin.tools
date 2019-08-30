// SOURCE FILE: admin.tools/src/main/scripts/window-grid/window-grid.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


let utilListeners = require('../utils/util_listeners');
let utilResizer = require('../utils/util_resizer');

let GridWindow = {};

GridWindow = function(container, handle) {
    this.container = document.querySelector(container);
    this.resizeHandles = document.querySelectorAll(handle);
    this.gridName = null;
    this.gridTemplateAreas = null;
    this.templateRows = [];
    this.gridIndexes = {};
    this.axis = null;
    this.direction = null;

    this.getAreaMap();
    this.registerHandles();
};

GridWindow.constants = {
    VERTICAL: 1,
    HORIZONTAL: 2,
    RIGHT: 4,
    LEFT: 8,
    TOP: 16,
    BOTTOM: 32,
};

GridWindow.prototype.getAreaMap = function() {
    let computedStyle = getComputedStyle(this.container);
    this.gridTemplateAreas = computedStyle.gridTemplateAreas;
    let rows = this.gridTemplateAreas.match(/"([^"]+)"/g);
    rows.forEach(row => {
       let tmpRow = row.replace(/'+|"+/g, '').split(' ');
       this.templateRows.push(tmpRow);
    });
};

GridWindow.prototype.getGridIndex = function(name, row=true) {
    let key = name + "-" + row;
    if(this.gridIndexes[key]) {
        return this.gridIndexes[key];
    }

    /**
     * This loop detects where the current element (gridName) falls in.
     * As the gridArea is a matrix of rows and columns, the first time
     * the gridName is found becomes the gridName location. If we are
     * checking for horizontal axis, it is the row number (rowIndex)
     * else it will be the column index.
     */
    let rowIndex = 0;
    let gridIndex = -1;

    for (let templateRow of this.templateRows) {
        // Column index
        gridIndex = templateRow.indexOf(name);
        if (gridIndex > -1) {
            // Row index
            if (row) gridIndex = rowIndex;
            break;
        }
        rowIndex += 1;
    }
    this.gridIndexes[key] = gridIndex;
    return gridIndex;
};

GridWindow.prototype.getAreaValues = function(rows=true) {
    let computedStyle = getComputedStyle(this.container);
    /**
     * Get the measurements of cols or rows as declared with
     * grid-template-rows or grid-template-columns
     */
    if(rows) {
        return computedStyle.gridTemplateRows.split(' ');
    } else {
        return computedStyle.gridTemplateColumns.split(' ');
    }
};

GridWindow.prototype.registerHandles = function() {
    // Pull all the elements with resizeHandle and register mousedown/touchdown eventlistener.
    for (let i=0; i<= this.resizeHandles.length-1; i++){
        utilListeners.addRemoveListener("mousedown", this.startResizing.bind(this), false, this.resizeHandles[i]);
    }

    // Register a callback for each element whose min/max size needs to be considered or gets effected
    utilResizer.onResize((e) => {
        this.updateCellSize("main-content", false, window.innerWidth, null, true);
        this.updateCellSize("main-content", true, window.innerHeight, null, true);
    });
};

GridWindow.prototype.startResizing = function(event) {
    let column = event.target;
    for (let i=0; i<= this.resizeHandles.length-1; i++){
        if (column === this.resizeHandles[i]){
            this.axis = (this.resizeHandles[i].parentNode.className.includes("vertical"))?
                            GridWindow.constants.VERTICAL : GridWindow.constants.HORIZONTAL;
            let computedStyle = Object.assign({}, getComputedStyle(this.resizeHandles[i].parentElement));
            if(this.axis === GridWindow.constants.VERTICAL) {
                this.direction = (this.resizeHandles[i].parentNode.className.includes("left"))?
                    GridWindow.constants.LEFT : GridWindow.constants.RIGHT;
                if(this.direction === GridWindow.constants.LEFT) {
                    this.gridName = computedStyle.gridColumnStart;
                } else {
                    this.gridName = computedStyle.gridColumnEnd;
                }
            } else {
                this.direction = (this.resizeHandles[i].parentNode.className.includes("top"))?
                    GridWindow.constants.TOP : GridWindow.constants.BOTTOM;
                if(this.direction === GridWindow.constants.TOP) {
                    this.gridName = computedStyle.gridRowStart;
                } else {
                    this.gridName = computedStyle.gridRowEnd;
                }
            }
        }
    }

    utilListeners.addRemoveListener( "mousemove", this.resizeColumn.bind(this));
    utilListeners.addRemoveListener("mouseup", this.finishResizing.bind(this));
};

GridWindow.prototype.getMinMax = function(name, row=true) {
    let minSize, maxSize;
    let targetElementCS = getComputedStyle(document.querySelector("#" + name));
    if(row) {
        minSize = targetElementCS.minHeight;
        maxSize = targetElementCS.maxHeight;
    } else {
        minSize = targetElementCS.minWidth;
        maxSize = targetElementCS.maxWidth;
    }
    return {minSize: minSize, maxSize: maxSize};
};

GridWindow.prototype.updateNewAreaValues = function(gridSizeArray, rows=true) {
    /**
     * Update the setting with the calculated value.
     */
    if(rows) {
        this.container.style.gridTemplateRows = gridSizeArray.join(' ');
    } else {
        this.container.style.gridTemplateColumns = gridSizeArray.join(' ');
    }
};

GridWindow.prototype.resizeColumn = function(event) {
    /**
     * Mouse position in pixels
     */
    let isHorizontal = this.axis === GridWindow.constants.HORIZONTAL;
    let mousePosition =  (isHorizontal)? event.clientY : event.clientX;
    let minMax = this.getMinMax(this.gridName, isHorizontal);
    let gridIndex = this.getGridIndex(this.gridName, isHorizontal);
    let gridSizeArray = this.getAreaValues(isHorizontal);
    let spaceBefore = 0;

    /**
     * If the resizer is at the front/start of the element/cell, total size of cells
     * before the current cell is taken. If the resizer is on the end of
     * the element/cell, then the total size of cells including the current
     * cell is taken.
     */
    let includeCurrentCell = (this.direction === GridWindow.constants.RIGHT || this.direction === GridWindow.constants.BOTTOM)? 1 : 0;

    for (let i = 0; i < (gridIndex + includeCurrentCell); i++) {
        spaceBefore += parseInt(gridSizeArray[i]);
    }

    /**
     * Get the adjacent cell widths/heights including current cell
     */
    let prevElementSize = parseInt(gridSizeArray[gridIndex-1]);
    let crntElementSize = parseInt(gridSizeArray[gridIndex]);
    let nextElementSize = parseInt(gridSizeArray[gridIndex+1]);

    /**
     * Calculate the different from the current mouse position to the
     * total space calculated before the current cell. If the value
     * is negative, the mouse is moving in the opposite direction.
     * (current cell size increases if resizer is at start of the cell
     * or decreases if resizer is at end of the cell)
     */
    let pixelDifference = mousePosition - spaceBefore;


    if(this.direction === GridWindow.constants.LEFT || this.direction === GridWindow.constants.TOP) {
        gridSizeArray[gridIndex] = (crntElementSize - pixelDifference) + "px";
        gridSizeArray[gridIndex - 1] = (prevElementSize + pixelDifference) + "px";
    } else {
        gridSizeArray[gridIndex] = (crntElementSize + pixelDifference) + "px";
        gridSizeArray[gridIndex + 1] = (nextElementSize - pixelDifference) + "px";
    }

    if(minMax.minSize !== "auto" && minMax.minSize !== "none") {
        if((crntElementSize - pixelDifference) < parseInt(minMax.minSize)) {
            this.finishResizing();
            return;
        }
        if((crntElementSize - pixelDifference) > parseInt(minMax.maxSize)) {
            this.finishResizing();
            return;
        }
    }
    /**
     * Update the setting with the calculated value.
     */
    this.updateNewAreaValues(gridSizeArray, isHorizontal);
};

GridWindow.prototype.finishResizing = function() {
    utilListeners.addRemoveListener("mousemove", null, true);
};

GridWindow.prototype.hideCell = function(element, row=true, expand=GridWindow.constants.LEFT) {
    this.updateCellSize(element, row, 0, expand);
};

GridWindow.prototype.updateCellSize = function(element, row, newSize, expand, calculateSize=false) {
    let gridIndex = this.getGridIndex(element, row);
    let gridSizeArray = this.getAreaValues(row);
    let crntElementSize = parseInt(gridSizeArray[gridIndex]);
    if(calculateSize) {
        let totSize = 0;
        gridSizeArray.forEach(cell => {
            totSize += parseInt(cell);
        });
        newSize = crntElementSize + newSize - totSize;
    }


    if((typeof expand !== "undefined") && expand !== null) {
        let expandIndex = (expand === GridWindow.constants.LEFT || expand === GridWindow.constants.TOP)? gridIndex - 1 : gridIndex + 1;
        /**
         * Get the adjacent cell widths/heights including current cell
         */
        let expandElementSize = parseInt(gridSizeArray[expandIndex]);
        gridSizeArray[expandIndex] = expandElementSize + (crntElementSize - newSize) + "px";
    }


    gridSizeArray[gridIndex] = newSize + "px";

    /**
     * Update the setting with the calculated value.
     */
    this.updateNewAreaValues(gridSizeArray, row);
    if(newSize === 0) {
        document.querySelector("#" + element).style.display = "none";
    }
};

module.exports = GridWindow;