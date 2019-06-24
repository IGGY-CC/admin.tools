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

        function printPrompt() {
            io.print(
                '\x1b[38:2:51:105:232mh' +
                '\x1b[38:2:213:15:37mt' +
                '\x1b[38:2:238:178:17me' +
                '\x1b[38:2:51:105:232mr' +
                '\x1b[38:2:0:153:37mm' +
                '\x1b[38:2:213:15:37m>' +
                '\x1b[0m ');
            cu
        }

        currentCursorState = terminal.saveCursor();
        const leaveIO = () => {
            io.print('');
            terminal.io.pop();
        };

        printPrompt();
        
        let input = '';
        io.sendString = (str) => input += str;
        io.onVTKeystroke = (ch) => {
            switch(ch) {
                case '\x1b': // Esc pressed
                    leaveIO();
                    // rejects();
                    break;
                case '\r': // Enter key pressed
                    // leaveIO();
                    io.println('');
                    printPrompt();
                    // resolve(input);
                    break;
                case '\b': // backspace
                case '\x7F': //delete
                    input = input.slice(0, -1);
                    terminal.clearHome();
                    io.print(input);
                    break;
                default:
                    input += ch;
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