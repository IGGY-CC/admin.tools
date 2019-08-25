// SOURCE FILE: admin.tools/src/main/scripts/utils/util_find_files.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const path = require('path');
const fs = require('fs');
const ReadDir = require('util').promisify(fs.readdir);

module.exports = async function (dir, callback, pattern=null) {
    let innerPath = "";
    async function* readGivenDir(dir) {
        const entries = await ReadDir(dir, {withFileTypes:true});
        for(let entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if(entry.isDirectory()) {
                innerPath = path.join(innerPath, entry.name);
                yield* readGivenDir(fullPath);
            } else {
                yield entry;
            }
        }
    }

    for await (const map of readGivenDir(dir)) {
        if(map.name.startsWith(pattern)) {
            callback(path.join(innerPath, map.name));
        }
    }
};