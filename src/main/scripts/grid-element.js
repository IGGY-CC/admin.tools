// SOURCE FILE: admin.tools/src/main/scripts/grid-manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

'use strict';

let admin = require("./terminal");

let grid = {};

const TRENCH = 1;
const TERMBLK = 2;

const HORIZONTAL = 4;
const VERTICAL = 8;

const ROW = 16;
const COLUMN = 32;

const LEFT = 64;
const RIGHT = 128;
const TOP = 256;
const BOTTOM = 512;

const TRENCH_SIZE = 1.3; // in pixels

// function reportIn(e){
//     let a = this.lastListenerInfo[this.lastListenerInfo.length-1];
//     console.log(a)
// }


// HTMLDivElement.prototype.realAddEventListener = HTMLDivElement.prototype.addEventListener;
//
// HTMLDivElement.prototype.addEventListener = function(a,b,c){
//     console.log("Adding event listener", a, "with condition: ", c, "and function:", b);
//     //this.realAddEventListener(a,reportIn,c);
//     this.realAddEventListener(a,b,c);
//     //if(!this.lastListenerInfo){  this.lastListenerInfo = [] };
//     //this.lastListenerInfo.push({a : a, b : b , c : c});
// };

grid.Element = function(name, jsGridManager, direction) {
    this.name = name;
    this.jsGridManager = jsGridManager;
    this.isMaster = (jsGridManager.totalGridElements === 0);
    this.terminal = null;
    this.minWidth = 0;
    this.minHeight = 0;

    this.element = document.createElement("div");

    // setup block type
    if(typeof direction === "undefined") {
        this.type = TERMBLK;
    } else {
        this.type = TRENCH;
    }

    // position
    this.columnStart = 0;
    this.columnEnd = 0;
    this.rowStart = 0;
    this.rowEnd = 0;

    // dimensions
    this.width = 0;
    this.height = 0;

    // parent dimensions
    this.rowHeight = jsGridManager.rowHeight;
    this.colWidth = jsGridManager.colWidth;

    // siblings
    this.left = new Set();
    this.right = new Set();
    this.top = new Set();
    this.bottom = new Set();

    // specific for trench type - type=TRENCH
    this.direction = direction;

    // setup parent and first sibling - type=TRENCH
    this.parent = {};
    this.firstSibling = {};

    // event listener functionality
    this.isMouseEnterActive = false;
    this.isMouseDownActive = false;
    this.isMouseMoveActive = false;

    this.onResize_ = null;
    this.endResize_ = null;
    this.onMouseDown_ = null;
    this.onTerminalMouseEnter_ = null;

};

// Singleton
grid.Element.init = function(name, jsGridManager, direction) {
    let newElement = new grid.Element(name, jsGridManager, direction);
    newElement.setupElementDefaults();
    jsGridManager.add(newElement);
    return newElement;
};

grid.Element.prototype.setupElementDefaults = function() {
    this.element.id = this.name;
    if(this.isMaster) {
        this.element.style.width = "100%";
        this.element.style.height = "100%";
        this.element.className = "base-terminal";
        this.width = this.jsGridManager.width;
        this.height = this.jsGridManager.height;
    } else {
        if (typeof this.direction === "undefined") { // terminal block TERMBLK
            this.element.className = "base-terminal";
        } else {
            this.element.className = "trench";
            if(this.direction === VERTICAL) {
                this.element.style.cursor = "ew-resize";
            } else {
                this.element.style.cursor = "ns-resize";
            }
        }
    }
};

