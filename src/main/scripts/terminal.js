// SOURCE FILE: admin.tools/src/main/scripts/terminal.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

'use strict';

const randomWord = require('random-word');

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

    this.debug = true;
    this.ansiReg = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    this.terminalName = name;
    this.parent = document.querySelector(parent);
    this.isInSubCommand = false;
    this.inProgressCommand = null;
    this.inProgressCommandStep = 0;
    this.terminal = null;
    this.io = null;
    this.input = '';
    this.history = [];
    this.histTravCount = 0;
    this.isLocalCommand = true;
    this.underLocalCommand = false;
    this.localCommandTrigger = ',';
    this.prompt = "";
    this.promptSize = 0;
    this.promptLengthPx = 0;
    this.defaultPrompt = "";
    this.defaultPromptSize = 0;
    this.shell = null;
    this.menuItems = [];
    this.onTerminalReadyFunctions = [];
    this.echo = true;
    this.sshname = null;
    this.sshpassword = null;
    this.sshserver = null;
    this.sshport = null;
    this.sshusername = null;
    this.colors = this.setupColors();
    this.skipSSHConnectPrompt = false;
    this.commandInstance = null;
    this.log = function (mesg) {
        console.log(mesg);
    };
    this.setupDefaultPrompt();
    this.init();
    // Any events based on "terminal" that are supposed to be coming here, should go into "onTerminalReady" function.
};

admin.Terminal.prototype.stripAnsi = function(ansiString) {
    return ansiString.replace(this.ansiReg, '');
};

admin.Terminal.prototype.setupColors = function() {
    return {
        reset: '\x1b[0m',
        Black: '\x1b[30m',
        Red: '\x1b[31m',
        Green: '\x1b[32m',
        Yellow: '\x1b[33m',
        Blue: '\x1b[34m',
        Magenta: '\x1b[35m',
        Cyan: '\x1b[36m',
        White: '\x1b[37m',
        bBlack: '\x1b[30;1m',
        bRed: '\x1b[31;1m',
        bGreen: '\x1b[32;1m',
        bYellow: '\x1b[33;1m',
        bBlue: '\x1b[34;1m',
        bMagenta: '\x1b[35;1m',
        bCyan: '\x1b[36;1m',
        bWhite: '\x1b[37;1m',
        grey: '\x1b[38;5;244m',
        
        
    };
};

admin.Terminal.prototype.CommandInstance_ = function(obj) {
    this.commandInstance = obj;
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
    hterm.defaultStorage = new lib.Storage.Memory(); // TODO
    this.terminal = new hterm.Terminal('default');
    this.terminalDefaults();
    this.terminal.onTerminalReady = this.onTerminalReady.bind(this);
    this.terminal.decorate(this.parent);
    this.terminal.installKeyboard();
    this.terminal.setCursorPosition(0, 0);
    this.terminal.setCursorVisible(true);
    this.terminal.setCursorBlink(true);
};

admin.Terminal.prototype.setupDefaultContextMenuItems = function() {
    let self = this;
    this.addMenuItem('Clear Screen', function () { self.clearScreen(); });
    this.addMenuItem('Reset Terminal', function () { self.terminal.reset(); self.printPrompt(); });

    this.regenerateMenus();
};

admin.Terminal.prototype.addMenuItem = function(name, callback) {
    this.menuItems.push([name, callback]);
};

admin.Terminal.prototype.regenerateMenus = function() {
    this.terminal.contextMenu.setItems(this.menuItems);
    // this.terminal.contextMenu.regenerate_();
};


/**
 * Setup defaults for the created terminal.
 */
