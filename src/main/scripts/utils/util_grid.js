const { Matrix, MatrixNode } = require("./util_matrix");

class Grid {
    constructor(root, rows, columns, width, height) {
        this.root = root;
        this.rows = rows;
        this.columns = columns;
        this.width = width;
        this.height = height;

        this.init();
    }

    init() {
        this.root.style.display = "grid";
        this.matrix = new Matrix(this.root, this.rows, this.columns, this.width, this.height, this.matrixCallback.bind(this));
    }

    createNode(id, rowStart, columnStart, numRows, numColumns, width=-1,
               height=-1, isFixedWidth=false, isFixedHeight=false) {

        width = (width === -1)? this.matrix.getWidth(columnStart, numColumns) : width;
        height = (height === -1)? this.matrix.getHeight(rowStart, numRows) : height;

        const node = new MatrixNode(this.matrix, id, width, height, isFixedWidth, isFixedHeight,
            rowStart, columnStart, numRows, numColumns);

        node.setElement(UtilsUI.createNewElement('div', this.root, id));
        node.element.style.gridArea = id;

        this.matrix.addNode(node, false, false);
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

        for(let rowIndex = 0; rowIndex < this.matrix.rows.length; rowIndex++) {
            gridTemplateRows += " " + this.matrix.rows[rowIndex] + "px";
        }

        for(let colIndex = 0; colIndex < this.matrix.columns.length; colIndex++) {
            gridTemplateColumns += " " + this.matrix.columns[colIndex] + "px";
        }

        let gridTemplateAreas = this.matrix.printMatrix(null, false, null, false);

        // console.log(gridTemplateColumns);
        this.root.style.gridTemplateColumns = gridTemplateColumns;
        this.root.style.gridTemplateRows = gridTemplateRows;
        this.root.style.gridTemplateAreas = gridTemplateAreas;

    }

    clear() {
    }
}



module.exports = { Grid: Grid };