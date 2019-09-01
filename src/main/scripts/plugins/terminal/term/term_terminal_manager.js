

'use strict';

const term = require("./term");


term.TerminalManager = function() {
    this.terminals = [];
    this.count = () => this.terminals.length;
};

term.TerminalManager.prototype.createTerminal = function(name, onComplete) {
    let terminal = new term.TerminalManager.Terminal(name, this);
    this.terminals.push(terminal);
    terminal.createTerminal(onComplete);
    return terminal;
};

term.TerminalManager.prototype.destroy = function(terminal) {
    let index = this.terminals.indexOf(terminal);
    this.terminals.splice(index, 1);
};

term.TerminalManager.Terminal = function(name, terminalManager) {
    this.terminalManager = terminalManager;
    this.name = name;
    this.terminalWindow = null;
};

term.TerminalManager.Terminal.prototype.createTerminal = function(onComplete) {
    if(document.readyState === "complete") {
        this.onContentLoaded_.call(this, onComplete);
    } else {
        window.addEventListener('load', this.onContentLoaded_.bind(this, onComplete));
    }
};

term.TerminalManager.Terminal.prototype.onContentLoaded_ = function(onComplete) {
    this.terminalWindow = document.querySelector(this.name);
    console.log("NAME /  TERMINAL WINDOW", this.name, this.terminalWindow);
    onComplete(this.terminalWindow);
};

term.TerminalManager.Terminal.prototype.close = function() {
    // TODO: CLOSE TERMINAL
    // if (!this.appWindow_)
    //     throw new Error('Window not open.');
};

term.TerminalManager.Terminal.prototype.onClosed = function() {
    console.log("Window closed!");
};

term.TerminalManager.Terminal.prototype.onClosed_ = function() {
    this.terminalManager.destroy(this);
    this.onClosed();
};

let terminalManager = new term.TerminalManager();
module.exports = terminalManager;