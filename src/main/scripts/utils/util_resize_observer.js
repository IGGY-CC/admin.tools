// SOURCE FILE: admin.tools/src/main/scripts/utils/util_resize_observer.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let util = require("./util");

util.ResizeObserver = function () {
    this.resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target.handleResize) entry.target.handleResize(entry);
        }
    });
};

util.ResizeObserver.prototype.observe = function (element) {
    this.resizeObserver.observe(element);
};

util.ResizeObserver.prototype.handleResize = function (element, fn) {
    document.querySelector("#" + element).handleResize = (e) => {
        fn(e);
    };
};

let resizeObserver = new util.ResizeObserver();
module.exports = resizeObserver;

