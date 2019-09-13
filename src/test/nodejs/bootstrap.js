const Application = require('spectron').Application;
const electronPath = require('electron');
const path = require('path');
const chai = require("chai");
const chaiAsPromised = require('chai-as-promised');

chai.should();
chai.use(chaiAsPromised);

before(function (done) {
    this.timeout(15000);
    this.app = new Application({
        // Your electron path can be any binary
        // i.e for OSX an example path could be '/Applications/MyApp.app/Contents/MacOS/MyApp'
        // But for the sake of the example we fetch it from our node_modules.
        path: electronPath,

        // Assuming you have the following directory structure

        //  |__ my project
        //     |__ ...
        //     |__ main.js
        //     |__ package.json
        //     |__ index.html
        //     |__ ...
        //     |__ test
        //        |__ spec.js  <- You are here! ~ Well you should be.

        // The following line tells spectron to look and use the main.js file
        // and the package.json located 1 level above.
        args: [path.join(__dirname, '../..')],
        // env: {
        //     ELECTRON_ENABLE_LOGGING: true,
        //     ELECTRON_ENABLE_STACK_DUMPING: true,
        //     NODE_ENV: "test"
        // },
    });
    (async () => {
        chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
        return await this.app.start().then(async () => {
            await this.app.client.waitUntilWindowLoaded();
        }).then(done);
    })();
});

after(function () {
    if (this.app && this.app.isRunning()) {
        (async () => {
            return await this.app.stop();
        })();
    }
});
