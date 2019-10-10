// SOURCE FILE: admin.tools/src/main/scripts/plugins/Authenticator/plugin_authenticator.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
let TfaManager = require("./tfa-manager");

let Authenticator = function () {
    this.pluginName = "Authenticator";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.position = 1;

    this.slideOut = null;
    this.logs = null; // div array
    this.connected = false;
    this.tfaManager = null;
};

Authenticator.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Authenticator.prototype.Start = function () {
    let containerObject = {
        name: "Auth-TOTP",
        icon: "fas fa-unlock-alt",
        pluginPosition: this.position,
        location: RIGHT,
        isActive: false,
        isContentFixed: true,
        openCallback: this.getSlideOutContent.bind(this),
        closeCallback: this.removeSlideOutContent.bind(this),
        refreshCallback: this.refreshSlideOutContent.bind(this),
        requireHeader: true,
        maxSize: null,
        minSize: null,
        size: 200,
    };

    this.slideOut = this.createSlideOutEntry(containerObject);
    this.getSlideOutContent();

    /**
     * <div id="t2fa-tab-content" class="property-div-tabs">
     *      <div id="otp-servers" style="background-color: #0a0b0b;">
     *          <div class="tfa-title-base tfa-title" id="tfa-title-add-server">
     *              <div class="tfa-title-base tfa-title-search">
     *                  <!-- input type="text" placeholder="search 👻"/ -->
     *                  <input id="server-list" type="text" placeholder="search.."/>
     *              </div>
     *              <div id="tfa-title-add"><i class="fa fa-plus-circle"></i></div>
     *          </div>
     *      </div>
     *</div>
     */
    let t2faTabContent = UtilsUI.createNewElement('div', this.slideOut.content, null, "property-div-tabs");
    let otpServers = UtilsUI.createNewElement('div', t2faTabContent, "otp-servers");
    let tfaTitleBase = UtilsUI.createNewElement('div', otpServers, 'tfa-title-add-server', 'tfa-title-base tfa-title');
    let tfaTitleSearch = UtilsUI.createNewElement('div', tfaTitleBase, null, 'tfa-title-base tfa-title-search');
    let input = UtilsUI.createNewElement('input', tfaTitleSearch, 'server-list');
    input.type = "text";
    input.placeholder = "👻 search.. ";
    let titleAdd = UtilsUI.createNewElement('div', tfaTitleBase, 'tfa-title-add');
    UtilsUI.createNewElement('i', titleAdd, null, 'fa fa-plus-circle');
    this.tfaManager = new TfaManager();
    this.tfaManager.getRegisteredList();
    window.addEventListener('resize', this.getSlideOutContent.bind(this));
};

Authenticator.prototype.getSlideOutContent = function() {
    // TODO: BAD CODE, JUST FOR DEMO PURPOSES
    const rightContent = document.querySelector("#right-tab-bar");
    const cs = getComputedStyle(rightContent);
    this.slideOut.content.style.height = parseInt(cs.height) - this.slideOut.headerHeight + "px";
    if(this.tfaManager) this.tfaManager.getRegisteredList();
};

Authenticator.prototype.removeSlideOutContent = function() {
    console.log("TODO: Removing default log content");
};

Authenticator.prototype.refreshSlideOutContent = function() {
    console.log("TODO: Refresh default log content");
};



// init logic
module.exports = Authenticator;