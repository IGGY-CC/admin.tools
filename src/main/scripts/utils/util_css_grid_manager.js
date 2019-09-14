// SOURCE FILE: admin.tools/src/main/scripts/util/util_css_grid_manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

class Util {
    static getComputedStyle(id) {
        return Object.assign({}, getComputedStyle(document.querySelector("#" + id)));
    }

    static stripPx(value) {
        return value.replace("px", "") * 1;
    }
}

class CSSNode {
    constructor(element) {
        this.element = element;

        this.index = 0;
        this.width = 0;

        this.computedStyle = Util.getComputedStyle(this.element.id);

        this.isFixedWidth = false;
        this.isFixedHeight = false;

        this.minWidth = 0;
        this.maxWidth = 0;
        this.minHeight = 0;
        this.maxHeight = 0;

        this.heightAffectedTopSiblings = [];
        this.heightAffectedBottomSiblings = [];
        this.widthAffectedLeftSiblings = [];
        this.widthAffectedRightSiblings = [];

        this.gridColIndex = -1;
        this.gridRowIndex = -1;

        this.init();
    }

    init() {
        this.refreshSize();
    }

    refreshSize() {
        this.computedStyle = Util.getComputedStyle(this.element.id);
        this.width = Util.stripPx(this.computedStyle.width);
        this.height = Util.stripPx(this.computedStyle.height);

        this.minWidth = this.getMinMax("width", true);
        this.minHeight = this.getMinMax("height", true);

        this.maxWidth = this.getMinMax("width", false);
        this.maxHeight = this.getMinMax("height", false);

        this.isFixedWidth = (this.minWidth === this.maxWidth);
        this.isFixedHeight = (this.minHeight === this.maxHeight);
    }

    getMinMax(property, isMin) {
        let prop = (isMin) ? "min" + property.charAt(0).toUpperCase() + property.slice(1).toLowerCase() :
            "max" + property.charAt(0).toUpperCase() + property.slice(1).toLowerCase();

        let value = this.computedStyle[prop];
        if(value.endsWith("%") && value !== "100%") {
            // TODO: add code based on percentiles.
            console.error("Unhandled case!!, please report this use-case");
        }
        if(value === "100%") value = (isMin)? "auto" : "none";
        if (isMin) {
            return (value === "auto") ? 0 : Util.stripPx(value);
        } else {
            return (value === "none") ? Number.MAX_SAFE_INTEGER : Util.stripPx(value);
        }
    }

    checkSetSize(size, isWidth) {
        if(isWidth) {
            return this.checkMinMaxSize(this.width + size, this.minWidth, this.maxWidth);
        } else {
            return this.checkMinMaxSize(this.height + size, this.minHeight, this.maxHeight);
        }
    };

    checkMinMaxSize(finalSize, min, max) {
        return (finalSize > min && finalSize < max);
    }

    setSize(size, isWidth) {
        if(!this.checkSetSize(size, isWidth)) return false;
        if(isWidth) {
            this.width += size;
            this.element.style.width = this.width + "px";
        } else {
            this.height += size;
            this.element.style.height = this.height + "px";
        }
    };

    adjustSizeBy(size, isWidth, isLeftOrTopHandle) {
        // assuming always that the size is the value to be added
        let isOk = this.checkSetSize(size, isWidth);
        if(!isOk) {
            console.warn("Cannot perform resize as per min/max size restrictions.");
            return;
        }

        if(isWidth) {
            // left or right handle
            if(isLeftOrTopHandle) {
                isOk = this.adjustSizeForSiblings(isOk, this.widthAffectedLeftSiblings, size, isWidth);
            } else {
                // right handle
                isOk = this.adjustSizeForSiblings(isOk, this.widthAffectedRightSiblings, size, isWidth);
            }
        } else {
            // top or bottom handle
            if(isLeftOrTopHandle) {
                isOk = this.adjustSizeForSiblings(isOk, this.heightAffectedTopSiblings, size, isWidth);
            } else {
                // bottom handle
                isOk = this.adjustSizeForSiblings(isOk, this.heightAffectedBottomSiblings, size, isWidth);
            }
        }

        if(!isOk) {
            console.warn("Cannot perform resize as per min/max size restrictions.")
        }
    }

    adjustSizeForSiblings(isOk, theArray, size, isWidth) {
        // left/right/top/bottom siblings must reduce in size (if size is positive) otherwise, increase in size.
        // so multiply size by -1.
        isOk = this.checkForSizeChange(isOk, theArray, (size * -1), isWidth);
        if(!isOk) return false;

        // Here we are checkSize is successful, so we can proceed adjusting the sizes
        this.setSize(size, isWidth);
        this.setSiblingSize(theArray, (size*-1), isWidth);
        return true;
    }

