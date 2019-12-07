// SOURCE FILE: admin.tools/src/main/scripts/plugins/ServerInfo/plugin_authenticator.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
let jarvis = require('../../commanders/jarvis');

let Jarvis = function () {
    this.pluginName = "Jarvis";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.position = 1;

    this.slideOut = null;
    this.logs = null; // div array
    this.connected = false;
    this.tfaManager = null;
};

Jarvis.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Jarvis.prototype.Start = function () {
    let containerObject = {
        name: "Jarvis",
        icon: "fas fa-robot",
        pluginPosition: this.position,
        location: BOTTOM,
        isActive: false,
        isContentFixed: true,
        openCallback: this.getSlideOutContent.bind(this),
        closeCallback: this.removeSlideOutContent.bind(this),
        refreshCallback: this.refreshSlideOutContent.bind(this),
        requireHeader: true,
        maxSize: null,
        minSize: null,
        size: 200,
    };

    this.slideOut = this.createSlideOutEntry(containerObject);
    this.getSlideOutContent();
    this.setupHTML();
    window.addEventListener('resize', this.getSlideOutContent.bind(this));
};


Jarvis.prototype.setupHTML = function() {
    let iconArray = ["../assets/Ars.svg", "../assets/ATC_Bournemouth.svg", "../assets/chel2.svg", "../assets/aufc.svg",
        "../assets/bde.svg", "../assets/lpfc4.svg", "../assets/face_auth_fm.svg"];
    let sysinfoTabContent = UtilsUI.createNewElement('div', this.slideOut.content, "sysinfo-tab-content", "property-div-tabs");
    let property = UtilsUI.createNewElement('div', sysinfoTabContent, 'property', 'property');
    let propertyServer = UtilsUI.createNewElement('div', property, 'property-server', 'property-server');
    let serverIcon = UtilsUI.createNewElement('div', propertyServer, 'server-icon', 'server-icon');
    let icon = UtilsUI.createNewElement('img', serverIcon);
    let selected = Math.round(Math.random() * Math.floor(6));
    icon.src = iconArray[selected];
    icon.width = "14";
    icon.height = "16";
    UtilsUI.createNewElement('div', propertyServer, "host-name", "server-text").innerHTML = "jumpbox";
    UtilsUI.createNewElement('div', propertyServer, "host-cpu", "server-resources").innerHTML = "90%";
    UtilsUI.createNewElement('div', propertyServer, "host-mem", "server-resources").innerHTML = "70%";

    let serverInfo = UtilsUI.createNewElement('div', property, 'server-info', 'server-info');
    let info = UtilsUI.createNewElement('div', serverInfo, 'info', 'info');
    UtilsUI.createNewElement('div', info, 'info-key', 'info-key').innerHTML = "STATUS";

    let infoValue = UtilsUI.createNewElement('div', info, 'info-value', 'info-value');
    infoValue.style.textShadow = "none";
    let left = UtilsUI.createNewElement('span', infoValue);
    left.style.color = "green";
    left.style.paddingRight = "4px";
    UtilsUI.createNewElement('i', left, null, "fas fa-angle-double-right");
    let middle = UtilsUI.createNewElement('span', infoValue);
    middle.style.color = "black";
    middle.style.paddingRight = "8px";
    UtilsUI.createNewElement('i', middle, null, "far fa-address-card");
    let right = UtilsUI.createNewElement('span', infoValue);
    right.style.color = "orange";
    right.style.paddingRight = "4px";
    UtilsUI.createNewElement('i', right, null, "far fa-calendar-check");

    this.setInfo(2, serverInfo, "ARCH", "x86-64");
    this.setInfo(3, serverInfo, "DISTRIB", "centos-7");
    this.setInfo(4, serverInfo, "GATEWAY", "10.1.1.2");
    this.setInfo(5, serverInfo, "PUBLIC IP", "no");
    this.setInfo(6, serverInfo, "PORTS", "80, 443");

    this.setExpandInfo(7, serverInfo, "IP ADDR", "10.246.225.238");
    this.setExpandInfo(8, serverInfo, "/", "90%");

    //TOP
    let infoResources = this.setInfoResources(9, serverInfo, null, "TOP CPU USAGE");

    let topData = UtilsUI.createNewElement('div', infoResources, null, "top-data");
    this.setupTopHeader(topData, "pid", "PID");
    this.setupTopHeader(topData,"user", "USER");
    this.setupTopHeader(topData,"cpu-mem", "CPU%");
    this.setupTopHeader(topData,"command", "COMMAND");

    this.setupResData(topData, 1123, "root", "20.5", "cron");
    this.setupResData(topData, 23530, "apache", "40.5", "apache2");
    this.setupResData(topData, 9, "root", "60", "sar");

    //TOP
    let infoResources2 = this.setInfoResources(9, serverInfo, null, "TOP MEM USAGE");

    let topData2 = UtilsUI.createNewElement('div', infoResources2, null, "top-data");
    this.setupTopHeader(topData2, "pid", "PID");
    this.setupTopHeader(topData2,"user", "USER");
    this.setupTopHeader(topData2,"cpu-mem", "MEM%");
    this.setupTopHeader(topData2,"command", "COMMAND");

    this.setupResData(topData2, 2128, "root", "80", "MySQL");
    this.setupResData(topData2, 23530, "apache", "16", "apache2");
    this.setupResData(topData2, 9, "root", "4", "sar");


    this.setInfo(7, serverInfo, "ARCH", "x86-64");

};

