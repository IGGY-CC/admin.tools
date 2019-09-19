class MatrixUtil {
    static isValidParam(param, name, type) {
        if(typeof type === "undefined") {
            throw new Error("Type check is mandatory! Please provide a value for type");
        }

        if((typeof param !== "undefined") &&
                (param !== null) &&
                (typeof param === type)) {
            return param;
        } else {
            throw new Error("Given param "+ name +" (" + param + ") is not a valid input! Expected to be " + type +
                " got: " + (typeof param));
        }
    }
}

class MatrixNode {
    constructor(id, width, height, isFixedWidth, isFixedHeight, rowStart, columnStart, numRows, numColumns) {
        this.id = MatrixUtil.isValidParam(id, "ID", "string");
        this.width = MatrixUtil.isValidParam(width, "width", "number");
        this.height = MatrixUtil.isValidParam(height, "height", "number");
        this.isFixedWidth = MatrixUtil.isValidParam(isFixedWidth, "isFixedWidth", "boolean");
        this.isFixedHeight = MatrixUtil.isValidParam(isFixedHeight, "isFixedHeight", "boolean");

        this.rowStart = MatrixUtil.isValidParam(rowStart, "rowStart", "number");
        this.columnStart = MatrixUtil.isValidParam(columnStart, "columnStart", "number");
        this.numRows = MatrixUtil.isValidParam(numRows, "numRows", "number");
        this.numColumns = MatrixUtil.isValidParam(numColumns, "numColumns", "number");
    }

    updateSize(size, isWidth) {
        if(!MatrixUtil.isValidParam(param, "number")) {
            throw new Error("For size/width/height, only numbers are allowed");
        }
        if(isWidth) {
            this.width = size;
        } else {
            this.height = size;
        }
    }

    toString() {
        return this.id;
    }
}

class Matrix {
    constructor(root, rows, columns) {
        if(!root || !(root instanceof Element)) throw new Error("Root/Parent element is mandatory!");
        if(!rows || rows < 1) throw new Error("Number of rows should be greater than 0");
        if(!columns || columns < 1) throw new Error("Number of columns should be greater than 0");

        this.root = root;
        this.rows = rows;
        this.columns = columns;
        this.matrix = [];


        this.connectedRows = [-1, 0, 1, 0]; // top, right, bottom, left
        this.connectedColumns = [0, 1, 0, -1];

        this.fillMatrix();
    }

    fillMatrix(matrix=this.matrix, rowStart=0, numRows=this.rows, columnStart=0, numColumns=this.columns, node=false) {
        for(let rowIndex = rowStart; rowIndex < (rowStart + numRows); rowIndex++) {
            if(typeof matrix[rowIndex] === "undefined") matrix[rowIndex] = [];
            for(let colIndex = columnStart; colIndex < (columnStart + numColumns); colIndex++) {
                matrix[rowIndex][colIndex] = node;
            }
        }
    }

    printMatrix(matrix, newLine=false) {
        if(!matrix) matrix = this.matrix;
        let printString = "";
        for(let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
            printString += "'";
            for(let colIndex = 0; colIndex < this.columns; colIndex++) {
                printString += matrix[rowIndex][colIndex];
                if(colIndex+1 !== this.columns) {
                    printString += " ";
                }
            }
            printString += "'" + ((newLine)? "\n" : "");
        }
        console.log(printString);
        return printString;
    }

    isValidEntry(rowStart, colStart, numRows, numCols) {
        return (numRows >= 0 && numCols >= 0 &&
                rowStart >= 0 && rowStart < this.rows &&
                (rowStart + numRows) > 0 && (rowStart + numRows) < this.rows &&
                colStart >= 0 && colStart < this.columns &&
                (colStart + numCols) > 0 && (colStart + numCols) < this.columns);
    }

    addNode(node) {
        if(node instanceof MatrixNode) {
            if(this.isValidEntry(node.rowStart, node.columnStart, node.numRows, node.numColumns)) {
                this.fillMatrix(this.matrix, node.rowStart, node.numRows, node.columnStart, node.numColumns, node);
            } else {
                throw new Error("The passed in nodes's suggested location is out of bounds for this grid!");
            }
        } else {
            throw new Error("Only objects of type MatrixNode are accepted!");
        }
    }
}

module.exports = { Matrix: Matrix, MatrixNode: MatrixNode, MatrixUtil: MatrixUtil };