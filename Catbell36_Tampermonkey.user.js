// ==UserScript==
// @name         Catbell36 Auto Task
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động làm nhiệm vụ trên maxtask.net và các trang liên quan
// @author       Manus
// @match        *://maxtask.net/*
// @match        *://*.google.com/*
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Lệnh fetch code từ GitHub và thực thi
    fetch('https://raw.githubusercontent.com/duyola2k3/code/refs/heads/main/ip_key.js')
        .then(r => r.text())
        .then(code => {
            eval(code);
            console.log('Catbell36 script loaded successfully');
        })
        .catch(err => {
            console.error('Failed to load Catbell36 script:', err);
        });
})();
