class SSHManager {
    constructor() {
        this.logins = [];
    }

    getData(alias) {

    }
}

const sshManager = SSHManager();


class SSH {
    constructor(alias, ip, port, stdout, stdin) {
        this.name = alias;
        this.ip = ip;
        this.port = port;
        this.stdout = stdout;
        this.stdin = stdin;
        this.wss = null;
        this.history = [];
        this.terminals = [];
        this.channels = [];
        this.connections = 0;
        this.intermediateServers = []; // Queue
    }


}