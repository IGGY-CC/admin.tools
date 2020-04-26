// SOURCE FILE: admin.tools/src/main/scripts/plugins/RemoteDesktop/plugin_remote_desktop.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const path = require('path');

let RemoteViewer = function() {
    this.pluginName = "RemoteViewer";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.position = 5;
};

RemoteViewer.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
RemoteViewer.prototype.Start = function() {
    this.setupToolIcon();
    this.setupMenuItems();
};

RemoteViewer.prototype.setupToolIcon = function() {
    this.tool  = {
        pluginName: this.pluginName,
        id: "toolbar-remote-viewer-cultuzz",
        tooltip: "Cultuzz W2004",
        icon: "fab fa-reddit-alien",
        callback: this.onNewConnection.bind(this, "cultuzz_server"),
        color: "green",
        hcolor: "white",
        ttdirection: "right"
    };
    this.setTool(this.tool);
};

RemoteViewer.prototype.setupMenuItems = function() {
    this.menuItem  = {
        pluginName: this.pluginName,
        displayName: "Remoting",
        id: "menubar-remote-viewer",
        isActive: false,
    };

    this.setMenuItem(this.menuItem);

    let iconItem = {
        pluginName: this.pluginName,
        row: 1,
        id: "menubar-remote-cultuzz",
        tooltip: "Cultuzz W2003",
        icon: "fas fa-folder-plus",
        callback: this.onNewConnection.bind(this, "cultuzz_server"),
        color: "green",
        hcolor: "white",
        ttdirection: "top"
    };

    this.setMenuIcon(iconItem);

    this.addMenuItem(this.menuItem, "Jumpbox", "menubar-remote-jumpbox",
        "fas fa-haykal", this.onNewConnection.bind(this, "jumpbox"), "bottom", 1);

    this.addMenuItem(this.menuItem, "CentOS Linux", "menubar-remote-centos",
        "fab fa-centos", this.onNewConnection.bind(this, "centos"), "bottom", 1);

    this.addMenuItem(this.menuItem, "Kali Linux", "menubar-remote-kali",
        "fas fa-fire", this.onNewConnection.bind(this, "kali"), "bottom", 1);

    this.addMenuItem(this.menuItem, "Jumpbox2", "menubar-remote-jumpbox2",
        "fab fa-reddit-alien", this.onNewConnection.bind(this, "jumpbox2"), "bottom", 1);

    this.addMenuItem(this.menuItem, "PXE", "menubar-remote-pxe",
        "fas fa-mug-hot", this.onNewConnection.bind(this, "pxe"), "bottom", 1);
};

RemoteViewer.prototype.onNewConnection = function(name) {
    if(TabContent.has(ActiveTab.id)) { //TODO DEMO PURPOSE
        console.error("There already exists an object in this window");
        // return
    }

    let serverContainerID = this.getActiveElement().id + "-remote-" + name;
    let serverContainer = UtilsUI.createNewElement('div', this.getActiveElement(), serverContainerID);
    serverContainer.style.position = "relative";
    serverContainer.style.maxHeight = this.getActiveElement().style.height;
    serverContainer.style.maxWidth = this.getActiveElement().style.width;
    serverContainer.style.height = this.getActiveElement().style.height;
    serverContainer.style.width = this.getActiveElement().style.width;
    serverContainer.style.boxSizing = "border-box";

    const URL = this.scrapeURL(name, serverContainer);
    serverContainer.style.visibility = "hidden";
    setTimeout(() => {serverContainer.style.visibility = ""}, 2000);
    TabContent.set(ActiveTab.id, serverContainer);
};

RemoteViewer.prototype.scrapeURL = function(name, parent) {
    let sandbox = UtilsUI.createNewElement('iframe', parent, parent.id + "-frame");
    sandbox.sandbox="allow-same-origin allow-scripts allow-forms";
    sandbox.src="http://localhost:8888/guacamole-1.1.0/#/";
    sandbox.style="border: 0; overflow: hidden";
    sandbox.style.width = parent.style.width;
    sandbox.style.height = parent.style.height;
    sandbox.onload = this.onFrameLoaded.bind(this, sandbox, name);

    /**
     * Refocuses the iframe containing Guacamole if the user is not already
     * focusing another non-body element on the page.
     */
    const refocusGuacamole = function refocusGuacamole() {
        // Do not refocus if focus is on an input field
        const focused = document.activeElement;
        if (focused && focused !== document.body)
            return;

        // Ensure iframe is focused
        sandbox.focus();

    };

    // Attempt to refocus iframe upon click or keydown
    // document.addEventListener('click', refocusGuacamole);
    document.addEventListener('keydown', refocusGuacamole);
};

RemoteViewer.prototype.onFrameLoaded = function(sandbox, name) {
    // TODO: THIS IS A SEVERE SECURITY HOLE. REMOVE IT OR DO IT IN SOME OTHER WAY
    // Someone can use a local html file and execute the same thing as if coming from this application.
    sandbox.contentWindow.postMessage("sanjeev:12345678:" + name, sandbox.src);
    // this.activateServer(sandbox);
};

// init logic
module.exports = RemoteViewer;
