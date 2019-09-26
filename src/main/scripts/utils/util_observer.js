let Observer = function() {};

Observer.prototype.notify = function() {
    console.log("TODO: OVERRIDE THIS: UP THE HIERARCHY!");
};

module.exports = Observer;