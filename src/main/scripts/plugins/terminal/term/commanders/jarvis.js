// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/jarvis.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let commander = require('./commander');
let Assistant = require('../../../../assistants/dialogflow/dialogflow');
let SSH = require("./ssh");

let jarvis = {};

jarvis.Commander = function() {
    this.assistant = new Assistant('appointmentscheduler-bjacvw');
    this.windows = new Map();
};

jarvis.Commander.prototype = Object.create(
    commander.Command.prototype);

jarvis.Commander.prototype.execute = async function(command, terminalWindow) {
    if(command.toLowerCase().startsWith("jarvis ")) {
        command = command.slice(7);
    }
    let commandArray = command.split(" ");
    command = commandArray[0];
    let params = commandArray.slice(1).join(" ");
    let id = terminalWindow.id;

    switch(command) {
        case "ssh":
        case "connect":
            if (!this.windows[id]) {
                let ssh = new SSH(id);
                this.windows[id] = ssh;
                await ssh.execute(params, terminalWindow);
            }
            break;
        case "color":
            terminalWindow.switchColor(params);
            break;
        case "background":
        case "image":
        case "bg":
            terminalWindow.changeBackground(params);
            break;
        case "font-size":
        case "size":
        case "fontsize":
            terminalWindow.changeFontSize(params);
            break;
        case "font":
            terminalWindow.changeFontFamily(params);
        case "share-my-session":
        case "share":
            let ssh = this.windows[id];
            if(typeof ssh !== "undefined") {
                ssh.share(params, terminalWindow);
            } else {
                terminalWindow.executeContext.stdout("Cannot find an active ssh session");
            }
            break;
        default:
            await this.assistant.send(command);
    }
};

module.exports = new jarvis.Commander();