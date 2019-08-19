// nassh.CommandInstance.connectTo (nassh.js:2506)
// nassh.CommandInstance.connectToDestination (nassh.js:2372)
// nassh.CommandInstance.connectToArgString (nassh.js:2077)
// onFileSystemFound (nassh.js:1884)
// getOrCreateNextName (nassh.js:3759)
// Object.lib.fs.getOrCreateDirectory (nassh.js:3755)
// onFileSystem (nassh.js:54)
// Object.nassh.getFileSystem (nassh.js:53)
// nassh.js:1857
// onRead (nassh.js:3376)
// nassh.PreferenceManager.readStorage (nassh.js:3360)
// nassh.CommandInstance.run (nassh.js:1827)
// hterm.Terminal.runCommandClass (hterm_all.js:12772)

// SOURCE FILE: admin.tools/src/main/scripts/stream.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.


// This class and its methods are influenced/copied/modified from 
// Chrome nassh project.


'use strict';

var streams = {};

/**
 * Register a static initializer for streams.*.
 *
 * @param {function} onInit The function lib.init() wants us to invoke when
 *     initialization is complete.
 */
lib.registerInit('streams', function (onInit) {
    streams.defaultStorage = new lib.Storage.Memory(); // TODO
    onInit();
});

/**
 * Return a formatted message in the current locale.
 *
 * @param {string} name The name of the message to return.
 * @param {Array} opt_args The message arguments, if required.
 */
streams.msg = function (name, opt_args) {
    const rv = lib.i18n.getMessage(name, opt_args, name);

    // Since our translation process only preserves \n (and discards \r), we have
    // to manually insert them here ourselves.  Any place we display translations
    // should be able to handle \r correctly, and keeps us from having to remember
    // to do it whenever we need to.  If a situation comes up where we don't want
    // the \r, we can reevaluate this decision then.
    return rv.replace(/\n/g, '\n\r');
};

/**
 * @fileoverview: The WSS-SSH leans on its host to provide some basic
 * stream-like objects for /dev/random. 
 */

/**
 * Base class for streams required by the plugin.
 */
streams.Stream = function (fd, path) {
    this.fd_ = fd;
    this.path = path;
    this.open = false;

    // Flag to indicate the Stream doesn't accept ArrayBuffers via its write
    // methods.  We can drop this once all Streams have migrated over.
    this.writeArrayBuffer = false;
};

/**
 * Errors we may raise.
 */
streams.Stream.ERR_STREAM_CLOSED = 'Stream closed';
streams.Stream.ERR_STREAM_OPENED = 'Stream opened';
streams.Stream.ERR_FD_IN_USE = 'File descriptor in use';
streams.Stream.ERR_NOT_IMPLEMENTED = 'Not implemented';
streams.Stream.ERR_STREAM_CANT_READ = 'Stream has no read permission';
streams.Stream.ERR_STREAM_CANT_WRITE = 'Stream has no write permission';

/**
 * Open a stream, calling back when complete.
 */
streams.Stream.prototype.asyncOpen_ = function (path, onOpen) {
    setTimeout(() => onOpen(false, 'streams.Stream.ERR_NOT_IMPLEMENTED'), 0);
};

/**
 * Read from a stream, calling back with the result.
 *
 * The default implementation does not actually send data to the client, but
 * assumes that it is instead pushed to the client using the
 * onDataAvailable event.
 */
streams.Stream.prototype.asyncRead = function (size, onRead) {
    if (this.onDataAvailable === undefined)
        throw streams.Stream.ERR_NOT_IMPLEMENTED;

    setTimeout(() => onRead(''), 0);
};

/**
 * Write to a stream.
 */
streams.Stream.prototype.asyncWrite = function (data, onSuccess) {
    throw streams.Stream.ERR_NOT_IMPLEMENTED;
};

/**
 * Close a stream.
 */
streams.Stream.prototype.close = function () {
    if (this.onClose)
        this.onClose();
};

/**
 * The /dev/random stream.
 *
 * This special case stream just returns random bytes when read.
 */
