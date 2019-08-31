// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/jarvis.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let commander = require('./commander');

let jarvis = {};

jarvis.Commander = function(assistant) {
    commander.Command.call(this);
    this.assistant = assistant;
};

jarvis.Commander.prototype = Object.create(
    commander.Command.prototype);

jarvis.Commander.prototype.execute = async function(command) {
    return this.assistant.send(command);
};