grid.Element.prototype.setupParentElement = function(element, trench) {
    // If this is the first element, then create the default terminal
    // later-on, on split of pane, createTerminal will be called from createSiblingElement()
    if(this.isMaster === true && typeof trench === "undefined") {
        this.createTerminal();
        this.addToGrid(element);
        this.jsGridManager.parent = element;
        return true;
    }

    // Check for the validity of the passed elements
    if(trench.type !== TRENCH || element.type !== TERMBLK) {
        console.error("Wrong element types are passed.");
    }

    // Setup attached siblings

    // First make a copy of the existing element's siblings
    let top = new Set(), bottom = new Set(), left = new Set(), right = new Set();

    // right and bottom are common for both vertical or horizontal created new elements
    if(trench.name === "trench0") {
        console.log("bottom: ", this.left, "what is this?", this.name);
    }
    this.bottom.forEach((elem) => {
        if(trench.direction === HORIZONTAL) elem.top.delete(this);
        elem.top.add(element);
        bottom.add(elem);
    }, bottom);
    if(bottom.size !== 0) element.bottom = bottom;

    this.right.forEach((elem) => {
        if(trench.direction === VERTICAL) elem.left.delete(this);
        elem.left.add(element);
        right.add(elem);
    }, right);
    if(right.size !== 0) element.right = right;

    if(trench.direction === VERTICAL) {
        // Setup Trench siblings
        trench.left.add(this);
        trench.right.add(element);4

        // Setup Element siblings
        this.top.forEach(top.add, top);
        if(top.size !== 0) element.top = top;

        // Setup this element & sibling
        this.right.clear();
        this.right.add(trench);
        element.left.add(trench);
    } else {
        // Setup Trench siblings
        trench.top.add(this);
        trench.bottom.add(element);

        // Setup Element siblings
        this.left.forEach((elem) => {
            // add the newly created element to the trench
            // retrieved from this loop
            elem.right.add(element);

            left.add(elem);
        }, left);
        if(left.size !== 0) element.left = left;

        // Setup this element & sibling
        this.bottom.clear();
        this.bottom.add(trench);
        element.top.add(trench);
    }
};

grid.Element.prototype.moveTrenchFromOldtoNew = function(element, siblingDirection) {
    // add all elements from `element` to sibling and clear the elements from `element`.
    element.forEach(siblingDirection.add, siblingDirection);
    element.clear();

};

grid.Element.prototype.updateSiblingsOnNewElement = function(parentSide, newElementSide, trenchElement) {
    // since this new element is occupying the left/right/top/bottom of the parent,
    // 1. first assign all the left/right/top/bottom elements of parent to this element
    // 2. clear the left/right/top/bottom elements set of parent &
    // 3. add this element as the only element to the left/right/top/bottom of parent
    parentSide.forEach(newElementSide.add, newElementSide);
    parentSide.clear();
    parentSide.add(trenchElement);
};

grid.Element.prototype.split = function(direction, evt) {
    // once a split is created, the current element's state and position changes
    this.element.style.position = "relative";

    // save old positions
    let oldColumnEnd = this.columnEnd;
    let oldRowEnd = this.rowEnd;
    let siblingElement = null;

    if(direction === VERTICAL) {
        if((this.width / 2) <=  this.minWidth) {
            console.error("Cannot create terminal with less than the default width: ", this.minWidth);
            return false;
        }

        this.width = this.width / 2;
        this.columnEnd = Math.round((this.columnStart + this.columnEnd) / 2);
        // create the sibling element
        siblingElement = this.createSiblingElement(direction, oldColumnEnd);
    } else {
        if(this.height / 2 <= this.minHeight) {
            console.error("Cannot create terminal with less than the default height: ", this.minHeight);
            return false;
        }

        this.height = this.height / 2;
        this.rowEnd = Math.round((this.rowStart + this.rowEnd) / 2);
        // create the sibling element
        siblingElement = this.createSiblingElement(direction, oldRowEnd);
    }

    // setup Trench
    let trenchElement = this.setupTrenchElement(direction);

    // setup the parent associations
    this.setupParentElement(siblingElement, trenchElement);

    // add the sibling element to the grid
    this.addToGrid(this.element.parentNode, siblingElement.element, trenchElement.element);

    // Lastly create the terminal
    siblingElement.createTerminal();

    // Finally add event listeners to trench and call resize on all elements
    trenchElement.addEventListeners();
    this.jsGridManager.resize();
};

grid.Element.prototype.newTab = function() {
    // TODO
};

