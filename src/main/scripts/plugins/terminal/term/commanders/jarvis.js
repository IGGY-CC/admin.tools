// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/jarvis.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let commander = require('./commander');
let Assistant = require('../../../../assistants/dialogflow/dialogflow');

let jarvis = {};

jarvis.Commander = function(id) {
    this.id = id;
    commander.Command.call(this);
    this.assistant = new Assistant('appointmentscheduler-bjacvw');
};

jarvis.Commander.prototype = Object.create(
    commander.Command.prototype);

jarvis.Commander.prototype.execute = async function(command, executeContext) {
    return this.assistant.send(command);
};

module.exports = jarvis.Commander;