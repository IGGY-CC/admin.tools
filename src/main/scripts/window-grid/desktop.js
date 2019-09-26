const { Grid, GridUtil } = require("../utils/util_grid");
const LoadPlugins = require("../utils/util_load_plugins");

// Add the tab menu and container
const TabObject = require("../window-grid/tab-content");

'use strict';
(() => {
    const GRID_ID = "grid-container";
    const root = document.querySelector("#" + GRID_ID);
    const MAX_ROWS = 6;
    const MAX_COLS = 5;

    const TITLE_HEIGHT = 28;
    const MENU_HEIGHT = 83;
    const TOOLBAR_WIDTH = 30;
    const TAB_WIDTH = 20;
    const STATUS_HEIGHT = 15;


    const computedStyle = getComputedStyle(root);
    const width = MatrixUtil.stripPx(computedStyle.width);
    const height = MatrixUtil.stripPx(computedStyle.height);
    const grid = new Grid(root, MAX_ROWS, MAX_COLS, width, height);

    let titleBar = grid.createNode("title-bar", 0, 0, 1, MAX_COLS, TITLE_HEIGHT);
    let menuBar = grid.createNode("menu-bar", 1, 0,1, MAX_COLS, MENU_HEIGHT);
    let toolBar = grid.createNode("tool-bar",2,0,3,1,-1,TOOLBAR_WIDTH);

    let toolBarContent = grid.createNode("toolbar-tab-content", 2, 1, 3, 1);
    let mainContent = grid.createNode("main-content", 2, 2,1, 1);
    let rightTabContent = grid.createNode("right-tab-content", 2, 3, 3, 1);
    let rightTab = grid.createNode("right-tab-bar", 2, 4,3, 1, -1, TAB_WIDTH);
    let bottomTabContent = grid.createNode("bottom-tab-content", 3, 2,1, 1);
    let bottomTab = grid.createNode("bottom-tab-bar", 4, 2,1, 1,TAB_WIDTH);
    let statusBar = grid.createNode("status-bar", 5, 0,1, MAX_COLS,STATUS_HEIGHT);

    const tBC = new Resize(toolBarContent, RIGHT, 2);
    const rTC = new Resize(rightTabContent, LEFT, 2);
    const bTC = new Resize(bottomTabContent, TOP, 2);

    console.log("BEFORE UPDATING SIZE: ", grid.matrix.columns);
    bottomTabContent.updateSize(0, false, false, TOP);
    toolBarContent.updateSize(0, true, false, RIGHT);
    rightTabContent.updateSize(0, true, false, LEFT);
    console.log("AFTER UPDATING SIZE: ", grid.matrix.columns);

    const MAIN_CONTENT = document.querySelector("#main-content");
    const MAIN_TABS = "main-tabs";
    const MAIN_TAB_CONTENT = "main-tab-content";
    UtilsUI.createNewElement('div', MAIN_CONTENT, MAIN_TABS);
    UtilsUI.createNewElement('div', MAIN_CONTENT, MAIN_TAB_CONTENT);


    const CONTENT = "-content";
    const RESIZE_HANDLE = "-content-resize-handle";
    const RESIZE_VERTICAL = "resize-handle resize-vertical";
    const RESIZE_HORIZONTAL = "resize-handle resize-horizontal";

    const TOOLBAR_TAB_CONTENT = document.querySelector("#toolbar-tab-content");
    TOOLBAR_TAB_CONTENT.classList.add("resize-container");
    TOOLBAR_TAB_CONTENT.classList.add("vertical-right");
    UtilsUI.createNewElement('div', TOOLBAR_TAB_CONTENT, "toolbar" + CONTENT);
    UtilsUI.createNewElement('div', TOOLBAR_TAB_CONTENT, "toolbar" + RESIZE_HANDLE, RESIZE_VERTICAL);

    const RIGHT_TAB_CONTENT = document.querySelector("#right-tab-content");
    RIGHT_TAB_CONTENT.classList.add("resize-container");
    RIGHT_TAB_CONTENT.classList.add("vertical-left");
    UtilsUI.createNewElement('div', RIGHT_TAB_CONTENT, "right" + CONTENT);
    UtilsUI.createNewElement('div', RIGHT_TAB_CONTENT, "right" + RESIZE_HANDLE, RESIZE_VERTICAL);

    const BOTTOM_TAB_CONTENT = document.querySelector("#bottom-tab-content");
    BOTTOM_TAB_CONTENT.classList.add("resize-container");
    BOTTOM_TAB_CONTENT.classList.add("horizontal-top");
    UtilsUI.createNewElement('div', BOTTOM_TAB_CONTENT, "bottom" + RESIZE_HANDLE, RESIZE_HORIZONTAL);
    UtilsUI.createNewElement('div', BOTTOM_TAB_CONTENT, "bottom" + CONTENT);

    // Setup the basic tab layout and create a tab
    tabObject = new TabObject(grid.matrix);

    // Search and load any plugins
    require("../plugins/plugin");

    // Now that the basic desktop window is setup, load its contents / plugins
    new LoadPlugins(grid.matrix);

    const rdp = require('node-rdpjs');

    const client = rdp.createClient({
        enablePerf : true,
        autoLogin : true,
        decompress : false,
        screen : { width : 800, height : 600 },
        locale : 'en',
        logLevel : 'INFO'
    }).on('connect', function () {
    }).on('close', function() {
    }).on('bitmap', function(bitmap) {
    }).on('error', function(err) {
    }).connect('91.203.200.100', 3389);
})();