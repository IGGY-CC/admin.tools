const { Matrix, MatrixNode, MatrixUtil } = require("../../../main/scripts/utils/util_matrix");
const {assert, expect} = require('chai');

const container = document.querySelector("#grid-container");

describe('Check Matrix defaults', function () {
    it('check the defaults', (done) => {
        let matrix = new Matrix(container, 3, 3, window.innerWidth, window.innerHeight);
        assert.equal(3, matrix.matrix[0].length);
        assert.equal(3, matrix.matrix.length);

        assert.isFalse(matrix.matrix[0][0]);
        assert.isFalse(matrix.matrix[1][1]);
        assert.isFalse(matrix.matrix[2][2]);
        done();
    });

    it('fill matrix with empty objects', (done) => {
        let matrix = new Matrix(container, 3, 3, 500, 500);
        matrix.fillMatrix(matrix.matrix, 1, 2, 1, 1, true);
        matrix.printMatrix(null, true);
        assert.equal(true, matrix.matrix[1][1]);
        assert.isFalse(matrix.matrix[0][0]);
        assert.isFalse(matrix.matrix[1][0]);
        assert.isFalse(matrix.matrix[0][1]);
        assert.isTrue(matrix.matrix[2][1]);
        assert.isFalse(matrix.matrix[2][2]);
        done();
    });
});

describe('Check Node creation', function () {
    it('check the node creation and addition to matrix', (done) => {
        let matrix = new Matrix(container, 3, 3, 800, 600);
        let node = new MatrixNode(matrix, "hello", 100, 200, false, false, 0, 0, 2, 2);
        expect(() => matrix.addNode(node, true, true)).to.throw(
            "Cannot add node as its dimensions do not fall under the required boundaries."
        );

        let node2 = new MatrixNode(matrix, "hello", MatrixUtil.floatRound(800 * 2 / 3), 400, false, false, 0, 0, 2, 2);
        assert.doesNotThrow(() => matrix.addNode(node2, true, true));

        let node3 = new MatrixNode(matrix, "hello", 300, 400, false, false, 1, 1, 3, 2);
        expect(() => matrix.addNode(node3)).to.throw(
            "The passed in nodes's suggested location is out of bounds for this grid!"
        );

        let node4 = new MatrixNode(matrix, "hello", 300, 400, false, false, 1, 1, 2, 2);
        expect(() => matrix.addNode(node4, true, true)).to.throw(
            "There already exists an element at the suggested location! [1, 1]."
        );

        let node5 = new MatrixNode(matrix, "world", 100, 100, false, false, 2, 2, 1, 1);
        assert.doesNotThrow(() => matrix.addNode(node5, true, false));

        done();
    });
});

