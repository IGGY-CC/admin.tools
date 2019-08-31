// SOURCE FILE: admin.tools/src/main/scripts/window-grid/main-content.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const UtilsUI = require("../utils/util_dom");
const utilListeners = require("../utils/util_listeners");

let GridManager = {};

const TOP = 2;
const BOTTOM = 4;
const LEFT = 8;
const RIGHT = 16;
const VERTICAL = 32;
const HORIZONTAL = 64;

let GridElement = {
    element: null, // dom element.
    direction: null,
    width: 0,
    height: 0,
    sibling: null, // dom element.
    childZeroed: false,
    child: {
        first: {
            direction: TOP,
            element: null, // gridElement
            contentElement: null, // dom element.
        },
        second: {
            direction: BOTTOM,
            element: null, // gridElement
        }
    },
    parent: null, // dom element. TODO: is gridElement needed here instead of direct element?
};

GridManager = function () {
    this.parent = document.querySelector("#main-container");
    this.registeredElements = new Map();
    this.registeredContentElements = new Map();
    this.childCount = 0;
    window.onresize = this.execCallbacks.bind(this);
    this.onResize = new lib.Event();
    this.onCheckSize = new lib.Event();
    this.sizeAllowed = true;
    this.minWidth = 150;
    this.minHeight = 75;
    this.resizerWidth = 2; // pixels
    this.currentFocussedCell = this.parent;
    this.activeResizer = null;
};

GridManager.prototype.execCallbacks = function(e) {
    let grid = this.registeredElements.get(e.target.id);
    if(grid != null) {
        // grid.onResize();
    }
};

GridManager.prototype.splitVertical = function(name) {
    if(typeof name === "undefined") name = "btn";
    this.split(this.currentFocussedCell, name, true);
};

GridManager.prototype.splitHorizontal = function(name) {
    if(typeof name === "undefined") name = "btn";
    this.split(this.currentFocussedCell, name, false);
};

GridManager.prototype.split = function(parent, name, isVertical) {
    if(parent.hasChildNodes()) {
        console.warn("There are already children for this parent. Split won't continue");
        return;
    }
    let computedStyle = Object.assign({}, getComputedStyle(parent));
    this.childCount++;
    let size = (isVertical)? parseInt(computedStyle.width) / 2 : parseInt(computedStyle.height) / 2; // width or height
    let altSize = (isVertical)? parseInt(computedStyle.height) : parseInt(computedStyle.width); // width or height
    let sizeInPixels = size + "px " + size + "px";

    /* Create dom elements: 1 child which acts as grid based container for holding two children */
    let container = UtilsUI.createNewElement('div', parent, name + "-grid-" + this.childCount, "the-grid");
    let firstChild = UtilsUI.createNewElement('div', container, name + "-grid-first-" + this.childCount + "-1", "grid-child");
    let secondChild = UtilsUI.createNewElement('div', container, name + "-grid-second-" + this.childCount + "-2", "grid-child");
    /* Setup GridArea */
    container.style.display = "grid";

    container.style.gridTemplateRows = (isVertical)? altSize + "px" : sizeInPixels;
    container.style.gridTemplateColumns = (isVertical)? sizeInPixels : altSize + "px";
    container.style.gridTemplateAreas = (isVertical)? "\"first second\"" : "\"first\" \"second\"";

    container.style.width = computedStyle.width;
    container.style.height = computedStyle.height;
    /* Setup children */

    /* Setup grid area names */
    firstChild.style.gridArea = "first";
    secondChild.style.gridArea = "second";

    let gridElement = this.createBaseGridElement(container, isVertical, parent);
    gridElement.child.first.element = this.setupChild(secondChild, firstChild, size, altSize, isVertical, container);
    gridElement.child.second.element = this.setupChild(firstChild, secondChild, size, altSize, isVertical, container);
    gridElement.child.first.element.direction = (isVertical)? LEFT : TOP;
    gridElement.child.second.element.direction = (isVertical)? RIGHT : BOTTOM;
    gridElement.width = parseInt(computedStyle.width);
    gridElement.height = parseInt(computedStyle.height);
    gridElement.direction = (isVertical)? VERTICAL : HORIZONTAL;
    this.registeredElements.set(container.id, gridElement);

    /* Setup onclick for second child. For first child, onclick parent will be the child used for content */
    /* This will be used to activate a splitVertically or splitHorizontally call */
    secondChild.onclick = this.activateCell.bind(this, secondChild);

    /* Setup resizer in the first child */
    /* NOTE: This should be called as last (after setupChild) as the grid.width and height will not be recalculated) */
    this.setupResizer(name, gridElement.child.first.element, firstChild, size, altSize, isVertical, gridElement);
};