grid.Element.prototype.setupTrenchElement = function(direction) {
    let trenchElement = grid.Element.init("trench" + this.jsGridManager.totalTrenchElements++, this.jsGridManager, direction);

    // reduce the current element grid positions by 1
    if(trenchElement.direction === VERTICAL) {
        // set dimensions for trench
        trenchElement.width = TRENCH_SIZE;
        trenchElement.height = this.height;

        let colEnd = this.columnEnd + 1;
        trenchElement.setArea(this.rowStart, this.rowEnd, colEnd, colEnd);
    } else {
        // set dimensions for trench
        trenchElement.width = this.width;
        trenchElement.height = TRENCH_SIZE;

        let rowEnd = this.rowEnd + 1;
        trenchElement.setArea(rowEnd, rowEnd, this.columnStart, this.columnEnd);
    }

    // add the trench to the grid
    this.addToGrid(this.element.parentNode, trenchElement.element, this.element);
    return trenchElement;
};

grid.Element.prototype.createSiblingElement = function(direction, oldEndPoint) {
    let siblingElement = grid.Element.init("terminal" + this.jsGridManager.totalTerminals++, this.jsGridManager);
    let offset = 2; // the number of grid rows/cols away from parent (+1 for trench element)
    if(direction === VERTICAL) {
        siblingElement.width = this.width - TRENCH_SIZE;
        siblingElement.height = this.height;
        siblingElement.setArea(this.rowStart, this.rowEnd, this.columnEnd + offset, oldEndPoint);
    } else {
        siblingElement.width = this.width;
        siblingElement.height = this.height - TRENCH_SIZE;
        siblingElement.setArea(this.rowEnd + offset, oldEndPoint, this.columnStart, this.columnEnd);
    }

    siblingElement.element.style.position = "relative";
    return siblingElement;
};

grid.Element.prototype.createTerminal = function() {
    if(this.type !== TERMBLK) {
        console.error("Cannot create `terminal` for block type TRENCH.");
        return false;
    }
    console.log("calling to create new terminal with width/height for: #", this.name);
    this.terminal = new admin.Terminal(this.name, "#" + this.name);

    this.terminal.addMenuItem('Split Vertically', this.split.bind(this, VERTICAL));
    this.terminal.addMenuItem('Split Horizontally', this.split.bind(this, HORIZONTAL));
    this.terminal.addMenuItem('New Tab', this.newTab.bind(this));

    this.minWidth = Math.max(this.jsGridManager.minTerminalWidth, this.terminal.promptLengthPx + this.jsGridManager.minTerminalWidthOffset);
    this.minHeight = this.jsGridManager.minTerminalHeight;

};

grid.Element.prototype.addToGrid = function(parent, element, sibling) {
    if(typeof parent === "undefined" || parent === null) {
        console.error("Cannot add element when parent is null or undefined")
    }
    if(typeof element === "undefined") {
        parent.appendChild(this.element);
    } else {
        parent.insertBefore(element, sibling.nextSibling);
    }
    // update the dimensions of current element
    this.updateArea();
};

grid.Element.prototype.adjustGridArea = function(element, direction=LEFT) {
    if(!element instanceof grid.Element || element.type !== TRENCH) {
        console.error("Wrong type of element is passed to adjust grid area.");
    }

    // the passed element is always the first/base element for a set of grid
    let adjustElements = (direction) => {
        switch (direction) {
            case LEFT:

                break;
            case RIGHT:

                break;
            case TOP:

                break;
            case BOTTOM:

                break;
        }
    }


};

grid.Element.prototype.updateArea = function(rowHeight, colWidth, widthRatio, heightRatio) {
    if(typeof rowHeight !== "undefined" || typeof colWidth !== "undefined") {

        if(typeof rowHeight !== "undefined") this.rowHeight = rowHeight;
        if(typeof colWidth !== "undefined") this.colWidth = colWidth;

        if (this.type === TERMBLK) {
            this.width *= widthRatio;
            this.height *= heightRatio;
        } else { // TRENCH
            if (this.direction === HORIZONTAL) { // horizontal - height stays the same at TRENCH_HEIGHT
                this.width *= widthRatio;
                this.height = TRENCH_SIZE;
            } else { // vertical - width stays the same at TRENCH_WIDTH
                this.height *= heightRatio;
                this.width = TRENCH_SIZE;
            }
        }
    }

    // update element dimensions
    this.element.style.width = this.width + "px";
    this.element.style.height = this.height + "px";
    this.element.style.gridArea = this.rowStart +" / " + this.columnStart + " / " + this.rowEnd + " / " + this.columnEnd;
};

