let grid = document.querySelector("#grid-container");
let resizeHandle = document.querySelectorAll(".resize-handle");
let gridName, axis, direction;

const VERTICAL = 1;
const HORIZONTAL = 2;
const RIGHT = 4;
const LEFT = 8;
const TOP = 16;
const BOTTOM = 32;

function startResizing(event) {
    let column = event.target;
    for (let i=0; i<= resizeHandle.length-1; i++){
        if (column === resizeHandle[i]){
            axis = (resizeHandle[i].parentNode.className.includes("vertical"))?
                            VERTICAL : HORIZONTAL;
            let computedStyle = getComputedStyle(resizeHandle[i].parentElement);
            if(axis === VERTICAL) {
                direction = (resizeHandle[i].parentNode.className.includes("left"))?
                    LEFT : RIGHT;
                if(direction === LEFT) {
                    gridName = computedStyle.gridColumnStart;
                } else {
                    gridName = computedStyle.gridColumnEnd;
                }
            } else {
                direction = (resizeHandle[i].parentNode.className.includes("top"))?
                    TOP : BOTTOM;
                if(direction === TOP) {
                    gridName = computedStyle.gridRowStart;
                } else {
                    gridName = computedStyle.gridRowEnd;
                }
            }
        }
    }

    window.addEventListener(("mousemove"), resizeColumn);
    window.addEventListener(("mouseup"), finishResizing);
    window.addEventListener(("touchmove"), resizeColumn);
    window.addEventListener(("touchend"), finishResizing);
}

function resizeColumn(event) {
    /**
     * Mouse position in pixels
     */
    let mousePosition =  (axis === VERTICAL)?
                        event.clientX : event.clientY;
    let computedStyle = getComputedStyle(grid);
    let gridSize;
    let gridArea = computedStyle.gridTemplateAreas;
    let gridRows = gridArea.match(/"[^"]+"/g);
    let gridIndex = -1;
    let rowIndex = 0;

    /**
     * This loop detects where the current element (gridName) falls in.
     * As the gridAre is a matrix of rows and columns, the first time
     * the gridName is found becomes the gridName location. If we are
     * checking for horizontal axis, it is the row number (rowIndex)
     * else it will be the column index.
     */
    for(let row of gridRows) {
        let rowAreaArr = row.toLocaleUpperCase().split(' ');
        // Column index
        gridIndex = rowAreaArr.indexOf(gridName.toLocaleUpperCase());
        if(gridIndex > -1) {
            // Row index
            if(axis === HORIZONTAL) gridIndex = rowIndex;
            break;
        }
        rowIndex += 1;
    }

    /**
     * Get the measurements of cols or rows as declared with
     * grid-template-rows or grid-template-columns
     */
    if(axis === VERTICAL) {
        gridSize = computedStyle.gridTemplateColumns;
    } else {
        gridSize = computedStyle.gridTemplateRows;
    }

    let gridSizeArray = gridSize.split(' ');
    let spaceBefore = 0;

    /**
     * If the resizer is on the start of the element/cell, total size of cells
     * before the current cell is taken. If the resizer is on the end of
     * the element/cell, then the total size of cells including the current
     * cell is taken.
     */
    let includeCurrentCell = 0;
    if(direction === RIGHT || direction === BOTTOM) {
        includeCurrentCell = 1;
    }
    for (let i = 0; i < (gridIndex + includeCurrentCell); i++) {
        spaceBefore += parseInt(gridSizeArray[i]);
    }

    /**
     * Get the adjacent cell widths/heights including current cell
     */
    let prevElementSize = parseInt(gridSizeArray[gridIndex-1]);
    let crntElementSize = parseInt(gridSizeArray[gridIndex]);
    let nextElementSize = parseInt(gridSizeArray[gridIndex+1]);

    /**
     * Calculate the different from the current mouseposition to the
     * total space calculated before the current cell. If the value
     * is negative, the mouse is moving in the opposite direction.
     * (current cell size increases if resizer is at start of the cell
     * or decreases if resizer is at end of the cell)
     */
    let pixelDifference = mousePosition - spaceBefore;


    if(direction === LEFT || direction === TOP) {
        gridSizeArray[gridIndex] = (crntElementSize - pixelDifference) + "px";
        gridSizeArray[gridIndex - 1] = (prevElementSize + pixelDifference) + "px";
    } else {
        gridSizeArray[gridIndex] = (crntElementSize + pixelDifference) + "px";
        gridSizeArray[gridIndex + 1] = (nextElementSize - pixelDifference) + "px";
    }

    /**
     * Update the setting with the calculated value.
     */
    if(axis === VERTICAL) {
        grid.style.gridTemplateColumns = gridSizeArray.join(' ');
    } else {
        grid.style.gridTemplateRows = gridSizeArray.join(' ');
    }
}

function finishResizing(){
    window.removeEventListener(("mousemove"), resizeColumn);
    window.removeEventListener(("touchmove"), resizeColumn);
}

for (let i=0; i<= resizeHandle.length-1; i++){
    console.log("Setting mousedown event for: ", resizeHandle[i]);
    resizeHandle[i].addEventListener(("mousedown"), startResizing);
    resizeHandle[i].addEventListener(("touchend"), startResizing);
}