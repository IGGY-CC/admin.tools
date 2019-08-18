// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_terminal_window.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced or copy-modified from
// The Chromium OS wash project.


'use strict';

let term = require("./term");
let terminalManager = require("./term_terminal_manager");
let randomFile = require("../utils/util_random_file");

/**
 * A window containing an instance of (currently) hterm.
 */
term.TerminalWindow = function(parent) {
    console.log('admin-tools: New terminal window.');
    this.term = null;
    this.readline = null;
    this.inputHistory = [];
    this.terminalWindow = terminalManager.createTerminal(parent, this.onTerminalCreated_.bind(this));
    this.contentNode_ = null;
    this.document_ = null;
    this.promptString_ = null;
    this.defaultPromptString_ = null;
    this.backgroundImage = true;
    /**
     * Event we invoke when async init is complete.
     */
    this.onInit = new term.Event(this.onInit_.bind(this));
};

term.TerminalWindow.prototype.defaultEnv = {TERM: 'xterm-256color'};

/**
 * Called when the platform app window is created.
 */
term.TerminalWindow.prototype.onTerminalCreated_ = function(contentNode) {
    this.contentNode_ = contentNode;
    this.document_ = contentNode.ownerDocument;

    this.document_.defaultView.addEventListener('resize', this.onResize_.bind(this));
    // TODO: Add close button
    // this.document_.querySelector('#term_window_close').addEventListener
    // ('click', function() { this.executeContext.closeOk(null) }.bind(this));

    this.setPrompt();
    this.onResize_();

    // TODO: make it generic so that another terminal targets can be used as well
    lib.init(this.setupHterm.bind(this), console.log.bind(this.log));
};

term.TerminalWindow.prototype.setPrompt = function(promptString) {
    let tc_ = new term.Termcap();
    if(this.defaultPromptString_ === null) {
        this.defaultPromptString_ = tc_.output('%set-attr(FG_BOLD, FG_CYAN)terminal #' + terminalManager.count() + '> %set-attr()');
        this.promptString_ = this.defaultPromptString_;
    }
    if(typeof promptString === 'string') {
        this.promptString_ = tc_.output(promptString);
    }
};

term.TerminalWindow.prototype.setupHterm = function() {
    hterm.defaultStorage = new lib.Storage.Memory();
    this.term = new hterm.Terminal('default');
    this.setTerminalDefaults();
    this.term.onTerminalReady = this.onInit;
    this.term.decorate(this.contentNode_);
    this.term.installKeyboard();

    this.term.io.onVTKeystroke = this.term.io.sendString = this.onSendString_.bind(this);
    this.term.io.onTerminalResize = this.onTerminalResize_.bind(this);

    this.document_.defaultView.addEventListener('keydown', this.onKeyDown_.bind(this));
};

/**
 * Setup defaults for the created terminal.
 */
term.TerminalWindow.prototype.setTerminalDefaults = function() {
    this.term.prefs_.set('scrollbar-visible', true);
    this.term.prefs_.set('enable-blink', false);
    this.term.prefs_.set('backspace-sends-backspace', true);
    this.term.prefs_.set('font-smoothing', 'subpixel-antialiased');
    this.term.prefs_.set('enable-bold', true);
    this.term.prefs_.set('enable-bold-as-bright', true);
    this.term.prefs_.set('ctrl-v-paste', true);
    this.term.prefs_.set('mouse-right-click-paste', true);

    // Disabled due to Content-Security-Policy rule
    if(this.backgroundImage) {
        randomFile("./src/main/scripts/terminals/backgrounds/").then(file => {
            this.term.prefs_.set('background-image', 'url(../scripts/terminals/backgrounds/' + file + ')');
        }).catch(err => {
            this.term.prefs_.set('background-image', 'url(https://goo.gl/anedTK)');
        });

        this.term.prefs_.set('background-position', "center");
    }
};

term.TerminalWindow.prototype.print = function(str) {
    this.term.io.print(str);
};

