// SOURCE FILE: admin.tools/src/main/scripts/grid-manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

'use strict';

let grid = {};

const TRENCH = 1;
const TERMBLK = 2;

const HORIZONTAL = 1;
const VERTICAL = 2;

const ROW = 1;
const COLUMN = 2;

const LEFT = 1;
const RIGHT = 2;
const TOP = 3;
const BOTTOM = 4;

const TRENCH_HEIGHT = "1.5px";
const TRENCH_WIDTH = "1.5px";

grid.Element = function(name, element, rowHeight, colWidth, direction=VERTICAL) {
    this.name = name;
    this.element = element;

    // setup block type
    if(typeof direction === "undefined") {
        this.type = TERMBLK;
    } else {
        this.type = TRENCH;
    }

    // position
    this.rowStart = 0;
    this.rowEnd = 0;
    this.columnStart = 0;
    this.columnEnd = 0;

    // dimensions
    this.width = 0;
    this.height = 0;

    // parent dimensions
    this.rowHeight = rowHeight;
    this.colWidth = colWidth;

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

};

grid.Element.prototype.init = function(name, element, rowHeight, colWidth, direction, parent) {
    let newElement = new grid.Element(name, element, rowHeight, colWidth, direction);
    if(typeof direction !== "undefined") {
        if(typeof parent === "undefined") {
            console.error("Cannot create a trench element without a parent element");
        }
        newElement.parent.name = parent.id;
        newElement.parent.element = parent;
        if (direction === VERTICAL) {
            newElement.parent.direction = LEFT;
            this.updateSiblingsOnNewElement(parent.right, newElement.right, newElement);
        } else { // horizontal
            newElement.parent.direction = TOP;
            this.updateSiblingsOnNewElement(parent.top, newElement.top, newElement);
        }
    }
    return newElement;
};

grid.Element.prototype.updateSiblingsOnNewElement = function(parentSide, newElementSide, newElement) {
    // since this new element is occupying the left/right/top/bottom of the parent,
    // 1. first assign all the left/right/top/bottom elements of parent to this element
    // 2. clear the left/right/top/bottom elements set of parent &
    // 3. add this element as the only element to the left/right/top/bottom of parent
    parentSide.forEach(newElementSide.add, newElementSide);
    parentSide.clear();
    parentSide.add(newElement);
}

grid.Element.prototype.setFirstSibling = function(firstSibling) {
    if(this.type !== TRENCH) {
        console.log("Cannot add firstSibling. The source element is not of type: TRENCH");
        return false;
    }
    this.firstSibling.name = firstSibling.id;
    this.firstSibling.element = firstSibling;
    if (this.direction === VERTICAL) {
        this.firstSibling.direction = RIGHT;
    } else {
        this.firstSibling.direction = BOTTOM;
    }
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

grid.Element.prototype.resizeArea = function(rowHeight, colWidth) {
    if(typeof rowHeight !== "undefined" || rowHeight === null) this.rowHeight = rowHeight;
    if(typeof colWidth !== "undefined" || colWidth === null) this.colWidth = colWidth;

    if(this.type === TERMBLK) {
        this.width = (this.columnEnd - this.columnStart) * this.colWidth;
        this.height = (this.rowEnd - this.rowStart) * this.rowHeight;
    } else { // TRENCH
        if(this.direction === HORIZONTAL) { // horizontal - height stays the same at TRENCH_HEIGHT
            this.width = (this.columnEnd - this.columnStart) * this.colWidth;
        } else { // vertical - width stays the same at TRENCH_WIDTH
            this.height = (this.rowEnd - this.rowStart) * this.rowHeight;
        }
    }
};

grid.Element.prototype.addSibling = function(element, addTo) {
    switch(addTo) {
        case LEFT:
            this.addSibling_(element, this.left);
            break;
        case RIGHT:
            this.addSibling_(element, this.right);
            break;
        case TOP:
            this.addSibling_(element, this.top);
            break;
        case BOTTOM:
            this.addSibling_(element, this.bottom);
            break;
    }
};

grid.Element.prototype.addSibling_ = function(element, siblingSet) {
    if(element instanceof Set) {
        element.forEach(siblingSet.add, siblingSet);
    } else {
        siblingSet.add(element);
    }
};



grid.Element.prototype.updateGridArea = function() {
    if(this.type === TRENCH) {
        if(this.direction === VERTICAL) {
            this.columnEnd = this.columnStart;
        } else {
            this.rowEnd = this.rowStart;
        }
    }

    // resize the area as per the new dimensions
    this.resizeArea();
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
    this.setRowStart(rowStart);
    this.setRowEnd(rowEnd);
};

grid.Element.prototype.setAreaColumn = function(columnStart, columnEnd) {
    if(columnEnd < columnStart) {
        console.error("Column End cannot be less than Column Start. ColumnStart: ", columnStart, ", ColumnEnd: ", columnEnd);
        return false;
    }
    this.setColumnStart(columnStart);
    this.setColumnEnd(columnEnd);
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
        if(isStart) {
            this.columnStart = Math.round(start);
        } else {
            this.columnEnd = Math.round(end);
        }
    } else {
        if(isStart) {
            this.rowStart = Math.round(start);
        } else {
            this.rowEnd = Math.round(end);
        }
    }

    this.updateGridArea();
};



module.exports = grid;