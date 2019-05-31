var gridster = [];

$(function () {

    gridster[0] = $("#left-bar ul").gridster({
        namespace: '#left-bar',
        widget_base_dimensions: [100, 55],
        widget_margins: [0, 0]
    }).data('gridster');

    gridster[1] = $("#demo-2 ul").gridster({
        namespace: '#demo-2',
        widget_base_dimensions: [200, 110],
        widget_margins: [10, 10]
    }).data('gridster');

});