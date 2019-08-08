// SOURCE FILE: admin.tools/src/main/scripts/terminal-manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

'use strict';

let admin = require("./terminal");
let grid = require("./grid-element");
let JSGridManager_ = require("./grid-manager");

/**
 * @fileoverview Declares the control.* namespace.
 */
let control = {};
const LEFT = 1;
const RIGHT = 2;
const TOP = 4;
const BOTTOM = 8;
const GUTTER = 16;
const TERMBLK = 32;


control.TerminalManager = function (parentID) {

    this.parent = document.querySelector(parentID);
    this.terminals = new Map();

    // setup dimensional variables
    this.width = 0;
    this.height = 0;
    this.gridRows = 100;
    this.gridCols = 100;
    this.rowHeight = 0;
    this.colWidth = 0;

    // initiate dimensions
    this.calculateDimensions();

    this.totalTerminals = 0;
    this.gridElementsConfig = {};
    this.gridElements = {};
    this.totalGutterElements = 0;
    this.mouseEnteredGutters = [];
    // extract sibling elements from gutter
    this.gutterElements = {};
    // extract sibling gutters from element
    this.elementGutters = {};

    // the newly created grid manager. Will change on every invocation of split* calls
    this.cssGridManager = null;

    // create the jsGridManager which will manage all the created elements
    this.jsGridManager = new JSGridManager_(this.rowHeight, this.colWidth, this.width, this.height);

    // window.onresize = this.resizeCallback.bind(this);
    resizeManager.onResize(this.resizeCallback.bind(this));
    this.createCSSGridManager();
    this.createFirstTerminal();
};

control.TerminalManager.prototype.calculateDimensions = function() {
    this.width = this.parent.clientWidth;
    this.height = this.parent.clientHeight;
    this.colWidth = this.width / this.gridCols;
    this.rowHeight = this.height / this.gridRows;
};

control.TerminalManager.prototype.checkTerminal = function (name) {
    if (this.terminals.get(name) !== undefined) {
        throw console.error("A terminal with given name already exists!");
    }
    return true;
};

control.TerminalManager.prototype.createCSSGridManager = function () {
    this.totalTerminals++;
    this.cssGridManager = document.createElement("div");
    // TODO: The last grid row/col height/width should be the difference left out converting float to int.

    console.log("TOTAL WIDTH AND HEIGHT: ", this.colWidth, this.rowHeight);
    this.cssGridManager.style.display = "grid";
    this.cssGridManager.style["box-sizing"] = "border-box";
    this.cssGridManager.id = "terminal-grid";
    this.cssGridManager.style.width = "100%";
    this.cssGridManager.style.height = "100%";
    this.cssGridManager.style["grid-template-rows"] = "repeat(" + this.gridRows + ", fit-content(" + this.rowHeight + "px))";
    this.cssGridManager.style["grid-template-columns"] = "repeat(" + this.gridCols + ", fit-content(" + this.colWidth + "px))";
    this.parent.appendChild(this.cssGridManager);
};

control.TerminalManager.prototype.resizeCallback = function () {
    // console.log("Window resized.");
    let origWidth = this.width;
    let origHeight = this.height;
    this.width = this.parent.clientWidth;
    this.height = this.parent.clientHeight;

    this.colWidth = this.width / this.gridCols;
    this.rowHeight = this.height / this.gridRows;

    this.cssGridManager = document.querySelector("#terminal-grid");
    this.cssGridManager.style.width = this.width + "px";
    this.cssGridManager.style.height = this.height + "px";
    this.cssGridManager.style["grid-template-rows"] = "repeat(" + this.gridRows + ", fit-content(" + this.rowHeight + "px))";
    this.cssGridManager.style["grid-template-columns"] = "repeat(" + this.gridCols + ", fit-content(" + this.colWidth + "px))";

    let widthRatio = this.width / origWidth;
    let heightRatio = this.height / origHeight;
    this.jsGridManager.resize(this.rowHeight, this.colWidth, widthRatio, heightRatio);

    // this.cssGridManager.style["grid-gap"] = "2px";
    //
    // if(this.totalTerminals === 1) {
    //     // this is the only element/terminal in the dashboard
    //     let element = document.querySelector("#terminal");
    //
    //     // update the element's dimensions
    //     element.style.width = this.width + "px";
    //     element.style.height = this.height + "px";
    //
    //     // update the config array so that if new element is created, it uses the correct values
    //     this.gridElementsConfig[element.id].width = this.width;
    //     this.gridElementsConfig[element.id].height = this.height;
    // } else {
    //     // there are multiple elements in the dashboard, update each element with new widths and heights
    //     for (let index = 0; index < this.totalTerminals; index++) {
    //         let appender = (index === 0) ? "" : index + 1;
    //         let widthRatio = this.width / origWidth;
    //         let heightRatio = this.height / origHeight;
    //         let element = document.querySelector("#terminal" + appender);
    //         let newWidth = parseFloat(element.style.width) * widthRatio;
    //         let newHeight = parseFloat(element.style.height) * heightRatio;
    //
    //         // update the element's dimensions
    //         element.style.width =  newWidth + "px";
    //         element.style.height = newHeight  + "px";
    //
    //         // update the config array so that if new element is created, it uses the correct values
    //         this.gridElementsConfig[element.id].width = newWidth;
    //         this.gridElementsConfig[element.id].height = newHeight;
    //     }
    // }

    return true;
};


