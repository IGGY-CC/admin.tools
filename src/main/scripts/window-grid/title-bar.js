(function () {
    const window = require('electron').remote.getCurrentWindow();

    document.querySelector("#minimize").addEventListener("click", () => {
        window.minimize();
    });

    document.querySelector("#maximize").addEventListener("click", () => {
        if (!window.isMaximized()) {
            window.maximize();
        } else {
            window.unmaximize();
        }
    });

    document.querySelector("#close").addEventListener("click", () => {
        window.close();
    });
})();