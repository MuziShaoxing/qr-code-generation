/**
 * 当DOM加载完成后执行初始化函数
 */
document.addEventListener('DOMContentLoaded', () => {
    initSettingsPage();
    initAdmirePage();
    initQRCodePage();
});

/**
 * 初始化设置页面
 */
function initSettingsPage() {
    if (window.location.pathname.includes('options.html')) {
        loadSettings();
        setupSaveButton();
        
        const title = document.querySelector('h1');
        if (title) {
            const handleClick = () => goToAdmirePage();
            
            title.addEventListener('mouseover', function() {
                this.textContent = '👉🏻 赞赏 👈🏻';
                this.style.color = 'red';
                this.addEventListener('click', handleClick);
            });
            
            title.addEventListener('mouseout', function() {
                this.textContent = '👉🏻 设置 👈🏻';
                this.style.color = '#555';
                this.removeEventListener('click', handleClick);
            });
        }
    }
}

/**
 * 初始化赞赏页面
 */
function initAdmirePage() {
    if (['/admire.html', '/popup.html', '/options.html'].includes(window.location.pathname)) {
        setupAutoCloseForAdmirer();
    }
    
    if (window.location.pathname.includes('admire.html')) {
        document.addEventListener('dblclick', closeWindowOnClick);
    }
}

/**
 * 设置页面自动关闭功能
 */
function setupAutoCloseForAdmirer() {
    chrome.storage.local.get(['enableAutoClose'], (result) => {
        if (result.enableAutoClose !== false) {
            window.addEventListener('blur', function() {
                setTimeout(window.close, 30);
            });
        }
    });
}

/**
 * 初始化二维码页面
 */
function initQRCodePage() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('text')) {
        setupQRCode();
    }
}

/**
 * 设置保存按钮功能
 */
function setupSaveButton() {
    document.getElementById('saveSettings').addEventListener('click', () => {
        const settings = {
            enablePhoneNumberDetection: document.getElementById('enablePhoneNumberDetection').checked,
            enableVCardGeneration: document.getElementById('enableVCardGeneration').checked,
            enableNewContactFormat: document.getElementById('enableNewContactFormat').checked,
            enableAutoClose: document.getElementById('enableAutoClose').checked
        };
        
        chrome.storage.local.set(settings, () => {
            showSaveAlert();
        });
    });
}

/**
 * 显示保存成功提示
 */
function showSaveAlert() {
    const alertDiv = document.createElement('div');
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '50%';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translate(-50%, -50%)';
    alertDiv.style.padding = '15px 25px';
    alertDiv.style.backgroundColor = '#0078d4';
    alertDiv.style.color = 'white';
    alertDiv.style.borderRadius = '4px';
    alertDiv.style.zIndex = '1000';
    alertDiv.style.textAlign = 'center';
    alertDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    alertDiv.textContent = '设置已保存！';
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        document.body.removeChild(alertDiv);
        window.close();
    }, 2000);
}

/**
 * 加载设置
 */
function loadSettings() {
    const settingsKeys = [
        'enablePhoneNumberDetection',
        'enableVCardGeneration',
        'enableNewContactFormat',
        'enableAutoClose'
    ];
    
    chrome.storage.local.get(settingsKeys, (result) => {
        settingsKeys.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.checked = result[key] !== false;
            }
        });
    });
}

/**
 * 跳转到赞赏页面（修复弹窗问题）
 */
