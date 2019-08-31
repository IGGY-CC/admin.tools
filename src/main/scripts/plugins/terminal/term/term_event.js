// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_event.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced or copy-modified from
// The Chromium OS wam project.

'use strict';

let term = require("./term");

/**
 * An event is a JavaScript function with addListener and removeListener
 * properties.
 *
 * When the endpoint function is called, the firstCallback will be invoked,
 * followed by all of the listeners in the order they were attached, then
 * the finalCallback.
 *
 * The returned function will have the list of callbacks, excluding
 * opt_firstCallback and opt_lastCallback, as its 'observers' property.
 *
 * @param {function(...)} opt_firstCallback The optional function to call
 *     before the observers.
 * @param {function(...)} opt_finalCallback The optional function to call
 *     after the observers.
 *
 * @return {function(...)} A function that, when called, invokes all callbacks
 *     with whatever arguments it was passed.
 */
term.Event = function(opt_firstCallback, opt_finalCallback) {
    let ep = function() {
        let args = Array.prototype.slice.call(arguments);

        let rv;
        if (opt_firstCallback)
            rv = opt_firstCallback.apply(null, args);

        if (rv === false)
            return;

        for (let i = ep.observers.length - 1; i >= 0; i--) {
            let observer = ep.observers[i];
            observer[0].apply(observer[1], args);
        }

        if (opt_finalCallback)
            opt_finalCallback.apply(null, args);
    };

    /**
     * Add a callback function.
     *
     * @param {function(...)} callback The function to call back.
     * @param {Object} opt_obj The optional |this| object to apply the function
     *     to.  Use this rather than bind when you plan on removing the listener
     *     later, so that you don't have to save the bound-function somewhere.
     */
    ep.addListener = function(callback, opt_obj) {
        if (!callback)
            throw new Error('Missing param: callback');

        ep.observers.unshift([callback, opt_obj]);
    };

    /**
     * Remove a callback function.
     */
    ep.removeListener = function(callback, opt_obj) {
        for (let i = 0; i < ep.observers.length; i++) {
            if (ep.observers[i][0] === callback && ep.observers[i][1] === opt_obj) {
                ep.observers.splice(i, 1);
                break;
            }
        }
    };

    ep.observers = [];

    return ep;
};

module.exports = term.Event;