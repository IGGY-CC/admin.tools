const UtilsUI = require("../utils/util_dom");
const utilListeners = require("../utils/util_listeners");
const VERTICAL = 2;
const HORIZONTAL = 4;
const RESIZER_SIZE = 2;
let CHILD_COUNT = 1;

GridObject = function(name, callback, element, parent, width, height, gridArea) {
    this.name = name;
    this.isRoot = false;
    this.activeCellCallback = callback;
    this.parent = this.checkParent(parent);
    this.element = this.checkElement(element, this.parent.element);
    this.isSplit = false;
    this.isVertical = true;
    this.width = width;
    this.height = height;

    // if this.isSplit true
    this.first = null;
    this.resizer = null;
    this.second = null;
    this.isDeleted = false;
    this.active = null; // if this.isDeleted is true

    // if this.isSplit true
    this.gridFirst = 0;
    this.gridSecond = 0;
    this.gridResizer = RESIZER_SIZE;
    this.gridTemplateColumns = "";
    this.gridTemplateRows = "";
    this.gridTemplateAreas = "";
    this.gridArea = "";
    this.gridArea = gridArea;
    this.setupDefaults();
};

GridObject.prototype.checkParent = function(parent) {
  if(parent instanceof GridObject) {
      return parent;
  } else {
      this.isRoot = true;
      this.parent = {};
      this.parent.element = parent;
      return this.parent;
  }
};

GridObject.prototype.checkElement = function(element, parent) {
    if(typeof element !== "undefined" && element !== null) {
        return element;
    } else {
        return UtilsUI.createNewElement('div', parent, this.name + "-grid-" + CHILD_COUNT + "-1", "grid-content");
    }
};

GridObject.prototype.setDimensions = function(width=null, height=null) {
    if(width !== null) this.width = width;
    if(height !== null) this.height = height;
    console.log("SET ELEMENT WIDTH, HEIGHT TO: ", this.element.id, this.width, this.height);
    this.checkAndSetupGrid(false);
};

GridObject.prototype.checkAndSetupGrid = function(skipRecalculation=true) {
    if(this.isSplit && !this.isDeleted) {
        if(!skipRecalculation) this.calculateGridDimensions();
        this.setupGrid();
        /* Call the children to update their sizes */
        if(this.isVertical) {
            console.log("SETTING FIRST DIM to / SECOND DIM TO", this.gridFirst, this.gridSecond);
            if(this.first !== null) this.first.setDimensions(this.gridFirst, this.height);
            if(this.second !== null) this.second.setDimensions(this.gridSecond, this.height);
        } else {
            if(this.first !== null) this.first.setDimensions(this.width, this.gridFirst);
            if(this.second !== null) this.second.setDimensions(this.width, this.gridSecond);
        }
    } else {
        this.setupGrid();
    }
};

GridObject.prototype.calculateGridDimensions = function() {
    if(this.isSplit && !this.isDeleted) {
        // if(this.width === 0 || this.height === 0) return;
        const newSize = (this.isVertical) ? this.width - this.gridResizer : this.height - this.gridResizer;
        const ratio = this.gridFirst / (this.gridFirst + this.gridSecond);
        this.gridFirst = newSize * ratio;
        this.gridSecond = newSize - this.gridFirst;
        console.log("NEW SIZE GRID: ", this.gridFirst, this.gridSecond, newSize, ratio);
    }
};

GridObject.prototype.setGridDimensions = function(newSize, isFirst, isDiff) {
    const currentSize = (this.isVertical)? this.width : this.height;
    if (isFirst) {
        this.gridFirst = (isDiff)? this.gridFirst + newSize : newSize;
        this.gridSecond = currentSize - this.gridFirst - this.gridResizer;
    } else {
        this.gridSecond = (isDiff)? this.gridSecond + newSize : newSize;
        this.gridFirst = currentSize - this.gridSecond - this.gridResizer;
    }
    this.checkAndSetupGrid(true);
};

GridObject.prototype.setupGrid = function () {
    if(this.isSplit && !this.isDeleted) {
        const finalValue = this.gridFirst + "px " + this.gridResizer + "px " + this.gridSecond + "px";
        if(this.isVertical) {
            this.gridTemplateColumns = finalValue;
            this.gridTemplateRows = this.height + "px";
            this.gridTemplateAreas = "'first resizer second'";
        } else {
            this.gridTemplateRows = finalValue;
            this.gridTemplateColumns = this.width + "px";
            this.gridTemplateAreas = "'first' 'resizer' 'second'"
        }
        this.updateGridElement();
    } else {
        this.updateElement();
    }
};

