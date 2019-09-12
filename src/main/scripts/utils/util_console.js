const CONSOLE_LISTENERS = [];
const ADD_CONSOLE = console => { CONSOLE_LISTENERS.push(console) };

(function() {
    const OVERRIDE = true;
    const DEBUG = true;
    const FILE_DEBUG = true;
    const CONSOLE_DEBUG = false;
    const LISTENERS_DEBUG = true;

    const fs = require('fs');
    const util = require('util');
    const logFile = fs.createWriteStream('log.txt', {flags: 'w'});

    const logStdout = process.stdout;
    const _log = console.log;
    const _warn = console.warn;
    const _error = console.error;

    const log = (object, type, args) => {
        const date = getDate(null);
        const message = date.toUpperCase() + " " + type + " " + util.format.apply(null, args) + '\n';

        DEBUG && object.apply(null, args);
        FILE_DEBUG && logFile.write(message);
        CONSOLE_DEBUG && logStdout.write(message);
        LISTENERS_DEBUG && CONSOLE_LISTENERS.forEach(console => console(util.format.apply(null, args), type));
    };

    if(OVERRIDE) {
        console.log = function () {
            log.call(null, _log, "INFO", arguments)
        };
        console.warn = function () {
            log.call(null, _warn, "WARN", arguments)
        };
        console.error = function () {
            log.call(null, _error, "CRIT", arguments)
        };
    }
})();