// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/ssh.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const commander = require('./commander');
const sshManager = require('../plugins/terminal/term/term_ssh_manager');

const ssh = {};

ssh.Commands = function (id) {
    commander.Command.call(this);
    this.id = id;
    this.groups = {
        vms: ["jumpbox", "pxe", "kali"],
        all: ["windows", "jumpbox", "pxe", "jumpbox2", "kali"],
    }
};

ssh.Commands.prototype = Object.create(commander.Command.prototype);

ssh.Commands.prototype.throwError = function (message) {
    return "\r\n\u001b[31m--==[\u001b[43m " + message + " \u001b[0m\u001b[31m]==--\u001b[0m\r\n";
};

ssh.Commands.prototype.serverName = function (serverName) {
    return "\r\n\u001b[34;1m[[\u001b[44;1m " + serverName + " \u001b[0m\u001b[34;1m]]\u001b[0m\r\n";
};

ssh.Commands.prototype.execute = async function (command, terminal, returnData=false) {
    let term = terminal.executeContext;
    console.error("Command: ", command);
    let cmdArray = command.split(" ");
    let servers = this.groups[cmdArray[0]];
    if (typeof servers === "undefined") {
        servers = [cmdArray[0]];
    }
    let serverCommand = [ cmdArray.splice(1).join(" ") ];

    let collectedData = [];
    for(let index = 0; index < servers.length; index++) {
        let command = "ssh";
        let action = "exec";

        /* Setup Websocket */
        let wss = new Socket();
        let sessionID = wss.generateSessionID();
        let encoded = this.checkAndSetupParams(servers[index], serverCommand, wss);
        wss.prepareDefaultEndPoint(sessionID, command, action, encoded);
        console.log("Sending command ", serverCommand, " to server ", servers[index]);
        terminal.executeContext.stdout("\r\n");
        const start = async () => {
            await wss.makeWSConnection(
                async () => {
                    await this.onClose(terminal, "Server " + servers[index] + " closed connection");
                }, async () => {
                    await this.onClose(terminal, "Connection attempt to server " + servers[index] + " rejected");
                }, async () => {
                    // this.connecting(term);
                }, async () => {
                    await this.closed(term, servers[index]);
                },
                async (data) => {
                    if(returnData) {
                        returnData(data);
                    } else {
                        // collectedData.push(this.serverName(servers[index]) + data);
                        await term.stdout(this.serverName(servers[index]) + data);
                    }
                }
            );
        };
        start().then(()=>{
            console.log("REACHED AT THE THEN OF START");
        });
    }
};

ssh.Commands.prototype.onClose = async function (terminal, message) {
    this.connected = false;
    this.closed(terminal.executeContext);
    // terminal.executeContext.stderr(this.throwError(message) + "\r\n", ()=>{});
    // terminal.createContext();
};

ssh.Commands.prototype.closed = function (terminal) {
    if (this.interval) {
        terminal.stdout("\r\n");
        clearInterval(this.interval);
        this.interval = 0;
    }
};

ssh.Commands.prototype.checkAndSetupParams = function (server, command, wss) {
    let params = this.getParamsByID(server, command);
    if(!Array.isArray(params)) {
        params = [params];
    }
    return wss.makeEncodedJSONString(params);
};

ssh.Commands.prototype.getParamsByID = function (server, command) {
    console.log("SSH MANAGER: ", sshManager);
    const data = sshManager.connectTo(this.id, server);
    console.log("FOUND DATA: ", data);
    const params = data.split(";");

    const sshObject = {};
    sshObject.Host = params[1];
    sshObject.Port = parseInt(params[2]) || 22;
    sshObject.User = params[0];
    sshObject.Pass = "" + params[3];

    if(typeof params[4] !== "undefined") {
        sshObject.Challenges = [params[4]];
        sshObject.ChallengePasswords = [params[5]];
    }

    sshObject.Commands = command;

    return sshObject;
};

module.exports = ssh.Commands;