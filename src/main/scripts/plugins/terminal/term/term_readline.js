// SOURCE FILE: admin.tools/src/main/scripts/terminals/term_readline.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This class and its methods are influenced or copy-modified from
// The Chromium OS wash project.

'use strict';
let term = require("./term");

/**
 * A partial clone of GNU readline.
 */
term.Readline = function(executeContext) {
  // Jarvis functionality
  this.isJarvis = false;
  this.jarvis = executeContext.arg.jarvis.triggerText + " ";
  this.callback = () => {};

  this.executeContext = executeContext;
  this.executeContext.onStdIn.addListener(this.onStdIn_, this);
  this.executeContext.ready();

  this.promptString_ = executeContext.arg.promptString || '';
  this.promptVars_ = null;

  let inputHistory = executeContext.arg.inputHistory;
  if (inputHistory && !(inputHistory instanceof Array)) {
    this.executeContext.closeError('term.Error.BadOrMissingArgument',
                                   ['inputHistory', 'array']);
    return;
  }

  this.history_ = [''].concat(inputHistory) || [];
  this.historyIndex_ = 0;

  this.line = '';
  this.linePosition = 0;

  // Cursor position when the read() started.
  this.cursorHome_ = null;

  // Cursor position after printing the prompt.
  this.cursorPrompt_ = null;

  this.verbose = false;

  this.nextUndoIndex_ = 0;
  this.undo_ = [['', 0]];

  this.killRing_ = [];

  this.previousLineHeight_ = 0;

  this.pendingESC_ = false;

  this.tc_ = new term.Termcap();

  this.bindings = {};
  this.addBindings(term.Readline.defaultBindings);

  this.onComplete = new term.Event(this.onComplete_.bind(this));

  this.print('%get-row-column()');
  this.read();
};

term.Readline.main = function(executeContext) {
  if (typeof executeContext.arg != 'object') {
    executeContext.closeError('Error.UnexpectedArgvType',
                              ['object']);
    return;
  }

  return new term.Readline(executeContext);
};

/**
 * Default mapping of key sequence to readline commands.
 *
 * Uses term.Termcap syntax for the keys.
 */
term.Readline.defaultBindings = {
  '%(BACKSPACE)': 'backward-delete-char',
  '%(ENTER)': 'accept-line',

  '%(LEFT)': 'backward-char',
  '%(RIGHT)': 'forward-char',

  '%(UP)': 'previous-history',
  '%(DOWN)': 'next-history',

  '%(HOME)': 'beginning-of-line',
  '%(END)': 'end-of-line',
  '%(DELETE)': 'delete-char',

  '%ctrl("A")': 'beginning-of-line',
  '%ctrl("D")': 'delete-char-or-eof',
  '%ctrl("E")': 'end-of-line',
  '%ctrl("H")': 'backward-delete-char',
  '%ctrl("K")': 'kill-line',
  '%ctrl("L")': 'redraw-line',
  '%ctrl("N")': 'next-history',
  '%ctrl("P")': 'previous-history',
  '%ctrl("Y")': 'yank',
  '%ctrl("_")': 'undo',
  '%ctrl("/")': 'undo',

  '%ctrl(LEFT)': 'backward-word',
  '%ctrl(RIGHT)': 'forward-word',

  // Meta and key at the same time.
  '%meta(BACKSPACE)': 'backward-kill-word',
  '%meta(DELETE)': 'kill-word',
  '%meta(">")': 'end-of-history',
  '%meta("<")': 'beginning-of-history',

  // Meta, then key.
  //
  // TODO: This would be better as a nested binding, like...
  //   '%(META)': { '%(DELETE)': 'kill-word', ... }
  // ...which would also allow provide for C-c and M-x multi key sequences.
  '%(META)%(DELETE)': 'kill-word',
  '%(META).': 'yank-last-arg',
};

/**
 * Read a line of input.
 *
 * Prints the given prompt, and waits while the user edits a line of text.
 * Provides editing functionality through the keys specified in defaultBindings.
 */
term.Readline.prototype.read = function() {
  this.line = this.history_[0] = '';
  this.linePosition = 0;

  this.nextUndoIndex_ = 0;
  this.undo_ = [['', 0]];

  this.cursorHome_ = null;
  this.cursorPrompt_ = null;

  this.previousLineHeight_ = 0;
};

/**
 * Find the start of the word under linePosition in the given line.
 */
