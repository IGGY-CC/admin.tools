'use strict'

let swal = require('sweetalert');

let tfa = {};

tfa.UI = function() {
    this.timer = null;
    this.newServerDiv = null;

    onloadManager.onLoad(this.activateTFAClick.bind(this));
    onloadManager.onLoad(this.setupAddNewServer.bind(this));

};

tfa.UI.prototype.activateTFAClick = function() {
    let otp_servers = document.querySelectorAll(".tfa");
    otp_servers.forEach(otp_server => {
       otp_server.onclick = () => {
            let otp_code  = document.querySelector("#" + otp_server.id + "-otp");
            if(otp_code.style.display === "none") {
                otp_code.style.display = "";
                //this.timer(30);
            } else {
                otp_code.style.display = "none";
            }
       }
    });
};

tfa.UI.prototype.checkParam = function(param) {
    return (param !== "" && typeof param !== "undefined")
};

tfa.UI.prototype.createNewElement = function(type, parent, id, className, text, placeholder) {
    let element = document.createElement(type);
    if(this.checkParam(parent)) parent.appendChild(element);
    if(this.checkParam(id)) element.id = id;
    if(this.checkParam(className)) element.className = className;
    if(this.checkParam(text)) element.innerHTML = text;
    if(this.checkParam(placeholder)) element.placeholder = placeholder;

    return element;
};

tfa.UI.prototype.addIconToInput = function(id, iconClass, parent) {
    let icon = this.createNewElement("i", parent, id);
    icon.className = "fa fa-lg fa-fw " + iconClass;
    icon.ariaHidden = true;
};

tfa.UI.prototype.addNewServerUI = function() {
    this.newServerDiv = document.createElement("div");
    this.newServerDiv.className = "tfa";
    this.newServerDiv.id = "new-tfa-server";

    this.createNewElement("div", this.newServerDiv, "new-tfa-key-label", "", "Key");
    let key = this.createNewElement("textarea", this.newServerDiv, "new-tfa-key-input");
    this.addIconToInput("new-tfa-input-icon", "fa-key", this.newServerDiv);
    key.addEventListener("keyup", () => this.activateAddButton());

    this.createNewElement("div", this.newServerDiv, "new-tfa-name-label", "", "Name/Alias");
    let nameInput = this.createNewElement("input", this.newServerDiv, "new-tfa-name-input");
    this.addIconToInput("new-tfa-input-ticon", "fa-address-card", this.newServerDiv);
    nameInput.type = "text";
    nameInput.addEventListener("keyup", () => this.activateAddButton());


    let buttonDiv = this.createNewElement("div", this.newServerDiv, "tfa-add-server-buttons");
    let clearButton = this.createNewElement("button", buttonDiv, "clear-button", "", "clear");
    let closeButton = this.createNewElement("button", buttonDiv, "close-button", "", "close");
    let createButton = this.createNewElement("button", buttonDiv, "create-button", "", "add");

    clearButton.onclick = this.clearNewServerInput;
    closeButton.onclick = this.manageAddNewServerUI.bind(this);
    createButton.onclick = this.addNewServer.bind(this);

    let sibling = document.querySelector("#tfa-title-add-server");
    sibling.parentNode.insertBefore(this.newServerDiv, sibling.nextSibling);
};

tfa.UI.prototype.clearNewServerInput = function() {
    document.querySelector("#new-tfa-name-input").value = "";
    document.querySelector("#new-tfa-key-input").value = "";
};

tfa.UI.prototype.manageAddNewServerUI = function() {
    if(this.newServerDiv === null) {
        this.addNewServerUI();
        this.activateAddButton();
        return;
    }

    let display = this.newServerDiv.style.display;
    if(display === "none") {
        this.newServerDiv.style.display = "";
    } else {
        this.newServerDiv.style.display = "none";
    }
};

tfa.UI.prototype.activateAddButton = function() {
    let name = document.querySelector("#new-tfa-name-input").value.trim();
    let key = document.querySelector("#new-tfa-key-input").value.trim();
    console.log(name, key);
    let createButton = document.querySelector("#create-button");

    if(name === "" || key === "") {
        createButton.style.color = "#7f7f7f";
    }

    if(name !== "" && key !== "") {
        createButton.style.color = "black";
    }
};

tfa.UI.prototype.addNewServer = function() {
    let name = document.querySelector("#new-tfa-name-input").value.trim();
    let key = document.querySelector("#new-tfa-key-input").value.trim().toUpperCase();

    tfaManager.addNewServer(name, key);
};

tfa.UI.prototype.setupAddNewServer = function() {
    let addServer = document.querySelector("#tfa-title-add");
    // let existingColor = addServer.style.backgroundColor;
    // addServer.onmousedown = () => addServer.style.backgroundColor = "blue";
    // addServer.onmouseup = () => addServer.style.backgroundColor = existingColor;
    addServer.onclick = this.manageAddNewServerUI.bind(this);
};

