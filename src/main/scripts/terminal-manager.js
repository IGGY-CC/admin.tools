// SOURCE FILE: admin.tools/src/main/scripts/terminal-manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

'use strict';

var admin = require("./terminal");

/**
 * @fileoverview Declares the control.* namespace.
 */
var control = {};

control.TerminalManager = function(parent) {
    this.parent = document.querySelector(parent);
    this.terminals = {};
    this.currentLayout = 1;
    this.gridElement = null;
    this.createGridManager();
    this.createFirstTerminal();
};

control.TerminalManager.prototype.checkTerminal = function(name) {
    if (this.terminals.get(name) !== undefined) {
        throw console.error("A terminal with given name already exists!");
    }
    return true;
};

control.TerminalManager.prototype.createGridManager = function() {
    this.gridElement = document.createElement("div");
    this.gridElement.style.display = "grid";
    this.gridElement.style["grid-template-rows"] = "100%";
    this.gridElement.style["grid-template-columns"] = "100%";
    this.gridElement.style["width"] = "100%";
    this.gridElement.style["height"] = "100%";
    this.parent.appendChild(this.gridElement);
};

control.TerminalManager.prototype.createFirstTerminal = function() {
    /* create element to hold terminal */
    let terminalElem = document.createElement("div");
    terminalElem.setAttribute("id", "terminal");
    terminalElem.setAttribute("class", "base-terminal");
    terminalElem.style["width"] = "100%";
    terminalElem.style["height"] = "100%";
    this.gridElement.appendChild(terminalElem);
    this.terminals.terminal = terminalElem;

    /* create terminal */
    this.createTerminal("first", "#terminal");
};

control.TerminalManager.prototype.createTerminal = function(name, parent) {
    let terminal = new admin.Terminal(name, parent);
    this.terminals[name] = terminal;
};

control.TerminalManager.prototype.splitVertical = function(current) {
    const styleElem = document.createElement("style");
    styleElem.setAttribute("type", "text/css");

    const grid = { rows: 2, cols: 4};
    let styleContent = `#GRID {
        display: grid;
        grid-template-columns: 50% 50%;

    }`;
};

var terminalManager = new control.TerminalManager('#first-terminal');