grid.Element.prototype.updateGridArea = function() {
    // if(this.type === TRENCH) {
    //     if(this.direction === VERTICAL) {
    //         this.columnStart = this.columnEnd;
    //     } else {
    //         this.rowStart = this.rowEnd;
    //     }
    // } FIXME: This can be buggy in different situations, so disabled

    // resize the area as per the new dimensions
    this.updateArea();
};

grid.Element.prototype.setRowStart = function(rowStart) {
    this.setRowColumn(rowStart, this.rowEnd, true, ROW, "Row");
};

grid.Element.prototype.setRowEnd = function(rowEnd) {
    this.setRowColumn(this.rowStart, rowEnd, false, ROW, "Row");
};

grid.Element.prototype.setColumnStart = function(columnStart) {
    this.setRowColumn(columnStart, this.columnEnd, true, COLUMN, "Column");
};

grid.Element.prototype.setColumnEnd = function(columnEnd) {
    this.setRowColumn(this.columnStart, columnEnd, false, COLUMN, "Column");
};

grid.Element.prototype.setAreaRow = function(rowStart, rowEnd) {
    if(rowStart > rowEnd) {
        console.error("Row End cannot be less than Row Start. RowStart: ", rowStart, ", RowEnd: ", rowEnd);
        return false;
    }

    this.rowStart = Math.round(rowStart);
    this.rowEnd = Math.round(rowEnd);
    this.updateGridArea();
};

grid.Element.prototype.setAreaColumn = function(columnStart, columnEnd) {
    if(columnStart > columnEnd) {
        console.error("Column End cannot be less than Column Start. ColumnStart: ", columnStart, ", ColumnEnd: ", columnEnd);
        return false;
    }

    this.columnStart = Math.round(columnStart);
    this.columnEnd = Math.round(columnEnd);
    this.updateGridArea();
};

grid.Element.prototype.setArea = function(rowStart, rowEnd, columnStart, columnEnd) {
    this.setAreaRow(rowStart, rowEnd);
    this.setAreaColumn(columnStart, columnEnd);
};

grid.Element.prototype.setRowColumn = function(start, end, isStart, type, txt) {
    if(start > end) {
        console.error(txt, " start cannot be greater than end. Start: ", start, ", End: ", end);
        return false;
    }

    if(type === COLUMN) {
        if(isStart === true) {
            this.columnStart = Math.round(start);
        } else {
            this.columnEnd = Math.round(end);
        }
    } else { // ROW
        if(isStart === true) {
            this.rowStart = Math.round(start);
        } else {
            this.rowEnd = Math.round(end);
        }
    }

    this.updateGridArea();
};

grid.Element.prototype.addEventListeners = function() {
    this.onResize_ = e => {
        if(!this.isMouseMoveActive) {
            this.onResize(e);
        }
    };

    this.endResize_ = () => {console.log("mouse_____up", this.name);this.jsGridManager.parent.removeEventListener("mousemove", this.onResize_);};

    if(this.type === TRENCH) {
        this.element.addEventListener('mouseenter', (function (e) {
            if(!this.isMouseEnterActive) {
                this.isMouseEnterActive = true;
                console.log("mouseEntered", this.name);
                this.jsGridManager.parent.addEventListener("mousedown", (function(e) {
                    if(!this.isMouseDownActive) {
                        // ignore events from other targets.
                        if(this.name !== e.target.id) {
                            return false;
                        }
                        console.log("mousedown", this.name, e.target.id);
                        this.jsGridManager.parent.addEventListener("mousemove", this.onResize_);
                        this.jsGridManager.parent.addEventListener("mouseup", this.endResize_);
                    }
                }).bind(this));
            }
        }).bind(this));
    }
};

grid.Element.prototype.onResize = function(e) {

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (this.direction === VERTICAL) {
        this.onResizeVertical(e);
    } else {
        this.onResizeHorizontal(e);
    }
};

