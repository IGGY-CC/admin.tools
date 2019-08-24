// SOURCE FILE: admin.tools/src/main/scripts/window-grid/window-grid.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let grid = require("./grid");

const toolbar = "#tool-bar";

grid.Toolbar = function () {
  this.toolbar = document.querySelector(toolbar);
  this.tools = {};
};

grid.Toolbar.prototype.addTool = function (name, id, tooltip, icon, callback, color, hcolor) {
    if(this.tools.has(name)) {
        console.error("The tool is already registered. Not adding.");
        return;
    }
    let tool = {};
    tool.name = name;
    tool.id = id;
    tool.tooltip = tooltip;
    tool.icon = icon;
    tool.callback = callback;
    tool.color = color || null;
    tool.hcolor = hcolor || null;
    tool.element = null;

    this.tools[name] = tool;
    this.setupUI(tool);
};

grid.Toolbar.prototype.setupUI = function(tool) {
    tool.element = util.UI.wrapIconInNewElement('div', this.toolbar, id, "tool", tool.icon, tool.callback);
};

grid.Toolbar.prototype.removeTool = function(tool) {
    util.UI.removeElement(tool.element, this.toolbar);
};




