ws = {};

const _server = "localhost";
const _port = "16443";

ws.Manager = function (type, server, port, secure) {
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

ws.Manager.prototype.prepareDefaultEndPoint = function(session, command, action, object) {
    this.urlPath = "/ws/" + session + "/" + command + "/" + action + "/" +
                    this.makeEncodedJSONString(object);
};

ws.Manager.prototype.prepareEndPoint = function(urlPath) {
    this.urlPath = urlPath;
};

ws.Manager.prototype.makeConnection = function(resolve, reject) {
    if(this.type === "ws") {
        return this.makeWSConnection(resolve, reject);
    } else {
        return this.makeHTTPConnection(resolve, reject);
    }
};

ws.Manager.prototype.makeHTTPConnection = function(resolve, reject) {
    let URL = this.https + this.server + ":" + this.port + this.urlPath;
    status = function(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(resolve(response));
        } else {
            return Promise.reject(reject(new Error(response.statusText)));
        }
    };

    return fetch(URL).then(status);
};

ws.Manager.prototype.makeWSConnection = function(resolve, reject) {
    let _this = this;
    return new Promise(() => {
        let URL = _this.wss + _this.server + ":" + _this.port  + _this.urlPath;
        let server = new WebSocket(URL);
        server.onopen = function() {
            resolve(server);
        };
        server.onerror = function(err) {
            reject(err);
        };
    });
};