describe('Check Nodes with fixed dimensions', function () {
    it('check the node addition to matrix -- exceptions', (done) => {
        let matrix = new Matrix(container, 4, 4, 800, 600);

        // TODO: Fixed width nodes spanning multiple rows/columns test cases
        // let node = new MatrixNode(matrix, "hello", 100, 200, true, false, 0, 0, 2, 2);
        // expect(() => matrix.addNode(node)).to.throw(
        //     "Fixed width nodes spanning multiple columns is not supported yet!"
        // );
        //
        // let node2 = new MatrixNode(matrix, "hello2", 100, 200, false, true, 0, 0, 2, 2);
        // expect(() => matrix.addNode(node2)).to.throw(
        //     "Fixed height nodes spanning multiple rows is not supported yet!"
        // );
        done();
    });

    it('check the node addition with fixed width/height to matrix', (done) => {
        let matrix = new Matrix(container, 4, 4, 800, 600);
        let node3 = new MatrixNode(matrix, "hello3", 100, 200, false, false, 0, 0, 2, 2);
        let node4 = new MatrixNode(matrix, "hello4", 100, 200, true, false, 2, 0, 2, 1);
        let node5 = new MatrixNode(matrix, "hello5", 100, 200, false, true, 0, 2, 1, 2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        console.log(matrix.columns);
        console.log(matrix.columnTypes);
        assert.equal(matrix.columns[0], 100);
        assert.equal(matrix.rows[0], 200);
        done();
    });
});

describe('Check the dimensions of Node and Matrix', function () {
    it('check the dimensions of nodes', (done) => {
        let matrix = new Matrix(container, 3, 4, 800, 600);
        let node = new MatrixNode(matrix, "hello", 400, 400, false, false, 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 200, 200, false, false, 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 200, 200, false, false, 1, 2, 1, 1);
        let node4 = new MatrixNode(matrix, "hello4", 200, 200, false, false, 2, 0, 1, 1);
        let node5 = new MatrixNode(matrix, "hello5", 400, 200, false, false, 2, 1, 1, 2);
        let node6 = new MatrixNode(matrix, "hello6", 200, 600, false, false, 0, 3, 3, 1);

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

        assert.deepEqual([200, 200, 200, 200], matrix.columns);
        assert.deepEqual(["auto", "auto", "auto", "auto"], matrix.columnTypes);
        assert.deepEqual([200, 200, 200], matrix.rows);
        assert.deepEqual(["auto", "auto", "auto"], matrix.rowTypes);

        matrix.printMatrix(null, true);
        done();
    });

    it('check the dimensions of nodes with fixed constraints', (done) => {
        let matrix = new Matrix(container, 3, 4, 800, 600);
        let node = new MatrixNode(matrix, "hello", 400, 400, false, false, 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 200, 200, true, false, 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 200, 200, false, false, 1, 2, 1, 1); // doesn't work
        let node4 = new MatrixNode(matrix, "hello3", 200, 200, true, false, 1, 2, 1, 1); // node3 with fix as node4
        let node5 = new MatrixNode(matrix, "hello5", 400, 200, false, false, 2, 1, 1, 2); // doesn't work
        let node6 = new MatrixNode(matrix, "hello5", 400, 200, true, true, 2, 1, 1, 2); // node5 with fix as node6
        let node7 = new MatrixNode(matrix, "hello4", 200, 200, false, false, 2, 0, 1, 1); // doesn't work
        let node8 = new MatrixNode(matrix, "hello4", 200, 200, false, true, 2, 0, 1, 1); // node7 with fix as node8
        let node9 = new MatrixNode(matrix, "hello6", 200, 600, false, false, 0, 3, 3, 1); // doesn't work
        let node10 = new MatrixNode(matrix, "hello6", 200, 600, false, true, 0, 3, 3, 1); // node9 with fix as node10

        /**
         ** FINAL LAYOUT
         **
         ** hello  hello  hello2 hello6
         ** hello  hello  hello3 hello6
         ** hello4 hello5 hello5 hello6
         **/

        matrix.addNode(node);
        matrix.addNode(node2); // marked as fixed width
        // node3 not marked as fixed width should throw error
        expect(() => matrix.addNode(node3)).to.throw(
            "Cannot create non-fixed-width node with width 200 when there is already a fixed " +
            "width node defined in this column with size: 200"
        );
        // node 4 marked as fixed width should pass
        assert.doesNotThrow(() => matrix.addNode(node4));

        expect(() => matrix.addNode(node5)).to.throw(
            "Cannot create non-fixed-width node with width 400 when there is already a fixed " +
            "width node defined in this column with size: 200"
        );
        assert.doesNotThrow(() => matrix.addNode(node6));

        expect(() => matrix.addNode(node7)).to.throw(
            "Cannot create non-fixed-height node with height 200 when there is already a fixed " +
            "height node defined in this row with size: 200"
        );
        assert.doesNotThrow(() => matrix.addNode(node8));

        expect(() => matrix.addNode(node9)).to.throw(
            "Cannot create non-fixed-height node with height 600 when there is already a fixed " +
            "height node defined in this row with size: 200"
        );
        assert.doesNotThrow(() => matrix.addNode(node10));

        console.log("ROW TYPES: ", matrix.rowTypes);
        console.log("ROW TYPES: ", matrix.columnTypes);
        assert.deepEqual([200, 200, 200, 200], matrix.columns);
        assert.deepEqual(["auto", "auto", "fixed", "auto"], matrix.columnTypes);
        assert.deepEqual([200, 200, 200], matrix.rows);
        assert.deepEqual(["auto", "auto", "fixed"], matrix.rowTypes);

        matrix.printMatrix(null, true);
        matrix.printMatrix(null, true, "width-height");
        done();
    });
});

describe('Check resizing a non-fixed node within the matrix', function () {

        let matrix = new Matrix(container, 3, 4, 800, 600);
        let node = new MatrixNode(matrix, "hello", 400, 400, false, false, 0, 0, 2, 2);
        let node2 = new MatrixNode(matrix, "hello2", 200, 200, false, false, 0, 2, 1, 1);
        let node3 = new MatrixNode(matrix, "hello3", 200, 200, false, false, 1, 2, 1, 1);
        let node4 = new MatrixNode(matrix, "hello4", 400, 200, false, false, 2, 1, 1, 2);
        let node5 = new MatrixNode(matrix, "hello5", 200, 200, false, false, 2, 0, 1, 1);
        let node6 = new MatrixNode(matrix, "hello6", 200, 600, false, false, 0, 3, 3, 1);

        matrix.addNode(node);
        matrix.addNode(node2);
        matrix.addNode(node3);
        matrix.addNode(node4);
        matrix.addNode(node5);
        matrix.addNode(node6);

    it('Check for resizing width', (done) => {
        node2.updateSize(20, true, true, LEFT);
        assert.equal(380, node.width);
        assert.equal(220, node2.width);
        assert.equal(220, node3.width);
        assert.equal(400, node4.width); // no change
        assert.equal(200, node5.width); // no change
        assert.equal(200, node6.width); // no change

        node2.updateSize(60, true, true, RIGHT);
        assert.equal(380, node.width);
        assert.equal(280, node2.width);
        assert.equal(280, node3.width);
        assert.equal(460, node4.width); // no change
        assert.equal(200, node5.width); // no change
        assert.equal(140, node6.width); // no change

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
        matrix.printMatrix(null, true);
        matrix.printMatrix(null, true, "width-height");

        node2.updateSize(60, false, true, BOTTOM);
        assert.equal(400, node.height);
        assert.equal(260, node2.height);
        assert.equal(140, node3.height);
        assert.equal(200, node4.height); // no change
        assert.equal(200, node5.height); // no change
        assert.equal(600, node6.height); // no change

        node3.updateSize(100, false, true, TOP);
        assert.equal(400, node.height);
        assert.equal(160, node2.height);
        assert.equal(240, node3.height);
        assert.equal(200, node4.height); // no change
        assert.equal(200, node5.height); // no change
        assert.equal(600, node6.height); // no change

        node3.updateSize(100, false, true, BOTTOM);
        assert.equal(500, node.height);
        assert.equal(160, node2.height);
        assert.equal(340, node3.height);
        assert.equal(100, node4.height); // no change
        assert.equal(100, node5.height); // no change
        assert.equal(600, node6.height); // no change

        expect(() => node.updateSize(60, false, true, TOP)).to.throw(
            "Cannot resize edges of the matrix!"
        );
        expect(() => node6.updateSize(60, false, true, BOTTOM)).to.throw(
            "Cannot resize edges of the matrix!"
        );

        console.log("A-ROWS", matrix.rows);
        matrix.printMatrix(null, true, "width-height");
        matrix.printMatrix(null, true);

        done();
    });
});

describe('Check resizing a fixed node within the matrix', function () {

    let matrix = new Matrix(container, 3, 4, 800, 600);
    let node = new MatrixNode(matrix, "hello", 400, 400, false, false, 0, 0, 2, 2);
    let node2 = new MatrixNode(matrix, "hello2", 200, 200, false, false, 0, 2, 1, 1);
    let node3 = new MatrixNode(matrix, "hello3", 200, 200, false, true, 1, 2, 1, 1);
    let node4 = new MatrixNode(matrix, "hello4", 400, 200, false, false, 2, 1, 1, 2);
    let node5 = new MatrixNode(matrix, "hello5", 200, 200, true, false, 2, 0, 1, 1); // fixed width
    let node6 = new MatrixNode(matrix, "hello6", 200, 600, false, true, 0, 3, 3, 1);

    matrix.addNode(node);
    matrix.addNode(node2);
    matrix.addNode(node3);
    matrix.addNode(node4);
    matrix.addNode(node5);
    matrix.addNode(node6);

    it('Check for resizing width of fixed node', (done) => {
        node2.updateSize(20, true, true, LEFT);
        assert.equal(380, node.width);
        assert.equal(220, node2.width);
        assert.equal(220, node3.width);
        assert.equal(400, node4.width); // no change
        assert.equal(200, node5.width); // no change
        assert.equal(200, node6.width); // no change

        node2.updateSize(60, true, true, RIGHT);
        assert.equal(380, node.width);
        assert.equal(280, node2.width);
        assert.equal(280, node3.width);
        assert.equal(460, node4.width); // no change
        assert.equal(200, node5.width); // no change
        assert.equal(140, node6.width); // no change

        expect(() => node.updateSize(60, true, true, LEFT)).to.throw(
            "Cannot resize edges of the matrix!"
        );
        expect(() => node5.updateSize(60, true, true, RIGHT)).to.throw(
            "Cannot resize a fixed column!"
        );
        assert.doesNotThrow(() => node.updateSize(60, true, true, RIGHT));
        expect(() => node4.updateSize(60, true, true, LEFT)).to.throw(
            "Cannot resize the column as its adjacent column is non resizeable!"
        );
        done();
    });

    it('Check for resizing height of fixed node', (done) => {
        // matrix.printMatrix(null, true);
        // matrix.printMatrix(null, true, "width-height");

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
        console.log("A-ROWS", matrix.rows);
        console.log("A-ROWS", matrix.columns);
        matrix.printMatrix(null, true, "width-height");
        matrix.printMatrix(null, true);

        done();
    });
});