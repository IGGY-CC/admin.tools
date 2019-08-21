(function () {
    const window = require('electron').remote.getCurrentWindow();

    document.querySelector("#minimize").addEventListener("click", () => {
        window.minimize();
    });

    document.querySelector("#maximize").addEventListener("click", () => {
        if (!window.isMaximized()) {
            window.maximize();
            document.querySelector(".maximize span").className = "far fa-window-maximize";
        } else {
            window.unmaximize();
            document.querySelector(".maximize span").className = "fa fa-window-maximize";
        }
    });

    document.querySelector("#close").addEventListener("click", () => {
        window.close();
    });
})();