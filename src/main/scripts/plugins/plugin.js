// SOURCE FILE: admin.tools/src/main/scripts/plugins/plugin.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const gridToolbar = require('../window-grid/toolbar-content');
const gridMenubar = require('../window-grid/menu-bar');
const GridObject = require('../window-grid/grid-object');

// let gridManager = require('../window-grid/main-content');

let PluginRegister = function(pluginName) {
    this.name = pluginName;
    this.menu = true;
    this.activeCell = null;

    let updateActiveCell = activeCell => this.activeCell = activeCell;
    let rootElement = document.querySelector("#main-container");
    let computedStyle = Object.assign({}, getComputedStyle(rootElement));
    this.gridObject = new GridObject("hello", updateActiveCell, null, rootElement, parseInt(computedStyle.width), parseInt(computedStyle.height));
};

PluginRegister.prototype.setTool = function(tool) {
    gridToolbar.setTool(tool);
};

PluginRegister.prototype.setMenuItem = function(menuItem) {
    gridMenubar.setMenuItem(menuItem);
};

PluginRegister.prototype.setMenuIcon = function(menuIcon) {
    gridMenubar.setupIcon(menuIcon);
};

PluginRegister.prototype.split = function(isVertical) {
    if(this.activeCell === null) {
        this.gridObject.doSplit(isVertical);
    } else {
        this.activeCell.doSplit(isVertical);
    }
};

PluginRegister.prototype.deleteActiveCell = function() {
    if(this.activeCell === null) {
        console.log("PLEASE SELECT A CELL TO DELETE.");
    } else {
        this.activeCell.deleteActiveCell();
    }
};

PluginRegister.prototype.getActiveElement = function() {
    if(this.activeCell === null) {
        console.warn("NO ACTIVE CELL YET");
        return null;
    } else {
        return this.activeCell.element;
    }
};

PluginRegister.prototype.Start = function() {
    console.error("This method shall be overridden by the plugin, which is not the case!");
    console.error("Please report to respective Plugin author", this.name);
};

module.exports = PluginRegister;