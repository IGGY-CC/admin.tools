'use strict';

let ui = {};

ui.ModalWindow = function(name, width, height, background, roundness, x, y) {

    this.name = name;
    this.width = width;
    this.height = height;

    // The div that holds the content
    this.modal = this.createWindow(background, roundness);

    // Create modal header
    this.header = this.createElement("header");
    // create close button
    this.createCloseButton(roundness);

    // create content
    this.content = this.createElement("content");

    // create content
    this.footer = this.createElement("footer");

    // activate trigger button/element
    this.activateButton = null;

    // Close the modal window, if user clicks outside of it.
    window.onclick = this.closeOnOutOfFocus.bind(this);
  
};

ui.ModalWindow.prototype.createWindow = function(background, roundness) {
    let element = document.createElement("div");
    element.id = this.name;
    element.className = "modal-content-iw";
    element.style.width = this.width + "px";
    element.style.height = this.height + "px";
    element.style.background = background;
    element.style.borderRadius = roundness + "px";
    element.style.position = "fixed";
    element.style.zIndex = "10001";
    element.style.margin = "0 auto";
    element.style.top = "50%";
    element.style.left = "50%";
    element.style.marginTop = "-" + this.height/2 + "px";
    element.style.marginLeft = "-" + this.width/2 + "px";
    element.style.boxShadow = "10px 10px  5px rgba(0,0,0,0.6)";
    element.style.padding = roundness + "px";

    document.body.appendChild(element);
    return element;
};

ui.ModalWindow.prototype.createElement = function(desc) {
    let element = document.createElement("div");
    element.id = this.name + "-" + desc;
    element.className = "modal-" + desc + "-iw";
    this.modal.appendChild(element);
    return element;
};

ui.ModalWindow.prototype.addContent = function(html) {
    this.content.innerHTML = html;
};

ui.ModalWindow.prototype.createCloseButton = function(roundness) {
    let closeButton = document.createElement("span");
    closeButton.id = this.name + "-close-window";
    closeButton.className = "close";
    closeButton.innerHTML = "<i class=\"fa fa-power-off\"></i>";
    closeButton.style.color = "brown";
    closeButton.style.fontSize = "15px";
    closeButton.style.display = "inline-block";
    closeButton.style.background = "fa fa-power-off";
    closeButton.style.padding = "4px";
    closeButton.style.paddingRight = (roundness + 2) + "px";
    // closeButton.style.textShadow = "1px 1px  2px rgba(0,0,0,0.6)";

    closeButton.onclick = this.closeWindow.bind(this);
    this.header.appendChild(closeButton);
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


let testModal = new ui.ModalWindow("QR", 400, 150, "rgb(0, 188, 213)", 10);
testModal.addModal("#passwords-btn");
testModal.activateWindow();
testModal.addContent("" +
    "<div style='display: grid; grid-template: 50% 50% 50% 50%'>" +
    "<div style='grid-area: 1 / 1 / 100 / 50'><img src=\"../assets/face_auth_fm.svg\" style=\"position: relative; left: -5px; top: -15px; filter: drop-shadow( 2px 2px 2px rgba(0, 0, 0, .3));\" width='150vw'/></div>" +
    "<div style='grid-area: 1 / 50 / 100 / 100;'><p style='font-family: MonacoRegular;'>WELCOME</p><p><br/></p><p>Login: _____</p></div>" +
    "</div>" +
    "");
//console.error(testModal);