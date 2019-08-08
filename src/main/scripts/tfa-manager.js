tfa = {};

tfa.UI = function() {
    this.timer = null;
    this.setupProgressBar();
    onloadManager.onLoad(this.activateTFAClick.bind(this));
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
    this.servers = [];
};

tfa.Manager.prototype.getRegisteredList = function() {

};






tfaUI = new tfa.UI();
