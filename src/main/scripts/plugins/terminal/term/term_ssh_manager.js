class SSHManager {
    constructor() {
        this.servers = new Map();
        this.sessions = new Map();
        this.sockets = new Map();
        this.occupiedSessions = new Set();
    }

    addSession(id, sessionID) {
        this.sessions.set(id, sessionID);
    }

    checkOccupiedSession(sessionID) {
        return this.occupiedSessions.has(sessionID);
    }

    addOccupiedSession(sessionID) {
        if(this.occupiedSessions.has(sessionID)) {
            throw new Error("A session with ID " + sessionID + " already exists!");
        }
        this.occupiedSessions.add(sessionID)
    }

    addSocket(id, socket) {
        this.sockets.set(id, socket);
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