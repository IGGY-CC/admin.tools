// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_terminal_window.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced or copy-modified from
// The Chromium OS wash project.


'use strict';

const term = require("./term");
const terminalManager = require("./term_terminal_manager");
const randomFile = require("../../../utils/util_random_file");
const Event = require("../term/term_event");
const Termcap = require("../term/term_termcap");
const ExecutionContext = require("../term/term_execution_context");
const ReadLine = require("../term/term_readline");
const JarvisReadLine = require("../term/term_jarvis_readline");
const CommandManager = require("../term/term_command_manager");

term.jarvis = {
    symbol: "🤖",
    triggerText: "jarvis",
};

/**
 * A window containing an instance of (currently) hterm.
 */
term.TerminalWindow = function(id, parent) {
    this.id = id;
    this.term = null;
    this.readline = null;
    this.inputHistory = [];
    this.contentNode_ = null;
    this.document_ = null;
    this.promptString_ = null;
    this.defaultPromptString_ = null;

    this.terminalWindow = terminalManager.createTerminal(parent, this.onTerminalCreated_.bind(this));
    this.backgroundImage = true;
    this.numberOfCommands = 0;
    this.commandManager = new CommandManager();
    this.commander = null;
    this.isSSHActive = false;
    this.remote = true;
    this.inJarvis = false;

    /**
     * Event we invoke when async init is complete.
     */
    this.onInit = new Event(this.onInit_.bind(this));
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
    let tc_ = new Termcap();
    if(this.defaultPromptString_ === null) {
        this.defaultPromptString_ = tc_.output('%set-attr(FG_BOLD, FG_CYAN)t #' + terminalManager.count() + '> %set-attr()');
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
    this.term.prefs_.set('enable-blink', true);
    this.term.prefs_.set('backspace-sends-backspace', true);
    this.term.prefs_.set('font-smoothing', 'subpixel-antialiased');
    this.term.prefs_.set('enable-bold', true);
    this.term.prefs_.set('enable-bold-as-bright', true);
    this.term.prefs_.set('ctrl-v-paste', true);
    this.term.prefs_.set('mouse-right-click-paste', true);
    this.term.prefs_.set('cursor-blink', true);
    this.term.prefs_.set('cursor-color', "blue");
    this.term.prefs_.set('cursor-shape', "BLOCK");
    this.term.prefs_.set('cursor-blink-cycle', [600, 300]);
    this.changeBackground();
};

term.TerminalWindow.prototype.changeBackground = function(doTurnoff) {
    // Disabled due to Content-Security-Policy rule
    if(this.backgroundImage && !doTurnoff) {
        randomFile("./src/main/scripts/plugins/terminal/term/backgrounds/").then(file => {
            this.term.prefs_.set('background-image', 'url(../scripts/plugins/terminal/term/backgrounds/' + file + ')');
            if(file.startsWith("b-")) {
                this.foregroundColor = "black";
                this.term.prefs_.set('foreground-color', this.foregroundColor);
            } else {
                this.foregroundColor = "white";
                this.term.prefs_.set('foreground-color', this.foregroundColor);
            }
        }).catch(err => {
            console.log(err);
            this.term.prefs_.set('background-image', 'url(https://goo.gl/anedTK)');
        });

        this.term.prefs_.set('background-position', "center");
    } else {
        this.term.prefs_.set('background-image', "");
    }
};

term.TerminalWindow.prototype.switchColor = function() {
    this.foregroundColor = (this.foregroundColor === "black")? "white" : "black";
    this.term.prefs_.set('foreground-color', this.foregroundColor);
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
    this.createContext();
    // this.executeContext = ExecutionContext.createExecuteContext();
    // this.executeContext.setEnvs(this.defaultEnv);
    // this.executeContext.onClose.addListener(this.onExecuteClose_, this);
    // this.executeContext.onStdOut.addListener(this.onStdOut_, this);
    // this.executeContext.onStdErr.addListener(this.onStdOut_, this);
    // this.executeContext.onTTYRequest.addListener(this.onTTYRequest_, this);
    // this.executeContext.setTTY({rows: this.term.io.rowCount, columns: this.term.io.columnCount});
    //
    // this.executeContext.onReady.addListener(function() {
    //     console.log('TerminalWindow: execute ready');
    // });
    //
    // this.executeContext.onClose.addListener(function(reason, value) {
    //     console.log('TerminalWindow: execute closed: ' + reason +
    //         JSON.stringify(value));
    // });
    //
    // this.executeContext.arg = {promptString: this.promptString_, inputHistory: this.inputHistory};
    // this.readline = ReadLine.main(this.executeContext);
    // this.readline.onCursorReport(0, 0);
    // // this.executeContext.execute(this.commandPath, this.commandArg);
};

term.TerminalWindow.prototype.createContext = function() {
    this.executeContext = ExecutionContext.createExecuteContext();
    this.executeContext.setEnvs(this.defaultEnv);
    this.executeContext.onClose.addListener(this.onExecuteClose_, this);
    this.executeContext.onStdOut.addListener(this.onStdOut_, this);
    this.executeContext.onStdErr.addListener(this.onStdOut_, this);
    this.executeContext.onTTYRequest.addListener(this.onTTYRequest_, this);
    this.executeContext.setTTY({rows: this.term.io.rowCount, columns: this.term.io.columnCount});

    this.executeContext.onReady.addListener(function() {
        console.log('TerminalWindow-internal: execute ready');
    });

    this.executeContext.onClose.addListener(function(reason, value) {
        // console.log('TerminalWindow: execute closed: ' + reason +
        //     JSON.stringify(value));
    });

    this.executeContext.arg = {
        promptString: this.promptString_,
        inputHistory: this.inputHistory,
        rows: this.term.io.rowCount,
        columns: this.term.io.columnCount,
    };

    this.readline = ReadLine.main(this.executeContext);
    // this.readline.onCursorReport(this.numberOfCommands++, 0);
    // return this.executeContext;
};

term.TerminalWindow.prototype.createJarvisContext = function() {
    const arg = {
        promptString: this.promptString_,
        inputHistory: [], // this.inputHistory,
        rows: this.term.io.rowCount,
        columns: this.term.io.columnCount,
        jarvis: term.jarvis,
        tty: {
            isatty: false,
            rows: this.term.io.rowCount,
            columns: this.term.io.columnCount,
            interrupt: String.fromCharCode('C'.charCodeAt(0) - 64)  // ^C
        }
    };

    this.jarvisReadline = JarvisReadLine.main(arg);
};
/**
 * The default command exited.
 */
term.TerminalWindow.prototype.onExecuteClose_ = async function(reason, value) {
    if (reason === 'ok') {
        this.inputHistory.unshift(value);
        this.createContext();
        this.createJarvisContext();
        const sshIsActive = () => { this.isSSHActive = true };

        if (!this.commander) {
            this.commander = this.commandManager.execute(this.id, value, this.executeContext,
                this.onSSHClose.bind(this), sshIsActive);
        } else {
            this.commander.execute(value, this.executeContext, this.onSSHClose.bind(this), sshIsActive);
        }

    } else {
        this.print('Error executing: ' + JSON.stringify(value));
    }
};

term.TerminalWindow.prototype.onSSHClose = function(closeMessage) {
    this.createContext();
    if(closeMessage) {
        // this.onSendString_(closeMessage);
        this.executeContext.stderr(closeMessage + "\r\n", ()=>{});
        this.createContext();
    }
};

term.TerminalWindow.prototype.onTTYRequest_ = function(request) {
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
    if(!this.executeContext) {
        console.log("Execution Context is not ready: ", str);
        return;
    }
    if (this.executeContext.isReadyState('READY')) {
        let interruptChar = this.executeContext.getTTY().interrupt;
        if (interruptChar && str === interruptChar) {
            term.async(function() {
                // TODO: Handle Interrupts
                console.log('term.Signal.Interrupt');
            }, [this]);
        } else {
            this.interpretJarvis(str);
            if(this.remote) {
                term.async(() => {this.executeContext.stdin(str)}, [this]);
            }
            this.remote = true;
        }
    } else {
        console.warn('Execute not ready, ignoring input: ' + str);
    }
};

term.TerminalWindow.prototype.interpretJarvis = function(str) {
    this.remote = true;
    if(this.jarvisReadline) {
        this.jarvisReadline.onStdIn_(str);
        // The very first time, we encountered Jarvis
        if(this.jarvisReadline.isJarvis && !this.inJarvis) {
            let position = this.jarvisReadline.linePosition;
            for(let index = 0; index < position; index++) {
                /* delete from jarvis buffer */
                this.jarvisReadline.onStdIn_('\x7f');

                /* delete from terminal buffer */
                term.async(() => {
                    this.executeContext.stdin('\x7f')
                }, [this]);
            }
            this.jarvisReadline.onStdIn_(term.jarvis.symbol);
            term.async(() => {
                this.executeContext.stdin(term.jarvis.symbol);
            }, [this]);
            this.inJarvis = true;
            this.remote = false;
            this.jarvisReadline.callback = this.jarvisCommand.bind(this);
        }
    }
};

term.TerminalWindow.prototype.jarvisCommand = function() {
    let command = this.jarvisReadline.line;
    let position = this.jarvisReadline.linePosition;

    console.log("FINAL COMMAND RECEIVED IS: ", this.jarvisReadline.line);
    for(let index = 0; index < position; index++) {
        /* delete from jarvis buffer */
        this.jarvisReadline.onStdIn_('\x7f');

        /* delete from terminal buffer */
        term.async(() => {
            this.executeContext.stdin('\x7f')
        }, [this]);
    }
    this.remote = false;
    this.inJarvis = false;
    this.jarvisReadline.isJarvis = false;
    this.jarvisReadline.callback = () => {};
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

module.exports = term.TerminalWindow;