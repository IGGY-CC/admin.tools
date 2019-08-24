// SOURCE FILE: admin.tools/src/main/scripts/plugins/plugin.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let plugin = {};
const toolbar = "#tool-bar";

plugin.binding.Register = function() {
  this.name = name;
  this.menu = true;
  this.toolbar = true;
  this.statusbar = true;
  this.toolbarContent = true;
  this.bottombar = true;
  this.rightbar = true;
};

plugin.binding.ToolBar = function() {
    this.toolbar = document.querySelector(toolbar);

};

plugin.binding.Register.getMenu = function() {
  let setTool = (callback) => {
      callback();
  };
};

plugin.binding.Register.prototype.setMenu = function(name, callback) {
    this.menu = true;
    this.name = name;
    callback(this.getMenu);
};

