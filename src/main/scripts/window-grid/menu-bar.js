// SOURCE FILE: admin.tools/src/main/scripts/window-grid/menu-bar.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const menu = document.querySelector("#menu-bar");
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

    this.menu = UtilsUI.createNewElement('div', menu, "menu-items");
    this.firstIconRow = UtilsUI.createNewElement('div', menu, firstIconRow);
    this.secondIconRow = UtilsUI.createNewElement('div', menu, secondIconRow);
    this.widgetArea = UtilsUI.createNewElement('div', menu, widgetArea);
    this.progressBar = UtilsUI.createNewElement('div', menu, progressBar);
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
    if(this.menuitems.has(menuItem.pluginName)) {
        console.error("The Menu item is already added. Not adding.");
        return;
    }

    this.menuitems.set(menuItem.pluginName, this.setupMenuItemUI(menuItem));
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
        menuItemKey + menuItem.pluginName,
        (menuItem.isActive) ? menuItemActiveClass : menuItemClass,
        this.menuItemOnClick.bind(this, menuItem.pluginName)
    );

    /* Add text */
    menu.innerHTML = menuItem.displayName;

    /* Activate mousetouch and mouseover */
    utilListeners.addRemoveListener("mouseover", this.menuItemOnClick.bind(this, menuItem.pluginName), this.menu.id, false, this.menu);
    if(menuItem.isActive) {
        this.activeMenu = menuItem.pluginName;
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
    let row = (iconItem.row === 1)? this.firstGroupDiv.get(iconItem.pluginName) : this.secondGroupDiv.get(iconItem.pluginName);
    let baseClass = "tool";
    if(iconItem.icon.includes("/") || iconItem.icon.includes("\\")) {
        baseClass += " icon-with-url";
    } else {
        baseClass += " font-icon";
    }
    let wrapper = UtilsUI.wrapIconInNewElement(
        (typeof iconItem.type === "undefined")? 'div' : iconItem.type,
        row,
        iconItem.id,
        baseClass,
        iconItem.icon,
        iconItem.callback, true);

    iconItem.element = wrapper.wrapper;
    iconItem.iconElement = wrapper.icon;
    UtilsUI.setToolTip(iconItem.element, iconItem.tooltip, iconItem.ttdirection);
};

GridMenubar.prototype.addSpacer = function(pluginName, onRow, width) {
    let row = (onRow === 1)? this.firstGroupDiv.get(pluginName) : this.secondGroupDiv.get(pluginName);
    let wrapper = UtilsUI.createNewElement(
        'div',
        row,
        "",
        "spacer");
    wrapper.style.width = width + "px";
};

GridMenubar.prototype.setupDropDown = function(iconItem) {
    let row = (iconItem.row === 1)? this.firstGroupDiv.get(iconItem.pluginName) : this.secondGroupDiv.get(iconItem.pluginName);
    let wrapper = UtilsUI.createNewElement(
        'div',
        row,
        iconItem.id,
        "tool-with-label");

    // let label = UtilsUI.createNewElement('div', wrapper, iconItem.id + "-label", "select-drop-down-label");
    // label.innerHTML = iconItem.placeholder;

    iconItem.element = wrapper;
    let dropDown = UtilsUI.createNewElement('select', wrapper, iconItem.id + "-drop-down", "select-drop-down");
    if(typeof iconItem.width !== "undefined") {
        dropDown.style.width = iconItem.width + "px";
    }

    dropDown.addEventListener('change', iconItem.ddcallback.bind(null, dropDown));

    let defaultOption = UtilsUI.createNewElement('option', dropDown, iconItem.id + "-drop-down-default-option", "select-option-placeholder");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.innerHTML = iconItem.placeholder;

    iconItem.dropDownEntries.forEach(dropDownEntry => {
        let option = UtilsUI.createNewElement('option', dropDown, "", "select-option", iconItem.ddcallback.bind(null, dropDownEntry), dropDownEntry);
        option.value = dropDownEntry;
        option.innerHTML = dropDownEntry;
    });

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
    /* Turn off the highlight of old menu */
    document.querySelector("#" + menuItemKey + this.activeMenu).className = menuItemClass;
    /* and turn on the highlight for the newly active menu */
    document.querySelector("#" + menuItemKey + name).className = menuItemActiveClass;

    /* Update the active menu name */
    this.activeMenu = name;
};

GridMenubar.prototype.setupIconGroups = function(menuItem) {
    let firstDiv = UtilsUI.createNewElement('div', this.firstIconRow, menuItem.pluginName.toLowerCase() + firstGroupKey, "icon-group");
    let secondDiv = UtilsUI.createNewElement('div', this.secondIconRow, menuItem.pluginName.toLowerCase() + secondGroupKey, "icon-group");
    this.firstGroupDiv.set(menuItem.pluginName, firstDiv);
    this.secondGroupDiv.set(menuItem.pluginName, secondDiv);
};

GridMenubar.prototype.removeTool = function(tool) {
    UtilsUI.removeElement(tool.element, this.toolbar);
};

module.exports = new GridMenubar();