admin.Terminal.prototype.terminalDefaults = function() {
    this.terminal.prefs_.set('scrollbar-visible', true);
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

admin.Terminal.prototype.addTerminalReadyFunction = function(callback) {
    this.onTerminalReadyFunctions.push(callback);
};


admin.Terminal.prototype.onTerminalReadyOld = function() {
    //const runNassh = function () {
    this.terminal.setCursorPosition(0, 0);
    this.terminal.setCursorVisible(true);
    console.log("terminal ready...");
    let argString = { hostname: "localhost", admin_terminal: this };
    this.terminal.runCommandClass(streams.CommandInstance, argString);
    //  };
}
/**
 * Terminal ready callback.
 */
admin.Terminal.prototype.onTerminalReady = function () {
    this.io = this.terminal.io.push();
    this.printPrompt();


    this.io.sendString = (str) => this.io.print(str);
    this.io.onVTKeystroke = (ch) => this.onVTKeystroke(ch);

    this.io.onTerminalResize = (columns, rows) => this.onTerminalResize(columns, rows);
    this.setupDefaultContextMenuItems();

    this.onTerminalReadyFunctions.forEach(element => {
        element();
    });

    console.log("Terminal", this.terminalName, "is ready...");
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
    if (!this.underLocalCommand && !this.isInSubCommand && (this.shell && this.shell.readyState === 1)) {
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
                this.echo = true;
                this.isLocalCommand = true;
                this.underLocalCommand = false;
                this.io.println('');
                if(this.isInSubCommand) {
                    this.execute();
                } else {
                    this.history.push(this.input);
                    if (this.input) {
                        this.execute();
                    }
                    this.input = '';
                    if(!this.isInSubCommand) {
                        this.printPrompt();
                    }
                } 
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
            case '\x03': //ctrl-c?
                if(this.isInSubCommand) {
                    this.isInSubCommand = false;
                    this.inProgressCommand = null;
                    this.inProgressCommandStep = 0;
                    this.input = "";
                    this.io.println('');
                    this.printPrompt();
                }
                this.input = "";
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
                if(this.echo) {
                    this.io.print(ch);
                } else {
                    this.io.print("*");
                }
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
admin.Terminal.prototype.setPrompt = function (prompt) {
    this.prompt = prompt;

    let ansiStrippedPrompt = this.stripAnsi(this.defaultPrompt);
    this.promptSize = ansiStrippedPrompt.length;
    this.promptLengthPx = lib.wc.strWidth(ansiStrippedPrompt);
};

/**
 * Print prompt on the terminal to indicate readiness to take commands.
 */
admin.Terminal.prototype.printPrompt = function () {
    this.io.print(this.prompt);
    this.promptSize = this.stripAnsi(this.prompt).length;
    this.terminal.setCursorColumn(this.promptSize);
};

/**
 * Setup a default prompt to be printed on the terminal.
 */
admin.Terminal.prototype.setupDefaultPrompt = function () {
    let additionalData = "";
    if(this.debug) {
        additionalData = "  " +
            this.colors.bMagenta +
            this.terminalName;
    }

    var today = new Date();
    var time = "\x1b[38;5;253m" + 
                `${today.getHours()}`.padStart(2, 0) + 
                ":" + 
                `${today.getMinutes()}`.padStart(2, 0) + 
                ":\x1b[38;5;244m" + 
                `${today.getSeconds()}`.padStart(2, 0) + 
                additionalData +
                " ";
    this.defaultPrompt = time + '\x1b[36;1m>' + '\x1b[0m ';
    let ansiStrippedPrompt = this.stripAnsi(this.defaultPrompt);
    this.defaultPromptSize = ansiStrippedPrompt.length;

    this.prompt = this.defaultPrompt;
    this.promptSize = this.defaultPromptSize;
    this.promptLengthPx = lib.wc.strWidth(ansiStrippedPrompt);
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
    if(this.isInSubCommand) {
        if(!this.input.startsWith(this.inProgressCommand))
            this.input = this.inProgressCommand + " " + this.input;
    }

    if(this.input.startsWith(this.localCommandTrigger)) {
        this.input = this.input.substr(1);
    }
    let _command = this.input;
    let _value;
    
    if(this.input.includes("=")) {
        _value = this.input.split("=");
        _command = _value[0].trim();
        _value.shift();
    } else if (this.input.includes(" ")) {
        _value = this.input.split(" ");
        _command = _value[0].trim();
        _value.shift();
    }

    switch(_command) {
        case "background":
        case "background-color":
            this.terminal.prefs_.set('background-color', _value[0].trim());
            break;
        case "cursor":
            let tmp = _value[0].trim().toUpperCase();
            if(["BEAM", "UNDERLINE", "BLOCK"].includes(tmp)) {
                this.terminal.prefs_.set('cursor-shape', _value[0].trim().toUpperCase());
            } else {
                this.notify("BEAM, UNDERLINE & BLOCK are supported cursor shapes.", true);
            }
            break;
        case "prompt":
            this.setPrompt(_value[0]);
            break;
        case "font":
            let t = _value[0].trim();
            if(isNaN(t)) {
                if(t === "default" || t === "reset") {
                    this.terminal.prefs_.set('font-family', '"DejaVu Sans Mono", "Noto Sans Mono", "Everson Mono", FreeMono, Menlo, Terminal, monospace');
                    this.terminal.prefs_.set('font-size', 12);
                } else {
                    this.terminal.prefs_.set('font-family', t);
                }
            } else {
                this.terminal.prefs_.set('font-size', t); 
            }
            break;
        case "ssh":
            if(!this.isInSubCommand) {
                this.sshusername = null;
                this.sshserver = null;
                this.sshport = null;
            }
            if (typeof _value !== "undefined" && _value[0].includes("@")) {
                let srvrDetails = _value[0].trim().split("@");
                let hostPort = srvrDetails[1].split(":");
                this.sshusername = srvrDetails[0];
                this.sshserver = hostPort[0];
                this.sshport = hostPort.length == 2? parseInt(hostPort[1]) : 22;
                if(this.sshusername && this.sshserver !== null && this.sshport !== null) {
                    this.isInSubCommand = true;
                    this.inProgressCommand = _command;
                    this.skipSSHConnectPrompt = true;
                    this.inProgressCommandStep = 4;
                    this.setupSSHConnection([this.sshusername]);
                } else {
                    this.error("Couldn't create a server connection with: " + _value[0]);
                }
            } else {
                this.isInSubCommand = true;
                this.inProgressCommand = _command;
                this.setupSSHConnection(_value);
            }
            break;
        case "sshrun":
            let test = new WebSocket("ws://localhost:16443/ws/first/sshrun");
            test.close();
            break;
        case "reset":
            this.terminalDefaults();
            break;
        default:
            try {
                this.terminal.prefs_.set(_command, _value[0].trim());
            } catch(e) {
                this.notify("-term: " + _command + ": command not found", true);
            }
    }
};

admin.Terminal.prototype.onTerminalResize = function(cols, rows) {
    if(this.shell != null) {
        console.log("Calling resize on terminal...", this.terminalName);
        try {
            let resizeShell = new WebSocket("ws://localhost:16443/ws/" +
                this.terminalName +
                "/resize/" +
                (rows - 1) +
                "/" +
                (cols - 1));
            // Close the websocket connection after 5 seconds.
            setTimeout(() => resizeShell.close(), 5000);
        } catch (exception) {
            // nothing to do here.
        }
    }
}

admin.Terminal.prototype.setupSSHConnection = function (value) {
    let highlightColor = this.colors.bYellow;
    let resetColor = this.colors.grey;
    
    let self_ = this;
    function prompt(message, hl) {
        hl? self_.notify(self_.colors.bBlue + message) : self_.notify(self_.colors.Blue + message);
    }
    function notify(message) {
        self_.notify(self_.colors.grey + message, true);
    }
    function confirm(message) {
        self_.notify(self_.colors.White + message);
    }

    this.inProgressCommandStep++;
    switch (this.inProgressCommandStep - 1) {
        case 0:
            prompt("Give a name for this connection > ");
            break;
        case 1:
            let name = value[0];
            if(name === "" || !this.sshname) {
                name = randomWord();
                notify("No name provided. Taking '" + highlightColor + name + resetColor + "' for now.");
            }
            this.sshname = name;
            this.input = "";
            prompt("SSH Server name or IP: ");
            break;
        case 2:
            if(value[0] == "") {
                this.inProgressCommandStep--;
                prompt("SSH Server name or IP > ", true);
            } else {
                this.sshserver = value[0];
                prompt("SSH Server port[22]: ");
            }
            this.input = "";
            break;
        case 3:
            this.sshport = parseInt(value[0]);
            if(value[0] === "") {
                notify("No port provided! Using default port: " + highlightColor + "22" + resetColor + ".");
                this.sshport = 22;
            } 
            this.input = "";
            prompt("Username: ");
            break;
        case 4:
            if(value[0] === "") {
                this.inProgressCommandStep--;
                prompt("Username: ", true);
            } else {
                this.sshusername = value[0];
                this.echo = false;
                prompt("Password: ");
            }
            this.input = "";
            break;
        case 5:
            if(value[0] === "") {
                notify("Trying with empty password...");
            }
            this.sshpassword = value[0];
            this.echo = true;
            this.input = "";
            if(!this.skipSSHConnectPrompt) {
                this.skipSSHConnectPrompt = false;
                confirm("Connect to " + highlightColor + this.sshusername + "@" + this.sshserver + ":" + this.sshport + resetColor + " ? [y/n] > ");
                break;
            } else {
                value[0] = "Y";
            }
        case 6:
            console.log(value[0]);
            if (value[0].toUpperCase() === "Y" || value[0].toUpperCase() === "YES") {
                this.inProgressCommandStep = 0;
                this.input = "";
                this.inProgressCommand = null;
                this.isInSubCommand = false;
                this.makeSSHConnection();
            } else {
                this.inProgressCommandStep = 1;
                this.input = this.sshname;
                prompt("Enter to continue or Ctrl-C to quit > ");
            }

    }
};

/**
 * Divides the two numbers and floors the results, unless the remainder is less
 * than an incredibly small value, in which case it returns the ceiling.
 * This is useful when the number are truncated approximations of longer
 * values, and so doing division with these numbers yields a result incredibly
 * close to a whole number.
 *
 * @param {number} numerator
 * @param {number} denominator
 * @return {number}
 */
admin.Terminal.prototype.smartFloorDivide = function (numerator, denominator) {
    var val = numerator / denominator;
    var ceiling = Math.ceil(val);
    if (ceiling - val < .0001) {
        return ceiling;
    } else {
        return Math.floor(val);
    }
};

admin.Terminal.prototype.makeWSObject = function(object) {
    return encodeURIComponent(JSON.stringify(object));
}

admin.Terminal.prototype.makeSSHConnObject = function() {
    let sshConnObject = {};
    sshConnObject.Host = this.sshserver;
    sshConnObject.Port = this.sshport;
    sshConnObject.User = this.sshusername;
    sshConnObject.Pass = this.sshpassword;

    let cols = this.io.terminal_.screenSize.width;
    let rows = this.io.terminal_.screenSize.height;

    sshConnObject.Cols = cols;
    sshConnObject.Rows = rows;

    sshConnObject.CommPty = true;
    sshConnObject.AdmPty = true;

    return this.makeWSObject(sshConnObject);
}

admin.Terminal.prototype.makeSSHConnection = function () {
    this.notify("Opening connection to server...", true);
    this.authType = (this.sshport == 9038) ? "" : "/password";

    this.shell = new WebSocket("ws://localhost:16443/ws/" +
        this.terminalName +
        "/ssh/" + this.makeSSHConnObject());


    let self = this;

    this.shell.onclose = function (evt) {
        self.io.print(evt.data);
        console.log("connection closed!");
        self.io.println('');
        self.io.println('');
        self.printPrompt();
        self.shell.close();
        self.shell = null;
    };


    this.shell.onmessage = function (evt) {
        self.io.print(evt.data);
    };
};

/**
 * Print the given message without newline at the end while taking 
 * care of cursor position.
 * 
 * @param {string} message The message to be printed.
 */
admin.Terminal.prototype.print = function(message) {
    this.ioprint(message, false);
};

/**
 * Print the given message with newline at the end while taking 
 * care of cursor position.
 * 
 * @param {string} message The message to be printed.
 */
admin.Terminal.prototype.println = function(message) {
    this.ioprint(message, true);
};

/**
 * Print the given message while taking care of cursor position.
 * 
 * @param {string} message The message to be printed.
 * @param {boolean} withBreak Whether a new line needs to be printed. 
 */
admin.Terminal.prototype.ioprint = function(message, withBreak) {
    withBreak === true? this.io.println(message) : this.io.print(message);
    this.promptSize = this.stripAnsi(message).length;
};

/**
 * Print a notification to user
 * 
 * @param {string} command The notification message to be printed.
 * @param {boolean} withBreak Whether a new line needs to be printed. 
 */
admin.Terminal.prototype.notify = function(message, withBreak) {
    this.ioprint(this.colors.grey + message + this.colors.reset , withBreak);
};

/**
 * Print a warning message to user
 * 
 * @param {string} command The warning message to be printed.
 * @param {boolean} withBreak Whether a new line needs to be printed. 
 */
admin.Terminal.prototype.warn = function(message) {
    this.ioprint(this.colors.Red + message + this.colors.reset, true);
};

/**
 * Prints a success message to user
 * 
 * @param {string} command The success message to be printed.
 * @param {boolean} withBreak Whether a new line needs to be printed. 
 */
admin.Terminal.prototype.success = function(message) {
    this.ioprint(this.colors.bGreen + message + this.colors.reset, true);
};

/**
 * Print an error message to user
 * 
 * @param {string} command The error message to be printed.
 * @param {boolean} withBreak Whether a new line needs to be printed. 
 */
admin.Terminal.prototype.error = function(message) {
    this.ioprint(this.colors.bRed + message + this.colors.reset, true);
};










module.exports = admin;