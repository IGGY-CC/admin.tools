// SOURCE FILE: admin.tools/src/main/scripts/terminal.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.
'use strict';

/**
 * @fileoverview Declares the admin.* namespace.
 */
var admin = {};

/**
 * Constructor to generate a Terminal.
 *
 * The terminal prepares a hterm.Terminal with a set defaults and creates
 * the default environment to handle its values.
 *
 * @param {string} name A profile name to reference the terminal with.
 * @param {HTMLDivElement} parent The reference to the parent div, # prepended, 
 * under which the terminal needs to be created.
 * 
 */
admin.Terminal = function (name, parent) {

    this.name = name;
    this.parent = document.querySelector(parent);
    this.terminal = null;
    this.io = null;
    this.input = '';
    this.history = [];
    this.histTravCount = 0;
    this.promptSize = 0;
    this.isLocalCommand = true;
    this.underLocalCommand = false;
    this.localCommandTrigger = ',';
    this.prompt = "";
    this.promptSize = 0;
    this.defaultPrompt = "";
    this.defaultPromptSize = 0;
    this.shell = null;
    this.log = function (mesg) {
        console.log(mesg);
    };
    this.setupDefaultPrompt();
    this.init();
};

/**
 * Initializes a new hterm.Terminal for use as a terminal.
 *
 */
admin.Terminal.prototype.init = function () {
    lib.init(this.setupHterm.bind(this), console.log.bind(this.log));
};

/**
 * Setup the terminal with all the defaults.
 */
admin.Terminal.prototype.setupHterm = function () {
    this.terminal = new hterm.Terminal('default');
    this.terminalDefaults();
    this.terminal.onTerminalReady = this.onTerminalReady.bind(this);
    this.terminal.decorate(this.parent);
    this.terminal.installKeyboard();
    this.terminal.setCursorPosition(0, 0);
    this.terminal.setCursorVisible(true);
    this.terminal.setCursorBlink(true);

    this.terminal.contextMenu.setItems([
        ['Clear Screen', function () { clearScreen(); }],
        ['Reset Terminal', function () { terminal.reset(); printPrompt(terminal); }],
        ['Split Vertical', splitVertical()],
        ['Split Horizontal', splitHorizontal()],
        ['New Tab', newTab()],
    ]);

};

/**
 * Setup defaults for the created terminal.
 */
admin.Terminal.prototype.terminalDefaults = function() {
    this.terminal.prefs_.set('scrollbar-visible', false);
    this.terminal.prefs_.set('enable-blink', true);
    this.terminal.prefs_.set('background-color', '#0b0b0b');
    // Disabled due to Content-Security-Policy rule
    // terminal.prefs_.set('background-image', 'url(https://goo.gl/anedTK)');
    this.terminal.prefs_.set('backspace-sends-backspace', true);
    this.terminal.prefs_.set('font-size', 12);
    // terminal.prefs_.set('font-family', 'RobotoMono');
    this.terminal.prefs_.set('font-smoothing', 'subpixel-antialiased');
    // terminal.prefs_.set('enable-bold', true);
    // terminal.prefs_.set('enable-bold-as-bright', true);
    this.terminal.prefs_.set('ctrl-v-paste', true);
    this.terminal.prefs_.set('mouse-right-click-paste', true);
    this.terminal.prefs_.set('font-family', '"DejaVu Sans Mono", "Noto Sans Mono", "Everson Mono", FreeMono, Menlo, Terminal, monospace');
};

/**
 * Terminal ready callback.
 */
admin.Terminal.prototype.onTerminalReady = function () {
    this.io = this.terminal.io.push();
    this.printPrompt();


    this.io.sendString = (str) => this.io.print(str);
    this.io.onVTKeystroke = (ch) => this.onVTKeystroke(ch);

    this.io.onTerminalResize = (columns, rows) => {

    };

    console.log("Terminal", this.name, "is ready...");
};

/**
 * Manage what needs to happen on each key stroke. Whether to intrepret the
 * data or whether to pass it on to the controlling shell.
 * 
 * @param {string} ch The key sequence to be printed on terminal.
 */
