class SSHManager {

    constructor() {
        this.logins = [];
        this.actions = ["init", "route", "share-session-ro", "share-session-rw"];
        this.terminals = new Map();
        this.sessions = new Map();
        this.aliases = new Map();
        this.parents = new Map();

        this.setupData();
        this.systemInfo();
    }

    parseAlias(connectString) {
        let params;
        if (connectString.includes("@")) {
            let host, port, username;

            // TODO: NOT COMPLETE
            let tokens = connectString.split("@");
            username = tokens[0];
            if(tokens[1].includes(":")) {
                let subTokens = tokens[1].split(":");
                host = subTokens[0];
                port = subTokens[1];
            } else if(tokens[1].trim().includes(" ")) {
                let subTokens = tokens[1].trim().split(" ");
                host = subTokens[0];
                port = subTokens[1];
                if(!isNumber(port)) {
                    port = 22;
                }
            } else {
                host = tokens[1];
                port = 22;
            }
            // TODO: Request for password or auth code or private key etc.
        } else {
            params = this.getData(connectString);
        }
        return params;
    }

    checkAlias(connectString) {

    }

    getData(alias, serverArray, rows, cols, commPty=false, admPty=false) {
        // TODO: Save to database encrypted database
        if(this.aliases.has(alias)) {
            let server = this.aliases.get(alias);
            if(this.parents.has(alias)) {
                this.getData(this.parents.get(alias), serverArray);
            }

            server.Rows = rows;
            server.Cols = cols;
            server.CommPty = commPty;
            server.AdmPty = admPty;
            serverArray.push(server);
        }
    }

    generateAlias(alias, parent, user, host, port, pass, challenges, challengePasswords, key, script) {
        this.aliases.set(alias, {
            Host: host,
            Port: port,
            User: user,
            Pass: pass,
            Challenges: challenges,
            ChallengePasswords: challengePasswords,
            Rows: 0,
            Cols: 0,
            CommPty: false,
            AdmPty: false,
            Key: key,
            Commands: script,
        });

        if(parent) this.parents.set(alias, parent);
    }

    setupData() {
        // TODO: Insert encrypted into database
        this.generateAlias("jumpbox", null, "admin", "localhost", 9038,
            "12345678", ["Verification code: "], ["@JUMPBOX"]);
        this.generateAlias("pxe", null, "root", "localhost", 9022,
            "12345678", ["Verification code: "], ["12345678"]);
        this.generateAlias("kali", null, "sanjeev", "localhost", 9222,
            "Xx1oMlgl", ["Verification code: "], ["Xx1oMlgl"]);
        this.generateAlias("windows", null, "sanje", "localhost", 22,
            "@12345678", ["Verification code: "], ["@12345678"]);
        this.generateAlias("jumpbox2", "jumpbox", "admin", "10.1.1.148", 22,
            "", ["Verification code: "], ["@JUMPBOX2"], "~/.ssh/id_rsa");
        this.generateAlias("cltzadmin", "jumpbox", "admin", "91.203.200.102", 22,
            "", ["Verification code: "], ["@CLTZADM"], null,
            ["/bin/bash /home/admin/login_to_remote.sh"]);
    }

    systemInfo() {
        setInterval(()=>{
            if(this.terminals.size > 0) {
                let activeTerminal = SSHTabs.get(ActiveTab.id);
                if(activeTerminal) {
                    // console.log("Calling for : ", activeTerminal);
                    let wss = new Socket("https");
                    let sessionID = wss.generateSessionID();
                    wss.prepareDefaultEndPoint(sessionID, "system-info", activeTerminal);
                    wss.makeConnection((response) => {
                        response.then(data => {
                            SystemInfo[ActiveTab.id] = data;
                            SystemInfoCallback["ServerInfo"]();
                        })
                    }, () => {
                    });
                }
            } // else {
            //     console.log("Not connected to any terminal yet!");
            // }
        }, 5000);
    }
}

const sshManager = new SSHManager();


class SSH {
    constructor(alias, terminalWindow, callback, action="init") {
        this.alias = alias;
        this.term = terminalWindow;

        let context = terminalWindow.executeContext;
        this.stdout = context.stdout.bind(context);
        this.stdin = context.stdin.bind(context);
        this.stderr = context.stderr.bind(context);
        this.rows = context.arg.rows;
        this.columns = context.arg.columns;

        this.parent = null;
        this.commandsOnParent = [];
        this.ip = null;
        this.hostname = null;
        this.port = null;
        this.action = action;

        this.wss = new Socket();
        this.sessionID = this.wss.generateSessionID();

        this.callback = callback;
        this.connected = false;
        this.interval = 0;
        this.history = [];

        // this.setUp();
    }

