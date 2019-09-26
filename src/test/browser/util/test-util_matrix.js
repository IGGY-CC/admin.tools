const { Matrix, MatrixNode, MatrixUtil } = require("../../../main/scripts/utils/util_matrix");
const {assert, expect} = require('chai');

const GRID_ID = "grid-container";
const container = document.querySelector("#" + GRID_ID);

const NUM_ROWS = 3;
const NUM_COLS = 4;
let computedStyle;
let width;
let height;

// container.classList.add("overflow-auto");
// const mocha = UtilsUI.createNewElement('div', container, "mocha");
// mocha.style.width = "500px";

beforeEach(() => {
    computedStyle = getComputedStyle(container);
    width = MatrixUtil.stripPx(computedStyle.width);
    height = MatrixUtil.stripPx(computedStyle.height);
});

describe.skip("disable all test cases", () => {
    it('disable all tests', (done) => {
        done();
    });
});

const fr = (size, p=ROUND) => MatrixUtil.floatRound(size, 3, p);

describe('Check Matrix defaults', function () {
    it('check the defaults', (done) => {
        let matrix = new Matrix(container, NUM_ROWS, NUM_COLS);

        assert.equal(fr(width/NUM_COLS), matrix.columns[0]);
        assert.equal(fr(height/NUM_ROWS), matrix.rows[0]);
        done();
    });

    it('fill matrix with empty objects', (done) => {
        let matrix = new Matrix(container, 3, 3);
        let node = new MatrixNode(matrix, "hello", 1, 1, 2, 1);
        matrix.addNode(node);

        // matrix.printMatrix(null, true, "width-height");
        assert.equal(node, matrix.matrix[1][1]);
        assert.equal(node, matrix.matrix[2][1]);

        assert.equal(false, matrix.matrix[0][0]);
        assert.equal(false, matrix.matrix[1][0]);
        assert.equal(false, matrix.matrix[1][2]);
        assert.equal(false, matrix.matrix[2][0]);
        assert.equal(false, matrix.matrix[2][2]);
        done();
    });
});

describe('Check Node creation', function () {
    it('check the node creation and addition to matrix', (done) => {

        let matrix = new Matrix(container, 3, 3);
        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        assert.doesNotThrow(() => matrix.addNode(node));

        /* overlap test */
        let node2 = new MatrixNode(matrix, "hello", 1, 0, 2, 2);
        expect(() => matrix.addNode(node2, true, true)).to.throw(
            "There already exists an element at the suggested location! [1, 0]."
        );

        /* Out of bounds test */
        let node3 = new MatrixNode(matrix, "hello", 1, 1, 3, 2);
        expect(() => matrix.addNode(node3)).to.throw(
            "The passed in nodes's suggested location is out of bounds for this grid!"
        );

        let node4 = new MatrixNode(matrix, "world", 2, 2, 1, 1);
        assert.doesNotThrow(() => matrix.addNode(node4));

        done();
    });

    it('check the node dimensions', (done) => {
        let matrix = new Matrix(container, NUM_ROWS, NUM_COLS);
        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        assert.doesNotThrow(() => matrix.addNode(node));

        /* Check default dimensions */
        assert.closeTo(fr(width*2/NUM_COLS), node.width, 0.01);
        assert.closeTo(fr(height*2/NUM_ROWS), node.height, 0.01);

        let node2 = new MatrixNode(matrix, "world", 2, 2, 1, 1);
        assert.doesNotThrow(() => matrix.addNode(node2));

        /* Check default dimensions after adding another node*/
        assert.closeTo(fr(width*2/NUM_COLS), node.width, 0.01);
        assert.closeTo(fr(height*2/NUM_ROWS), node.height, 0.01);
        assert.closeTo(fr(width/NUM_COLS), node2.width, 0.01);
        assert.closeTo(fr(height/NUM_ROWS), node2.height, 0.01);

        done();
    });
});

