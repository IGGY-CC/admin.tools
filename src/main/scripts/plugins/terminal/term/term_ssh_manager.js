class SSHManager {
    constructor() {
        this.servers = new Map();
        this.sessions = new Map();
    }

    addSession(id, sessionID) {
        this.sessions.set(id, sessionID);
    }

    getSessionByServer(server) {
        return this.sessions.get(this.servers.get(server));
    }

    connectTo(id, server) {
        this.servers.set(server, id);
        switch(server) {
            case("jumpbox"):
                return "admin:localhost:9038:12345678";
            case("pxe"):
                return "root:localhost:9022:12345678";
        }
    }
}

module.exports = new SSHManager();