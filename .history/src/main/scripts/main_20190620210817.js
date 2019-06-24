'use strict'
// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
require('electron-reload')(__dirname)

var ppapiPath = __dirname + '\\..\\..\\plugins\\pnacl\\ssh_client\\ssh_client.nmf';
console.log('PPAPI path ' + ppapiPath);
app.commandLine.appendSwitch('register-pepper-plugins', ppapiPath + ';application/x-ppapi-helloworld');var ppapiPath = __dirname + '\\..\\..\\bin\\Win32\\Debug\\PPApiForDotNet.dll';
console.log('PPAPI path ' + ppapiPath);
app.commandLine.appendSwitch('register-pepper-plugins', ppapiPath + ';application/x-ppapi-helloworld');

// Keep a global reference of the window object, if we don't, the window 
// will be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: false,
            sandbox: false,
            disableBlinkFeatures: "Auxclick",
            nodeIntegration: true
        }
    })

    // disable main menu
    mainWindow.setMenuBarVisibility(false)

    // load the index.html of the app.
    mainWindow.loadFile('src/main/html/index.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually we would store windows
        // in an array if our app supports multi windows, this is the time
        // when we should delete the corresponding element.
        mainWindow = null
    })

    // Prevent user to initiate any navigation
    mainWindow.webContents.on("will-navigate", (evt, newURL) => {
        evt.preventDefault();
    });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if(process.platform !== 'darwin') app.quit()
})

app.on('activate', function() {
    // On macOS it is common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
})

// In this file we can include the rest of the app's specific main process
// code. We can also put them in separate files and require them here.