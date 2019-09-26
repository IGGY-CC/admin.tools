// SOURCE FILE: admin.tools/src/main/scripts/window-grid/tab-content.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const GridObjectLib = require('../window-grid/grid-object');
const gridOnTabs = GridObjectLib.gridOnTabs;
const ROOT_CONTAINER = GridObjectLib.ROOT_CONTAINER;

const TAB_CONTAINER = "main-tabs";
const defTabID = "main-tab-";

let TabObject = function(mainGridObservable) {
    this.container = document.querySelector("#" + TAB_CONTAINER);
    this.mainGridObservable = mainGridObservable;

    this.tabCount = 0;
    this.tabs = [];
    this.containers = [];
    this.tabMap = new Map();
    this.activeTab = null;
    this.activeContainer = null;

    this.createDefaultTab();
};

TabObject.prototype.createDefaultTab = function() {
    /**
     *  <div class="tab active">
     *      <div class="icon"><span class="fa fa-terminal"/></div>
     *      <div class="text">SYS INFO</div>
     *      <div class="close"><span class="fa fa-times"/></div>
     *  </div>
     */
    const gridContainer = this.createNewTab("Tab", "fa fa-terminal");
    this.mainGridObservable.addObserver(gridContainer);
};

TabObject.prototype.createNewTab = function(text, icon) {
    this.tabCount++;

    let _text = (text)? text : "TAB #" + this.tabCount;
    let _icon = (icon)? icon : "fa fa-terminal";
    let newTabID = defTabID + this.tabCount;

    /* Create and Setup TAB */
    let newTab = UtilsUI.createNewElement('div', this.container, newTabID, "tab active");
    newTab.onclick = this.tabClicked.bind(this, newTab.id);
    this.activeTab = newTab;

    let iconDiv = UtilsUI.createNewElement('div', newTab, newTabID + "-icon-div", "icon");
    UtilsUI.createNewElement('span', iconDiv, newTabID + "-icon-span", _icon);

    let textDiv = UtilsUI.createNewElement('div', newTab, newTabID + "-text", "text");
    textDiv.innerHTML = _text;

    let closeDiv = UtilsUI.createNewElement('div', newTab, newTabID + "-close", "close");
    UtilsUI.createNewElement('span', closeDiv, newTabID + "-close-span", "fa fa-times");
    closeDiv.onclick = this.tabCloseClicked.bind(this);

    this.tabs.push(newTab);

    /* Create new TAB Content Pane */
    let container = this.createNewGridObject();
    this.tabMap.set(newTabID, container);
    this.tabClicked(newTab.id);
    return container.grid;
};

TabObject.prototype.tabClicked = function(tabID) {
    this.tabs.forEach(tab => {
        if(tab.id === tabID) {
            tab.className = "tab active";
            let container = this.tabMap.get(tabID).element;
            container.style.display = "";
            this.activeTab = tab;
        } else {
            tab.className = "tab";
            let container = this.tabMap.get(tab.id).element;
            container.style.display = "none";
        }
    });
};

TabObject.prototype.tabCloseClicked = function() {
    // TODO: CONFIRM FROM THE USER IF IT REALLY NEEDS TO BE CLOSED
    // TODO: CLOSE VISIBILITY BUT DO NOT DESTROY. THIS NEEDS TO BE UNDONE UPTO A SPECIFIC TIME AFTER WHICH CAN BE DESTROYED.
    this.closeTab();
};

TabObject.prototype.closeTab = function() {
    console.error("CLOSE TAB CLICKED: TODO!");
};

TabObject.prototype.createNewGridObject = function(container, name) {
    let parentElement = document.querySelector(ROOT_CONTAINER);
    let contentTab = UtilsUI.createNewElement('div', parentElement, "main-container-" + this.tabCount, "grid-container");
    let gridObject = gridOnTabs.createNewGrid(contentTab, "grid-" + this.tabCount);

    return { grid: gridObject, element: contentTab };
};

TabObject.prototype.setActiveTabName = function(name) {
    let element = document.querySelector("#" + this.activeTab.id + "-text");
    element.innerHTML = name;
};

module.exports = TabObject;