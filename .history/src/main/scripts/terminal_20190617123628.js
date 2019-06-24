use(strict);

opt_profileName = "hello_world";
window.onload = function () {
    lib.init(setupHterm);
};

function setupHterm() {
    const t = new hterm.Terminal(opt_profileName);

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

        t.decorate(document.querySelector('#terminal'));
        t.installKeyboard();
        t.io.pri

    };
}