grid.Element.prototype.triggerManualMouseEvent = function(eventName, element) {
    let event = document.createEvent('MouseEvents');
    event.initEvent(eventName, true, true);
    if(typeof element !== "undefined") {
        element.dispatchEvent(event);
    } else {
        this.element.dispatchEvent(event);
    }
};

grid.Element.prototype.adjustSiblingTrenches = function(sibling, side, oldValue, widthOrHeight, diffInWorH) {
    // get the top and bottom trenches of this element
    let trench = sibling[Symbol.iterator]();
    let trenchElement = trench.next().value;

    while(typeof trenchElement !== "undefined") {
        console.log(">>> Handling Trench", trenchElement.name);
        // if the trench element's end does not align with 'this' element's start/end/top/bottom, then it is one
        // spanning beyond current adjacent elements
        // since 'this' is what is being moved. So synch 'this' end value to the adjacent element's start value or vice versa
        switch(side) {
            case "column-start":
                // oldValue = oldColumnStart -- this.columnStart initial value
                // widthOrHeight = adjacentSibling.width
                if((trenchElement.columnEnd+1) === oldValue) {
                    trenchElement.width = widthOrHeight;
                    // trenchElement.width += diffInWorH;
                    trenchElement.columnEnd = (this.columnStart-1);
                } else {
                    console.error("UNHANDLED CASE");
                }
                break;
            case "column-end":
                // oldValue = oldColumnEnd -- this.columnEnd initial value
                // widthOrHeight = adjacentSibling.width
                if((trenchElement.columnStart-1) === oldValue) {
                    trenchElement.width = widthOrHeight;
                    // trenchElement.width += diffInWorH;
                    trenchElement.columnStart = (this.columnEnd+1);
                } else {
                    console.error("UNHANDLED CASE");
                }
                break;
            case "row-start":
                // oldValue = oldRowStart -- this.rowStart initial value
                // widthOrHeight = adjacentSibling.height
                if((trenchElement.rowEnd+1) === oldValue) {
                    trenchElement.height = widthOrHeight;
                    // trenchElement.height += diffInWorH;
                    trenchElement.rowEnd = (this.rowStart-1);
                } else {
                    console.error("UNHANDLED CASE");
                }
                break;
            case "row-end":
                // oldValue = oldRowEnd -- this.rowEnd initial value
                // widthOrHeight = adjacentSibling.height
                if((trenchElement.rowStart-1) === oldValue) {
                    trenchElement.height = widthOrHeight;
                    // trenchElement.height += diffInWorH;
                    trenchElement.rowStart = (this.rowEnd+1);
                } else {
                    console.error("UNHANDLED CASE");
                }
                break;
        }

        trenchElement.updateArea();
        trenchElement = trench.next().value;
    }
};

grid.Element.prototype.adjustSiblingsAndTrenches = function(direction, isLeftOrTop, adjacentSibling, base, oldPos, diffInWorH) {
    switch(direction) {
        case VERTICAL:
            if(isLeftOrTop === true) { // LEFT
                // base = firstLeft
                adjacentSibling.setColumnEnd(base.columnEnd);
                adjacentSibling.updateArea();

                // get the top and bottom trenches of this element
                // oldPos = oldColumnStart
                this.adjustSiblingTrenches(adjacentSibling.top, "column-start", oldPos, adjacentSibling.width, diffInWorH);
                this.adjustSiblingTrenches(adjacentSibling.bottom, "column-start", oldPos, adjacentSibling.width, diffInWorH);

            } else { // RIGHT
                // base = firstRight
                adjacentSibling.setColumnStart(base.columnStart);
                adjacentSibling.updateArea();

                // get the top and bottom trenches of this element
                // oldPos = oldColumnEnd
                this.adjustSiblingTrenches(adjacentSibling.top, "column-end", oldPos, adjacentSibling.width, diffInWorH);
                this.adjustSiblingTrenches(adjacentSibling.bottom, "column-end", oldPos, adjacentSibling.width, diffInWorH);
            }
            break;
        case HORIZONTAL:
            if(isLeftOrTop === true) { // TOP
                // base = firstTop
                adjacentSibling.setRowEnd(base.rowEnd);
                adjacentSibling.updateArea();

                // get the left and right trenches of this element
                // oldPos = oldRowStart
                this.adjustSiblingTrenches(adjacentSibling.left, "row-start", oldPos, adjacentSibling.height, diffInWorH);
                this.adjustSiblingTrenches(adjacentSibling.right, "row-start", oldPos, adjacentSibling.height, diffInWorH);
            } else { // BOTTOM
                // base = firstBottom
                adjacentSibling.setRowStart(base.rowStart);
                adjacentSibling.updateArea();

                // get the left and right trenches of this element
                // oldPos = oldRowEnd
                this.adjustSiblingTrenches(adjacentSibling.left, "row-end", oldPos, adjacentSibling.height, diffInWorH);
                this.adjustSiblingTrenches(adjacentSibling.right, "row-end", oldPos, adjacentSibling.height, diffInWorH);
            }
            break;
    }

};

