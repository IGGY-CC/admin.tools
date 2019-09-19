const { Grid, GridUtil } = require("../../../main/scripts/utils/util_grid");
const {assert, expect} = require('chai');

function deleteChild(element) {
    let child = element.lastElementChild;
    while (child) {
        deleteChild(child);
        console.log("removing child: ", child.id, "from", element.id);
        element.removeChild(child);
        child = element.lastElementChild;
    }
}

const root = document.querySelector("#grid-container");
const GRID_ID = "hello";
const grid = new Grid(root, GRID_ID);
//
// beforeEach(() => {
//
// });

describe('Check Grid defaults', function () {
    deleteChild(root);
    const mocha = UtilsUI.createNewElement('div', root, "mocha");
    mocha.style.width = "500px";

    let width = window.innerWidth;
    let height = window.innerHeight;

    it('check the defaults', (done) => {
        assert.equal(width, grid.width);
        assert.equal(height, grid.height);
        assert.equal("grid", grid.root.style.display);
        done();
    });
});

describe('Check Grid Element creation', function () {
    deleteChild(root);
    const mocha = UtilsUI.createNewElement('div', root, "mocha");
    mocha.style.width = "500px";

    it('check the new element at grid 0,0 spanning two rows and two columns', (done) => {
        grid.clear();
        const gridElement = grid.addElement(0, 0, 2, 2);
        assert.equal(GRID_ID + "-0-0", gridElement.id);
        assert.equal(gridElement, grid.elementMatrix[0][0]);
        assert.equal(gridElement, grid.elementMatrix[0][1]);
        assert.equal(gridElement, grid.elementMatrix[1][0]);
        assert.equal(gridElement, grid.elementMatrix[1][1]);
        assert.notEqual(gridElement, grid.elementMatrix[0][2]);
        done();
    });

    it('check creating new element at grid 3,3 to throw exception', (done) => {
        expect(() => grid.addElement(3, 0, 2, 2)).to.throw(
            "Failed adding element! RowStart is given as 3, but the current grid ends at row 2"
        );
        expect(() => grid.addElement(2, 3, 2, 2)).to.throw(
            "Failed adding element! ColumnStart is given as 3, but the current grid ends at column 2"
        );
        console.log(grid.elementMatrix);
        done();
    });

    it('check to add an element at location that already has another element', (done) => {
        expect(() => grid.addElement(0, 0, 2, 2)).to.throw(
            "Failed adding element! There already is an element present at 0, 0"
        );
        expect(() => grid.addElement(1, 1, 2, 2)).to.throw(
            "Failed adding element! There already is an element present at 1, 1"
        );
        done();
    });
});

describe('Check GridElement dimensional constraints', function () {
    deleteChild(root);
    const mocha = UtilsUI.createNewElement('div', root, "mocha");
    mocha.style.width = "500px";
    // create a default element
    grid.addElement(0, 0, 2, 2);

    it('check to add a fixedWidth and fixedHeight element before setting width or height', (done) => {
        const gridElement = grid.addElement(2, 0, 1, 2);
        gridElement.width = -1;
        expect(() => gridElement.setFixed(true, false)).to.throw(
            "Cannot mark the element as fixed width element, when there is no width set on it."
        );
        gridElement.height = -1;
        expect(() => gridElement.setFixed(false, true)).to.throw(
            "Cannot mark the element as fixed height element, when there is no height set on it."
        );
        done();
    });

    it('check to add width and height for an element', (done) => {
        const gridElement = grid.addElement(2, 2, 1, 1);
        gridElement.setDimensions(120, 50);
        assert.equal(120, gridElement.width);
        assert.equal(50, gridElement.height);
        done();
    });

    it('check to add width and height fixed width/height elements', (done) => {
        const gridElement = grid.addElement(0, 3, 1, 1);
        console.log(grid.elementMatrix);
        gridElement.setDimensions(120, 50).setFixed(true, true);
        expect(() => gridElement.setDimensions(500)).to.throw(
            "Cannot set width for a fixed width element!"
        );
        expect(() => gridElement.setDimensions(null, 500)).to.throw(
            "Cannot set height for a fixed height element!"
        );
        assert.equal(50, gridElement.height);
        done();
    });
});

describe('Check clear Grid', function () {
    deleteChild(root);
    const mocha = UtilsUI.createNewElement('div', root, "mocha");
    mocha.style.width = "500px";

    grid.clear();
    // create some elements
    grid.addElement(0, 0, 2, 2);
    grid.addElement(2, 0, 1, 2);
    grid.addElement(2, 2, 1, 1);
    grid.addElement(0, 3, 1, 1);

    it('grid.clear must clear all the children and their references created', (done) => {
        const gridElement = grid.elementMatrix[2][2];
        const element = gridElement.element;
        grid.clear();
        assert.equal(undefined, document.querySelector(element.id));
        assert.equal(0, grid.elements.length);
        assert.equal(0, grid.elementMatrix.length);
        done();
    });
});

