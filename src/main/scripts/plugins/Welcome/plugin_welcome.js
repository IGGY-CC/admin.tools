'use strict';
const path = require('path');

let Welcome = {};
Welcome = function() {
    this.pluginName = "Welcome";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);

    this.position = 1;
    this.logs = []; // div array
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

    this.content = UtilsUI.createNewElement('div', baseElement, "welcome-page-content", "content-area");
    const logsBG = UtilsUI.createNewElement('div', baseElement, "welcome-page-logs", "logs-area");
    this.logs = UtilsUI.createNewElement('div', logsBG, "", "message-background-holder");
    this.additional = UtilsUI.createNewElement('div', baseElement, "welcome-page-additional", "additional-data");

    ADD_CONSOLE(this.addMessage.bind(this));
    console.log("hello, world!");
    console.warn("test");
    console.error("nothing really!");
};

Welcome.prototype.addMessage = function(message, type) {
    const entry = UtilsUI.createNewElement('div', this.logs, "", "message-holder");
    const dateElem = UtilsUI.createNewElement('div', entry, "", "date-and-time");
    dateElem.innerHTML = getDate();
    const msgElem = UtilsUI.createNewElement('div', entry, "", "messages message-"+type);
    msgElem.innerHTML = message;
    this.logs.scrollTop = this.logs.scrollHeight;
};

// init logic
module.exports = Welcome;