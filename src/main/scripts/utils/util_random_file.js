// SOURCE FILE: admin.tools/src/main/scripts/utils/util_random_file.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const path = require('path');
const fs = require('fs');

let util = require("./util");

util.randomFile = function (dir, full_path = false) {
    return  new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) return reject(err);

            const getRandomFile = () => {
                if (!files.length) {
                    return reject("No files detected!");
                }

                const rand = Math.floor(Math.random() * files.length);
                const file = files[rand];

                fs.stat(path.join(dir, file), (err, stats) => {
                    if (stats.isFile()) {
                        let file_ = (full_path)? path.resolve(dir + file) : file;
                        return resolve(file_);
                    }

                    files.splice(rand, 1);
                    getRandomFile();
                })
            };

            getRandomFile();
        });
    });
};

module.exports =  util.randomFile;