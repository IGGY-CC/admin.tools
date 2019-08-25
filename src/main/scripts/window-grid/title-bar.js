// SOURCE FILE: admin.tools/src/main/scripts/window-grid/window-grid.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

(function () {
    const window = require('electron').remote.getCurrentWindow();

    document.querySelector("#minimize").addEventListener("click", () => {
        window.minimize();
    });

    document.querySelector("#maximize").addEventListener("click", () => {
        if (!window.isMaximized()) {
            window.maximize();
            document.querySelector("#maximize span").className = "far fa-window-maximize";
        } else {
            window.unmaximize();
            document.querySelector("#maximize span").className = "fa fa-window-maximize";
        }
    });

    document.querySelector("#close").addEventListener("click", () => {
        window.close();
    });
})();