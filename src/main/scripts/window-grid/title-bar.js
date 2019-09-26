// SOURCE FILE: admin.tools/src/main/scripts/window-grid/window-grid.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

(function () {
    const window = require('electron').remote.getCurrentWindow();

    /**
     *  <div class="resize-win"></div>
     *  <div class="at-win icon"><span class="fab fa-pagelines"></span></div>
     *  <div class="title">hello, world</div>
     *  <div class="notifications"></div>
     *  <div class="at-win" id="minimize"><span class="fa fa-window-minimize"></span></div>
     *  <div class="at-win" id="maximize"><span class="far fa-window-maximize"></span></div>
     *  <div class="at-win" id="close"><span class="fa fa-power-off"></span></div>
    **/

    let container = document.querySelector("#title-bar");
    UtilsUI.createNewElement('div', container, null, "resize-win");
    const icon = UtilsUI.createNewElement('div', container, null, "at-win icon");
    UtilsUI.createNewElement('span', icon, null, "fab fa-pagelines");
    UtilsUI.createNewElement('div', container, null, "title").innerHTML = "hello, world";
    UtilsUI.createNewElement('div', container, null, "notifications");
    const minimize = UtilsUI.createNewElement('div', container, "minimize", "at-win");
    const maximize = UtilsUI.createNewElement('div', container, "maximize", "at-win");
    const close = UtilsUI.createNewElement('div', container, "close", "at-win");
    UtilsUI.createNewElement('span', minimize, null, "fa fa-window-minimize");
    UtilsUI.createNewElement('span', maximize, null, "fa fa-window-maximize");
    UtilsUI.createNewElement('span', close, null, "fa fa-power-off");


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