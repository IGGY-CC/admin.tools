// var gridster;
// var gridsterWidth;
// var gridsterHeight;
// var gridXSize = 20;
// var gridYSize = 20;
// var maxRows = 50;
    
// $.fn.setToMaxHeight = function () {
//     return this.height(Math.max.apply(this, $.map(this, function (e) { return $(e).height(); })));
// };

// $(function () {
//     $('#gridster-ul').setToMaxHeight();
//     gridsterWidth = $('#gridster-ul').width();
//     gridsterHeight = $('#gridster-ul').height();
//     let wd = gridsterWidth/gridXSize;
//     let ht = gridsterHeight/gridYSize;

//     gridster = $(".gridster ul").gridster({
//         widget_base_dimensions: [gridXSize, gridYSize],
//         widget_margins: [5, 5],
//         autogrow_cols: false,
//         autogrow_rows: false,
//         max_rows: 200,
//         helper: 'clone',
//         draggable: {
//             handle: 'header'
//         },
//         resize: {
//             enabled: true,
//             // max_size: [4, 4],
//             // min_size: [1, 1]
//         }
//     }).data('gridster');
//     gridster.add_widget('<li class="new"><div id="terminal" class="base-terminal"></div></li>', ht, maxRows);
// });