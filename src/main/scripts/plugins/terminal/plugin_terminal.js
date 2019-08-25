// SOURCE FILE: admin.tools/src/main/scripts/plugins/terminal/plugin_terminal.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
let path = require('path');

let Terminal = {};
let PluginRegister = require(require.resolve('../plugin.js', { paths: [ '.' ] }));


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
        tooltip: "Terminal",
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
        row: 2,
        tooltip: "Terminal",
        icon: "fa fa-terminal",
        callback: this.onIconClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "top"
    };
    this.setMenuItem(this.menuItem);
    this.setMenuIcon(this.menuItem);
};

Terminal.prototype.onIconClick = function() {
    console.log("TERMINAL ICON CLICKED");
};

// init logic
module.exports = Terminal;
