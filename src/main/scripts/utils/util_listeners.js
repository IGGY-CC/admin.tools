// SOURCE FILE: admin.tools/src/main/scripts/utils/util_listener.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let util = require("./util");

util.Listeners = function() {
    this.boundListeners = [];
};

util.Listeners.prototype.addRemoveListener = function(on, fn, remove=false, element=window) {
    let listeners = [];

    switch(on) {
        case "mousedown":
        case "touchstart":
            listeners.push("mousedown");
            listeners.push("touchstart");
            break;
        case "mousemove":
        case "touchmove":
            listeners.push("mousemove");
            listeners.push("touchmove");
            break;
        case "mouseup":
        case "touchend":
            listeners.push("mouseup");
            listeners.push("touchend");
            break;

    }
    listeners.forEach(listener => {
        if(remove) {
            element.removeEventListener(listener, this.boundListeners[listener]);
        } else {
            this.boundListeners[listener] = fn;
            element.addEventListener(listener, fn);
        }
    });
};

let listeners = new util.Listeners();
module.exports = listeners;