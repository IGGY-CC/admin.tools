var gridster;

    $(function () {
        gridster = $(".gridster > div").gridster({
            widget_base_dimensions: [10, 50],
            widget_margins: [0, 0],
            autogrow_cols: true,
            helper: 'clone',
            resize: {
                enabled: true,
                // max_size: [4, 4],
                // min_size: [1, 1]
            }
        }).data('gridster');
    });


/*
var gridster = [];

$(function () {
    gridster[0] = $("#main-tool-menu ul").gridster({
        namespace: '#main-tool-menu',
        widget_base_dimensions: [20, 12],
        widget_margins: [0, 0]
    }).data('gridster');
});                                                          
*/

/* const __$ = (selector) => document.querySelector(selector)
const __$$ = (selector) => document.querySelectorAll(selector)
const on = (elem, type, listener) => elem.addEventListener(type, listener)

on(__$('#toggle-left'), 'click', () => {
    __$$(".start").forEach((elem) => elem.classList.toggle('closed'))
})
on($('#toggle-right'), 'click', () => {
    __$$(".end").forEach((elem) => elem.classList.toggle('closed'))
})

on(__$('#resize-handle'), 'mousedown', (e) => {
    e.preventDefault();
    console.log(e);
    on(__$('#resize-handle'), 'mousemove', (ed) => {
        document.getElementById("dash").style.setProperty('grid-column', '2 / span 3');
    });
}) */