tfa.UI.prototype.setupProgressBar = function() {
//circle start
    let progressBar = document.querySelector('.e-c-progress');
    let pointer = document.getElementById('e-pointer');
    const displayOutput = document.querySelector('.display-remain-time');
    let length = Math.PI * 2 * 100;

    progressBar.style.strokeDasharray = length;

    let update = function(value, timePercent) {
        progressBar.style.strokeDashoffset = -length - length * value / (timePercent);
        pointer.style.transform = `rotate(${360 * value / (timePercent)}deg)`;
    };

    let displayTimeLeft = function(timeLeft) { //displays time on the input
        let seconds = timeLeft % 60;
        let displayString = `${seconds < 10 ? '0' : ''}${seconds}`;
        displayOutput.textContent = displayString;
        update(timeLeft, wholeTime);
    };

    let intervalTimer;
    let timeLeft;
    let wholeTime = 0.5 * 60; // manage this to set the whole time

    update(wholeTime, wholeTime); //refreshes progress bar
    displayTimeLeft(wholeTime);

    this.timer = function(seconds) { //counts time, takes seconds
        let remainTime = Date.now() + (seconds * 1000);
        displayTimeLeft(seconds);

        intervalTimer = setInterval(function () {
            timeLeft = Math.round((remainTime - Date.now()) / 1000);
            if (timeLeft < 0) {
                clearInterval(intervalTimer);
                displayTimeLeft(wholeTime);
                return;
            }
            displayTimeLeft(timeLeft);
        }, 1000);
    }
};

tfa.UI.prototype.displayServers = function(name) {
    let parent = document.querySelector("#otp-servers");

    let serverElement = this.createNewElement("div", parent, name, "tfa");
    let tfaServer = this.createNewElement("div", serverElement, "", "tfa-server");
    let tfaServerIcon = this.createNewElement("div", tfaServer,"", "tfa-server-icon");
    let tfaImage = this.createNewElement("img", tfaServerIcon);
    tfaImage.src = "../assets/ATC_Bournemouth.svg";
    tfaImage.width = "25";
    tfaImage.height = "27";

    let tfaServerName = this.createNewElement("div", serverElement, "", "tfa-server-name");
    tfaServerName.innerHTML = name;

    let deleteIconDiv = this.createNewElement("div", serverElement, name + "-delete", "tfa-delete");
    let deleteIcon = this.createNewElement("div", deleteIconDiv);
    deleteIcon.className = "fa fa-lg fa-fw fa-trash";
    deleteIcon.onclick = this.confirmDelete.bind(null, name, () => serverElement.parentNode.removeChild(serverElement));

    let serverOTP = this.createNewElement("div", parent, name + "-otp", "tfa-otp");
    let tfaTimerCircle = this.createNewElement("div", serverOTP, name + "-timer", "tfa-timer-circle");
    tfaTimerCircle.innerHTML = "" +
        "<svg width=\"40\" viewBox=\"0 0 38 38\" xmlns=\"http://www.w3.org/2000/svg\">" +
        "  <g transform=\"translate(19,19)\">" +
        "    <circle r=\"15\" class=\"e-c-base\"/>" +
        "    <g transform=\"rotate(-90)\">" +
        "      <circle r=\"15\" class=\"e-c-progress\"/>" +
        "      <g id=\"e-pointer\">" +
        "          <circle cx=\"15\" cy=\"0\" r=\"0.8\" class=\"e-c-pointer\"/>" +
        "      </g>" +
        "    </g>" +
        "  </g>" +
        "</svg>"

    let timer = this.createNewElement("div", tfaTimerCircle, name + "-rtimer", "display-remain-time");
    timer.innerHTML = "30";
    let otpValue = this.createNewElement("div", serverOTP, name + "-otp-value", "otp-value");
    otpValue.innerHTML = "12345678";
    serverOTP.style.display = "none";
};

tfa.UI.prototype.confirmDelete = function(name, callback) {
    swal({
        title: "Confirm to delete OTP client: " + name,
        text: "Are you sure that you want to delete the OTP client: " + name + "?",
        icon: "warning",
        dangerMode: true,
    }).then(x => {
        callback();
        swal("Deleted!", "The OTP client with name " + name + " has been deleted!", "success");
    }).catch(err => {
        swal("Error Deleting!", "The OTP client with name " + name + " could not be deleted!", "fail");
    });
};

tfa.Manager = function() {
    this.ui = new tfa.UI();
    this.sessionID = "hello-world";
    this.servers = [];
    this.getRegisteredList();
};

tfa.Manager.prototype.getRegisteredList = function() {
    let _ws = new ws.Manager("http");
    _ws.prepareDefaultEndPoint(this.sessionID, "otp", "list");
    let promise = _ws.makeConnection(() => {}, () => {});
    promise.then(response => {
        return response.json();
    }).catch(err => {
        console.log("ERROR: ", err);
    }).then(data => {
        this.prepareList(data);
    }).catch(err => {
        console.log("Error: ", err);
    });
};

tfa.Manager.prototype.prepareList = function(data) {
    data.forEach(alias => {
        console.log("ADDING SERVER: ", alias);
        this.ui.displayServers(alias);
    });
    // this.setupProgressBar();
};

tfa.Manager.prototype.makeWSObject = function(object) {
    return encodeURIComponent(JSON.stringify(object));
};

tfa.Manager.prototype.addNewServer = function(name, key) {
    let otpData = {};
    otpData.Name = name;
    otpData.Key = key;

    let _ws = new ws.Manager("http");
    _ws.prepareDefaultEndPoint("new-otp-gen", "otp", "add-new", otpData);
    let promise = _ws.makeConnection(()=>{}, ()=>{});
    promise.then(response => {
        console.log("Fulfilled with response: ", response.json());
    }).catch(err => {
       console.log("ERROR: ", err);
    });
};

let tfaManager = new tfa.Manager();

module.exports = tfaManager;