term.TerminalWindow.prototype.println = function(str) {
    this.term.io.println(str);
};

/**
 * Terminal Window initialization is done.
 */
term.TerminalWindow.prototype.onInit_ = function() {
    this.executeContext = term.binding.ExecuteContext.createExecuteContext();
    this.executeContext.setEnvs(this.defaultEnv);
    this.executeContext.onClose.addListener(this.onExecuteClose_, this);
    this.executeContext.onStdOut.addListener(this.onStdOut_, this);
    this.executeContext.onStdErr.addListener(this.onStdOut_, this);
    this.executeContext.onTTYRequest.addListener(this.onTTYRequest_, this);
    this.executeContext.setTTY({rows: this.term.io.rowCount, columns: this.term.io.columnCount});

    this.executeContext.onReady.addListener(function() {
        console.log('TerminalWindow: execute ready');
    });

    this.executeContext.onClose.addListener(function(reason, value) {
        console.log('TerminalWindow: execute closed: ' + reason +
            JSON.stringify(value));
    });

    this.executeContext.arg = {promptString: this.promptString_, inputHistory: this.inputHistory};
    this.readline = term.Readline.main(this.executeContext);
    this.readline.onCursorReport(0, 0);
};

/**
 * The default command exited.
 */
term.TerminalWindow.prototype.onExecuteClose_ = function(reason, value) {
    if (reason === 'ok') {
       // TODO: CLOSE THE TERMINAL
        // this.wmWindow_.close();
    } else {
        this.print('Error executing: ' +
            JSON.stringify(value));
    }
};

term.TerminalWindow.prototype.onTTYRequest_ = function(request) {
    console.log('tty request');
    if (typeof request.interrupt == 'string')
        this.executeContext.setTTY({interrupt: request.interrupt});
};

/**
 * Handle for inbound messages from the default command.
 */
term.TerminalWindow.prototype.onStdOut_ = function(str, opt_onAck) {
    if (typeof str === 'string') {
        str = str.replace(/\n/g, '\r\n');
    } else {
        str = JSON.stringify(str) + '\r\n';
    }

    this.print(str);
    if (opt_onAck)
        opt_onAck();
};

/**
 * Called by hterm.Terminal.IO for keyboard events.
 *
 * We just forward them on to the default command.
 */
term.TerminalWindow.prototype.onSendString_ = function(str) {
    if (this.executeContext.isReadyState('READY')) {
        let interruptChar = this.executeContext.getTTY().interrupt;
        if (interruptChar && str === interruptChar) {
            console.log('interrupt');
            term.async(function() {
                // TODO: Handle Interrupts
                console.log('term.Signal.Interrupt');
            }, [this]);
        } else {
            console.log("SENDING STRING: ", str);
            term.async(function() { this.executeContext.stdin(str) }, [this]);
        }
    } else {
        console.warn('Execute not ready, ignoring input: ' + str);
    }
};

/**
 * Called by hterm.Terminal.IO when the terminal size changes.
 *
 * We just forward them on to the default command.
 */
term.TerminalWindow.prototype.onTerminalResize_ = function(columns, rows) {
    if (this.executeContext && this.executeContext.isReadyState('READY'))
        this.executeContext.setTTY({columns: columns, rows: rows});
};

/**
 * Our own keyboard accelerators.
 */
term.TerminalWindow.prototype.onKeyDown_ = function(e) {
    if (e.ctrlKey && e.shiftKey && e.keyCode === ('R').charCodeAt())
        console.log("cltr+shift+R: Provided. Unhandled, this is in TODO list.");
        // TODO: define Accelerators and develop how to handle them
};

/**
 * Platform app window size changed.
 */
term.TerminalWindow.prototype.onResize_ = function() {
    let bodyRect = this.document_.body.getBoundingClientRect();
    let contentRect = this.contentNode_.getBoundingClientRect();
    this.contentNode_.style.height = (bodyRect.height - contentRect.top) + 'px';
};

let terminalWindow = new term.TerminalWindow("#first-terminal");