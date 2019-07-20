fullScreen = function() {
    theGrid = document.querySelector("#the-grid");
    theGrid.style["grid-template-rows"] = "1px auto 1px";
    theGrid.style["grid-template-columns"] = "1px auto 1px";
    hideGrid("#menu");
    hideGrid("#toolbar");
    hideGrid("#properties-bar");
};

hideGrid = function(id) {
    document.querySelector(id).style.display = "hidden";
};

// fullScreen();