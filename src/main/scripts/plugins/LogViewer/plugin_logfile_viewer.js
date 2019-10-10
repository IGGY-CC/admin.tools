// SOURCE FILE: admin.tools/src/main/scripts/plugins/LogFileViewer/plugin_logfile_viewer.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let LogFileViewer = function () {
    this.pluginName = "LogFileViewer";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.position = 2;

    this.slideOut = null;
    this.logs = null; // div array
    this.connected = false;
};

LogFileViewer.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
LogFileViewer.prototype.Start = function () {
    let containerObject = {
        name: "Log Viewer",
        icon: "fa fa-shipping-fast",
        pluginPosition: this.position,
        location: RIGHT,
        isActive: true,
        isContentFixed: true,
        openCallback: this.getSlideOutContent.bind(this),
        closeCallback: this.removeSlideOutContent.bind(this),
        refreshCallback: this.refreshSlideOutContent.bind(this),
        requireHeader: true,
        maxSize: null,
        minSize: null,
        size: 300,
    };

    this.slideOut = this.createSlideOutEntry(containerObject);
    const logsBG = UtilsUI.createNewElement('div', this.slideOut.content, "welcome-page-logs", "logs-area");
    this.logs = UtilsUI.createNewElement('div', logsBG, "", "message-background-holder");
    ADD_CONSOLE(this.addMessage.bind(this));
    this.getSlideOutContent();
};

LogFileViewer.prototype.getSlideOutContent = async function() {
    if(!this.connected) {
        /* Setup Websocket */
        let wss = new Socket();
        wss.wss = "ws://"; // TODO: disable this line or change it to wss:// in production
        let sessionID = wss.generateSessionID();
        let encoded = {};
        wss.prepareDefaultEndPoint(sessionID, "logs", "logs", encoded);

        await wss.makeWSConnection(
            () => {
                console.error("ON CLOSE CALLED:")
            },
            () => {
                console.error("Rejected");
            },
            (connection) => {
                console.warn("Connected to Server.");
                this.connected = true;
            },
            () => {
            },
            (data) => {
                console.server(data)
                // console.log(data)
            }
        );
    }
};

LogFileViewer.prototype.removeSlideOutContent = function() {
    console.log("TODO: Removing default log content");
};

LogFileViewer.prototype.refreshSlideOutContent = function() {
    console.log("TODO: Refresh default log content");
};

LogFileViewer.prototype.addMessage = function(message, type) {
    // TODO: BAD CODE, JUST FOR DEMO PURPOSES
    const rightContent = document.querySelector("#right-tab-bar");
    const cs = getComputedStyle(rightContent);
    this.slideOut.content.style.height = parseInt(cs.height) - this.slideOut.headerHeight + "px";


    //
    const entry = UtilsUI.createNewElement('div', this.logs, "", "message-holder");
    const dateElem = UtilsUI.createNewElement('div', entry, "", "date-and-time");
    dateElem.innerHTML = getDate();
    if(message.startsWith("[SSH")) {
        const msgElem = UtilsUI.createNewElement('div', entry, "", "messages message-SSH");
        msgElem.innerHTML = message;
    } else {
        const msgElem = UtilsUI.createNewElement('div', entry, "", "messages message-"+type);
        msgElem.innerHTML = message;
    }

    // this.logs.scrollTop = this.logs.scrollHeight;
    this.slideOut.content.scrollTop = this.slideOut.content.scrollHeight;
};

// init logic
module.exports = LogFileViewer;