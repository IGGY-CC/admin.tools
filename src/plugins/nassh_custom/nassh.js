// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var nassh = {};

/**
 * Non-null if nassh is running as an extension.
 */
nassh.browserAction = null;

/**
 * Register a static initializer for nassh.*.
 *
 * @param {function} onInit The function lib.init() wants us to invoke when
 *     initialization is complete.
 */
lib.registerInit('nassh', function(onInit) {
  nassh.defaultStorage = new lib.Storage.Memory(); // TODO
  onInit();
});

/**
 * Return a formatted message in the current locale.
 *
 * @param {string} name The name of the message to return.
 * @param {Array} opt_args The message arguments, if required.
 */
nassh.msg = function(name, opt_args) {
  const rv = lib.i18n.getMessage(name, opt_args, name);

  // Since our translation process only preserves \n (and discards \r), we have
  // to manually insert them here ourselves.  Any place we display translations
  // should be able to handle \r correctly, and keeps us from having to remember
  // to do it whenever we need to.  If a situation comes up where we don't want
  // the \r, we can reevaluate this decision then.
  return rv.replace(/\n/g, '\n\r');
};

/**
 * Request the persistent HTML5 filesystem for this extension.
 *
 * This will also create the /.ssh/ directory if it does not exits.
 *
 * @param {function(FileSystem, DirectoryEntry)} onSuccess The function to
 *     invoke when the operation succeeds.
 * @param {function(FileError)} opt_onError Optional function to invoke if
 *     the operation fails.
 */
nassh.getFileSystem = function(onSuccess, opt_onError) {
  console.log(new Error().stack);
  function onFileSystem(fileSystem) {
    lib.fs.getOrCreateDirectory(fileSystem.root, '/.ssh',
                                onSuccess.bind(null, fileSystem),
                                lib.fs.err('Error creating /.ssh',
                                           opt_onError));
  }

  var requestFS = window.requestFileSystem || window.webkitRequestFileSystem;
  requestFS(window.PERSISTENT,
            16 * 1024 * 1024,
            onFileSystem,
            lib.fs.err('Error initializing filesystem', opt_onError));
};

/**
 * Export the current list of nassh connections, and any hterm profiles
 * they reference.
 *
 * This is method must be given a completion callback because the hterm
 * profiles need to be loaded asynchronously.
 *
 * @param {function(Object)} Callback to be invoked when export is complete.
 *   The callback will receive a plan js object representing the state of
 *   nassh preferences.  The object can be passed back to
 *   nassh.importPreferences.
 */
nassh.exportPreferences = function(onComplete) {
  var pendingReads = 0;
  var rv = {};

  var onReadStorage = function(profile, prefs) {
    rv.hterm[profile] = prefs.exportAsJson();
    if (--pendingReads < 1)
      onComplete(rv);
  };

  rv.magic = 'nassh-prefs';
  rv.version = 1;

  var nasshPrefs = new nassh.PreferenceManager();
  nasshPrefs.readStorage(function() {
    // Export all the connection settings.
    rv.nassh = nasshPrefs.exportAsJson();

    // Save all the profiles.
    rv.hterm = {};
    hterm.PreferenceManager.listProfiles((profiles) => {
      profiles.forEach((profile) => {
        rv.hterm[profile] = null;
        const prefs = new hterm.PreferenceManager(profile);
        prefs.readStorage(onReadStorage.bind(null, profile, prefs));
        pendingReads++;
      });

      if (profiles.length == 0)
        onComplete(rv);
    });
  });
};

/**
 * Import a preferences object.
 *
 * This will not overwrite any existing preferences.
 *
 * @param {Object} prefsObject A preferences object created with
 *   nassh.exportPreferences.
 * @param {function()} opt_onComplete An optional callback to be invoked when
 *   the import is complete.
 */
nassh.importPreferences = function(prefsObject, opt_onComplete) {
  var pendingReads = 0;

  var onReadStorage = function(terminalProfile, prefs) {
    prefs.importFromJson(prefsObject.hterm[terminalProfile]);
    if (--pendingReads < 1 && opt_onComplete)
      opt_onComplete();
  };

  if (prefsObject.magic != 'nassh-prefs')
    throw new Error('Not a JSON object or bad value for \'magic\'.');

  if (prefsObject.version != 1)
    throw new Error('Bad version, expected 1, got: ' + prefsObject.version);

  var nasshPrefs = new nassh.PreferenceManager();
  nasshPrefs.importFromJson(prefsObject.nassh, () => {
    for (var terminalProfile in prefsObject.hterm) {
      var prefs = new hterm.PreferenceManager(terminalProfile);
      prefs.readStorage(onReadStorage.bind(null, terminalProfile, prefs));
      pendingReads++;
    }
  });
};

/**
 * Convert a base64url encoded string to the base64 encoding.
 *
 * The difference here is in the last two characters of the alphabet.
 * So converting between them is easy.
 *
 * base64: https://tools.ietf.org/html/rfc4648#section-4
 *   62 +
 *   63 /
 * base64url: https://tools.ietf.org/html/rfc4648#section-5
 *   62 -
 *   63 _
 *
 * We re-add any trailing = padding characters.
 *
 * @param {string} data The base64url encoded data.
 * @returns {string} The data in base64 encoding.
 */
nassh.base64UrlToBase64 = function(data) {
  const replacements = {'-': '+', '_': '/'};
  let ret = data.replace(/[-_]/g, (ch) => replacements[ch]);

  switch (ret.length % 4) {
    case 1:
      throw new Error(`Invalid base64url length: ${ret.length}`);

    case 2:
      ret += '==';
      break;

    case 3:
      ret += '=';
      break;
  }

  return ret;
};

/**
 * Convert a base64 encoded string to the base64url encoding.
 *
 * This is the inverse of nassh.base64UrlToBase64.
 *
 * We strip off any = padding characters too.
 *
 * @param {string} data The base64 encoded data.
 * @returns {string} The data in base64url encoding.
 */
nassh.base64ToBase64Url = function(data) {
  const replacements = {'+': '-', '/': '_', '=': ''};
  return data.replace(/[+/=]/g, (ch) => replacements[ch]);
};


// nassh_main.js
// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

window.onload = function () {

  // var execNaSSH = function () {
  //   const profileName = params.get('profile');

  //   hterm.zoomWarningMessage = nassh.msg('ZOOM_WARNING');
  //   hterm.notifyCopyMessage = nassh.msg('NOTIFY_COPY');

  //   var terminal = new hterm.Terminal(profileName);
  //   terminal.decorate(document.querySelector('#terminal'));
  //   const runNassh = function () {
  //     terminal.setCursorPosition(0, 0);
  //     terminal.setCursorVisible(true);
  //     terminal.runCommandClass(nassh.CommandInstance);
  //   };
  //   terminal.onTerminalReady = function () {
  //         terminal.setAccessibilityEnabled(true);
  //         runNassh();
  //   };

  //   terminal.contextMenu.setItems([
  //     [nassh.msg('TERMINAL_CLEAR_MENU_LABEL'),
  //     function () { terminal.wipeContents(); }],
  //     [nassh.msg('TERMINAL_RESET_MENU_LABEL'),
  //     function () { terminal.reset(); }],
  //     [nassh.msg('OPTIONS_BUTTON_LABEL'),
  //     function () { nassh.openOptionsPage(); }],
  //   ]);

  //   // Useful for console debugging.
  //   window.term_ = terminal;
  //   console.log(nassh.msg(
  //     'CONSOLE_NASSH_OPTIONS_NOTICE',
  //     [lib.f.getURL('/html/nassh_preferences_editor.html')]));
  // };

  // lib.init(execNaSSH, console.log.bind(console));
};


// nassh_stream.js
// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * @fileoverview: The NaCl plugin leans on its host to provide some basic
 * stream-like objects for /dev/random. The interface is likely to change
 * in the near future, so documentation in this file is a bit sparse.
 */

/**
 * Base class for streams required by the plugin.
 */
