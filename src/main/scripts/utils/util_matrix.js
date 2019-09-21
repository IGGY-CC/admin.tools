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
            default:
                return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
        }
    }
}

class MatrixNode {
    constructor(root, id, width, height, isFixedWidth, isFixedHeight, rowStart, columnStart, numRows, numColumns) {
        this.root = MatrixUtil.isValidParam(root, "Matrix", Matrix);
        this.id = MatrixUtil.isValidParam(id, "ID", "string");
        this.width = MatrixUtil.isValidParam(width, "width", "number");
        this.height = MatrixUtil.isValidParam(height, "height", "number");
        this.isFixedWidth = MatrixUtil.isValidParam(isFixedWidth, "isFixedWidth", "boolean");
        this.isFixedHeight = MatrixUtil.isValidParam(isFixedHeight, "isFixedHeight", "boolean");

        this.rowStart = MatrixUtil.isValidParam(rowStart, "rowStart", "number");
        this.columnStart = MatrixUtil.                                                                                isValidParam(columnStart, "columnStart", "number");
        this.numRows = MatrixUtil.isValidParam(numRows, "numRows", "number");
        this.numColumns = MatrixUtil.isValidParam(numColumns, "numColumns", "number");
        this.element = null;
    }

    updateSize(size, isWidth=true, isDiff=false, direction) {
        if(!MatrixUtil.isValidParam(size, "width/height", "number")) {
            throw new Error("For size/width/height, only numbers are allowed");
        }

        this.root.nodeSizeUpdated(this, size, isWidth, isDiff, direction);
    }

    toString() {
        return this.id;
    }
}

class Matrix {
    constructor(root, rows, columns, width, height) {
        if(!root || !(root instanceof Element)) throw new Error("Root/Parent element is mandatory!");
        if(!rows || rows < 1) throw new Error("Number of rows should be greater than 0");
        if(!columns || columns < 1) throw new Error("Number of columns should be greater than 0");
        if(!width || width < 1) throw new Error("Width of grid should be greater than 0");
        if(!height || height < 1) throw new Error("Height of grid should be greater than 0");

        this.root = root;

        this.numRows = rows;
        this.numColumns = columns;

        this.width = width;
        this.height = height;

        this.rows = [];
        this.columns = [];

        this.rowTypes = [];
        this.columnTypes = [];

        this.matrix = [];

        this.connectedRows = [-1, 0, 1, 0]; // top, right, bottom, left
        this.connectedColumns = [0, 1, 0, -1];

        this.initRowValues();
        this.initColumnValues();
        this.fillMatrix();

        window.onresize = this.resize.bind(this);
    }

    initRowValues() {
        for(let index = 0; index < this.numRows; index++) {
            this.rows[index] = MatrixUtil.floatRound(this.height/this.numRows);
            this.rowTypes[index] = "auto";
        }
    }

    initColumnValues() {
        for(let index = 0; index < this.numColumns; index++) {
            this.columns[index] = MatrixUtil.floatRound(this.width/this.numColumns);
            this.columnTypes[index] = "auto";
        }
    }

    isValidSize(index, size, count, isWidth) {
        let arrayCopy;
        if(isWidth) {
            arrayCopy = [...this.columns];
        } else {
            arrayCopy = [...this.rows];
        }

        for(let _index=index; _index < (index + count); _index++) {
            arrayCopy[_index] = MatrixUtil.floatRound(size/count, 3);
        }

        const sum = arrayCopy.reduce((accumulator, currentValue) => accumulator + currentValue);
        if(isWidth) {
            return (Math.round(sum) === Math.round(this.width));
        } else {
            return (Math.round(sum) === Math.round(this.height));
        }
    }

