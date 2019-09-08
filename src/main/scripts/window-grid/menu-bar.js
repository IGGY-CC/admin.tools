// SOURCE FILE: admin.tools/src/main/scripts/window-grid/menu-bar.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let UtilsUI = require("../utils/util_dom");
let utilListeners = require("../utils/util_listeners");

const menu = "#menu-items";
const firstIconRow = "#icons-first-row";
const secondIconRow = "#icons-second-row";
const widgetArea = "#widget-area";
const progressBar = "#menu-progress-bar";
const firstGroupKey = "-menu-group-first";
const secondGroupKey = "-menu-group-second";
const menuItemKey = "menu-item-";
const menuItemClass = "text";
const menuItemActiveClass = "text active";

let GridMenubar = function () {
    this.menu = document.querySelector(menu);
    this.firstIconRow = document.querySelector(firstIconRow);
    this.secondIconRow = document.querySelector(secondIconRow);
    this.widgetArea = document.querySelector(widgetArea);
    this.progressBar = document.querySelector(progressBar);
    this.firstGroupDiv = new Map();
    this.secondGroupDiv = new Map();
    this.activeMenu = null;

    this.menuitems = new Map();
    this.menuicons = new Map();
};

/**
 * menuItem = {
 *     name: xxx
 *     displayName: xxx,
 *     onClick: onClick function
 *     isActive: true,
 * }
 * @param menuItem
 */
GridMenubar.prototype.setMenuItem = function(menuItem) {
    if(this.menuitems.has(menuItem.name)) {
        console.error("The Menu item is already added. Not adding.");
        return;
    }

    this.menuitems.set(menuItem.name, this.setupMenuItemUI(menuItem));
};

GridMenubar.prototype.setupMenuItemUI = function(menuItem) {
    /**
     * First we need to create an icon group div
     * @type {{icon, wrapper}}
     */
    this.setupIconGroups(menuItem);
    let menu = UtilsUI.createNewElement(
        'div',
        this.menu,
        "menu-item-" + menuItem.name,
        (menuItem.isActive) ? menuItemActiveClass : menuItemClass,
        this.menuItemOnClick.bind(this, menuItem.name)
    );

    /* Add text */
    menu.innerHTML = menuItem.displayName;

    /* Activate mousetouch and mouseover */
    utilListeners.addRemoveListener("mouseover", this.menuItemOnClick.bind(this, menuItem.name), this.menu.id, false, this.menu);
    if(menuItem.isActive) {
        this.activeMenu = menuItem.name;
    }
    // activate the active menu and disable all others.
    this.menuItemOnClick(this.activeMenu);
    return menu;
};

/**
 * icon : {
 *     name: xxx, // plugin name
 *     row: 1 | 2,
 *     id: xxx,
 *     type: div | input | etc
 *     tooltip: xxx,
 *     icon: xxx,
 *     callback: xxx,
 *     color: "green",
 *     hcolor: "white",
 *     element: null,
 *     ttdirection: "right"
 * }
 * @param iconItem
 */
GridMenubar.prototype.setupIcon = function(iconItem) {
    let row = (iconItem.row === 1)? this.firstGroupDiv.get(iconItem.name) : this.secondGroupDiv.get(iconItem.name);
    let wrapper = UtilsUI.wrapIconInNewElement(
        (typeof iconItem.type === "undefined")? 'div' : iconItem.type,
        row,
        iconItem.id,
        "tool",
        iconItem.icon,
        iconItem.callback, true);

    iconItem.element = wrapper.wrapper;
    iconItem.iconElement = wrapper.icon;
    UtilsUI.setToolTip(iconItem.element, iconItem.tooltip, iconItem.ttdirection);
};

GridMenubar.prototype.menuItemOnClick = function(name) {
    // Menu item activated. Turn off all groups excepting the current group
    let turnOnOff = function(element, key) {
        element.forEach(element => {
            if (element.id === name + key) {
                element.style.display = "";
            } else {
                element.style.display = "none";
            }
        });
    };
    turnOnOff(this.firstGroupDiv, firstGroupKey);
    turnOnOff(this.secondGroupDiv, secondGroupKey);
    this.activeMenu = name;
};

GridMenubar.prototype.setupIconGroups = function(menuItem) {
    let firstDiv = UtilsUI.createNewElement('div', this.firstIconRow, menuItem.name + firstGroupKey, "icon-group");
    let secondDiv = UtilsUI.createNewElement('div', this.secondIconRow, menuItem.name + secondGroupKey, "icon-group");
    this.firstGroupDiv.set(menuItem.name, firstDiv);
    this.secondGroupDiv.set(menuItem.name, secondDiv);
};

GridMenubar.prototype.removeTool = function(tool) {
    UtilsUI.removeElement(tool.element, this.toolbar);
};

module.exports = new GridMenubar();

