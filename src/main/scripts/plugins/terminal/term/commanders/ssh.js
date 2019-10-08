// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/ssh.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const commander = require('./commander');
const sshManager = require('../term_ssh_manager');

const ssh = {};

ssh.Commander = function (id) {
    commander.Command.call(this);
    this.id = id;
    this.wss = new Socket();
    this.sessionID = this.wss.generateSessionID();
    console.log("SESSION ID: ", this.sessionID, this.wss.generateSessionID());
    this.command = "ssh";
    this.wss.wss = "ws://"; // TODO: disable this line or change it to wss:// in production
    this.connected = false;
    this.responseReceived = false;
    this.action = "init";
};

ssh.Commander.prototype = Object.create(commander.Command.prototype);

ssh.Commander.prototype.throwError = function (message) {
    return "\u001b[31m--==[\u001b[43m " + message + " \u001b[0m\u001b[31m]==--\u001b[0m";
};

ssh.Commander.prototype.execute = async function (command, terminal) {
    let term = terminal.executeContext;
    console.log("Command: ", command);
    if (command.toLowerCase().startsWith("id=")) {
        command = command.slice(3).split(" ");
        let source = command[0];
        let destination = command[1];
        if(sshManager.checkOccupiedSession(source)) {
            console.warn("A session already exists with that ID. cannot recreate.");
            return;
        }
        sshManager.addOccupiedSession(source);
        this.sessionID = source;
        this.action = "share-session";
        let object = {ID: destination};
        this.wss.prepareDefaultEndPoint(this.sessionID, this.command, this.action, this.wss.makeEncodedJSONString(object));
    } else {
        if(sshManager.checkOccupiedSession(this.sessionID)) {
            console.warn("A session already exists with that ID. cannot recreate.");
            return;
        }
        sshManager.addOccupiedSession(this.sessionID);
        let encoded = this.checkAndSetupParams(command, term.arg.rows, term.arg.columns);
        this.action = "init";
        this.wss.prepareDefaultEndPoint(this.sessionID, this.command, this.action, encoded);
    }
    await this.wss.makeWSConnection(
        () => {
            console.error("ON CLOSE CALLED:");
            this.onClose(terminal, "Server closed connection");
        }, () => {
            console.error("Rejected");
            this.onClose(terminal, "Connection attempt rejected");
        }, (connection) => {
            sshManager.addSession(this.id, this.sessionID);
            sshManager.addSocket(this.sessionID, connection);
            this.connecting(term);
            term.stdin = (ch) => connection.send(ch);
            terminal.inRemote = true;
            // executeContext.onRoute(connection.send);
        }, () => {
            this.closed(term);
        },
        term.stdout.bind(term)
    );
};

ssh.Commander.prototype.checkAndSetupParams = function (server, rows, columns) {
    let params;
    if (server.includes("@")) {
        params = this.getParams(server, rows, columns);
    } else {
        params = this.getParamsByID(server, rows, columns);
    }

    return this.wss.makeEncodedJSONString(params);
};

ssh.Commander.prototype.closed = function (terminal) {
    if (this.interval) {
        terminal.stdout("\r\n");
        clearInterval(this.interval);
        this.interval = 0;
    }
};

ssh.Commander.prototype.connecting = function (terminal) {
    terminal.stdout("🦅 \u001b[31mconnecting\u001b[0m...");
    this.interval = setInterval(() => {
        terminal.stdout(".");
    }, 200);
    setTimeout(() => {
        this.closed(terminal);
    }, 10000);
};

ssh.Commander.prototype.onClose = function (terminal, message) {
    this.connected = false;
    this.closed(terminal.executeContext);
    terminal.executeContext.stderr(this.throwError(message) + "\r\n", ()=>{});
    terminal.inRemote = false;
    terminal.jarvisReadline = null;
    terminal.createContext();
};

ssh.Commander.prototype.getParams = function (command, rows, columns) {
    const data = command.split("@");
    const data2 = data[1].split(":");

    const sshObject = {};
    sshObject.Host = data2[0];
    sshObject.Port = parseInt(data2[1]) || 22;
    sshObject.User = data[0];
    sshObject.Pass = "12345678";
    sshObject.Challenges = ["Verification code: "];
    sshObject.ChallengePasswords = [sshObject.Pass];
    sshObject.Rows = rows;
    sshObject.Cols = columns;
    sshObject.CommPty = true;
    sshObject.AdmPty = true;

    return sshObject;
};

ssh.Commander.prototype.getParamsByID = function (server, rows, columns) {
    const data = sshManager.connectTo(this.id, server);
    const params = data.split(":");

    const sshObject = {};
    sshObject.Host = params[1];
    sshObject.Port = parseInt(params[2]) || 22;
    sshObject.User = params[0];
    sshObject.Pass = "" + params[3];
    if(typeof params === "undefined") {
        sshObject.Challenges = ["Verification code: "];
        sshObject.ChallengePasswords = [sshObject.Pass];
    } else {
        // sshObject.Challenges = [params[4] + ": "];
        // sshObject.ChallengePasswords = [sshObject.Pass];
    }
    sshObject.Rows = rows;
    sshObject.Cols = columns;

    return sshObject;
};

ssh.Commander.prototype.share = async function(shareID, terminal) {
    let term = terminal.executeContext;
    let share = shareID.split(" ");
    let object = {};
    if(share.length === 2) {
        object.ID = share[0];
        object.Write = (share[1].toLowerCase() === "true");
    } else {
        object.ID = share[0];
        object.Write = false;
    }
    this.wss.prepareDefaultEndPoint(this.sessionID, this.command, "allow-share-session", this.wss.makeEncodedJSONString(object));

    await this.wss.makeWSConnection(
        () => {console.error("ON CLOSE CALLED:")},
        () => {console.error("Rejected");},
        (connection) => {},
        () => {},
        ()=>{}
    );
};

module.exports = ssh.Commander;