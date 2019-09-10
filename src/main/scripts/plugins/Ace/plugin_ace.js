// SOURCE FILE: admin.tools/src/main/scripts/plugins/Ace/plugin_ace.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const path = require('path');
const ace = require("./ace/ace.js");
const THEME_DIR = "./ace/";

let Ace = {};
Ace = function() {
    this.pluginName = "Editor";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.registeredEditors = new Map();
    this.themes = new Map();
    this.languages = new Map();
};

Ace.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Ace.prototype.Start = function() {
    this.setupToolIcon();
    this.setupMenuItems();
};

Ace.prototype.setupToolIcon = function() {
    this.tool  = {
        pluginName: this.pluginName,
        id: "toolbar-editor",
        tooltip: "New Editor",
        icon: "fa fa-file",
        callback: this.onIconClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "right"
    };
    this.setTool(this.tool);
};

Ace.prototype.setupMenuItems = function() {
    this.menuItem  = {
        pluginName: this.pluginName,
        displayName: "Editor",
        id: "menubar-editor",
        row: 1,
        tooltip: "New Editor",
        icon: "fa fa-file",
        callback: this.onIconClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "top"
    };
    this.setMenuItem(this.menuItem);
    this.setMenuIcon(this.menuItem);

    this.setupThemeDropDown(this.menuItem);
    // this.setupLanguageDropDown(this.menuItem);
};

Ace.prototype.getActiveEditor = function() {
    let editorCell = this.getActiveElement().id;
    return this.registeredEditors.get(editorCell);
};

Ace.prototype.onIconClick = function() {
    let editorCell = this.getActiveElement().id;
    let currentEditor = this.registeredEditors.get(editorCell);
    if(typeof currentEditor === "undefined") {
        let editor = ace.edit(this.getActiveElement().id);
        this.registeredEditors.set(editorCell, editor);
    } else {
        console.warn("An editor is already present in the selected cell! Select another cell to create a new editor");
    }
    this.setActiveTabName("Editor");
};

Ace.prototype.setupThemeDropDown = function(baseMenuItem) {
    let dropDown = Object.assign({}, baseMenuItem);

    dropDown.displayName = "Select Editor Theme";
    dropDown.id = "menubar-editor-theme";
    dropDown.tooltip = "Select Editor Theme";
    dropDown.ttdirection = "top";
    dropDown.ddcallback = this.dropDownClicked.bind(this, this.themes);
    dropDown.row = 2;

    this.getDropDownList("theme-", this.themes, "Error finding themes: ").then(() => {
        dropDown.dropDownEntries = [...this.themes.keys()];
        this.setDropDown(dropDown);
    });
};

Ace.prototype.getDropDownList = async function(pattern, theArray, errorDesc) {
    return FindFiles(
        path.join(this.pluginPath, THEME_DIR),
        this.setupDropDownMenuItems.bind(this, theArray), pattern
    ).catch(
        error => {
            console.log(errorDesc, error);
        }
    );
};

Ace.prototype.setupLanguageDropDown = function(baseMenuItem) {
    let dropDown = Object.assign({}, baseMenuItem);

    dropDown.displayName = "Select File Type";
    dropDown.id = "menubar-file-type";
    dropDown.tooltip = "Select File Type";
    dropDown.ttdirection = "top";
    dropDown.ddcallback = this.dropDownClicked.bind(this, this.languages);
    dropDown.row = 2;

    this.getDropDownList("mode-", this.languages, "Error finding supported list of languages/file types: ").then(() => {
        dropDown.dropDownEntries = [...this.languages.keys()];
        this.setDropDown(dropDown);
    });
};

Ace.prototype.setupDropDownMenuItems = function(theArray, filterFile) {
    let filterName = filterFile.replace(/[^-]*-([^\.]*).js/g, '$1');
    theArray.set(filterName, filterFile);
};

Ace.prototype.dropDownClicked = function(theArray, theme) {
    require("./" + theArray.get(theme));
    let editor = this.getActiveEditor();
    if(typeof editor !== "undefined") {
        editor.setTheme("ace/theme/" + theme);
    }
};


// init logic
module.exports = Ace;