control.TerminalManager.prototype.createFirstTerminal = function () {
    /* create element to hold terminal */
    let name = "terminal";

    // using grid-element
    let newTerminalElement = grid.Element.init(name, this.jsGridManager);
    newTerminalElement.addToGrid(this.cssGridManager);
    newTerminalElement.setArea(1, this.gridRows, 1, this.gridCols);
    newTerminalElement.setupParentElement(this.cssGridManager);

    // old code
    {
        let terminalElem = newTerminalElement.element;
        this.gridElements[name] = terminalElem;
        this.gridElementsConfig[name] = this.makeGridElementMap(this.width, this.height, 1, this.gridRows, 1, this.gridCols);

        // setup element gutters
        this.makeGutterMap(name, terminalElem, GUTTER);
        this.makeGutterMap(name, terminalElem, TERMBLK);
    }
    /* create terminal */
    // this.createTerminal("terminal", "#terminal");
};

control.TerminalManager.prototype.makeGridElementMap = function (width, height, rowStart, rowEnd, colStart, colEnd) {
    return {
        width: width,
        height: height,
        rowStart: Math.round(rowStart),
        rowEnd: Math.round(rowEnd),
        colStart: Math.round(colStart),
        colEnd: Math.round(colEnd),
    }
};

control.TerminalManager.prototype.makeGutterMap = function(name, element, type) {
    let makeMap = () => {
        let obj = {};
        obj.element = element;
        obj.left = new Set();
        obj.right = new Set();
        obj.top = new Set();
        obj.bottom = new Set();
        return obj;
    };

    if (type === GUTTER && !(name in this.gutterElements)) {
        this.gutterElements[name] = makeMap();
    } else if(type === TERMBLK && !(name in this.elementGutters)) {
        this.elementGutters[name] = makeMap();
    }
};

control.TerminalManager.prototype.createTerminal = function (name, parent, width, height) {
    // let terminal = new admin.Terminal(name, parent);
    // let self = this;
    //
    // this.terminals.set(name, terminal);
    // terminal.addMenuItem('Split Vertically', (evt) => self.splitVertical(evt));
    // terminal.addMenuItem('Split Horizontally', (evt) => self.splitHorizontal(evt));
    // terminal.addMenuItem('New Tab', () => self.newTab());

    // terminal.addTerminalReadyFunction(function() { self.parent.dispatchEvent(new Event('resize')); });
};

control.TerminalManager.prototype.splitVertical = function (current) {
    let parent = current.target.ownerDocument.defaultView.frameElement.parentNode;
    this.split(parent, 1);
};

control.TerminalManager.prototype.splitHorizontal = function (current) {
    let parent = current.target.ownerDocument.defaultView.frameElement.parentNode;
    this.split(parent, 0);
};

control.TerminalManager.prototype.split = function (parent, axis) {
    this.setUpGridElement(parent, axis);
};

