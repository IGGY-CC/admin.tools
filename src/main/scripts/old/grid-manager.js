// SOURCE FILE: admin.tools/src/main/scripts/grid-manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

'use strict';

let grid = require("./grid-element");

grid.Manager = function(rowHeight, colWidth, width, height) {
    this.rowHeight = rowHeight;
    this.colWidth = colWidth;
    this.width = width;
    this.height = height;
    this.parent = null;

    this.minTerminalHeight = 30;
    // The default minimum width of a terminal will be the prompt size. This offset adds to the prompt size.
    this.minTerminalWidthOffset = 10;
    this.minTerminalWidth = 160;

    this.gridElements = [];
    this.terminals = {};
    this.totalTerminals = 0;
    this.totalGridElements = 0;
    this.totalTrenchElements = 0;

};

grid.Manager.prototype.add = function (element) {
    this.gridElements.push(element);
    this.totalGridElements++;
};

grid.Manager.prototype.addTerminal = function(name, terminal) {
    this.terminals.name = terminal;
    this.totalTerminals++;
};

grid.Manager.prototype.resize = function(rowHeight, colWidth, widthRatio, heightRatio) {
    this.gridElements.forEach((elem) => {
        elem.updateArea(rowHeight, colWidth, widthRatio, heightRatio);
    });
};

grid.Manager.prototype.print = function(type) {
    this.gridElements.forEach((elem) => {
        if(typeof type === "undefined") {
            console.log("---------------");
            console.log("name:element", elem.name, elem);
        } else {
            if(elem.type === type) {
                console.log("---------------");
                console.log("name:element", elem.name, elem);
            }
        }
    });
    console.log("++++++++++++++++");
};


module.exports = grid.Manager;