nassh.Stream = function(fd, path) {
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
nassh.Stream.ERR_STREAM_CLOSED = 'Stream closed';
nassh.Stream.ERR_STREAM_OPENED = 'Stream opened';
nassh.Stream.ERR_FD_IN_USE = 'File descriptor in use';
nassh.Stream.ERR_NOT_IMPLEMENTED = 'Not implemented';
nassh.Stream.ERR_STREAM_CANT_READ = 'Stream has no read permission';
nassh.Stream.ERR_STREAM_CANT_WRITE = 'Stream has no write permission';

/**
 * Open a stream, calling back when complete.
 */
nassh.Stream.prototype.asyncOpen_ = function(path, onOpen) {
  setTimeout(() => onOpen(false, 'nassh.Stream.ERR_NOT_IMPLEMENTED'), 0);
};

/**
 * Read from a stream, calling back with the result.
 *
 * The default implementation does not actually send data to the client, but
 * assumes that it is instead pushed to the client using the
 * onDataAvailable event.
 */
nassh.Stream.prototype.asyncRead = function(size, onRead) {
  if (this.onDataAvailable === undefined)
    throw nassh.Stream.ERR_NOT_IMPLEMENTED;

  setTimeout(() => onRead(''), 0);
};

/**
 * Write to a stream.
 */
nassh.Stream.prototype.asyncWrite = function(data, onSuccess) {
  throw nassh.Stream.ERR_NOT_IMPLEMENTED;
};

/**
 * Close a stream.
 */
nassh.Stream.prototype.close = function() {
  if (this.onClose)
    this.onClose();
};

/**
 * The /dev/random stream.
 *
 * This special case stream just returns random bytes when read.
 */
nassh.Stream.Random = function(fd) {
  nassh.Stream.apply(this, [fd]);
};

nassh.Stream.Random.prototype = Object.create(nassh.Stream.prototype);
nassh.Stream.Random.constructor = nassh.Stream.Random;

nassh.Stream.Random.prototype.asyncOpen_ = function(path, onOpen) {
  this.path = path;
  setTimeout(function() { onOpen(true); }, 0);
};

nassh.Stream.Random.prototype.asyncRead = function(size, onRead) {
  if (!this.open)
    throw nassh.Stream.ERR_STREAM_CLOSED;

  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  setTimeout(() => onRead(bytes.buffer), 0);
};
 

// nash_stream_tty.js
// Copyright 2015 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


/**
 * The buffer for input from a terminal.
 *
 * This is necessary when /dev/tty and stdin can be separate streams. In that
 * case, the input from the user must be buffered, and data must only be given
 * to the first stream that reads it.
 */
nassh.InputBuffer = function() {
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
nassh.InputBuffer.prototype.write = function(data) {
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
nassh.InputBuffer.prototype.read = function(size, onRead) {
  var avail = this.data_.length;
  var rv;

  if (avail == 0) {
    // No data is available. Wait for data to be available and send it to the
    // queued readers.
    this.pendingReaders_.push({size: size, onRead: onRead});
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
 * This stream allows reads (from an nassh.InputBuffer) and writes (to a
 * hterm.Terminal.IO). It is used for /dev/tty, as well as stdin, stdout and
 * stderr when they are reading from/writing to a terminal.
 */
nassh.Stream.Tty = function(fd, info) {
  nassh.Stream.apply(this, [fd]);

  this.writeArrayBuffer = true;

  this.encoder_ = new TextEncoder();
};

nassh.Stream.Tty.prototype = Object.create(nassh.Stream.prototype);
nassh.Stream.Tty.constructor = nassh.Stream.Tty;

nassh.Stream.Tty.prototype.asyncOpen_ = function(info, onOpen) {
  this.allowRead_ = info.allowRead;
  this.allowWrite_ = info.allowWrite;
  this.inputBuffer_ = info.inputBuffer;
  this.io_ = info.io;
  this.acknowledgeCount_ = 0;

  setTimeout(function() { onOpen(true); }, 0);
};

nassh.Stream.Tty.prototype.asyncRead = function(size, onRead) {
  if (!this.open)
    throw nassh.Stream.ERR_STREAM_CLOSED;

  if (!this.allowRead_)
    throw nassh.Stream.ERR_STREAM_CANT_READ;

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

nassh.Stream.Tty.prototype.asyncWrite = function(data, onSuccess) {
  if (!this.open)
    throw nassh.Stream.ERR_STREAM_CLOSED;

  if (!this.allowWrite_)
    throw nassh.Stream.ERR_STREAM_CANT_WRITE;

  this.acknowledgeCount_ += data.byteLength;

  this.io_.writeUTF8(data);

  setTimeout(() => { onSuccess(this.acknowledgeCount_); }, 0);
};


// nassh_stream_set.js
// Copyright 2017 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * A set of open streams for a command instance.
 */
nassh.StreamSet = function() {
  // Collection of currently open stream instances.
  this.openStreams_ = {};
};

/**
 * Open a new stream instance of a given class.
 */
nassh.StreamSet.prototype.openStream = function(streamClass, fd, arg, onOpen) {
  if (this.openStreams_[fd])
    throw nassh.Stream.ERR_FD_IN_USE;

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
nassh.StreamSet.prototype.closeStream = function(fd) {
  const stream = this.openStreams_[fd];
  stream.close();
  stream.open = false;
  delete this.openStreams_[fd];
};

/**
 * Closes all stream instances.
 */
nassh.StreamSet.prototype.closeAllStreams = function() {
  for (var fd in this.openStreams_) {
    this.closeStream(fd);
  }
};

/**
 * Returns a stream instance.
 */
nassh.StreamSet.prototype.getStreamByFd = function(fd) {
  return this.openStreams_[fd];
};


// nassh_stream_relay_sshfe.js
// Copyright 2018 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * @fileoverview Stream for connecting to a ssh server via a SSH-FE relay.
 */

/**
 * WebSocket backed stream.
 *
 * This class manages the read and write through WebSocket to communicate
 * with the SSH-FE relay server.
 *
 * Resuming of connections is not supported.
 *
 * @param {number} fd
 */
nassh.Stream.RelaySshfeWS = function(fd) {
  nassh.Stream.call(this, fd);

  // The relay connection settings.
  this.io_ = null;
  this.relayHost_ = null;
  this.relayPort_ = null;
  this.relayUser_ = null;

  // The remote ssh server settings.
  this.host_ = null;
  this.port_ = null;

  // The ssh-agent we talk to for the SSH-FE challenge.
  this.sshAgent_ = null;

  this.writeArrayBuffer = true;
  // All the data we've queued but not yet sent out.
  this.writeBuffer_ = new Uint8Array();
  // Callback function when asyncWrite is used.
  this.onWriteSuccess_ = null;

  // Data we've read so we can ack it to the server.
  this.readCount_ = 0;

  // The actual WebSocket connected to the ssh server.
  this.socket_ = null;
};

/**
 * We are a subclass of nassh.Stream.
 */
nassh.Stream.RelaySshfeWS.prototype = Object.create(nassh.Stream.prototype);
nassh.Stream.RelaySshfeWS.constructor = nassh.Stream.RelaySshfeWS;

/**
 * Open a relay socket.
 *
 * @param {Object} args
 * @param {function(bool, string=)} onComplete
 */
nassh.Stream.RelaySshfeWS.prototype.asyncOpen_ = function(args, onComplete) {
  this.io_ = args.io;
  this.relayHost_ = args.relayHost;
  this.relayPort_ = args.relayPort;
  this.relayUser_ = args.relayUser;
  this.host_ = args.host;
  this.port_ = args.port;
  this.sshAgent_ = args.sshAgent;

  // The SSH-FE challenge details.
  let sshFeChallenge = null;
  let sshFeSignature = null;

  this.getChallenge_()
    .then((challenge) => {
      sshFeChallenge = challenge;
      return this.signChallenge_(challenge);
    })
    .then((signature) => {
      sshFeSignature = nassh.base64ToBase64Url(signature);
      this.connect_(sshFeChallenge, sshFeSignature);
      onComplete(true);
    })
    .catch((e) => onComplete(false, `${e.message}\r\n${lib.f.getStack()}`));
};

/**
 * URI to get a new challenge for connecting through the relay.
 */
nassh.Stream.RelaySshfeWS.prototype.challengeTemplate_ =
    `%(protocol)://%(relayHost):%(relayPort)` +
    `/challenge?user=%encodeURIComponent(relayUser)`;

/**
 * Get the server challenge.
 *
 * @return {Promise} A promise to resolve with the server's challenge.
 */
nassh.Stream.RelaySshfeWS.prototype.getChallenge_ = function() {
  // Send the current user to the relay to get the challenge.
  const uri = lib.f.replaceVars(this.challengeTemplate_, {
    protocol: 'https',
    relayHost: this.relayHost_,
    relayPort: this.relayPort_,
    relayUser: this.relayUser_,
  });

  const req = new Request(uri);
  return fetch(req)
    .then((response) => {
      // Make sure the server didn't return a failure.
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      // Get the response from the server as a blob.
      return response.blob();
    })
    .then((blob) => {
      const reader = new lib.fs.FileReader();
      return reader.readAsText(blob);
    })
    .then((result) => {
      // Skip the XSSI countermeasure.
      if (!result.startsWith(")]}'\n")) {
        throw Error(`Unknown response: ${result}`);
      }

      // Pull out the challenge from the response.
      const obj = JSON.parse(result.slice(5));
      return obj.challenge;
    });
};

/**
 * Send a message to the ssh agent.
 *
 * @param {Object} data The object to send to the agent.
 * @return {Promise} A promise to resolve with the agent's response.
 */
nassh.Stream.RelaySshfeWS.prototype.sendAgentMessage_ = function(data) {
  // The Chrome message API uses callbacks, so wrap in a Promise ourselves.
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
        this.sshAgent_,
        {'type': 'auth-agent@openssh.com', 'data': data},
        resolve);
  });
};

/**
 * Sign the server's challenge with a ssh key via a ssh agent.
 *
 * TODO: This uses gnubby-specific messages currently (113 & 114) to locate the
 * specific key to use to sign the challenge.
 *
 * @param {string} challenge The server challenge
 * @return {Promise} A promise to resolve with the signed result.
 */
nassh.Stream.RelaySshfeWS.prototype.signChallenge_ = function(challenge) {
  // Construct a SSH_AGENTC_PUBLIC_KEY_CHALLENGE packet.
  //   byte    code
  //   byte    slot
  //   byte    alt
  // TODO: Rename "challenge" since it has nothing to do with |challenge| parameter.
  //   string  challenge  (16 bytes)
  const buffer = new ArrayBuffer(23);
  const u8 = new Uint8Array(buffer);
  const dv = new DataView(buffer);
  // message code: SSH_AGENTC_PUBLIC_KEY_CHALLENGE.
  dv.setUint8(0, 113);
  // public key slot: Where we store the key to use.
  // TODO: Users should be able to select this.
  dv.setUint8(1, 5);
  // alternate: Set to false.
  dv.setUint8(2, 0);
  // The challenge length.
  dv.setUint32(3, 16);
  // The random challenge itself.
  crypto.getRandomValues(u8.subarray(7, 16));

  // Send the challenge.
  return this.sendAgentMessage_(Array.from(u8)).then((result) => {
    if (result.data.length <= 5) {
      throw new Error(`Agent failed; missing ssh certificate? (${result.data})`);
    }

    // Receive SSH_AGENTC_PUBLIC_KEY_RESPONSE.
    const response = nassh.agent.messages.read(
        new nassh.agent.Message(result.data[0], result.data.slice(1)));

    // Construct a SSH_AGENTC_SIGN_REQUEST.
    const request = nassh.agent.messages.write(
        nassh.agent.messages.Numbers.AGENTC_SIGN_REQUEST,
        new Uint8Array(response.fields.publicKeyRaw),
        lib.codec.stringToCodeUnitArray(challenge, Uint8Array));

    // Send the sign request.  We can only send Arrays, but request is a typed
    // array, so convert it over (and skip leading length field).
    const data = Array.from(request.rawMessage().subarray(4));
    return this.sendAgentMessage_(data).then((result) => {
      if (result.data.length <= 5) {
        throw new Error(`Agent failed; unable to sign challenge (${result.data})`);
      }

      // Return the signed challenge.
      return btoa(lib.codec.codeUnitArrayToString(result.data.slice(5)));
    });
  });
};

/**
 * Maximum length of message that can be sent to avoid request limits.
 */
nassh.Stream.RelaySshfeWS.prototype.maxMessageLength = 64 * 1024;

/**
 * URI to establish a connection to the ssh server via the relay.
 *
 * Note: The user field here isn't really needed.  We pass it along to help
 * with remote logging on the server.
 */
nassh.Stream.RelaySshfeWS.prototype.connectTemplate_ =
    `%(protocol)://%(relayHost):%(relayPort)/connect` +
    `?ssh-fe-challenge=%encodeURIComponent(challenge)` +
    `&ssh-fe-signature=%encodeURIComponent(signature)` +
    `&host=%encodeURIComponent(host)` +
    `&port=%encodeURIComponent(port)` +
    `&user=%encodeURIComponent(relayUser)` +
    `&ack=%(readCount)` +
    `&pos=%(writeCount)`;

/**
 * Start a new connection to the proxy server.
 */
nassh.Stream.RelaySshfeWS.prototype.connect_ = function(challenge, signature) {

  console.log(new Error().stack);

  if (this.socket_) {
    throw new Error('stream already connected');
  }

  const uri = lib.f.replaceVars(this.connectTemplate_, {
    protocol: 'wss',
    relayHost: this.relayHost_,
    relayPort: this.relayPort_,
    relayUser: this.relayUser_,
    challenge: challenge,
    signature: signature,
    host: this.host_,
    port: this.port_,
    readCount: this.readCount_,
    writeCount: 0,
  });

  this.socket_ = new WebSocket(uri);
  this.socket_.binaryType = 'arraybuffer';
  this.socket_.onopen = this.onSocketOpen_.bind(this);
  this.socket_.onmessage = this.onSocketData_.bind(this);
  this.socket_.onclose = this.onSocketClose_.bind(this);
  this.socket_.onerror = this.onSocketError_.bind(this);
};

/**
 * Close the connection to the proxy server and clean up.
 *
 * @param {string} reason A short message explaining the reason for closing.
 */
nassh.Stream.RelaySshfeWS.prototype.close_ = function(reason) {
  // If we aren't open, there's nothing to do.  This allows us to call it
  // multiple times, perhaps from cascading events (write error/close/etc...).
  if (!this.socket_) {
    return;
  }

  console.log(`Closing socket due to ${reason}`);
  this.socket_.close();
  this.socket_ = null;
  nassh.Stream.prototype.close.call(this);
};

/**
 * Callback when the socket connects successfully.
 *
 * @param {Event} e The event details.
 */
nassh.Stream.RelaySshfeWS.prototype.onSocketOpen_ = function(e) {
  // If we had any pending writes, kick them off.  We can't call sendWrite
  // directly as the socket isn't in the correct state until after this handler
  // finishes executing.
  setTimeout(this.sendWrite_.bind(this), 0);
};

/**
 * Callback when the socket closes when the connection is finished.
 *
 * @param {CloseEvent} e The event details.
 */
nassh.Stream.RelaySshfeWS.prototype.onSocketClose_ = function(e) {
  this.close_('server closed socket');
};

/**
 * Callback when the socket closes due to an error.
 *
 * @param {Event} e The event details.
 */
nassh.Stream.RelaySshfeWS.prototype.onSocketError_ = function(e) {
  this.close_('server sent an error');
};

/**
 * Callback when new data is available from the server.
 *
 * @param {MessageEvent} e The message with data to read.
 */
nassh.Stream.RelaySshfeWS.prototype.onSocketData_ = function(e) {
  const dv = new DataView(e.data);
  const ack = dv.getUint32(0);

  // Acks are unsigned 24 bits.  Negative means error.
  if (ack > 0xffffff) {
    this.close_(`ack ${ack} is an error`);
    return;
  }

  // This creates a copy of the ArrayBuffer, but there doesn't seem to be an
  // alternative -- PPAPI doesn't accept views like Uint8Array.  And if it did,
  // it would probably still serialize the entire underlying ArrayBuffer (which
  // in this case wouldn't be a big deal as it's only 4 extra bytes).
  const data = e.data.slice(4);
  this.readCount_ = (this.readCount_ + data.byteLength) & 0xffffff;
  this.onDataAvailable(data);
};

/**
 * Queue up some data to write asynchronously.
 *
 * @param {string} data A base64 encoded string.
 * @param {function(number)=} onSuccess Optional callback.
 */
nassh.Stream.RelaySshfeWS.prototype.asyncWrite = function(data, onSuccess) {
  if (!data.byteLength) {
    return;
  }

  this.writeBuffer_ = lib.array.concatTyped(
      this.writeBuffer_, new Uint8Array(data));
  this.onWriteSuccess_ = onSuccess;
  this.sendWrite_();
};

/**
 * Send out any queued data.
 */
nassh.Stream.RelaySshfeWS.prototype.sendWrite_ = function() {
  if (!this.socket_ || this.socket_.readyState != 1 ||
      this.writeBuffer_.length == 0) {
    // Nothing to write or socket is not ready.
    return;
  }

  const readBuffer = this.writeBuffer_.subarray(0, this.maxMessageLength);
  const size = readBuffer.length;
  const buf = new ArrayBuffer(size + 4);
  const u8 = new Uint8Array(buf, 4);
  const dv = new DataView(buf);

  dv.setUint32(0, this.readCount_);

  // Copy over the read buffer.
  u8.set(readBuffer);

  this.socket_.send(buf);
  this.writeBuffer_ = this.writeBuffer_.subarray(size);

  if (this.onWriteSuccess_ !== null) {
    // Notify nassh that we are ready to consume more data.
    this.onWriteSuccess_(size);
  }

  if (this.writeBuffer_.length) {
    // We have more data to send but due to message limit we didn't send it.
    setTimeout(this.sendWrite_.bind(this), 0);
  }
};


//nassh_stream_google_relay.js
// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Base class of XHR or WebSocket backed streams.
 *
 * This class implements session initialization and back-off logic common for
 * both types of streams.
 */
nassh.Stream.GoogleRelay = function(fd) {
  nassh.Stream.apply(this, [fd]);

  this.host_ = null;
  this.port_ = null;
  this.relay_ = null;

  this.sessionID_ = null;

  this.backoffMS_ = 0;
  this.backoffTimeout_ = null;

  this.writeArrayBuffer = true;
  this.writeBuffer_ = new Uint8Array();
  this.writeCount_ = 0;
  this.onWriteSuccess_ = null;

  this.readCount_ = 0;
};

/**
 * We are a subclass of nassh.Stream.
 */
nassh.Stream.GoogleRelay.prototype = Object.create(nassh.Stream.prototype);
nassh.Stream.GoogleRelay.constructor = nassh.Stream.GoogleRelay;

/**
 * Open a relay socket.
 *
 * This fires off the /proxy request, and if it succeeds starts the /read
 * hanging GET.
 */
nassh.Stream.GoogleRelay.prototype.asyncOpen_ = function(args, onComplete) {
  this.relay_ = args.relay;
  this.host_ = args.host;
  this.port_ = args.port;
  this.resume_ = args.resume;

  var sessionRequest = new XMLHttpRequest();

  var onError = () => {
    console.error('Failed to get session id:', sessionRequest);
    onComplete(false, `${sessionRequest.status}: ${sessionRequest.statusText}`);
  };

  var onReady = () => {
    if (sessionRequest.readyState != XMLHttpRequest.DONE)
      return;

    if (sessionRequest.status != 200)
      return onError();

    this.sessionID_ = sessionRequest.responseText;
    this.resumeRead_();
    onComplete(true);
  };

  sessionRequest.open('GET', this.relay_.relayServer +
                      'proxy?host=' + this.host_ + '&port=' + this.port_,
                      true);
  sessionRequest.withCredentials = true;  // We need to see cookies for /proxy.
  sessionRequest.onabort = sessionRequest.ontimeout =
      sessionRequest.onerror = onError;
  sessionRequest.onloadend = onReady;
  sessionRequest.send();
};

nassh.Stream.GoogleRelay.prototype.resumeRead_ = function() {
  throw nassh.Stream.ERR_NOT_IMPLEMENTED;
};

/**
 * Queue up some data to write.
 */
nassh.Stream.GoogleRelay.prototype.asyncWrite = function(data, onSuccess) {
  if (!data.byteLength) {
    return;
  }

  this.writeBuffer_ = lib.array.concatTyped(
      this.writeBuffer_, new Uint8Array(data));
  this.onWriteSuccess_ = onSuccess;

  if (!this.backoffTimeout_)
    this.sendWrite_();
};

/**
 * Send the next pending write.
 */
nassh.Stream.GoogleRelay.prototype.sendWrite_ = function() {
  throw nassh.Stream.ERR_NOT_IMPLEMENTED;
};

/**
 * Indicates that the backoff timer has expired and we can try again.
 *
 * This does not guarantee that communications have been restored, only
 * that we can try again.
 */
nassh.Stream.GoogleRelay.prototype.onBackoffExpired_ = function() {
  this.backoffTimeout_ = null;
  this.resumeRead_();
  this.sendWrite_();
};

/**
 * Called after a successful read or write to indicate that communication
 * is working as expected.
 */
nassh.Stream.GoogleRelay.prototype.requestSuccess_ = function(isRead) {
  this.backoffMS_ = 0;

  if (this.backoffTimeout_) {
    // Sometimes we end up clearing the backoff before the timeout actually
    // expires.  This is the case if a read and write request are in progress
    // and one fails while the other succeeds.  If the success completes *after*
    // the failure, we end up here.
    //
    // We assume we're free to clear the backoff and continue as normal.
    clearTimeout(this.backoffTimeout_);
    this.onBackoffExpired_();
  } else {
    if (isRead) {
      this.resumeRead_();
    } else {
      this.sendWrite_();
    }
  }
};

nassh.Stream.GoogleRelay.prototype.requestError_ = function(isRead) {
  if (!this.sessionID_ || this.backoffTimeout_)
    return;

  if (!this.backoffMS_) {
    this.backoffMS_ = 1;
  } else {
    this.backoffMS_ = this.backoffMS_ * 2 + 13;
    if (this.backoffMS_ > 10000)
      this.backoffMS_ = 10000 - (this.backoffMS_ % 9000);
  }

  var requestType = isRead ? 'read' : 'write';
  console.log('Error during ' + requestType +
              ', backing off: ' + this.backoffMS_ + 'ms');

  if (this.backoffMS_ >= 1000) {
    // Browser timeouts tend to have a wide margin for error.  We want to reduce
    // the risk that a failed retry will redisplay this message just as its
    // fading away.  So we show the retry message for a little longer than we
    // expect to back off.
    this.relay_.io.showOverlay(nassh.msg('RELAY_RETRY'), this.backoffMS_ + 500);
  }

  this.backoffTimeout_ =
      setTimeout(this.onBackoffExpired_.bind(this), this.backoffMS_);
};

/**
 * XHR backed stream.
 *
 * This class manages the read and write XML http requests used to communicate
 * with the Google relay server.
 */
nassh.Stream.GoogleRelayXHR = function(fd) {
  nassh.Stream.GoogleRelay.apply(this, [fd]);

  this.writeRequest_ = new XMLHttpRequest();
  this.writeRequest_.ontimeout = this.writeRequest_.onabort =
      this.writeRequest_.onerror = this.onRequestError_.bind(this);
  this.writeRequest_.onloadend = this.onWriteDone_.bind(this);

  this.readRequest_ = new XMLHttpRequest();
  this.readRequest_.ontimeout = this.readRequest_.onabort =
      this.readRequest_.onerror = this.onRequestError_.bind(this);
  this.readRequest_.onloadend = this.onReadReady_.bind(this);

  this.lastWriteSize_ = 0;
};

/**
 * We are a subclass of nassh.Stream.GoogleRelay.
 */
nassh.Stream.GoogleRelayXHR.prototype =
    Object.create(nassh.Stream.GoogleRelay.prototype);
nassh.Stream.GoogleRelayXHR.constructor = nassh.Stream.GoogleRelayXHR;

/**
 * Maximum length of message that can be sent to avoid request limits.
 */
nassh.Stream.GoogleRelayXHR.prototype.maxMessageLength = 1024;

nassh.Stream.GoogleRelayXHR.prototype.resumeRead_ = function() {
  if (this.isRequestBusy_(this.readRequest_)) {
    // Read request is in progress.
    return;
  }

  if (this.backoffTimeout_) {
    console.warn('Attempt to read while backing off.');
    return;
  }

  this.readRequest_.open('GET', this.relay_.relayServer + 'read?sid=' +
                         this.sessionID_ + '&rcnt=' + this.readCount_, true);
  this.readRequest_.send();
};

/**
 * Send the next pending write.
 */
nassh.Stream.GoogleRelayXHR.prototype.sendWrite_ = function() {
  if (!this.writeBuffer_.length || this.isRequestBusy_(this.writeRequest_)) {
    // Nothing to write, or a write is in progress.
    return;
  }

  if (this.backoffTimeout_) {
    console.warn('Attempt to write while backing off.');
    return;
  }

  const dataBuffer = this.writeBuffer_.subarray(0, this.maxMessageLength);
  const data = nassh.base64ToBase64Url(btoa(
      lib.codec.codeUnitArrayToString(dataBuffer)));
  this.writeRequest_.open('GET', this.relay_.relayServer +
                          'write?sid=' + this.sessionID_ +
                          '&wcnt=' + this.writeCount_ + '&data=' + data, true);
  this.writeRequest_.send();
  this.lastWriteSize_ = dataBuffer.length;
};

/**
 * Called when the readRequest_ has finished loading.
 *
 * This indicates that the response entity has the data for us to send to the
 * terminal.
 */
nassh.Stream.GoogleRelayXHR.prototype.onReadReady_ = function(e) {
  if (this.readRequest_.readyState != XMLHttpRequest.DONE)
    return;

  if (this.readRequest_.status == 410) {
    // HTTP 410 Gone indicates that the relay has dropped our ssh session.
    this.close();
    this.sessionID_ = null;
    return;
  }

  if (this.readRequest_.status != 200)
    return this.onRequestError_(e);

  this.readCount_ += Math.floor(
      this.readRequest_.responseText.length * 3 / 4);
  var data = nassh.base64UrlToBase64(this.readRequest_.responseText);
  this.onDataAvailable(data);

  this.requestSuccess_(true);
};

/**
 * Called when the writeRequest_ has finished loading.
 *
 * This indicates that data we wrote has either been successfully written, or
 * failed somewhere along the way.
 */
nassh.Stream.GoogleRelayXHR.prototype.onWriteDone_ = function(e) {
  if (this.writeRequest_.readyState != XMLHttpRequest.DONE)
    return;

  if (this.writeRequest_.status == 410) {
    // HTTP 410 Gone indicates that the relay has dropped our ssh session.
    this.close();
    return;
  }

  if (this.writeRequest_.status != 200)
    return this.onRequestError_(e);

  this.writeBuffer_ = this.writeBuffer_.subarray(this.lastWriteSize_);
  this.writeCount_ += this.lastWriteSize_;

  this.requestSuccess_(false);

  if (typeof this.onWriteSuccess_ == 'function')
    this.onWriteSuccess_(this.writeCount_);
};

nassh.Stream.GoogleRelayXHR.prototype.onRequestError_ = function(e) {
  this.requestError_(e.target == this.readRequest_);
};

/**
 * Returns true if the given XHR is busy.
 */
nassh.Stream.GoogleRelayXHR.prototype.isRequestBusy_ = function(r) {
  return (r.readyState != XMLHttpRequest.DONE &&
          r.readyState != XMLHttpRequest.UNSENT);
};

/**
 * WebSocket backed stream.
 *
 * This class manages the read and write through WebSocket to communicate
 * with the Google relay server.
 */
nassh.Stream.GoogleRelayWS = function(fd) {
  nassh.Stream.GoogleRelay.apply(this, [fd]);

  this.socket_ = null;

  // Amount of data in buffer that were sent but not acknowledged yet.
  this.sentCount_ = 0;

  // Time when data was sent most recently.
  this.ackTime_ = 0;

  // Ack related to most recently sent data.
  this.expectedAck_ = 0;

  // Circular list of recently observed ack times.
  this.ackTimes_ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Slot to record next ack time in.
  this.ackTimesIndex_ = 0;

  // Number of connect attempts made.
  this.connectCount_ = 0;
};

/**
 * We are a subclass of nassh.Stream.GoogleRelay.
 */
nassh.Stream.GoogleRelayWS.prototype =
    Object.create(nassh.Stream.GoogleRelay.prototype);
nassh.Stream.GoogleRelayWS.constructor = nassh.Stream.GoogleRelayWS;

/**
 * Maximum length of message that can be sent to avoid request limits.
 * -4 for 32-bit ack that is sent before payload.
 */
nassh.Stream.GoogleRelayWS.prototype.maxMessageLength = 32 * 1024 - 4;

nassh.Stream.GoogleRelayWS.prototype.resumeRead_ = function() {
  if (this.backoffTimeout_) {
    console.warn('Attempt to read while backing off.');
    return;
  }

  if (this.sessionID_ && !this.socket_) {
    var uri = this.relay_.relayServerSocket +
        'connect?sid=' + this.sessionID_ +
        '&ack=' + (this.readCount_ & 0xffffff) +
        '&pos=' + (this.writeCount_ & 0xffffff);
    if (this.relay_.reportConnectAttempts)
      uri += '&try=' + ++this.connectCount_;
    this.socket_ = new WebSocket(uri);
    this.socket_.binaryType = 'arraybuffer';
    this.socket_.onopen = this.onSocketOpen_.bind(this);
    this.socket_.onmessage = this.onSocketData_.bind(this);
    this.socket_.onclose = this.socket_.onerror =
        this.onSocketError_.bind(this);

    this.sentCount_ = 0;
  }
};

nassh.Stream.GoogleRelayWS.prototype.onSocketOpen_ = function(e) {
  if (e.target !== this.socket_)
    return;

  this.connectCount_ = 0;
  this.requestSuccess_(false);
};

nassh.Stream.GoogleRelayWS.prototype.recordAckTime_ = function(deltaTime) {
  this.ackTimes_[this.ackTimesIndex_] = deltaTime;
  this.ackTimesIndex_ = (this.ackTimesIndex_ + 1) % this.ackTimes_.length;

  if (this.ackTimesIndex_ == 0) {
    // Filled the circular buffer; compute average.
    var average = 0;
    for (var i = 0; i < this.ackTimes_.length; ++i)
      average += this.ackTimes_[i];
    average /= this.ackTimes_.length;

    if (this.relay_.reportAckLatency) {
      // Report observed average to relay.
      // Send this meta-data as string vs. the normal binary payloads.
      var msg = 'A:' + Math.round(average);
      this.socket_.send(msg);
    }
  }
};

nassh.Stream.GoogleRelayWS.prototype.onSocketData_ = function(e) {
  if (e.target !== this.socket_)
    return;

  const dv = new DataView(e.data);
  const ack = dv.getUint32(0);

  // Acks are unsigned 24 bits. Negative means error.
  if (ack > 0xffffff) {
    this.close();
    this.sessionID_ = null;
    return;
  }

  // Track ack latency.
  if (this.ackTime_ != 0 && ack == this.expectedAck_) {
    this.recordAckTime_(Date.now() - this.ackTime_);
    this.ackTime_ = 0;
  }

  // Unsigned 24 bits wrap-around delta.
  var delta = ((ack & 0xffffff) - (this.writeCount_ & 0xffffff)) & 0xffffff;
  this.writeBuffer_ = this.writeBuffer_.subarray(delta);
  this.sentCount_ -= delta;
  this.writeCount_ += delta;

  // This creates a copy of the ArrayBuffer, but there doesn't seem to be an
  // alternative -- PPAPI doesn't accept views like Uint8Array.  And if it did,
  // it would probably still serialize the entire underlying ArrayBuffer (which
  // in this case wouldn't be a big deal as it's only 4 extra bytes).
  const data = e.data.slice(4);
  if (data.byteLength) {
    this.onDataAvailable(data);
    this.readCount_ += data.byteLength;
  }

  // isRead == false since for WebSocket we don't need to send another read
  // request, we will get new data as soon as it comes.
  this.requestSuccess_(false);
};

nassh.Stream.GoogleRelayWS.prototype.onSocketError_ = function(e) {
  if (e.target !== this.socket_)
    return;

  this.socket_.close();
  this.socket_ = null;
  if (this.resume_) {
    this.requestError_(true);
  } else {
    nassh.Stream.prototype.close.call(this);
  }
};

nassh.Stream.GoogleRelayWS.prototype.sendWrite_ = function() {
  if (!this.socket_ || this.socket_.readyState != 1 ||
      this.sentCount_ == this.writeBuffer_.length) {
    // Nothing to write or socket is not ready.
    return;
  }

  if (this.backoffTimeout_) {
    console.warn('Attempt to write while backing off.');
    return;
  }

  const dataBuffer = this.writeBuffer_.subarray(
      this.sentCount_, this.sentCount_ + this.maxMessageLength);
  const buf = new ArrayBuffer(dataBuffer.length + 4);
  const u8 = new Uint8Array(buf, 4);
  const dv = new DataView(buf);

  // Every ws.send() maps to a Websocket frame on wire.
  // Use first 4 bytes to send ack.
  dv.setUint32(0, this.readCount_ & 0xffffff);

  // Copy over the buffer.
  u8.set(dataBuffer);

  this.socket_.send(buf);
  this.sentCount_ += dataBuffer.length;

  // Track ack latency.
  this.ackTime_ = Date.now();
  this.expectedAck_ = (this.writeCount_ + this.sentCount_) & 0xffffff;

  if (typeof this.onWriteSuccess_ == 'function') {
    // Notify nassh that we are ready to consume more data.
    this.onWriteSuccess_(this.writeCount_ + this.sentCount_);
  }

  if (this.sentCount_ < this.writeBuffer_.length) {
    // We have more data to send but due to message limit we didn't send it.
    // We don't know when data was sent so just send new portion async.
    setTimeout(this.sendWrite_.bind(this), 0);
  }
};


// nassh_nassh.js
// Copyright (c) 2013 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * This is nassh as a lib.wam.fs.Executable.
 *
 * It's connected to the nassh filesystem in nassh_commands.js.
 */
nassh.Nassh = function(executeContext) {
  this.executeContext = executeContext;
  this.executeContext.onStdIn.addListener(this.onStdIn_, this);
  this.executeContext.onTTYChange.addListener(this.onTTYChange_, this);
  this.executeContext.onClose.addListener(this.onExecuteClose_, this);

  executeContext.ready();
  executeContext.requestTTY({interrupt: ''});

  var ecArg = executeContext.arg;

  if (ecArg instanceof Array) {
    ecArg = {argv: ecArg};
  } else if (!(ecArg instanceof Object)) {
    executeContext.closeError('wam.FileSystem.Error.UnexpectedArgvType',
                              ['object']);
    return;
  }

  /**
   * The argv object to pass to the NaCl plugin.
   */
  this.argv = {};

  if (ecArg.argv instanceof Array) {
    this.argv.arguments = [].concat(ecArg.argv);
  } else {
    this.argv.arguments = [];
  }

  this.argv.environment = this.executeContext.getEnvs();

  var tty = executeContext.getTTY();
  this.argv.terminalWidth = tty.columns;
  this.argv.terminalHeight = tty.rows;
  this.argv.writeWindow = 8 * 1024;

  this.plugin_ = null;

  // Counters used to acknowledge writes from the plugin.
  this.stdoutAcknowledgeCount_ = 0;
  this.stderrAcknowledgeCount_ = 0;

  this.onInit = new lib.Event();
  this.initPlugin_(this.onInit);
};

/**
 * Invoked from nassh.Commands.on['nassh'].
 *
 * This is the entrypoint when invoked as an executable.
 */
nassh.Nassh.main = function(executeContext) {
  console.log(new Error().stack);
  var session = new nassh.Nassh(executeContext);
  session.onInit.addListener(session.start.bind(session));
};

/**
 * File descriptors used when talking to the plugin about stdio.
 */
nassh.Nassh.STDIN = 0;
nassh.Nassh.STDOUT = 1;
nassh.Nassh.STDERR = 2;

/**
 * Perform final cleanup when it's time to exit this nassh session.
 */
nassh.Nassh.prototype.exit = function(name, arg) {
  if (this.plugin_) {
    this.plugin_.parentNode.removeChild(this.plugin_);
    this.plugin_ = null;
  }
};

/**
 * Tell the NaCl plugin it's time to start.
 */
nassh.Nassh.prototype.start = function() {
  this.sendToPlugin_('startSession', [this.argv]);
};

nassh.Nassh.prototype.print = function(str, opt_onAck) {
  this.executeContext.stdout(str, opt_onAck);
};

nassh.Nassh.prototype.println = function(str, opt_onAck) {
  this.executeContext.stdout(str + '\n');
};

nassh.Nassh.prototype.initPlugin_ = function(onComplete) {
  this.print(nassh.msg('PLUGIN_LOADING'));

  this.plugin_ = window.document.createElement('embed');
  this.plugin_.setAttribute('src', '../plugin/pnacl/ssh_client.nmf');
  this.plugin_.setAttribute('type', 'application/x-nacl');

  this.plugin_.addEventListener('load', () => {
    this.println(nassh.msg('PLUGIN_LOADING_COMPLETE'));
    setTimeout(this.onTTYChange_.bind(this));
    onComplete();
  });

  this.plugin_.addEventListener('message', (e) => {
    const name = e.data.name;
    const arguments_ = e.data.arguments;

    if (name in this.onPlugin_) {
      this.onPlugin_[name].apply(this, arguments_);
    } else {
      console.log('Unknown message from plugin', e.data);
    }
  });

  this.plugin_.addEventListener('crash', (e) => {
    console.log('plugin crashed');
    this.executeContext.closeError('wam.FileSystem.Error.PluginCrash',
                                   [this.plugin_.exitStatus]);
  });

  document.body.insertBefore(this.plugin_, document.body.firstChild);

  // Set mimetype twice for https://crbug.com/371059
  this.plugin_.setAttribute('type', 'application/x-nacl');
};

/**
 * Send a message to the nassh plugin.
 *
 * @param {string} name The name of the message to send.
 * @param {Array} arguments The message arguments.
 */
nassh.Nassh.prototype.sendToPlugin_ = function(name, args) {
  this.plugin_.postMessage({name: name, arguments: args});
};

nassh.Nassh.prototype.onExecuteClose_ = function(reason, value) {
  if (this.plugin_) {
    this.plugin_.parentNode.removeChild(this.plugin_);
    this.plugin_ = null;
  }
};

/**
 * Hooked up to the onInput event of the message that started nassh.
 */
nassh.Nassh.prototype.onStdIn_ = function(value) {
  if (typeof value != 'string')
    return;

  this.sendToPlugin_('onRead', [nassh.Nassh.STDIN, btoa(value)]);
};

nassh.Nassh.prototype.onTTYChange_ = function() {
  var tty = this.executeContext.getTTY();
  this.sendToPlugin_('onResize', [Number(tty.columns), Number(tty.rows)]);
};

/**
 * Plugin message handlers.
 */
nassh.Nassh.prototype.onPlugin_ = {};

/**
 * Log a message from the plugin.
 */
nassh.Nassh.prototype.onPlugin_.printLog = function(str) {
  console.log('plugin log: ' + str);
};

/**
 * Plugin has exited.
 */
nassh.Nassh.prototype.onPlugin_.exit = function(code) {
  console.log('plugin exit: ' + code);
  this.sendToPlugin_('onExitAcknowledge', []);
  this.executeContext.closeOk(code);
};

/**
 * Plugin wants to write some data to a file descriptor.
 *
 * This is only used for stdout/stderr.  It used to be used as a conduit to
 * the HTML5 filesystem, but now NaCl can get there directly.
 */
nassh.Nassh.prototype.onPlugin_.write = function(fd, data) {
  if (fd != nassh.Nassh.STDOUT && fd != nassh.Nassh.STDERR) {
    console.warn('Attempt to write to unknown fd: ' + fd);
    return;
  }

  var string = atob(data);
  this.print(string, () => {
    var ackCount = (fd == nassh.Nassh.STDOUT ?
                    this.stdoutAcknowledgeCount_ += string.length :
                    this.stderrAcknowledgeCount_ += string.length);
    if (this.plugin_) {
      // After exit, the last ack comes after the plugin has been destroyed.
      this.sendToPlugin_('onWriteAcknowledge', [fd, ackCount]);
    }
  });
};

/**
 * Plugin wants to read from a file descriptor.
 *
 * This isn't necessary any more, though the NaCl plugin does seem to call it
 * a few times at startup with fd=0, size=1.  It can be safely ignored in
 * those cases.
 */
nassh.Nassh.prototype.onPlugin_.read = function(fd, size) {
  if (fd == nassh.Nassh.STDIN && size == 1)
    return;

  console.warn('Plugin send unexpected "read" message: ' + fd + ', ' + size);
};


// nassh_command_instance.js
// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * The NaCl-ssh-powered terminal command.
 *
 * This class defines a command that can be run in an hterm.Terminal instance.
 * This command creates an instance of the NaCl-ssh plugin and uses it to
 * communicate with an ssh daemon.
 *
 * If you want to use something other than this NaCl plugin to connect to a
 * remote host (like a shellinaboxd, etc), you'll want to create a brand new
 * command.
 *
 * @param {Object} argv The argument object passed in from the Terminal.
 */
nassh.CommandInstance = function(argv) {
  // Command arguments.
  this.argv_ = argv;

  // Command environment.
  this.environment_ = argv.environment || {};

  // hterm.Terminal.IO instance (can accept another hterm.Terminal.IO instance).
  this.io = argv.terminalIO || null;

  // Relay manager.
  this.relay_ = null;

  // Parsed extension manifest.
  this.manifest_ = null;

  // The HTML5 persistent FileSystem instance for this extension.
  this.fileSystem_ = null;

  // A set of open streams for this instance.
  this.streams_ = new nassh.StreamSet();

  // An HTML5 DirectoryEntry for /.ssh/.
  this.sshDirectoryEntry_ = null;

  // The version of the ssh client to load.
  this.sshClientVersion_ = 'pnacl';

  // Application ID of auth agent.
  this.authAgentAppID_ = null;

  // Internal SSH agent.
  this.authAgent_ = null;

  // Whether the instance is a SFTP instance.
  this.isSftp = argv.isSftp || false;

  // SFTP Client for SFTP instances.
  this.sftpClient = (this.isSftp) ? new nassh.sftp.Client(argv.basePath) : null;

  // Whether we're setting up the connection for mounting.
  this.isMount = argv.isMount || false;

  // Mount options for a SFTP instance.
  this.mountOptions = argv.mountOptions || null;

  // Session storage (can accept another hterm tab's sessionStorage).
  this.storage = argv.terminalStorage || window.sessionStorage;

  // Terminal Location reference (can accept another hterm tab's location).
  this.terminalLocation = argv.terminalLocation || document.location;

  // Terminal Window reference (can accept another hterm tab's window).
  this.terminalWindow = argv.terminalWindow || window;

  // Root preference manager.
  this.prefs_ = new nassh.PreferenceManager();

  // Prevent us from reporting an exit twice.
  this.exited_ = false;

  // Buffer for data coming from the terminal.
  this.inputBuffer_ = new nassh.InputBuffer();
};

/**
 * The name of this command used in messages to the user.
 *
 * Perhaps this will also be used by the user to invoke this command if we
 * build a command line shell.
 */
nassh.CommandInstance.prototype.commandName = 'nassh';

/**
 * Static run method invoked by the terminal.
 */
nassh.CommandInstance.run = function(argv) {
  return new nassh.CommandInstance(argv);
};

/**
 * When the command exit is from nassh instead of ssh_client.  The ssh module
 * can only ever exit with positive values, so negative values are reserved.
 */
nassh.CommandInstance.EXIT_INTERNAL_ERROR = -1;

/**
 * Start the nassh command.
 *
 * Instance run method invoked by the nassh.CommandInstance ctor.
 */
nassh.CommandInstance.prototype.run = function() {
  // Useful for console debugging.
  window.nassh_ = this;

  this.io = this.argv_.io.push();

  // Similar to lib.fs.err, except this logs to the terminal too.
  var ferr = (msg) => {
    return (err) => {
      var ary = Array.apply(null, arguments);
      console.error(msg + ': ' + ary.join(', '));

      this.io.println(nassh.msg('UNEXPECTED_ERROR'));
      this.io.println(err);
    };
  };

  this.prefs_.readStorage(() => {
    // this.manifest_ = chrome.runtime.getManifest();
    // admin.tools
    this.manifest_ = {name: "admin.tools", version: "1.0.1" };

    // Set default window title.
    this.io.print('\x1b]0;' + this.manifest_.name + ' ' +
                    this.manifest_.version + '\x07');

    this.io.println(
        nassh.msg('WELCOME_VERSION',
                  ['\x1b[1m' + this.manifest_.name + '\x1b[m',
                   '\x1b[1m' + this.manifest_.version + '\x1b[m']));

    this.io.println(
        nassh.msg('WELCOME_FAQ', ['\x1b[1mhttps://goo.gl/muppJj\x1b[m']));

    if (hterm.windowType != 'popup' && hterm.os != 'mac') {
      this.io.println('');
      this.io.println(nassh.msg('OPEN_AS_WINDOW_TIP',
                                ['\x1b[1mhttps://goo.gl/muppJj\x1b[m']));
      this.io.println('');
    }

    // Show some release highlights the first couple of runs with a new version.
    // We'll reset the counter when the release notes change.
    this.io.println(nassh.msg('WELCOME_CHANGELOG',
                              ['\x1b[1mhttps://goo.gl/YnmXOs\x1b[m']));
    
    
    nassh.getFileSystem(onFileSystemFound, ferr('FileSystem init failed'));
  });

  var onFileSystemFound = (fileSystem, sshDirectoryEntry) => {
    this.fileSystem_ = fileSystem;
    this.sshDirectoryEntry_ = sshDirectoryEntry;

    var argstr = this.argv_.argString;

    // This item is set before we redirect away to login to a relay server.
    // If it's set now, it's the first time we're reloading after the redirect.
    var pendingRelay = this.storage.getItem('nassh.pendingRelay');
    this.storage.removeItem('nassh.pendingRelay');

    // admin.tools
    // if (!argstr || (this.storage.getItem('nassh.promptOnReload') &&
    //                 !pendingRelay)) {
    //   // If promptOnReload is set or we haven't gotten the destination
    //   // as an argument then we need to ask the user for the destination.
    //   //
    //   // The promptOnReload session item allows us to remember that we've
    //   // displayed the dialog, so we can re-display it if the user reloads
    //   // the page.  (Items in sessionStorage are scoped to the tab, kept
    //   // between page reloads, and discarded when the tab goes away.)
    //   this.storage.setItem('nassh.promptOnReload', 'yes');

    //   this.promptForDestination_();
    // } else {
      this.connectToArgString(argstr);
    // }
  };
};

/**
 * This method moved off to be a static method on nassh, but remains here
 * for js console users who expect to find it here.
 */
nassh.CommandInstance.prototype.exportPreferences = function(onComplete) {
  nassh.exportPreferences(onComplete);
};

/**
 * This method moved off to be a static method on nassh, but remains here
 * for js console users who expect to find it here.
 */
nassh.CommandInstance.prototype.importPreferences = function(
    json, opt_onComplete) {
  nassh.importPreferences(json, opt_onComplete);
};

/**
 * Reconnects to host, using the same CommandInstance.
 *
 * @param {string} argstr The connection ArgString
 */
nassh.CommandInstance.prototype.reconnect = function(argstr) {
  // Terminal reset.
  this.io.print('\x1b[!p');

  this.io = this.argv_.io.push();

  this.removePlugin_();

  this.stdoutAcknowledgeCount_ = 0;
  this.stderrAcknowledgeCount_ = 0;

  this.exited_ = false;

  this.connectToArgString(argstr);
};

/**
 * Removes a file from the HTML5 filesystem.
 *
 * Most likely you want to remove something from the /.ssh/ directory.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 *
 * @param {string} fullPath The full path to the file to remove.
 */
nassh.CommandInstance.prototype.removeFile = function(fullPath) {
  lib.fs.removeFile(this.fileSystem_.root, '/.ssh/' + fullPath);
};

/**
 * Removes a directory from the HTML5 filesystem.
 *
 * Most likely you'll want to remove the entire /.ssh/ directory.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 *
 * @param {string} fullPath The full path to the file to remove.
 */
nassh.CommandInstance.prototype.removeDirectory = function(fullPath) {
  this.fileSystem_.root.getDirectory(
      fullPath, {},
      function (f) {
        f.removeRecursively(lib.fs.log('Removed: ' + fullPath),
                            lib.fs.err('Error removing' + fullPath));
      },
      lib.fs.log('Error finding: ' + fullPath)
  );
};

/**
 * Remove all known hosts.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 */
nassh.CommandInstance.prototype.removeAllKnownHosts = function() {
  this.fileSystem_.root.getFile(
      '/.ssh/known_hosts', {create: false},
      function(fileEntry) { fileEntry.remove(function() {}); });
  /*
   * This isn't necessary, but it makes the user interface a little nicer as
   * most people don't realize that "undefined" is what you get from a void
   * javascript function.  Example console output:
   * > term_.command.removeAllKnownHosts()
   * true
   */
  return true;
};

/**
 * Remove a known host by index.
 *
 * This command is only here to support unsavory JS console hacks for managing
 * the /.ssh/ directory.
 *
 * @param {integer} index One-based index of the known host entry to remove.
 */
nassh.CommandInstance.prototype.removeKnownHostByIndex = function(index) {
  var onError = lib.fs.log('Error accessing /.ssh/known_hosts');

  lib.fs.readFile(this.fileSystem_.root, '/.ssh/known_hosts', (contents) => {
    var ary = contents.split('\n');
    ary.splice(index - 1, 1);
    lib.fs.overwriteFile(this.fileSystem_.root, '/.ssh/known_hosts',
                         ary.join('\n'), lib.fs.log('done'), onError);
  }, onError);
};

// commented: admin.tools
// nassh.CommandInstance.prototype.promptForDestination_ = function(opt_default) {
//   console.log(new Error().stack);
//   var connectDialog = this.io.createFrame(
//       lib.f.getURL('../../plugins/nassh_custom/html/nassh_connect_dialog.html'), null);

//   connectDialog.onMessage = (event) => {
//     event.data.argv.unshift(connectDialog);
//     this.dispatchMessage_('connect-dialog', this.onConnectDialog_, event.data);
//   };

//   // Resize the connection dialog iframe to try and fit all the content,
//   // but not more.  This way we don't end up with a lot of empty space.
//   function resize() {
//     let body = this.iframe_.contentWindow.document.body;
//     let shortcutList = body.querySelector('#shortcut-list');
//     let dialogBillboard = body.querySelector('.dialog-billboard');
//     let dialogButtons = body.querySelector('.dialog-buttons');

//     this.container_.style.height = '0px';
//     let height = shortcutList.scrollHeight +
//                  dialogBillboard.scrollHeight +
//                  dialogButtons.scrollHeight;
//     // Since the document has a bit of border/padding, fudge the height
//     // slightly higher than the few main elements we calculated above.
//     height *= 1.15;

//     // We don't have to worry about this being too big or too small as the
//     // frame CSS has set min/max height attributes.
//     this.container_.style.height = height + 'px';
//   }

//   // Once the dialog has finished loading all of its data, resize it.
//   connectDialog.onLoad = function() {
//     // Shift the dialog to be relative to the bottom so the notices/links we
//     // show at the top of the are more readily visible.
//     this.container_.style.top = '';
//     this.container_.style.bottom = '10%';

//     var resize_ = resize.bind(this);
//     resize_();
//     window.addEventListener('resize', resize_);
//     this.onClose = () => {
//       window.removeEventListener('resize', resize_);
//     };
//   };

//   // Clear retry count whenever we show the dialog.
//   sessionStorage.removeItem('googleRelay.redirectCount');

//   connectDialog.show();
// };

nassh.CommandInstance.prototype.connectToArgString = function(argstr) {
  // admin.tools
  // const isMount = (this.storage.getItem('nassh.isMount') == 'true');
  // const isSftp = (this.storage.getItem('nassh.isSftp') == 'true');
  // this.storage.removeItem('nassh.isMount');
  // this.storage.removeItem('nassh.isSftp');

  // // Handle profile-id:XXX forms.  These are bookmarkable.
  // var ary = argstr.match(/^profile-id:([a-z0-9]+)(\?.*)?/i);
  // if (ary) {
  //   if (isMount) {
  //     this.mountProfile(ary[1], ary[2]);
  //   } else if (isSftp) {
  //     this.sftpConnectToProfile(ary[1], ary[2]);
  //   } else {
  //    this.connectToProfile("test", "test2");
  //   }
  // } else {
  //   if (isMount) {
  //     this.mountDestination(argstr);
  //   } else if (isSftp) {
  //     this.sftpConnectToDestination(argstr);
  //   } else {
         this.connectToDestination(argstr);
  //  }
  //}
};

// admin.tools
// /**
//  * Common phases that we run before making an actual connection.
//  *
//  * @param {string} profileID Terminal preference profile name.
//  * @param {function(nassh.PreferenceManager)} callback Callback when the prefs
//  *     have finished loading.
//  */
// nassh.CommandInstance.prototype.commonProfileSetup_ = function(
//     profileID, callback) {

//   const onReadStorage = () => {
//     let prefs;
//     try {
//       prefs = this.prefs_.getProfile(profileID);
//     } catch (e) {
//       this.io.println(nassh.msg('GET_PROFILE_ERROR', [profileID, e]));
//       this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
//       return;
//     }

//     document.querySelector('#terminal').focus();

//     this.terminalLocation.hash = 'profile-id:' + profileID;
//     document.title = prefs.get('description') + ' - ' +
//       this.manifest_.name + ' ' + this.manifest_.version;

//     callback(prefs);
//   };

//   // Re-read prefs from storage in case they were just changed in the connect
//   // dialog.
//   this.prefs_.readStorage(onReadStorage);
// };

/**
 * Turn a prefs object into the params object connectTo expects.
 */
nassh.CommandInstance.prototype.prefsToConnectParams_ = function(prefs) {
  return {
    username: prefs.get('username'),
    hostname: prefs.get('hostname'),
    port: prefs.get('port'),
    nasshOptions: prefs.get('nassh-options'),
    identity: prefs.get('identity'),
    argstr: prefs.get('argstr'),
    terminalProfile: prefs.get('terminal-profile'),
    authAgentAppID: prefs.get('auth-agent-appid'),
  };
};

// admin.tools
// /**
//  * Mount a remote host given a profile id. Creates a new SFTP CommandInstance
//  * that runs in the background page.
//  */
// nassh.CommandInstance.prototype.mountProfile = function(profileID, querystr) {
//   const onBackgroundPage = (bg, prefs) => {
//     if (bg.nassh.sftp.fsp.sftpInstances[prefs.id]) {
//       this.io.println(nassh.msg('ALREADY_MOUNTED_MESSAGE'));
//       this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
//       return;
//     }

//     var args = {
//       argv: {
//         terminalIO: this.io,
//         terminalStorage: this.storage,
//         terminalLocation: this.terminalLocation,
//         terminalWindow: this.terminalWindow,
//         isSftp: true,
//         basePath: prefs.get('mount-path'),
//         isMount: true,
//         // Mount options are passed directly to chrome.fileSystemProvider.mount,
//         // so don't add fields here that would otherwise collide.
//         mountOptions: {
//           fileSystemId: prefs.id,
//           displayName: prefs.get('description'),
//           writable: true
//         }
//       },
//       connectOptions: this.prefsToConnectParams_(prefs),
//     };

//     bg.nassh.sftp.fsp.createSftpInstance(args);
//   };

//   const onStartup = (prefs) => {
//     nassh.getBackgroundPage()
//       .then((bg) => onBackgroundPage(bg, prefs));
//   };

//   this.commonProfileSetup_(profileID, onStartup);
// };

// admin.tools
// /**
//  * Creates a new SFTP CommandInstance that runs in the background page.
//  */
// nassh.CommandInstance.prototype.sftpConnectToProfile = function(
//     profileID, querystr) {

//   const onStartup = (prefs) => {
//     this.isSftp = true;
//     this.sftpClient = new nassh.sftp.Client();

//     this.connectTo(this.prefsToConnectParams_(prefs));
//   };

//   this.commonProfileSetup_(profileID, onStartup);
// };

// admin.tools
// /**
//  * Initiate a connection to a remote host given a profile id.
//  */
// nassh.CommandInstance.prototype.connectToProfile = function(
//     profileID, querystr) {
//   const onStartup = (prefs) => {
//     this.connectTo(this.prefsToConnectParams_(prefs));
//   };

//   this.commonProfileSetup_(profileID, onStartup);
// };

/**
 * Parse ssh:// URIs.
 *
 * This supports the IANA spec:
 *   https://www.iana.org/assignments/uri-schemes/prov/ssh
 *   ssh://[<user>[;fingerprint=<hash>]@]<host>[:<port>]
 *
 * It also supports Secure Shell extensions to the protocol:
 *   ssh://[<user>@]<host>[:<port>][@<relay-host>[:<relay-port>]]
 *
 * Note: We don't do IPv4/IPv6/hostname validation.  That's a DNS/connectivity
 * problem and user error.
 *
 * @param {string} uri The URI to parse.
 * @param {boolean} stripSchema Whether to strip off ssh:// at the start.
 * @param {boolean=} decodeComponents Whether to unescape percent encodings.
 * @return {boolean|Object} False if we couldn't parse the destination.
 *     An object if we were able to parse out the connect settings.
 */
nassh.CommandInstance.parseURI = function(uri, stripSchema=true,
                                          decodeComponents=false) {
  if (stripSchema && uri.startsWith('ssh:')) {
    // Strip off the "ssh:" prefix.
    uri = uri.substr(4);
    // Strip off the "//" if it exists.
    if (uri.startsWith('//'))
      uri = uri.substr(2);
  }

  // Parse the connection string.
  var ary = uri.match(
      //|user |@| [  ipv6       %zoneid   ]| host |   :port      @ relay options
      /^([^@]+)@(\[[:0-9a-f]+(?:%[^\]]+)?\]|[^:@]+)(?::(\d+))?(?:@([^:]+)(?::(\d+))?)?$/);

  if (!ary)
    return false;

  let params = {};
  var username = ary[1];
  var hostname = ary[2];
  var port = ary[3];

  // If it's IPv6, remove the brackets.
  if (hostname.startsWith('[') && hostname.endsWith(']'))
    hostname = hostname.substr(1, hostname.length - 2);

  var relayHostname, relayPort;
  if (ary[4]) {
    relayHostname = ary[4];
    if (ary[5])
      relayPort = ary[5];
  }

  const decode = (x) => decodeComponents && x ? unescape(x) : x;

  if (username) {
    // See if there are semi-colon delimited options following the username.
    // Arguments should be URI encoding their values.
    const splitParams = username.split(';');
    username = splitParams[0];
    splitParams.slice(1, splitParams.length).forEach((param) => {
      // This will take the first '=' appearing from left to right and take
      // what's on its left as the param's name and what's to its right as its
      // value. For example, if we have '-nassh-args=--proxy-mode=foo' then
      // '-nassh-args' will be the name of the param and
      // '--proxy-mode=foo' will be its value.
      const key = param.split('=', 1)[0];
      const validKeys = new Set([
          'fingerprint', '-nassh-args', '-nassh-ssh-args',
      ]);
      if (validKeys.has(key)) {
        const value = param.substr(key.length + 1);
        if (value) {
          params[key.replace(/^-/, '')] = decode(value);
        }
      } else {
        console.error(`${key} is not a valid parameter so it will be skipped`);
      }
    })
  }

  // We don't decode the hostname or port.  Valid values for both shouldn't
  // need it, and probably could be abused.
  return Object.assign({
    username: decode(username),
    hostname: hostname,
    port: port,
    relayHostname: relayHostname,
    relayPort: relayPort,
    uri: uri,
  }, params);
};

/**
 * Parse the destination string.
 *
 * These are strings that we get from the browser bar.  It's mostly ssh://
 * URIs, but it might have more stuff sprinkled in to smooth communication
 * with various entry points into Secure Shell.
 *
 * @param {string} destination The string to connect to.
 * @return {boolean|Object} False if we couldn't parse the destination.
 *     An object if we were able to parse out the connect settings.
 */
nassh.CommandInstance.parseDestination = function(destination) {
  let stripSchema = false;
  let decodeComponents = false;

  // Deal with ssh:// links.  They are encoded with % hexadecimal sequences.
  // Note: These might be ssh: or ssh://, so have to deal with that.
  if (destination.startsWith('uri:')) {
    // Strip off the "uri:" before decoding it.
    destination = unescape(destination.substr(4));
    if (!destination.startsWith('ssh:'))
      return false;

    stripSchema = true;
    decodeComponents = true;
  }

  const rv = nassh.CommandInstance.parseURI(destination, stripSchema,
                                            decodeComponents);
  if (rv === false)
    return rv;

  // Turn the relay URI settings into nassh command line options.
  let nasshOptions;
  if (rv.relayHostname !== undefined) {
    nasshOptions = '--proxy-host=' + rv.relayHostname;
    if (rv.relayPort !== undefined)
      nasshOptions += ' --proxy-port=' + rv.relayPort;
  }
  rv.nasshOptions = nasshOptions;

  rv.nasshUserOptions = rv['nassh-args'];
  rv.nasshUserSshOptions = rv['nassh-ssh-args'];

  // If the fingerprint is set, maybe add it to the known keys list.

  return rv;
};

/**
 * Initiate a connection to a remote host given a destination string.
 *
 * @param {string} destination A string of the form username@host[:port].
 */
nassh.CommandInstance.prototype.connectToDestination = function(destination) {
  // admin.tools
  // if (destination == 'crosh') {
  //   this.terminalLocation.href = 'crosh.html';
  //   return;
  // }

  // var rv = nassh.CommandInstance.parseDestination(destination);
  // if (rv === false) {
  //   this.io.println(nassh.msg('BAD_DESTINATION', [destination]));
  //   this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
  //   return;
  // }

  // // We have to set the url here rather than in connectToArgString, because
  // // some callers may come directly to connectToDestination.
  // this.terminalLocation.hash = rv.uri;
  let rv = {}; //admin.tools
  this.connectTo(rv);
};

// admin.tools
// /**
//  * Mount a remote host given a destination string.
//  *
//  * @param {string} destination A string of the form username@host[:port].
//  */
// nassh.CommandInstance.prototype.mountDestination = function(destination) {
//   var rv = nassh.CommandInstance.parseDestination(destination);
//   if (rv === false) {
//     this.io.println(nassh.msg('BAD_DESTINATION', [destination]));
//     this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
//     return;
//   }

//   // We have to set the url here rather than in connectToArgString, because
//   // some callers may come directly to connectToDestination.
//   this.terminalLocation.hash = rv.uri;

//   var args = {
//     argv: {
//       terminalIO: this.io,
//       terminalStorage: this.storage,
//       terminalLocation: this.terminalLocation,
//       terminalWindow: this.terminalWindow,
//       isSftp: true,
//       isMount: true,
//       // Mount options are passed directly to chrome.fileSystemProvider.mount,
//       // so don't add fields here that would otherwise collide.
//       mountOptions: {
//         fileSystemId: rv.username + rv.hostname,
//         displayName: rv.username + rv.hostname,
//         writable: true
//       }
//     },
//     connectOptions: rv,
//   };

//   nassh.getBackgroundPage()
//     .then((bg) => bg.nassh.sftp.fsp.createSftpInstance(args));
// };

/**
 * Split the ssh command line string up into its components.
 *
 * We currently only support simple quoting -- no nested or escaped.
 * That would require a proper lexer in here and not utilize regex.
 * See https://crbug.com/725625 for details.
 *
 * @param {string} argstr The full ssh command line.
 * @return {Object} The various components.
 */
nassh.CommandInstance.splitCommandLine = function(argstr) {
  var args = argstr || '';
  var command = '';

  // Tokenize the string first.
  var i;
  var ary = args.match(/("[^"]*"|\S+)/g);
  if (ary) {
    // If there is a -- separator in here, we split that off and leave the
    // command line untouched (other than normalizing of whitespace between
    // any arguments, and unused leading/trailing whitespace).
    i = ary.indexOf('--');
    if (i != -1) {
      command = ary.splice(i + 1).join(' ').trim();
      // Remove the -- delimiter.
      ary.pop();
    }

    // Now we have to dequote the remaining arguments.  The regex above did:
    // '-o "foo bar"' -> ['-o', '"foo bar"']
    // Based on our (simple) rules, there shouldn't be any other quotes.
    ary = ary.map((x) => x.replace(/(^"|"$)/g, ''));
  } else {
    // Strip out any whitespace.  There shouldn't be anything left that the
    // regex wouldn't have matched, but let's be paranoid.
    args = args.trim();
    if (args)
      ary = [args];
    else
      ary = [];
  }

  return {
    args: ary,
    command: command,
  };
};

// admin.tools
// /**
//  * Initiate a SFTP connection to a remote host.
//  *
//  * @param {string} destination A string of the form username@host[:port].
//  * @return {boolean} True if we were able to parse the destination string,
//  *     false otherwise.
//  */
// nassh.CommandInstance.prototype.sftpConnectToDestination = function(destination) {
//   const rv = nassh.CommandInstance.parseDestination(destination);
//   if (rv === false) {
//     this.io.println(nassh.msg('BAD_DESTINATION', [destination]));
//     this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
//     return;
//   }

//   // We have to set the url here rather than in connectToArgString, because
//   // some callers may come directly to connectToDestination.
//   this.terminalLocation.hash = rv.destination;

//   const args = {
//     argv: {
//       terminalIO: this.io,
//       terminalStorage: this.storage,
//       terminalLocation: this.terminalLocation,
//       terminalWindow: this.terminalWindow,
//       isSftp: true,
//     },
//     connectOptions: rv,
//   };

//   nassh.getBackgroundPage()
//     .then((bg) => bg.nassh.sftp.fsp.createSftpInstance(args));
// };

/**
 * Initiate an asynchronous connection to a remote host.
 *
 * @param {Object} params The various connection settings setup via the
 *    prefsToConnectParams_ helper.
 */
nassh.CommandInstance.prototype.connectTo = function(params) {
  console.log(new Error().stack);
  if (!(params.username && params.hostname)) {
    this.io.println(nassh.msg('MISSING_PARAM', ['username/hostname']));
    this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
    return;
  }

  if (params.hostname == '>crosh') {
    // TODO: This will need to be done better.  document.location changes don't
    // work in v2 apps.
    const template = 'crosh.html?profile=%encodeURIComponent(terminalProfile)';
    this.terminalLocation.href = lib.f.replaceVars(template, params);
    return;
  }

  // First tokenize the options into an object we can work with more easily.
  let options = {};
  try {
    options = nassh.CommandInstance.tokenizeOptions(params.nasshOptions,
                                                    params.hostname);
  } catch (e) {
    this.io.println(nassh.msg('NASSH_OPTIONS_ERROR', [e]));
    this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
    return;
  }

  let userOptions = {};
  try {
    userOptions = nassh.CommandInstance.tokenizeOptions(
        params.nasshUserOptions, params.hostname);
  } catch (e) {
    this.io.println(nassh.msg('NASSH_OPTIONS_ERROR', [e]));
    this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
    return;
  }

  // Merge nassh options from the ssh:// URI that we believe are safe.
  const safeNasshOptions = new Set([
    '--config', '--proxy-mode', '--proxy-host', '--proxy-port', '--ssh-agent',
  ]);
  Object.keys(userOptions).forEach((option) => {
    if (safeNasshOptions.has(option)) {
      options[option] = userOptions[option];
    } else {
      console.warn(`Option ${option} not currently supported`);
    }
  });

  // Merge ssh options from the ssh:// URI that we believe are safe.
  params.userSshArgs = [];
  const userSshOptionsList = nassh.CommandInstance.splitCommandLine(
      params.nasshUserSshOptions).args;
  const safeSshOptions = new Set([
    '-4', '-6', '-a', '-A', '-C', '-q', '-v', '-V',
  ]);
  userSshOptionsList.forEach((option) => {
    if (safeSshOptions.has(option)) {
      params.userSshArgs.push(option);
    } else {
      console.warn(`Option ${option} not currently supported`);
    }
  });
  if (userSshOptionsList.command) {
    console.warn(`Remote command '${userSshOptionsList.command}' not ` +
                 `currently supported`);
  }

  // If the user has requested a proxy relay, load it up.
  if (options['--proxy-mode'] == 'ssh-fe@google.com') {
    this.relay_ = new nassh.Relay.Sshfe(this.io, options, params.username);
    this.io.println(nassh.msg(
        'FOUND_RELAY',
        [`${this.relay_.proxyHost}:${this.relay_.proxyPort}`]));
    this.relay_.init();
  } else if (options['--proxy-mode'] == 'corp-relay@google.com') {
    this.relay_ = new nassh.GoogleRelay(this.io, options,
                                        this.terminalLocation,
                                        this.storage);

    this.io.println(nassh.msg(
        'INITIALIZING_RELAY',
        [this.relay_.proxyHost + ':' + this.relay_.proxyPort]));

    if (!this.relay_.init()) {
      // A false return value means we have to redirect to complete
      // initialization.  Bail out of the connect for now.  We'll resume it
      // when the relay is done with its redirect.

      // If we're going to have to redirect for the relay then we should make
      // sure not to re-prompt for the destination when we return.
      this.storage.setItem('nassh.pendingRelay', 'yes');

      // If we're trying to mount the connection, remember it.
      this.storage.setItem('nassh.isMount', this.isMount);
      this.storage.setItem('nassh.isSftp', this.isSftp);

      this.relay_.redirect();
      return;
    }
  } else if (options['--proxy-mode']) {
    // Unknown proxy mode.
    this.io.println(nassh.msg('NASSH_OPTIONS_ERROR',
                              [`--proxy-mode=${options['--proxy-mode']}`]));
    this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
    return;
  }

  this.connectToFinalize_(params, options);
};

/**
 * Finish the connection setup.
 *
 * This is called after any relay setup is completed.
 *
 * @param {Object} params The various connection settings setup via the
 *    prefsToConnectParams_ helper.
 * @param {Object} options The nassh specific options.
 */
nassh.CommandInstance.prototype.connectToFinalize_ = function(params, options) {
  // Make sure the selected ssh-client version is somewhat valid.
  if (options['--ssh-client-version']) {
    this.sshClientVersion_ = options['--ssh-client-version'];
  }
  if (!this.sshClientVersion_.match(/^[a-zA-Z0-9.-]+$/)) {
    this.io.println(nassh.msg('UNKNOWN_SSH_CLIENT_VERSION',
                              [this.sshClientVersion_]));
    this.exit(127, true);
    return;
  }

  if (options['--ssh-agent']) {
    params.authAgentAppID = options['--ssh-agent'];
  }

  this.io.setTerminalProfile(params.terminalProfile || 'default');

  // If they're using an internationalized domain name (IDN), then punycode
  // will return a different ASCII name.  Include that in the display for the
  // user so it's clear where we end up trying to connect to.
  var idn_hostname = lib.punycode.toASCII(params.hostname);
  var disp_hostname = params.hostname;
  if (idn_hostname != params.hostname)
    disp_hostname += ' (' + idn_hostname + ')';

  this.io.onVTKeystroke = this.onVTKeystroke_.bind(this);
  this.io.sendString = this.sendString_.bind(this);
  this.io.onTerminalResize = this.onTerminalResize_.bind(this);

  var argv = {};
  argv.terminalWidth = this.io.terminal_.screenSize.width;
  argv.terminalHeight = this.io.terminal_.screenSize.height;
  argv.useJsSocket = !!this.relay_;
  argv.environment = this.environment_;
  argv.writeWindow = 8 * 1024;

  if (this.isSftp)
    argv.subsystem = 'sftp';

  argv.arguments = [];

  if (params.authAgentAppID) {
    argv.authAgentAppID = params.authAgentAppID;
    if (options['auth-agent-forward']) {
      argv.arguments.push('-A');
    }
  }

  // Automatically send any env vars the user has set.  This does not guarantee
  // the remote side will accept it, but we can always hope.
  Array.prototype.push.apply(
      argv.arguments,
      Object.keys(argv.environment).map((x) => `-oSendEnv=${x}`));

  // Disable IP address check for connection through proxy.
  if (argv.useJsSocket)
    argv.arguments.push('-o CheckHostIP=no');

  if (params.identity)
    argv.arguments.push('-i/.ssh/' + params.identity);
  if (params.port)
    argv.arguments.push('-p' + params.port);

  // We split the username apart so people can use whatever random characters in
  // it they want w/out causing parsing troubles ("@" or leading "-" or " ").
  argv.arguments.push('-l' + params.username);
  argv.arguments.push(idn_hostname);

  // Finally, we append the custom command line the user has constructed.
  // This matches native `ssh` behavior and makes our lives simpler.
  var extraArgs = nassh.CommandInstance.splitCommandLine(params.argstr);
  if (extraArgs.args)
    argv.arguments = argv.arguments.concat(extraArgs.args);
  argv.arguments = argv.arguments.concat(params.userSshArgs);
  if (extraArgs.command)
    argv.arguments.push('--', extraArgs.command);

  this.authAgentAppID_ = params.authAgentAppID;
  // If the agent app ID is not just an app ID, we parse it for the IDs of
  // built-in agent backends based on nassh.agent.Backend.
  if (this.authAgentAppID_ && !/^[a-z]{32}$/.test(this.authAgentAppID_)) {
    const backendIDs = this.authAgentAppID_.split(',');
    // Process the cmdline to see whether -a or -A comes last.
    const enableForward = argv.arguments.lastIndexOf('-A');
    const disableForward = argv.arguments.lastIndexOf('-a');
    const forwardAgent = enableForward > disableForward;
    this.authAgent_ = new nassh.agent.Agent(
        backendIDs, this.io.terminal_, forwardAgent);
  }

  this.initPlugin_(() => {
    if (!nassh.v2)
      this.terminalWindow.addEventListener('beforeunload', this.onBeforeUnload_);

    this.io.println(nassh.msg('CONNECTING',
                              [`${params.username}@${disp_hostname}`]));

    this.sendToPlugin_('startSession', [argv]);
    if (this.isSftp) {
      this.sftpClient.initConnection(this.plugin_);
      this.sftpClient.onInit = this.onSftpInitialised.bind(this);
    }
  });
};

/**
 * Turn the nassh option string into an object.
 *
 * @param {string=} optionString The set of --long options to parse.
 * @param {string=} hostname The hostname we're connecting to.
 * @return {Object} A map of --option to its value.
 */
nassh.CommandInstance.tokenizeOptions = function(optionString='', hostname='') {
  let rv = {};

  // If it's empty, return right away else the regex split below will create
  // [''] which causes the parser to fail.
  optionString = optionString.trim();
  if (!optionString) {
    return rv;
  }

  const optionList = optionString.split(/\s+/g);
  for (let i = 0; i < optionList.length; ++i) {
    // Make sure it's a long option first.
    const option = optionList[i];
    if (!option.startsWith('--')) {
      throw Error(option);
    }

    // Split apart the option if there is an = in it.
    let flag, value;
    const pos = option.indexOf('=');
    if (pos == -1) {
      // If there is no = then it's a boolean flag (which --no- disables).
      value = !option.startsWith('--no-');
      flag = option.slice(value ? 2 : 5);
    } else {
      flag = option.slice(2, pos);
      value = option.slice(pos + 1);
    }

    rv[`--${flag}`] = value;
  }

  // Handle various named "configs" we have.
  if (rv['--config'] == 'google') {
    // This list of agent hosts matches the internal gLinux ssh_config.
    const forwardAgent = [
      '.corp.google.com', '.corp', '.cloud.googlecorp.com', '.c.googlers.com',
    ].reduce((ret, host) => ret || hostname.endsWith(host), false);

    // This list of proxy hosts matches the internal gLinux ssh_config.
    // Hosts in these spaces should go through a different relay.
    const useSupSshRelay = [
      '.c.googlers.com', '.internal.gcpnode.com', '.proxy.gcpnode.com',
    ].reduce((ret, host) => ret || hostname.endsWith(host), false);
    const proxyHost = useSupSshRelay ?
        'sup-ssh-relay.corp.google.com' : 'ssh-relay.corp.google.com';

    rv = Object.assign({
      'auth-agent-forward': forwardAgent,
      '--proxy-host': proxyHost,
      '--proxy-port': '443',
      '--use-ssl': true,
      '--report-ack-latency': true,
      '--report-connect-attempts': true,
      '--resume-connection': false,
      '--relay-protocol': 'v2',
      '--ssh-agent': 'gnubby',
    }, rv);
  }

  // If the user specified an IPv6 address w/out brackets, add them.  It's not
  // obvious that a command line parameter would need them like a URI does.  We
  // only use the proxy-host in URI contexts currently, so this is OK.
  if (rv['--proxy-host'] && !rv['--proxy-host'].startsWith('[') &&
      rv['--proxy-host'].indexOf(':') != -1) {
    rv['--proxy-host'] = `[${rv['--proxy-host']}]`;
  }

  // If a proxy server is requested but no mode selected, default to the one
  // we've had for years, and what the public uses currently.
  if (rv['--proxy-host'] && !rv['--proxy-mode']) {
    rv['--proxy-mode'] = 'corp-relay@google.com';
  }

  // Turn 'gnubby' into the default id.  We do it here because we haven't yet
  // ported the gnubbyd logic to the new ssh-agent frameworks.
  if (rv['--ssh-agent'] == 'gnubby') {
    rv['--ssh-agent'] = nassh.GoogleRelay.defaultGnubbyExtension;
  }

  return rv;
};

/**
 * Dispatch a "message" to one of a collection of message handlers.
 */
nassh.CommandInstance.prototype.dispatchMessage_ = function(
    desc, handlers, msg) {
  if (msg.name in handlers) {
    handlers[msg.name].apply(this, msg.argv);
  } else {
    console.log('Unknown "' + desc + '" message: ' + msg.name);
  }
};

nassh.CommandInstance.prototype.initPlugin_ = function(onComplete) {
  var onPluginLoaded = () => {
    this.io.println(nassh.msg('PLUGIN_LOADING_COMPLETE'));
    onComplete();
  };

  this.io.print(nassh.msg('PLUGIN_LOADING'));

  this.plugin_ = window.document.createElement('embed');
  // Height starts at 1px, and is changed to 0 below after inserting into body.
  // This modification to the plugin ensures that the 'load' event fires
  // when it is running in the background page.
  this.plugin_.style.cssText =
      ('position: absolute;' +
       'top: -99px' +
       'width: 0;' +
       'height: 1px;');

  const pluginURL = `../plugin/${this.sshClientVersion_}/ssh_client.nmf`;

  this.plugin_.setAttribute('src', pluginURL);
  this.plugin_.setAttribute('type', 'application/x-nacl');
  this.plugin_.addEventListener('load', onPluginLoaded);
  this.plugin_.addEventListener('message', this.onPluginMessage_.bind(this));

  var errorHandler = (ev) => {
    this.io.println(nassh.msg('PLUGIN_LOADING_FAILED'));
    console.error('loading plugin failed', ev);
    this.exit(nassh.CommandInstance.EXIT_INTERNAL_ERROR, true);
  };
  this.plugin_.addEventListener('crash', errorHandler);
  this.plugin_.addEventListener('error', errorHandler);

  document.body.insertBefore(this.plugin_, document.body.firstChild);
  // Force a relayout. Workaround for load event not being called on <embed>
  // for a NaCl module. https://crbug.com/699930
  this.plugin_.style.height = '0';
};

/**
 * Remove the plugin from the runtime.
 */
nassh.CommandInstance.prototype.removePlugin_ = function() {
  if (this.plugin_) {
    this.plugin_.parentNode.removeChild(this.plugin_);
    this.plugin_ = null;
  }
};

/**
 * Callback when the user types into the terminal.
 *
 * @param {string} data The input from the terminal.
 */
nassh.CommandInstance.prototype.onVTKeystroke_ = function(data) {
  this.inputBuffer_.write(data);
};

/**
 * Helper function to create a TTY stream.
 *
 * @param {integer} fd The file descriptor index.
 * @param {boolean} allowRead True if this stream can be read from.
 * @param {boolean} allowWrite True if this stream can be written to.
 * @param {function} onOpen Callback to call when the stream is opened.
 *
 * @return {Object} The newly created stream.
 */
nassh.CommandInstance.prototype.createTtyStream = function(
    fd, allowRead, allowWrite, onOpen) {
  var arg = {
    fd: fd,
    allowRead: allowRead,
    allowWrite: allowWrite,
    inputBuffer: this.inputBuffer_,
    io: this.io
  };

  var stream = this.streams_.openStream(nassh.Stream.Tty, fd, arg, onOpen);
  if (allowRead) {
    var onDataAvailable = (isAvailable) => {
      // Send current read status to plugin.
      this.sendToPlugin_('onReadReady', [fd, isAvailable]);
    };

    this.inputBuffer_.onDataAvailable.addListener(onDataAvailable);

    stream.onClose = () => {
      this.inputBuffer_.onDataAvailable.removeListener(onDataAvailable);
      this.sendToPlugin_('onClose', [fd]);
    };
  }

  return stream;
};

/**
 * Send a message to the nassh plugin.
 *
 * @param {string} name The name of the message to send.
 * @param {Array} arguments The message arguments.
 */
nassh.CommandInstance.prototype.sendToPlugin_ = function(name, args) {
  try {
    this.plugin_.postMessage({name: name, arguments: args});
  } catch(e) {
    // When we tear down the plugin, we sometimes have a tail of pending calls.
    // Rather than try and chase all of those down, swallow errors when the
    // plugin doesn't exist.
    if (!this.exited_) {
      console.error(e);
    }
  }
};

/**
 * Send a string to the remote host.
 *
 * @param {string} string The string to send.
 */
nassh.CommandInstance.prototype.sendString_ = function(string) {
  this.inputBuffer_.write(string);
};

/**
 * Notify plugin about new terminal size.
 *
 * @param {string|integer} terminal width.
 * @param {string|integer} terminal height.
 */
nassh.CommandInstance.prototype.onTerminalResize_ = function(width, height) {
  this.sendToPlugin_('onResize', [Number(width), Number(height)]);
};

/**
 * Exit the nassh command.
 */
nassh.CommandInstance.prototype.exit = function(code, noReconnect) {
  if (this.exited_) {
    return;
  }

  this.exited_ = true;

  if (!nassh.v2)
    this.terminalWindow.removeEventListener('beforeunload', this.onBeforeUnload_);

  // Close all streams upon exit.
  this.streams_.closeAllStreams();

  // Hard destroy the plugin object.  In the past, we'd send onExitAcknowledge
  // to the plugin and let it exit/cleanup itself.  The NaCl runtime seems to
  // be a bit unstable though when using threads, so we can't rely on it.  See
  // https://crbug.com/710252 for more details.
  this.removePlugin_();

  if (this.isMount) {
    if (nassh.sftp.fsp.sftpInstances[this.mountOptions.fileSystemId]) {
      delete nassh.sftp.fsp.sftpInstances[this.mountOptions.fileSystemId];
    }

    console.log(nassh.msg('DISCONNECT_MESSAGE', [code]));
    return;
  } else {
    this.io.println(nassh.msg('DISCONNECT_MESSAGE', [code]));
  }

  if (noReconnect) {
    this.io.println(nassh.msg('CONNECT_OR_EXIT_MESSAGE'));
  } else {
    this.io.println(nassh.msg('RECONNECT_MESSAGE'));
  }

  this.io.onVTKeystroke = (string) => {
    var ch = string.toLowerCase();
    switch (ch) {
      case 'c':
      case '\x12': // ctrl-r
        nassh.reloadWindow();
        break;

      case 'e':
      case 'x':
      case '\x1b': // ESC
      case '\x17': // ctrl-w
        this.io.pop();
        if (this.argv_.onExit) {
          this.argv_.onExit(code);
        }
        break;

      case 'r':
      case ' ':
      case '\x0d': // enter
        if (!noReconnect) {
          this.reconnect(this.terminalLocation.hash.substr(1));
        }
    }
  };
};

nassh.CommandInstance.prototype.onBeforeUnload_ = function(e) {
  if (hterm.windowType == 'popup')
    return;

  var msg = nassh.msg('BEFORE_UNLOAD');
  e.returnValue = msg;
  return msg;
};

/**
 * Called when the plugin sends us a message.
 *
 * Plugin messages are JSON strings rather than arbitrary JS values.  They
 * also use "arguments" instead of "argv".  This function translates the
 * plugin message into something dispatchMessage_ can digest.
 */
nassh.CommandInstance.prototype.onPluginMessage_ = function(e) {
  // TODO: We should adjust all our callees to avoid this.
  e.data.argv = e.data.arguments;
  this.dispatchMessage_('plugin', this.onPlugin_, e.data);
};

/**
 * Connect dialog message handlers.
 */
nassh.CommandInstance.prototype.onConnectDialog_ = {};

/**
 * Sent from the dialog when the user chooses to mount a profile.
 */
nassh.CommandInstance.prototype.onConnectDialog_.mountProfile = function(
    dialogFrame, profileID) {
  dialogFrame.close();

  this.mountProfile(profileID);
};

/**
 * Sent from the dialog when the user chooses to connect to a profile via sftp.
 */
nassh.CommandInstance.prototype.onConnectDialog_.sftpConnectToProfile = function(
    dialogFrame, profileID) {
  dialogFrame.close();

  this.sftpConnectToProfile(profileID);
};

/**
 * Sent from the dialog when the user chooses to connect to a profile.
 */
nassh.CommandInstance.prototype.onConnectDialog_.connectToProfile = function(
    dialogFrame, profileID) {
  dialogFrame.close();

  this.connectToProfile(profileID);
};

/**
 * Plugin message handlers.
 */
nassh.CommandInstance.prototype.onPlugin_ = {};

/**
 * Log a message from the plugin.
 */
nassh.CommandInstance.prototype.onPlugin_.printLog = function(str) {
  console.log('plugin log: ' + str);
};

/**
 * Plugin has exited.
 */
nassh.CommandInstance.prototype.onPlugin_.exit = function(code) {
  console.log('plugin exit: ' + code);
  this.exit(code);
};

/**
 * Plugin wants to open a file.
 *
 * The plugin leans on JS to provide a persistent filesystem, which we do via
 * the HTML5 Filesystem API.
 *
 * In the future, the plugin may handle its own files.
 */
nassh.CommandInstance.prototype.onPlugin_.openFile = function(fd, path, mode) {
  let isAtty;
  var onOpen = (success) => {
    this.sendToPlugin_('onOpenFile', [fd, success, isAtty]);
  };

  var DEV_STDIN = '/dev/stdin';
  var DEV_STDOUT = '/dev/stdout';
  var DEV_STDERR = '/dev/stderr';

  if (path == '/dev/random') {
    isAtty = false;
    var stream = this.streams_.openStream(nassh.Stream.Random,
      fd, path, onOpen);
    stream.onClose = () => {
      this.sendToPlugin_('onClose', [fd]);
    };
  } else if (path == '/dev/tty') {
    isAtty = true;
    this.createTtyStream(fd, true, true, onOpen);
  } else if (this.isSftp && path == DEV_STDOUT) {
    isAtty = false;
    const info = {
      client: this.sftpClient,
    };
    this.streams_.openStream(nassh.Stream.Sftp, fd, info, onOpen);
  } else if (path == DEV_STDIN || path == DEV_STDOUT || path == DEV_STDERR) {
    isAtty = !this.isSftp;
    var allowRead = path == DEV_STDIN;
    var allowWrite = path == DEV_STDOUT || path == DEV_STDERR;
    this.createTtyStream(fd, allowRead, allowWrite, onOpen);
  } else {
    this.sendToPlugin_('onOpenFile', [fd, false, false]);
  }
};

nassh.CommandInstance.prototype.onPlugin_.openSocket = function(fd, host, port) {
  var stream = null;

  const onOpen = (success, error) => {
    if (!success) {
      this.io.println(nassh.msg('STREAM_OPEN_ERROR', ['socket', error]))
    }
    this.sendToPlugin_('onOpenSocket', [fd, success, false]);
  };

  if (port == 0 && host == this.authAgentAppID_) {
    // Request for auth-agent connection.
    if (this.authAgent_) {
      stream = this.streams_.openStream(
          nassh.Stream.SSHAgent, fd, {authAgent: this.authAgent_}, onOpen);
    } else {
      stream = this.streams_.openStream(
          nassh.Stream.SSHAgentRelay, fd,
          {authAgentAppID: this.authAgentAppID_}, onOpen);
    }
  } else {
    // Regular relay connection request.
    if (!this.relay_) {
      onOpen(false, '!this.relay_');
      return;
    }

    stream = this.relay_.openSocket(fd, host, port, this.streams_, onOpen);
  }

  stream.onDataAvailable = (data) => {
    this.sendToPlugin_('onRead', [fd, data]);
  };

  stream.onClose = () => {
    this.sendToPlugin_('onClose', [fd]);
  };
};

/**
 * Plugin wants to write some data to a file descriptor.
 *
 * This is used to write to HTML5 Filesystem files.
 */
nassh.CommandInstance.prototype.onPlugin_.write = function(fd, data) {
  var stream = this.streams_.getStreamByFd(fd);

  if (!stream) {
    console.warn('Attempt to write to unknown fd: ' + fd);
    return;
  }

  // The plugin API has been base64 strings.  If it returns something else,
  // convert it to a string until we've updated the stream APIs to cope.
  if (data instanceof ArrayBuffer) {
    if (!stream.writeArrayBuffer) {
      data = btoa(lib.codec.codeUnitArrayToString(new Uint8Array(data)));
    }
  }

  stream.asyncWrite(data, (writeCount) => {
    if (!stream.open) {
      // If the stream was closed before we got a chance to ack, then skip it.
      // We don't want to update the state of the plugin in case it re-opens
      // the same fd and we end up acking to a new fd.
      return;
    }

    this.sendToPlugin_('onWriteAcknowledge', [fd, writeCount]);
  });
};

/**
 * SFTP Initialization handler. Mounts the SFTP connection as a file system.
 */
nassh.CommandInstance.prototype.onSftpInitialised = function() {
  if (this.isMount) {
    // Newer versions of Chrome support this API, but olders will error out.
    if (lib.f.getChromeMilestone() >= 64)
      this.mountOptions['persistent'] = false;

    // Mount file system.
    chrome.fileSystemProvider.mount(this.mountOptions);

    // Add this instance to list of SFTP instances.
    nassh.sftp.fsp.sftpInstances[this.mountOptions.fileSystemId] = this;

    this.io.showOverlay(nassh.msg('MOUNTED_MESSAGE') + ' '
                        + nassh.msg('CONNECT_OR_EXIT_MESSAGE'), null);

    this.io.onVTKeystroke = (string) => {
      var ch = string.toLowerCase();
      switch (ch) {
        case 'c':
        case '\x12': // ctrl-r
          this.terminalLocation.hash = '';
          this.terminalLocation.reload();
          break;

        case 'e':
        case 'x':
        case '\x1b': // ESC
        case '\x17': // ctrl-w
          this.terminalWindow.close();
      }
    };
  } else {
    // Interactive SFTP client case.
    this.sftpCli_ = new nasftp.Cli(this);

    // Useful for console debugging.
    this.terminalWindow.nasftp_ = this.sftpCli_;
  }
};

/**
 * Plugin wants to read from a fd.
 */
nassh.CommandInstance.prototype.onPlugin_.read = function(fd, size) {
  var stream = this.streams_.getStreamByFd(fd);

  if (!stream) {
    console.warn('Attempt to read from unknown fd: ' + fd);
    return;
  }

  stream.asyncRead(size, (b64bytes) => {
    this.sendToPlugin_('onRead', [fd, b64bytes]);
  });
};

/**
 * Notify the plugin that data is available to read.
 */
nassh.CommandInstance.prototype.onPlugin_.isReadReady = function(fd) {
  var stream = this.streams_.getStreamByFd(fd);

  if (!stream) {
    console.warn('Attempt to call isReadReady from unknown fd: ' + fd);
    return;
  }

  var rv = stream.isReadReady();
  this.sendToPlugin_('onIsReadReady', [fd, rv]);
};

/**
 * Plugin wants to close a file descriptor.
 */
nassh.CommandInstance.prototype.onPlugin_.close = function(fd) {
  var stream = this.streams_.getStreamByFd(fd);

  if (!stream) {
    console.warn('Attempt to close unknown fd: ' + fd);
    return;
  }

  this.streams_.closeStream(fd);
};

// nassh_preference_manager.js
// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * PreferenceManager subclass managing global NaSSH preferences.
 *
 * This is currently just an ordered list of known connection profiles.
 */
nassh.PreferenceManager = function(opt_storage) {
  var storage = opt_storage || nassh.defaultStorage;
  lib.PreferenceManager.call(this, storage, '/nassh/');

  this.defineChildren('profile-ids', function(parent, id) {
    return new nassh.ProfilePreferenceManager(parent, id);
  });

  this.definePreferences([
    /**
     * The last version we showed release notes for.
     */
    ['welcome/notes-version', ''],

    /**
     * How many times we've shown the current release notes.
     */
    ['welcome/show-count', 0],
  ]);
};

nassh.PreferenceManager.prototype =
    Object.create(lib.PreferenceManager.prototype);
nassh.PreferenceManager.constructor = nassh.PreferenceManager;

/**
 * Entry point when loading the nassh preferences.
 *
 * @param {function()=} callback Callback when the storage is loaded.
 */
nassh.PreferenceManager.prototype.readStorage = function(callback=undefined) {
  console.log(new Error().stack);
  // Handle renaming the "relay-options" field to "nassh-options".
  // We can probably delete this migration by Dec 2019.
  const onRead = () => {
    const profiles = this.get('profile-ids');
    profiles.forEach((id) => {
      const profile = this.getProfile(id);
      const oldName = `${profile.prefix}relay-options`;
      profile.storage.getItems([oldName], (items) => {
        if (oldName in items) {
          profile.set('nassh-options', items[oldName]);
          profile.storage.removeItem(oldName);
        }
      });
    });

    if (callback) {
      callback();
    }
  };

  lib.PreferenceManager.prototype.readStorage.call(this, onRead);
};

nassh.PreferenceManager.prototype.createProfile = function() {
  return this.createChild('profile-ids');
};

nassh.PreferenceManager.prototype.removeProfile = function(id) {
  return this.removeChild('profile-ids', id);
};

nassh.PreferenceManager.prototype.getProfile = function(id) {
  return this.getChild('profile-ids', id);
};

/**
 * lib.PreferenceManager subclass managing per-connection preferences.
 */
nassh.ProfilePreferenceManager = function(parent, id) {
  lib.PreferenceManager.call(this, parent.storage,
                             '/nassh/profiles/' + id);

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
     * Options string for nassh itself (e.g. relay settings).
     */
    ['nassh-options', ''],

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

    /**
     * The base path used when mounting via SFTP.
     */
    ['mount-path', ''],

    /**
     * The appid to which to pass auth-agent requests.
     */
    ['auth-agent-appid', null],
   ]);
};

nassh.ProfilePreferenceManager.prototype =
    Object.create(lib.PreferenceManager.prototype);
nassh.ProfilePreferenceManager.constructor = nassh.ProfilePreferenceManager;


// libdot/lib_event.js
// Copyright (c) 2013 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

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
lib.Event = function(opt_firstCallback, opt_finalCallback) {
  var ep = function() {
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
  ep.addListener = function(callback, opt_obj) {
    if (!callback) {
      console.error('Missing param: callback');
      console.log(lib.f.getStack());
    }

    ep.observers.push([callback, opt_obj]);
  };

  /**
   * Remove a callback function.
   */
  ep.removeListener = function(callback, opt_obj) {
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

// libdot/lib_fs.js
// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * HTML5 FileSystem related utility functions.
 */
lib.fs = {};

/**
 * Returns a function that console.log()'s its arguments, prefixed by |msg|.
 *
 * This is a useful utility function when working with the FileSystem's many
 * async, callbacktastic methods.
 *
 * * Use it when you don't think you care about a callback.  If it ever gets
 *   called, you get a log message that includes any parameters passed to the
 *   callback.
 *
 * * Use it as your "log a messages, then invoke this other method" pattern.
 *   Great for debugging or times when you want to log a message before
 *   invoking a callback passed in to your method.
 *
 * @param {string} msg The message prefix to use in the log.
 * @param {function(*)} opt_callback A function to invoke after logging.
 */
lib.fs.log = function(msg, opt_callback) {
  return function() {
    var ary = Array.apply(null, arguments);
    console.log(msg + ': ' + ary.join(', '));
    if (opt_callback)
      opt_callback.call(null, arguments);
  };
};

/**
 * Returns a function that console.error()'s its arguments, prefixed by |msg|.
 *
 * This is exactly like fs.log(), except the message in the JS console will
 * be styled as an error.  See fs.log() for some use cases.
 *
 * @param {string} msg The message prefix to use in the log.
 * @param {function(*)} opt_callback A function to invoke after logging.
 */
lib.fs.err = function(msg, opt_callback) {
  return function() {
    var ary = Array.apply(null, arguments);
    console.error(msg + ': ' + ary.join(', '), lib.f.getStack());
    if (opt_callback)
      opt_callback.call(null, arguments);
  };
};

/**
 * Overwrite a file on an HTML5 filesystem.
 *
 * Replace the contents of a file with the string provided.  If the file
 * doesn't exist it is created.  If it does, it is removed and re-created.
 *
 * @param {DirectoryEntry} root The directory to consider as the root of the
 *     path.
 * @param {string} path The path of the target file, relative to root.
 * @param {Blob|string} contents The new contents of the file.
 * @param {function()} onSuccess The function to invoke after success.
 * @param {function(DOMError)} opt_onError Optional function to invoke if the
 *     operation fails.
 */
lib.fs.overwriteFile = function(root, path, contents, onSuccess, opt_onError) {
  function onFileRemoved() {
    lib.fs.getOrCreateFile(root, path,
                          onFileFound,
                          lib.fs.log('Error creating: ' + path, opt_onError));
  }

  function onFileFound(fileEntry) {
    fileEntry.createWriter(onFileWriter,
                           lib.fs.log('Error creating writer for: ' + path,
                                      opt_onError));
  }

  function onFileWriter(writer) {
    writer.onwriteend = onSuccess;
    writer.onerror = lib.fs.log('Error writing to: ' + path, opt_onError);

    if (!(contents instanceof Blob)) {
      contents = new Blob([contents], {type: 'text/plain'});
    }

    writer.write(contents);
  }

  root.getFile(path, {create: false},
               function(fileEntry) {
                 fileEntry.remove(onFileRemoved, onFileRemoved);
               },
               onFileRemoved);
};

/**
 * Read a file on an HTML5 filesystem.
 *
 * @param {DirectoryEntry} root The directory to consider as the root of the
 *     path.
 * @param {string} path The path of the target file, relative to root.
 * @param {function(string)} onSuccess The function to invoke after
 *     success.
 * @param {function(DOMError)} opt_onError Optional function to invoke if the
 *     operation fails.
 */
lib.fs.readFile = function(root, path, onSuccess, opt_onError) {
  function onFileFound(fileEntry) {
    fileEntry.file(function(file) {
      const reader = new lib.fs.FileReader();
      reader.readAsText(file).then(onSuccess);
    }, opt_onError);
  }

  root.getFile(path, {create: false}, onFileFound, opt_onError);
};


/**
 * Remove a file from an HTML5 filesystem.
 *
 * @param {DirectoryEntry} root The directory to consider as the root of the
 *     path.
 * @param {string} path The path of the target file, relative to root.
 * @param {function(string)} opt_onSuccess Optional function to invoke after
 *     success.
 * @param {function(DOMError)} opt_onError Optional function to invoke if the
 *     operation fails.
 */
lib.fs.removeFile = function(root, path, opt_onSuccess, opt_onError) {
  root.getFile(
      path, {},
      function (f) {
        f.remove(lib.fs.log('Removed: ' + path, opt_onSuccess),
                 lib.fs.err('Error removing' + path, opt_onError));
      },
      lib.fs.log('Error finding: ' + path, opt_onError)
  );
};

/**
 * Build a list of all FileEntrys in an HTML5 filesystem.
 *
 * @param {DirectoryEntry} root The directory to consider as the root of the
 *     path.
 * @param {string} path The path of the target file, relative to root.
 * @return {!Promise(!Array<FileSystemEntry>)} All the entries in the directory.
 */
lib.fs.readDirectory = function(root, path) {
  return new Promise((resolve, reject) => {
    root.getDirectory(path, {create: false}, (dirEntry) => {
      const reader = dirEntry.createReader();
      reader.readEntries(resolve, reject);
    }, reject);
  });
};

/**
 * Locate the file referred to by path, creating directories or the file
 * itself if necessary.
 *
 * @param {DirectoryEntry} root The directory to consider as the root of the
 *     path.
 * @param {string} path The path of the target file, relative to root.
 * @param {function(string)} onSuccess The function to invoke after
 *     success.
 * @param {function(DOMError)} opt_onError Optional function to invoke if the
 *     operation fails.
 */
lib.fs.getOrCreateFile = function(root, path, onSuccess, opt_onError) {
  var dirname = null;
  var basename = null;

  function onDirFound(dirEntry) {
    dirEntry.getFile(basename, { create: true }, onSuccess, opt_onError);
  }

  var i = path.lastIndexOf('/');
  if (i > -1) {
    dirname = path.substr(0, i);
    basename = path.substr(i + 1);
  } else {
    basename = path;
  }

  if (!dirname) {
    onDirFound(root);
    return;
  }

  lib.fs.getOrCreateDirectory(root, dirname, onDirFound, opt_onError);
};

/**
 * Locate the directory referred to by path, creating directories along the
 * way.
 *
 * @param {DirectoryEntry} root The directory to consider as the root of the
 *     path.
 * @param {string} path The path of the target file, relative to root.
 * @param {function(string)} onSuccess The function to invoke after success.
 * @param {function(DOMError)} opt_onError Optional function to invoke if the
 *     operation fails.
 */
lib.fs.getOrCreateDirectory = function(root, path, onSuccess, opt_onError) {
  console.log(new Error().stack);
  var names = path.split('/');

  function getOrCreateNextName(dir) {
    if (!names.length)
      return onSuccess(dir);

    var name = names.shift();

    if (!name || name == '.') {
      getOrCreateNextName(dir);
    } else {
      dir.getDirectory(name, { create: true }, getOrCreateNextName,
                       opt_onError);
    }
  }

  getOrCreateNextName(root);
};

/**
 * A Promise API around the FileReader API.
 *
 * The FileReader API is old, so wrap its callbacks with a Promise.
 */
lib.fs.FileReader = function() {
};

/**
 * Internal helper for wrapping all the readAsXxx funcs.
 *
 * @param {Blob} blob The blob of data to read.
 * @param {string} method The specific readAsXxx function to call.
 * @param {Promise} A promise to resolve when reading finishes or fails.
 */
lib.fs.FileReader.prototype.readAs_ = function(blob, method) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onabort = reader.onerror = () => reject(reader);
    reader[method](blob);
  });
};

/**
 * Wrapper around FileReader.readAsArrayBuffer.
 *
 * @param {Blob} blob The blob of data to read.
 * @param {Promise} A promise to resolve when reading finishes or fails.
 */
lib.fs.FileReader.prototype.readAsArrayBuffer = function(blob) {
  return this.readAs_(blob, 'readAsArrayBuffer');
};

/**
 * Wrapper around FileReader.readAsBinaryString.
 *
 * @param {Blob} blob The blob of data to read.
 * @param {Promise} A promise to resolve when reading finishes or fails.
 */
lib.fs.FileReader.prototype.readAsBinaryString = function(blob) {
  return this.readAs_(blob, 'readAsBinaryString');
};

/**
 * Wrapper around FileReader.readAsDataURL.
 *
 * @param {Blob} blob The blob of data to read.
 * @param {Promise} A promise to resolve when reading finishes or fails.
 */
lib.fs.FileReader.prototype.readAsDataURL = function(blob) {
  return this.readAs_(blob, 'readAsDataURL');
};

/**
 * Wrapper around FileReader.readAsText.
 *
 * @param {Blob} blob The blob of data to read.
 * @param {Promise} A promise to resolve when reading finishes or fails.
 */
lib.fs.FileReader.prototype.readAsText = function(blob) {
  return this.readAs_(blob, 'readAsText');
};