control.TerminalManager.prototype.setUpGridElement = function (currentElement, splitAxes) {
    this.totalTerminals++;
    let parent = currentElement.parentNode;
    let currentElementConfig = this.gridElementsConfig[currentElement.id];

    // TODO: Fix a bug in hterm where if the terminal window size is less than
    // 440px, then a horizontal scroll bar appears and window.onresize even is
    // polled continuously (loop).
    if (splitAxes === 1 && currentElementConfig.width <= 250) {
        console.warn("Cannot create terminals with less than 250 width");
        return;
    }
    if (splitAxes === 0 && currentElementConfig.height <= 60) {
        console.warn("Cannot create terminals with less than 60 height");
        return;
    }

    let width = currentElementConfig.width / 2;
    let height = currentElementConfig.height / 2;
    let name = currentElement.id;
    // currentElement.style["border"] = "1px solid #333";

    currentElement.style.position = "relative";
    if (splitAxes === 0) { // horizontal
        currentElement.style.width = currentElementConfig.width + "px";
        currentElement.style.height = height + "px";

        let rowStart = currentElementConfig.rowStart;
        let colStart = currentElementConfig.colStart;
        let rowEnd = Math.floor((rowStart + currentElementConfig.rowEnd) / 2);
        let colEnd = currentElementConfig.colEnd;

        // adjust the rowEnd to make space for horizontal-gutter
        rowEnd = rowEnd - 1;
        this.gridElementsConfig[name] = this.makeGridElementMap(
            currentElementConfig.width,
            height,
            rowStart,
            rowEnd,
            colStart,
            colEnd
        );

        // set grid-area for the actual terminal
        currentElement.style["grid-area"] = rowStart + "/" + colStart + "/" + rowEnd + "/" + colEnd;

        // setup the gutter and its event listeners
        let resizeElement = this.setUpResizingGrid(parent, currentElement, 0);

        // set grid-area for the gutter
        resizeElement.style["grid-area"] = (rowEnd + 1) + "/" + colStart + "/" + (rowEnd + 1) + "/" + colEnd;

        // add the returned gutter to the elementGutters
        this.elementGutters[name].bottom.add(resizeElement);

        // create new sibling next to the gutter
        let nextSibling = this.setUpGridSibling(parent, resizeElement, splitAxes, currentElementConfig.width, height, (rowEnd + 2), colStart, currentElementConfig.rowEnd, colEnd);

        // add the top/bottom gutters of currentElement to the new element's elementGutters list
        console.log("before adding horizontal gutters left: ", this.elementGutters[nextSibling.id].left);
        console.log("before adding horizontal gutters right: ", this.elementGutters[nextSibling.id].right);
        this.elementGutters[name].right.forEach(this.elementGutters[nextSibling.id].left.add, this.elementGutters[nextSibling.id].left);
        this.elementGutters[name].left.forEach(this.elementGutters[nextSibling.id].right.add, this.elementGutters[nextSibling.id].right);
        console.log("after adding horizontal gutters left: ", this.elementGutters[nextSibling.id].left);
        console.log("after adding horizontal gutters right: ", this.elementGutters[nextSibling.id].right);
        console.log("FINAL TRENCH LIST FOR ELEMENT: ", nextSibling.id, this.elementGutters[nextSibling.id]);

    } else {
        currentElement.style.width = width + "px";
        currentElement.style.height = currentElementConfig.height + "px";

        let rowStart = currentElementConfig.rowStart;
        let colStart = currentElementConfig.colStart;
        let rowEnd = currentElementConfig.rowEnd;
        let colEnd = Math.floor((colStart + currentElementConfig.colEnd) / 2);

        // adjust the colEnd to make space for vertical-gutter
        colEnd = colEnd - 1;
        this.gridElementsConfig[name] = this.makeGridElementMap(
            width,
            currentElementConfig.height,
            rowStart,
            rowEnd,
            colStart,
            colEnd
        );

        // set grid-area for the actual terminal
        currentElement.style["grid-area"] = rowStart + "/" + colStart + "/" + rowEnd + "/" + colEnd;

        // setup the gutter and its event listeners
        let resizeElement = this.setUpResizingGrid(parent, currentElement, 1);

        // set grid-area for the gutter
        resizeElement.style["grid-area"] = rowStart + "/" + (colEnd + 1) + "/" + rowEnd + "/" + (colEnd + 1);

        // add the returned gutter to the elementGutters
        this.elementGutters[name].left.add(resizeElement);

        // create new sibling next to the gutter
        let nextSibling = this.setUpGridSibling(parent, resizeElement, splitAxes, width, currentElementConfig.height, rowStart, (colEnd + 2), rowEnd, currentElementConfig.colEnd);

        // add the top/bottom gutters of currentElement to the new element's elementGutters list
        console.log("before adding horizontal gutters top: ", this.elementGutters[nextSibling.id].top);
        console.log("before adding horizontal gutters bottom: ", this.elementGutters[nextSibling.id].bottom);
        this.elementGutters[name].top.forEach(this.elementGutters[nextSibling.id].bottom.add, this.elementGutters[nextSibling.id].bottom);
        this.elementGutters[name].bottom.forEach(this.elementGutters[nextSibling.id].top.add, this.elementGutters[nextSibling.id].top);
        console.log("after adding horizontal gutters top: ", this.elementGutters[nextSibling.id].top);
        console.log("after adding horizontal gutters bottom: ", this.elementGutters[nextSibling.id].bottom);
        console.log("FINAL TRENCH LIST FOR ELEMENT: ", nextSibling.id, this.elementGutters[nextSibling.id]);
    }
};

