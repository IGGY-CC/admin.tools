var { lib, hterm } = require('../../plugins/hterm/dist/js/hterm_all.js');

window.onload = function() {
    // hterm.defaultStorage = new lib.Storage.Memory();
    // lib.init(setupHterm);
    lib.init(setupHterm, log);
};

log = function(mesg) {
    console.log(mesg);
}

setupHterm = function() {
    opt_profileName = "default";
    const t = new hterm.Terminal(opt_profileName);
    
    t.decorate(document.querySelector('#terminal'));
    t.installKeyboard();
    
    t.onTerminalReady = function () {
        const io = t.io.push();

        io.onVTKeystroke = (str) => {
            console.log("keystroke: ", str)
        };

        io.sendString = (str) => {
            console.log("sendString: ", str);
        };

        io.onTerminalResize = (columns, rows) => {

        };
        console.log("terminal is ready...");
    };
    
    t.io.println('hello, world');
};