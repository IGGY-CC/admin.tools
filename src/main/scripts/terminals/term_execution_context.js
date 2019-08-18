// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_execution_context.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced or copy-modified from
// The Chromium OS wam project.

'use strict';

let term = require("./term");

term.binding.ExecuteContext = function() {
    // We're a 'subclass' of term.binding.Ready.
    term.binding.Ready.call(this);

    /**
     * Events sourced by this binding in addition to the inherited events from
     * term.binding.Ready.
     *
     * These are raised after the corresponding method is invoked.  For example,
     * term.binding.terminal.signal(...) raises the onSignal event.
     */
    this.onSignal = new term.Event();
    this.onStdOut = new term.Event();
    this.onStdErr = new term.Event();
    this.onStdIn = new term.Event();
    this.onTTYChange = new term.Event();
    this.onTTYRequest = new term.Event();

    /**
     * The arg provided to the execute() method of this ExecuteContext.
     */
    this.arg = null;

    // The environment variables for this execute context.
    this.env_ = {};

    // The tty state for this execute context.
    this.tty_ = {
        isatty: false,
        rows: 0,
        columns: 0,
        interrupt: String.fromCharCode('C'.charCodeAt(0) - 64)  // ^C
    };
};

term.binding.ExecuteContext.prototype = Object.create(
    term.binding.Ready.prototype);

/**
 * Create an execute context
 */
term.binding.ExecuteContext.createExecuteContext = function() {
    return new term.binding.ExecuteContext();
};

/**
 * Return a copy of the internal tty state.
 */
term.binding.ExecuteContext.prototype.getTTY = function() {
    var rv = {};
    for (var key in this.tty_) {
        rv[key] = this.tty_[key];
    }

    return rv;
};

/**
 * Set the authoritative state of the tty.
 *
 * This should only be invoked in the direction of tty->executable.  Calls in
 * the reverse direction will only affect this instance and those derived (via
 * setCallee) from it, and will be overwritten the next time the authoritative
 * state changes.
 *
 * Executables should use requestTTY to request changes to the authoritative
 * state.
 *
 * The tty state is an object with the following properties:
 *
 *   tty {
 *     isatty: boolean, True if stdio-like methods are attached to a visual
 *       terminal.
 *     rows: integer, The number of rows in the tty.
 *     columns: integer, The number of columns in the tty.
 *     interrupt: string, The key used to raise an
 *       'wam.FileSystem.Error.Interrupt' signal.
 *   }
 *
 * @param {Object} tty An object containing one or more of the properties
 *   described above.
 */
term.binding.ExecuteContext.prototype.setTTY = function(tty) {
    this.assertReadyState('WAIT', 'READY');

    if ('isatty' in tty)
        this.tty_.isatty = !!tty.isatty;
    if ('rows' in tty)
        this.tty_.rows = tty.rows;
    if ('columns' in tty)
        this.tty_.columns = tty.columns;

    if (!this.tty_.rows || !this.tty_.columns) {
        this.tty_.rows = 0;
        this.tty_.columns = 0;
        this.tty_.isatty = false;
    } else {
        this.tty_.isatty = true;
    }

    if (tty.rows < 0 || tty.columns < 0)
        throw new Error('Invalid tty size.');

    if ('interrupt' in tty)
        this.tty_.interrupt = tty.interrupt;

    this.onTTYChange(this.tty_);

    if (this.callee)
        this.callee.setTTY(tty);
};

/**
 * Request a change to the controlling tty.
 *
 * At the moment only the 'interrupt' property can be changed.
 *
 * @param {Object} tty An object containing a changeable property of the
 *  tty.
 */
term.binding.ExecuteContext.prototype.requestTTY = function(tty) {
    this.assertReadyState('READY');

    if (typeof tty.interrupt == 'string')
        this.onTTYRequest({interrupt: tty.interrupt});
};

/**
 * Get a copy of the current environment variables.
 */
term.binding.ExecuteContext.prototype.getEnvs = function() {
    var rv = {};
    for (var key in this.env_) {
        rv[key] = this.env_[key];
    }

    return rv;
};

/**
 * Get the value of the given environment variable, or the provided
 * defaultValue if it is not set.
 *
 * @param {string} name
 * @param {*} defaultValue
 */
term.binding.ExecuteContext.prototype.getEnv = function(name, defaultValue) {
    if (this.env_.hasOwnProperty(name))
        return this.env_[name];

    return defaultValue;
};

/**
 * Overwrite the current environment.
 *
 * @param {Object} env
 */
term.binding.ExecuteContext.prototype.setEnvs = function(env) {
    this.assertReadyState('WAIT', 'READY');
    for (var key in env) {
        this.env_[key] = env[key];
    }
};

/**
 * Set the given environment variable.
 *
 * @param {string} name
 * @param {*} value
 */
term.binding.ExecuteContext.prototype.setEnv = function(name, value) {
    this.assertReadyState('WAIT', 'READY');
    this.env_[name] = value;
};

/**
 * Send stdout from this executable.
 *
 * This is not restricted to string values.  Recipients should filter out
 * non-string values in their onStdOut handler if necessary.
 *
 * TODO: Add numeric argument onAck to support partial consumption.
 *
 * @param {*} value The value to send.
 * @param {function()} opt_onAck The optional function to invoke when the
 *   recipient acknowledges receipt.
 */
term.binding.ExecuteContext.prototype.stdout = function(value, opt_onAck) {
    if (!this.isReadyState('READY')) {
        console.warn('Dropping stdout to closed execute context:', value);
        return;
    }

    this.onStdOut(value, opt_onAck);
};

/**
 * Send stderr from this executable.
 *
 * This is not restricted to string values.  Recipients should filter out
 * non-string values in their onStdErr handler if necessary.
 *
 * TODO: Add numeric argument onAck to support partial consumption.
 *
 * @param {*} value The value to send.
 * @param {function()} opt_onAck The optional function to invoke when the
 *   recipient acknowledges receipt.
 */
term.binding.ExecuteContext.prototype.stderr = function(value, opt_onAck) {
    if (!this.isReadyState('READY')) {
        console.warn('Dropping stderr to closed execute context:', value);
        return;
    }

    this.onStdErr(value, opt_onAck);
};

/**
 * Send stdout to this executable.
 *
 * This is not restricted to string values.  Recipients should filter out
 * non-string values in their onStdIn handler if necessary.
 *
 * TODO: Add opt_onAck.
 *
 * @param {*} value The value to send.
 */
term.binding.ExecuteContext.prototype.stdin = function(value) {
    this.assertReady();
    if (this.callee) {
        this.callee.stdin(value);
    } else {
        this.onStdIn(value);
    }
};
