// SOURCE FILE: admin.tools/src/main/scripts/plugins/plugin.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let gridToolbar = require('../window-grid/toolbar-content');
let gridMenubar = require('../window-grid/menu-bar');
let gridManager = require('../window-grid/main-content');

let PluginRegister = function(pluginName) {
    this.name = pluginName;
    this.menu = true;
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
    if(isVertical) {
        gridManager.splitVertical();
    } else {
        gridManager.splitHorizontal();
    }
};

PluginRegister.prototype.deleteActiveCell = function() {
    gridManager.deleteActiveCell();
};

PluginRegister.prototype.Start = function() {
    console.error("This method shall be overridden by the plugin, which is not the case!");
    console.error("Please report to respective Plugin author", this.name);
};

module.exports = PluginRegister;