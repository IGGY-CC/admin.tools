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

    static floatRound(value, decimals=2) {
        return Math.round(value * 10 * decimals) / (10 * decimals)
    }

    static getStyles(id) {
        const styles = new Map();
        let i = false;
        const ignoreList = ["#mocha", ".fa-"];
        for (let index = 0; index < document.styleSheets.length; index++) {
            const sheet = document.styleSheets[index];
            for (let ruleID = 0; ruleID < sheet.rules.length; ruleID++) {
                const rule = sheet.rules[ruleID];
                if(new RegExp(ignoreList.join("|")).test(rule.selectorText)) {
                    break;
                }
                if (rule.selectorText === id) {
                    return rule.style;
                }
            }
        }
    }
}

class CSSNode {
    constructor(element, grid) {
        this.element = element;
        this.grid = grid;

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

        this.gridRowStart = -1;
        this.gridRowEnd = -1;
        this.gridColumnStart = -1;
        this.gridColumnEnd = -1;

        this.init();
    }

    init() {
        this.refreshSizeByDOM();
    }

    refreshSizeByDOM() {
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

    setupGridFixedSize() {
        if(this.isFixedWidth) {
            // TODO: Only considering one case for now. In future need to add other cases.
            if(this.gridColumnStart === this.gridColumnEnd) {
                this.grid.fixedColumns[this.gridColumnStart] = true;
            }
        }
        if(this.isFixedHeight) {
            // TODO: Only considering one case for now. In future need to add other cases.
            if(this.gridRowStart === this.gridRowEnd) {
                this.grid.fixedRows[this.gridRowStart] = true;
            }
        }
    };

    refreshSize() {
        this.element.style.width = this.width + "px";
        this.element.style.height = this.height + "px";
    };

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

    setSizeTo(size, isWidth, isLeftOrTopHandle) {
        if(isWidth) {
            this.adjustSizeBy(size - this.width, isWidth, isLeftOrTopHandle);
        } else {
            this.adjustSizeBy(size - this.height, isWidth, isLeftOrTopHandle);
        }
    };

    adjustSizeBy(size, isWidth, isLeftOrTopHandle) {
        // assuming always that the size is the value to be added
        let isOk = this.checkSetSize(size, isWidth);
        if(!isOk) {
            console.warn("Cannot perform resize as per min/max size restrictions. Size / isWidth / minWidth / minHeight", size, isWidth, this.minWidth, this.minHeight);
            return;
        }

        if(isWidth) {
            // left or right handle
            if(isLeftOrTopHandle) {
                isOk = this.adjustSizeForSiblings(isOk, this.widthAffectedLeftSiblings, size, isWidth, LEFT);
            } else {
                // right handle
                isOk = this.adjustSizeForSiblings(isOk, this.widthAffectedRightSiblings, size, isWidth, RIGHT);
            }
        } else {
            // top or bottom handle
            if(isLeftOrTopHandle) {
                isOk = this.adjustSizeForSiblings(isOk, this.heightAffectedTopSiblings, size, isWidth, TOP);
            } else {
                // bottom handle
                isOk = this.adjustSizeForSiblings(isOk, this.heightAffectedBottomSiblings, size, isWidth, BOTTOM);
            }
        }

        if(!isOk) {
            console.warn("Cannot perform resize as per min/max size restrictions.")
        }
    }

    adjustSizeForSiblings(isOk, theArray, size, isWidth, direction) {
        // left/right/top/bottom siblings must reduce in size (if size is positive) otherwise, increase in size.
        // so multiply size by -1.
        isOk = this.checkForSizeChange(isOk, theArray, (size * -1), isWidth);
        if(!isOk) return false;

        // Here we are checkSize is successful, so we can proceed adjusting the sizes
        this.setSize(size, isWidth);
        this.setSiblingSize(theArray, (size*-1), isWidth);

        // Once changes are done in all nodes, call the master grid to update itself.
        this.updateGridSizes(direction, size);
        this.grid.refreshGrid();
        return true;
    }

    updateGridSizes(direction, size) {
        switch(direction) {
            case LEFT:
                this.grid.updateGridSize(size, this.gridColumnStart, false);

                if(this.gridColumnStart === 0) {
                    console.error("Something is wrong. There cannot be resize handle on left for first element");
                } else {
                    // update the previous cell
                    this.grid.updateGridSize((size * -1), (this.gridColumnStart - 1), false);
                }
                break;
            case RIGHT:
                this.grid.updateGridSize(size, this.gridColumnEnd, false);

                if(this.gridColumnEnd === this.grid.gridColumns.length - 1) {
                    console.error("Something is wrong. There cannot be resize handle on right of last element");
                } else {
                    // update the next cell
                    this.grid.updateGridSize((size * -1), (this.gridColumnEnd + 1), false);
                }
                break;
            case TOP:
                this.grid.updateGridSize(size, this.gridRowStart, true);

                if(this.gridRowStart === 0) {
                    console.error("Something is wrong. There cannot be resize handle on top of first element");
                } else {
                    // update the previous cell
                    this.grid.updateGridSize((size * -1), (this.gridRowStart - 1), true);
                }
                break;
            case BOTTOM:
                this.grid.updateGridSize(size, this.gridRowEnd, true);

                if(this.gridRowEnd === this.grid.gridRows.length - 1) {
                    console.error("Something is wrong. There cannot be resize handle on bottom of last element");
                } else {
                    // update the next cell
                    this.grid.updateGridSize((size * -1), (this.gridRowEnd + 1), true);
                }
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
        return (finalSize >= min && finalSize <= max);
    }

    setSize(size, isWidth) {
        if(!this.checkSetSize(size, isWidth)) return false;
        if(isWidth) {
            console.log("SETTING WIDTH TO %d with new size %d for %s", size, this.width + size, this.element.id);
            this.width += size;

        } else {
            this.height += size;
        }
        this.refreshSize();
    };

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
        this.windowWidth = 0;
        this.windowHeight = 0;
        this.gridColumns = [];
        this.gridRows = [];
        this.grid = [];
        this.gridUnique = [];
        this.childrenMap = new Map();
        this.gridDefinition = null;

        this.fixedRows = [];
        this.fixedColumns = [];
        this.init();
    }

    init() {
        this.gridDefinition = Util.getStyles("#" + this.root.id);
        console.log("GRID DEFINITION: ", this.gridDefinition);
        this.refreshSize();
        this.setupRows();
        this.setupCols();
        this.setupGridMatrix();
        this.setupElements();
        this.setupSiblings();
        this.setupGridPlaceHolders();
    }

    refreshSize(nodes=false) {
        let oldWidth = null;
        let oldHeight = null;

        if(nodes) {
            oldWidth = this.windowWidth;
            oldHeight = this.windowHeight;
        }

        this.computedStyle = Util.getComputedStyle(this.root.id);
        this.width = Util.stripPx(this.computedStyle.width);
        this.height = Util.stripPx(this.computedStyle.height);
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;

        if(nodes) {
            let offsetWidth = Util.floatRound(this.windowWidth/oldWidth);
            let offsetHeight = Util.floatRound(this.windowHeight/oldHeight);
            this.gridRows = this.gridRows.map((value, key) => {
                if(this.fixedRows[key]) Util.floatRound(value * offsetHeight)
            });
            this.gridColumns = this.gridColumns.map((value, key) => {
                if(this.fixedColumns[key]) Util.floatRound(value * offsetWidth)
            });

            // this.childrenMap.forEach((node, key, map) => {
            //     if(!node.isFixedWidth) {
            //         node.width *= offsetWidth;
            //     }
            //     if(!node.isFixedHeight) {
            //         node.height *= offsetHeight;
            //     }
            //     node.refreshSize();
            // });
            this.refreshGrid();
        }
    }

    setupRows() {
        let gridTemplateRows = this.computedStyle.gridTemplateRows;

        gridTemplateRows.split(" ").forEach(row => {
            this.gridRows.push(Util.stripPx(row));
        });
    }

    setupCols() {
        let gridTemplateColumns = this.computedStyle.gridTemplateColumns;

        gridTemplateColumns.split(" ").forEach(column => {
            this.gridColumns.push(Util.stripPx(column));
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
            const node = new CSSNode(elements[index], this);
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

    setupGridPlaceHolders() {
        // gridRowStart, gridRowEnd, gridColumnStart, gridColumnEnd from getComputedStyle
        // may not always be numbers. They can be with the names of the grid. Hence we
        // calculate these manually.
        let matrix = [];

        for(let row = 0; row < this.grid.length; row++) {
            matrix[row] = [];

            for(let col = 0; col < this.grid[row].length; col++) {
                let id = this.grid[row][col];
                let node = this.childrenMap.get(id);
                matrix[row][col] = node;

                if(row === 0) {
                    node.gridRowStart = row;
                } else {
                    let previousRow = matrix[row-1][col];
                    if(node !== previousRow) {
                        // this is a new node on fresh row
                        node.gridRowStart = row;
                        //set the row end of node on previous row's column
                        previousRow.gridRowEnd = row -1;
                    }
                    if(row === this.grid.length - 1) {
                        node.gridRowEnd = row;
                    }
                }

                if(col === 0) {
                    node.gridColumnStart = col;
                } else {
                    let previousCol = matrix[row][col-1];
                    if(node !== previousCol) {
                        // this is a new node on fresh column
                        node.gridColumnStart = col;
                        // set the col end of node on previous column
                        previousCol.gridColumnEnd = col-1;
                    }
                    if(col === this.grid[row].length - 1) {
                        node.gridColumnEnd = col;
                    }
                }
            }
        }

        // Now that GridPlaceHolders are set, update the gridFixedSizes array.
        this.childrenMap.forEach(node => node.setupGridFixedSize());
    }

    checkMapAndSet(map, entry) {
        let count = map.get(entry);
        if(typeof count === "undefined") {
            map.set(entry, 1);
        } else {
            map.set(entry, count+1);
        }
    }

    updateGridSize(size, index, isRow) {
        if(isRow) {
            console.log("SETTING ROW %s to size: %d", index, size, this.gridRows[index] + size);
            this.gridRows[index] = this.gridRows[index] + size;
        } else {
            console.log("SETTING COLUMN %s to size: %d", index, size, this.gridColumns[index] + size);
            this.gridColumns[index] = this.gridColumns[index] + size;
        }
    }

    refreshGrid() {
        let gridTemplateRows = "";
        for(let index = 0; index < this.gridRows.length; index++) {
            gridTemplateRows += this.gridRows[index] + "px ";
        }

        let gridTemplateColumns = "";
        for(let index = 0; index < this.gridColumns.length; index++) {
            gridTemplateColumns += this.gridColumns[index] + "px ";
        }

        this.root.style.gridTemplateRows = gridTemplateRows;
        this.root.style.gridTemplateColumns = gridTemplateColumns;
    }
}

module.exports = {CSSGrid: CSSGrid, CSSNode: CSSNode};