    // setUp() {
    //     let aliasObject = sshManager.getData(this.alias);
    //     this.parent = aliasObject.parent;
    //     this.commandsOnParent = aliasObject.commandsOnParent;
    //     this.ip = aliasObject.ip;
    //     this.hostname = aliasObject.hostname;
    //     this.port = aliasObject.port;
    // }

    async initConnect() {
        let serverInfo = [];
        sshManager.getData(this.alias, serverInfo, this.rows, this.columns, true, true);
        if(serverInfo.length === 0) {
            throw new Error("Cannot find the server relevant to the given alias.");
        }
        let jsonEncoded = this.wss.makeEncodedJSONString(serverInfo);
        let action = (this.action === "init")? (serverInfo.length > 1)? "route" : this.action : this.action;
        this.wss.prepareDefaultEndPoint(this.sessionID, "ssh", action, jsonEncoded);
        console.log("SESSION ID: ", this.sessionID, this.wss.generateSessionID());
        this.connect(this.wss);
    }

    async allowShare(shareID) {
        let share = shareID.split(" ");
        let object = {};
        if(share.length === 2) {
            object.ID = share[0];
            object.Write = (share[1].toLowerCase() === "true");
        } else {
            object.ID = share[0];
            object.Write = false;
        }
        this.wss.prepareDefaultEndPoint(this.sessionID, "ssh", "allow-share-session", this.wss.makeEncodedJSONString(object));

        await this.wss.makeWSConnection(
            () => {console.error("ON CLOSE CALLED:")},
            () => {console.error("Rejected");},
            (connection) => {},
            () => {},
            ()=>{}
        );
    }

    async share(command) {
        if (command.toLowerCase().startsWith("id=")) {
            let commandAttrs = command.slice(3).split(" ");
            let source = commandAttrs[0];
            let destination = commandAttrs[1];
            console.log("PARSED ATTRS: ", command, source, destination, commandAttrs);
            // if (sshManager.checkOccupiedSession(source)) {
            //     console.warn("A session already exists with that ID. cannot recreate.");
            //     return;
            // }
            // sshManager.addOccupiedSession(source);
            let action = "share-session";
            let object = {ID: destination};
            let wss = new Socket();
            let json = wss.makeEncodedJSONString(object);
            console.log("JSON OUTPUT: ", json);
            wss.prepareDefaultEndPoint(source, "ssh", action, json);
            await this.connect(wss);
        }
    }

    async connect(wss) {
        SSHTabs.set(ActiveTab.id, this.alias);
        await wss.makeWSConnection(
            () => {
                console.error("ON CLOSE CALLED");
                this.onClose("Server " + this.alias + " closed connection!");
                SSHTabs.delete(ActiveTab.id);
            }, () => {
                console.error("CONNECTION REJECTED");
                this.onClose("Connection attempt to server " + this.alias + " rejected :(");
                SSHTabs.delete(ActiveTab.id);
            }, (connection) => {
                if(sshManager.sessions.has(this.alias)) {
                    sshManager.sessions.get(this.alias).push(this.sessionID)
                } else {
                    sshManager.sessions.set(this.alias, [this.sessionID]);
                }
                // TODO: FOR SECURITY REASONS, ITS BETTER TO NOT SAVE connection
                sshManager.terminals.set(this.sessionID, connection);
                this.onStart();
                this.term.executeContext.stdin = (ch) => connection.send(ch);
                this.term.inRemote = true;
                // this.term.onRoute(connection.send);
            }, () => {
                this.closeProgress();
            },
            this.stdout.bind(this.term.executeContext)
        );
    }

    onStart() {
        this.stdout("\u001b[31mConnecting to \u001b[32m" + this.alias + "\u001b[0m\u001b[0m.");
        this.interval = setInterval(() => {
            this.stdout("  .");
        }, 400);
        setTimeout(() => {
            this.closeProgress();
        }, 15000);
    }

    onClose(message) {
        this.connected = false;
        this.closeProgress();
        this.stderr(this.throwError(message) + "\r\n", ()=>{});
        this.term.inRemote = false;
        this.term.jarvisReadline = null;
        this.term.createContext();
        if(this.callback) {
            console.log("CALLBACK: ", this.callback);
            this.callback();
        }
    }

    closeProgress() {
        if(this.interval) {
            this.stdout("\r\n");
            clearInterval(this.interval);
            this.interval = 0;
        }
    }

    resize(rows, cols) {

    }

    throwError(message) {
        return "\u001b[31m--==[\u001b[43m " + message + " \u001b[0m\u001b[31m]==--\u001b[0m";
    }
}

module.exports = SSH;