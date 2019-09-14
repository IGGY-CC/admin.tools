const { CSSGrid, CSSNode } = require("../../main/scripts/utils/util_css_grid_manager");
const {assert} = require('chai');

describe('Check CSS Grid functionality', function () {
    const root = new CSSGrid(document.querySelector("#grid-container"));

    it('check the dimensions', (done) => {
        assert.notEqual(0, root.width);
        assert.notEqual(0, root.height);
        done();
    });

    it('total rows equals total width', (done) => {
        let size = root.gridColumns.reduce((a, b) => a + b, 0);
        assert.equal(root.width, Math.ceil(size));
        assert.equal(root.width, Math.ceil(root.gridColumnSize));
        done();
    });

    it('total rows equals total height', (done) => {
        let size = root.gridRows.reduce((a, b) => a + b, 0);
        assert.equal(root.height, Math.ceil(size));
        assert.equal(root.height, Math.ceil(root.gridRowSize));
        done();
    });

    it('total matrix size should be 30', (done) => {
        let size = root.grid.reduce((length, row) => length + row.length, 0);
        assert.equal(root.gridRows.length * root.gridColumns.length, size);
        assert.equal(30, size);
        done();
    });

    it('gridUnique must have 1, 1, 5, 5, 5, 1 elements in that order', (done) => {
        let expectedValues = [1, 1, 5, 5, 5, 1];
        let i = 0;
        root.gridUnique.forEach(unqArray => {
            assert.equal(expectedValues[i++], unqArray.length);
        });
        done();
    });
});

describe('Check CSSNode functionality', function () {
    let root = new CSSNode(document.querySelector("#tool-bar"));

    it('check the dimensions', (done) => {
        assert.notEqual(0, root.width);
        assert.notEqual(0, root.height);
        done();
    });

    it('isFixedWidth must be true', (done) => {
        assert(root.isFixedWidth);
        done();
    });

    it('isFixedHeight must be false', (done) => {
        assert(!root.isFixedHeight);
        done();
    });

    it('maxHeight must be max safe int', (done) => {
       assert.equal(Number.MAX_SAFE_INTEGER, root.maxHeight);
       done();
    });

    it('minWidth must not be zero', (done) => {
        assert.notEqual(0, root.minWidth);
        done();
    });

    it('minHeight must be zero', (done) => {
        assert.equal(0, root.minHeight);
        done();
    });
});

