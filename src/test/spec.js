const fs = require('fs');
const path = require('path');
const tests = path.join(__dirname, "../../test/browser");

fs.readdirSync(tests).filter(function(file) {
    return file.substr(-3) === '.js'
        && file.substr(0, 5) === 'test-';
}).forEach(function(file) {
    mocha.addFile(path.join(tests, file));
});

mocha.ui('bdd').run(function (failures) {
    process.on('exit', function () {
        console.log(failures);
        process.exit(failures);
    });
});

mocha.setup({
    ui: 'bdd',
    ignoreLeaks: false,
    asyncOnly: false
});

mocha.checkLeaks();

setTimeout( () => mocha.run(function(failures) {
    process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
}), 1000);