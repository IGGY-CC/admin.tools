'use strict';
const path = require('path');

let Welcome = function() {
    this.pluginName = "Welcome";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);

    this.position = 1;
    this.storage = null;
    this.keys = null;
};

Welcome.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Welcome.prototype.Start = function() {
    this.setupUI(document.querySelector("#grid-1-grid-1-1"));
};

Welcome.prototype.setupUI = function(parent) {
    this.setActiveTabName("Welcome");
    const baseElement = UtilsUI.createNewElement('div', parent, "welcome-page", "welcome-grid-container");
    baseElement.style.overflow = "auto";
    this.content = UtilsUI.createNewElement('div', baseElement, "welcome-page-content", "content-area");
    this.content.style.overflow = "auto";
    this.mocha = UtilsUI.createNewElement('div', this.content, "mocha");
    this.mocha.style.overflow = "auto";
    // const logsBG = UtilsUI.createNewElement('div', baseElement, "welcome-page-logs", "logs-area");
    // this.logs = UtilsUI.createNewElement('div', logsBG, "", "message-background-holder");
    // this.additional = UtilsUI.createNewElement('div', baseElement, "welcome-page-additional", "additional-data");
};

// init logic
module.exports = Welcome;