describe('Check GridElement siblings: left-top-bottom-right', function () {
    deleteChild(root);
    const mocha = UtilsUI.createNewElement('div', root, "mocha");
    mocha.style.width = "500px";

    it('check the left-right-top-left siblings', (done) => {
        const gridElement = grid.addElement(0, 0, 3, 3);
        const gridElement2 = grid.addElement(3, 2, 3, 3);
        const gridElement3 = grid.addElement(3, 0, 2, 2);

        console.log(grid.elementMatrix);
        assert.isTrue(gridElement.leftSiblings.size === 0);
        assert.isTrue(gridElement.topSiblings.size === 0);
        assert.isTrue(gridElement.bottomSiblings.has(gridElement2));
        assert.isTrue(gridElement.bottomSiblings.has(gridElement3));
        assert.isTrue(gridElement.rightSiblings.size === 0);

        assert.isTrue(gridElement2.rightSiblings.size === 0);
        assert.isTrue(gridElement2.topSiblings.has(gridElement));
        assert.isTrue(gridElement2.leftSiblings.has(gridElement3));
        assert.isTrue(gridElement2.bottomSiblings.size === 0);

        assert.isTrue(gridElement3.topSiblings.has(gridElement));
        assert.isTrue(gridElement3.rightSiblings.has(gridElement2));
        assert.isTrue(gridElement3.bottomSiblings.size === 0);
        assert.isTrue(gridElement3.leftSiblings.size === 0);

        const gridElement4 = grid.elementMatrix[0][2];
        assert.equal(gridElement, gridElement4);

        const gridElement5 =  grid.addElement(0, 3, 2, 2);
        assert.notEqual(gridElement, gridElement5);
        assert.isTrue(gridElement.rightSiblings.has(gridElement5));
        assert.isTrue(gridElement2.topSiblings.has(gridElement));

        const gridElement6 =  grid.addElement(2, 4, 1, 1);
        assert.isTrue(gridElement5.bottomSiblings.has(gridElement6));
        assert.isTrue(gridElement2.topSiblings.has(gridElement6));
        assert.isTrue(gridElement6.topSiblings.has(gridElement5));
        assert.isTrue(gridElement6.bottomSiblings.has(gridElement2));
        assert.isTrue(gridElement6.leftSiblings.size === 0);
        assert.isTrue(gridElement6.rightSiblings.size === 0);

        const gridElement7 =  grid.addElement(2, 3, 1, 1);
        assert.isTrue(gridElement.rightSiblings.has(gridElement7));
        assert.isTrue(gridElement5.bottomSiblings.has(gridElement7));
        assert.isTrue(gridElement2.topSiblings.has(gridElement7));
        assert.isTrue(gridElement6.leftSiblings.has(gridElement7));

        assert.isTrue(gridElement7.topSiblings.has(gridElement5));
        assert.isTrue(gridElement7.bottomSiblings.has(gridElement2));
        assert.isTrue(gridElement7.leftSiblings.has(gridElement));
        assert.isTrue(gridElement7.rightSiblings.has(gridElement6));

        done();
    });

    it('Check for element dimensions of gridElement', (done) => {
        let gridElement = grid.elementMatrix[0][3];
        let width = window.innerWidth;

        // assert.equal((width*gridElement.columns/grid.numColumns) + "px", gridElement.element.style.width);
        gridElement.setDimensions(120, 50);
        assert.equal(gridElement.width + "px", gridElement.element.style.width);
        assert.equal("120px", gridElement.element.style.width);
        assert.equal(gridElement.height + "px", gridElement.element.style.height);
        assert.equal("50px", gridElement.element.style.height);
        done();
    });
});

describe.only('Check GridElement dimensions on addition of each element', function () {
    deleteChild(root);
    root.className = "mocha-overflow";
    const mocha = UtilsUI.createNewElement('div', root, "mocha");
    mocha.style.width = "500px";
    const width = window.innerWidth;
    const height = window.innerHeight;

    it('check the left-right-top-left siblings', (done) => {
        grid.clear();

        const gridElement = grid.addElement(0, 0, 3, 3);
        assert.equal(width + "px", gridElement.element.style.width);
        assert.equal(height + "px", gridElement.element.style.height);

        const gridElement2 = grid.addElement(3, 2, 3, 3);
        assert.equal(height/2 + "px", gridElement.element.style.height);
        assert.equal(width*3/5 + "px", gridElement.element.style.width);

        assert.equal(height/2 + "px", gridElement2.element.style.height);
        assert.equal(width*3/5 + "px", gridElement2.element.style.width);
        console.log(grid);
        //
        // const gridElement3 = grid.addElement(6, 0, 2, 6);
        // assert.equal(height*3/8 + "px", gridElement.element.style.height);
        // assert.equal(width/2 + "px", gridElement.element.style.width);
        //
        // assert.equal(height*3/8 + "px", gridElement2.element.style.height);
        // assert.equal(width/2 + "px", gridElement2.element.style.width);
        //
        // assert.equal(GridUtil.floatRound(height*2/8, 3) + "px", gridElement3.element.style.height);
        // assert.equal(width + "px", gridElement3.element.style.width);

        done();
    });

});