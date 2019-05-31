var gridster = [];

$(function () {
    gridster[0] = $("#main-tool-menu ul").gridster({
        namespace: '#main-tool-menu',
        widget_base_dimensions: [20, 12],
        widget_margins: [0, 0]
    }).data('gridster');
});