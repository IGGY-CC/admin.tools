// SOURCE FILE: admin.tools/src/main/scripts/plugins/FileMenu/plugin_file_menu.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let FileMenu = function() {
    this.pluginName = "File";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.position = 1;
};

FileMenu.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
FileMenu.prototype.Start = function() {
    this.setupToolIcon();
    this.setupMenuItems();
};

FileMenu.prototype.setupToolIcon = function() {
    this.tool  = {
        pluginName: this.pluginName,
        id: "toolbar-new-tab",
        tooltip: "New Tab",
        icon: "fas fa-folder-plus",
        callback: this.onNewTabClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "right"
    };
    this.setTool(this.tool);
};

FileMenu.prototype.setupMenuItems = function() {
    this.menuItem  = {
        pluginName: this.pluginName,
        displayName: "File",
        id: "menubar-file",
        isActive: true,
    };

    this.setMenuItem(this.menuItem);

    let iconItem = {
        pluginName: this.pluginName,
        row: 1,
        id: "menubar-new-tab",
        tooltip: "New Tab",
        icon: "fas fa-folder-plus",
        callback: this.onNewTabClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "top"
    };

    this.setMenuIcon(iconItem);
    //
    // let splitVertical = Object.assign({}, iconItem);
    // splitVertical.displayName = "Split Vertical";
    // splitVertical.id = "menubar-split-vertical";
    // splitVertical.tooltip = "Split Vertically";
    // splitVertical.icon = "fa fa-columns";
    // splitVertical.callback = this.split.bind(this, true);
    // splitVertical.ttdirection = "bottom";
    //
    // this.setMenuIcon(splitVertical);

};

FileMenu.prototype.onNewTabClick = function() {
    this.createNewTab();
};

// init logic
module.exports = FileMenu;