GridObject.prototype.updateElement = function() {
    console.log("SETTING W?H FOR ELE:", this.element.id, this.width, this.height);
    this.element.style.width = this.width + "px";
    this.element.style.height = this.height + "px";
    /* Update Resizer size as well */
    if(this.resizer !== null) {
        if (this.isVertical) {
            this.resizer.style.height = this.height + "px";
            this.resizer.style.width = this.gridResizer + "px";
        } else {
            this.resizer.style.width = this.width + "px";
            this.resizer.style.height = this.gridResizer + "px";
        }
    }
};

GridObject.prototype.updateGridElement = function() {
    this.updateElement();
    this.element.style.display = "grid";
    this.element.style.gridTemplateRows = this.gridTemplateRows;
    this.element.style.gridTemplateColumns = this.gridTemplateColumns;
    this.element.style.gridTemplateAreas = this.gridTemplateAreas;
};

GridObject.prototype.doSplit = function(isVertical) {
    if(this.isSplit || this.isDeleted) {
        console.warn("This element is already split/deleted. Cannot split further!");
        return;
    }

    CHILD_COUNT++;
    const width = (isVertical)? this.width/2 : this.width;
    const height = (isVertical)? this.height : this.height / 2;

    this.first = new GridObject(this.name + "-1-" + CHILD_COUNT, this.activeCellCallback, null, this, width, height, "first");
    this.setupResizer(isVertical);
    this.second = new GridObject(this.name + "-2-" + CHILD_COUNT, this.activeCellCallback, null, this, width, height, "second");

    console.log(this.first, this.second);
    this.isSplit = true;
    this.isVertical = isVertical;

    let newSize = (isVertical)? width : height;
    this.setGridDimensions(newSize, true);
};

GridObject.prototype.deleteActiveCell = function() {
    if(this.isRoot) {
        console.warn("CANNOT DELETE FROM ROOT ELEMENT");
    }

    let parent = this.parent;

    if(parent.isDeleted) {
        console.warn("This object already has an object deleted. Cannot delete further!");
        return;
    }

    parent.gridResizer = 0;
    if(parent.first !== null && parent.first.element.id === this.element.id) {
        parent.setGridDimensions(0, true, false);
        parent.first = null;
    } else {
        parent.setGridDimensions(0, false, false);
        parent.second = null;
    }
    parent.resizer = null;
    parent.deleted = true;
    // if(parent.first.element.id === this.element.id) {
    //     parent.gridSecond += parent.gridFirst + RESIZER_SIZE;
    //     parent.gridFirst = 0;
    //     UtilsUI.removeElement(parent.first, parent.element, true);
    //     parent.first = null;
    // } else {
    //     parent.gridFirst += parent.gridSecond + RESIZER_SIZE;
    //     parent.gridSecond = 0;
    //     UtilsUI.removeElement(parent.second, parent.element, true);
    //     parent.second = null;
    // }
    //
    // UtilsUI.removeElement(parent.resizer, parent.element, false);
    // parent.gridResizer = 0;
    // parent.resizer = null;
    //
    // let newSize = (parent.isVertical)? width : height;
    // this.setGridDimensions(newSize, true);

};

GridObject.prototype.setupResizer = function(isVertical) {
    const classText = (isVertical)? "vertical" : "horizontal";
    this.resizer = UtilsUI.createNewElement('div', this.element, this.name + "-R-" + CHILD_COUNT, "resize-handle" + " " + classText);
    this.resizer.style.gridArea = "resizer";
    this.resizer.style.width = (isVertical)? RESIZER_SIZE + "px" : this.width + "px";
    this.resizer.style.height = (isVertical)? this.height + "px" : RESIZER_SIZE + "px";
    this.resizer.style.background = "red";
    this.addEventListener(this.resizer);
};

GridObject.prototype.addEventListener = function(resizeHandleElement) {
    utilListeners.addRemoveListener("mousedown", this.startResizing.bind(this), this.element.id, false, resizeHandleElement);
};

GridObject.prototype.startResizing = function(event) {
    utilListeners.addRemoveListener( "mousemove", this.resizeColumn.bind(this), this.element.id, false, this.element);
    utilListeners.addRemoveListener("mouseup", this.finishResizing.bind(this), this.element.id, false, this.element);
};

GridObject.prototype.resizeColumn = function(event) {
    // if(this.activeResizer !== event.target) return;
    const target = event.target;
    const mouseOffset =  (this.isVertical)? event.movementX : event.movementY;
    this.setGridDimensions(mouseOffset, true, true);
};

GridObject.prototype.finishResizing = function(event) {
    utilListeners.addRemoveListener("mousemove", null, this.element.id,true);
};


GridObject.prototype.setupDefaults = function() {
    this.updateElement();
    if(this.gridArea !== null && typeof this.gridArea !== "undefined") this.element.style.gridArea = this.gridArea;
    this.element.onclick = this.onClick.bind(this);
};

GridObject.prototype.onClick = function(event) {
    if(this.element === event.target) {
        this.activeCellCallback(this);
    }
};

module.exports = GridObject;