Jarvis.prototype.setupResData = function(parent, pid, user, cpuMem, command) {
    UtilsUI.createNewElement('div', parent, null, "top-res-data top-pid").innerHTML = pid;
    UtilsUI.createNewElement('div', parent, null, "top-res-data top-user").innerHTML = user;
    UtilsUI.createNewElement('div', parent, null, "top-res-data top-cpu-mem").innerHTML = cpuMem;
    UtilsUI.createNewElement('div', parent, null, "top-res-data top-command").innerHTML = command;
};

Jarvis.prototype.setupTopHeader = function(parent, name, value) {
    UtilsUI.createNewElement('div', parent, null, "top-header top-" + name).innerHTML = value;
}

Jarvis.prototype.setInfoResources = function(id, parent, key, value) {
    let info7 = UtilsUI.createNewElement('div', parent, 'info-resources' + id, 'info-resources');
    let infoKey7 = UtilsUI.createNewElement('div', info7, 'info-res-header' + id, 'info-res-header');
    UtilsUI.createNewElement('div', infoKey7, 'info-expand' + id, 'info-expand').innerHTML = "<div>+</div>";
    UtilsUI.createNewElement('div', infoKey7, 'info-expand-content' + id, 'info-expand-content').innerHTML = value;
    return info7;
};

Jarvis.prototype.setExpandInfo = function(id, parent, key, value) {
    let info7 = UtilsUI.createNewElement('div', parent, 'info' + id, 'info');
    let infoKey7 = UtilsUI.createNewElement('div', info7, 'info-key' + id, 'info-key');
    UtilsUI.createNewElement('div', infoKey7, 'info-expand' + id, 'info-expand').innerHTML = "<div>+</div>";
    UtilsUI.createNewElement('div', infoKey7, 'info-expand-content' + id, 'info-expand-content').innerHTML = key;
    UtilsUI.createNewElement('div', info7, 'info-value' + id, 'info-value').innerHTML = value;
};

Jarvis.prototype.setInfo = function(id, parent, key, value) {
    let info = UtilsUI.createNewElement('div', parent, 'info' + id, 'info');
    UtilsUI.createNewElement('div', info, 'info-key' + id, 'info-key').innerHTML = key;
    UtilsUI.createNewElement('div', info, 'info-value' + id, 'info-value').innerHTML = value;
}

Jarvis.prototype.getSlideOutContent = function() {
    // TODO: BAD CODE, JUST FOR DEMO PURPOSES
    const rightContent = document.querySelector("#right-tab-bar");
    const cs = getComputedStyle(rightContent);
    this.slideOut.content.style.height = parseInt(cs.height) - this.slideOut.headerHeight + "px";

    // let hostdata = Jarvis
};

Jarvis.prototype.removeSlideOutContent = function() {
    console.log("TODO: Removing default log content");
};

Jarvis.prototype.refreshSlideOutContent = function() {
    console.log("TODO: Refresh default log content");
};



// init logic
module.exports = Jarvis;