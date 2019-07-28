'use strict';

let ui = {};

ui.ModalWindow = function() {
    // Get modal window
    this.modal = document.querySelector("#info-window");

    // Get the close button
    this.closeButton = document.querySelector("#close-info-window");

    // close the button on clicking the close button
    this.closeButton.onclick = this.closeWindow.bind(this);

    // activate trigger button/element
    this.activateButton = null;

    // Close the modal window, if user clicks outside of it.
    window.onclick = this.closeOnOutOfFocus.bind(this);
  
};

ui.ModalWindow.prototype.createWindow = function(name, width, height, roundedness, x, y) {

};

ui.ModalWindow.prototype.closeWindow = function() {
    this.modal.style.display = "none";
};

ui.ModalWindow.prototype.closeOnOutOfFocus = function(event) {
    if(event.target !== this.modal) {
        this.modal.style.display = "none";
    }
};

ui.ModalWindow.prototype.addModal = function(button) {
    this.activateButton = document.querySelector(button);
    this.activateButton.onclick = this.activateWindow.bind(this);
};

ui.ModalWindow.prototype.activateWindow = function() {
    this.modal.style.display = "block";
};

let testModal = new ui.ModalWindow();
testModal.addModal("#terminal-btn");
//testModal.activateWindow();
