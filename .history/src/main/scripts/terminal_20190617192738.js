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

        io.onVTKeystroke = (str) => {
            t.io.print(str);
        };

        io.sendString = (str) => {
            console.log("sendString: ", str);
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
    terminal.command.keyboard_ = terminal.keyboard;

    terminal.contextMenu.setItems([
        ['clear', function() { terminal.wipeContents(); }],
        ['reset', function() { terminal.reset(); }],
        

    ]);

};