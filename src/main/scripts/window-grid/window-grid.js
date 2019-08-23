// SOURCE FILE: admin.tools/src/main/scripts/window-grid/window-grid.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced or copy-modified from
// The Chromium OS wash project.

let grid = {};

let resizer = require("../scripts/utils/util_resizer");
let listeners = require("../scripts/utils/util_listeners");

const VERTICAL = 1;
const HORIZONTAL = 2;
const RIGHT = 4;
const LEFT = 8;
const TOP = 16;
const BOTTOM = 32;

grid.window = function(container, handle) {
    this.container = document.querySelector(container);
    this.resizeHandles = document.querySelectorAll(handle);
    this.boundListeners = {};
    this.gridName = null;
    this.gridTemplateAreas = null;
    this.templateRows = [];
    this.gridIndexes = {};
    this.axis = null;
    this.direction = null;

    this.getAreaMap();
    this.registerHandles();
};

grid.window.prototype.getAreaMap = function() {
    let computedStyle = getComputedStyle(this.container);
    this.gridTemplateAreas = computedStyle.gridTemplateAreas;
    let rows = this.gridTemplateAreas.match(/"([^"]+)"/g);
    rows.forEach(row => {
       let tmpRow = row.replace(/'+|"+/g, '').split(' ');
       this.templateRows.push(tmpRow);
    });
};

grid.window.prototype.getGridIndex = function(name, row=true) {
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

grid.window.prototype.getAreaValues = function(rows=true) {
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

grid.window.prototype.registerHandles = function() {
    // Pull all the elements with resizeHandle and register mousedown/touchdown eventlistener.
    for (let i=0; i<= this.resizeHandles.length-1; i++){
        listeners.addRemoveListener("mousedown", this.startResizing.bind(this), false, this.resizeHandles[i]);
    }

    // Register a callback for each element whose min/max size needs to be considered or gets effected
    resizer.onResize((e) => {
        this.updateCellSize("main-content", false, window.innerWidth, null, true);
        this.updateCellSize("main-content", true, window.innerHeight, null, true);
    });
};

grid.window.prototype.startResizing = function(event) {
    let column = event.target;
    for (let i=0; i<= this.resizeHandles.length-1; i++){
        if (column === this.resizeHandles[i]){
            this.axis = (this.resizeHandles[i].parentNode.className.includes("vertical"))?
                            VERTICAL : HORIZONTAL;
            let computedStyle = getComputedStyle(this.resizeHandles[i].parentElement);
            if(this.axis === VERTICAL) {
                this.direction = (this.resizeHandles[i].parentNode.className.includes("left"))?
                    LEFT : RIGHT;
                if(this.direction === LEFT) {
                    this.gridName = computedStyle.gridColumnStart;
                } else {
                    this.gridName = computedStyle.gridColumnEnd;
                }
            } else {
                this.direction = (this.resizeHandles[i].parentNode.className.includes("top"))?
                    TOP : BOTTOM;
                if(this.direction === TOP) {
                    this.gridName = computedStyle.gridRowStart;
                } else {
                    this.gridName = computedStyle.gridRowEnd;
                }
            }
        }
    }

    listeners.addRemoveListener( "mousemove", this.resizeColumn.bind(this));
    listeners.addRemoveListener("mouseup", this.finishResizing.bind(this));
};

grid.window.prototype.getMinMax = function(name, row=true) {
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

grid.window.prototype.updateNewAreaValues = function(gridSizeArray, rows=true) {
    /**
     * Update the setting with the calculated value.
     */
    if(rows) {
        this.container.style.gridTemplateRows = gridSizeArray.join(' ');
    } else {
        this.container.style.gridTemplateColumns = gridSizeArray.join(' ');
    }
};

grid.window.prototype.resizeColumn = function(event) {
    /**
     * Mouse position in pixels
     */
    let mousePosition =  (this.axis === VERTICAL)? event.clientX : event.clientY;
    let isHorizontal = this.axis === HORIZONTAL;
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
    let includeCurrentCell = (this.direction === RIGHT || this.direction === BOTTOM)? 1 : 0;

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
     * Calculate the different from the current mouseposition to the
     * total space calculated before the current cell. If the value
     * is negative, the mouse is moving in the opposite direction.
     * (current cell size increases if resizer is at start of the cell
     * or decreases if resizer is at end of the cell)
     */
    let pixelDifference = mousePosition - spaceBefore;


    if(this.direction === LEFT || this.direction === TOP) {
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

grid.window.prototype.finishResizing = function() {
    listeners.addRemoveListener("mousemove", null, true);
};

grid.window.prototype.hideCell = function(element, row=true, expand=LEFT) {
    this.updateCellSize(element, row, 0, expand);
};

grid.window.prototype.updateCellSize = function(element, row, newSize, expand, calculateSize=false) {
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
        let expandIndex = (expand === LEFT || expand === TOP)? gridIndex - 1 : gridIndex + 1;
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

let gridWindow = new grid.window("#grid-container", "#grid-container .resize-handle");
gridWindow.hideCell("toolbar-tab-content", false, RIGHT);
gridWindow.hideCell("right-tab-content", false, LEFT);
gridWindow.hideCell("bottom-tab-content", true, TOP);