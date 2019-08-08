tabResize = function() {
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

onloadManager.onLoad(tabResize);
resizeManager.onResize(tabResize);

setupTabs = function() {
    let tabs = document.querySelectorAll(".prop-tab-container");
    let contentElems = document.querySelectorAll(".property-div-tabs");
    tabs.forEach( tab => {
        tab.onclick = function () {
            contentElems.forEach(content => {
                if(content.id === tab.id + "-content") {
                    content.style.display = "block";

                } else {
                    content.style.display = "none";
                }
            });
        };
    });
};

onloadManager.onLoad(setupTabs);


