// SOURCE FILE: admin.tools/src/main/scripts/utils/util_resizer.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let util = require("./util");

util.Resizer = function () {
    this.callbacks = [];
    window.onresize = this.execCallbacks.bind(this);
    this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target.handleResize) entry.target.handleResize(entry);
        }
    });
};

util.Resizer.prototype.onResize = function(callback) {
    this.callbacks.push(callback);
};

util.Resizer.prototype.execCallbacks = function(e) {
    this.callbacks.forEach(callback => callback(e))
};

util.Resizer.prototype.observe = function (element) {
    this.resizeObserver.observe(this.getElement(element));
};

util.Resizer.prototype.handleResize = function (element, fn) {
    this.getElement(element).handleResize = (e) => {
        fn(e);
    };
};

util.Resizer.prototype.getElement = function(element) {
    if(typeof element === "string") {
        element = document.querySelector("#" + element);
    }
    return element;
};

let resizer = new util.Resizer();
module.exports = resizer;

