// SOURCE FILE: admin.tools/src/main/scripts/stream.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a MIT-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced/copied/modified from 
// Chrome nassh project.

'use strict';

const streams = require("./streams");

/**
 * The SSH backed terminal command.
 *
 * A shell command that can be run within an hterm.Terminal instance.
 * This command acts as a bridge to communicate with an ssh program.
 *
 * @param {Object} argv The arguments passed in from the Terminal.
 */
streams.CommandInstance = function (argv) {
    console.log("CommandInstance/argv", argv);
    // Command arguments.
    this.argv_ = argv;

    // administrative terminal
    this.admin_terminal = argv.argString.admin_terminal;
    this.admin_terminal.CommandInstance_(this);

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
    this.streams_ = new streams.StreamSet();

    // Session storage (can accept another hterm tab's sessionStorage).
    this.storage = argv.terminalStorage || window.sessionStorage;

    // Terminal Location reference (can accept another hterm tab's location).
    this.terminalLocation = argv.terminalLocation || document.location;

    // Terminal Window reference (can accept another hterm tab's window).
    this.terminalWindow = argv.terminalWindow || window;

    // Root preference manager.
    this.prefs_ = new streams.PreferenceManager();

    // Prevent us from reporting an exit twice.
    this.exited_ = false;

    // Buffer for data coming from the terminal.
    this.inputBuffer_ = new streams.InputBuffer();
};

/**
 * The name of this command used in messages to the user.
 *
 * Perhaps this will also be used by the user to invoke this command if we
 * build a command line shell.
 */
streams.CommandInstance.prototype.commandName = 'ssh';

/**
 * Static run method invoked by the terminal.
 */
streams.CommandInstance.run = function(argv) {
  return new streams.CommandInstance(argv);
};

/**
 * When the command exit is from streams instead of wss-ssh.  The ssh module
 * can only ever exit with positive values, so negative values are reserved.
 */
streams.CommandInstance.EXIT_INTERNAL_ERROR = -1;

/**
 * Start the ssh command.
 *
 * Instance run method invoked by the streams.CommandInstance ctor.
 */
streams.CommandInstance.prototype.run = function() {
  // Useful for console debugging.
  window.streams_ = this;

  this.io = this.argv_.io.push();
  this.admin_terminal.io = this.io;

  // Similar to lib.fs.err, except this logs to the terminal too.
  var ferr = (msg) => {
    return (err) => {
      var ary = Array.apply(null, arguments);
      console.error(msg + ': ' + ary.join(', '));

      this.io.println(streams.msg('UNEXPECTED_ERROR'));
      this.io.println(err);
    };
  };

  
  this.prefs_.readStorage(() => {
    // Set default window title.
    this.io.print('\x1b]0;Local Machine\x07');
    this.io.println("in streams.CommandInstance.prototype.run");
    this.io.println(
        streams.msg('WELCOME_VERSION', 
                  ['\x1b[1madmin.tools\x1b[m',
                   '\x1b[1m1.0.1\x1b[m']));

    this.io.println(
        streams.msg('WELCOME_FAQ', ['\x1b[1mhttp://gu.ms\x1b[m']));
        
    console.log("Passing argv string: ", this.argv_.argString);
    this.connectToArgString(this.argv_.argString);
  });

};

/**
 * This method moved off to be a static method on streams, but remains here
 * for js console users who expect to find it here.
 */
streams.CommandInstance.prototype.exportPreferences = function(onComplete) {
  streams.exportPreferences(onComplete);
};

/**
 * This method moved off to be a static method on streams, but remains here
 * for js console users who expect to find it here.
 */
streams.CommandInstance.prototype.importPreferences = function(
    json, opt_onComplete) {
  streams.importPreferences(json, opt_onComplete);
};

/**
 * Reconnects to host, using the same CommandInstance.
 *
 * @param {string} argstr The connection ArgString
 */
streams.CommandInstance.prototype.reconnect = function(argstr) {
  // Terminal reset.
  this.io.print('\x1b[!p');

  this.io = this.argv_.io.push();

  this.removePlugin_();

  this.stdoutAcknowledgeCount_ = 0;
  this.stderrAcknowledgeCount_ = 0;

  this.exited_ = false;

  this.connectToArgString(argstr);
};

streams.CommandInstance.prototype.connectToArgString = function(argstr) {
    this.connectToDestination(argstr);  
};

/**
 * Turn a prefs object into the params object connectTo expects.
 */
streams.CommandInstance.prototype.prefsToConnectParams_ = function(prefs) {
  return {
    username: prefs.get('username'),
    hostname: prefs.get('hostname'),
    port: prefs.get('port'),
    sshOptions: prefs.get('ssh-options'),
    identity: prefs.get('identity'),
    argstr: prefs.get('argstr'),
    terminalProfile: prefs.get('terminal-profile'),
    authAgentAppID: prefs.get('auth-agent-appid'),
  };
};