describe('Check Nodes with fixed dimensions', function () {
    it('check the node addition to matrix -- exceptions', (done) => {
        let matrix = new Matrix(container, NUM_ROWS, NUM_COLS);

        /* Mark height as fixed with node being two nodes high */
        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2, 100);
        assert.equal(100, node.height);
        expect(() => matrix.addNode(node)).to.throw(
            "Cannot mark as fixed size for multiple spanning nodes."
        );
        /* Mark height as fixed with a single node high shouldn't throw exception */
        let node2 = new MatrixNode(matrix, "hello2", 0, 0, 1, 2, 100);
        assert.doesNotThrow(() => matrix.addNode(node2));

        /* Add a plain node */
        let node3 = new MatrixNode(matrix, "hello3", 1, 1, 2, 2);
        assert.doesNotThrow(() => matrix.addNode(node3));

        /* Add a fixed width node */
        let node4 = new MatrixNode(matrix, "hello4", 1, 0, 1, 1, -1, 35);
        assert.doesNotThrow(() => matrix.addNode(node4));

        /* Add another fixed width node  */
        let node5 = new MatrixNode(matrix, "hello5", 0, 3, 1, 1, -1, 70);
        assert.doesNotThrow(() => matrix.addNode(node5));

        /* Add another fixed width node in a different column that overlaps already existing fixed node. */
        let node6 = new MatrixNode(matrix, "hello6", 2, 3, 1, 1, -1, 90);
        expect(() => matrix.addNode(node6)).to.throw(
            "There already is a node marked as fixed-width for the same column: [3]"
        );

        /* Add another fixed height node in a different row that overlaps already existing fixed node. */
        let node7 = new MatrixNode(matrix, "hello7", 0, 2, 1, 1, 99);
        expect(() => matrix.addNode(node7)).to.throw(
            "There already is a node marked as fixed-height for the same row: [0]"
        );

        /* Add another node with larger sizes (height) */
        let node8 = new MatrixNode(matrix, "hello8", 2, 0, 1, 1, 1800);
        expect(() => matrix.addNode(node8)).to.throw(
            "Given node size [1800] is greater than the allowed capacity."
        );

        /* Add another node with larger sizes (width) */
        let node9 = new MatrixNode(matrix, "hello9", 0, 2, 1, 1, -1, 2800);
        expect(() => matrix.addNode(node9)).to.throw(
            "Given node size [2800] is greater than the allowed capacity."
        );

        done();
    });

    it('check the node addition to matrix -- dimensions and fixed width manipulations', (done) => {
        let matrix = new Matrix(container, NUM_ROWS, NUM_COLS);

        /* Mark height as fixed with a single node high shouldn't throw exception */
        let node2 = new MatrixNode(matrix, "hello2", 0, 0, 1, 2, 100);
        assert.doesNotThrow(() => matrix.addNode(node2));

        /* compare the updated rows and columns */
        assert.equal(100, matrix.rows[0]);
        assert.equal((height-100)/(NUM_ROWS-1), matrix.rows[1]);
        assert.equal((height-100)/(NUM_ROWS-1), matrix.rows[2]);
        assert.equal(width/NUM_COLS, matrix.columns[0]);
        assert.equal(width/NUM_COLS, matrix.columns[1]);
        assert.equal(width/NUM_COLS, matrix.columns[2]);
        assert.equal(width/NUM_COLS, matrix.columns[3]);

        /* Add a plain node, to see that nothing previous has changed */
        let node3 = new MatrixNode(matrix, "hello3", 1, 1, 2, 2);
        assert.doesNotThrow(() => matrix.addNode(node3));
        /* Check matrix auto dimensions */
        assert.equal(100, matrix.rows[0]);
        assert.equal((height-100)/(NUM_ROWS-1), matrix.rows[1]);
        assert.equal((height-100)/(NUM_ROWS-1), matrix.rows[2]);
        assert.equal(width/NUM_COLS, matrix.columns[0]);
        assert.equal(width/NUM_COLS, matrix.columns[1]);
        assert.equal(width/NUM_COLS, matrix.columns[2]);
        assert.equal(width/NUM_COLS, matrix.columns[3]);

        /* Add a fixed width node and see that the non-fixed width columns change */
        let node4 = new MatrixNode(matrix, "hello4", 1, 0, 1, 1, -1, 35);
        assert.doesNotThrow(() => matrix.addNode(node4));
        /* Check node dimensions */
        assert.equal(35, node4.width);
        /* Check matrix auto dimensions */
        assert.equal(100, matrix.rows[0]);
        assert.closeTo((height-100)/(NUM_ROWS-1), matrix.rows[1], 0.01);
        assert.closeTo((height-100)/(NUM_ROWS-1), matrix.rows[2], 0.01);
        assert.equal(35, matrix.columns[0]);
        assert.closeTo((width-35)/(NUM_COLS-1), matrix.columns[1], 0.01);
        assert.closeTo((width-35)/(NUM_COLS-1), matrix.columns[2], 0.01);
        assert.closeTo((width-35)/(NUM_COLS-1), matrix.columns[3], 0.01);

        /* Add another fixed width node and see that the non-fixed width columns change */
        let node5 = new MatrixNode(matrix, "hello5", 0, 3, 1, 1, -1, 70);
        assert.doesNotThrow(() => matrix.addNode(node5));
        /* Check node dimensions */
        assert.equal(35, node4.width);
        assert.equal(70, node5.width);
        /* Check matrix auto dimensions */
        assert.equal(100, matrix.rows[0]);
        assert.closeTo((height-100)/(NUM_ROWS-1), matrix.rows[1], 0.01);
        assert.closeTo((height-100)/(NUM_ROWS-1), matrix.rows[2], 0.01);
        assert.equal(35, matrix.columns[0]);
        assert.closeTo((width-35-70)/(NUM_COLS-2), matrix.columns[1], 0.01);
        assert.closeTo((width-35-70)/(NUM_COLS-2), matrix.columns[2], 0.01);
        assert.equal(70, matrix.columns[3]);

        done();
    });

    it('check the node addition with fixed width/height to matrix', (done) => {
        let matrix = new Matrix(container, 4, 4);
        let node3 = new MatrixNode(matrix, "hello3", 0, 0, 2, 2);
        let node4 = new MatrixNode(matrix, "hello4", 2, 0, 2, 1, -1, 100);
        let node5 = new MatrixNode(matrix, "hello5", 0, 2, 1, 2, 100);
        let node6 = new MatrixNode(matrix, "hello6", 2, 2, 1, 1, 25, 50);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        assert.equal(matrix.columns[0], 100);
        assert.equal(matrix.rows[0], 100);

        matrix = null;
        done();
    });
});

