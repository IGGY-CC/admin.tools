require('../../plugins/hterm/dist/js/hterm_all.js');

window.onload = function() {
    // hterm.defaultStorage = new lib.Storage.Memory();
    // lib.init(setupHterm);
    lib
    setupHterm();
};

setupHterm = function() {
    console.log("called setupHterm");
    console.log(window);
    console.log(document);
    opt_profileName = "default";
    const t = new hterm.Terminal(opt_profileName);
    console.log(document);
    t.onTerminalReady = function () {
        console.log("terminal is ready...");
        const io = t.io.push();

        io.onVTKeystroke = (str) => {
            console.log("keystroke: ", str)
        };

        io.sendString = (str) => {
            console.log("sendString: ", str);
        };

        io.onTerminalResize = (columns, rows) => {

        };

        t.decorate(document.querySelector('#terminal'));
        t.installKeyboard();
    };

    // t.io.println('hello, world');
};