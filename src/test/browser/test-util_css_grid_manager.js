const CSSGrid = require("../../main/scripts/utils/util_css_grid_manager");
const {assert} = require('chai');

describe('Check for CSS Grid', function () {
    const root = new CSSGrid(document.querySelector("#grid-container"));
    it('check the dimensions', () => {
        // console.log(root.width, root.height);
        assert.notEqual(root.width, 0);
        assert.notEqual(root.height, 0);
        return Promise.resolve();
    });

    it('total rows equals total width', () => {
        let size = root.gridColumns.reduce((a, b) => a + b.value, 0);
        assert.equal(parseInt(root.width), Math.ceil(size));
        assert.equal(parseInt(root.width), Math.ceil(root.gridColumnSize));
        return Promise.resolve();
    });

    it('total rows equals total height', () => {
        let size = root.gridRows.reduce((a, b) => a + b.value, 0);
        assert.equal(parseInt(root.height), Math.ceil(size));
        assert.equal(parseInt(root.height), Math.ceil(root.gridRowSize));
        return Promise.resolve();
    });
});