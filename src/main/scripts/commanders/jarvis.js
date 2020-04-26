// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/jarvis.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let commander = require('./commander');
let Assistant = require('../assistants/dialogflow/dialogflow');
let SSH = require("./ssh");
let SSHCommands = require("./ssh_commands");
let Ace = require("../plugins/Ace/plugin_ace");
let GridObjectLib = require("../window-grid/grid-object");
const gridOnTabs = GridObjectLib.gridOnTabs;


let jarvis = {};

jarvis.Commander = function() {
    this.assistant = new Assistant('appointmentscheduler-bjacvw');
    this.windows = new Map();
    this.terminalWindows = new Map();
    this.servers = new Map();
    this.aliases = new Map();
    this.symbol = "🤖";
    this.triggerText = "@";
};

jarvis.Commander.prototype = Object.create(
    commander.Command.prototype);

jarvis.Commander.prototype.execute = async function(command, terminalWindow) {
    if(command.toLowerCase().startsWith(this.triggerText + " ")) {
        command = command.slice(this.triggerText.length);
    }
    command = command.trim();
    let save = false;
    if(command.endsWith(" --save")) {
        save = true;
        command = command.substring(0, command.indexOf(" --save"));
    } else if(command.endsWith("-save")) {
        save = true;
        command = command.substring(0, command.indexOf(" -save"));
    }

    let commandArray = command.split(" ");
    command = commandArray[0];
    let params = commandArray.slice(1).join(" ");
    let id = terminalWindow.id;


    switch(command) {
        case "ssh":
        case "connect":
            // if (!this.windows[id]) {
            //     let ssh = new SSH(id);
            //     this.windows[id] = ssh;
            //     this.terminalWindows[id] = terminalWindow;
            //     this.aliases.set(id, params);
            //     await ssh.execute(params, terminalWindow, this.servers, () => {this.windows.delete(id);});
            // }
            if (!this.windows.has(id)) {
                let self = this;
                const sshServerConnection = new SSHConnect(params, terminalWindow, () => {
                    console.log("WINDOWS ID: ", self.windows.get(id));
                    self.windows.delete(id);
                    console.log("WINDOWS ID: ", self.windows.get(id));
                });
                this.windows.set(id, sshServerConnection);
                await sshServerConnection.initConnect();
            }
            break;
        case "open":
            if (!this.windows.has(id)) {
                let self = this;
                const sshServerConnection = new SSHConnect(params, terminalWindow, () => {
                    console.log("WINDOWS ID: ", self.windows.get(id));
                    self.windows.delete(id);
                    console.log("WINDOWS ID: ", self.windows.get(id));
                });
                await sshServerConnection.share(params);
                this.windows.set(id, sshServerConnection.sessionID);
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
        case "edit":
        case "ed":
            let existingTerminalWindow2 = this.terminalWindows[id];
            let server = this.aliases.get(id);
            let sshCommands2 = new SSHCommands(id);

            await sshCommands2.execute(server + " cat " + params, existingTerminalWindow2, (data) => {
                const gridContainer = tabObject.createNewTab(params, "fa fa-file");
                // document.querySelector("#toolbar-editor").click();
                let ace = Plugins.getLoadedPlugin("Editor");
                let editor = ace.onIconClick();
                // editor.setTheme("ace/theme/tomorrow_night_blue");
                editor.setTheme("ace/theme/tomorrow_night_bright");
                // editor.setTheme("ace/theme/clouds_midnight");
                // editor.setTheme("ace/theme/merbivore");
                editor.setFontSize("14px");
                editor.setOptions({
                    fontFamily: "Inconsolata",
                    // fontSize: "10pt"
                });
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
                editor.setValue(data, -1);
                editor.clearSelection();
            });
            break;
        case "color":
        case "fg":
            if(save) userSettings.set("foreground.terminal.muse.am", params);
            terminalWindow.switchColor(params);
            break;
        case "background":
        case "image":
        case "bg":
            if(save) {
                userSettings.set("switch.background.terminal.muse.am", params);
                userSettings.delete("no.background.terminal.muse.am");
            }
            terminalWindow.changeBackground(params);
            break;
        case "bgo":
            if(save) {
                userSettings.set("no.background.terminal.muse.am", null);
                userSettings.delete("switch.background.terminal.muse.am");
            }
            terminalWindow.changeBackground(true);
            terminalWindow.switchColor("white");
            break;
        case "font-size":
        case "size":
        case "fontsize":
            if(save) userSettings.set("size.font.terminal.muse.am", params);
            terminalWindow.changeFontSize(params);
            break;
        case "font":
            if(save) userSettings.set("name.font.terminal.muse.am", params);
            terminalWindow.changeFontFamily(params);
            break;
        case "share-my-session":
        case "share":
            let ssh = this.windows.get(id);
            console.error("SHARING WITH: ", ssh);
            if(typeof ssh !== "undefined") {
                await ssh.allowShare(params);
            } else {
                terminalWindow.executeContext.stdout("Cannot find an active ssh session");
            }
            break;
        case "speed-test":
        case "speed":
        case "speedtest":
        case "st":
            let speedTest = require('speedtest-net');
            let test = speedTest({maxTime: 5000});

            let blessed = require('blessed');
            let tput = blessed.tput({
                terminal: 'xterm-256color',
                extended: true
            });

            let hello = tput.setaf(4) + 'Hello, world: this is a test' + tput.sgr0() + '\n';
            terminalWindow.executeContext.stdin(hello);
            console.log("hello", hello);

            let screen = blessed.screen({
                cursor: {
                    artificial: true,
                    shape: 'line',
                    blink: true,
                    color: null // null for default
                }
            });

            let box = blessed.box({
                top: 'center',
                left: 'center',
                width: '50%',
                height: '50%',
                content: 'Hello {bold}world{/bold}!',
                tags: true,
                border: {
                    type: 'line'
                },
                style: {
                    fg: 'white',
                    bg: 'magenta',
                    border: {
                        fg: '#f0f0f0'
                    },
                    hover: {
                        bg: 'green'
                    }
                }
            });

            screen.terminal = terminalWindow.executeContext;
            screen.append(box);
            screen.render();

            // require('speedtest-net')().on('downloadspeedprogress', speed => {
            //     console.log('Download speed (in progress):', (speed * 125).toFixed(2), 'KB/s');
            //     terminalWindow.executeContext.stdout((speed * 125).toFixed(2) + "KB/s\r\n");
            // });

            // test.on('data', data => {
            //     console.dir(data);
            //     terminalWindow.executeContext.stdout(data);
            // });

            // test.on('error', err => {
            //     terminalWindow.executeContext.stderr(err);
            // });
            break;
        case "cmd":
            // >yarn add node-pty
            // >yarn run electron-rebuild
            let os = require('os');
            let pty = require('node-pty');

            let shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

            let ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: process.env.HOME,
                env: process.env
            });
            terminalWindow.executeContext.stdin = (ch) => ptyProcess.write(ch);
            ptyProcess.on('data', function(data) {
                terminalWindow.executeContext.stdout(data);
            });
            break;
        default:
            let text = await this.assistant.send(command);
            if(text.startsWith("connect") || text.startsWith("exec")) {
                this.execute(text, terminalWindow)
            } else {
                terminalWindow.executeContext.stdout(text + "\r\n");
            }
    }
};

module.exports = new jarvis.Commander();