// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_command_manager.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let term = require("./term");

term.CommandManager = function() {
  this.defaultCommandExecutor = null;

};