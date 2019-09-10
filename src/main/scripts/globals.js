// SOURCE FILE: admin.tools/src/main/scripts/globals.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const GridWindow = require('./window-grid/window-grid');

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
    let gridWindow_ = new GridWindow("#grid-container", "#grid-container > div > .resize-handle");
    gridWindow_.hideCell("toolbar-tab-content", false, GridWindow.constants.RIGHT);
    gridWindow_.hideCell("right-tab-content", false, GridWindow.constants.LEFT);
    gridWindow_.hideCell("bottom-tab-content", true, GridWindow.constants.TOP);
};

Globals.OnLoad.prototype.InitPlugins = function() {
    const loadPlugins = require('./utils/util_load_plugins');
};

/* Init */
new Globals.OnLoad();