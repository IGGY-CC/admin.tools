// SOURCE FILE: admin.tools/src/main/scripts/plugins/template_for_slideout_plugin.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let LogFileViewer = function () {
    this.pluginName = "LogFileViewer";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);

    this.position = 1;
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
    }
    this.createSlideOutEntry(containerObject);
};

LogFileViewer.prototype.getSlideOutContent = function() {
    console.log("TODO: Setting default log content");
};

LogFileViewer.prototype.removeSlideOutContent = function() {
    console.log("TODO: Removing default log content");
};

LogFileViewer.prototype.refreshSlideOutContent = function() {
    console.log("TODO: Refresh default log content");
};

// init logic
module.exports = LogFileViewer;