control.TerminalManager.prototype.setUpGridSibling = function (parent, sibling, axis, width, height, rowStart, colStart, rowEnd, colEnd) {

    let name = "terminal" + this.totalTerminals;
    let terminalElem = document.createElement("div");
    this.makeGutterMap(name, terminalElem, GUTTER);
    this.makeGutterMap(name, terminalElem, TERMBLK);

    terminalElem.setAttribute("id", name);
    terminalElem.setAttribute("class", "base-terminal");

    // keep the references of gutter this element is aligned to
    if(axis === 0) { // horizontal
        // this.gutterElements[name].top.add(sibling); TODO ????
        this.gutterElements[sibling.id].bottom.add(terminalElem);

        // add the gutter to the elementGutters list
        this.elementGutters[name].top.add(sibling);
    } else { // vertical
        // this.gutterElements[name].left.add(sibling); TODO ????
        this.gutterElements[sibling.id].right.add(terminalElem);

        // add the gutter to the elementGutters list
        this.elementGutters[name].left.add(sibling);
    }

    terminalElem.style.position = "relative";
    terminalElem.style.width = width + "px";
    terminalElem.style.height = height + "px";

    // Using Math.floor on all properties, as grid-area doesn't accept decimal values.
    terminalElem.style["grid-area"] = rowStart + "/" + colStart + "/" + rowEnd + "/" + colEnd;

    this.gridElementsConfig[name] = this.makeGridElementMap(
        width,
        height,
        rowStart,
        rowEnd,
        colStart,
        colEnd
    );

    parent.insertBefore(terminalElem, sibling.nextSibling);
    this.gridElements[name] = terminalElem;

    // console.log("calling to create new terminal with width/height", width, height);
    this.createTerminal(name, "#" + name, width, height);

    return terminalElem;
};

