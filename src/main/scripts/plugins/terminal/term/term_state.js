// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_state.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced or copy-modified from
// The Chromium OS wam project.

'use strict';

let term = require("./term");

term.binding.Ready = function() {

    this.readyState = term.binding.Ready.state.WAIT;

    this.isOpen = false;

    this.readyValue = null;
    this.closeReason = null;
    this.closeValue = null;

    this.onReady = new term.Event(function(value) {
        this.readyValue = value;
        this.readyState = term.binding.Ready.state.READY;
        this.isOpen = true;
    }.bind(this));

    this.onClose = new term.Event(function(reason, value) {
        this.closeReason = (reason === 'ok' ? 'ok' : 'error');
        this.closeValue = value;
        this.isOpen = false;

        if (reason === 'ok') {
            this.readyState = term.binding.Ready.state.CLOSED;
        } else {
            this.readyState = term.binding.Ready.state.ERROR;
        }
    }.bind(this));
};

term.binding.Ready.state = {
    WAIT: 'WAIT',
    READY: 'READY',
    ERROR: 'ERROR',
    CLOSED: 'CLOSED'
};

term.binding.Ready.prototype.isReadyState = function(/* stateName , ... */) {
    for (let i = 0; i < arguments.length; i++) {
        let stateName = arguments[i];
        if (!term.binding.Ready.state.hasOwnProperty(stateName))
            throw new Error('Unknown state: ' + stateName);

        if (this.readyState === term.binding.Ready.state[stateName])
            return true;
    }

    return false;
};

term.binding.Ready.prototype.assertReady = function() {
    if (this.readyState !== term.binding.Ready.state.READY)
        throw new Error('Invalid ready call: ' + this.readyState);
};

term.binding.Ready.prototype.assertReadyState = function(/* stateName , ... */) {
    if (!this.isReadyState.apply(this, arguments))
        throw new Error('Invalid ready call: ' + this.readyState);
};

term.binding.Ready.prototype.dependsOn = function(otherReady) {
    otherReady.onClose.addListener(function() {
        if (this.isReadyState('CLOSED', 'ERROR'))
            return;

        this.closeError('term.Error.ParentClosed',
            [otherReady.closeReason, otherReady.closeValue]);
    }.bind(this));
};

term.binding.Ready.prototype.reset = function() {
    this.assertReadyState('WAIT', 'CLOSED', 'ERROR');
    this.readyState = term.binding.Ready.state['WAIT'];
};

term.binding.Ready.prototype.ready = function(value) {
    this.assertReadyState('WAIT');
    this.onReady(value);
};

term.binding.Ready.prototype.closeOk = function(value) {
    this.assertReadyState('READY');
    this.onClose('ok', value);
};

term.binding.Ready.prototype.closeErrorValue = function(value) {
    this.assertReadyState('READY', 'WAIT');
    this.onClose('error', value);
};

term.binding.Ready.prototype.closeError = function(name, arg) {
    this.closeErrorValue(term.mkError(name, arg));
};

module.exports = term.binding.Ready;