GridManager.prototype.deleteActiveCell = function() {
    if(this.currentFocussedCell === null) {
        console.warn("EITHER WE REACHED ROOT CELL OR THERE IS NO CELL SELECTED TO DELETE!");
        return;
    }

    this.resizeChildren(this.currentFocussedCell, 0, true);
};

GridManager.prototype.resizeChildren = function(element, size, _delete=false) {

    let gridElement = this.registeredElements.get(element.id);
    let  gridParent, isContentNode = false;
    /**
     * If there is no registered gridElement, then the element must be a content element.
     */
    if(typeof gridElement === "undefined") {
        gridParent = this.registeredContentElements.get(element.id); // grid element
        isContentNode = true;
    } else {
        gridParent = this.registeredElements.get(gridElement.parent.id); // grid element
    }

    console.log("GRID ELEMENT", gridParent, this.registeredElements, gridParent);
    if(typeof gridParent === "undefined") {
        if(_delete === true) {
            console.warn("CANNOT DELETE REQUESTED ELEMENT. EITHER THIS IS THE ROOT ELEMENT OR A REQUIRED PARENT ELEMENT IS MISSING.");
        } else {
            console.warn("COULDN'T RESIZE THE REQUESTED ELEMENT. REQUIRE PARENT ELEMENT IS MISSING");
        }
        return;
    }

    console.log("PARENT IS: ", gridParent);
    if(_delete === true) {
        if (gridParent.childZeroed === true) {
            /* This element is already zeroed (one child is made to zero). So switch to parent and re-run the delete cell */
            this.currentFocussedCell = gridParent.parent;
            console.log("DELETING FROM PARENT: ", parent);
            return this.deleteActiveCell();
        } else {
            /* Set the childZeroed value to true, so that there won't be further zeroing on this element */
            gridParent.childZeroed = true;
        }
    }

    let computedStyle = Object.assign({}, getComputedStyle(gridParent.element));
    let gridTemplateAreas = computedStyle.gridTemplateAreas;
    let gridTemplateRows = computedStyle.gridTemplateRows;
    let gridTemplateCols = computedStyle.gridTemplateColumns;

    // Get the children of this gridParent.element.
    let children = gridParent.element.children;
    let firstChild = children[0]; // dom element
    let secondChild = children[1]; // dom element

    /* Get gridElements of respective children */
    let firstGridElement = this.registeredElements.get(firstChild.id); // grid element
    let secondGridElement = this.registeredElements.get(secondChild.id); // grid element


    if(gridParent.direction === VERTICAL) {
        let cols = gridTemplateCols.split(" ");
        let totalWidth = parseInt(cols[0]) + parseInt(cols[1]) + size;

        if(isContentNode) { /* We have to resize / delete content node + resizer */
            /* if delete request, first delete the selected node and resizer and cleanup their memories */
            if(_delete === true) UtilsUI.removeElement(null, firstChild, true);

            /* Since we are in ContentNode, the request is for the LEFT element. */
            let leftSize = _delete? 0 : cols[0] + (size/2);
            let rightSize = _delete? totalWidth : cols[1] + (size/2);

            /* Adjust the parent's grid */
            gridParent.element.style.gridTemplateColumns =  leftSize + "px " + rightSize + "px";
            firstChild.style.width = leftSize + "px";
            if(_delete === true) {
                // remove the grid related settings from this element.
                firstChild.style.display = "";
                firstChild.style.gridTemplateRows = "";
                firstChild.style.gridTemplateColumns = "";
                firstChild.style.gridTemplateAreas = "";
                firstChild.onclick = "";
            } else {
                if(firstChild.hasChildNodes()) {

                }
            }

            secondChild.style.width = totalWidth + "px";
            // Update the respective grid's
            firstGridElement.width = 0;
            secondGridElement.width = totalWidth;
            // TODO CALL RESIZE FUNCTION HERE
        } else {
            // This is the RIGHT element
            gridParent.element.style.gridTemplateColumns = totalWidth + "px 0px";
            firstChild.style.width = totalWidth + "px";
            secondChild.style.width = "0px";
            // Update the respective grid's
            firstGridElement.width = totalWidth;
            secondGridElement.width = 0;
            // TODO CALL RESIZE FUNCTION HERE
        }
    } else {
        let rows = gridTemplateRows.split(" ");
        let totalHeight = parseInt(rows[0]) + parseInt(rows[1]);

        if(isContentNode) { /* We have to delete content node + resizer */
            /* first delete the selected node and resizer and cleanup their memories */
            UtilsUI.removeElement(null, firstChild, true);
            /* Adjust the parent's grid */
            gridParent.element.style.gridTemplateRows = "0px " + totalHeight + "px";
            firstChild.style.height = "0px";
            firstChild.style.display = ""; // remove the grid related settings from this element.
            firstChild.style.gridTemplateRows = "";
            firstChild.style.gridTemplateColumns = "";
            firstChild.style.gridTemplateAreas = "";

            secondChild.style.height = totalHeight + "px";
            // Update the respective grid's
            firstGridElement.height = 0;
            secondGridElement.height = totalHeight;
            // TODO CALL RESIZE RECURSIVE FUNCTION HERE
        } else {
            // This is the RIGHT element
            gridParent.element.style.gridTemplateRows = totalHeight + "px 0px";
            firstChild.style.height = totalHeight + "px";
            secondChild.style.height = "0px";
            // Update the respective grid's
            firstGridElement.height = totalHeight;
            secondGridElement.width = 0;
            // TODO CALL RESIZE FUNCTION HERE

        }
    }
};

