class GridUtil {
    static getComputedStyle(id) {
        return Object.assign({}, getComputedStyle(document.querySelector("#" + id)));
    }

    static stripPx(value) {
        return value.replace("px", "") * 1;
    }

    static floatRound(value, decimals=2) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    static deleteFromArray(array, elementOrIndex, isIndex=false, callback) {
        let newIndex = 0;
        for (let index = 0, length = array.length; index < length; length++) {
            if(isIndex) {
                if(index !== elementOrIndex) {
                    array[newIndex++] = array[index];
                }
            } else {
                if (array[index] !== elementOrIndex) {
                    array[newIndex++] = array[index];
                } else {
                    if(typeof callback !== "undefined") {
                        callback(index);
                    }
                }
            }
        }
        array.length = newIndex;
    }
}

class GridElement {
    constructor(grid, id, rowStart, columnStart, rows=1, columns=1, defaults=true) {
        this.grid = grid;
        this.id = id;
        this.rowStart = rowStart;
        this.columnStart = columnStart;
        this.rows = rows;
        this.columns = columns;
        this.width = -1;
        this.height = -1;
        this.isFixedWidth = false;
        this.isFixedHeight = false;
        this.element = null;

        this.topSiblings = new Set();
        this.rightSiblings = new Set();
        this.bottomSiblings = new Set();
        this.leftSiblings = new Set();

        defaults && this.setDefaults();
    }

    setDefaults() {
        this.element = UtilsUI.createNewElement('div', this.grid.root, this.id + "-ge", "grid-element");
    }

    setFixedWidth(isFixedWidth) {
        if(typeof isFixedWidth === "undefined") return;

        if(isFixedWidth && this.width === -1) {
            throw new Error("Cannot mark the element as fixed width element, when there is no width set on it.");
        }
        this.isFixedWidth = isFixedWidth;
        return this;
    }

    setFixedHeight(isFixedHeight) {
        if(typeof isFixedHeight === "undefined") return;

        if(isFixedHeight && this.height === -1) {
            throw new Error("Cannot mark the element as fixed height element, when there is no height set on it.");
        }
        this.isFixedHeight = isFixedHeight;
        return this;
    }

    setFixed(isFixedWidth, isFixedHeight) {
        this.setFixedWidth(isFixedWidth);
        this.setFixedHeight(isFixedHeight);
        return this;
    }

    setDimensions(width, height, isFixedWidth, isFixedHeight) {
        this.setFixed(isFixedWidth, isFixedHeight);

        if(typeof width !== "undefined" && width !== null) {
            if (this.width === -1 || !this.isFixedWidth) {
                this.width = width;
            } else {
                throw new Error("Cannot set width for a fixed width element!");
            }
        }

        if(typeof height !== "undefined" && height !== null) {
            if(this.height === -1 || !this.isFixedHeight) {
                this.height = height;
            } else {
                throw new Error("Cannot set height for a fixed height element!");
            }
        }

        this.refresh();
        return this;
    }

    setElementDimensions() {
        if(this.element === null) return;

        if(typeof this.width !== "undefined" && this.width !== -1) {
            this.element.style.width = this.width + "px";
        }

        if(typeof this.height !== "undefined" && this.height !== -1) {
            this.element.style.height = this.height + "px";
        }
        return this;
    }

    refresh() {
        this.setElementDimensions();
    }
}

const AUTO = -1;

class Grid {
    constructor(root, id, gap) {
        if(!root || !id) {
            throw new Error("A root element and ID are mandatory");
        }

        this.root = root;
        this.id = id;
        this.width = -1;
        this.height = -1;

        this.rows = [];
        this.columns = [];

        this.numRows = 0;
        this.numColumns = 0;

        this.elementMatrix = [];
        this.elements = [];

        this.fixedWidthElements = [];
        this.fixedHeightElements = [];

        this.computedStyle = null;
        this.gridGap = (typeof gap === "undefined")? 0 : gap;
        this.currentRow = 0;
        this.currentColumn = 0;
        this.currentRowHandles = 0;
        this.currentColumnHandles = 0;

        this.gridTemplateRows = null;
        this.gridTemplateColumns = null;
        this.gridTemplateAreas = null;

        this.setDefaults();
    }

    setWidth(width, resize=true) {
        if(width != null && typeof width !== "undefined") this.width = width;
        resize && this.resize();
        return this;
    }

    setHeight(height, resize=true) {
        if(height != null && typeof height !== "undefined") this.height = height;
        resize && this.resize();
        return this;
    }

    setDimensions(width, height) {
        this.setWidth(width, false);
        this.setHeight(height, false);
        this.resize();
        return this;
    }

    setDefaults() {
        if(this.computedStyle === null) {
            this.computedStyle = Object.assign({}, getComputedStyle(this.root));
        }

        this.width = GridUtil.stripPx(this.computedStyle.width);
        this.height = GridUtil.stripPx(this.computedStyle.height);

        this.root.style.display = "grid";
        this.resize();
        return this;
    }

