// SOURCE FILE: admin.tools/src/main/scripts/utils/util_resizer.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let UtilsResizer = {};

UtilsResizer = function () {
    this.callbacks = [];
    window.onresize = this.execCallbacks.bind(this);
    this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target.handleResize) entry.target.handleResize(entry);
        }
    });
};

UtilsResizer.prototype.onResize = function(callback) {
    this.callbacks.push(callback);
};

UtilsResizer.prototype.execCallbacks = function(e) {
    this.callbacks.forEach(callback => callback(e))
};

UtilsResizer.prototype.observe = function (element) {
    this.resizeObserver.observe(this.getElement(element));
};

UtilsResizer.prototype.handleResize = function (element, fn) {
    this.getElement(element).handleResize = (e) => {
        fn(e);
    };
};

UtilsResizer.prototype.getElement = function(element) {
    if(typeof element === "string") {
        element = document.querySelector("#" + element);
    }
    return element;
};

module.exports = new UtilsResizer();