GridManager.prototype.activateCell = function(element, e) {
    if(e.target === element) {
        this.currentFocussedCell = element;
        let deleteIcon = document.querySelector("#menubar-delete-active");
        if(typeof deleteIcon !== "undefined") {
            deleteIcon.setAttribute("data-tip", "Delete " + element.id);
        }
        e.stopPropagation();
    }
};

GridManager.prototype.createBaseGridElement = function(element, isVertical, parent) {
    let gridElement = Object.create(GridElement);
    gridElement.element = element;
    gridElement.direction = (isVertical)? VERTICAL : HORIZONTAL;

    if(parent === this.parent) {
        gridElement.parent = null;
    } else {
        gridElement.parent = parent;
    }

    gridElement.sibling = null;
    gridElement.child = {};
    gridElement.child.first = {};
    gridElement.child.first.direction = (isVertical)? LEFT : TOP;
    gridElement.child.second = {};
    gridElement.child.second.direction = (isVertical)? RIGHT : BOTTOM;
    return gridElement;
};

GridManager.prototype.setupChild = function(element, sibling, size, altSize, isVertical, parent) {
    /* Setup a new Grid to hold the element */
    let grid = Object.create(GridElement);
    grid.element = element;
    grid.sibling = sibling;
    grid.direction = (isVertical)? VERTICAL : HORIZONTAL;
    grid.width = (isVertical) ? size : altSize;
    grid.height = (isVertical) ? altSize : size;
    grid.parent = parent;
    this.registeredElements.set(element.id, grid);

    /* Setup the element */
    element.style.width = grid.width + "px";
    element.style.height = grid.height + "px";
    this.setupResizeListener(grid, element, null);
    this.setupCheckSizeListener(grid);
    return grid;
};

GridManager.prototype.setupResizer = function(name, parentGrid, element, size, altSize, isVertical, gridElement) {
    // TODO: Need to look into this when client's (such as terminals) need exact pixel values.
    let sizeInPixels = (size - this.resizerWidth) + "px " + this.resizerWidth + "px";
    console.log("IS VERTICAL: ", isVertical);
    /* Setup GridArea */
    element.style.display = "grid";
    element.style.gridTemplateRows = (isVertical)? size + "px" : sizeInPixels;
    element.style.gridTemplateColumns = (isVertical)? sizeInPixels : size + "px";
    element.style.gridTemplateAreas = (isVertical)? "\"content resizer\"" : "\"content\" \"resizer\"";
    let direction = (isVertical)? " col" : " row";
    let content = UtilsUI.createNewElement('div', element, name + "-content-" + this.childCount + "-1", "grid-content");
    let resizer = UtilsUI.createNewElement('div', element, name + "-content-" + this.childCount + "-R", "resize-handle" + direction);
    content.style.gridArea = "content";
    resizer.style.gridArea = "resizer";
    gridElement.child.first.contentElement = content;
    this.registeredContentElements.set(content.id, gridElement);

    if(isVertical) {
        content.style.width = (parseInt(element.style.width) - this.resizerWidth) + "px";
        content.style.height = element.style.height;
        resizer.style.width = this.resizerWidth + "px";
        resizer.style.height = content.style.height;
    } else {
        content.style.width = element.style.width;
        content.style.height = (parseInt(element.style.height) - this.resizerWidth) + "px";
        resizer.style.width = content.style.width;
        resizer.style.height = this.resizerWidth + "px";
    }
    /* Mouse Events */
    /* If content element is clicked, mark it as active element */
    content.onclick = this.activateCell.bind(this, content);
    /* Add mouse drag event listening to the resize handler */
    this.addEventListener(resizer);
    /* Add a callback to adjust element sizes on resize */
    this.setupResizeListener(parentGrid, element, content);
};

