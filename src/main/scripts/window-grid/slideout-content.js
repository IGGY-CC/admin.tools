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
    this.location = RIGHT;

    this.tab = null;
    this.container = null;

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
    // return;
    let _name = this.name.replace(" ", "-");
    let _key = this.getLocationKey(false) + "content";
    if(doActivate) {
        // GridElements[_key].updateSize(0, true, false, RIGHT);
        document.querySelector("#" + _key).style.display = "";

        if(this.isContentLoaded) {
            if (this.refreshCallback !== null) this.refreshCallback(CONTENT_KEY + _name);
        } else {
            this.openCallback(CONTENT_KEY + _name);
        }
        // disable resize handle if content is fixed
        if(this.isContentFixed) {
            // document.querySelector("#" + this.getLocationKey() + RESIZER_KEY).style.display = "none";
        } else {
            // document.querySelector("#" + this.getLocationKey() + RESIZER_KEY).style.display = "";
        }
    } else {
        // gridWindow_.hideCell(_key, (this.location === BOTTOM), gridWindow_.getResizerDirection(location));
        if(this.closeCallback !== null) this.closeCallback(CONTENT_KEY + _name);
        document.querySelector("#" + _key).style.display = "none";
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

SlideOut.prototype.setupContainer = function() {
    let parentContainer = "#" + this.getLocationKey();
    let textLocation = null;
    let _name = this.name.replace(" ", "-");

    let parent = document.querySelector(parentContainer);
    let container = UtilsUI.createNewElement('div', parent, SLIDEOUT_KEY + "-content-" + _name, SLIDEOUT_KEY + "-grid-container");
    this.setupContainerGrid(container);
    this.setupContainerSize(container);

    let headerArea = UtilsUI.createNewElement('div', container, SLIDEOUT_KEY + "-header-" + _name, "header-area");
    let mainContent = UtilsUI.createNewElement('div', container, CONTENT_KEY + _name, "main-content");

    headerArea.style.gridArea = "header-area";
    mainContent.style.gridArea = "main-content";
    mainContent.style.width = this.size + "px";

    if(this.location !== BOTTOM) {
        let borderArea = UtilsUI.createNewElement('div', container, SLIDEOUT_KEY + "-border-" + _name, "border-area");
        borderArea.style.gridArea = "border-area";
    }

    this.container = container;
};

SlideOut.prototype.setupContainerGrid = function(container) {
    container.style.display = "grid";
    let headerSize = (this.requireHeader)? 25 : 0;
    let borderSize = (this.isContentFixed)? 2 : 0; // If fixed content, we will disable resize handle and this will act as border.

    container.style.gridTemplateRows = headerSize + "px auto";

    if(this.location === BOTTOM) {
        container.style.gridTemplateColumns = "auto";
        container.style.gridTemplateAreas = '"header-area" "main-content"';
    } else {
        container.style.gridTemplateColumns = (this.location === LEFT)? 'auto ' + borderSize + "px" : borderSize + "px auto";
        container.style.gridTemplateAreas = (this.location === LEFT)? '"header-area header-area" "main-content border-area"' :
            '"header-area" "header-area" "border-area main-content"';
    }
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
    this.activeTabs = [];
};

/**
 * containerObject {
 *     name: XXX,
 *     icon: XXX,
 *     location: RIGHT | LEFT | BOTTOM,
 *     isActive: true, // content window open
 *     isContentFixed: false,  // resizable
 *     openCallback: callback on open. Provide the content to be loaded in the content window
 *     closeCallback: callback on close
 *     refreshCallback: If content needs to be refreshed
 *     requireHeader: true
 *     maxSize: XXpx // max resizable width/height of the content element (if isContentFixed is false)
 *     minSize: XXpx // min resizable width/height of the content element (if isContentFixed is false)
 *     size: XXpx // default width/height of the content element
 *
 * }
 */
SlideOutManager.prototype.createNewEntry = function(containerObject) {
    let slideOut = this.tabMap.get(containerObject.name);
    if(!slideOut) {
        let slideOut = new SlideOut();

        this.tabMap.set(containerObject.name, slideOut);

        slideOut.name = containerObject.name;
        slideOut.isActive = containerObject.isActive;
        slideOut.isContentFixed = containerObject.isContentFixed;
        slideOut.requireHeader = containerObject.requireHeader;
        slideOut.size = containerObject.size;
        slideOut.minSize = containerObject.minSize;
        slideOut.maxSize = containerObject.maxSize;
        slideOut.location = containerObject.location;
        slideOut.openCallback = containerObject.openCallback;
        slideOut.closeCallback = containerObject.closeCallback;
        slideOut.refreshCallback = containerObject.refreshCallback;

        if(slideOut.location !== LEFT) {
            this.createNewSlideOutPair(containerObject.name, containerObject.icon, slideOut);
        }

    } else {
        console.log("Container already created for: ", containerObject.name);
    }
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

    if(slideOut.isActive) {
        this.activeTabs.push(slideOut);
        this.tabClicked(slideOut);
    }
};

SlideOutManager.prototype.tabClicked = function(slideOut) {
    this.slideouts.forEach(_slideOut => {
        if(_slideOut.id === slideOut.id) {
            _slideOut.tab.className = "tab active";
            _slideOut.activate(true);
            this.activeTabs.push(_slideOut);
        } else {
            // only deactivate slides that share the same location/side.
            if(_slideOut.location === slideOut.location) {
                _slideOut.tab.className = "tab";
                _slideOut.activate(false);
            }
        }
    });
};

SlideOutManager.prototype.createNewContainer = function(slideOut) {
    slideOut.setupContainer();
};

module.exports = new SlideOutManager();