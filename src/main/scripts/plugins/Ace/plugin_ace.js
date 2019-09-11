// SOURCE FILE: admin.tools/src/main/scripts/plugins/Ace/plugin_ace.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const path = require('path');
const ace = require("./ace/ace.js");
const BASE_DIR = "./ace/";
const keyBindings = ["default", "vim", "emacs", "sublime"];

let Ace = {};
Ace = function() {
    this.pluginName = "Editor";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.registeredEditors = new Map();

    this.themes = new Map();
    this.languages = new Map();
    this.keybindings = new Map();
};

Ace.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Ace.prototype.Start = function() {
    ace.config.set('basePath', path.join(__dirname, BASE_DIR));
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
        icon: "fa fa-pen-nib",
        callback: this.onIconClick.bind(this),
        color: "green",
        hcolor: "white",
        ttdirection: "top"
    };
    this.setMenuItem(this.menuItem);
    this.setMenuIcon(this.menuItem);

    this.setupUndoRedo(this.menuItem);
    this.setupThemeDropDown(this.menuItem);
    this.setupLanguageDropDown(this.menuItem);
    this.addSpacer(this.pluginName, 1, 16);
    this.setupKeyBindingIcons(this.menuItem);
    // this.setupKeyBindingDropDown(this.menuItem);
    this.addSpacer(this.pluginName, 1, 5);
    this.setupFontSize(this.menuItem);
};

Ace.prototype.getActiveEditor = function() {
    let editorCell = this.getActiveElement().id;
    return this.registeredEditors.get(editorCell);
};

Ace.prototype.setupUndoRedo = function(baseMenuItem) {
    let base = Object.assign({}, baseMenuItem);
    base.id = "";

    let undo = Object.assign({}, base);
    let redo = Object.assign({}, base);
    let indent = Object.assign({}, base);
    let sort = Object.assign({}, base);
    let ucase = Object.assign({}, base);
    let lcase = Object.assign({}, base);

    undo.icon = "fas fa-undo-alt";
    undo.tooltip = "undo";
    undo.callback = () => this.getActiveEditor().undo();
    this.setMenuIcon(undo);

    redo.icon = "fas fa-redo-alt";
    redo.tooltip = "redo";
    redo.callback = () => this.getActiveEditor().redo();
    this.setMenuIcon(redo);

    this.addSpacer(this.pluginName, 1, 10);

    indent.icon = "fas fa-indent";
    indent.tooltip = "indent";
    indent.callback = () => this.getActiveEditor().indent();
    this.setMenuIcon(indent);

    sort.icon = "fas fa-sort";
    sort.tooltip = "Sort Selection";
    sort.callback = () => this.getActiveEditor().sortLines();
    this.setMenuIcon(sort);

    ucase.icon = "fas fa-arrow-circle-up";
    ucase.tooltip = "to Upper Case";
    ucase.callback = () => this.getActiveEditor().toUpperCase();
    this.setMenuIcon(ucase);

    lcase.icon = "fas fa-arrow-circle-down";
    lcase.tooltip = "to Lower Case";
    lcase.callback = () => this.getActiveEditor().toLowerCase();
    this.setMenuIcon(lcase);
};

Ace.prototype.setupKeyBindingIcons = function(baseMenuItem) {

    keyBindings.forEach(keyBinding => {
        let key = Object.assign({}, baseMenuItem);
        key.id = keyBinding + "-key-binding";
        if(keyBinding === "default") {
            key.icon = "fas fa-angle-double-left";
        } else {
            key.icon = path.join(__dirname, "icons/" + keyBinding + ".svg");
        }
        key.tooltip = keyBinding + " Keybinding";
        key.callback = this.keyBindingIconClicked.bind(this, keyBinding);
        this.setMenuIcon(key);
    });
};

Ace.prototype.keyBindingIconClicked = function(value) {
    if(value === "default") {
        this.getActiveEditor().setKeyboardHandler(null);
    } else {
        this.getActiveEditor().setKeyboardHandler("ace/keyboard/" + value);
    }
    keyBindings.forEach(keyBinding => {
        let element = document.querySelector("#" + keyBinding + "-key-binding");
        if(keyBinding === value) {
            element.classList.add("selected");
        } else {
            element.classList.remove("selected");
        }
    });
};

