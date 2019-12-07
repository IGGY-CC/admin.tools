'use strict';
// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, MenuItem } = require('electron');
require('electron-reload')(__dirname);

// var ppapiPath = __dirname + '\\..\\..\\plugins\\pnacl\\ssh_client\\ssh_client.nmf';
// console.log('PPAPI path ' + ppapiPath);
// app.commandLine.appendSwitch('register-pepper-plugins', ppapiPath + ';application/x-nacl');

// Keep a global reference of the window object, if we don't, the window 
// will be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        show: false,
        // frame: false,
        width: 800,
        minWidth: 800,
        height: 600,
        minHeight: 600,
        frame: false,
        transparent: true,
        webPreferences: {
            contextIsolation: false,
            sandbox: false,
            //disableBlinkFeatures: "Auxclick",
            nodeIntegration: true
        }
    });

    // disable main menu
    mainWindow.setMenuBarVisibility(false);

    // load the index.html of the app.
    mainWindow.loadFile('src/main/html/index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually we would store windows
        // in an array if our app supports multi windows, this is the time
        // when we should delete the corresponding element.
        mainWindow = null
    });

    // Prevent user to initiate any navigation
    mainWindow.webContents.on("will-navigate", (evt, newURL) => {
        evt.preventDefault();
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

}

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // if (url === 'https://github.com') {
    // Verification logic.
    event.preventDefault();
    console.log("CERTIFICATE ERROR RECEIVED");
    callback(true);
    // } else {
    //     callback(false)
    // }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    createWindow();

    const template = [];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    const ctxMenu = new Menu();
    ctxMenu.append(new MenuItem({
        label: 'Hello'
    }));

    mainWindow.webContents.on('context-menu', function(e, params) {
        ctxMenu.popup(mainWindow, params.x, params.y);
    });

});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if(process.platform !== 'darwin') app.quit()
});

app.on('activate', function() {
    // On macOS it is common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
});

// In this file we can include the rest of the app's specific main process
// code. We can also put them in separate files and require them here.