    fillMatrix(matrix=this.matrix, rowStart=0, numRows=this.numRows, columnStart=0,
               numColumns=this.numColumns, node=false, adjustMatrixDimensions=false,
               checkDimensions=false) {

        // check if the dimensions of the given node fit into the existing matrix
        if(node instanceof MatrixNode) this.checkDimensionFeasibility(node, checkDimensions, rowStart, columnStart);

        // check settings based out of fixed width/height. Let the execution stop when Error is thrown.
        for(let rowIndex = rowStart; rowIndex < (rowStart + numRows); rowIndex++) {
            for (let colIndex = columnStart; colIndex < (columnStart + numColumns); colIndex++) {
                this.checkAndUpdateFixedWidth(node, rowIndex, colIndex);
            }
        }

        // TODO: I had to run the same loop twice (above) and (below) just to make sure that
        // errors thrown in above step doesn't leave the transaction dirty!
        for(let rowIndex = rowStart; rowIndex < (rowStart + numRows); rowIndex++) {

            // create a new array for the row, if not already created
            if(typeof matrix[rowIndex] === "undefined") matrix[rowIndex] = [];

            // walk through each column in this row
            for(let colIndex = columnStart; colIndex < (columnStart + numColumns); colIndex++) {

                // finally add the node to the matrix
                matrix[rowIndex][colIndex] = node;

                // Adjust the dimensions of the matrix row and column arrays.
                if(adjustMatrixDimensions && node instanceof MatrixNode) {
                    if(node.width !== -1) this.columns[colIndex] = MatrixUtil.floatRound(node.width / node.numColumns);
                    if(node.height !== -1) this.rows[rowIndex] = MatrixUtil.floatRound(node.height / node.numRows);
                }
            }
        }
    }

    checkDimensionFeasibility(node, checkDimensions, rowStart, columnStart) {
        if(checkDimensions) {
            const validWidth = this.isValidSize(columnStart, node.width, node.numColumns, true);
            const validHeight = this.isValidSize(rowStart, node.height, node.numRows, false);
            if (!(validWidth && validHeight)) {
                throw new Error("Cannot add node as its dimensions do not fall under the required boundaries.");
            }
        }

        // check for fixed width/height and feasibility
        if (node.isFixedWidth && node.numColumns !== 1) {
            // throw new Error("Fixed width nodes spanning multiple columns is not supported yet!");
        }
        if (node.isFixedHeight && node.numRows !== 1) {
            // throw new Error("Fixed height nodes spanning multiple rows is not supported yet!");
        }
    }