term.Readline.getWordStart = function(line, linePosition) {
  let left = line.substr(0, linePosition);

  let searchEnd = left.search(/[a-z0-9][^a-z0-9]*$/i);
  left = left.substr(0, searchEnd);

  let wordStart = left.search(/[^a-z0-9][a-z0-9]*$/i);
  return (wordStart > 0) ? wordStart + 1 : 0;
};

/**
 * Find the end of the word under linePosition in the given line.
 */
term.Readline.getWordEnd = function(line, linePosition) {
  let right = line.substr(linePosition);

  let searchStart = right.search(/[a-z0-9]/i);
  right = right.substr(searchStart);

  let wordEnd = right.search(/[^a-z0-9]/i);

  if (wordEnd === -1)
    return line.length;

  return linePosition + searchStart + wordEnd;
};

/**
 * Register multiple key bindings.
 */
term.Readline.prototype.addBindings = function(obj) {
  for (let key in obj) {
    this.addBinding(key, obj[key]);
  }
};

/**
 * Register a single key binding.
 */
term.Readline.prototype.addBinding = function(str, commandName) {
  this.addRawBinding(this.tc_.input(str), commandName);
};

/**
 * Register a binding without passing through termcap.
 */
term.Readline.prototype.addRawBinding = function(bytes, commandName) {
  this.bindings[bytes] = commandName;
};

term.Readline.prototype.print = function(str, opt_vars) {
  this.executeContext.stdout(this.tc_.output(str, opt_vars || {}));
  if (this.line.toLowerCase() === this.jarvis.toLowerCase()) { // Jarvis Functionality
    this.isJarvis = true;
  }
};

term.Readline.prototype.setPrompt = function(str, vars) {
  this.promptString_ = str;
  this.promptVars_ = vars;

  this.cursorPrompt_ = null;

  if (this.executeContext.isReadyState('READY'))
    this.dispatch('redraw-line');
};

term.Readline.prototype.dispatch = function(name, arg) {
  this.commands[name].call(this, arg);
};

/**
 * Instance method version of getWordStart.
 */
term.Readline.prototype.getWordStart = function() {
  return term.Readline.getWordStart(this.line, this.linePosition);
};

/**
 * Instance method version of getWordEnd.
 */
term.Readline.prototype.getWordEnd = function() {
  return term.Readline.getWordEnd(this.line, this.linePosition);
};

term.Readline.prototype.killSlice = function(start, length) {
  if (length === -1)
    length = this.line.length - start;

  let killed = this.line.substr(start, length);
  this.killRing_.unshift(killed);

  this.line = (this.line.substr(0, start) + this.line.substr(start + length));
};

term.Readline.prototype.dispatchMessage = function(msg) {
  msg.dispatch(this, term.Readline.on);
};

/**
 * Called when the terminal replys with the current cursor position.
 */
term.Readline.prototype.onCursorReport = function(row, column) {
  if (!this.cursorHome_) {
    this.cursorHome_ = {row: row, column: column};
    this.dispatch('redraw-line');
    return;
  }

  if (!this.cursorPrompt_) {
    this.cursorPrompt_ = {row: row, column: column};
    if (this.cursorHome_.row === this.cursorPrompt_.row) {
      this.promptLength_ =
          this.cursorPrompt_.column - this.cursorHome_.column;
    } else {
      let top = this.columns - this.cursorPrompt_.column;
      let bottom = this.cursorHome_.column;
      let middle = this.columns * (this.cursorPrompt_.row -
                                   this.cursorHome_.row);
      this.promptLength_ = top + middle + bottom;
    }

    this.dispatch('redraw-line');
    return;
  }

  this.cursorPrompt_.row = row;
  this.cursorPrompt_.column = column;
};

