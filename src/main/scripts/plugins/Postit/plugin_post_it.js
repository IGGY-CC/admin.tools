'use strict';
const path = require('path');

let Postit = {};
Postit = function () {
    this.pluginName = "Postit";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);

    this.position = 2;
};

Postit.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Postit.prototype.Start = function () {
    // this.setupUI();
};

// init logic
module.exports = Postit;