/**
 * Initiate a connection to a remote host given a destination string.
 *
 * @param {string} destination A string of the form username@host[:port].
 */
streams.CommandInstance.prototype.connectToDestination = function (destination) {
    let rv = {}; //admin.tools TODO
    this.connectTo(destination);
};

/**
 * Initiate an asynchronous connection to a remote host.
 *
 * @param {Object} params The various connection settings setup via the
 *    prefsToConnectParams_ helper.
 */
streams.CommandInstance.prototype.connectTo = function (params) {
    // if (!(params.username && params.hostname)) {
    //     this.io.println("hello, world, in streams.CommandInstance.prototype.connectTo");
    //     this.io.println(streams.msg('MISSING_PARAM', ['username/hostname']));
    //     this.exit(streams.CommandInstance.EXIT_INTERNAL_ERROR, true);
    //     return;
    // }

    //   this.relay_ = new streams.Relay.Sshfe(this.io, options, params.username);
    //   this.io.println(streams.msg(
    //         'FOUND_RELAY',
    //         [`${this.relay_.proxyHost}:${this.relay_.proxyPort}`]));
    //   this.relay_.init();
    //   OR

    //   this.relay_ = new streams.GoogleRelay(this.io, options,
    //                                         this.terminalLocation,
    //                                         this.storage);

    //   this.io.println(streams.msg(
    //         'INITIALIZING_RELAY',
    //         [this.relay_.proxyHost + ':' + this.relay_.proxyPort]));

    //     if (!this.relay_.init()) {
    //       this.storage.setItem('ssh.pendingRelay', 'yes');
    //       this.relay_.redirect();
    //       return;
    //     }

    let options = {};
    this.connectToFinalize_(params, options);
};

/**
 * Finish the connection setup.
 *
 * This is called after any relay setup is completed.
 *
 * @param {Object} params The various connection settings setup via the
 *    prefsToConnectParams_ helper.
 * @param {Object} options The streams specific options.
 */
streams.CommandInstance.prototype.connectToFinalize_ = function(params, options) {
    console.log("PARAMS: ", params);
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

  argv.arguments = [];

  this.initPlugin_(() => {
    this.io.println(streams.msg('CONNECTING',
                              [`${params.username}@${disp_hostname}`]));

    this.sendToPlugin_('startSession', [argv]);
  });
};

/**
 * Dispatch a "message" to one of a collection of message handlers.
 */
streams.CommandInstance.prototype.dispatchMessage_ = function(
    desc, handlers, msg) {
      console.log(msg);
      this.inputBuffer_.write(msg);
      // handlers.write.apply(this, [this.io, msg]); // TODO
      this.io.print(msg);
      //this.onPlugin_.write(msg);
};

streams.CommandInstance.prototype.initPlugin_ = function(onComplete) {
  this.io.print(streams.msg('PLUGIN_LOADING'));
  try {
    cols = this.io.terminal_.screenSize.width;
    rows = this.io.terminal_.screenSize.height;
    console.log("screen width", this.io.terminal_.screenSize.width);
    console.log("screen height", this.io.terminal_.screenSize.height);
    console.log("cell width", this.io.terminal_.scrollPort_.characterSize.width);
    console.log("cell height", this.io.terminal_.scrollPort_.characterSize.height);
    this.plugin_ = new WebSocket("ws://localhost:16443/ws/test/ssh/localhost/9038/admin/12345678/"+cols+"/"+rows); // TODO Connect to WSS here
    this.admin_terminal.shell = this.plugin_;
  } catch (exception) {
    console.error(exception);
  }

  var onPluginLoaded = () => {
    this.io.println(streams.msg('PLUGIN_LOADING_COMPLETE'));
    onComplete();
  };
  // TODO
  this.io.print(streams.msg('PLUGIN_LOADING'));

  //this.plugin_.addEventListener('load', onPluginLoaded);
  //this.plugin_.addEventListener('message', this.onPluginMessage_.bind(this));
  this.plugin_.onmessage = this.onPluginMessage_.bind(this);
  this.plugin_.onClose = () => {
     this.io.println("closed connection!");
  };

  var errorHandler = (ev) => {
    this.io.println(streams.msg('PLUGIN_LOADING_FAILED'));
    console.error('loading plugin failed', ev);
    this.exit(streams.CommandInstance.EXIT_INTERNAL_ERROR, true);
  };
 
  // this.plugin_.addEventListener('crash', errorHandler);
  // this.plugin_.addEventListener('error', errorHandler);
};

/**
 * Remove the plugin from the runtime.
 */
streams.CommandInstance.prototype.removePlugin_ = function() {
  if (this.plugin_) {
    this.plugin_ = null;
  }
};

/**
 * Callback when the user types into the terminal.
 *
 * @param {string} data The input from the terminal.
 */
