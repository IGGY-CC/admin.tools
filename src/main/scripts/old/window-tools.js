let window_tools = {};

/**
 * Window Resize manager
 * @constructor
 */
window_tools.ResizeManager = function() {
    this.resize_callbacks = [];
    window.onresize = this.resize.bind(this);
};

window_tools.ResizeManager.prototype.onResize = function(callback) {
    this.resize_callbacks.push(callback)
};

window_tools.ResizeManager.prototype.resize = function() {
    this.resize_callbacks.forEach(callback => callback());
};

resizeManager = new window_tools.ResizeManager();


/**
 * Window onload manager
 * @constructor
 */

window_tools.OnLoadManager = function() {
    this.onload_callbacks = [];
    window.onload = this.load.bind(this);
};

window_tools.OnLoadManager.prototype.onLoad = function(callback) {
    this.onload_callbacks.push(callback)
};

window_tools.OnLoadManager.prototype.load = function() {
    this.onload_callbacks.forEach(callback => callback());
};

onloadManager = new window_tools.OnLoadManager();