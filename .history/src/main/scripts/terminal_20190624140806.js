window.onload = function() {
    hterm.defaultStorage = new lib.Storage.Memory();
    lib.init(setupHterm, console.log.bind(console));
};

log = function(mesg) {
    console.log(mesg);
};

setupHterm = function() {
    opt_profileName = "default";
    const terminal = new hterm.Terminal(opt_profileName);
    conn = new WebSocket("ws://localhost:16443/ws");
    
    conn.onclose = function (evt) {
        console.log("connection closed!");
    };

    
    terminal.onTerminalReady = function () {
        const io = terminal.io.push();
        const prompt_size = 7;
    
        // var $head = $("#terminal > iframe").contents().find("head");
        // var url = "../styles/fonts.css";
        // $head.append($("<link/>", { rel: "stylesheet", href: url, type: "text/css" }));
    
        function printPrompt() {
            io.print(
                '\x1b[38:2:51:105:2032mh' +
                '\x1b[38:2:213:15:37mt' +
                '\x1b[38:2:238:178:17me' +
                '\x1b[38:2:0:153:37mr' +
                '\x1b[38:2:51:105:232mm' +
                '\x1b[38:2:213:15:37m>' +
                '\x1b[0m ');
            terminal.setCursorColumn(prompt_size);
        }

        conn.onmessage = function (evt) {
            if(evt.data.endsWith('\r')) {
                io.println(evt.data);
            } else {
                io.print(evt.data);
                
        };

        const leaveIO = () => {
            io.print('');
            terminal.io.pop();
        };

        printPrompt();
        
       
        io.sendString = (str) => "send-string-sanjeev-test" + str;
        io.onVTKeystroke = (ch) => {
            if(conn && conn.readyState === 1) {
                conn.send(ch);
            } else {
                switch (ch) {
                    case '\x1b': // Esc pressed
                        // leaveIO();
                        // rejects();
                        break;
                    case '\r': // Enter key pressed
                        io.println('');
                        printPrompt();
                        break;
                    case '\b': // backspace
                        console.log(terminal.getCursorColumn());
                        if (terminal.getCursorColumn() > prompt_size) {
                            terminal.setCursorColumn(terminal.getCursorColumn() - 1);
                            terminal.deleteChars(1);
                            io.print(' '); // FIXME: Dirty hack 
                            terminal.setCursorColumn(terminal.getCursorColumn() - 1);
                        }
                        break;
                    case '\x1b\x7f':
                    case '\x1b[3~': //delete
                        if (terminal.getCursorColumn() >= prompt_size) {
                            terminal.deleteChars(1);
                        }
                        break;
                    case '\f': // form-feed
                        terminal.wipeContents();
                        printPrompt();
                        break;
                    default:
                        io.print(ch);
                        break;
                }
            }
            // terminal.wipeContents();
        };

        io.onTerminalResize = (columns, rows) => {

        };

        console.log("terminal is ready...");
    };


    
    terminal.prefs_.set('scrollbar-visible', false);
    terminal.prefs_.set('enable-blink', true);
    terminal.prefs_.set('background-color', 'rgb(0, 0, 0)');
    // Disabled due to Content-Security-Policy rule
    // terminal.prefs_.set('background-image', 'url(https://goo.gl/anedTK)');
    terminal.prefs_.set('backspace-sends-backspace', true);
    terminal.prefs_.set('font-size', 12);
    // terminal.prefs_.set('font-family', 'RobotoMono');
    terminal.prefs_.set('font-smoothing', 'subpixel-antialiased');
    // terminal.prefs_.set('enable-bold', true);
    // terminal.prefs_.set('enable-bold-as-bright', true);


    terminal.decorate(document.querySelector('#terminal'));
    terminal.installKeyboard();
    // hterm.VT(terminal);

    terminal.setCursorPosition(0, 0);
    terminal.setCursorVisible(true);
    terminal.setCursorBlink(true);
    // terminal.command.keyboard_ = terminal.keyboard;

    terminal.contextMenu.setItems([
        ['clear', function() { terminal.wipeContents(); }],
        ['reset', function() { terminal.reset(); }],
    ]);

};