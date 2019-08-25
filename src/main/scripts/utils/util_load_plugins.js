// SOURCE FILE: admin.tools/src/main/scripts/util/util_load_plugins.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let path = require("path");
let FindFiles = require("./util_find_files");
let utilsHTML = require( "./util_load_html");

const PLUGIN_PATH_EXT = "./src/main/scripts/plugins/";
const PLUGIN_PATH_INT = "../plugins";

let LoadPlugins = function() {
    this.searchPlugins();
};

LoadPlugins.prototype.setupPlugin = function(plugin_) {
    //TODO: Do all the security checks before initialization

    // utilsHTML.loadJS(plugin_);
    let Plugin = require(path.resolve(__dirname, PLUGIN_PATH_INT, plugin_));
    let pluginObject = new Plugin();
    pluginObject.Start();
};

LoadPlugins.prototype.searchPlugins = function() {
    FindFiles(
        PLUGIN_PATH_EXT,
        this.setupPlugin.bind(this), "plugin_"
    ).catch(
        error => {
            console.log("Error Finding/Initializing plugin: ", error);
        }
    );
};

module.exports = new LoadPlugins();
