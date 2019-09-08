// SOURCE FILE: admin.tools/src/main/scripts/plugins/terminal/plugin_terminal.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const path = require('path');
const PluginRegister = require(require.resolve('../plugin.js', { paths: [ '.' ] }));
const TerminalWindow = require("./term/term_terminal_window");

let Terminal = {};
Terminal = function() {
    this.pluginName = "Terminal";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
};

Terminal.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Terminal.prototype.Start = function() {
    this.setupToolIcon();
    this.setupMenuItems();
};

Terminal.prototype.setupToolIcon = function() {
    this.tool  = {
        name: this.pluginName,
        id: "toolbar-terminal",
        tooltip: "New Terminal",
        icon: "fa fa-terminal",
        callback: this.onIconClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "right"
    };
    this.setTool(this.tool);
};

Terminal.prototype.setupMenuItems = function() {
    this.menuItem  = {
        name: this.pluginName,
        displayName: "Terminal",
        id: "menubar-terminal",
        row: 1,
        tooltip: "New Terminal",
        icon: "fa fa-terminal",
        callback: this.onIconClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "top"
    };
    this.setMenuItem(this.menuItem);
    this.setMenuIcon(this.menuItem);

    let splitVertical = Object.assign({}, this.menuItem);
    let splitHorizontal = Object.assign({}, this.menuItem);
    let deleteCell = Object.assign({}, this.menuItem);

    splitVertical.displayName = "Split Vertical";
    splitVertical.id = "menubar-split-vertical";
    splitVertical.tooltip = "Split Vertically";
    splitVertical.icon = "fa fa-columns";
    splitVertical.callback = this.split.bind(this, true);
    splitVertical.ttdirection = "bottom";

    splitHorizontal.displayName = "Split Horizontal";
    splitHorizontal.id = "menubar-split-horizontal";
    splitHorizontal.tooltip = "Split Horizontally";
    splitHorizontal.icon = "fa fa-window-maximize";
    splitHorizontal.callback = this.split.bind(this, false);
    splitHorizontal.ttdirection = "bottom";

    deleteCell.displayName = "Delete Active";
    deleteCell.id = "menubar-delete-active";
    deleteCell.tooltip = "Delete Active";
    deleteCell.icon = "fa fa-backspace";
    deleteCell.callback = this.deleteActiveCell.bind(this, false);
    deleteCell.ttdirection = "bottom";

    this.setMenuIcon(splitVertical);
    this.setMenuIcon(splitHorizontal);
    this.setMenuIcon(deleteCell);
};

Terminal.prototype.onIconClick = function() {
    let terminalWindow = new TerminalWindow("#" + this.getActiveElement().id);
    this.setActiveTabName("Terminal");
};

// init logic
module.exports = Terminal;
