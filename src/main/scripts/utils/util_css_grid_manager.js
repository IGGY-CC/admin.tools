// SOURCE FILE: admin.tools/src/main/scripts/util/util_css_grid_manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const getSize = function(element) {
    const computedStyle = object.assign({}, getComputedStyle(element));
    return { width: computedStyle.width, height: computedStyle.height, area: computedStyle.gridArea };
};

class Node {
    constructor(index, type, size, isFixed=false) {
        this.index = 0;
        this.type = type;
        this.size = size;
        this.isFixed = isFixed;
        this.minWidth = 0;
        this.maxWidth = 0;
    }
}

class CSSGrid {
    constructor(root) {
        this.root = root;
        this.width = 0;
        this.height = 0;
        this.gridColumns = [];
        this.gridRows = [];
        this.gridRowSize = 0;
        this.gridColumnSize = 0;
        this.init();
    }

    init() {
        this.refreshSize();
        this.setupRows();
        this.setupCols();
    }

    refreshSize() {
        this.computedStyle = Object.assign({}, getComputedStyle(this.root));
        this.width = this.computedStyle.width;
        this.height = this.computedStyle.height;
    }

    setupRows() {
        let gridTemplateRows = this.computedStyle.gridTemplateRows;

        gridTemplateRows.split(" ").forEach(row => {
            let cellSize = this.parseNumber(row);
            this.gridRowSize += cellSize;
            this.gridRows.push({value: cellSize, isFixed: false});
        });
    }

    setupCols() {
        let gridTemplateColumns = this.computedStyle.gridTemplateColumns;

        gridTemplateColumns.split(" ").forEach(column => {
            let cellSize = this.parseNumber(column);
            this.gridColumnSize += cellSize;
            this.gridColumns.push({value: cellSize, isFixed: false});
        });
    }

    setupGridMatrix() {
        let gridMatrix = this.computedStyle.gridTemplateAreas;

    }
}


// CSSGrid = function(element) {
//     this.element = element;
//
//     this.gridColumns = [];
//     this.gridColumnSize = 0;
//
//     this.gridRows = [];
//     this.gridRowSize = 0;
//
//     this.gridTemplateAreas = []; // one entry per row
//     this.calculateFromDOM();
// };

CSSGrid.prototype.parseNumber = function(number, decimalPlaces=3) {
    return + parseFloat(number).toFixed(3);
};

CSSGrid.prototype.calculateFromDOM = function() {
    let computedStyle = Object.assign({}, getComputedStyle(this.element));
    console.log(computedStyle);


    console.log(this.gridColumnSize);
    console.log(this.gridRowSize);
    console.log(this.gridColumns);
    console.log(this.gridRows);
};

CSSGrid.prototype.resizeColumn = function() {
    this.gridColumns.forEach(column => {

    });
};




module.exports = CSSGrid;