// SOURCE FILE: admin.tools/src/main/scripts/util/util_dom.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let UtilsUI = {};

UtilsUI.createNewElement = function(type, parent, id, className, onClick, text, placeholder) {
    let element = document.createElement(type);
    if(UtilsUI.checkParam(parent)) parent.appendChild(element);
    if(UtilsUI.checkParam(id)) element.id = id;
    if(UtilsUI.checkParam(className)) element.className = className;
    if(UtilsUI.checkParam(onClick)) element.addEventListener("click", onClick);
    if(UtilsUI.checkParam(text)) element.innerHTML = text;
    if(UtilsUI.checkParam(placeholder)) element.placeholder = placeholder;

    return element;
};

UtilsUI.removeElement = function(element, parent, cleanUp=true) {
    if(element === null && cleanUp === false) {
        console.warn("REMOVING LAST CHILD FROM THE PARENT. IS IT INTENDED?");
    }

    let removeChildren = parent => {
        if(parent === null || typeof parent === "undefined") return;
        let c = parent.lastElementChild;
        while(c) {
            removeRecursive(c, parent);
            c = parent.lastElementChild;
        }
    };

    let removeRecursive = (child, parent) => {
        if(child !== null) {
            removeChildren(child);
            console.log("REMOVING: ", child);
            parent.removeChild(child);
        } else {
            // Request is to remove all children from parent
            removeChildren(parent);
        }
    };

    if(cleanUp === true) {
        if(element !== null && typeof element !== "undefined") {
            removeChildren(element);
            if(parent !== null && typeof parent !== "undefined") return parent.removeChild(element);
        } else {
            // Request is to remove all children from parent
            removeChildren(parent);
        }
    } else {
        if(parent !== null && typeof parent !== "undefined") return parent.removeChild(element);
    }
};

UtilsUI.wrapIconInNewElement = function(type, parent, id, className, iconClassOrURL, onClick, isSpan=false) {
    let wrapper = UtilsUI.createNewElement(type, parent, id, className, onClick);
    let icon;
    if(iconClassOrURL.includes("/") || iconClassOrURL.includes("\\")) {
        icon = UtilsUI.createNewElement("img", wrapper);
        icon.src = iconClassOrURL;
    } else if(isSpan) {
        icon = UtilsUI.createNewElement("span", wrapper, null, iconClassOrURL);
    } else {
        icon = UtilsUI.createNewElement("i", wrapper, null, iconClassOrURL);
    }
    return { wrapper: wrapper, icon: icon };
};

UtilsUI.addIconToInput = function(id, iconClass, parent) {
    let icon = this.createNewElement("i", parent, id);
    icon.className = "fa fa-lg fa-fw " + iconClass;
    icon.ariaHidden = true;
};

UtilsUI.checkParam = function(param) {
    return (param !== "" && typeof param !== "undefined" && param !== null);
};

UtilsUI.setToolTip = function(element, text, direction) {
    element.setAttribute('data-tip', text);
    element.className = element.className + " tip " + direction.toLowerCase();
};

module.exports = UtilsUI;