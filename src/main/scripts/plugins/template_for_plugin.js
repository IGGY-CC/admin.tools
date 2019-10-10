// SOURCE FILE: admin.tools/src/main/scripts/plugins/template_for_plugin.js
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
    // this.setupUI()
};

// init logic
module.exports = LogFileViewer;