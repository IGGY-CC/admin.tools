// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/jarvis.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let commander = require('./commander');
let Assistant = require('../../../../assistants/dialogflow/dialogflow');
let SSH = require("./ssh");
let SSHCommands = require("./ssh_commands");
let Ace = require("../../../Ace/plugin_ace");
let GridObjectLib = require("../../../../window-grid/grid-object");
const gridOnTabs = GridObjectLib.gridOnTabs;


let jarvis = {};

jarvis.Commander = function() {
    this.assistant = new Assistant('appointmentscheduler-bjacvw');
    this.windows = new Map();
    this.terminalWindows = new Map();
    this.servers = new Map();
    this.aliases = new Map();
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
                this.terminalWindows[id] = terminalWindow;
                this.aliases.set(id, params);
                await ssh.execute(params, terminalWindow, this.servers);
            }
            break;
        case "exec":
            let existingTerminalWindow = this.terminalWindows[id];
            let sshCommands = new SSHCommands(id);
            if(!existingTerminalWindow) {
                await sshCommands.execute(params, terminalWindow);
                terminalWindow.createContext();
            } else {
                await sshCommands.execute(params, existingTerminalWindow);
            }
            break;
        case "exec-no-term":
            // let sshCommands = new SSHCommands(id);
            // await sshCommands.execute(params, nil);
            break;
        case "vi":
            let existingTerminalWindow2 = this.terminalWindows[id];
            let server = this.aliases.get(id);
            let sshCommands2 = new SSHCommands(id);

            await sshCommands2.execute(server + " cat " + params, existingTerminalWindow2, (data) => {
                const gridContainer = tabObject.createNewTab(params, "fa fa-file");
                // document.querySelector("#toolbar-editor").click();
                let ace = Plugins.getLoadedPlugin("Editor");
                let editor = ace.onIconClick();
                editor.setTheme("ace/theme/tomorrow_night_blue");
                editor.setTheme("ace/theme/merbivore");
                editor.setFontSize("14px");
                editor.container.style.lineHeight = 2;
                if(params.toLowerCase().endsWith("sh")) {
                    editor.session.setMode("ace/mode/sh");
                } else if(params.toLowerCase().endsWith("py")) {
                    editor.session.setMode("ace/mode/python");
                } else if(params.toLowerCase().endsWith("js")) {
                    editor.session.setMode("ace/mode/javascript");
                } else if(params.toLowerCase().endsWith("java")) {
                    editor.session.setMode("ace/mode/java");
                } else if(params.toLowerCase().endsWith("c")) {
                    editor.session.setMode("ace/mode/c_cpp");
                } else if(params.toLowerCase().endsWith("sql")) {
                    editor.session.setMode("ace/mode/sql");
                }
                editor.setValue(data);
            });
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