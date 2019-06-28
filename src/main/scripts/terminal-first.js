window.onload = function () {
    hterm.defaultStorage = new lib.Storage.Memory();
    var lib1 = lib;
    var lib2 = lib;
    lib1.init(setupHterm, console.log.bind(console));
    setTimeout(function () {
        //lib1.init(setupHterm, console.log.bind(console))
    }, 8000);
};

log = function (mesg) {
    console.log(mesg);
};

const prompt_size = 12;

printPrompt = function(terminal) {
    var today = new Date();
    var time = "\x1b[38;5;253m" + `${today.getHours()}`.padStart(2, 0) + ":" + `${today.getMinutes()}`.padStart(2, 0) + ":\x1b[38;5;244m" + `${today.getSeconds()}`.padStart(2, 0) + "  ";
    terminal.io.print(
        time +
        '\x1b[36;1m>' +
        '\x1b[0m '
    );
    // terminal.io.print(
    //     '\x1b[38:2:51:105:2032mh' +
    //     '\x1b[38:2:213:15:37mt' +
    //     '\x1b[38:2:238:178:17me' +
    //     '\x1b[38:2:0:153:37mr' +
    //     '\x1b[38:2:51:105:232mm' +
    //     '\x1b[38:2:213:15:37m>' +
    //     '\x1b[0m ');
    terminal.setCursorColumn(prompt_size);
};

clearScreen = function(terminal) {
    terminal.wipeContents();
    printPrompt(terminal);
};


terminalDefaults = function(terminal) {
    terminal.prefs_.set('scrollbar-visible', false);
    terminal.prefs_.set('enable-blink', true);
    terminal.prefs_.set('background-color', '#0b0b0b');
    // Disabled due to Content-Security-Policy rule
    // terminal.prefs_.set('background-image', 'url(https://goo.gl/anedTK)');
    terminal.prefs_.set('backspace-sends-backspace', true);
    terminal.prefs_.set('font-size', 12);
    // terminal.prefs_.set('font-family', 'RobotoMono');
    terminal.prefs_.set('font-smoothing', 'subpixel-antialiased');
    // terminal.prefs_.set('enable-bold', true);
    // terminal.prefs_.set('enable-bold-as-bright', true);
    terminal.prefs_.set('ctrl-v-paste', true);
    terminal.prefs_.set('mouse-right-click-paste', true);
};

const terminalObj = {};

setupHterm = function () {
    const terminal = new hterm.Terminal("default");
    // conn = new WebSocket("ws://localhost:16443/ws");
    terminalObj.terminal = terminal;

    terminal.onTerminalReady = function () {
        const io = terminal.io.push();

        // var $head = $("#terminal > iframe").contents().find("head");
        // var url = "../styles/fonts.css";
        // $head.append($("<link/>", { rel: "stylesheet", href: url, type: "text/css" }));

        let input = '';
        let history = [];
        let histCount = 0;
        function walkThroughHistory() {
            let histSize = history.length;
            let currentLocation = 0;
            if (histSize <= histCount) {
                currentLocation = 0;
            } else {
                currentLocation = histSize - histCount;
            }
            input = history[currentLocation];
            while (terminal.getCursorColumn() > prompt_size) {
                t = terminal.getCursorColumn();
                terminal.deleteChars(1);
                terminal.setCursorColumn(t - 1);
            }
            if(input) {
                io.print(input);
            } else {
                input = '';
            }
        }

        const leaveIO = () => {
            io.print('');
            terminal.io.pop();
        };

        printPrompt(terminal);

        let isLocalCommand = true;
        let underLocalCommand = false;

        io.sendString = (str) => io.print(str);
        io.onVTKeystroke = (ch) => {
            if(isLocalCommand && ch === ',') {
                underLocalCommand = true;
            } 
            isLocalCommand = false;

            if (!underLocalCommand && (terminalObj.conn && terminalObj.conn.readyState === 1)) {
                if(ch === '\r') {
                    isLocalCommand = true;
                    underLocalCommand = false;
                }
                terminalObj.conn.send(ch);
            } else {

                // Keep track of consecutive up and down arrow key presses
                if (ch === '\033[A') {
                    histCount = (histCount + 1 > history.length)? histCount : histCount + 1;
                } else if (ch === '\033[B') {
                    histCount = (histCount >= 1)? histCount - 1: 0;
                } else {
                    histCount = 0;
                }

                switch (ch) {
                    case '\x1b': // Esc pressed
                        // leaveIO();
                        // rejects();
                        break;
                    case '\r': // Enter key pressed
                        isLocalCommand = true;
                        underLocalCommand = false;
                        io.println('');
                        history.push(input);
                        if(input) {
                            executeTermCommand(input, terminalObj);
                        }
                        input = '';
                        printPrompt(terminal);
                        break;
                    case '\b': // backspace
                        input = input.slice(0, -1);
                        console.log(input);
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
                        clearScreen(terminal);
                        break;
                    case '\033[A': //up arrow
                    case '\033[B': //down arrow
                        walkThroughHistory();
                        break;
                    case '\033[D': //left arrow
                        break;
                    case '\033[C': //right arrow
                        break;
                    default:
                        input += ch;
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

    terminalDefaults(terminal);
    terminal.decorate(document.querySelector("#terminal"));
    // terminal.setWidth(10);
    // terminal.setHeight(10);
    terminal.installKeyboard();
    // hterm.VT(terminal);

    terminal.setCursorPosition(0, 0);
    terminal.setCursorVisible(true);
    terminal.setCursorBlink(true);
    // terminal.command.keyboard_ = terminal.keyboard;
    
    terminal.contextMenu.setItems([
        ['Clear Screen', function () { clearScreen(); }],
        ['Reset Terminal', function () { terminal.reset(); printPrompt(terminal); }],
        ['Split Vertical', splitVertical()],
        ['Split Horizontal', splitHorizontal()],
        ['New Tab', newTab()],
    ]);
};
