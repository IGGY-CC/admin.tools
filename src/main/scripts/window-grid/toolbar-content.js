// SOURCE FILE: admin.tools/src/main/scripts/window-grid/toolbar-content.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const toolbar_id = "#tool-bar";

let GridToolbar = function () {
  this.toolbar = document.querySelector(toolbar_id);
  this.tools = new Map();
};

GridToolbar.prototype.setTool = function(tool) {
    if(this.tools.has(name)) {
        console.error("The tool is already registered. Not adding.");
        return;
    }

    this.tools[name] = tool.name;
    this.setupUI(tool);
};

GridToolbar.prototype.setupUI = function(tool) {
    let wrapper = UtilsUI.wrapIconInNewElement('div', this.toolbar, tool.id, "tool", tool.icon, tool.callback, true);
    tool.element = wrapper.wrapper;
    tool.iconElement = wrapper.icon;
    UtilsUI.setToolTip(tool.element, tool.tooltip, tool.ttdirection);
};

GridToolbar.prototype.removeTool = function(tool) {
    UtilsUI.removeElement(tool.element, this.toolbar);
};

module.exports = new GridToolbar();

