// ==UserScript==
// @name         Auto GetCode & Google Search V4 (Auto Extract Code)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Tự động trích xuất mã số từ URL, tra cứu từ GitHub, và thực hiện tìm kiếm
// @author       Manus
// @match        https://huongdangetlink.com/*
// @match        https://www.google.com/search*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      github.com
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    // --- CẤU HÌNH URL DỮ LIỆU ---
    let DATA_SOURCE_URL = "https://raw.githubusercontent.com/duyola2k3/code/refs/heads/main/list.json";

    let DATABASE = {
        "40-2": { keyword: "bcx88", targetUrl: "bcx88.work" }
    };

    const css = `
        #manus-floating-ui {
            position: fixed; top: 20px; right: 20px; width: 280px;
            background: #fff; border: 2px solid #e83e8c; border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 999999;
            padding: 15px; font-family: Arial, sans-serif; font-size: 14px;
        }
        #manus-floating-ui h3 { margin: 0 0 10px 0; font-size: 16px; color: #e83e8c; text-align: center; }
        .manus-btn {
            display: block; width: 100%; padding: 8px; margin-top: 10px;
            background: #e83e8c; color: white; border: none; border-radius: 5px;
            cursor: pointer; font-weight: bold; text-align: center;
        }
        .manus-btn:hover { background: #d63384; }
        .manus-status { margin-top: 10px; font-style: italic; color: #555; font-size: 12px; line-height: 1.4; }
        .manus-input {
            width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc;
            border-radius: 3px; box-sizing: border-box; font-weight: bold; text-align: center;
        }
        .sync-info { font-size: 10px; color: #888; margin-top: 5px; text-align: center; word-break: break-all; }
        .manus-code-display {
            background: #f0f0f0; padding: 8px; border-radius: 5px; margin-top: 10px;
            font-weight: bold; color: #333; text-align: center; word-break: break-all;
        }
    `;
    GM_addStyle(css);

    // Hàm trích xuất mã số từ URL
    function extractCodeFromURL() {
        const url = window.location.href;
        // Tìm pattern: /XXX-X/ hoặc /XXX-XX/ trong URL
        const match = url.match(/\/(\d+-\d+)\//);
        return match ? match[1] : null;
    }

    function syncData() {
        updateStatus('Đang tải dữ liệu từ GitHub...');
        
        GM_xmlhttpRequest({
            method: "GET",
            url: DATA_SOURCE_URL,
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        const remoteData = JSON.parse(response.responseText);
                        DATABASE = remoteData;
                        GM_setValue('cachedDatabase', JSON.stringify(DATABASE));
                        updateStatus('✓ Đồng bộ thành công!');
                        console.log("Dữ liệu GitHub đã cập nhật:", DATABASE);
                    } catch (e) {
                        updateStatus('✗ Lỗi: File JSON không đúng định dạng!');
                    }
                } else {
                    updateStatus('✗ Lỗi: Không tìm thấy file (404)!');
                }
            },
            onerror: function() {
                updateStatus('✗ Lỗi kết nối mạng!');
            }
        });
    }

    function createUI() {
        const ui = document.createElement('div');
        ui.id = 'manus-floating-ui';
        
        const extractedCode = extractCodeFromURL();
        const codeDisplay = extractedCode ? `<div class="manus-code-display">Mã số: <strong>${extractedCode}</strong></div>` : '';
        
        ui.innerHTML = `
            <h3>🔍 Manus Auto V4</h3>
            ${codeDisplay}
            <div>
                <label>Nhập mã số (tùy chọn):</label>
                <input type="text" id="manus-code" class="manus-input" placeholder="Ví dụ: 114-2">
            </div>
            <button id="manus-start-btn" class="manus-btn">BẮT ĐẦU TÌM KIẾM</button>
            <button id="manus-sync-btn" class="manus-btn" style="background:#6c757d; font-size:11px;">CẬP NHẬT TỪ GITHUB</button>
            <div id="manus-status" class="manus-status">Sẵn sàng...</div>
            <div class="sync-info">Nguồn: list.json (GitHub)</div>
        `;
        document.body.appendChild(ui);

        const cached = GM_getValue('cachedDatabase', null);
        if (cached) DATABASE = JSON.parse(cached);

        // Tự động điền mã số nếu trích xuất được từ URL
        const codeInput = document.getElementById('manus-code');
        if (extractedCode) {
            codeInput.value = extractedCode;
        } else {
            codeInput.value = GM_getValue('currentCode', '');
        }

        document.getElementById('manus-start-btn').onclick = startProcess;
        document.getElementById('manus-sync-btn').onclick = syncData;

        // Tự động bắt đầu nếu đã trích xuất mã số từ URL
        if (extractedCode && window.location.hostname.includes('huongdangetlink.com')) {
            setTimeout(() => {
                updateStatus('Đang kiểm tra mã số...');
                startProcess();
            }, 1000);
        }
    }

    function updateStatus(msg) {
        const statusEl = document.getElementById('manus-status');
        if (statusEl) statusEl.innerText = msg;
    }

    function startProcess() {
        const code = document.getElementById('manus-code').value.trim();
        
        if (!code) {
            updateStatus('✗ Vui lòng nhập mã số!');
            return;
        }

        const data = DATABASE[code];

        if (!data) {
            updateStatus(`✗ Mã số "${code}" không có dữ liệu!`);
            return;
        }

        GM_setValue('currentCode', code);
        GM_setValue('keyword', data.keyword);
        GM_setValue('targetUrl', data.targetUrl);
        GM_setValue('isRunning', true);

        if (window.location.hostname.includes('huongdangetlink.com')) {
            handleGetLinkPage(data.keyword);
        } else if (window.location.hostname.includes('google.com')) {
            handleGoogleSearch(data.keyword, data.targetUrl);
        }
    }

    function handleGetLinkPage(keyword) {
        updateStatus('Đang tìm từ khóa: ' + keyword);
        const elements = Array.from(document.querySelectorAll('span, div, b, strong, a, button'));
        const target = elements.find(el => el.innerText.trim() === keyword || (el.getAttribute && el.getAttribute('data-ctc-copy') === keyword));

        if (target) {
            updateStatus('✓ Đã tìm thấy! Đang mở Google...');
            target.click();
            setTimeout(() => {
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
            }, 1500);
        } else {
            updateStatus('✗ Không tìm thấy từ khóa trên trang!');
        }
    }

    function handleGoogleSearch(keyword, targetUrl) {
        updateStatus('Đang tìm URL: ' + targetUrl);
        const links = Array.from(document.querySelectorAll('a'));
        const targetLink = links.find(link => link.href && link.href.includes(targetUrl));

        if (targetLink) {
            updateStatus('✓ Đã tìm thấy! Đang cuộn đến...');
            targetLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetLink.style.border = '5px solid red';
            targetLink.style.padding = '5px';
            targetLink.style.display = 'inline-block';
            GM_setValue('isRunning', false);
        } else {
            const nextBtn = document.querySelector('#pnnext');
            if (nextBtn) {
                updateStatus('Đang sang trang tiếp theo...');
                setTimeout(() => nextBtn.click(), 2000);
            } else {
                updateStatus('✗ Không tìm thấy URL mục tiêu.');
            }
        }
    }

    window.onload = () => {
        createUI();
        if (GM_getValue('isRunning', false)) {
            const keyword = GM_getValue('keyword', '');
            const targetUrl = GM_getValue('targetUrl', '');
            if (window.location.hostname.includes('google.com')) {
                handleGoogleSearch(keyword, targetUrl);
            }
        }
    };
})();
