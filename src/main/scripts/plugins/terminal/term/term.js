'use strict';

let term = {};
module.exports = term;

/**
 * Namespace for the binding classes that sit between concrete implementations.
 */
term.binding = {};

/**
 *
 */
term.mkError = function(name, argList) {
    return console.log(name, argList);
};

/**
 * Promise based setImmediate polyfill.
 */
term.setImmediate = function(f) {
    let p = new Promise(function(resolve) { resolve() });
    p.then(f)
        .catch(function(ex) {
            if ('message' in ex && 'stack' in ex) {
                console.warn(ex.message, ex.stack);
            } else {
                console.warn(ex);
            }
        });
};

/**
 * Shortcut for setImmediate of a function bound to static args.
 */
term.async = function(f, args) {
    term.setImmediate(f.bind.apply(f, args));
};


/**
 * Make a globally unique id.
 *
 * TODO: We probably don't need to use crypto entropy for this.
 */
term.guid = function() {
    let ary = new Uint8Array(16);
    window.crypto.getRandomValues(ary);

    let rv = '';
    for (let i = 0; i < ary.length; i++) {
        let byte = ary[i].toString(16);
        if (byte.length === 2) {
            rv += byte;
        } else {
            rv += '0' + byte;
        }
    }

    return rv;
};
