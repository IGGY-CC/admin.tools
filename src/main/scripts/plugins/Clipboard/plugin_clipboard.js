// SOURCE FILE: admin.tools/src/main/scripts/plugins/ServerInfo/plugin_authenticator.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
const { clipboard } = require('electron');

// let Clip = function() {
//     this.isActive = false;
//     this.isPinned = false;
//     this.isObfuscated = false;
//     this.isSystem = false;
//     this.isText = false;
//     this.isImage = false;
//     this.selectedTimes = Set();
// };

let Clipboard = function () {
    this.pluginName = "Clipboard";
    // subclass of PluginRegister
    PluginRegister.call(this, this.pluginName);
    this.position = 4;

    this.slideOut = null;
    this.clipboardWatcher = require('electron-clipboard-watcher');

    // database for saving/retrieving pinned values
    this.db = LocalDB.load("clipboard");
    this.active = null; // active clipboard content
    this.textClips = new Set();
    this.imageClips = new Set();
    this.pinned = new Set();
    this.obfuscated = new Set();
    this.clipData = {};
    this.watchDelay = 100;
};

Clipboard.prototype = Object.create(PluginRegister.prototype);

// Start the plugin functionality
Clipboard.prototype.Start = function () {
    let containerObject = {
        name: "Clipboard",
        icon: "far fa-clipboard",
        pluginPosition: this.position,
        location: RIGHT,
        isActive: true,
        isContentFixed: true,
        openCallback: this.getSlideOutContent.bind(this),
        closeCallback: this.removeSlideOutContent.bind(this),
        refreshCallback: this.refreshSlideOutContent.bind(this),
        requireHeader: true,
        maxSize: null,
        minSize: null,
        size: 200,
    };

    this.slideOut = this.createSlideOutEntry(containerObject);

    // Setup and load clipboard
    this.loadClipboard();
    this.activateClipboard();

    // Setup the GUI
    this.setupHTML();
    this.getSlideOutContent();
    window.addEventListener('resize', this.getSlideOutContentOnResize.bind(this));
};

Clipboard.prototype.loadClipboard = function() {
    // 1. load any pinned entries from database
    this.db.find({}, (err, docs) => {
        if(!err) {
            docs.forEach(doc => {
                if(doc.text) {
                    this.pinned.add(doc.text);
                    this.clipData[doc.text] = doc.time;
                    if (doc.mask) {
                        this.obfuscated.add(doc.text);
                    }
                }
            });
            this.getSlideOutContent();
        }
    });

    // 2. get the current clipboard content
    // TODO: Shall we do this? Will it not be a privacy concern?
    // TODO: An option to handle clipboard originated from this app only!? (an eventlistener to listen on ctrl-c)
    let date = getDate("2-digit", "short", "numeric", "2-digit", "2-digit", "2-digit", null);
    let text = clipboard.readText();

    if(text) {
        this.textClips.add(text);
        this.clipData[text] = [date];
        this.active = text;
        // For security/privacy reasons, lets mask it by default
        this.obfuscated.add(text);
    }
};

Clipboard.prototype.activateClipboard = function() {
    let self = this;
    this.clipboardWatcher({
        // (optional) delay in ms between polls
        watchDelay: this.watchDelay,

        // handler for when image data is copied into the clipboard
        onImageChange: function (nativeImage) {
            self.imageClips.add(nativeImage);
        },

        // handler for when text data is copied into the clipboard
        onTextChange: function (text) {
            self.active = text;
            let date = getDate("2-digit", "short", "numeric", "2-digit", "2-digit", "2-digit", null);
            if(!self.pinned.has(text) && !self.textClips.has(text)) {
                self.textClips.add(text);
                self.clipData[text] = [date];
            } else {
                if(self.pinned.has(text)) {
                    self.pinned.delete(text); // to re-order the entries
                    self.pinned.add(text);
                } else {
                    self.textClips.delete(text); // to re-order the entries
                    self.textClips.add(text);
                }
                self.clipData[text].push(date);
            }
            self.getSlideOutContent();
        }
    });
};

