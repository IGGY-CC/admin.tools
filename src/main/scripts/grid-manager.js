// SOURCE FILE: admin.tools/src/main/scripts/grid-manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

'use strict';

let grid = require("./grid-element");

grid.Manager = function() {
    this.gridElements = {};
};

grid.Manager.prototype.add = function (element) {
    this.gridElements.name = element.id;
    this.gridElements.element = element;
};

grid.Manager.prototype.resize = function(rowHeight=null, colWidth=null) {
    this.gridElements.forEach((elem) => {
        elem.resizeArea(rowHeight, colWidth);
    });
};

grid.Manager.prototype.print = function() {
    this.gridElements.forEach((elem) => {
        console.log("---------------");
        console.log("name:element", elem.name, elem.element);
    });
    console.log("++++++++++++++++");
};