grid.Element.prototype.adjustAdjacentSiblings = function(iterator, direction, isLeftOrTop, oldSize, newSize, base, oldPos, diffInWorH) {

    let adjacentSibling = iterator.next().value;

    while(typeof adjacentSibling !== "undefined") {
        console.log("+++++ Handling Element", adjacentSibling.name);
        switch(direction) {
            case VERTICAL:
                // iterator = leftIterator | rightIterator
                // adjacentSibling = left or right iterators' elements
                // newSize = leftSiblingWidth | rightSiblingWidth
                // oldSize = oldFirstLeftWidth | oldFirstRightWidth
                if(oldSize === adjacentSibling.width) {
                    adjacentSibling.width = newSize;
                } else {
                    console.log("IN HERE...");
                    //adjacentSibling.width = (oldSize - adjacentSibling.width) + newSize;
                    adjacentSibling.width += diffInWorH;
                    if(isLeftOrTop) {
                        //this.adjustAdjacentSiblings(topIterator, HORIZONTAL, true, oldFirstTopHeight, topSiblingHeight, firstTop, oldRowStart, differenceInHeight);
                    }
                }
                break;
            case HORIZONTAL:
                // iterator = topIterator | bottomIterator
                // adjacentSibling = top or bottom iterators' elements
                // newSize = topSiblingHeight | bottomSiblingHeight
                // oldSize = oldFirstTopWidth | oldFirstBottomWidth
                if(oldSize === adjacentSibling.height) {
                    adjacentSibling.height = newSize;
                } else {
                    console.log("IN HERE...");
                    // adjacentSibling.height = (oldSize - adjacentSibling.height) + newSize;
                    adjacentSibling.height += diffInWorH;
                }
                break;
        }

        // base = firstLeft/firstRight/firstTop/firstBottom
        // oldPos = oldColumnStart/oldColumnEnd/oldRowStart/oldRowEnd
        this.adjustSiblingsAndTrenches(direction, isLeftOrTop, adjacentSibling, base, oldPos, diffInWorH);
        adjacentSibling = iterator.next().value;
    }
};