Ace.prototype.setupFontSize = function(baseMenuItem) {
    let dropDown = Object.assign({}, baseMenuItem);

    dropDown.displayName = "Set Font Size";
    dropDown.id = "menubar-editor-font-size";
    dropDown.tooltip = "Set Font Size";
    dropDown.ttdirection = "top";
    dropDown.placeholder = "Font Size";
    dropDown.ddcallback = this.setFontSize.bind(this);
    dropDown.width = 60;
    dropDown.row = 2;
    dropDown.dropDownEntries = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 350, 400, 450, 500];
    this.setDropDown(dropDown);
};

Ace.prototype.setFontSize = function(selected) {
    let editor = this.getActiveEditor();
    if(typeof editor !== "undefined") { console.log("GOT VALUE: ", selected.value); editor.setFontSize(selected.value + "px") };
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
    dropDown.ttdirection = "bottom";
    dropDown.placeholder = "Theme";
    dropDown.ddcallback = this.dropDownClicked.bind(this, this.themes, "theme");
    dropDown.row = 2;

    this.getDropDownList("theme-", this.themes, "Error finding themes: ").then(() => {
        dropDown.dropDownEntries = [...this.themes.keys()];
        this.setDropDown(dropDown);
    });
};

Ace.prototype.setupKeyBindingDropDown = function(baseMenuItem) {
    let dropDown = Object.assign({}, baseMenuItem);

    dropDown.displayName = "Select Key Binding";
    dropDown.id = "menubar-key-binding";
    dropDown.tooltip = "Select Key Binding";
    dropDown.ttdirection = "top";
    dropDown.placeholder = "Key binding";
    dropDown.ddcallback = this.dropDownClicked.bind(this, this.keybindings, "keybinding");
    dropDown.row = 1;

    this.keybindings.set("Default", null);
    this.getDropDownList("keybinding-", this.keybindings, "Error finding themes: ").then(() => {
        dropDown.dropDownEntries = [...this.keybindings.keys()];
        this.setDropDown(dropDown);
    });
};

Ace.prototype.getDropDownList = async function(pattern, theMap, errorDesc) {
    return FindFiles(
        path.join(this.pluginPath, BASE_DIR),
        this.setupDropDownMenuItems.bind(this, theMap), pattern
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
    dropDown.ttdirection = "bottom";
    dropDown.placeholder = "Language";
    dropDown.ddcallback = this.dropDownClicked.bind(this, this.languages, "language");
    dropDown.row = 2;

    this.getDropDownList("mode-", this.languages, "Error finding supported list of languages/file types: ").then(() => {
        dropDown.dropDownEntries = [...this.languages.keys()];
        this.setDropDown(dropDown);
    });
};

Ace.prototype.setupDropDownMenuItems = function(theMap, filterFile) {
    let filterName = filterFile.replace(/[^-]*-([^\.]*).js/g, '$1');
    theMap.set(filterName, filterFile);
};

Ace.prototype.dropDownClicked = function(theMap, type, selected) {
    let object = theMap.get(selected.value);
    if(typeof object !== "undefined" && object !== null) {
        require("./" + theMap.get(selected.value));
    }

    let editor = this.getActiveEditor();
    if(typeof editor !== "undefined") {
        switch(type) {
            case "theme":
                editor.setTheme("ace/theme/" + selected.value);
                break;
            case "language":
                const LanguageMode = ace.require("ace/mode/" + selected.value).Mode;
                editor.session.setMode(new LanguageMode());
                break;
            case "keybinding":
                if(selected.value.toLowerCase() === "default") {
                    editor.setKeyboardHandler(null);
                } else {
                    editor.setKeyboardHandler("ace/keyboard/" + selected.value);
                }
                break;
        }
    }
};

Ace.prototype.deleteEditor = function(editor) {
    editor.destroy();
    editor.container.remove();
};

// init logic
module.exports = Ace;
