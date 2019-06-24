#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Copyright 2017 The Chromium OS Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

"""Reformat the JSON we get from the translators.

Use pure UTF-8, pretty-print, and sort.  This should (hopefully) make diffs in
future updates smaller, and shrink the size of the file itself in the extension.
"""

from __future__ import print_function

import argparse
import json
import re
import sys


def trim_redundant_placeholders(data):
    """Remove redundant placeholders entries.

    For messages that look like:
      "command_complete": {
        "message": "The command $1 exited with status code $2.",
        "placeholders": {
          "1": {
            "content": "$1"
          },
          "2": {
            "content": "$2"
          }
        }
      },

    We can delete the placeholders entirely.
    """
    for msg in data.values():
        for key, settings in list(msg.get('placeholders', {}).items()):
            if (re.match(r'^[0-9]+$', key) and
                re.match(r'^[$][0-9]+$', settings['content'])):
                msg['placeholders'].pop(key)

        # Remove the placeholders setting if it's empty now.
        placeholders = msg.get('placeholders', {})
        if not placeholders:
            msg.pop('placeholders', None)


def reformat(path, inplace=False):
    """Reformat translation."""
    with open(path) as fp:
        try:
            data = json.loads(fp.read())
        except ValueError as e:
            print('ERROR: Processing %s: %s' % (path, e), file=sys.stderr)
            return False

    trim_redundant_placeholders(data)

    format_spaces = json.dumps(data, ensure_ascii=False, indent=4,
                               sort_keys=True)
    format_tabs = re.sub('^(    )+',
                         lambda match: '\t' * (len(match.group()) // 4),
                         format_spaces, flags=re.M)

    if inplace:
        with open(path, 'w') as fp:
            fp.write(format_tabs + '\n')
    else:
        sys.stdout.write(format_tabs + '\n')

    return True


def get_parser():
    """Get a command line parser."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('-i', '--inplace', default=False, action='store_true',
                        help='Modify files inline rather than writing stdout.')
    parser.add_argument('files', nargs='+', metavar='files',
                        help='The translations to format.')
    return parser


def main(argv):
    parser = get_parser()
    opts = parser.parse_args(argv)

    ret = 0
    for path in opts.files:
        if not reformat(path, opts.inplace):
            ret = 1
    return ret


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
