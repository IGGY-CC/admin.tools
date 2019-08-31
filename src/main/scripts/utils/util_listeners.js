// SOURCE FILE: admin.tools/src/main/scripts/utils/util_listener.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let UtilListeners = function() {
    this.boundListeners = new Map();
};

UtilListeners.prototype.switchOn = function(on, listeners) {
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
};

UtilListeners.prototype.addRemoveListener = function(on, fn, name, remove=false, element=window) {
    let listeners = [];
    this.switchOn(on, listeners);

    listeners.forEach(listener => {
        if(remove) {
            let fnArray = this.removeFromBoundListeners(name, listener);
            fnArray.forEach(fn => {
                let obj = fn.get(listener);
                obj.element.removeEventListener(listener, obj.fn);
            });
        } else {
            this.addToBoundListeners(name, listener, fn , element);
            element.addEventListener(listener, fn, {passive: true});
        }
    });
};

UtilListeners.prototype.addToBoundListeners = function(name, listener, fn, element) {
    let existingArr = this.boundListeners.get(name);
    if(typeof existingArr === "undefined") existingArr = [];

    let map = new Map();
    map.set(listener, { fn: fn, element: element });

    existingArr.push(map);
    this.boundListeners.set(name, existingArr);
};

UtilListeners.prototype.removeFromBoundListeners = function(name, listener) {
    let registeredListenerMaps = this.boundListeners.get(name);
    let fnArray = registeredListenerMaps.filter(value => value.has(listener));
    this.boundListeners.set(name, registeredListenerMaps.filter(value => !value.has(listener)));
    return fnArray;
};

module.exports = new UtilListeners();