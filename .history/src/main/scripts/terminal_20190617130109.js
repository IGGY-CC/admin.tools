setTimeout(function() {
    window.onload = function () {
        lib.init(setupHterm);
    };
}, 2000);

opt_profileName = "hello_world";
setupHterm = function() {
    const t = new hterm.Terminal(opt_profileName);

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
}