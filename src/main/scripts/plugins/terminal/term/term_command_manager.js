// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_command_manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let term = require("./term");
let Ssh = require("./commanders/ssh");
let Jarvis = require("./commanders/jarvis");

term.CommandManager = function() {
  this.assistant = new Jarvis();
};

term.CommandManager.prototype.execute = function(id, command, executeContext, onClose, sshIsActive) {
  const commander = this.create(id, command);
  if(commander) {
    commander.execute(command, executeContext, onClose, sshIsActive).then(() => {
      onClose();
    }).catch(() => {
      onClose();
    });
  } else {
    console.warn("No default handler to execute the command: ", command);
    onClose();
  }
  return commander;
};

term.CommandManager.prototype.create = function(id, fromCommand) {
  fromCommand = fromCommand.toLowerCase();

  if(fromCommand.startsWith("ssh "))
      return new Ssh(id);

  if(fromCommand.startsWith("jarvis "))
      return new Jarvis(id);

  return false;
};

module.exports = term.CommandManager;