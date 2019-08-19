tabs = {};

tabs.Manager = function() {
    onloadManager.onLoad(this.tabResize.bind(this));
    resizeManager.onResize(this.tabResize.bind(this));
    onloadManager.onLoad(this.setupTabs.bind(this));
    this.lastOnClick = null;
    this.tabActivateCallbacks = [];
    this.tabDeActivateCallbacks = [];
};

tabs.Manager.prototype.tabResize = function() {
    let parent = document.querySelector("#properties-bar");
    let width = parent.clientWidth;
    let height = parent.clientHeight;

    let updateSize = (name) => {
        let e = document.querySelector(name);
        e.style.width = width + "px";
        e.style.height = height + "px";
    };

    updateSize("#properties");
};



tabs.Manager.prototype.setupTabs = function() {
    let tabs = document.querySelectorAll(".prop-tab-container");
    let contentElems = document.querySelectorAll(".property-div-tabs");
    let self = this;
    tabs.forEach( tab => {
        tab.onclick = function () {
            let currentClick = null;
            contentElems.forEach(content => {
                if(content.id === tab.id + "-content") {
                    currentClick = content.id;
                    content.style.display = "block";
                    self.tabActivateCallbacks.forEach(callbacks => {
                        if(callbacks.name === content.id) {
                            callbacks.callback();
                        }
                    });
                } else {
                    content.style.display = "none";
                }
            });
            self.tabDeActivateCallbacks.forEach(callbacks => {
                // this is the last clicked element
                if(callbacks.name === self.lastOnClick) {
                    callbacks.callback();
                }
            });
            self.lastOnClick = currentClick;
        };
    });
};

tabs.Manager.prototype.addActivateCallback = function(callback) {
    this.tabActivateCallbacks.push(callback);
};

tabs.Manager.prototype.addDeActivateCallback = function(callback) {
    this.tabDeActivateCallbacks.push(callback);
};

tabManager = new tabs.Manager();