grid.Element.prototype.onResizeVertical = function (evt) {
    // this -> is a trench
    // get the left and right elements
    let leftIterator = this.left[Symbol.iterator]();
    let rightIterator = this.right[Symbol.iterator]();

    let firstLeft = leftIterator.next().value;
    let firstRight = rightIterator.next().value;

    let siblingRect = firstLeft.element.getBoundingClientRect();
    let mousePosWRTSibling = evt.x - siblingRect.x;

    if(mousePosWRTSibling < firstLeft.minWidth) {
        this.triggerManualMouseEvent("mouseup");
        return false;
    }
    let leftSiblingWidth = mousePosWRTSibling; // Math.max(mousePosWRTSibling, this.jsGridManager.minTerminalWidth);
    let differenceInWidth = firstLeft.width - leftSiblingWidth;
    let rightSiblingWidth = firstRight.width + differenceInWidth;

    /* Now that we know the final widths of both the blocks, lets continue with rest */
    let siblingGridColEnd = Math.round(leftSiblingWidth / this.colWidth);

    if(rightSiblingWidth < firstRight.minWidth) {
        this.triggerManualMouseEvent("mouseup");
        return false;
    }

    // set sibling/top-block values
    let oldFirstLeftWidth = firstLeft.width;
    firstLeft.width = leftSiblingWidth;
    firstLeft.setColumnEnd(firstLeft.columnStart + siblingGridColEnd);

    // set the trench values
    // first save old points
    let oldColumnStart = this.columnStart;
    let oldColumnEnd = this.columnEnd;
    this.setAreaColumn(firstLeft.columnEnd + 1, firstLeft.columnEnd + 1);

    // set the next-sibling/bottom-block values
    let oldFirstRightWidth = firstRight.width;
    firstRight.width = rightSiblingWidth;
    if(firstRight.columnEnd < (this.columnEnd + 2)) {
        console.error("Right sibling column End is less than the to be set value of columnStart");
        console.error("Current columnEnd:", firstRight.columnEnd, " new ColumnStart: ", (this.columnEnd+2));
    }
    firstRight.setColumnStart(this.columnEnd + 1);

    this.updateArea();
    firstLeft.updateArea();
    firstRight.updateArea();

    this.adjustAdjacentSiblings(leftIterator, VERTICAL, true, oldFirstLeftWidth, leftSiblingWidth, firstLeft, oldColumnStart, differenceInWidth);
    this.adjustAdjacentSiblings(rightIterator, VERTICAL, false, oldFirstRightWidth, rightSiblingWidth, firstRight, oldColumnEnd, differenceInWidth);
};

grid.Element.prototype.onResizeHorizontal = function (evt) {
    // this -> is a trench
    // get the top and bottom elements
    let topIterator = this.top[Symbol.iterator]();
    let bottomIterator = this.bottom[Symbol.iterator]();

    let firstTop = topIterator.next().value;
    let firstBottom = bottomIterator.next().value;

    let siblingRect = firstTop.element.getBoundingClientRect();
    let mousePosWRTSibling = evt.y - siblingRect.y;

    if(mousePosWRTSibling < firstTop.minHeight) {
        this.triggerManualMouseEvent("mouseup");
        return false;
    }

    let topSiblingHeight = mousePosWRTSibling; //Math.max(mousePosWRTSibling, this.jsGridManager.minTerminalHeight);
    let differenceInHeight = firstTop.height - topSiblingHeight;
    let bottomSiblingHeight = firstBottom.height + differenceInHeight;

    /* Now that we know the final widths of both the blocks, lets continue with rest */
    let siblingGridRowEnd = Math.round(topSiblingHeight / this.rowHeight);

    if(bottomSiblingHeight < firstBottom.minHeight) {
        this.triggerManualMouseEvent("mouseup");
        return false;
    }

    // set sibling/left-block values
    let oldFirstTopHeight = firstTop.height;
    firstTop.height = topSiblingHeight;
    firstTop.setRowEnd(firstTop.rowStart + siblingGridRowEnd);

    // set the trench values
    // first save old points
    let oldRowStart = this.rowStart;
    let oldRowEnd = this.rowEnd;
    this.setAreaRow(firstTop.rowEnd + 1, firstTop.rowEnd + 1);

    // set the next-sibling/bottom-block values
    let oldFirstBottomHeight = firstBottom.height;
    firstBottom.height = bottomSiblingHeight;
    if(firstBottom.rowEnd < (this.rowEnd + 2)) {
        console.error("Top sibling row End is less than the to be set value of rowStart");
        console.error("Current rowEnd:", firstTop.rowEnd, " new RowStart: ", (this.rowEnd+2));
    }
    firstBottom.setRowStart(this.rowEnd + 1);

    this.updateArea();
    firstTop.updateArea();
    firstBottom.updateArea();

    this.adjustAdjacentSiblings(topIterator, HORIZONTAL, true, oldFirstTopHeight, topSiblingHeight, firstTop, oldRowStart, differenceInHeight);
    this.adjustAdjacentSiblings(bottomIterator, HORIZONTAL, false, oldFirstBottomHeight, bottomSiblingHeight, firstBottom, oldRowEnd, differenceInHeight);
};


module.exports = grid;