streams.Stream.Random = function (fd) {
    streams.Stream.apply(this, [fd]);
};

streams.Stream.Random.prototype = Object.create(streams.Stream.prototype);
streams.Stream.Random.constructor = streams.Stream.Random;

streams.Stream.Random.prototype.asyncOpen_ = function (path, onOpen) {
    this.path = path;
    setTimeout(function () { onOpen(true); }, 0);
};

streams.Stream.Random.prototype.asyncRead = function (size, onRead) {
    if (!this.open)
        throw streams.Stream.ERR_STREAM_CLOSED;

    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    setTimeout(() => onRead(bytes.buffer), 0);
};

/**
* A set of open streams for a command instance.
*/
streams.StreamSet = function () {

    // Collection of currently open stream instances.
    this.openStreams_ = {};
};

/**
 * Open a new stream instance of a given class.
 */
streams.StreamSet.prototype.openStream = function (streamClass, fd, arg, onOpen) {

    if (this.openStreams_[fd])
        throw streams.Stream.ERR_FD_IN_USE;

    var stream = new streamClass(fd, arg);

    stream.asyncOpen_(arg, (success, errorMessage) => {
        if (success) {
            this.openStreams_[fd] = stream;
            stream.open = true;
        }

        onOpen(success, errorMessage);
    });

    return stream;
};

/**
 * Closes a stream instance.
 */
streams.StreamSet.prototype.closeStream = function (fd) {
    const stream = this.openStreams_[fd];
    stream.close();
    stream.open = false;
    delete this.openStreams_[fd];
};

/**
 * Closes all stream instances.
 */
streams.StreamSet.prototype.closeAllStreams = function () {
    for (var fd in this.openStreams_) {
        this.closeStream(fd);
    }
};

/**
 * Returns a stream instance.
 */
streams.StreamSet.prototype.getStreamByFd = function (fd) {
    return this.openStreams_[fd];
};


/**
 * PreferenceManager subclass managing global SSH preferences.
 *
 * This is currently just an ordered list of known connection profiles.
 */
streams.PreferenceManager = function (opt_storage) {

    var storage = opt_storage || streams.defaultStorage; // TODO

    lib.PreferenceManager.call(this, storage, '/ssh/');

    this.defineChildren('profile-ids', function (parent, id) {
        return new streams.ProfilePreferenceManager(parent, id);
    });
};

streams.PreferenceManager.prototype =
    Object.create(lib.PreferenceManager.prototype);
streams.PreferenceManager.constructor = streams.PreferenceManager;

/**
 * Entry point when loading the streams preferences.
 *
 * @param {function()=} callback Callback when the storage is loaded.
 */
streams.PreferenceManager.prototype.readStorage = function (callback = undefined) {
    const onRead = () => {
        if (callback) {
            callback();
        }
    };

    lib.PreferenceManager.prototype.readStorage.call(this, onRead);
};

streams.PreferenceManager.prototype.createProfile = function () {
    return this.createChild('profile-ids');
};

streams.PreferenceManager.prototype.removeProfile = function (id) {
    return this.removeChild('profile-ids', id);
};

streams.PreferenceManager.prototype.getProfile = function (id) {
    return this.getChild('profile-ids', id);
};

/**
 * lib.PreferenceManager subclass managing per-connection preferences.
 */
streams.ProfilePreferenceManager = function (parent, id) {

    lib.PreferenceManager.call(this, parent.storage,
        '/ssh/profiles/' + id);

    this.id = id;

    this.definePreferences
        ([
            /**
             * The free-form description of this connection profile.
             */
            ['description', ''],

            /**
             * The username.
             */
            ['username', ''],

            /**
             * The hostname or IP address.
             */
            ['hostname', ''],

            /**
             * The port, or null to use the default port.
             */
            ['port', null],

            /**
             * Options string for ssh.
             */
            ['ssh-options', ''],

            /**
             * The private key file to use as the identity for this extension.
             *
             * Must be relative to the /.ssh/ directory.
             */
            ['identity', ''],

            /**
             * The argument string to pass to the ssh executable.
             *
             * Use '--' to separate ssh arguments from the target command/arguments.
             */
            ['argstr', ''],

            /**
             * The terminal profile to use for this connection.
             */
            ['terminal-profile', ''],

        ]);
};

