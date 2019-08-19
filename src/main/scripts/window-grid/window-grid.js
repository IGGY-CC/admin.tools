// let grid = document.querySelector("#grid-container");
// let resizeHandle = document.querySelectorAll(".resize-horizontal .resize-handle");
// let colNumber;
//
// function startResizing(event) {
//     let column = event.target;
//     for (let i=0; i<= resizeHandle.length-1; i++){
//         if (column === resizeHandle[i]){
//             colNumber = i;
//         }
//     }
//
//     window.addEventListener(("mousemove"), resizeColumn);
//     window.addEventListener(("mouseup"), finishResizing);
// }
//
// function resizeColumn(event) {
//     let screenPixels =  event.clientX;
//     let computedStyle = getComputedStyle(grid[0]);
//     let gridColumnSize = computedStyle.gridTemplateColumns;
//     let gridColumnSizeArray = gridColumnSize.split(' ');
//     let previosColSize = 0;
//     for (let j=0; j<colNumber; j++){
//         previosColSize += parseInt(gridColumnSizeArray[j]);
//     }
//     gridColumnSizeArray[colNumber]= screenPixels-previosColSize + "px";
//     let currentColumnSize = gridColumnSizeArray.join(' ');
//     for (let j=0; j<= grid.length-1; j++){
//         grid[j].style.gridTemplateColumns = currentColumnSize;
//     }
// }
//
// function finishResizing(){
//     window.removeEventListener(("mousemove"), resizeColumn);
// }
//
// for (let i=0; i<= resizeHandle.length-1; i++){
//     resizeHandle[i].addEventListener(("mousedown"), startResizing);
// }