admin.Terminal.prototype.onVTKeystroke = function (ch) {
    /**
     * keep track of what is being typed so that, local commands can be
     * triggered even in the presence of a remote shell.
     * 
     */
    if (this.isLocalCommand && ch === this.localCommandTrigger) {
        this.underLocalCommand = true;
    }

    this.isLocalCommand = false;

    /**
     * First checl if we are under remote shell and pass the input directly to 
     * remote shell otherwise, pass to the terminal directly.
     * 
     * TODO: 'shell' should be a superclass hosting websocket or another shell I/O
     */
    if (!this.underLocalCommand && (this.shell && this.shell.readyState === 1)) {
        if (ch === '\r') {
            this.isLocalCommand = true;
            this.underLocalCommand = false;
        }
        this.shell.send(ch);
    } else {
        // Keep track of consecutive up and down arrow key presses
        if (ch === '\\033[A') { // UP arrow
            this.histTravCount = (this.histTravCount + 1 > this.history.length) ? this.histTravCount : this.histTravCount + 1;
        } else if (ch === '\\033[B') { // Down arrow
            this.histTravCount = (this.histTravCount >= 1) ? this.histTravCount - 1 : 0;
        } else {
            this.histTravCount = 0;
        }

        switch (ch) {
            case '\x1b': // Esc pressed
                // leaveIO();
                // rejects();
                break;
            case '\r': // Enter key pressed
                this.isLocalCommand = true;
                this.underLocalCommand = false;
                this.io.println('');
                this.history.push(this.input);
                if (this.input) {
                    this.execute();
                }
                this.input = '';
                this.printPrompt();
                break;
            case '\b': // backspace
                this.input = this.input.slice(0, -1);
                if (this.terminal.getCursorColumn() > this.promptSize) {
                    this.terminal.setCursorColumn(this.terminal.getCursorColumn() - 1);
                    this.terminal.deleteChars(1);
                    this.io.print(' '); // FIXME: Dirty hack 
                    this.terminal.setCursorColumn(this.terminal.getCursorColumn() - 1);
                }
                break;
            case '\x1b\x7f': // delete
            case '\x1b[3~': // delete
                if (this.terminal.getCursorColumn() >= this.promptSize) {
                    this.terminal.deleteChars(1);
                }
                break;
            case '\f': // form-feed
                this.clearScreen();
                break;
            case '\\033[A': //up arrow
            case '\\033[B': //down arrow
                this.walkThroughHistory();
                break;
            case '\\033[D': //left arrow
                break;
            case '\\033[C': //right arrow
                break;
            default:
                this.input += ch;
                this.io.print(ch);
                break;
        }
    }
};

/**
 * Walk through the local history when UP and DOWN arrow keys are 
 * pressed and print the command corresponding in the history.
 * 
 */
admin.Terminal.prototype.walkThroughHistory = function () {
    let histSize = this.history.length;
    let currentLocation = 0;

    /** 
     * If the traversal count is less than the number of entries in history, 
     * set it to zero position, otherwise the location in the history.
     * (Occurred when repeated down arrow keys are pressed.)
     */
    if (histSize <= this.histTravCount) {
        currentLocation = 0;
    } else {
        currentLocation = histSize - this.histCount;
    }

    this.input = this.history[currentLocation];

    /**
     * Delete any excess characters that might have been printed on 
     * the terminal due to earlier traveral that are longer in length
     * than the current command 
     */
    while (this.terminal.getCursorColumn() > this.promptSize) {
        let t = this.terminal.getCursorColumn();
        this.terminal.deleteChars(1);
        this.terminal.setCursorColumn(t - 1);
    }

    if (this.input) {
        this.io.print(this.input);
    } else {
        this.input = '';
    }
};


/**
 * Set prompt as user-defined prompt.
 * 
 * @param {string} prompt Key sequence that needs to be set as default prompt to be printed on terminal.
 * @param {number} length Length/size of prompt in characters.
 */
admin.Terminal.prototype.setPrompt = function (prompt, length) {
    this.prompt = prompt;
    if (typeof length != 'number') {
        this.promptSize = prompt.length;
    }

    this.promptSize = length;
};

/**
 * Print prompt on the terminal to indicate readiness to take commands.
 */
