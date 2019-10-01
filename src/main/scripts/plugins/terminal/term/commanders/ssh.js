// SOURCE FILE: admin.tools/src/main/scripts/terminals/commanders/ssh.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const commander = require('./commander');
const sshManager = require('../term_ssh_manager');

const ssh = {};

ssh.Commander = function(id) {
    commander.Command.call(this);
    this.id = id;
    this.wss = new Socket();
    this.name = this.wss.generateSessionID();
    this.sessionID = this.wss.generateSessionID();
    this.command = "ssh";
    this.wss.wss = "ws://"; // TODO: disable this line or change it to wss:// in production
    this.connected = false;
    this.responseReceived = false;
    this.action = "init";
};

ssh.Commander.prototype = Object.create(commander.Command.prototype);

ssh.Commander.prototype.cloneConnection = async function(executionContext, onClose, sshIsActive) {
    // this.action = "new-tab";
    this.action = "sshrun";
    this.wss.prepareDefaultEndPoint(this.sessionID, this.command, this.action, this.wss.makeEncodedString("/usr/bin/cat ./test.sh"));
    let _serverConn = null;
    await this.wss.makeWSConnection(
        () => {
            this.connected = false;
            this.closed(executionContext);
            onClose(this.throwError("server closed connection"));
        },() => {
            this.connected = false;
            this.closed(executionContext);
            onClose(this.throwError("Connection attempt rejected"));
        },(connection) => {
            sshManager.addSession(this.id, this.sessionID);
            sshIsActive.call();
            this.connecting(executionContext);
            executionContext.stdin = (ch) => connection.send(ch);
            // executionContext.onRoute(connection.send);
        },() => {
            this.closed(executionContext);
        },
        executionContext.stdout.bind(executionContext)
    )
};

ssh.Commander.prototype.throwError = function(message) {
    return "\u001b[31m--==[\u001b[43m " + message +  " \u001b[0m\u001b[31m]==--\u001b[0m";
};

ssh.Commander.prototype.execute = async function(command, executionContext, onClose, sshIsActive) {
    if(command.toLowerCase().startsWith("connect") || command.toLowerCase().startsWith("ssh")) {

        let encoded = this.checkAndSetupParams(command, executionContext);
        if(!encoded) return this.cloneConnection(executionContext, onClose, sshIsActive);
        if(this.connected) {
            console.error("There already is a connection on this instance!");
        } else {
            this.connected = true;
            this.action = "init";
            this.wss.prepareDefaultEndPoint(this.sessionID, this.command, this.action, encoded);
            let _serverConn = null;
            await this.wss.makeWSConnection(
                () => {
                        console.error("ON CLOSE CALLED:");
                        this.connected = false;
                        this.closed(executionContext);
                        onClose(this.throwError("Server closed connection"));
                    },() => {
                        console.error("Rejected");
                        this.connected = false;
                        this.closed(executionContext);
                        onClose(this.throwError("Connection attempt rejected")
                        );
                    },(connection) => {
                        sshManager.addSession(this.id, this.sessionID);
                        sshIsActive.call();
                        this.connecting(executionContext);
                        executionContext.stdin = (ch) => connection.send(ch);
                        // executionContext.onRoute(connection.send);
                    },() => {
                        this.closed(executionContext);
                    },
                    executionContext.stdout.bind(executionContext)
            )
        }
    }
};

ssh.Commander.prototype.checkAndSetupParams = function(server, executionContext) {
    server = server.split(" ")[1];
    if(!server) {
        this.connected = false;
        throw new Error("SSH command needs further arguments!");
    }

    let params;
    if(server.includes("@")) {
        params = this.getParams(server, executionContext);
    } else {
        const existingConnection = sshManager.getSessionByServer(server);
        if(existingConnection) {
            this.sessionID = existingConnection;
            return false;
        } else {
            params = this.getParamsByID(server, executionContext);
        }
    }

    return this.wss.makeEncodedJSONString(params);
};

ssh.Commander.prototype.closed = function(executionContext) {
    if (this.interval) {
        executionContext.stdout("\r\n");
        clearInterval(this.interval);
        this.interval = 0;
    }
};

ssh.Commander.prototype.connecting = function(executionContext) {
    executionContext.stdout("🦅 \u001b[31mconnecting\u001b[0m...");
    this.interval = setInterval(() => {
        executionContext.stdout(".");
    }, 200);
    setTimeout(() => {
        this.closed(executionContext);
    }, 10000);
};

ssh.Commander.prototype.onclose = function(serverConn) {
    console.log("CLOSING SERVER CONN: TODO: ", serverConn);
    // sshManager.removeSession(this.id);
};

ssh.Commander.prototype.getParams = function(command, executionContext) {
    const data = command.split("@");
    const data2 = data[1].split(":");

    const sshObject = {};
    sshObject.Host = data2[0];
    sshObject.Port = parseInt(data2[1]) || 22;
    sshObject.User = data[0];
    sshObject.Pass = "12345678";
    sshObject.Rows = executionContext.arg.rows;
    sshObject.Cols = executionContext.arg.columns;
    sshObject.CommPty = true;
    sshObject.AdmPty = true;

    return sshObject;
};

ssh.Commander.prototype.getParamsByID = function(server, executionContext) {
    const data = sshManager.connectTo(this.id, server);
    const params = data.split(":");

    const sshObject = {};
    sshObject.Host = params[1];
    sshObject.Port = parseInt(params[2]) || 22;
    sshObject.User = params[0];
    sshObject.Pass = "" + params[3];
    sshObject.Rows = executionContext.arg.rows;
    sshObject.Cols = executionContext.arg.columns;
    sshObject.CommPty = true;
    sshObject.AdmPty = true;

    return sshObject;
};

module.exports = ssh.Commander;