// SOURCE FILE: admin.tools/src/main/scripts/utils/util_load_html.js
// Copyright (c) 2019 "Aditya Naga Sanjeevi, Yellapu". All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let UtilsHTML = function() {};

UtilsHTML.prototype.loadHTML = function(element, url, parseScripts=false) {
    let html = new XMLHttpRequest();
    html.onreadystatechange = function() {
        if (html.readyState === XMLHttpRequest.DONE) {
            if(html.status === 200) {
                element.innerHTML = html.responseText;
                if (parseScripts) {
                    let scripts = element.getElementsByTagName('script');
                    scripts.forEach(script => {
                        //FIXME: eval is not supposed to be used in this project
                        eval(script.innerHTML);
                    });
                }
            } else {
                console.error("Couldn't load file: ", url);
            }
        }
    };
    html.open("GET", url, true);
    html.send();
};

UtilsHTML.prototype.loadJS = function(url) {
    let script = document.createElement('script');
    script.async = false;
    script.src = url;
    script.type = "text/javascript";
    script.defer = true;
    document.head.appendChild(script);
};

UtilsHTML.prototype.loadCSS = function(url) {
    let css = document.createElement("link");
    css.rel = "stylesheet";
    css.type = "text/css";
    css.href = url;
    document.head.appendChild(css);
};

module.exports = new UtilsHTML();