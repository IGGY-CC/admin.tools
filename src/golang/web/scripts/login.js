ws = {};

const _server = "localhost";
// const _port = "16443";
const _port = "443";


ws.Manager = function (type, server, port, secure=true) {
    this.server = server || _server;
    this.port = port || _port;
    this.type = type || "ws";

    this.wss = secure? "wss://" : "ws://";
    this.https = secure? "https://" : "http://";

    this.urlPath = "";
};

ws.Manager.prototype.makeEncodedJSONString = function(object) {
    if(typeof object === "undefined") {
        return "";
    }
    return encodeURIComponent(JSON.stringify(object));
};

ws.Manager.prototype.makeEncodedString = function(command) {
    if(typeof command === "undefined") {
        return "";
    }
    return encodeURIComponent(command);
};

ws.Manager.prototype.prepareDefaultEndPoint = function(session, command, action, object) {
    this.urlPath = "/ws/" + session + "/" + command + "/" + action + "/" +
        this.makeEncodedJSONString(object);
};

ws.Manager.prototype.prepareEndPoint = function(urlPath) {
    this.urlPath = urlPath;
};

ws.Manager.prototype.makeConnection = function(resolve, reject, responseType="json") {
    if(this.type === "ws") {
        return this.makeWSConnection(resolve, reject);
    } else {
        return this.makeHTTPConnection(resolve, reject, responseType);
    }
};

ws.Manager.prototype.makeHTTPConnection = async function(resolve, reject, type="json") {
    let URL;
    if(this.port === 80 || this.port === 443) {
        URL = this.https + this.server + this.urlPath;
    } else {
        URL = this.https + this.server + ":" + this.port + this.urlPath;
    }

    let status = function(response) {
        if (response.status >= 200 && response.status < 300) {
            let data;
            switch(type) {
                case "text":
                    data = response.text();
                    break;
                case "formData":
                    data = response.formData();
                    break;
                case "blob":
                    data = response.blob();
                    break;
                case "arrayBuffer":
                    data = response.arrayBuffer();
                    break;
                case "json":
                default:
                    data = response.json();
                    break;
            }
            console.log("CATEGORIZED DATA: ", data);
            resolve(data); //Promise.resolve(resolve(data));
            // return Promise.resolve(resolve(data));
        } else {
            return Promise.reject(reject(new Error(response.statusText)));
        }
    };

    // return application.remote.fetch(URL).then((data) => { return status(data) });
    let data = await application.remote.fetch(URL);
    return status(data);
};

ws.Manager.prototype.makeWSConnection = function(onClose, reject, onMessage, onResponseTimer, onResponse) {
    let _this = this;
    return new Promise(() => {
        let URL = _this.wss + _this.server + ":" + _this.port  + _this.urlPath;
        let server = new WebSocket(URL);
        server.onopen = function() {
            onMessage(server);
        };
        server.onerror = function(err) {
            reject(err);
        };
        server.onclose = () => { onClose() };
        server.onmessage = (evt) => { onResponseTimer(); onResponse(evt.data) };
    });
};

ws.Manager.prototype.generateSessionID = function() {
    let randArray = new Uint8Array(16);
    window.crypto.getRandomValues(randArray);

    let sessionID = '';
    for (let i = 0; i < randArray.length; i++) {
        let byte = randArray[i].toString(16);
        if (byte.length === 2) {
            sessionID += byte;
        } else {
            sessionID += '0' + byte;
        }
    }

    return sessionID;
};

let _wss = new ws.Manager("https", application.remote.authServer, application.remote.authPort, true);

_wss.makeConnection((data) => {
    data.then(options => {
        console.log("OPTIONS RECEIVED: ", options);
        options.publicKey.challenge = this.bufferDecode(options.publicKey.challenge);
        options.publicKey.user.id = this.bufferDecode(options.publicKey.user.id);
        if (options.publicKey.excludeCredentials) {
            for (let i = 0; i < options.publicKey.excludeCredentials.length; i++) {
                options.publicKey.excludeCredentials[i].id = bufferDecode(options.publicKey.excludeCredentials[i].id);
            }
        }
        let t = navigator.credentials.create({
            publicKey: options.publicKey
        });
        console.log("CREDENTIALS: ", t);
        return "hello";
    }).then((data) => {
        console.log("2ND OPTIONS RECEIVED: ", data);
    }).catch((data) => {
        console.error(data);
    });
}, (data) => {
    console.log("DATA RECEIVE FAILED: ", data);
});

// WebAuthn code from https://github.com/hbolimovsky/webauthn-example/blob/master/index.html
function bufferDecode(value) {
    // return Uint8Array.from(atob(value), c => {
    //     return c.charCodeAt(0);
    // });
    let raw = atob(value);
    let rawLength = raw.length;
    let array = new Uint8Array(new ArrayBuffer(rawLength));

    for(let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }

    return array;
}