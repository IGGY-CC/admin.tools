const CSSGrid = require("../main/scripts/utils/util_css_grid_manager");
const { assert } = require('chai');

describe('Grid', () => {
    it('shows an initial window', function () {
        return this.app.client.getWindowCount().then(function (count) {
            assert.equal(count, 1);
            // Please note that getWindowCount() will return 2 if `dev tools` are opened.
            // assert.equal(count, 2)
        })
    });

    it('opens a window', function () {
        return this.app.client.waitUntilWindowLoaded()
            .getWindowCount().should.eventually.have.at.least(1)
            .browserWindow.isMinimized().should.eventually.be.false
            .browserWindow.isVisible().should.eventually.be.true
            .browserWindow.isFocused().should.eventually.be.true
            .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
            .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
    });

    it("Should add and setup root element", function () {
        const root = new CSSGrid(this.app.client.element("#grid-container"));
        console.log(root.width);
        assert.notEqual(root.width, 0);
        assert.notEqual(root.height, 0);
    });
});

// mocha.run();