streams.ProfilePreferenceManager.prototype =
    Object.create(lib.PreferenceManager.prototype);
streams.ProfilePreferenceManager.constructor = streams.ProfilePreferenceManager;



/**
 * The buffer for input from a terminal.
 *
 * This is necessary when /dev/tty and stdin can be separate streams. In that
 * case, the input from the user must be buffered, and data must only be given
 * to the first stream that reads it.
 */
streams.InputBuffer = function () {
    // The buffered data.
    this.data_ = '';

    // The queue of readers that are waiting for data. Readers are only queued
    // when they attempt to read and there is no data available.
    this.pendingReaders_ = [];

    // This event is fired with the value true when there is data available to be
    // read, and false when the buffer is empty. It is only fired when this
    // status changes.
    this.onDataAvailable = new lib.Event();
};

/**
 * Write data to the input buffer.
 *
 * This may call callbacks for pending readers.
 */
streams.InputBuffer.prototype.write = function (data) {
    var wasAvailable = this.data_.length != 0;
    this.data_ += data;

    // First, send data to the pending readers.
    for (var i = 0; i < this.pendingReaders_.length; i++) {
        var onRead = this.pendingReaders_[i].onRead;
        var size = this.pendingReaders_[i].size;

        if (size > this.data_.length) {
            size = this.data_.length;
        }

        if (size == 0) {
            break;
        }

        var rv = this.data_.slice(0, size);
        if (onRead(rv)) {
            this.data_ = this.data_.slice(size);
        }

        this.pendingReaders_.shift();
    }

    // Now, if data is still available, notify.
    if (this.data_.length > 0 && !wasAvailable) {
        this.onDataAvailable(true);
    }
};

/**
 * Read data from the input buffer.
 *
 * If there is no data available to be read, this read will be queued, and
 * onRead will be later called when data is written to the input buffer.
 *
 * This only happens if there is no data available in the buffer. If there is
 * not enough data available, onRead is called with all of the data in the
 * buffer.
 */
streams.InputBuffer.prototype.read = function (size, onRead) {
    var avail = this.data_.length;
    var rv;

    if (avail == 0) {
        // No data is available. Wait for data to be available and send it to the
        // queued readers.
        this.pendingReaders_.push({ size: size, onRead: onRead });
        return;
    }

    if (size > avail) {
        size = avail;
    }

    var rv = this.data_.slice(0, size);
    if (onRead(rv)) {
        this.data_ = this.data_.slice(size);
    }

    if (this.data_.length == 0) {
        this.onDataAvailable(false);
    }
};

/**
 * The /dev/tty stream.
 *
 * This stream allows reads (from an streams.InputBuffer) and writes (to a
 * hterm.Terminal.IO). It is used for /dev/tty, as well as stdin, stdout and
 * stderr when they are reading from/writing to a terminal.
 */
streams.Stream.Tty = function (fd, info) {
    streams.Stream.apply(this, [fd]);

    this.writeArrayBuffer = true;

    this.encoder_ = new TextEncoder();
};

streams.Stream.Tty.prototype = Object.create(streams.Stream.prototype);
streams.Stream.Tty.constructor = streams.Stream.Tty;

streams.Stream.Tty.prototype.asyncOpen_ = function (info, onOpen) {
    this.allowRead_ = info.allowRead;
    this.allowWrite_ = info.allowWrite;
    this.inputBuffer_ = info.inputBuffer;
    this.io_ = info.io;
    this.acknowledgeCount_ = 0;

    setTimeout(function () { onOpen(true); }, 0);
};

