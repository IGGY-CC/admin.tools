'use strict';

const clipboardWatcher = require('electron-clipboard-watcher');
const textClips = [];
const imageClips = [];

clipboardWatcher({
    // (optional) delay in ms between polls
    watchDelay: 1000,

    // handler for when image data is copied into the clipboard
    onImageChange: function (nativeImage) {
        imageClips.push(nativeImage);
    },

    // handler for when text data is copied into the clipboard
    onTextChange: function (text) {
        textClips.push(text);
        console.log("TEXT SELECTED: ", text);
    }
});