    checkForSizeChange(isOk, theArray, size, isWidth) {
        for(let index=0; index < theArray.length; index++) {
            isOk = isOk && theArray[index].checkSetSize(size, isWidth);

            // acts as a break statement
            if(!isOk) return false;
        }
        return true;
    }

    setSiblingSize(theArray, size, isWidth) {
        for(let index=0; index < theArray.length; index++) {
            theArray[index].setSize(size, isWidth);
        }
        return true;
    }
}

class CSSGrid {
    constructor(root) {
        this.root = root;
        this.width = 0;
        this.height = 0;
        this.gridColumns = [];
        this.gridRows = [];
        this.gridRowSize = 0;
        this.gridColumnSize = 0;
        this.grid = [];
        this.gridUnique = [];
        this.childrenMap = new Map();

        this.init();
    }

    init() {
        this.refreshSize();
        this.setupRows();
        this.setupCols();
        this.setupGridMatrix();
        this.setupElements();
        this.setupSiblings();
    }

    refreshSize() {
        this.computedStyle = Util.getComputedStyle(this.root.id);
        this.width = Util.stripPx(this.computedStyle.width);
        this.height = Util.stripPx(this.computedStyle.height);
    }

    setupRows() {
        let gridTemplateRows = this.computedStyle.gridTemplateRows;

        gridTemplateRows.split(" ").forEach(row => {
            let cellSize = Util.stripPx(row);
            this.gridRowSize += cellSize;
            this.gridRows.push(cellSize);
        });
    }

    setupCols() {
        let gridTemplateColumns = this.computedStyle.gridTemplateColumns;

        gridTemplateColumns.split(" ").forEach(column => {
            let cellSize = Util.stripPx(column);
            this.gridColumnSize += cellSize;
            this.gridColumns.push(cellSize);
        });
    }

    setupGridMatrix() {
        let gridMatrix = this.computedStyle.gridTemplateAreas;
        gridMatrix = gridMatrix.replace(/^"/, "");
        gridMatrix = gridMatrix.replace(/"$/, "");
        gridMatrix.split('" "').forEach(row => {
            let rowArray = row.split(" ");
            this.grid.push(rowArray);
            this.gridUnique.push([...new Set(rowArray)]);
        });
    }

    setupElements() {
        let elements = this.root.children;
        for (let index = 0; index < elements.length; index++) {
            const node = new CSSNode(elements[index]);
            this.childrenMap.set(elements[index].id, node);
        }
    }

    setupSiblings() {
        let entries = this.childrenMap.entries();
        let entry = entries.next().value;
        while (entry) {
            this.scanAndSetupAdjacentSiblings(entry[0], entry[1]);
            entry = entries.next().value;
        }
    }

    scanAndSetupAdjacentSiblings(gridID, node) {
        for (let row = 0; row < this.gridUnique.length; row++) {
            if (this.gridUnique[row].includes(gridID))
                this.setupAdjacentSiblings(gridID, row, this.gridUnique.length, node);
        }
    }

    setupAdjacentSiblings(gridID, row, rows, node) {
        let left = null;
        for (let col = 0; col < this.grid[row].length; col++) {
            // sacrifice memory for the sake of avoiding mistakes while repeating this element reference
            let current = this.grid[row][col];

            if (current === gridID) {
                if (left === null) {
                    // this is the first element
                    // set the left to this value and continue
                    left = gridID;
                } else if (left === gridID) {
                    // previous element is already the same
                    // check with the next ones. left continues to be gridID
                } else {
                    // left is not null and not gridID but some other element.
                    // we are at the right place to store the left sibling
                    this.setUnique(node.widthAffectedLeftSiblings, this.childrenMap.get(left));
                    left = gridID;
                }

                // we need to capture the top and bottom elements
                if (row > 0) {
                    // capture top element
                    let previousRow = this.grid[row - 1][col];
                    if (previousRow !== gridID) {
                        this.setUnique(node.heightAffectedTopSiblings, this.childrenMap.get(previousRow));
                    }
                }

                if (row + 1 < rows) {
                    // capture bottom element
                    let nextRow = this.grid[row + 1][col];
                    if (nextRow !== gridID) {
                        this.setUnique(node.heightAffectedBottomSiblings, this.childrenMap.get(nextRow));
                    }
                }
            } else {
                if (left === gridID) {
                    // left IS gridID but this is not.
                    // this is the right element of the gridID, capture and break.
                    this.setUnique(node.widthAffectedRightSiblings, this.childrenMap.get(current));
                    break;
                } else {
                    // this is not gridID
                    // capture this element as left for future purpose and move to next.
                    left = current;
                }
            }
        }
    }

    setUnique(_array, element) {
        if (!_array.includes(element)) {
            _array.push(element);
        }
    }
}

module.exports = {CSSGrid: CSSGrid, CSSNode: CSSNode};