describe('Check the dimensions of Node and Matrix', function () {
    it('check the dimensions of nodes', (done) => {
        let matrix = new Matrix(container, 3, 4);
        let rowHeight = MatrixUtil.floatRound(height/3);
        let colWidth = MatrixUtil.floatRound(width/4);

        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1);
        let node4 = new MatrixNode(matrix, "hello4", 2, 0, 1, 1);
        let node5 = new MatrixNode(matrix, "hello5", 2, 1, 1, 2);
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1);

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        assert.deepEqual([colWidth, colWidth, colWidth, colWidth], matrix.columns);
        assert.deepEqual([false, false, false, false], matrix.fixedColumns);

        assert.deepEqual([rowHeight, rowHeight, rowHeight], matrix.rows);
        assert.deepEqual([false, false, false], matrix.fixedRows);

        // matrix.printMatrix(null, true);
        matrix = null;
        done();
    });

    it('check the dimensions of nodes with fixed constraints', (done) => {
        let matrix = new Matrix(container, 3, 4);
        let rowHeight = MatrixUtil.floatRound(height/3);
        let colWidth = MatrixUtil.floatRound(width/4);

        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1, -1, 200);
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1);
        let node4 = new MatrixNode(matrix, "hello4", 2, 1, 1, 2);
        let node5 = new MatrixNode(matrix, "hello5", 2, 0, 1, 1, 20);
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1);

        /**
         ** FINAL LAYOUT
         **
         ** hello  hello  hello2 hello6
         ** hello  hello  hello3 hello6
         ** hello4 hello5 hello5 hello6
         **/

        assert.doesNotThrow(() => matrix.addNode(node));
        assert.doesNotThrow(() => matrix.addNode(node2)); // marked as fixed width
        // node3 not marked as fixed width should not throw error as the size is auto calculated
        assert.doesNotThrow(() => matrix.addNode(node3));
        assert.doesNotThrow(() => matrix.addNode(node4));
        assert.doesNotThrow(() => matrix.addNode(node5));
        assert.doesNotThrow(() => matrix.addNode(node6));

        let matrixWidth = fr((matrix.width - 200) / 3);
        assert.deepEqual([matrixWidth, matrixWidth, 200, matrixWidth], matrix.columns);
        assert.deepEqual([false, false, true, false], matrix.fixedColumns);
        assert.deepEqual([((matrix.height - 20)/2), ((matrix.height - 20)/2), 20], matrix.rows);
        assert.deepEqual([false, false, true], matrix.fixedRows);

        // matrix.printMatrix(null, true);
        // matrix.printMatrix(null, true, "width-height");
        done();
    });
});