GridManager.prototype.addEventListener = function(resizeHandleElement) {
    utilListeners.addRemoveListener("mousedown", this.startResizing.bind(this), resizeHandleElement.id, false, resizeHandleElement);
};

GridManager.prototype.startResizing = function(event) {
    console.log("CLICKED ON: ", event.target);
    this.activeResizer = event.target;
    utilListeners.addRemoveListener( "mousemove", this.resizeColumn.bind(this), event.target.id);
    utilListeners.addRemoveListener("mouseup", this.finishResizing.bind(this), event.target.id);
};

GridManager.prototype.resizeColumn = function(event) {
    if(this.activeResizer !== event.target) return;
    const target = event.target;
    const contentNode = target.previousSibling;
    const grid = this.getGridElement(contentNode);
    const isVertical = (grid.direction === VERTICAL);
    const mouseOffset =  (isVertical)? event.movementX : event.movementY;
    console.log("MOUSE OFFSET: ", mouseOffset);
    // console.log("IN RESIZE: ", mouseOffset, event, getComputedStyle(grid.child.first.contentElement));
    this.onResize(mouseOffset, isVertical, contentNode);
};

GridManager.prototype.finishResizing = function(event) {
    utilListeners.addRemoveListener("mousemove", null, event.target.id,true);
    this.activeResizer = null;
};

GridManager.prototype.getMinMax = function(name, row=true) {
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

GridManager.prototype.getGridElement = function(element, switchToParent=true) {
    let gridElement = this.registeredElements.get(element.id);
    let isContentElement = false;
    // TODO: Switch to parent
    if(typeof gridElement === "undefined") {
        /* This is a content element */
        isContentElement = true;
        gridElement = this.registeredContentElements.get(element.id);
    }

    if(typeof gridElement === "undefined") return null;

    return { gridElement: gridElement, isContentElement: isContentElement };
};

GridManager.prototype.setGridArea = function(element, firstSize=0, secondSize=0, replaceFirst=false, replaceSecond=false, direction=VERTICAL) {
    if(direction === VERTICAL) {
        let cols = element.style.gridTemplateColumns;
        let left = (replaceFirst)? firstSize : parseInt(cols[0]) + firstSize;
        let right = (replaceSecond)? secondSize : parseInt(cols[1]) + secondSize;
        element.style.gridTemplateColumns = left + "px " + right + "px";
    } else {
        let rows = element.style.gridTemplateRows;
        let top = (replaceFirst)? firstSize : parseInt(rows[0]) + firstSize;
        let bottom = (replaceSecond)? secondSize : parseInt(rows[1]) + secondSize;
        element.style.gridTemplateRows = top + "px " + bottom + "px";
    }
};

GridManager.prototype.setupResizeListener = function(grid, element, contentElement=null) {
    this.onResize.addListener((offset, isVertical, resizedElement) => {
        let isChildOf = (element) => {
            console.log("ELEMENT, RESIZED_ELEMENT", element.id, resizedElement.id);
            if(element.closest("#" + resizedElement.parentNode.id) !== null) return true;
            let map = this.getGridElement(element);
            if(map !== null) {
                let parent = map.gridElement.parent;
                if(parent !== null) {
                    if(parent.id === resizedElement.id) return true;
                    return isChildOf(parent);
                }
            }
            return false;
        };

        if(!isChildOf(element)) return;

        /**
         * The element here is the main element (under which a content element could be present)
         * The grid is the grid object of the element
         * if isContentElement is true, the element has a content element as child.
         **/

        console.log("RESIZING FOR ELEMENT: ", element);
        const fixResizer = (contentElement === null)? 0 : -1 * this.resizerWidth;
        /* if offset is positive, then there is a reduction is size, else there is increase in size */
        if (isVertical) {
            grid.width -= offset;
            element.style.width = grid.width + "px";
            if(contentElement !== null) {
                contentElement.style.width = grid.width + fixResizer + "px";
                this.setGridArea(element, grid.width, 0, true, false, VERTICAL);
            }
        } else {
            grid.height -= offset;
            element.style.height = grid.height + "px";
            if(contentElement !== null) {
                contentElement.style.height = grid.height + fixResizer + "px";
                this.setGridArea(element, grid.height, 0, true, false, HORIZONTAL);
            }
        }
    });
};

GridManager.prototype.setupCheckSizeListener = function(grid) {
    this.onCheckSize.addListener((diffSize, direction) => {
        if(direction === VERTICAL) {
            let width = grid.element.width + diffSize;
            if(width < this.minWidth) this.sizeAllowed = this.sizeAllowed && false;
        } else {
            let height = grid.element.height + diffSize;
            if(height < this.minHeight) this.sizeAllowed = this.sizeAllowed && false;
        }
    }, this);
};

module.exports = new GridManager();