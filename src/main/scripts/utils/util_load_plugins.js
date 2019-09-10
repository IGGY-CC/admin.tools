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
    this.loadedPlugins = new Map();

    this.searchPlugins().then(()=> {
        this.startPlugins();
    });
};

LoadPlugins.prototype.setupPlugin = function(plugin_) {
    //TODO: Do all the security checks before initialization

    // utilsHTML.loadJS(plugin_);
    let Plugin = require(path.resolve(__dirname, PLUGIN_PATH_INT, plugin_));
    let pluginObject = new Plugin();
    pluginObject.pluginPath = path.join(__dirname, PLUGIN_PATH_INT);
    let objArray = this.loadedPlugins.get(pluginObject.position);
    if(typeof objArray === "undefined") {
        this.loadedPlugins.set(pluginObject.position, [pluginObject]);
    } else {
        objArray.push(pluginObject);
    }
};

LoadPlugins.prototype.searchPlugins = async function() {
    return FindFiles(
        PLUGIN_PATH_EXT,
        this.setupPlugin.bind(this), "plugin_"
    ).catch(
        error => {
            console.log("Error Finding/Initializing plugin: ", error);
        }
    );
};

LoadPlugins.prototype.startPlugins = function() {
    let keys = [...this.loadedPlugins.keys()];
    keys.sort((a,b) => {
        return (a > b)? 1 : (a < b)? -1 : 0;
    }).forEach(index => {
       this.loadedPlugins.get(index).forEach(plugin => plugin.Start());
    });
};

module.exports = new LoadPlugins();
