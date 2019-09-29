// SOURCE FILE: admin.tools/src/main/scripts/plugins/terminal/plugin_terminal.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const path = require('path');
const TerminalWindow = require("./term/term_terminal_window");

const Terminal = function() {
    this.pluginName = "Terminal";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.activeTerminals = new Map();
    this.position = 2;
};

Terminal.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Terminal.prototype.Start = function() {
    this.setupToolIcon();
    this.setupMenuItems();
};

Terminal.prototype.setupToolIcon = function() {
    this.tool  = {
        pluginName: this.pluginName,
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
        pluginName: this.pluginName,
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

    this.addMenuItem(this.menuItem, "Split Vertical", "menubar-split-vertical",
        "fas fa-columns", this.split.bind(this, true), "bottom");

    this.addMenuItem(this.menuItem, "Split Horizontal", "menubar-split-horizontal",
        "fas fa-window-maximize", this.split.bind(this, false), "bottom");


    this.addMenuItem(this.menuItem, "Delete Active", "menubar-delete-active",
        "fas fa-backspace", this.deleteActiveCell.bind(this), "bottom");

    this.addMenuItem(this.menuItem, "Switch Color", "menubar-switch-color",
        "fas fa-star-half-alt", this.switchColor.bind(this), "bottom");

    this.addMenuItem(this.menuItem, "Change Background", "menubar-change-background",
        "fas fa-tree", this.changeBackground.bind(this, false), "bottom");

    this.addMenuItem(this.menuItem, "Turnoff Background", "menubar-background-off",
        "fas fa-ban", this.changeBackground.bind(this, true), "bottom");

};

Terminal.prototype.onIconClick = function() {
    let termContainerID = this.getActiveElement().id + "-term";
    let termContainer = UtilsUI.createNewElement('div', this.getActiveElement(), termContainerID);
    termContainer.style.position = "relative";
    termContainer.style.maxHeight = "100%";
    termContainer.style.maxWidth = "100%";
    termContainer.style.boxSizing = "border-box";

    // let terminalWindow = new TerminalWindow("#" + this.getActiveElement().id);
    let terminalWindow = new TerminalWindow(this.getActiveElement().id, "#" + termContainerID);
    this.setActiveTabName("Terminal");
    this.activeTerminals.set(termContainerID, terminalWindow);
};

Terminal.prototype.changeBackground = function(doTurnoff) {
    console.log("CHANGE BG: ", doTurnoff);
    let termContainerID = this.getActiveElement().id + "-term";
    this.activeTerminals.get(termContainerID).changeBackground(doTurnoff);
};

Terminal.prototype.switchColor = function() {
    let termContainerID = this.getActiveElement().id + "-term";
    this.activeTerminals.get(termContainerID).switchColor();
};

// init logic
module.exports = Terminal;
