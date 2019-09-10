// SOURCE FILE: admin.tools/src/main/scripts/utils/util_find_files.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const path = require('path');
const fs = require('fs');
const ReadDir = require('util').promisify(fs.readdir);

module.exports = async function (dir, callback, pattern=null) {
    async function* readGivenDir(dir) {
        const entries = await ReadDir(dir, {withFileTypes:true});
        for(let entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if(entry.isDirectory()) {
                yield* readGivenDir(fullPath);
            } else {
                yield {entry: entry, dir: dir};
            }
        }
    }

    for await (const map of readGivenDir(dir)) {
        if(map.entry.name.startsWith(pattern)) {
            let localPath = path.join(".", dir);
            let innerPath = map.dir.replace(localPath, "");
            callback(path.join(innerPath, map.entry.name));
        }
    }
};