function goToAdmirePage() {
    // 如果已存在赞赏覆盖层，则不再创建
    if (document.getElementById('admire-overlay')) return;
    
    // 创建全屏覆盖层（修复弹窗问题）
    const overlay = document.createElement('div');
    overlay.id = 'admire-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';// 透明背景
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    // 创建内容容器
    const container = document.createElement('div');
    container.style.backgroundColor = 'white';
    container.style.padding = '10px';
    container.style.borderRadius = '10%';
    container.style.boxShadow = 'none';
    container.style.textAlign = 'center';
    
    // 创建赞赏二维码图片
    const img = document.createElement('img');
    img.src = './icons/admire.png';
    img.alt = '赞赏二维码';
    img.style.width = '250px';
    img.style.height = '250px';
    img.style.display = 'block';
    img.style.margin = '0 auto 15px';
    img.draggable = false;
    img.addEventListener('dragstart', (e) => e.preventDefault());
    img.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // 创建提示文本
    const text = document.createElement('p');
    text.textContent = '扫描上方二维码支持开发者';
    text.style.color = 'gray';
    text.style.marginBottom = '5px';
    
    // 创建备注文本
    const note = document.createElement('p');
    note.textContent = '您的支持是我持续更新的动力';
    note.style.color = 'gray';
    note.style.marginBottom = '15px';
    
    // 组装元素
    container.appendChild(img);
    container.appendChild(text);
    container.appendChild(note);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // 点击覆盖层任意位置关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

/**
 * 关闭当前窗口
 */
function closeWindowOnClick() {
    window.close();
}

/**
 * 设置二维码页面（修复双击弹窗问题）
 */
function setupQRCode() {
    const urlParams = new URLSearchParams(window.location.search);
    let text = urlParams.get('text') || 'options.html';
    chrome.storage.local.get([
        'enablePhoneNumberDetection',
        'enableVCardGeneration',
        'enableNewContactFormat',
        'enableAutoClose'
    ], (result) => {
        const settings = {
            enablePhoneNumberDetection: result.enablePhoneNumberDetection !== false,
            enableVCardGeneration: result.enableVCardGeneration !== false,
            enableNewContactFormat: result.enableNewContactFormat !== false,
            enableAutoClose: result.enableAutoClose !== false
        };
        
        const qrText = processInputText(text, settings);
        document.getElementById('url').value = qrText;
        
        const qrcodeElement = document.getElementById('qrcode');
        new QRCode(qrcodeElement, {
            text: qrText,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // 修复：双击二维码也使用弹窗形式
        qrcodeElement.addEventListener('dblclick', goToAdmirePage);
        
        if (settings.enableAutoClose) {
            window.addEventListener('blur', function() {
                setTimeout(window.close, 300);
            });
        }
    });
}

/**
 * 处理输入文本
 */
function processInputText(inputText, settings) {
    // 新增：处理特定格式的18位数字
    // 匹配194开头的18位数字格式，可能后面跟着"分钟：X单"或其他内容
const optimizedPattern = /^(?:(?:\d{18}40$)|(?=.*分钟：\d+单)[194]\d{17}.*)$/;
const match = inputText.match(optimizedPattern);
if (match) {
    // 提取前18位数字
    const numbersMatch = inputText.match(/^([194]\d{17})/);
    return numbersMatch ? numbersMatch[1] : null;
}
    
    // 手机号码检测
    if (settings.enablePhoneNumberDetection && /^1\d{10}$/.test(inputText)) {
        return `tel:${inputText}`;
    }
    
    // VCard格式处理
    if (settings.enableVCardGeneration) {
        const namePhonePattern = /([\u4e00-\u9fa5]+)[(（](1\d{10})[)）]/;
        const matchResult = inputText.match(namePhonePattern);
        if (matchResult && matchResult.length === 3) {
            const [_, name, phone] = matchResult;
            return `BEGIN:VCARD
VERSION:3.0
N:${name}
FN:${name}
TEL;TYPE=CELL:${phone}
END:VCARD`;
        }
    }
    
    // 新联系人格式处理
    if (settings.enableNewContactFormat) {
        const newContactPattern = /([\u4e00-\u9fa5]+)\s+(1\d{10})/;
        const matchResult = inputText.match(newContactPattern);
        if (matchResult && matchResult.length === 3) {
            const [_, name, phone] = matchResult;
            return `BEGIN:VCARD
VERSION:3.0
N:${name}
FN:${name}
TEL;TYPE=CELL:${phone}
END:VCARD`;
        }
    }
    
    return inputText;
}