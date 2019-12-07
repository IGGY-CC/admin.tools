// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/commander.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let commander = {};

commander.Command = function(id) {
    this.id = id;
    this.response = {
        message: "Not implemented!",
        error: "Not implemented!"
    };
    this.response.onload = new lib.Event();
    this.response.onerror = new lib.Event();
};

commander.Command.prototype.onCommand = async function(command, executeContext) {
    return new Promise((resolve, reject) => {
        this.execute(command);
        this.response.onload = () => resolve(this.response.message);
        this.response.onerror = () => reject(this.response.error);
    });
};

commander.Command.prototype.execute = async function() {

    console.log("Not Implemented Yet!");
    return this.response;
};

module.exports = commander;
