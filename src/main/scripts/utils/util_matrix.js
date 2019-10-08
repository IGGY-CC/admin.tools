class MatrixUtil {
    static stripPx(value) {
        return value.replace("px", "") * 1;
    }

    static isValidParam(param, name, type) {
        if(typeof type === "undefined") {
            throw new Error("Type check is mandatory! Please provide a value for type");
        }

        const typeCheck = (typeof type === "string")? (typeof param === type) : (param instanceof type);

        if((typeof param !== "undefined") &&
                (param !== null) &&
                (typeCheck)) {
            return param;
        } else {
            throw new Error("Given param "+ name +" (" + param + ") is not a valid input! Expected to be " + type +
                " got: " + (typeof param));
        }
    }

    static floatRound(value, decimals=3, round=ROUND) {
        switch(round) {
            case FLOOR:
                return Math.floor(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
            case CEIL:
                return Math.ceil(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
            case ROUND:
            default:
                return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
        }
    }
}

class MatrixNode {
    constructor(root, id, rowStart, columnStart, numRows, numColumns, fixedHeight=-1, fixedWidth=-1) {

        this.root = MatrixUtil.isValidParam(root, "Matrix", Matrix);
        this.id = MatrixUtil.isValidParam(id, "ID", "string");
        this.rowStart = MatrixUtil.isValidParam(rowStart, "rowStart", "number");
        this.columnStart = MatrixUtil.isValidParam(columnStart, "columnStart", "number");
        this.numRows = MatrixUtil.isValidParam(numRows, "numRows", "number");
        this.numColumns = MatrixUtil.isValidParam(numColumns, "numColumns", "number");

        this.isFixedWidth = fixedWidth > -1;
        this.isFixedHeight = fixedHeight > -1;
        this.width = MatrixUtil.isValidParam(fixedWidth, "fixed-width", "number");
        this.height = MatrixUtil.isValidParam(fixedHeight, "fixed-height", "number");

        if(this.width === -1) this.width = 0;
        if(this.height === -1) this.height = 0;

        this.element = UtilsUI.createNewElement('div', this.root.root, this.id);
    }

    setElement(element) {
        this.element = element;
        this.setElementDimensions();
    }

    setElementDimensions() {
        if(this.element !== null) {
            this.element.style.width = this.width + "px";
            this.element.style.height = this.height + "px";
        }
    }

    setWidth(width) {
        this.setSize(width, true);
    }

    setHeight(height) {
        this.setSize(height, false);
    }

    /* setSize is called when the change in size is initiated from the parent/root */
    setSize(size, isWidth) {
        if(isWidth) {
            this.width = size;
        } else {
            this.height = size;
        }
        this.setElementDimensions();
        this.root.notifyObserverByID(isWidth, size, this.element);
    }

    /* updateSize is called when the change in size is initiated from the child/element */
    updateSize(size, isWidth=true, isDiff=false, direction) {
        this.root.nodeSizeUpdated(this, size, isWidth, isDiff, direction);
    }

    toString() {
        return this.id;
    }
}


class Matrix extends Observable {
    constructor(root, rows, columns, callback, resizeMargin=0) {
        super();
        if(!root || !(root instanceof Element)) throw new Error("Root/Parent element is mandatory!");
        if(!rows || rows < 1) throw new Error("Number of rows should be greater than 0");
        if(!columns || columns < 1) throw new Error("Number of columns should be greater than 0");

        this.root = root;
        this.resizeMargin = resizeMargin;
        this.numRows = rows;
        this.numColumns = columns;

        /* Callback event to trigger on new node, resize event, etc */
        this.callback = callback || (() => {});

        /* Dimensions of the matrix, updated in the init() function */
        this.width = 0;
        this.height = 0;

        /* The default widths/heights of the matrix */
        this.rows = [];
        this.columns = [];

        /* If first manual change has been performed on otherwise auto generated matrix */
        this.isAutoMatrixData = true;

        /* Is there presence of at least one fixed element */
        this.isFixedElement = false;

        /* If fixed elements are present, where are they located */
        this.fixedRows = [];
        this.fixedColumns = [];

        /* If first resize (drag-resize) has been performed by user */
        this.isResizePerformed = false;

        /* Resized row/columns of matrix, too keep their proportion when window is being resized */
        this.resizedRows = [];
        this.resizedColumns = [];

        /* If every row and cell is manually updated */
        this.isManualRowData = false;
        this.isManualColumnData = false;

        /* The mother, matrix */
        this.matrix = [];

        /* In case there is a need to act on surrounding elements/nodes of a node in matrix */
        this.connectedRows = [-1, 0, 1, 0]; // top, right, bottom, left
        this.connectedColumns = [0, 1, 0, -1];
        this.children = new Set();

        /* Initialize the matrix */
        this.init();
    }

    init() {
        /* Setup width and height of the element */
        const computedStyle = getComputedStyle(this.root);
        this.width = MatrixUtil.stripPx(computedStyle.width);
        this.height = MatrixUtil.stripPx(computedStyle.height);
        /* create matrix and fill it with "false" */
        for(let rowIndex=0; rowIndex < this.numRows; rowIndex++) {
            this.matrix[rowIndex] = [];
            for(let colIndex=0; colIndex < this.numColumns; colIndex++) {
                this.matrix[rowIndex][colIndex] = false;
            }
        }

        /* Initialize data */
        /* Init this.rows */
        for(let index = 0; index < this.numRows; index++) {
            this.updateMatrixData(true, this.height/this.numRows, index, false, true);
        }

        /* Init this.columns */
        for(let index = 0; index < this.numColumns; index++) {
            this.updateMatrixData(false, this.width/this.numColumns, index, false, true);
        }

        /* Init fixedRows, fixedColumns */
        this.fixedRows = Array(this.numRows).fill(false);
        this.fixedColumns = Array(this.numColumns).fill(false);

        /* Setup callbacks/event handlers */
        window.addEventListener("resize", this.resize.bind(this));
    }

    updateMatrixData(isRow, value, index, isFixed=false, isAuto=false) {
        if(isFixed && !this.isFixedElement) this.isFixedElement = true;
        if(!isAuto && !this.isAutoMatrixData) this.isAutoMatrixData = false;

        if(isRow) {
            this.rows[index] = (value % 1 === 0)? value : MatrixUtil.floatRound(value);
            if(!this.fixedRows[index] && isFixed) this.fixedRows[index] = isFixed;
        } else {
            this.columns[index] = (value % 1 === 0)? value : MatrixUtil.floatRound(value);
            if(!this.fixedColumns[index] && isFixed) this.fixedColumns[index] = isFixed;
        }
        // console.log("SET ROWS: ", index, this.rows[index], value, (new Error).stack);
        // console.log("SET COLS: ", index, this.columns[index], value);
    }

    setupMatrixData(isRow, index, value, isFixed) {
        if(isFixed) {
            this.updateMatrixData(isRow, value, index, true);
            this.refreshMatrixData();
            this.updateCurrentNodeSpace(isRow, index, value);
        }
        // for everything else, let the default auto dimensions take over.
    }

    updateCurrentNodeSpace(isRow, index, value) {
        if(isRow) {
            for(let colIndex = 0; colIndex < this.numColumns; colIndex++) {
                let node = this.matrix[index][colIndex];
                if(node.numRows === 1) node.setHeight(value);
            }
        } else {
            for(let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
                let node = this.matrix[rowIndex][index];
                if(node.numColumns === 1) node.setWidth(value);
            }
        }
    }

    refreshMatrixData() {
        if(!this.isManualRowData) this.refreshRowMatrixData();
        if(!this.isManualColumnData) this.refreshColumnMatrixData();
    }

    refreshColumnMatrixData() {
        // if there is a manual change, we need to take out manual updated ones
        // to refresh the remaining ones.
        let colSum = this.getSumOfColumns();
        let autoIndices = colSum.autoIndices;
        let fixedPartialSum = colSum.fixedPartialSum;
        let totalSum = colSum.totalSum;

        if (totalSum !== this.width) {
            let diffSum = this.width - fixedPartialSum;
            for (let index = 0; index < autoIndices.length; index++) {
                let autoIndex = autoIndices[index];
                let newWidth = (this.width - fixedPartialSum) * this.columns[autoIndex] / (totalSum - fixedPartialSum);
                this.updateMatrixData(false, newWidth, autoIndex);
                this.updateAutoNodes(false, autoIndex);
            }
        }
    }

    refreshRowMatrixData() {
        // if there is a manual change, we need to take out manual updated ones
        // to refresh the remaining ones.
        let rowsSum = this.getSumOfRows();
        let autoIndices = rowsSum.autoIndices;
        let fixedPartialSum = rowsSum.fixedPartialSum;
        let totalSum = rowsSum.totalSum;

        if (totalSum !== this.height) {
            let diffSum = this.height - fixedPartialSum;
            for (let index = 0; index < autoIndices.length; index++) {
                let autoIndex = autoIndices[index];
                let newHeight = (this.height - fixedPartialSum) * this.rows[autoIndex] / (totalSum - fixedPartialSum)
                this.updateMatrixData(true, newHeight, autoIndex);
                this.updateAutoNodes(true, autoIndex);
            }
        }
    }

    getSumOfRows() {
        let autoIndices = [];
        let fixedPartialSum = 0;
        let autoSum = 0;
        let totalSum = 0;
        if (this.isFixedElement || !this.isAutoMatrixData) {
            for (let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
                if (this.fixedRows[rowIndex]) {
                    fixedPartialSum += this.rows[rowIndex];
                } else {
                    autoIndices.push(rowIndex);
                    autoSum += this.rows[rowIndex];
                }
                totalSum += this.rows[rowIndex];
            }
            if (autoIndices.length === 0) this.isManualRowData = true;
        } else {
            autoIndices = this.rows;
            autoSum = this.height;
            totalSum = this.height;
        }

        return { autoIndices: autoIndices, fixedPartialSum: fixedPartialSum, autoSum: autoSum, totalSum: totalSum };
    }

    getSumOfColumns() {
        let autoIndices = [];
        let fixedPartialSum = 0;
        let autoSum = 0;
        let totalSum = 0;
        if (this.isFixedElement || !this.isAutoMatrixData) {
            for (let colIndex = 0; colIndex < this.numColumns; colIndex++) {
                if (this.fixedColumns[colIndex]) {
                    fixedPartialSum += this.columns[colIndex];
                } else {
                    autoIndices.push(colIndex);
                    autoSum += this.columns[colIndex];
                }
                totalSum += this.columns[colIndex];
            }
            if (autoIndices.length === 0) this.isManualColumnData = true;
        } else {
            autoIndices = this.columns;
            autoSum = this.width;
            totalSum = this.width;
        }

        return { autoIndices: autoIndices, fixedPartialSum: fixedPartialSum, autoSum: autoSum, totalSum: totalSum };
    }

    updateAutoNodes(isRowIndex, autoIndex) {
        if(isRowIndex) {
            /* Update height for each column of the row */
            for(let index=0; index < this.numColumns; index++) {
                if(this.matrix[autoIndex]) {
                    let node = this.matrix[autoIndex][index];
                    if(node) {
                        this.updateNodeSize(node, true);
                    }
                }
            }
        } else {
            /* Update height for each column of the row */
            for(let index=0; index < this.numRows; index++) {
                if(this.matrix[index]) {
                    let node = this.matrix[index][autoIndex];
                    if(node) {
                        this.updateNodeSize(node, false);
                    }
                }
            }
        }
    }

    updateNodeSize(node, isRow) {
        if(isRow) {
            if (!node.isFixedHeight) {
                let height = 0;
                for (let rowIndex = node.rowStart; rowIndex < (node.rowStart + node.numRows); rowIndex++) {
                    height += this.rows[rowIndex];
                }
                node.setHeight(height);
            }
        } else {
            if(!node.isFixedWidth) {
                let width = 0;
                for(let colIndex = node.columnStart; colIndex < (node.columnStart + node.numColumns); colIndex++) {
                    width += this.columns[colIndex];
                }
                node.setWidth(width);
            }
        }
    }

    getWidth(columnStart, numColumns) {
        let width = 0;
        for(let colIndex = columnStart; colIndex < (columnStart + numColumns); colIndex++) {
            width += this.columns[colIndex];
        }
        return width;
    }

    getHeight(rowStart, numRows) {
        let height = 0;
        for(let rowIndex = rowStart; rowIndex < (rowStart + numRows); rowIndex++) {
            height += this.rows[rowIndex];
        }
        return height;
    }

    setupFixedData(node) {
        if(!node instanceof MatrixNode) return;

        /* check for multiple spanning nodes */
        if((node.isFixedWidth && node.numColumns > 1) || (node.isFixedHeight && node.numRows > 1)) {
            throw new Error("Cannot mark as fixed size for multiple spanning nodes.");
        }

        /* Check fixed width/height overlap */
        if(node.isFixedWidth && this.fixedColumns[node.columnStart]) {
            throw new Error("There already is a node marked as fixed-width for the same column: [" +
                node.columnStart +"]");
        }
        if(node.isFixedHeight && this.fixedRows[node.rowStart]) {
            throw new Error("There already is a node marked as fixed-height for the same row: [" +
                node.rowStart +"]");
        }

        /* Check for max allowed width and max allowed height */
        const MIN_ALLOWED_NODE_SIZE = 1;

        if(node.isFixedWidth) {
            if((this.getSumOfColumns().autoSum - node.width) > MIN_ALLOWED_NODE_SIZE) {
                this.setupMatrixData(false, node.columnStart, node.width, true);
            } else {
                throw new Error("Given node size [" + node.width + "] is greater than the allowed capacity.");
            }
        }
        if(node.isFixedHeight) {
            if((this.getSumOfRows().autoSum - node.height) > MIN_ALLOWED_NODE_SIZE) {
                this.setupMatrixData(true, node.rowStart, node.height, true);
            } else {
                throw new Error("Given node size [" + node.height + "] is greater than the allowed capacity.");
            }
        }
    }

    addNode(node) {
        if(node instanceof MatrixNode) {
            if(this.isValidEntry(node.rowStart, node.columnStart, node.numRows, node.numColumns, true)) {
                this.fillMatrix(node);

                /* Set node's dimensions */
                this.updateNodeSize(node, true);
                this.updateNodeSize(node, false);
                this.children.add(node.id);
            } else {
                throw new Error("The passed in nodes's suggested location is out of bounds for this grid!");
            }
        } else {
            throw new Error("Only objects of type MatrixNode are accepted!");
        }

        this.callback();
        return this;
    }

    fillMatrix(node) {
        this.setupFixedData(node);

        for(let rowIndex = node.rowStart; rowIndex < (node.rowStart + node.numRows); rowIndex++) {

            // walk through each column in this row
            for(let colIndex = node.columnStart; colIndex < (node.columnStart + node.numColumns); colIndex++) {

                // finally add the node to the matrix
                this.matrix[rowIndex][colIndex] = node;
            }
        }
    }

    hasEmptyColumns(rowIndex) {
        const row = this.matrix[rowIndex];
        row.forEach(node => {
            if(!node) return false;
        });
        return true;
    }

    hasEmptyRows(colIndex) {
        this.matrix.forEach(row => {
            if(!row[colIndex]) return false;
        });
        return false;
    }

    matrixRowWidth(rowIndex) {
        const visitedNodes = new Set();
        let width = 0;
        this.matrix[rowIndex].forEach(node => {
            if(!visitedNodes.has(node)) {
                visitedNodes.add(node);
                width += node.width;
            }
        });
        return width;
    }

    matrixColumnHeight(colIndex) {
        const visitedNodes = new Set();
        let height = 0;
        this.matrix.forEach(row => {
            let node = row[colIndex];
            if(!visitedNodes.has(node)) {
                visitedNodes.add(node);
                height += node.height;
            }
        });
        return height;
    }

    isValidEntry(rowStart, colStart, numRows, numCols, checkOverlap=false) {
        const validLocation =   (numRows >= 0 && numCols >= 0 &&
            rowStart >= 0 && rowStart < this.numRows &&
            (rowStart + numRows) > 0 && (rowStart + numRows) <= this.numRows &&
            colStart >= 0 && colStart < this.numColumns &&
            (colStart + numCols) > 0 && (colStart + numCols) <= this.numColumns);

        if(validLocation && checkOverlap) {
            for(let rowIndex = rowStart; rowIndex < (rowStart + numRows); rowIndex++) {
                for(let colIndex = colStart; colIndex < (colStart + numCols); colIndex++) {
                    if(this.matrix[rowIndex]) {
                        if (this.matrix[rowIndex][colIndex] && this.matrix[rowIndex][colIndex] instanceof MatrixNode)
                            throw new Error("There already exists an element at the suggested location!" +
                                " [" + rowIndex + ", " + colIndex + "].");
                    }
                }
            }
        }

        return validLocation;
    }

    isFixed(index, isWidth) {
        return (isWidth)? this.fixedColumns[index] === true : this.fixedRows[index] === true;
    }

    doResize(isWidth, index, adjacentIndex, size, direction) {
        if(isWidth) {
            this.doHorizontalResize(index, adjacentIndex, size, direction);
        } else {
            this.doVerticalResize(index, adjacentIndex, size, direction);
        }
    }

    doHorizontalResize(index, adjacentIndex, size, direction) {
        const visitedNodes = new Set();
        for(let rowIndex = 0; rowIndex < this.matrix.length; rowIndex++) {
            // scan column at index located in each row and adjust their sizes
            const node = this.matrix[rowIndex][index];
            const adjacentNode = this.matrix[rowIndex][adjacentIndex];

            if(node === adjacentNode) continue;

            if(!visitedNodes.has(node)) {
                node.setWidth(node.width + size);
            }

            // Since the fact that we are here, node is not equal to adjacent node
            // hence we can take the liberty to directly modify the size of adjacent node
            if(!visitedNodes.has(adjacentNode)) {
                adjacentNode.setWidth(MatrixUtil.floatRound(adjacentNode.width + (-1 * size)));
            }

            // marks the nodes as visited so that we do not change their sizes again
            visitedNodes.add(node);
            visitedNodes.add(adjacentNode);
        }
    }

    doVerticalResize(index, adjacentIndex, size, direction) {
        const visitedNodes = new Set();
        // Since this is a MxN matrix, all rows have equal columns, so we can just
        // use one of index or adjacentIndex to find the length of a row.
        for(let colIndex = 0; colIndex < this.matrix[index].length; colIndex++) {
            // scan column at index located in each row and adjust their sizes
            const node = this.matrix[index][colIndex];
            const adjacentNode = this.matrix[adjacentIndex][colIndex];

            if(node === adjacentNode) continue;

            if(!visitedNodes.has(node)) {
                node.setHeight(node.height + size);
            }

            // Since the fact that we are here, node is not equal to adjacent node
            // hence we can take the liberty to directly modify the size of adjacent node
            if(!visitedNodes.has(adjacentNode)) {
                adjacentNode.setHeight(MatrixUtil.floatRound(adjacentNode.height + (-1 * size)));
            }

            // marks the nodes as visited so that we do not change their sizes again
            visitedNodes.add(node);
            visitedNodes.add(adjacentNode);
        }
    }

    // Called when a node from the matrix is manually resized
    nodeSizeUpdated(node, size, isWidth, isDiff, direction, visitedNodes) {
        // validation
        if(isWidth && !(direction === LEFT || direction === RIGHT)) {
            throw new Error("For width adjustments directional values of only LEFT or RIGHT are allowed.");
        }

        if(!isWidth && !(direction === TOP || direction === BOTTOM)) {
            throw new Error("For height adjustments directional values of only TOP or BOTTOM are allowed.");
        }

        // get the index
        const index = this.getIndex(node, isWidth, direction);

        // get the adjacent index which gets effected (its size changed) due the change in this node's size
        const adjacentIndex = (direction === LEFT || direction === TOP)? index - 1 : index + 1;
        console.log("direction/ADJACENT-INDEX", direction, adjacentIndex);
        this.checkForEdges(isWidth, adjacentIndex);

        // is it possible/allowed to resize?
        this.isFixedConstraint(isWidth, index, adjacentIndex);

        // If supplied value is not diff and actual size to be replaced, convert it into diff
        if(!isDiff) {
            size = (isWidth)? size - node.width : size - node.height;
        }

        this.checkResizeConstraints(node, isWidth, size, index, adjacentIndex);

        // resizer/enlarge-reduction in size is from the left/right/top/bottom side. hence the
        // left/right/top/bottom attached element needs to update its size.
        this.adjustRowColumnArrays(isWidth, size, index, adjacentIndex);

        this.doResize(isWidth, index, adjacentIndex, size, direction);

        // finally update the calling node dimensions
        node.setElementDimensions();

        // invoke the callback;
        this.callback();
    }

    checkResizeConstraints(node, isWidth, size, index, adjacentIndex) {
        if(isWidth) {
            // if(size < 0 && ((size + this.columns[index]) < this.resizeMargin)) {
            if(size < 0 && ((size + node.width) < this.resizeMargin)) {
                throw new Error("Cannot resize further")
            }

            // if((size * -1) < 0 && (((size * -1) + this.columns[adjacentIndex]) < this.resizeMargin)) {
            for(let rowIndex = 0; rowIndex < (node.rowStart + node.numRows); rowIndex++) {
                let adjNode = this.matrix[rowIndex][adjacentIndex];
                let finWidth = MatrixUtil.floatRound(Math.min(adjNode.width/adjNode.numColumns, this.columns[adjacentIndex]));
                if ((size * -1) < 0 && (((size * -1) + finWidth) < this.resizeMargin)) {
                    throw new Error("Cannot resize further due to adjacent cell constraints!");
                }
            }
        } else {
            // if(size < 0 && ((size + this.rows[index]) < this.resizeMargin)) {
            if(size < 0 && ((size + node.height) < this.resizeMargin)) {
                throw new Error("Cannot resize further")
            }

            // if((size * -1) < 0 && (((size * -1) + this.rows[adjacentIndex]) < this.resizeMargin)) {
            for(let colIndex = 0; colIndex < (node.columnStart + node.numColumns); colIndex++) {
                let adjNode = this.matrix[adjacentIndex][colIndex];
                let finHeight = Math.min(adjNode.height/adjNode.numRows, this.rows[adjacentIndex]);
                if ((size * -1) < 0 && (((size * -1) + finHeight) < this.resizeMargin)) {
                    throw new Error("Cannot resize further due to adjacent cell constraints!");
                }
            }
        }
    }

    isFixedConstraint(isWidth, index, adjacentIndex) {
        // is it possible/allowed to resize?

        const textDirection = (isWidth)? "column" : "row";

        if(this.isFixed(index, isWidth)) {
            // This is a fixed row/column and cannot be resized. throw Error and return
            throw new Error("Cannot resize a fixed " + textDirection + "!");
        } else {
            // This is not a fixed row/column. But are the adjacent ones fixed? if so, the resizing is
            // not allowed in that case as well.
            if(this.isFixed(adjacentIndex, isWidth)) {
                throw new Error("Cannot resize the " + textDirection + " as its adjacent " + textDirection + " is non resizeable!");
            }
        }
    }

    adjustRowColumnArrays(isWidth, size, index, adjacentIndex) {
        // resizer/enlarge-reduction in size is from the left/right/top/bottom side. hence the
        // left/right/top/bottom attached element needs to update its size.
        if(isWidth) {
            this.columns[index] += size;
            this.columns[adjacentIndex] += (-1 * size);
        } else {
            this.rows[index] += size;
            this.rows[adjacentIndex] += (-1 * size);
        }
    }

    getIndex(node, isWidth, direction) {
        return (isWidth)?
            (direction === LEFT)? node.columnStart : (node.columnStart + node.numColumns) -1:
            (direction === TOP)? node.rowStart : (node.rowStart + node.numRows) -1;
    }

    checkForEdges(isWidth, adjacentIndex) {
        const maxIndex = (isWidth)? this.numColumns - 1 : this.numRows - 1;

        if(adjacentIndex < 0 || adjacentIndex > maxIndex) {
            throw new Error("Cannot resize edges of the matrix!");
        }
    }

    printMatrix(matrix, newLine=false, printOf, log=true) {
        if(!matrix) matrix = this.matrix;
        let printString = "";
        for(let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
            printString += "'";
            for(let colIndex = 0; colIndex < this.numColumns; colIndex++) {
                const node = matrix[rowIndex][colIndex];
                if(!node) {
                    printString += "<empty>";
                } else {
                    switch(printOf) {
                        case "width":
                            printString += node.width;
                            break;
                        case "height":
                            printString += node.height;
                            break;
                        case "width-height":
                            printString += node.width + "/" + node.height;
                            break;
                        default:
                            printString += node.id;
                            break;
                    }
                }
                if(colIndex+1 !== this.numColumns) {
                    printString += " ";
                }
            }
            printString += "'" + ((newLine)? "\n" : "");
        }

        if(log) console.log(printString);
        return printString;
    }

    getFixedSum(isWidth) {
        let count = 0;
        let zeroCount = 0;
        let sum = 0;

        if(isWidth) {
            for(let index=0; index < this.fixedColumns.length; index++) {
                if(this.fixedColumns[index]) {
                    sum += this.columns[index];
                    count++;
                } else {
                    if(this.columns[index] === 0) {
                        zeroCount++;
                    }
                }
            }
        } else {
            for(let index=0; index < this.fixedRows.length; index++) {
                if(this.fixedRows[index]) {
                    sum += this.rows[index];
                    count++;
                } else {
                    if(this.rows[index] === 0) {
                        zeroCount++;
                    }
                }
            }
        }
        return { count: count, sum: sum, zeroCount: zeroCount };
    }

    // called on window resize event
    resize() {
        // this.printMatrix(null, true, "width-height");
        // this.printMatrix(null, true);
        this.refreshMatrixData();

        let computedStyle = getComputedStyle(this.root);
        const newWidth = MatrixUtil.stripPx(computedStyle.width);
        const newHeight = MatrixUtil.stripPx(computedStyle.height);
        computedStyle = null;

        const fixedRows = this.getFixedSum(false);
        const fixedColumns = this.getFixedSum(true);

        const autoNonZeroColumns = (this.numColumns - fixedColumns.count - fixedColumns.zeroCount);
        const autoNonZeroRows = (this.numColumns - fixedRows.count - fixedRows.zeroCount);

        const diffInWidth = MatrixUtil.floatRound((newWidth - this.width) / autoNonZeroColumns, 3, FLOOR);
        const diffInHeight = MatrixUtil.floatRound((newHeight - this.height) / autoNonZeroRows, 3, FLOOR);

        const visitedRowNodes = new Set();
        const visitedColumnNodes = new Set();

        const visitedRow = [];
        const visitedColumn = [];
        const rowIndices = new Set();
        const columnIndices = new Set();

        for(let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
            visitedRow[rowIndex] = new Set();

            for(let colIndex = 0; colIndex < this.numColumns; colIndex++) {
                if(rowIndex === 0) {
                    visitedColumn[colIndex] = new Set();
                }
                const node = this.matrix[rowIndex][colIndex];
                if(!node || !node instanceof MatrixNode) return;

                if(!visitedRow[rowIndex].has(node) && !this.fixedRows[rowIndex]) {
                    if(node.height === 0) continue;

                    // set the node dimensions
                    node.setHeight(MatrixUtil.floatRound(node.height + diffInHeight));

                    // update this.rows array
                    if(!rowIndices.has(rowIndex)) {
                        this.rows[rowIndex] = MatrixUtil.floatRound(this.rows[rowIndex] + diffInHeight);
                        rowIndices.add(rowIndex);
                    }

                    // save to avoid this in the next iteration
                    visitedRow[rowIndex].add(node);
                }

                if(!visitedColumn[colIndex].has(node) && !this.fixedColumns[colIndex]) {
                    if(this.columns[colIndex] === 0) continue;

                    // set the node dimensions
                    node.setWidth(MatrixUtil.floatRound(node.width + diffInWidth));
                    // update this.columns array
                    if(!columnIndices.has(colIndex)) {
                        this.columns[colIndex] = MatrixUtil.floatRound(this.columns[colIndex] + diffInWidth);
                        columnIndices.add(colIndex);
                    }

                    // save to avoid this in the next iteration
                    visitedColumn[colIndex].add(node);
                }
            }
        }

        this.width = newWidth;
        this.height = newHeight;

        this.callback("window-resize");
        // this.printMatrix(null, true, "width-height");
    }
}

module.exports = { Matrix: Matrix, MatrixNode: MatrixNode, MatrixUtil: MatrixUtil };