    addElement(rowStart, columnStart, rows=1, columns=1, id) {
        if(rowStart >= this.numRows + 1) {
            throw new Error("Failed adding element! RowStart is given as " + rowStart + ", " +
                "but the current grid ends at row " + this.numRows);
        }

        if(columnStart >= this.numColumns + 1) {
            throw new Error("Failed adding element! ColumnStart is given as " + columnStart + ", " +
                "but the current grid ends at column " + this.numColumns);
        }

        let indexArray = [];
        if(!this.checkExistingElementAtPosition(rowStart, rowStart+rows, columnStart, columnStart+columns, indexArray)) {
            throw new Error("Failed adding element! There already is an element present at " + indexArray[0] + ", " + indexArray[1]);
        }

        id = (typeof id === "undefined")? this.id + "-" + rowStart + "-" + columnStart : id;
        // Create the element
        const gridElement = new GridElement(this, id, rowStart, columnStart, rows, columns);
        this.elements.push(gridElement);

        for(let index = 0; index < this.rows.length; index++) {
            
        }

        this.setupSiblings(gridElement, rowStart, columnStart, rows, columns);
        console.log("CALLING REFRESH DIMENSIONS: ", gridElement.element.id, rowStart, columnStart, rows, columns, id);
        this.refreshElementDimensions();

        return gridElement;
    }

    checkExistingElementAtPosition(rowStart, rowEnd, columnStart, columnEnd, indexArray) {
        for(let index = rowStart; index < rowEnd; index++) {
            if(typeof this.elementMatrix[rowStart] !== "undefined") {
                for(let colIndex = columnStart; colIndex < columnEnd; colIndex++) {
                    if (typeof this.elementMatrix[index][colIndex] !== "undefined") {
                        indexArray[0] = index;
                        indexArray[1] = colIndex;
                        return false;
                    }
                }
            }
        }
        return true;
    };

    setupSiblings(gridElement, rowStart, columnStart, rows, columns) {
        for(let rowIndex = 0; rowIndex < rows; rowIndex++) {
            let newRowStart = rowStart + rowIndex;
            if(newRowStart >= this.numRows) {
                this.numRows++;
                this.elementMatrix[newRowStart] = [];
            }
            for(let colIndex = 0; colIndex < columns; colIndex++) {
                let newColStart = columnStart + colIndex;
                if(newColStart >= this.numColumns) {
                    this.numColumns++;
                }
                this.elementMatrix[newRowStart][newColStart] = gridElement;
                let top = -1, bottom = -1, left = -1, right = -1;

                // Set the top sibling (only for the first row)
                let element = null;
                if(rowIndex === 0 && rowStart > 0) {
                    element = this.elementMatrix[newRowStart - 1][newColStart];
                    if(typeof element !== "undefined" && gridElement.id !== element.id) {
                        gridElement.topSiblings.add(element);
                        // Set this element as the bottom sibling for its top sibling.
                        element.bottomSiblings.add(gridElement);
                    }
                }

                // Set the left sibling (only for the first column)
                if(colIndex === 0 && columnStart > 0) {
                    element = this.elementMatrix[newRowStart][newColStart - 1];
                    if(typeof element !== "undefined" && gridElement.id !== element.id) {
                        gridElement.leftSiblings.add(element);
                        // Set this element as the right sibling for its left sibling.
                        element.rightSiblings.add(gridElement);
                    }
                }

                // If this is the last column
                if(colIndex === columns-1) {
                    // get the next adjacent element (if exists)
                    element = this.elementMatrix[newRowStart][newColStart+1];
                    if(typeof element !== "undefined" && gridElement.id !== element.id) {
                        gridElement.rightSiblings.add(element);
                        // Set this element as the left sibling for its left sibling.
                        element.leftSiblings.add(gridElement);
                    }
                }

                // If this is the last row
                if(rowIndex === rows-1 && typeof this.elementMatrix[newRowStart+1] !== "undefined") {
                    element = this.elementMatrix[newRowStart+1][newColStart];
                    if(typeof element !== "undefined" && gridElement.id !== element.id) {
                        gridElement.bottomSiblings.add(element);
                        // Set this element as the top sibling for its left sibling.
                        element.topSiblings.add(gridElement);
                    }
                }
            }
        }
    }

    refreshElementDimensions() {
        for (let index = 0; index < this.elements.length; index++) {
            let gridElement = this.elements[index];
            gridElement.setDimensions(this.width * gridElement.columns / this.numColumns,
                this.height * gridElement.rows / this.numRows);
        }

        this.setupGridDimensions();
    }

