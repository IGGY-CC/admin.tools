import { rejects } from "assert";
import { resolve } from "url";

window.onload = function() {
    hterm.defaultStorage = new lib.Storage.Memory();
    lib.init(setupHterm, log);
};

log = function(mesg) {
    console.log(mesg);
};

setupHterm = function() {
    opt_profileName = "default";
    const terminal = new hterm.Terminal(opt_profileName);
    
    terminal.onTerminalReady = function () {
        const io = terminal.io.push();
        const leaveIO = () => {
            io.print('');
            terminal.io.pop();
        };
        let input = '';
        io.sendString = (str) => input += str;
        io.onVTKeystroke = (ch) => {
            switch(ch) {
                case '\x1b': // Esc pressed
                    leaveIO();
                    rejects();
                    break;
                case '\r': // Enter key pressed
                    leaveIO();
                    resolve(input);
                    break;
                case '\b': // backspace
                case '\x7F': //delete
                    input = input.slice(0, -1);
                    break;
                default:
                    input += ch;
                    break;
            }
        };

        io.onTerminalResize = (columns, rows) => {

        };
        console.log("terminal is ready...");
    };
    
    terminal.prefs_.set('scrollbar-visible', false);
    terminal.decorate(document.querySelector('#terminal'));
    terminal.installKeyboard();
    terminal.io.println('hello, world');
    terminal.setCursorPosition(0, 0);
    terminal.setCursorVisible(true);
    // terminal.command.keyboard_ = terminal.keyboard;

    terminal.contextMenu.setItems([
        ['clear', function() { terminal.wipeContents(); }],
        ['reset', function() { terminal.reset(); }],
    ]);

};