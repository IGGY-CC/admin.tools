// SOURCE FILE: admin.tools/src/main/scripts/util/util_dom.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let util = require("../scripts/utils/util");

util.UI = {};

util.UI.createNewElement = function(type, parent, id, className, onClick, text, placeholder) {
    let element = document.createElement(type);
    if(util.UI.checkParam(parent)) parent.appendChild(element);
    if(util.UI.checkParam(id)) element.id = id;
    if(util.UI.checkParam(className)) element.className = className;
    if(util.UI.checkParam(text)) element.innerHTML = text;
    if(util.UI.checkParam(placeholder)) element.placeholder = placeholder;

    return element;
};

util.UI.removeElement = function(element, parent, cleanUp=true) {
    let removeChild = (child, parent) => {
        let c = child.lastElementChild;
        if(c) {
            removeChild(c, child);
        }
        while (c) {
            parent.removeChild(child);
            c = parent.lastElementChild;
        }
        child = null;
    };

    if(cleanUp) {
        removeChild(element, parent);
    } else {
        return parent.removeChild(element);
    }
};

util.UI.wrapIconInNewElement = function(type, parent, id, className, iconClass, onClick, isSpan=false) {
    let wrapper = util.UI.createNewElement(type, parent, id, className, onClick);
    let icon;
    if(isSpan) {
        icon = util.UI.createNewElement("span", wrapper, null, iconClass, onClick);
    } else {
        icon = util.UI.createNewElement("i", wrapper, null, iconClass, onClick);
    }
    return { wrapper: wrapper, icon: icon };
};

util.UI.addIconToInput = function(id, iconClass, parent) {
    let icon = this.createNewElement("i", parent, id);
    icon.className = "fa fa-lg fa-fw " + iconClass;
    icon.ariaHidden = true;
};

util.UI.checkParam = function(param) {
    return (param !== "" && typeof param !== "undefined" && param !== null);
};