window.onload = function() {
    hterm.defaultStorage = new lib.Storage.Memory();
    lib.init(setupHterm, console.log.bind(console));
};

log = function(mesg) {
    console.log(mesg);
};

setupHterm = function() {
    opt_profileName = "default";
    const terminal = new hterm.Terminal(opt_profileName);

    terminal.onTerminalReady = function () {
        const io = terminal.io.push();
        const prompt_string = '\x1b[38:2:51:105:2032mi' + '\x1b[38:2:213:15:37mg' + '\x1b[38:2:238:178:17mg' +
        '\x1b[38:2:0:153:37my' + '\x1b[38:2:51:105:232m.' + '\x1b[38:2:213:15:37m>' + '\x1b[0m ';
        
        const prompt_size = 7;
        function printPrompt() {
            io.print(
                '\x1b[38:2:51:105:2032mi' +
                '\x1b[38:2:213:15:37mg' +
                '\x1b[38:2:238:178:17mg' +
                '\x1b[38:2:0:153:37my' +
                '\x1b[38:2:51:105:232m.' +
                '\x1b[38:2:213:15:37m>' +
                '\x1b[0m ');
            terminal.setCursorColumn(prompt_size);
        }

        const leaveIO = () => {
            io.print('');
            terminal.io.pop();
        };

        printPrompt();
        
       
        io.sendString = (str) => "send-string-sanjeev-test" + str;
        io.onVTKeystroke = (ch) => {
            switch(ch) {
                case '\x1b': // Esc pressed
                    console.log(ch, " +=+ ", ((ch+"").charCodeAt(0)));
                    // leaveIO();
                    // rejects();
                    break;
                case '\r': // Enter key pressed
                    io.println('');
                    printPrompt();
                    break;
                case '\b': // backspace
                    console.log(terminal.getCursorColumn());
                    if(terminal.getCursorColumn() > prompt_size) {
                        terminal.setCursorColumn(terminal.getCursorColumn() - 1);
                        io.print(' ');
                        terminal.setCursorColumn(terminal.getCursorColumn() - 1);
                    }
                    break;
                case '\x1b\x7f':
                case '\x1b[3~': //delete
                    console.log("here I'm ", terminal.getCursorColumn());
                    if(terminal.getCursorColumn() > prompt_size) {
                        terminal.deleteChars(1);
                    }
                    break;
                default:
                    console.log(ch, " = ", ((ch+"").charCodeAt(0)));
                    io.print(ch);
                    break;
            }
            // terminal.wipeContents();
        };

        io.onTerminalResize = (columns, rows) => {

        };

        console.log("terminal is ready...");
    };


    
    terminal.prefs_.set('scrollbar-visible', false);
    terminal.prefs_.set('enable-blink', true);
    terminal.prefs_.set('backspace-sends-backspace', true);
    terminal.prefs_.set('font-size', 12);
    terminal.prefs_.set('font-family', 'monospace');


    terminal.decorate(document.querySelector('#terminal'));
    terminal.installKeyboard();
    // hterm.VT(terminal);

    terminal.setCursorPosition(0, 0);
    terminal.setCursorVisible(true);
    terminal.setCursorBlink(true);
    // terminal.command.keyboard_ = terminal.keyboard;

    terminal.contextMenu.setItems([
        ['clear', function() { terminal.wipeContents(); }],
        ['reset', function() { terminal.reset(); }],
    ]);

};