Clipboard.prototype.setupHTML = function() {
    this.entries = UtilsUI.createNewElement('div', this.slideOut.content, null, "clipboard");
    this.activeEntry = UtilsUI.createNewElement('div', this.entries, null, "clipboard-entries");
    this.pinnedEntries = UtilsUI.createNewElement('div', this.entries, null, "clipboard-entries");
    this.clipEntries = UtilsUI.createNewElement('div', this.entries, null, "clipboard-entries");
};

Clipboard.prototype.getSlideOutContentOnResize = function() {
    // TODO: BAD CODE, JUST FOR DEMO PURPOSES
    const rightContent = document.querySelector("#right-tab-bar");
    const cs = getComputedStyle(rightContent);
    this.slideOut.content.style.height = parseInt(cs.height) - this.slideOut.headerHeight + "px";
    this.getSlideOutContent();
};

Clipboard.prototype.getSlideOutContent = function() {
    UtilsUI.removeElement(null, this.activeEntry);
    UtilsUI.removeElement(null, this.pinnedEntries);
    UtilsUI.removeElement(null, this.clipEntries);

    this.showEntry(this.activeEntry, this.active, this.pinned.has(this.active));

    this.pinned.forEach(entry => {
        if(entry !== this.active) {
            this.showEntry(this.pinnedEntries, entry, true);
        }
    });

    this.textClips.forEach(entry => {
        if(entry !== this.active) {
            this.showEntry(this.clipEntries, entry);
        }
    });
};

// https://stackoverflow.com/questions/6003271/substring-text-with-html-tags-in-javascript
function html_substr( str, count ) {

    var div = document.createElement('div');
    div.innerHTML = str;

    walk( div, track );

    function track( el ) {
        if( count > 0 ) {
            var len = el.data.length;
            count -= len;
            if( count <= 0 ) {
                el.data = el.substringData( 0, el.data.length + count );
            }
        } else {
            el.data = '';
        }
    }

    function walk( el, fn ) {
        var node = el.firstChild;
        do {
            if( node.nodeType === 3 ) {
                fn(node);
                    //          Added this >>------------------------------------<<
            } else if( node.nodeType === 1 && node.childNodes && node.childNodes[0] ) {
                walk( node, fn );
            }
        } while( node = node.nextSibling );
    }
    return div.innerHTML;
}

Clipboard.prototype.displayEntry = function(element, entry) {
    const space = "␣";
    const tab = "→→→→";
    const newLine = "↵\n";

    entry = entry.replace(/</gi, "&lt;");
    const updated_entry = entry; //entry.replace(/ /gi, "<span class='whitespace-symbols'>" + space + "</span>")
                                 // .replace(/\t/gi, "<span class='whitespace-symbols'>" + tab + "</span>")
                                 //.replace(/\n/gi, "<span class='whitespace-symbols'>" + newLine + "</span>");

   
    element.innerHTML = html_substr(updated_entry, 34)
    if(entry.length != element.innerHTML.length) {
	element.innerHTML = element.innerHTML + " <a>...</a>";
    }
    element.title = entry;
    element.style.wordBreak = "break-all";
};