control.TerminalManager.prototype.setUpResizingGrid = function (parent, sibling, axis) {
    this.totalGutterElements++;

    let resizeElem = document.createElement("div");
    let name = "gutter" + this.totalGutterElements;
    let gutterSize = "1.2px";
    let gutterColor = "red";
    let minConsoleHeight = 40;
    let minColsoleWidth = 180;
    let minTerminalRows = 3; // CANNOT BE LESS THAN 3. FIXME TODO
    let minTerminalColsOffset = 5;

    resizeElem.id = name;
    this.makeGutterMap(name, resizeElem, GUTTER);

    resizeElem.style.backgroundColor = gutterColor;
    resizeElem.style.zIndex = "10000";

    if (axis === 0) { // horizontal
        resizeElem.style.width = "100%";
        resizeElem.style.height = gutterSize;
        resizeElem.style.cursor = "ns-resize";
        this.gutterElements[name].top.add(sibling);
        this.gutterElements[sibling.id].bottom.add(resizeElem);
    } else {
        resizeElem.style.width = gutterSize;
        resizeElem.style.height = "100%";
        resizeElem.style.cursor = "ew-resize";
        this.gutterElements[name].left.add(sibling);
        this.gutterElements[sibling.id].right.add(resizeElem);
    }

    parent.insertBefore(resizeElem, sibling.nextSibling);
    let oldParentBorder = parent.style.border;

    let gutterMap_ = this.gutterElements[name];
    let gutterElems_ = new Set();
    let gutterSibs_ = new Set();

    let self = this;

    // event handler callback function for resizing
    let doResize = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();


        let siblingConfig = self.gridElementsConfig[sibling.id];
        let nextSibling = resizeElem.nextElementSibling;
        let nextSiblingConfig = self.gridElementsConfig[nextSibling.id];

        parent.style.border = "1px solid orange";

        let genMap = (dest, elem_) => {
            elem_.forEach(dest.add, dest);
        };

        if (axis === 0) { // horizontal movement

            console.log("gutter maps: ", gutterMap_);
            [gutterMap_.left, gutterMap_.top, gutterMap_.bottom, gutterMap_.right].forEach(genMap.bind(null, gutterElems_));
            console.log("PRE-FINAL TRENCH MAPS: ", gutterElems_);

            let generateGutterSibs = (elem_) => {
                let gutElem_ = this.elementGutters[elem_.id];
                [gutElem_.left, gutElem_.right].forEach(genMap.bind(null, gutterSibs_));
            };

            console.log("gutter elements: ", gutterElems_);
            gutterElems_.forEach(generateGutterSibs);
            console.log("FINAL TRENCH MAPS FOR: ", resizeElem.id, gutterSibs_);


            let siblingRect = sibling.getBoundingClientRect();

            let mousePosWRTSibling = e.y - siblingRect.y;
            let newSiblingHeight = Math.max(mousePosWRTSibling, minConsoleHeight);
            let differenceInHeight = siblingConfig.height - newSiblingHeight;
            let nextSiblingHeight = nextSiblingConfig.height + differenceInHeight;

            /* Now that we know the final heights of both the blocks, lets continue with rest */
            let siblingGridRowEnd = Math.round(newSiblingHeight / self.rowHeight);

            // Check if we are going out of bounds on the other end which shouldn't be allowed either
            if(nextSiblingHeight <= minConsoleHeight) {
                endResize();
                return false;
            }

            // set sibling/top-block values
            sibling.style.height = newSiblingHeight + "px";
            sibling.style.gridRowEnd = parseInt(sibling.style.gridRowStart) + siblingGridRowEnd;

            // set the gutter values
            resizeElem.style.gridRowStart = parseInt(sibling.style.gridRowEnd) + 1;
            resizeElem.style.gridRowEnd = resizeElem.style.gridRowStart;
            console.log("Setting gutter row with start/end: ", resizeElem.style.gridRowStart, resizeElem.style.gridRowEnd);

            // set the next-sibling/bottom-block values
            nextSibling.style.gridRowStart = parseInt(resizeElem.style.gridRowEnd) + 1;
            nextSibling.style.height = nextSiblingHeight + "px";

            // update the grid elements map with updated values
            siblingConfig.height = newSiblingHeight;
            siblingConfig.rowEnd = siblingGridRowEnd;

            nextSiblingConfig.height = nextSiblingHeight;
            nextSiblingConfig.rowStart = parseInt(nextSibling.style.gridRowStart);

            // Resize/re-grid all the connected elements and gutters
            gutterSibs_.forEach((elem__) => {
                if(e.movementY > 0) {
                    elem__.style.gridRowStart = resizeElem.style.gridRowStart;
                }
                // elem__.style.gridRowEnd = resizeElem.style.gridRowEnd;

                let siblingElements__ = self.gutterElements[elem__.id];

                // typically, the horizontal gutter is always bound to the left terminal and gets automatically resized
                // and hence we do not need to resize it. We can take the height of the left element and set the height
                // of the right element to exactly the same.
                let sibElemHeight;
                siblingElements__.left.forEach((sibElems__) => {
                   let oldRowEnd =  sibElems__.style.gridRowEnd;
                   sibElems__.style.gridRowStart = resizeElem.style.gridRowStart;
                   // sibElems__.style.gridRowEnd = resizeElem.style.gridRowEnd;
                   sibElemHeight = sibElems__.style.height;
                });
                siblingElements__.right.forEach((sibElems__) => {
                    sibElems__.style.gridRowStart = resizeElem.style.gridRowStart;
                    // sibElems__.style.gridRowEnd = resizeElem.style.gridRowEnd;
                    sibElems__.style.height = sibElemHeight;
                });
            });

        } else { // vertical

            console.log("gutter maps: ", gutterMap_);
            [gutterMap_.left, gutterMap_.top, gutterMap_.bottom, gutterMap_.right].forEach(genMap.bind(null, gutterElems_));
            console.log("PRE-FINAL TRENCH MAPS: ", gutterElems_);

            let generateGutterSibs = (elem_) => {
                let gutElem_ = this.elementGutters[elem_.id];
                [gutElem_.top, gutElem_.bottom].forEach(genMap.bind(null, gutterSibs_));
            };

            console.log("gutter elements: ", gutterElems_);
            gutterElems_.forEach(generateGutterSibs);
            console.log("FINAL TRENCH MAPS for : ", resizeElem.id, gutterSibs_);


            let siblingRect = sibling.getBoundingClientRect();

            let siblingAdminTerminal = self.terminals.get(sibling.id);
            let nextSiblingAdminTerminal = self.terminals.get(nextSibling.id);

            let mousePosWRTSibling = e.x - siblingRect.x;
            let newSiblingWidth = Math.max(mousePosWRTSibling, minColsoleWidth);
            let differenceInWidth = siblingConfig.width - newSiblingWidth;
            let nextSiblingWidth = nextSiblingConfig.width + differenceInWidth;

            /* Now that we know the final heights of both the blocks, lets continue with rest */
            let siblingGridColEnd = Math.round(newSiblingWidth / self.colWidth);

            // Check if we are going out of bounds on the other end which shouldn't be allowed either
            if(nextSiblingWidth <= minColsoleWidth) {
                endResize();
                return false;
            }

            console.log("siblingGridColEnd, newSiblingWidth, self.colWidth, gridcolend", siblingGridColEnd, newSiblingWidth, self.colWidth, parseInt(sibling.style.gridColumnStart) + siblingGridColEnd);

            // set sibling/top-block values
            sibling.style.width = newSiblingWidth + "px";
            sibling.style.gridColumnEnd = parseInt(sibling.style.gridColumnStart) + siblingGridColEnd;

            // set the gutter values
            resizeElem.style.gridColumnStart = parseInt(sibling.style.gridColumnEnd) + 1;
            resizeElem.style.gridColumnEnd = resizeElem.style.gridColumnStart;
            console.log("Setting gutter row with start/end: ", resizeElem.style.gridColumnStart, resizeElem.style.gridColumnEnd);

            // set the next-sibling/bottom-block values
            nextSibling.style.gridColumnStart = parseInt(resizeElem.style.gridColumnEnd) + 1;
            nextSibling.style.width = nextSiblingWidth + "px";

            // update the grid elements map with updated values
            siblingConfig.width = newSiblingWidth;
            siblingConfig.colEnd = siblingGridColEnd;

            nextSiblingConfig.width = nextSiblingWidth;
            nextSiblingConfig.colStart = parseInt(nextSibling.style.gridColumnStart);

            // Resize/re-grid all the connected elements;
            // gutterSibs_.forEach((elem__) => {
            //     elem__.style.gridRowStart = resizeElem.style.gridRowStart;
            //     // elem__.style.gridRowEnd = resizeElem.style.gridRowEnd;
            //
            //     let siblingElements__ = self.gutterElements[elem__.id];
            //
            //     // typically, the horizontal gutter is always bound to the left terminal and gets automatically resized
            //     // and hence we do not need to resize it. We can take the height of the left element and set the height
            //     // of the right element to exactly the same.
            //     let sibElemHeight;
            //     siblingElements__.left.forEach((sibElems__) => {
            //         let oldRowEnd =  sibElems__.style.gridRowEnd;
            //         sibElems__.style.gridRowStart = resizeElem.style.gridRowStart;
            //         // sibElems__.style.gridRowEnd = resizeElem.style.gridRowEnd;
            //         sibElemHeight = sibElems__.style.height;
            //     });
            //     siblingElements__.right.forEach((sibElems__) => {
            //         sibElems__.style.gridRowStart = resizeElem.style.gridRowStart;
            //         // sibElems__.style.gridRowEnd = resizeElem.style.gridRowEnd;
            //         sibElems__.style.height = sibElemHeight;
            //     });
            // });
        }

        //self.resizeCallback();
        return false;
    };

    let endResize = () => {
        parent.removeEventListener('mousemove', doResize);
        resizeElem.removeEventListener('mousedown', gutterResize);
        parent.style.border = oldParentBorder;
        isMouseEnterActive = false;
    };

    let endResize2 = () => {
        console.log("mouseup on document");
        parent.removeEventListener('mousemove', doResize);
        parent.style.border = oldParentBorder;
    };

    let gutterResize = () => {
        isMouseEnterActive = true;
        parent.addEventListener('mousemove', doResize);
        parent.addEventListener('mouseup', endResize);
        parent.addEventListener('mouseleave', endResize);
    }

    // event listeners
    let term2__ = this.terminals.get(sibling.id).terminal.document_;
    let isMouseEnterActive = false;

    term2__.addEventListener('mouseenter', (e) => {
        if(isMouseEnterActive) {
            console.log("TERM2 MOVE UP");
            endResize();
        }
    });

    resizeElem.addEventListener('mouseenter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // self.mouseEnteredGutters.push(resizeElem);
        resizeElem.addEventListener('mousedown', gutterResize);
        return false;
    });

    return resizeElem;
}

let terminalManager = new control.TerminalManager('#first-terminal');