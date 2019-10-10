// SOURCE FILE: admin.tools/src/main/scripts/window-grid/tab-content.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const LEFT_SLIDEOUT_CONTAINER = "toolbar-content";
const RIGHT_SLIDEOUT_CONTAINER = "right-content";
const BOTTOM_SLIDEOUT_CONTAINER = "bottom-content";

const LEFT_TAB_KEY = "left-tab-";
const RIGHT_TAB_KEY = "right-tab-";
const BOTTOM_TAB_KEY = "bottom-tab-";

const SLIDEOUT_KEY = "slideout-tab";
const CONTENT_KEY = SLIDEOUT_KEY + "-main-";

let SlideOut = function() {
    this.name = null;
    this.icon = null;
    this.location = RIGHT;
    this.headerHeight = 30;
    this.pluginPosition = 0;

    this.tab = null;
    this.container = null;

    this.header = null;
    this.content = null;

    this.isActive = false;
    this.isContentLoaded = false;
    this.isContentFixed = true;
    this.requireHeader = false;

    this.minSize = 0;
    this.maxSize = 0;
    this.size = 0;

    this.openCallback = null;
    this.closeCallback = null;
    this.refreshCallback = null;
};

SlideOut.prototype.activate = function(doActivate) {
    let _name = this.name.replace(" ", "-");
    let _key = this.getLocationKey(false) + "content";
    let slideDirection = this.getSlideDirection();

    if(doActivate) {
        if(slideDirection === TOP || slideDirection === BOTTOM) {
            GridElements.get(_key).updateSize(this.size, false, false, slideDirection);
        } else {
            GridElements.get(_key).updateSize(this.size, true, false, slideDirection);
        }
        this.container.style.display = "";

        if(this.isContentLoaded) {
            if (this.refreshCallback !== null) this.refreshCallback(CONTENT_KEY + _name);
        } else {
            this.openCallback(CONTENT_KEY + _name);
        }

        this.isActive = true;
    } else {
        this.container.style.display = "none";
        if(this.closeCallback !== null) this.closeCallback(CONTENT_KEY + _name);
        this.isActive = false;
    }
    this.adjustGridSize(doActivate, this.location);
};

SlideOut.prototype.adjustGridSize = function(isOpen, location) {

};

SlideOut.prototype.getLocationKey = function(isContainer=true) {
    switch (this.location) {
        case LEFT:
            return (isContainer)? LEFT_SLIDEOUT_CONTAINER : LEFT_TAB_KEY;
        case BOTTOM:
            return (isContainer)? BOTTOM_SLIDEOUT_CONTAINER: BOTTOM_TAB_KEY;
        case RIGHT:
            return (isContainer)? RIGHT_SLIDEOUT_CONTAINER : RIGHT_TAB_KEY;
        default:
            console.error("NO LOCATION SPECIFIED");
    }
};

SlideOut.prototype.getSlideDirection = function() {
    return (this.location === LEFT)? RIGHT : (this.location === RIGHT)? LEFT : (this.location === TOP)? BOTTOM : TOP;
};

SlideOut.prototype.setupContainer = function() {
    let _key = this.getLocationKey(false) + "content";
    let slideDirection = this.getSlideDirection();
    if(slideDirection === BOTTOM || slideDirection === TOP) {
        GridElements.get(_key).updateSize(this.size, false, false, BOTTOM);
    } else {
        GridElements.get(_key).updateSize(this.size, true, false, slideDirection);
    }

    let parentContainer = "#" + this.getLocationKey();
    let textLocation = null;
    let _name = this.name.replace(" ", "-");

    let parent = document.querySelector(parentContainer);
    this.container = UtilsUI.createNewElement('div', parent, SLIDEOUT_KEY + "-content-" + _name, SLIDEOUT_KEY + "-grid-container");
    this.container.style.position = "absolute";
    this.container.style.top = 0;
    this.container.style.left = 0;
    this.container.style.zIndex = 20 + this.pluginPosition;
    this.setupContainerGrid(this.container);
    this.setupContainerSize(this.container);

    this.header = UtilsUI.createNewElement('div', this.container, SLIDEOUT_KEY + "-header-" + _name, "header-area");
    UtilsUI.createNewElement('span', this.header, SLIDEOUT_KEY + "-header-" + _name + "-icon", this.icon);
    let headerTitle = UtilsUI.createNewElement('span', this.header, SLIDEOUT_KEY + "-header-" + _name + "-title", "header-text");
    headerTitle.innerHTML = this.name;

    this.content = UtilsUI.createNewElement('div', this.container, CONTENT_KEY + _name, "slideout-main-content");
    this.content.style.overflow = "auto";

    this.header.style.gridArea = "header-area";
    this.content.style.gridArea = "main-content";
    if(location === BOTTOM) {
        this.content.style.height = this.size + "px";
    } else {
        this.content.style.width = this.size + "px";
    }

    if(this.isActive) {
        this.container.style.display = "";
    } else {
        this.container.style.display = "none";
    }
};

SlideOut.prototype.setupContainerGrid = function(container) {
    container.style.display = "grid";
    let headerSize = (this.requireHeader)? this.headerHeight : 0;

    container.style.gridTemplateRows = headerSize + "px auto";
    container.style.gridTemplateColumns = "auto";
    container.style.gridTemplateAreas = '"header-area" "main-content"';
};

