tfa = {};

tfa.UI = function() {
    this.timer = null;
    this.newServerDiv = null;

    this.setupProgressBar();
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
                this.timer(30);
            } else {
                otp_code.style.display = "none";
            }
       }
    });
};

tfa.UI.prototype.createNewElement = function(type, id, text, parent, placeholder) {
    let element = document.createElement(type, );
    parent.appendChild(element);

    element.id = id;
    if(text !== "" && typeof text !== "undefined") element.innerHTML = text;
    if(placeholder !== "" && typeof placeholder !== "undefined") element.placeholder = placeholder;

    return element;
};

tfa.UI.prototype.addIconToInput = function(id, iconClass, parent) {
    let icon = this.createNewElement("i", id, "", parent);
    icon.className = "fa fa-lg fa-fw " + iconClass;
    icon.ariaHidden = true;
};

tfa.UI.prototype.addNewServerUI = function() {
    this.newServerDiv = document.createElement("div");
    this.newServerDiv.className = "tfa";
    this.newServerDiv.id = "new-tfa-server";

    this.createNewElement("div", "new-tfa-key-label", "Key", this.newServerDiv);
    let key = this.createNewElement("textarea", "new-tfa-key-input", "", this.newServerDiv);
    this.addIconToInput("new-tfa-input-icon", "fa-key", this.newServerDiv);
    key.addEventListener("keyup", () => this.activateAddButton());

    this.createNewElement("div", "new-tfa-name-label", "Name/Alias", this.newServerDiv);
    let nameInput = this.createNewElement("input", "new-tfa-name-input", "Name/Alias", this.newServerDiv);
    this.addIconToInput("new-tfa-input-ticon", "fa-address-card", this.newServerDiv);
    nameInput.type = "text";
    nameInput.addEventListener("keyup", () => this.activateAddButton());


    let buttonDiv = this.createNewElement("div", "tfa-add-server-buttons", "", this.newServerDiv);
    let clearButton = this.createNewElement("button", "clear-button", "clear", buttonDiv);
    let closeButton = this.createNewElement("button", "close-button", "close", buttonDiv);
    let createButton = this.createNewElement("button", "create-button", "add", buttonDiv);

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

tfa.Manager = function() {
    this.ui = new tfa.UI();
    this.sessionID = "hello-world";
    this.servers = [];
    this.getRegisteredList();
};

tfa.Manager.prototype.getRegisteredList = function() {
    let list = new WebSocket("ws://localhost:16443/ws/" +
        this.sessionID + "/otp/list");
    list.close();
};

tfa.Manager.prototype.makeWSObject = function(object) {
    return encodeURIComponent(JSON.stringify(object));
};

tfa.Manager.prototype.addNewServer = function(name, key) {
    let otpData = {};
    otpData.Name = name;
    otpData.Key = key;

    let list = new WebSocket("ws://localhost:16443/ws/" +
        "new-otp-gen" + "/otp/add-new/" + this.makeWSObject(otpData));
    list.close();
};

tfaManager = new tfa.Manager();