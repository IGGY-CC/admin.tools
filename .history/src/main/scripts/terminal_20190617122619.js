use(strict);
(use 'esversion: 6');

opt_profileName = "hello_world";
window.onload = function () {
    lib.init(setupHterm);
};

function setupHterm() {
    const t = new hterm.Terminal(opt_profileName);

    t.onTerminalReady = function () {

    };
}