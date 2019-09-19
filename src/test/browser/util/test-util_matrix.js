const { Matrix, MatrixNode, MatrixUtil } = require("../../../main/scripts/utils/util_matrix");
const {assert, expect} = require('chai');

const container = document.querySelector("#grid-container");

describe('Check Matrix defaults', function () {
    it('check the defaults', (done) => {
        let matrix = new Matrix(container, 3, 3);
        assert.equal(3, matrix.matrix[0].length);
        assert.equal(3, matrix.matrix.length);

        assert.isFalse(matrix.matrix[0][0]);
        assert.isFalse(matrix.matrix[1][1]);
        assert.isFalse(matrix.matrix[2][2]);
        done();
    });

    it('fill matrix with empty objects', (done) => {
        let matrix = new Matrix(container, 3, 3);
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

describe('Check Matrix defaults', function () {
    it('check the defaults', (done) => {
        let matrix = new Matrix(container, 3, 3);
        let node = new MatrixNode("hello", 100, 200, false, false, 0, 0, 2, 2);
        matrix.addNode(node);
        assert.equal(node, matrix.matrix[0][0]);
        assert.equal(node, matrix.matrix[0][1]);
        assert.equal(node, matrix.matrix[1][0]);
        assert.equal(node, matrix.matrix[1][1]);
        assert.equal(false, matrix.matrix[2][0]);
        assert.equal(false, matrix.matrix[2][1]);
        assert.equal(false, matrix.matrix[2][2]);
        matrix.printMatrix(null, true);
        done();
    });
});