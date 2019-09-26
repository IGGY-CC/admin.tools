const { Matrix, MatrixNode } = require("./util_matrix");

class Grid {
    constructor(root, rows, columns, width, height) {
        this.root = root;
        this.rows = rows;
        this.columns = columns;
        this.width = width;
        this.height = height;
        this.matrix = null;

        this.init();
    }

    init() {
        this.root.style.display = "grid";
        this.matrix = new Matrix(this.root, this.rows, this.columns, this.matrixCallback.bind(this));
    }

    createNode(id, rowStart, columnStart, numRows, numColumns, fixedHeight=-1, fixedWidth=-1) {

        const node = new MatrixNode(this.matrix, id, rowStart, columnStart, numRows,
                                    numColumns, fixedHeight, fixedWidth);
        // node.setElement(UtilsUI.createNewElement('div', this.root, id));
        node.element.style.gridArea = id;

        this.matrix.addNode(node);
        this.updateGridArea();
        return node;
    }

    matrixCallback(evt) {
        this.updateGridArea();
    }

    setWidth(width) {
        if(width != null && typeof width !== "undefined") this.width = width;
        return this;
    }

    setHeight(height) {
        if(height != null && typeof height !== "undefined") this.height = height;
        return this;
    }

    setDimensions(width, height) {
        this.setWidth(width, false);
        this.setHeight(height, false);
        return this;
    }

    updateGridArea() {
        let gridTemplateRows = "";
        let gridTemplateColumns = "";

        for(let rowIndex = 0; rowIndex < this.matrix.numRows; rowIndex++) {
            gridTemplateRows += " " + this.matrix.rows[rowIndex] + "px";
        }

        for(let colIndex = 0; colIndex < this.matrix.numColumns; colIndex++) {
            gridTemplateColumns += " " + this.matrix.columns[colIndex] + "px";
        }

        let gridTemplateAreas = this.matrix.printMatrix(null, false, null, false);

        // console.log(gridTemplateAreas);
        this.root.style.gridTemplateColumns = gridTemplateColumns;
        this.root.style.gridTemplateRows = gridTemplateRows;
        this.root.style.gridTemplateAreas = gridTemplateAreas;
        // this.root.style.gridGap = "2px";

    }

    clear() {
    }
}



module.exports = { Grid: Grid };