streams.CommandInstance.prototype.onVTKeystroke_ = function(data) {
  if(this.admin_terminal) {
    this.admin_terminal.onVTKeystroke(data);
  } else {
    this.inputBuffer_.write(data);
  }
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
streams.CommandInstance.prototype.createTtyStream = function(
    fd, allowRead, allowWrite, onOpen) {
  var arg = {
    fd: fd,
    allowRead: allowRead,
    allowWrite: allowWrite,
    inputBuffer: this.inputBuffer_,
    io: this.io
  };

  var stream = this.streams_.openStream(streams.Stream.Tty, fd, arg, onOpen);
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
 * Send a message to the wss-ssh plugin.
 *
 * @param {string} name The name of the message to send.
 * @param {Array} arguments The message arguments.
 */
streams.CommandInstance.prototype.sendToPlugin_ = function(name, args) {
  try {
    console.log("POSTING DATA: ", name, args);
    this.admin_terminal.shell.send(args);
    //this.plugin_.postMessage({name: name, arguments: args}); // TODO
  } catch(e) {
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
streams.CommandInstance.prototype.sendString_ = function(string) {
  this.inputBuffer_.write(string);
};

/**
 * Notify plugin about new terminal size.
 *
 * @param {string|integer} terminal width.
 * @param {string|integer} terminal height.
 */
streams.CommandInstance.prototype.onTerminalResize_ = function(width, height) {
  this.sendToPlugin_('onResize', [Number(width), Number(height)]);
};

/**
 * Exit the streams command.
 */
streams.CommandInstance.prototype.exit = function(code, noReconnect) {
  if (this.exited_) {
    return;
  }

  this.exited_ = true;

  // Close all streams upon exit.
  this.streams_.closeAllStreams();

  this.removePlugin_();

  this.io.println("IN streams.CommandInstance.prototype.exit");
  this.io.println(streams.msg('DISCONNECT_MESSAGE', [code]));
 
  if (noReconnect) {
    this.io.println(streams.msg('CONNECT_OR_EXIT_MESSAGE'));
  } else {
    this.io.println(streams.msg('RECONNECT_MESSAGE'));
  }

  this.io.onVTKeystroke = (string) => {
    var ch = string.toLowerCase();
    switch (ch) {
      case 'c':
      case '\x12': // ctrl-r
        streams.reloadWindow();
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

streams.CommandInstance.prototype.onBeforeUnload_ = function(e) {
  var msg = streams.msg('BEFORE_UNLOAD');
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
streams.CommandInstance.prototype.onPluginMessage_ = function(e) {
  // TODO: We should adjust all our callees to avoid this.
  this.dispatchMessage_('write', this.onPlugin_, e.data);
};

/**
 * Connect dialog message handlers.
 */
streams.CommandInstance.prototype.onConnectDialog_ = {};

/**
 * Sent from the dialog when the user chooses to connect to a profile.
 */
streams.CommandInstance.prototype.onConnectDialog_.connectToProfile = function(
    dialogFrame, profileID) {
  dialogFrame.close();

  this.connectToProfile(profileID);
};

/**
 * Plugin message handlers.
 */
streams.CommandInstance.prototype.onPlugin_ = {};

/**
 * Log a message from the plugin.
 */
streams.CommandInstance.prototype.onPlugin_.printLog = function(str) {
  console.log('plugin log: ' + str);
};

/**
 * Plugin has exited.
 */
streams.CommandInstance.prototype.onPlugin_.exit = function(code) {
  console.log('plugin exit: ' + code);
  this.exit(code);
};

streams.CommandInstance.prototype.onPlugin_.openSocket = function(fd, host, port) {
  var stream = null;
  console.log("OPENSOCKET ON COMMANDINSTANCE: ", fd);
  const onOpen = (success, error) => {
    if (!success) {
      this.io.println(streams.msg('STREAM_OPEN_ERROR', ['socket', error]))
    }
    this.sendToPlugin_('onOpenSocket', [fd, success, false]);
  };

  if (port == 0 && host == this.authAgentAppID_) {
    // Request for auth-agent connection.
    if (this.authAgent_) {
      stream = this.streams_.openStream(
          streams.Stream.SSHAgent, fd, {authAgent: this.authAgent_}, onOpen);
    } else {
      stream = this.streams_.openStream(
          streams.Stream.SSHAgentRelay, fd,
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
streams.CommandInstance.prototype.onPlugin_.write = function(fd, data) {
  console.log("FILE_DESCRIPTOR", fd);
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
 * Plugin wants to read from a fd.
 */
streams.CommandInstance.prototype.onPlugin_.read = function(fd, size) {
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
streams.CommandInstance.prototype.onPlugin_.isReadReady = function(fd) {
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
streams.CommandInstance.prototype.onPlugin_.close = function(fd) {
  var stream = this.streams_.getStreamByFd(fd);

  if (!stream) {
    console.warn('Attempt to close unknown fd: ' + fd);
    return;
  }

  this.streams_.closeStream(fd);
};