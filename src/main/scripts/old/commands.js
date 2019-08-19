executeTermCommand = function(command, terminalObj, callback) {
    if(command.startsWith(",")) {
        command = command.substr(1);
    }
    let terminal = terminalObj.terminal;
    let _command = command;
    let _value;
    
    if(command.includes("=")) {
        let tmp = command.split("=");
        _command = tmp[0].trim();
        _value = tmp[1].trim();
    } else if (command.includes(":")) {
        let tmp = command.split(":");
        _command = tmp[0].trim();
        _value = tmp[1].trim();
    } else if (command.includes(" ")) {
        let tmp = command.split(" ");
        _command = tmp[0].trim();
        tmp.shift();
        _value = tmp.join(" ").trim();
    }

    switch(_command) {
        case "background":
        case "background-color":
            terminal.prefs_.set('background-color', _value);
            break;
        case "cursor":
            tmp = _value.toUpperCase();
            if(["BEAM", "UNDERLINE", "BLOCK"].includes(tmp)) {
                terminal.prefs_.set('cursor-shape', _value.toUpperCase());
            } else {
                terminal.io.println("BEAM, UNDERLINE & BLOCK are supported cursor shapes");
            }
            break;
        case "font":
            if(isNaN(_value)) {
                if(_value === "default" || _value === "reset") {
                    terminal.prefs_.set('font-family', '"DejaVu Sans Mono", "Noto Sans Mono", "Everson Mono", FreeMono, Menlo, Terminal, monospace');
                    terminal.prefs_.set('font-size', 12);
                } else {
                    terminal.prefs_.set('font-family', _value);
                }
            } else {
                terminal.prefs_.set('font-size', _value); 
            }
            break;
        case "ssh":
            terminalObj.conn = new WebSocket("ws://localhost:16443/ws/first/ssh/localhost/9038/admin/12345678/" + terminal.screenSize.width + "/" + terminal.screenSize.height);
            terminalObj.conn.onclose = function (evt) {
                console.log("connection closed!");
            };
            terminalObj.conn.onmessage = function (evt) {
                terminal.io.print(evt.data);
            };    
            break;
        case "sshrun":
            test = new WebSocket("ws://localhost:16443/ws/first/sshrun");
            break;
        default:
            try {
                terminal.prefs_.set(_command, _value);
            } catch(e) {}
            
    }
};