SlideOut.prototype.setupContainerSize = function(container) {
    if(this.location === BOTTOM) {
        container.style.height = this.size + "px";
        if(this.isContentFixed) {
            container.style.minHeight = container.style.height;
            container.style.maxHeight = container.style.height;
        } else {
            this.maxSize && (container.style.maxHeight = this.maxSize + "px");
            this.minSize && (container.style.minHeight = this.minSize + "px");
        }
    } else {
        container.style.width = this.size + "px";
        if(this.isContentFixed) {
            container.style.minWidth = container.style.width;
            container.style.maxWidth = container.style.width;
        } else {
            this.maxSize && (container.style.maxWidth = this.maxSize + "px");
            this.minSize && (container.style.minWidth = this.minSize + "px");
        }
    }
};

let SlideOutManager = function() {
    this.tabCount = 0;
    this.slideouts = [];

    this.tabMap = new Map();
    this.activeTabs = new Set();
};

/**
 * containerObject {
 *     name: XXX,
 *     icon: XXX,
 *     pluginPosition: XX, // the order at which this plugin loads in front - or - after the other plugins
 *     location: RIGHT | LEFT | BOTTOM,
 *     isActive: true, // content window open
 *     isContentFixed: false,  // resizable
 *     openCallback: callback on open. Provide the content to be loaded in the content window
 *     closeCallback: callback on close
 *     refreshCallback: If content needs to be refreshed
 *     requireHeader: true
 *     // headerText: XXX  -- not required, shall use "name" attribute
 *     // headerIcon: XXX -- not required, shall use "icon" attribute
 *     maxSize: XXpx // max resizable width/height of the content element (if isContentFixed is false)
 *     minSize: XXpx // min resizable width/height of the content element (if isContentFixed is false)
 *     size: XXpx // default width/height of the content element
 *
 * }
 */
SlideOutManager.prototype.createNewEntry = function(containerObject) {
    let slideOut = this.tabMap.get(containerObject.name);
    console.log("Creating new entry for: ", containerObject.name);
    if(!slideOut) {
        slideOut = new SlideOut();

        this.tabMap.set(containerObject.name, slideOut);

        slideOut.name = containerObject.name;
        slideOut.icon = containerObject.icon;
        slideOut.pluginPosition = containerObject.pluginPosition;
        slideOut.isActive = containerObject.isActive;
        slideOut.isContentFixed = containerObject.isContentFixed;
        slideOut.requireHeader = containerObject.requireHeader;
        // slideOut.headerText = containerObject.headerText;
        // slideOut.headerIcon = containerObject.headerIcon;
        slideOut.size = containerObject.size;
        slideOut.minSize = containerObject.minSize;
        slideOut.maxSize = containerObject.maxSize;
        slideOut.location = containerObject.location;
        slideOut.openCallback = containerObject.openCallback;
        slideOut.closeCallback = containerObject.closeCallback;
        slideOut.refreshCallback = containerObject.refreshCallback;

        // if(slideOut.isActive) {
        //     slideOut.activate(true);
        // }

        // if(slideOut.location !== LEFT) {
            this.createNewSlideOutPair(containerObject.name, containerObject.icon, slideOut);
        // }
    } else {
        console.log("Container already created for: ", containerObject.name);
    }
    return slideOut;
};

SlideOutManager.prototype.createNewSlideOutPair = function(text, icon, slideOut) {
    /**
     *  <div class="tab">
     *      <div class="icon"><span class="fa fa-cogs"/></div>
     *      <div class="text">SYS INFO</div>
     *  </div>
     *
     */
    let _icon = (icon)? icon : "fa fa-file";
    let newTabID = text.replace(" ", "-");

    let parentContainer = (slideOut.location === RIGHT)? RIGHT_TAB_KEY : BOTTOM_TAB_KEY;
    let parent = document.querySelector("#" + parentContainer + "bar");

    /* Create and Setup TAB */
    let newTab = UtilsUI.createNewElement('div', parent, "", "tab");
    newTab.onclick = this.tabClicked.bind(this, slideOut);
    slideOut.tab = newTab;

    let iconDiv = UtilsUI.createNewElement('div', newTab, "", "icon");
    UtilsUI.createNewElement('span', iconDiv, "", _icon);

    let textDiv = UtilsUI.createNewElement('div', newTab, "", "text");
    textDiv.innerHTML = text;

    this.slideouts.push(slideOut);

    /* Create new TAB Content Pane */
    this.createNewContainer(slideOut);

    // if(slideOut.isActive) {
    //     this.activeTabs.add(slideOut);
    //     this.tabClicked(slideOut);
    // }
};

SlideOutManager.prototype.enableTab = function(_slideOut) {
    _slideOut.tab.className = "tab active";
    _slideOut.activate(true);
    this.activeTabs.add(_slideOut);
};

SlideOutManager.prototype.disableTab = function(_slideOut) {
    _slideOut.tab.className = "tab";
    _slideOut.activate(false);
    this.activeTabs.delete(_slideOut);
    if(this.activeTabs.size === 0) {
        let _key = _slideOut.getLocationKey(false) + "content";
        let slideDirection = _slideOut.getSlideDirection();
        GridElements.get(_key).updateSize(0, true, false, slideDirection);
    }
};

SlideOutManager.prototype.tabClicked = function(slideOut) {
    this.slideouts.forEach(_slideOut => {
        if(_slideOut.name === slideOut.name) {
            if(_slideOut.isActive) {
                this.disableTab(_slideOut);
            } else {
                this.enableTab(_slideOut);
            }
        } else {
            // only deactivate slides that share the same location/side.
            if(_slideOut.location === slideOut.location) {
                this.disableTab(_slideOut);
            }
        }
    });
};

SlideOutManager.prototype.createNewContainer = function(slideOut) {
    slideOut.setupContainer();
};

module.exports = new SlideOutManager();