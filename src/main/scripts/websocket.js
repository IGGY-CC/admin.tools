ws = {};

const _server = "localhost";
const _port = "16443";

ws.Manager = function (server, port, secure) {
    this.server = server || _server;
    this.port = port || _port;
    this.wss = secure? "wss://" : "ws://";
    this.urlPath = "";
};

ws.Manager.prototype.makeEncodedJSONString = function(object) {
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
    let _this = this;
    let promise = new Promise(function(resolve, reject) {
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