describe('Check resizing a non-fixed node within the matrix', function () {
    it('Check for resizing width', (done) => {
        let matrix = new Matrix(container, 3, 4);
        let node  =  new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1);
        let node4 = new MatrixNode(matrix, "hello4", 2, 1, 1, 2);
        let node5 = new MatrixNode(matrix, "hello5", 2, 0, 1, 1);
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1);

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        /* There are no fixed width or fixed height nodes */
        let matrixWidth = matrix.width / 4;
        let matrixHeight = matrix.height / 2;

        node2.updateSize(20, true, true, LEFT);
        assert.equal(matrixWidth*2 - 20, node.width);
        assert.equal(matrixWidth + 20, node2.width);
        assert.equal(matrixWidth + 20, node3.width);
        assert.equal(matrixWidth*2, node4.width); // no change
        assert.equal(matrixWidth, node5.width); // no change
        assert.equal(matrixWidth, node6.width); // no change

        node2.updateSize(60, true, true, RIGHT);
        assert.equal(matrixWidth*2 - 20, node.width); // no change
        assert.equal(matrixWidth + 20 + 60, node2.width);
        assert.equal(matrixWidth + 20 + 60, node3.width);
        assert.equal(matrixWidth*2 + 60, node4.width);
        assert.equal(matrixWidth, node5.width); // no change
        assert.equal(matrixWidth - 60, node6.width);

        expect(() => node.updateSize(60, true, true, LEFT)).to.throw(
            "Cannot resize edges of the matrix!"
        );
        expect(() => node6.updateSize(60, true, true, RIGHT)).to.throw(
            "Cannot resize edges of the matrix!"
        );

        // console.log("A-COLUMNS", matrix.columns);
        // matrix.printMatrix(null, true, "width-height");
        // matrix.printMatrix(null, true);

        done();
    });

    it('Check for resizing height', (done) => {
        let matrix = new Matrix(container, 3, 4);
        let node  =  new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1);
        let node4 = new MatrixNode(matrix, "hello4", 2, 1, 1, 2);
        let node5 = new MatrixNode(matrix, "hello5", 2, 0, 1, 1);
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1);

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        // matrix.printMatrix(matrix.matrix, true);
        // matrix.printMatrix(matrix.matrix, true, "width-height", true);
        // console.log("MATRIX DIM: ", matrix.width, matrix.height);

        node2.updateSize(60, false, true, BOTTOM);

        assert.closeTo(fr(matrix.height* 2/3), node.height, 0.01); // no change
        assert.closeTo(fr(matrix.height/3) + 60, node2.height, 0.01);
        assert.closeTo(fr(matrix.height/3) - 60, node3.height, 0.01);
        assert.closeTo(fr(matrix.height/3), node4.height, 0.01); // no change
        assert.closeTo(fr(matrix.height/3), node5.height, 0.01); // no change
        assert.closeTo(matrix.height, node6.height, 0.01); // no change


        // console.log("***************************");
        // matrix.printMatrix(matrix.matrix, true, "width-height", true);

        let topHeight = node2.height;
        const MARGIN_SIZE = 4;
        /* less than (node2.height - 60 - MARGIN_SIZE + 1) doesn't throw an error */
        expect(() => node3.updateSize(node2.height - 60 - MARGIN_SIZE + 1, false, true, TOP)).to.throw(
            "Cannot resize further due to adjacent cell constraints!"
        );

        /* less than (node4.height - MARGIN_SIZE + 1) doesn't throw an error */
        expect(() => node3.updateSize(node4.height - MARGIN_SIZE + 1, false, true, BOTTOM)).to.throw(
            "Cannot resize further due to adjacent cell constraints!"
        );

        /* Should throw error if it is reduced more than its height (+margin size) */
        expect(() => node3.updateSize(-node3.height + MARGIN_SIZE -1, false, true, BOTTOM)).to.throw(
            "Cannot resize further"
        );

        /* less than 196 doesn't throw an error */
        expect(() => node3.updateSize((node4.width - node3.width - MARGIN_SIZE + 1), true, true, LEFT)).to.throw(
            "Cannot resize further due to adjacent cell constraints!"
        );

        /* less than (node6.width - MARGIN_SIZE + 1) doesn't throw an error */
        expect(() => node3.updateSize(node6.width - MARGIN_SIZE + 1, true, true, RIGHT)).to.throw(
            "Cannot resize further due to adjacent cell constraints!"
        );

        /* Should throw error if it is reduced more than its width (+margin size) */
        expect(() => node3.updateSize(-node3.width + MARGIN_SIZE -1, true, true, RIGHT)).to.throw(
            "Cannot resize further"
        );

        node3.updateSize(10, false, true, TOP);

        assert.closeTo(fr(matrix.height* 2/3), node.height, 0.01);
        assert.closeTo(fr(matrix.height/3) + 60 - 10, node2.height, 0.01);
        assert.closeTo(fr(matrix.height/3) - 60 + 10, node3.height, 0.01);
        assert.closeTo(fr(matrix.height/3), node4.height, 0.01); // no change
        assert.closeTo(fr(matrix.height/3), node5.height, 0.01); // no change
        assert.closeTo(matrix.height, node6.height, 0.01); // no change

        node3.updateSize(10, false, true, BOTTOM);

        assert.closeTo(fr(matrix.height* 2/3) + 10, node.height, 0.01);
        assert.closeTo(fr(matrix.height/3) + 60 - 10, node2.height, 0.01);
        assert.closeTo(fr(matrix.height/3) - 60 + 10 + 10, node3.height, 0.01);
        assert.closeTo(fr(matrix.height/3) -10, node4.height, 0.01);
        assert.closeTo(fr(matrix.height/3) -10, node5.height, 0.01);
        assert.closeTo(matrix.height, node6.height, 0.01); // no change

        expect(() => node.updateSize(60, false, true, TOP)).to.throw(
            "Cannot resize edges of the matrix!"
        );
        expect(() => node6.updateSize(60, false, true, BOTTOM)).to.throw(
            "Cannot resize edges of the matrix!"
        );

        // console.log("A-ROWS", matrix.rows);
        // matrix.printMatrix(null, true, "width-height");
        // matrix.printMatrix(null, true);
        done();
    });
});