streams.Stream.Tty.prototype.asyncRead = function (size, onRead) {
    if (!this.open)
        throw streams.Stream.ERR_STREAM_CLOSED;

    if (!this.allowRead_)
        throw streams.Stream.ERR_STREAM_CANT_READ;

    this.inputBuffer_.read(size, (data) => {
        if (!this.open) {
            return false;
        }

        // Turn the UTF-16 JavaScript string into a UTF-8 array buffer.
        const buf = this.encoder_.encode(data).buffer;
        setTimeout(() => onRead(buf), 0);
        return true;
    });
};

streams.Stream.Tty.prototype.asyncWrite = function (data, onSuccess) {
    if (!this.open)
        throw streams.Stream.ERR_STREAM_CLOSED;

    if (!this.allowWrite_)
        throw streams.Stream.ERR_STREAM_CANT_WRITE;

    this.acknowledgeCount_ += data.byteLength;

    this.io_.writeUTF8(data);

    setTimeout(() => { onSuccess(this.acknowledgeCount_); }, 0);
};




/**
 * An event is a JavaScript function with addListener and removeListener
 * properties.
 *
 * When the endpoint function is called, the firstCallback will be invoked,
 * followed by all of the listeners in the order they were attached, then
 * the finalCallback.
 *
 * The returned function will have the list of callbacks, excluding
 * opt_firstCallback and opt_lastCallback, as its 'observers' property.
 *
 * @param {function(...)} opt_firstCallback The optional function to call
 *     before the observers.
 * @param {function(...)} opt_finalCallback The optional function to call
 *     after the observers.
 *
 * @return {function(...)} A function that, when called, invokes all callbacks
 *     with whatever arguments it was passed.
 */
lib.Event = function (opt_firstCallback, opt_finalCallback) {
    var ep = function () {
        var args = Array.prototype.slice.call(arguments);

        var rv;
        if (opt_firstCallback)
            rv = opt_firstCallback.apply(null, args);

        if (rv === false)
            return;

        ep.observers.forEach((ary) => ary[0].apply(ary[1], args));

        if (opt_finalCallback)
            opt_finalCallback.apply(null, args);
    };

    /**
     * Add a callback function.
     *
     * @param {function(...)} callback The function to call back.
     * @param {Object} opt_obj The optional |this| object to apply the function
     *     to.  Use this rather than bind when you plan on removing the listener
     *     later, so that you don't have to save the bound-function somewhere.
     */
    ep.addListener = function (callback, opt_obj) {
        if (!callback) {
            console.error('Missing param: callback');
            console.log(lib.f.getStack());
        }

        ep.observers.push([callback, opt_obj]);
    };

    /**
     * Remove a callback function.
     */
    ep.removeListener = function (callback, opt_obj) {
        for (var i = 0; i < ep.observers.length; i++) {
            if (ep.observers[i][0] == callback && ep.observers[i][1] == opt_obj) {
                ep.observers.splice(i, 1);
                break;
            }
        }
    };

    ep.observers = [];


    return ep;
};

/**
 * @fileoverview Common relay logic.
 */

streams.Relay = {};

/**
 * @fileoverview Implementation for the ssh proxy.
 */

/**
 * SSH-FE relay implementation.
 */
streams.Relay.Sshfe = function (io, options, username) {
    console.log("SSHFE INVOKED");
    this.io = io;
    this.proxyHost = options.host;
    this.proxyPort = options.port || 443;
    this.username = username;
    this.relayServer = `wss://${this.proxyHost}:${this.proxyPort}`;
};

/**
 * Initialize this relay object.
 */
streams.Relay.Sshfe.prototype.init = function () { };

/**
 * Return an streams.Stream object that will handle the socket stream
 * for this relay.
 */
streams.Relay.Sshfe.prototype.openSocket = function (fd, host, port, streams,
    onOpen) {
    const settings = {
        io: this.io,
        relayHost: this.proxyHost,
        relayPort: this.proxyPort,
        relayUser: this.username,
        host: host,
        port: port,
        sshAgent: this.sshAgent_,
    };
    return streams.openStream(streams.Stream.RelaySshfeWS, fd, settings, onOpen);
};




// module.exports = streams;