describe('Check CSSNode Siblings', function () {
    const root = new CSSGrid(document.querySelector("#grid-container"));

    /**
     * 0: (5) ["title-bar", "title-bar", "title-bar", "title-bar", "title-bar"]
     * 1: (5) ["menu-bar", "menu-bar", "menu-bar", "menu-bar", "menu-bar"]
     * 2: (5) ["tool-bar", "toolbar-tab-content", "main-content", "right-tab-content", "right-tab-bar"]
     * 3: (5) ["tool-bar", "toolbar-tab-content", "bottom-tab-content", "right-tab-content", "right-tab-bar"]
     * 4: (5) ["tool-bar", "toolbar-tab-content", "bottom-tab-bar", "right-tab-content", "right-tab-bar"]
     * 5: (5) ["status-bar", "status-bar", "status-bar", "status-bar", "status-bar"]
     */
    it('left siblings of #tool-bar must be none', (done) => {
        let element = "tool-bar";
        let node = root.childrenMap.get(element);

        assert.equal(0, node.widthAffectedLeftSiblings.length);
        done();
    });

    it('right siblings of #tool-bar must be one and #toobar-tab-content', (done) => {
        let element = "tool-bar";
        let node = root.childrenMap.get(element);

        assert.equal(1, node.widthAffectedRightSiblings.length);
        assert.equal('toolbar-tab-content', node.widthAffectedRightSiblings[0].element.id);
        done();
    });

    it('left, top and right siblings of #title-bar must be none', (done) => {
        let element = "title-bar";
        let node = root.childrenMap.get(element);

        assert.equal(0, node.widthAffectedLeftSiblings.length);
        assert.equal(0, node.heightAffectedTopSiblings.length);
        assert.equal(0, node.widthAffectedRightSiblings.length);
        done();
    });

    it('bottom siblings of #title-bar must be one and #menu-bar', (done) => {
        let element = "title-bar";
        let node = root.childrenMap.get(element);

        assert.equal(1, node.heightAffectedBottomSiblings.length);
        assert.equal('menu-bar', node.heightAffectedBottomSiblings[0].element.id);
        done();
    });

    it('left, top and bottom siblings of #toolbar-tab-content must be one and should be #tool-bar #menu-bar and #status-bar', (done) => {
        let element = "toolbar-tab-content";
        let node = root.childrenMap.get(element);

        assert.equal(1, node.heightAffectedTopSiblings.length);
        assert.equal('menu-bar', node.heightAffectedTopSiblings[0].element.id);

        assert.equal(1, node.heightAffectedBottomSiblings.length);
        assert.equal('status-bar', node.heightAffectedBottomSiblings[0].element.id);

        assert.equal(1, node.widthAffectedLeftSiblings.length);
        assert.equal('tool-bar', node.widthAffectedLeftSiblings[0].element.id);
        done();
    });

    it('right siblings of #toolbar-tab-content must be three and should be #main-content #bottom-tab-content and #bottom-tab-bar', (done) => {
        let element = "toolbar-tab-content";
        let node = root.childrenMap.get(element);

        assert.equal(3, node.widthAffectedRightSiblings.length);
        assert.equal('main-content', node.widthAffectedRightSiblings[0].element.id);
        assert.equal('bottom-tab-content', node.widthAffectedRightSiblings[1].element.id);
        assert.equal('bottom-tab-bar', node.widthAffectedRightSiblings[2].element.id);
        done();
    });

    it('top, right and bottom siblings of #right-tab-content must be one and should be #menu-bar #right-tab-bar and #status-bar', (done) => {
        let element = "right-tab-content";
        let node = root.childrenMap.get(element);

        assert.equal(1, node.heightAffectedTopSiblings.length);
        assert.equal('menu-bar', node.heightAffectedTopSiblings[0].element.id);

        assert.equal(1, node.widthAffectedRightSiblings.length);
        assert.equal('right-tab-bar', node.widthAffectedRightSiblings[0].element.id);

        assert.equal(1, node.heightAffectedBottomSiblings.length);
        assert.equal('status-bar', node.heightAffectedBottomSiblings[0].element.id);
        done();
    });

    it('left siblings of #right-tab-content must be three and should be #main-content #bottom-tab-content and #bottom-tab-bar', (done) => {
        let element = "right-tab-content";
        let node = root.childrenMap.get(element);

        assert.equal(3, node.widthAffectedLeftSiblings.length);
        assert.equal('main-content', node.widthAffectedLeftSiblings[0].element.id);
        assert.equal('bottom-tab-content', node.widthAffectedLeftSiblings[1].element.id);
        assert.equal('bottom-tab-bar', node.widthAffectedLeftSiblings[2].element.id);
        done();
    });

    it('left and right siblings of #menu-bar must be none', (done) => {
        let element = "menu-bar";
        let node = root.childrenMap.get(element);

        assert.equal(0, node.widthAffectedLeftSiblings.length);
        assert.equal(0, node.widthAffectedRightSiblings.length);
        done();
    });

    it('top siblings of #menu-bar must be one and should be #title-bar', (done) => {
        let element = "menu-bar";
        let node = root.childrenMap.get(element);

        assert.equal(1, node.heightAffectedTopSiblings.length);
        assert.equal('title-bar', node.heightAffectedTopSiblings[0].element.id);
        done();
    });

    it('bottom siblings of #menu-bar must be five and should be #tool-bar #toolbar-tab-content #main-content, #right-tab-content and #right-tab-bar', (done) => {
        let element = "menu-bar";
        let node = root.childrenMap.get(element);

        assert.equal(5, node.heightAffectedBottomSiblings.length);
        assert.equal('tool-bar', node.heightAffectedBottomSiblings[0].element.id);
        assert.equal('toolbar-tab-content', node.heightAffectedBottomSiblings[1].element.id);
        assert.equal('main-content', node.heightAffectedBottomSiblings[2].element.id);
        assert.equal('right-tab-content', node.heightAffectedBottomSiblings[3].element.id);
        assert.equal('right-tab-bar', node.heightAffectedBottomSiblings[4].element.id);

        done();
    });

    it('left, bottom and right siblings of #status-bar must be none', (done) => {
        let element = "status-bar";
        let node = root.childrenMap.get(element);

        assert.equal(0, node.widthAffectedLeftSiblings.length);
        assert.equal(0, node.widthAffectedRightSiblings.length);
        assert.equal(0, node.heightAffectedBottomSiblings.length);
        done();
    });

    it('top siblings of #status-bar must be five and should be #tool-bar #toolbar-tab-content #bottom-tab-bar, #right-tab-content and #right-tab-bar', (done) => {
        let element = "status-bar";
        let node = root.childrenMap.get(element);

        assert.equal(5, node.heightAffectedTopSiblings.length);
        assert.equal('tool-bar', node.heightAffectedTopSiblings[0].element.id);
        assert.equal('toolbar-tab-content', node.heightAffectedTopSiblings[1].element.id);
        assert.equal('bottom-tab-bar', node.heightAffectedTopSiblings[2].element.id);
        assert.equal('right-tab-content', node.heightAffectedTopSiblings[3].element.id);
        assert.equal('right-tab-bar', node.heightAffectedTopSiblings[4].element.id);

        done();
    });

});