describe('Check resizing a fixed node within the matrix', function () {

    it('Check for resizing width of fixed node', (done) => {
        let matrix = new Matrix(container, 3, 4);
        let rowHeight = 10;
        let colWidth = 20;

        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1);
        let node4 = new MatrixNode(matrix, "hello4", 2, 1, 1, 2);
        let node5 = new MatrixNode(matrix, "hello5", 2, 0, 1, 1, rowHeight); // fixed height
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1, -1, colWidth); // fixed width

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        // console.log("***************************");
        node2.updateSize(20, true, true, LEFT);
        // matrix.printMatrix(matrix.matrix, true, "width-height", true);
        // console.log("***************************");

        assert.equal(10, node5.height);
        assert.equal(10, node4.height);

        assert.closeTo(fr((matrix.width - colWidth)*2/3 - 20), node.width, 0.01);
        assert.closeTo((((matrix.width - colWidth)/3) + 20), node2.width, 0.01);
        assert.closeTo((((matrix.width - colWidth)/3) + 20), node3.width, 0.01);
        assert.closeTo(((matrix.width - colWidth)*2/3), node4.width, 0.01);
        assert.closeTo(((matrix.width - colWidth)/3), node5.width, 0.01); // no change
        assert.equal(colWidth, node6.width); // no change

        expect(() => node2.updateSize(60, true, true, RIGHT)).to.throw(
            "Cannot resize the column as its adjacent column is non resizeable!"
        );

        assert.doesNotThrow(() => node.updateSize(60, true, true, RIGHT));
        assert.closeTo(fr((matrix.width - colWidth)*2/3 - 20 + 60), node.width, 0.01);
        assert.closeTo((((matrix.width - colWidth)/3) + 20 - 60), node2.width, 0.01);
        assert.closeTo((((matrix.width - colWidth)/3) + 20 -60), node3.width, 0.01);
        assert.closeTo(((matrix.width - colWidth)*2/3), node4.width, 0.01); // no change
        assert.closeTo(((matrix.width - colWidth)/3), node5.width, 0.01); // no change
        assert.equal(colWidth, node6.width); // no change

        expect(() => node.updateSize(60, true, true, LEFT)).to.throw(
            "Cannot resize edges of the matrix!"
        );
        expect(() => node3.updateSize(60, true, true, RIGHT)).to.throw(
            "Cannot resize the column as its adjacent column is non resizeable!"
        );

        node4.updateSize(60, true, true, LEFT);
        assert.closeTo(fr((matrix.width - colWidth)*2/3 - 20 + 60), node.width, 0.01); // no change
        assert.closeTo((((matrix.width - colWidth)/3) + 20 - 60), node2.width, 0.01);  // no change
        assert.closeTo((((matrix.width - colWidth)/3) + 20 -60), node3.width, 0.01); // no change
        assert.closeTo(((matrix.width - colWidth)*2/3 + 60), node4.width, 0.01);
        assert.closeTo(((matrix.width - colWidth)/3 -60), node5.width, 0.01);
        assert.equal(colWidth, node6.width); // no change

        done();
    });

    it('Check for resizing height of fixed node', (done) => {

        let matrix = new Matrix(container, 3, 4);
        let rowHeight = MatrixUtil.floatRound(height/3);
        let colWidth = MatrixUtil.floatRound(width/4);

        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1, rowHeight); // fixed height
        let node4 = new MatrixNode(matrix, "hello4", 2, 1, 1, 2);
        let node5 = new MatrixNode(matrix, "hello5", 2, 0, 1, 1, -1, colWidth); // fixed width
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1);

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        // matrix.printMatrix(null, true);
        // matrix.printMatrix(null, true, "width-height");
        // TODO: Write test cases to check for heights on adjustments and on creation

        expect(() => node.updateSize(60, false, true, BOTTOM)).to.throw(
            "Cannot resize a fixed row!"
        );

        expect(() => node2.updateSize(60, false, true, BOTTOM)).to.throw(
            "Cannot resize the row as its adjacent row is non resizeable!"
        );

        expect(() => node3.updateSize(60, false, true, BOTTOM)).to.throw(
            "Cannot resize a fixed row!"
        );

        expect(() => node4.updateSize(60, false, true, TOP)).to.throw(
            "Cannot resize the row as its adjacent row is non resizeable!"
        );

        expect(() => node5.updateSize(60, false, true, TOP)).to.throw(
            "Cannot resize the row as its adjacent row is non resizeable!"
        );

        // console.log("A-ROWS", matrix.rows);
        // console.log("A-COLUMNS", matrix.columns);
        // matrix.printMatrix(null, true, "width-height");
        // matrix.printMatrix(null, true);
        done();
    });
});

