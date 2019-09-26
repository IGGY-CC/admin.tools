// SOURCE FILE: admin.tools/src/main/scripts/globals.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


/**
 * All initial startup logic goes here.
 * @constructor
 */
const Globals = {};

Globals.OnLoad = function() {
    this.InitMainGrid();
    this.InitPlugins();
};

Globals.OnLoad.prototype.InitMainGrid = function() {
    const mainGrid = require('./window-grid/desktop');
};

Globals.OnLoad.prototype.InitPlugins = function() {
    const loadPlugins = require('./utils/util_load_plugins');
};

/* Init */
new Globals.OnLoad();