describe('Check Size Changes on node and its effects on Siblings', function () {
    const root = new CSSGrid(document.querySelector("#grid-container"));

    /**
     * 0: (5) ["title-bar", "title-bar", "title-bar", "title-bar", "title-bar"]
     * 1: (5) ["menu-bar", "menu-bar", "menu-bar", "menu-bar", "menu-bar"]
     * 2: (5) ["tool-bar", "toolbar-tab-content", "main-content", "right-tab-content", "right-tab-bar"]
     * 3: (5) ["tool-bar", "toolbar-tab-content", "bottom-tab-content", "right-tab-content", "right-tab-bar"]
     * 4: (5) ["tool-bar", "toolbar-tab-content", "bottom-tab-bar", "right-tab-content", "right-tab-bar"]
     * 5: (5) ["status-bar", "status-bar", "status-bar", "status-bar", "status-bar"]
     */
    it('Size change on toolbar-tab-content, leftHandle should remain unchanged', (done) => {
        let element = "toolbar-tab-content";
        let node = root.childrenMap.get(element);
        let currentWidth = node.width;

        node.adjustSizeBy(150, true, true);

        assert.equal(currentWidth, node.width);
        done();
    });

    it('Size change on toolbar-tab-content, rightHandle should change sizes of main-content, bottom-tab-content & bottom-tab-bar', (done) => {
        // this.skip();
        let element = "toolbar-tab-content";
        let node = root.childrenMap.get(element);

        console.log(node);
        /**
         * element: div#toolbar-tab-content.resize-container.vertical-right
         * gridColIndex: -1
         * gridRowIndex: -1
         * height: 328
         * heightAffectedBottomSiblings: [CSSNode]
         * heightAffectedTopSiblings: [CSSNode]
         * index: 0
         * isFixedHeight: false
         * isFixedWidth: false
         * maxHeight: 9007199254740991
         * maxWidth: 9007199254740991
         * minHeight: 0
         * minWidth: 0
         * width: 376.656
         * widthAffectedLeftSiblings: [CSSNode]
         * widthAffectedRightSiblings: (3) [CSSNode, CSSNode, CSSNode]
         */
        let mainContentNode = root.childrenMap.get("main-content");
        let bottomTabContentNode = root.childrenMap.get("bottom-tab-content");
        let bottomTabBarNode = root.childrenMap.get("bottom-tab-bar");

        let currentWidth = node.width;
        let mainContentWidth = mainContentNode.width;
        let bottomTabContentWidth = bottomTabContentNode.width;
        let bottomTabBarWidth = bottomTabBarNode.width;

        node.adjustSizeBy(150, true, false);
        assert.equal(currentWidth + 150, node.width);
        assert.equal(mainContentWidth - 150, mainContentNode.width);
        assert.equal(bottomTabContentWidth - 150, bottomTabContentNode.width);
        assert.equal(bottomTabBarWidth - 150, bottomTabBarNode.width);
        console.log(root.childrenMap);
        done();
    });
});