describe('Check resizing window & its effects on matrix & its nodes', function () {
    it('Check for resizing of non-fixed and fixed nodes', (done) => {
        let width = window.innerWidth;
        let height = window.innerHeight;

        let matrix = new Matrix(container, 3, 4);
        // console.log(width, height, matrix.rows, matrix.columns, matrix.width, matrix.height);
        let rowHeight = MatrixUtil.floatRound(height/3);
        let colWidth = MatrixUtil.floatRound(width/4);

        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1);
        // fixed height
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1, rowHeight);
        let node4 = new MatrixNode(matrix, "hello4", 2, 1, 1, 2);
        // fixed width
        let node5 = new MatrixNode(matrix, "hello5", 2, 0, 1, 1, -1, colWidth);
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1);

        matrix.addNode(node, true, true);
        matrix.addNode(node2, true, true);
        matrix.addNode(node3, true, true);
        matrix.addNode(node4, true, true);
        matrix.addNode(node5, true, true);
        matrix.addNode(node6, true, true);

        // console.log("A-ROWS", matrix.rows);
        // console.log("A-COLUMNS", matrix.columns);
        // matrix.printMatrix(null, true, "width-height");
        // matrix.printMatrix(null, true);

        node2.updateSize(60, true, true, RIGHT);
        // console.log("_______________________");
        // console.log(matrix.columns);
        // console.log(matrix.rows);

        window.resizeBy(20, 15);
        setTimeout(() => {
            try {
                let cs = getComputedStyle(container);
                // console.log("_______________________++++++");
                // console.log(matrix.columns);
                // console.log(matrix.rows);
                assert.equal(MatrixUtil.stripPx(cs.width), Math.round(matrix.columns.reduce((a, v) => a + v)));
                assert.equal(MatrixUtil.stripPx(cs.height), Math.round(matrix.rows.reduce((a, v) => a + v)));
                assert.equal(colWidth, matrix.matrix[2][0].width);
                assert.equal(rowHeight, matrix.matrix[1][2].height);

                done();
            } catch (error) {
                done(error);
            }
        }, 900);
    });
});

