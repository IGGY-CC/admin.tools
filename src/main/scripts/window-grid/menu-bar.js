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

GridMenubar.prototype.setupDropDown = function(iconItem) {
    let row = (iconItem.row === 1)? this.firstGroupDiv.get(iconItem.pluginName) : this.secondGroupDiv.get(iconItem.pluginName);
    let wrapper = UtilsUI.createNewElement(
        'div',
        row,
        iconItem.id,
        "tool");

    iconItem.element = wrapper;
    let dropDown = UtilsUI.createNewElement('input', wrapper, iconItem.id + "-drop-down", "selected", "", "", "Theme");
    dropDown.type = "text";

    let ul = UtilsUI.createNewElement('ul', wrapper, iconItem.id + "-drop-down-ul", "values");
    iconItem.dropDownEntries.forEach(dropDownEntry => {
        UtilsUI.createNewElement('li', ul, "", "", iconItem.ddcallback.bind(null, dropDownEntry), dropDownEntry);
    });
    new SimpleBar(ul);

    UtilsUI.setToolTip(iconItem.element, iconItem.tooltip, iconItem.ttdirection);
    this.setupDropDownDefaults(iconItem);
};

GridMenubar.prototype.setupDropDownDefaults = function(iconItem) {
    const inputField = document.querySelector('#' + iconItem.id + '-drop-down');
    const dropdown = document.querySelector('#' + iconItem.id + '-drop-down-ul');
    console.log("FINAL VALUES: ", '#' + iconItem.id + '-drop-down-ul', dropdown);
    const dropdownArray = [...document.querySelectorAll('#' + iconItem.id + '-drop-down-ul' + ' li')];

    dropdown.classList.add('open');
    inputField.focus(); // Demo purposes only
    let valueArray = [];
    dropdownArray.forEach(item => {
        valueArray.push(item.textContent);
    });

    console.log("VALUE ARRAY: ", valueArray);
    const closeDropdown = () => {
        dropdown.classList.remove('open');
    };

    inputField.addEventListener('input', () => {
        dropdown.classList.add('open');
        let inputValue = inputField.value.toLowerCase();
        let valueSubstring;
        if (inputValue.length > 0) {
            for (let j = 0; j < valueArray.length; j++) {
                if (!(inputValue.substring(0, inputValue.length) === valueArray[j].substring(0, inputValue.length).toLowerCase())) {
                    console.log("NOT MATCHED: ", inputValue, valueArray[j]);
                    dropdownArray[j].classList.add('closed');
                } else {
                    console.log("MATCHED: ", inputValue, valueArray[j]);
                    dropdownArray[j].classList.remove('closed');
                }
            }
        } else {
            for (let i = 0; i < dropdownArray.length; i++) {
                dropdownArray[i].classList.remove('closed');
            }
        }
    });

    dropdownArray.forEach(item => {
        item.addEventListener('click', evt => {
            inputField.value = item.textContent;
            dropdownArray.forEach(dropdown => {
                dropdown.classList.add('closed');
            });
        });
    });

    inputField.addEventListener('focus', () => {
        inputField.placeholder = 'Type to filter';
        dropdown.classList.add('open');
        dropdownArray.forEach(dropdown => {
            dropdown.classList.remove('closed');
        });
    });

    inputField.addEventListener('blur', () => {
        inputField.placeholder = 'Select Theme';
        dropdown.classList.remove('open');
    });

    document.addEventListener('click', evt => {
        const isDropdown = dropdown.contains(evt.target);
        console.log("IS DROPDOWN: ", isDropdown);
        const isInput = inputField.contains(evt.target);
        console.log("IS INPUT: ", isInput);
        if (!isDropdown && !isInput) {
            dropdown.classList.remove('open');
        }
    });
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
    let firstDiv = UtilsUI.createNewElement('div', this.firstIconRow, menuItem.pluginName + firstGroupKey, "icon-group");
    let secondDiv = UtilsUI.createNewElement('div', this.secondIconRow, menuItem.pluginName + secondGroupKey, "icon-group");
    this.firstGroupDiv.set(menuItem.pluginName, firstDiv);
    this.secondGroupDiv.set(menuItem.pluginName, secondDiv);
};

GridMenubar.prototype.removeTool = function(tool) {
    UtilsUI.removeElement(tool.element, this.toolbar);
};

module.exports = new GridMenubar();