Clipboard.prototype.showEntry = function(parent, entry, isPin=false) {
    if(!entry) return;
    let activeEntry = (entry === this.active)? " active" : "";
    let activePin = isPin? " active" : "";
    let clipClass = isPin? " clip-pin" : " clip-text";
    let clip = UtilsUI.createNewElement('div', parent, null, "clipboard-entry clipboard-defaults" + clipClass + activeEntry);
    let clipText = UtilsUI.createNewElement('div', clip, null, "clipboard-text");
    let secret = UtilsUI.createNewElement('div', clip, null, "clipboard-secret");
    if(entry.length > 3) {
        // Since first three letters are NOT masked, if text size is less than 4 chars, mask button needn't be displayed
        UtilsUI.createNewElement('span', secret, null, "fas fa-mask");
    }
    let pin = UtilsUI.createNewElement('div', clip, null, "clipboard-pin" + activePin);
    UtilsUI.createNewElement('span', pin, null, "fas fa-thumbtack");
    let deleteClip = UtilsUI.createNewElement('div', clip, null, "clipboard-delete tool tip right");
    if(entry !== this.active) {
        // Delete button doesn't work on active clipboard content
        UtilsUI.createNewElement('span', deleteClip, null, "fas fa-trash");
    }
    deleteClip.setAttribute('data-tip', "double-click to delete");
    this.displayEntry(clipText, entry);

    // check if there already is a secret key
    this.obfuscateClip(entry, secret, clipText);

    // Add event listeners
    clip.addEventListener('click', evt => {
        evt.stopPropagation();
        navigator.clipboard.writeText(entry).then(function() {
            //
        }, function(err) {
            console.error('Could not copy text to clipboard: ', err);
        });
    });

    pin.addEventListener('click', evt => {
        evt.stopPropagation();
        this.updatePinnedEntry(pin, entry);
        this.getSlideOutContent();
        this.obfuscateClip(entry, secret, clipText);
    });

    deleteClip.addEventListener('click', evt => {
        evt.stopPropagation();
        this.deleteEntry(evt, entry, secret, clipText);
    });

    secret.addEventListener('click', evt => {
        this.obfuscate(evt, entry, secret, clipText);
    });
};

Clipboard.prototype.deleteEntry = function (evt, entry, secret, clipText) {
    evt.stopPropagation();

    if (this.obfuscated.has(entry)) {
        this.obfuscated.delete(entry);
    }

    if (this.pinned.has(entry)) {
        this.deletePinnedEntry(entry);
    }

    if (this.textClips.has(entry)) {
        this.textClips.delete(entry);
    }

    this.getSlideOutContent();
    this.obfuscateClip(entry, secret, clipText);
};

Clipboard.prototype.obfuscate = function (evt, entry, secret, clipText) {
    evt.stopPropagation();
    this.updateSecretEntry(entry, secret, clipText);
};

Clipboard.prototype.obfuscateClip = function(entry, secret, text) {
    if (this.obfuscated.has(entry) && entry.length > 3) {
        let maskedText = entry.substr(0, 3) + entry.substr(3).replace(/./gi, '*');
        this.displayEntry(text, maskedText);
        secret.classList.add("active");
    }
};

Clipboard.prototype.updateSecretEntry = function(entry, secret, text) {
    if(!this.obfuscated.has(entry)) {
        this.obfuscated.add(entry);
        this.obfuscateClip(entry, secret, text);
        this.persistMaskOnPinned(true, entry);
    } else {
        this.obfuscated.delete(entry);
        this.displayEntry(text, entry);
        secret.classList.remove("active");
        this.persistMaskOnPinned(false, entry);
    }
};

Clipboard.prototype.persistMaskOnPinned = function(state, entry) {
    if(this.pinned.has(entry)) {
        this.db.find({text: entry}, (err, docs) => {
            if(!err) {
                docs.forEach(doc => {
                    this.db.update({ _id: doc._id }, { $set: { mask: state } }, {});
                });
            }
        });
    }
};

Clipboard.prototype.updatePinnedEntry = function (pin, entry) {
    if (this.pinned.has(entry)) {
        this.deletePinnedEntry(entry);
        this.textClips.add(entry);
    } else {
        this.pinned.add(entry);
        LocalDB.insert(this.db, {text: entry, mask: this.obfuscated.has(entry), time: this.clipData[entry]});
        this.textClips.delete(entry);
    }
};

Clipboard.prototype.deletePinnedEntry = function(entry) {
    LocalDB.remove(this.db, "text", entry, (err, num) => {
        console.error(err, num);
    });
    this.pinned.delete(entry);
};

Clipboard.prototype.removeSlideOutContent = function() {
    // console.log("TODO: Removing default log content");
};

Clipboard.prototype.refreshSlideOutContent = function() {
    // console.log("TODO: Refresh default log content");
};



// init logic
module.exports = Clipboard;