admin.Terminal.prototype.printPrompt = function () {
    this.io.print(this.prompt);
    this.terminal.setCursorColumn(this.promptSize);
};

/**
 * Setup a default prompt to be printed on the terminal.
 */
admin.Terminal.prototype.setupDefaultPrompt = function () {
    var today = new Date();
    var time = "\x1b[38;5;253m" + 
                `${today.getHours()}`.padStart(2, 0) + 
                ":" + 
                `${today.getMinutes()}`.padStart(2, 0) + 
                ":\x1b[38;5;244m" + 
                `${today.getSeconds()}`.padStart(2, 0) + 
                "  ";
    this.defaultPrompt = time + '\x1b[36;1m>' + '\x1b[0m ';
    this.defaultPromptSize = 12;

    this.prompt = this.defaultPrompt;
    this.promptSize = this.defaultPromptSize;
};

/**
 * Restore to previous io obeject (in the queue) of the terminal,
 * after flushing out the data from the current io queue.
 */
admin.Terminal.prototype.leaveIO = function () {
    this.io.print('');
    this.terminal.io.pop();
};

/**
 * Clear/Wipe the current screen.
 */
admin.Terminal.prototype.clearScreen = function() {
    this.terminal.wipeContents();
    this.printPrompt();
};

/**
 * Execute the command provided in the terminal.
 * 
 * @param {string} command The command that needs to be executed.
 */
admin.Terminal.prototype.execute = function() {
    if(this.input.startsWith(this.localCommandTrigger)) {
        this.input = this.input.substr(1);
    }
    let _command = this.input;
    let _value;
    
    if(this.input.includes("=")) {
        let tmp = this.input.split("=");
        _command = tmp[0].trim();
        _value = tmp[1].trim();
    } else if (this.input.includes(":")) {
        let tmp = this.input.split(":");
        _command = tmp[0].trim();
        _value = tmp[1].trim();
    } else if (this.input.includes(" ")) {
        let tmp = this.input.split(" ");
        _command = tmp[0].trim();
        tmp.shift();
        _value = tmp.join(" ").trim();
    }

    switch(_command) {
        case "background":
        case "background-color":
            this.terminal.prefs_.set('background-color', _value);
            break;
        case "cursor":
            let tmp = _value.toUpperCase();
            if(["BEAM", "UNDERLINE", "BLOCK"].includes(tmp)) {
                this.terminal.prefs_.set('cursor-shape', _value.toUpperCase());
            } else {
                this.io.println("\x1b[38;5;244mBEAM, UNDERLINE & BLOCK are supported cursor shapes.\x1b[0m");
            }
            break;
        case "prompt":
            this.setPrompt(_value);
            break;
        case "font":
            if(isNaN(_value)) {
                if(_value === "default" || _value === "reset") {
                    this.terminal.prefs_.set('font-family', '"DejaVu Sans Mono", "Noto Sans Mono", "Everson Mono", FreeMono, Menlo, Terminal, monospace');
                    this.terminal.prefs_.set('font-size', 12);
                } else {
                    this.terminal.prefs_.set('font-family', _value);
                }
            } else {
                this.terminal.prefs_.set('font-size', _value); 
            }
            break;
        case "ssh":
            this.shell = new WebSocket("ws://localhost:16443/ws/first/ssh/localhost/9038/admin/12345678/" + 
                            this.terminal.screenSize.width + "/" + 
                            this.terminal.screenSize.height);

            this.shell.onclose = function (evt) {
                console.log("connection closed!");
            };
           
            var self = this;
            this.shell.onmessage = function (evt) {
                self.io.print(evt.data);
            };
              
            break;
        case "sshrun":
            test = new WebSocket("ws://localhost:16443/ws/first/sshrun");
            break;
        case "reset":
            this.terminalDefaults();
            break;
        default:
            try {
                this.terminal.prefs_.set(_command, _value);
            } catch(e) {
                this.notify("-term: " + _command + ": command not found");
            }
    }
};


/**
 * Print a notification to user
 * 
 * @param {string} command The notification message to be printed.
 */
admin.Terminal.prototype.notify = function(message) {
    this.io.println("\x1b[38;5;244m"+message+"\x1b[0m");
};

module.exports = admin;