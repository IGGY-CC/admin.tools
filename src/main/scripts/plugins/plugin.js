// SOURCE FILE: admin.tools/src/main/scripts/plugins/plugin.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const gridToolbar = require('../window-grid/toolbar-content');
const gridMenubar = require('../window-grid/menu-bar');
const GridObjectLib = require('../window-grid/grid-object');
// const tabObject = require('../window-grid/tab-content');
const slideOutObject = require('../window-grid/slideout-content');

const GridObject = GridObjectLib.GridObject;
const gridOnTabs = GridObjectLib.gridOnTabs;
const LAST_INDEX = 10000;

// let gridManager = require('../window-grid/main-content');

let PluginRegister = function (pluginName) {
    this.name = pluginName;
    this.menu = true;
    /* The position/order of the menu item for the respective plugin */
    this.position = LAST_INDEX;
    /* Plugin Path */
    this.pluginPath = null;
    this.observable = null;
};

PluginRegister.prototype.setTool = function (tool) {
    gridToolbar.setTool(tool);
};

PluginRegister.prototype.setMenuItem = function (menuItem) {
    gridMenubar.setMenuItem(menuItem);
};

PluginRegister.prototype.setMenuIcon = function (menuIcon) {
    gridMenubar.setupIcon(menuIcon);
};

PluginRegister.prototype.setDropDown = function (menuIcon) {
    gridMenubar.setupDropDown(menuIcon);
};

PluginRegister.prototype.addSpacer = function(pluginName, onRow, width) {
    gridMenubar.addSpacer(pluginName, onRow, width);
};

PluginRegister.prototype.split = function (isVertical) {
    gridOnTabs.activeGrid.doSplit(isVertical);
};

PluginRegister.prototype.deleteActiveCell = function () {
    gridOnTabs.activeGrid.deleteActiveCell();
};

PluginRegister.prototype.getActiveElement = function () {
    return gridOnTabs.activeGrid.element;
};

PluginRegister.prototype.createNewTab = function() {
    const gridContainer = tabObject.createNewTab("Editor", "fa fa-file");
    this.observable(gridContainer);
};

PluginRegister.prototype.setActiveTabName = function(name) {
    tabObject.setActiveTabName(name);
};

PluginRegister.prototype.createSlideOutEntry = function(containerObject) {
    slideOutObject.createNewEntry(containerObject);
};

PluginRegister.prototype.Start = function () {
    console.error("This method shall be overridden by the plugin, which is not the case!");
    console.error("Please report to respective Plugin author", this.name);
};

PluginRegister.prototype.addMenuItem = function(base, name, id, icon, callback, ttDirection, row) {
    let menuItem = Object.assign({}, base);
    if(typeof row !== "undefined") {
        menuItem.row = row;
    }
    menuItem.displayName = name;
    menuItem.id = id;
    menuItem.tooltip = name;
    menuItem.icon = icon;
    menuItem.callback = callback;
    menuItem.ttdirection = ttDirection;

    this.setMenuIcon(menuItem);
};

module.exports = PluginRegister;