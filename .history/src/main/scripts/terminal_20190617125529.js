const {ipcRenderer} = require('electron');
document.addEventListener('DOMContentLoaded', pageLoaded)
opt_profileName = "hello_world";


function setupHterm() {
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