    setupGridDimensions() {
        let prevRowNode = null;
        this.rows = [];
        this.columns = [];
        let newRow = 0;
        let newCol = 0;
        for(let row = 0; row < this.numRows; row++) {
            for(let col = 0; col < this.numColumns; col++) {
                const node = this.elementMatrix[row][col];
                if(prevRowNode) {
                    if(prevRowNode === node) continue;
                } else {
                    prevRowNode = node;
                }
                if(typeof node === "undefined") {
                    // there is a chance that, the current column is not hosting any element yet
                    // so, we need to go further across the column, for now set the row value to -1
                    if(typeof this.columns[newCol] === "undefined") {
                        this.columns[newCol] = -1;
                    }
                } else {
                    if(typeof this.columns[newCol] === "undefined" || this.columns[newCol] === -1) {
                        this.columns[newCol] = node.width/node.columns;
                    }
                    if(typeof this.rows[newRow] === "undefined") {
                        // only set the value if not already set
                        console.log("SETTING ROW HEIGHT: ", node.height/node.rows, row, this.numRows);
                        this.rows[newRow] = node.height/node.rows;
                    }
                }
                newCol++;
            }
            newCol = 0;
            newRow++;
        }
        this.setupGridCSS();
    }

    setupGridCSS() {
        console.log("SETUP GRID CSS CALLED!");
        let gridTemplateRows = "";
        let gridTemplateColumns = "";
        let gridTemplateAreas = "";

        for(let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
            console.log("row: ", GridUtil.floatRound(this.rows[rowIndex], 3));
            gridTemplateRows += " " + GridUtil.floatRound(this.rows[rowIndex], 3) + "px";
        }
        for(let colIndex = 0; colIndex < this.columns.length; colIndex++) {
            gridTemplateColumns += " " + GridUtil.floatRound(this.columns[colIndex], 3) + "px";
        }

        for(let rowIndex = 0; rowIndex < this.elementMatrix.length; rowIndex++) {
            gridTemplateAreas +="'";
            for(let colIndex = 0; colIndex < this.elementMatrix[rowIndex].length; colIndex++) {
                if(typeof this.elementMatrix[rowIndex][colIndex] !== "undefined") {
                    gridTemplateAreas += " " + this.elementMatrix[rowIndex][colIndex].element.id;
                } else {
                    gridTemplateAreas += " no-element";
                }
            }
            gridTemplateAreas +="' "
        }

        console.log("AREAS: ", gridTemplateAreas);
        this.root.style.gridTemplateColumns = gridTemplateColumns;
        this.root.style.gridTemplateRows = gridTemplateRows;
        this.root.style.gridTemplateAreas = gridTemplateAreas;

    }

    resize() {
        if(this.elementMatrix.length === 0) {
            return this;
        }

        // DO RESIZE

        return this;
    }

    deleteElement(gridElement) { // TODO: INCOMPLETE
        GridUtil.deleteFromArray(this.elements, gridElement);
        this.root.removeChild(gridElement.element);
        gridElement.element = null;
        for(let rowIndex = 0; rowIndex < this.elementMatrix.length; rowIndex++) {
            GridUtil.deleteFromArray(this.elementMatrix[rowIndex], gridElement, false, (index) => {
                let leftElement = this.elementMatrix[index - 1];
                let currentElement = this.elementMatrix[index];
                currentElement.columnStart = index;

                if(typeof currentElement !== "undefined" && currentElement !== gridElement) {
                    if (typeof leftElement !== "undefined") {
                        leftElement.rightSiblings.delete(gridElement);
                        leftElement.rightSiblings.add(currentElement);
                        currentElement.leftSiblings.add(leftElement);
                    }
                    currentElement.leftSiblings.delete(gridElement);
                }

                const topElement = this.elementMatrix[rowIndex - 1];
                const bottomElement = this.elementMatrix[rowIndex + 1];
                if(typeof topElement !== "undefined") {
                    topElement.bottomSiblings.delete(gridElement);
                    topElement.bottomSiblings.add(currentElement);
                    // update the top siblings since this element is moved by one, there can
                    // be topSiblings that might have to be removed and no longer required.
                    for(let tEIndex=0; tEIndex < currentElement.topSiblings.length; tEIndex++) {
                        // TODO
                    }
                }
            });

            if(this.elementMatrix[rowIndex].length === 0) {
                GridUtil.deleteFromArray(this.elementMatrix, rowIndex, true);
                // update the rowStart for all the elements present at the newly deleted index.
                if(typeof this.elementMatrix[rowIndex] !== "undefined") {
                    for (let index = 0; index < this.elementMatrix[rowIndex].length; index++) {
                        this.elementMatrix[rowIndex][index] = rowIndex;
                    }
                }
            }
        }
    }

    clear() {
        for(let elementIndex = 0; elementIndex < this.elements.length; elementIndex++) {
            let gridElement = this.elements[elementIndex];
            gridElement.element.remove();
            gridElement.element = undefined;
            this.elements[elementIndex] = undefined;
        }

        this.elements.length = 0;
        this.elementMatrix.length = 0;
        this.elementMatrix = [];
        this.rows.length = 0;
        this.columns.length = 0;
        this.fixedWidthElements.length = 0;
        this.fixedHeightElements.length = 0;

        this.numRows = 0;
        this.numColumns = 0;
        this.currentRow = 0;
        this.currentColumn = 0;
        this.currentRowHandles = 0;
        this.currentColumnHandles = 0;
        this.gridTemplateRows = null;
        this.gridTemplateColumns = null;
        this.gridTemplateAreas = null;
    }
}



module.exports = { Grid: Grid, GridUtil: GridUtil };