describe('Check resizing nodes beyond their adjacent dimensions', function () {
    it('Check for resizing height beyond adjacent node', (done) => {
        let width = window.innerWidth;
        let height = window.innerHeight;

        let matrix = new Matrix(container, 3, 4);
        let rowHeight = MatrixUtil.floatRound(height/3);
        let colWidth = MatrixUtil.floatRound(width/4);

        let node = new MatrixNode(matrix, "hello", 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 0, 2, 1, 1);
        // fixed height
        let node3 = new MatrixNode(matrix, "hello3", 1, 2, 1, 1, rowHeight);
        let node4 = new MatrixNode(matrix, "hello4", 2, 1, 1, 2);
        // fixed width
        let node5 = new MatrixNode(matrix, "hello5", 2, 0, 1, 1, -1, colWidth);
        let node6 = new MatrixNode(matrix, "hello6", 0, 3, 3, 1);

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        // matrix.printMatrix(null, true, "width-height");
        // matrix.printMatrix(null, true);

        node2.updateSize(60, true, true, RIGHT);
        window.resizeBy(20, 15);
        setTimeout(() => {
            try {
                let cs = getComputedStyle(container);
                assert.equal(MatrixUtil.stripPx(cs.width), Math.round(matrix.columns.reduce((a, v) => a + v)));
                assert.equal(MatrixUtil.stripPx(cs.height), Math.round(matrix.rows.reduce((a, v) => a + v)));
                assert.equal(colWidth, matrix.matrix[2][0].width);
                assert.equal(rowHeight, matrix.matrix[1][2].height);

                done();
            } catch (error) {
                console.error(error);
                // done(error);
            }
        }, 900);
    });
});