    checkAndUpdateFixedWidth(node, rowIndex, colIndex) {
        // check settings based out of fixed width
        if(node.isFixedWidth) {
            if(node.numColumns > 1 && colIndex !== (node.columnStart + node.numColumns)) {
                // only consider the last column of a multiple cell node.
                // console.log("RETURNING: ", node.numColumns, colIndex, node.columnStart);
            } else {
                if (this.columnTypes[colIndex] !== "fixed") {
                    this.columnTypes[colIndex] = "fixed";
                    if (node.numColumns > 1) {
                        this.columns[colIndex] = MatrixUtil.floatRound(node.width / node.numColumns);
                    } else {
                        this.columns[colIndex] = node.width;
                    }
                }
            }
        } else {
            if(this.columnTypes[colIndex] === "fixed") {
                throw new Error("Cannot create non-fixed-width node with width " + node.width +
                    " when there is already a fixed width node defined in this column with size: " +
                    this.columns[colIndex]);
            }
        }

        // check settings based out of fixed height
        if(node.isFixedHeight) {
            if(node.numRows > 1 && rowIndex !== (node.rowStart + node.numRows)) {
                // only consider the last row of a multiple cell node.
                // console.log("RETURNING: ", node.numRows, colIndex, node.rowStart);
            } else {
                if (this.rowTypes[rowIndex] !== "fixed") {
                    this.rowTypes[rowIndex] = "fixed";
                    if (node.numRows > 1) {
                        this.rows[rowIndex] = MatrixUtil.floatRound(node.height / node.numRows);
                    } else {
                        this.rows[rowIndex] = node.height;
                    }
                }
            }
        } else {
            if(this.rowTypes[rowIndex] === "fixed") {
                throw new Error("Cannot create non-fixed-height node with height " + node.height +
                    " when there is already a fixed height node defined in this row with size: " +
                    this.rows[rowIndex]);
            }
        }
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
                    if(this.matrix[rowIndex][colIndex])
                        throw new Error("There already exists an element at the suggested location!" +
                            " [" + rowIndex + ", " + colIndex + "].");
                }
            }
        }

        return validLocation;
    }

    addNode(node, adjustMatrixDimensions=false, checkDimensions=false) {
        if(node instanceof MatrixNode) {
            if(this.isValidEntry(node.rowStart, node.columnStart, node.numRows, node.numColumns, true)) {
                this.fillMatrix(this.matrix, node.rowStart, node.numRows, node.columnStart,
                    node.numColumns, node, adjustMatrixDimensions, checkDimensions);
            } else {
                throw new Error("The passed in nodes's suggested location is out of bounds for this grid!");
            }
        } else {
            throw new Error("Only objects of type MatrixNode are accepted!");
        }
        return this;
    }

    isFixed(index, isWidth) {
        return (isWidth)? this.columnTypes[index] === "fixed" : this.rowTypes[index] === "fixed";
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

            if(!visitedNodes.has(node)) node.width += size;

            // Since the fact that we are here, node is not equal to adjacent node
            // hence we can take the liberty to directly modify the size of adjacent node
            if(!visitedNodes.has(adjacentNode)) adjacentNode.width += (-1 * size);

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

            if(!visitedNodes.has(node)) node.height += size;

            // Since the fact that we are here, node is not equal to adjacent node
            // hence we can take the liberty to directly modify the size of adjacent node
            if(!visitedNodes.has(adjacentNode)) adjacentNode.height += (-1 * size);

            // marks the nodes as visited so that we do not change their sizes again
            visitedNodes.add(node);
            visitedNodes.add(adjacentNode);
        }
    }

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
        this.checkForEdges(isWidth, adjacentIndex);

        // is it possible/allowed to resize?
        this.isFixedConstraint(isWidth, index, adjacentIndex);

        // If supplied value is not diff and actual size to be replaced, convert it into diff
        if(!isDiff) {
            size = (isWidth)? size - this.columns[index] : size - this.rows[index];
        }

        // resizer/enlarge-reduction in size is from the left/right/top/bottom side. hence the
        // left/right/top/bottom attached element needs to update its size.
        this.adjustRowColumnArrays(isWidth, size, index, adjacentIndex);
        this.doResize(isWidth, index, adjacentIndex, size, direction);
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

    printMatrix(matrix, newLine=false, printOf) {
        if(!matrix) matrix = this.matrix;
        let printString = "";
        for(let rowIndex = 0; rowIndex < this.numRows; rowIndex++) {
            printString += "'";
            for(let colIndex = 0; colIndex < this.numColumns; colIndex++) {
                const node = matrix[rowIndex][colIndex];
                if(typeof printOf === "undefined" || !node) {
                    printString += node;
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
                    }
                }
                if(colIndex+1 !== this.numColumns) {
                    printString += " ";
                }
            }
            printString += "'" + ((newLine)? "\n" : "");
        }
        console.log(printString);
        return printString;
    }

    updateSumFixed(isWidth) {
        let count = 0;
        let sum = 0;

        if(isWidth) {
            for(let index=0; index < this.columnTypes.length; index++) {
                if(this.columnTypes[index] === "fixed") {
                    sum += this.columns[index];
                    count++;
                }
            }
        } else {
            for(let index=0; index < this.rowTypes.length; index++) {
                if(this.rowTypes[index] === "fixed") {
                    sum += this.rows[index];
                    count++;
                }
            }
        }
        return { count: count, sum: sum };
    }

    resize() {
        // this.printMatrix(null, true, "width-height");
        // this.printMatrix(null, true);

        let computedStyle = getComputedStyle(this.root);
        const newWidth = MatrixUtil.stripPx(computedStyle.width);
        const newHeight = MatrixUtil.stripPx(computedStyle.height);
        computedStyle = null;

        const fixedRows = this.updateSumFixed(false);
        const fixedColumns = this.updateSumFixed(true);

        const diffInWidth = MatrixUtil.floatRound((newWidth - this.width) / (this.numColumns - fixedColumns.count), 3, FLOOR);
        const diffInHeight = MatrixUtil.floatRound((newHeight - this.height) / (this.numRows - fixedRows.count), 3, FLOOR);

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
                if(!visitedRow[rowIndex].has(node) && this.rowTypes[rowIndex] !== "fixed") {
                    node.height = MatrixUtil.floatRound(node.height + diffInHeight);
                    if(!rowIndices.has(rowIndex)) {
                        this.rows[rowIndex] = MatrixUtil.floatRound(this.rows[rowIndex] + diffInHeight);
                        rowIndices.add(rowIndex);
                    }
                    visitedRow[rowIndex].add(node);
                }
                if(!visitedColumn[colIndex].has(node) && this.columnTypes[colIndex] !== "fixed") {
                    node.width = MatrixUtil.floatRound(node.width + diffInWidth);
                    if(!columnIndices.has(colIndex)) {
                        this.columns[colIndex] = MatrixUtil.floatRound(this.columns[colIndex] + diffInWidth);
                        columnIndices.add(colIndex);
                    }
                    visitedColumn[colIndex].add(node);
                }
            }
        }

        this.width = newWidth;
        this.height = newHeight;

        // this.printMatrix(null, true, "width-height");
    }
}

module.exports = { Matrix: Matrix, MatrixNode: MatrixNode, MatrixUtil: MatrixUtil };