term.Readline.prototype.onStdIn_ = function(value) {
  if (typeof value != 'string')
    return;

  let string = value;

  let ary = string.match(/^\x1b\[(\d+);(\d+)R$/);
  if (ary) {
    this.onCursorReport(parseInt(ary[1]), parseInt(ary[2]));
    return;
  }

  if (string === '\x1b') {
    this.pendingESC_ = true;
    return;
  }

  if (this.pendingESC_) {
    string = '\x1b' + string;
    this.pendingESC_ = false;
  }

  let commandName = this.bindings[string];

  if (commandName) {
    if (this.verbose)
      console.log('dispatch: ' + JSON.stringify(string) + ' => ' + commandName);

    if (!(commandName in this.commands)) {
      throw new Error('Unknown command "' + commandName + '", bound to: ' +
                      string);
    }

    let previousLine = this.line;
    let previousPosition = this.linePosition;

    if (commandName !== 'undo')
      this.nextUndoIndex_ = 0;

    this.dispatch(commandName, string);

    if (previousLine !== this.line && previousLine !== this.undo_[0][0])
      this.undo_.unshift([previousLine, previousPosition]);

  } else if (/^[\x20-\xff]+$/.test(string)) {
    this.nextUndoIndex_ = 0;
    this.commands['self-insert'].call(this, string);
  } else {
    console.log('unhandled: ' + JSON.stringify(string));
    this.nextUndoIndex_ = 0;
    this.commands['self-insert'].call(this, string);
  }
};

term.Readline.prototype.commands = {};

term.Readline.prototype.commands['redraw-line'] = function(string) {
  if (!this.cursorHome_) {
    console.warn('readline: Home cursor position unknown, won\'t redraw.');
    return;
  }

  if (!this.cursorPrompt_) {
    // We don't know where the cursor ends up after printing the prompt.
    // We can't just depend on the string length of the prompt because
    // it may have non-printing escapes.  Instead we echo the prompt and then
    // locate the cursor.
    this.print('%set-row-column(row, column)',
               { row: this.cursorHome_.row,
                 column: this.cursorHome_.column,
               });
    this.print(this.promptString_, this.promptVars_);
    this.print('%get-row-column()');
    return;
  }

  this.print('%set-row-column(row, column)%(line)',
             { row: this.cursorPrompt_.row,
               column: this.cursorPrompt_.column,
               line: this.line
             });

  let tty = this.executeContext.getTTY();

  let totalLineLength = this.cursorHome_.column - 1 + this.promptLength_ +
      this.line.length;
  let totalLineHeight = Math.ceil(totalLineLength / tty.columns);
  let additionalLineHeight = totalLineHeight - 1;

  let lastRowFilled = !(totalLineLength % tty.columns);
  if (!lastRowFilled)
    this.print('%erase-right()');

  if (totalLineHeight < this.previousLineHeight_) {
    for (let i = totalLineHeight; i < this.previousLineHeight_; i++) {
      this.print('%set-row-column(row, 1)%erase-right()',
                 {row: this.cursorPrompt_.row + i});
    }
  }

  this.previousLineHeight_ = totalLineHeight;

  if (totalLineLength >= this.columns) {
    // This line overflowed the terminal width.  We need to see if it also
    // overflowed the height causing a scroll that would invalidate our idea
    // of the cursor home row.
    let scrollCount;

    if (this.cursorHome_.row + additionalLineHeight === tty.rows &&
        lastRowFilled) {
      // The line was exactly long enough to fill the terminal width and
      // and height.  Insert a newline to hold the new cursor position.
      this.print('\n');
      scrollCount = 1;
    } else {
      scrollCount = this.cursorHome_.row + additionalLineHeight - tty.rows;
    }

    if (scrollCount > 0) {
      this.cursorPrompt_.row -= scrollCount;
      this.cursorHome_.row -= scrollCount;
    }
  }

  this.dispatch('reposition-cursor');
};

term.Readline.prototype.commands['abort-line'] = function() {
  this.line = null;
  this.onComplete_();
};

term.Readline.prototype.commands['reposition-cursor'] = function(string) {
  // Count the number or rows it took to render the current line at the
  // current terminal width.
  let tty = this.executeContext.getTTY();
  let rowOffset = Math.floor((this.cursorPrompt_.column - 1 +
                              this.linePosition) / tty.columns);
  let column = (this.cursorPrompt_.column + this.linePosition -
                (rowOffset * tty.columns));

  this.print('%set-row-column(row, column)',
             { row: this.cursorPrompt_.row + rowOffset,
               column: column
             });
};

term.Readline.prototype.commands['self-insert'] = function(string) {
  if (this.linePosition === this.line.length) {
    this.line += string;
  } else {
    this.line = this.line.substr(0, this.linePosition) + string +
        this.line.substr(this.linePosition);
  }

  this.linePosition += string.length;

  this.history_[0] = this.line;

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['accept-line'] = function() {
  this.historyIndex_ = 0;
  if (this.line && this.line !== this.history_[1])
    this.history_.splice(1, 0, this.line);
  this.print('\r\n');
  this.callback(); // Jarvis Functionality
  this.onComplete(this.line);
};

term.Readline.prototype.commands['beginning-of-history'] = function() {
  this.historyIndex_ = this.history_.length - 1;
  this.line = this.history_[this.historyIndex_];
  this.linePosition = this.line.length;

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['end-of-history'] = function() {
  this.historyIndex_ = this.history_.length - 1;
  this.line = this.history_[this.historyIndex_];
  this.linePosition = this.line.length;

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['previous-history'] = function() {
  if (this.historyIndex_ === this.history_.length - 1) {
    this.print('%bell()');
    return;
  }

  this.historyIndex_ += 1;
  this.line = this.history_[this.historyIndex_];
  this.linePosition = this.line.length;

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['next-history'] = function() {
  if (this.historyIndex_ === 0) {
    this.print('%bell()');
    return;
  }

  this.historyIndex_ -= 1;
  this.line = this.history_[this.historyIndex_];
  this.linePosition = this.line.length;

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['kill-word'] = function() {
  let start = this.linePosition;
  let length =  this.getWordEnd() - start;
  this.killSlice(start, length);

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['backward-kill-word'] = function() {
  let start = this.getWordStart();
  let length = this.linePosition - start;
  this.killSlice(start, length);
  this.linePosition = start;

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['kill-line'] = function() {
  this.killSlice(this.linePosition, -1);

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['yank'] = function() {
  let text = this.killRing_[0];
  this.line = (this.line.substr(0, this.linePosition) +
               text +
               this.line.substr(this.linePosition));
  this.linePosition += text.length;

  this.dispatch('redraw-line');
};

term.Readline.prototype.commands['yank-last-arg'] = function() {
  if (this.history_.length < 2)
    return;

  let last = this.history_[1];
  let i = term.Readline.getWordStart(last, last.length - 1);
  if (i !== -1)
    this.dispatch('self-insert', last.substr(i));
};

term.Readline.prototype.commands['delete-char-or-eof'] = function() {
  if (!this.line.length) {
    this.dispatch('abort-line');
  } else {
    this.dispatch('delete-char');
  }
};

term.Readline.prototype.commands['delete-char'] = function() {
  this.print('%erase-right()');
  if (this.linePosition < this.line.length) {
    this.line = (this.line.substr(0, this.linePosition) +
                 this.line.substr(this.linePosition + 1));
    this.dispatch('redraw-line');
  } else {
    this.print('%bell()');
  }
};

term.Readline.prototype.commands['backward-delete-char'] = function() {
  if (this.linePosition > 0) {
    this.linePosition -= 1;
    this.line = (this.line.substr(0, this.linePosition) +
                 this.line.substr(this.linePosition + 1));
    this.print('%erase-chars(1)');
    this.dispatch('redraw-line');
  } else {
    this.print('%bell()');
  }
};

term.Readline.prototype.commands['backward-char'] = function() {
  if (this.linePosition > 0) {
    this.linePosition -= 1;
    this.dispatch('reposition-cursor');
  } else {
    this.print('%bell()');
  }
};

term.Readline.prototype.commands['forward-char'] = function() {
  if (this.linePosition < this.line.length) {
    this.linePosition += 1;
    this.dispatch('reposition-cursor');
  } else {
    this.print('%bell()');
  }
};

term.Readline.prototype.commands['backward-word'] = function() {
  this.linePosition = this.getWordStart();
  this.dispatch('reposition-cursor');
};


term.Readline.prototype.commands['forward-word'] = function() {
  this.linePosition = this.getWordEnd();
  this.dispatch('reposition-cursor');
};

term.Readline.prototype.commands['beginning-of-line'] = function() {
  if (this.linePosition === 0) {
    this.print('%bell()');
    return;
  }

  this.linePosition = 0;
  this.dispatch('reposition-cursor');
};

term.Readline.prototype.commands['end-of-line'] = function() {
  if (this.linePosition === this.line.length) {
    this.print('%bell()');
    return;
  }

  this.linePosition = this.line.length;
  this.dispatch('reposition-cursor');
};

term.Readline.prototype.commands['undo'] = function() {
  if ((this.nextUndoIndex_ === this.undo_.length)) {
    this.print('%bell()');
    return;
  }

  this.line = this.undo_[this.nextUndoIndex_][0];
  this.linePosition = this.undo_[this.nextUndoIndex_][1];

  this.dispatch('redraw-line');

  this.nextUndoIndex_ += 2;
};

term.Readline.prototype.onComplete_ = function() {
  if (this.executeContext.isOpen)
    this.executeContext.closeOk(this.line);
};

module.exports = term.Readline;