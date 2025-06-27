/**
 * 当DOM加载完成后执行初始化函数
 * 根据当前页面类型初始化不同功能
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化设置页面功能
    initSettingsPage();
    // 初始化赞赏页面功能
    initAdmirePage();
    // 初始化二维码页面功能
    initQRCodePage();
});

/**
 * 初始化设置页面
 * 包含设置加载、保存按钮和标题交互效果
 */
function initSettingsPage() {
    // 检查当前是否为设置页面
    if (window.location.pathname.includes('options.html')) {
        // 加载已保存的设置
        loadSettings();
        // 设置保存按钮事件
        setupSaveButton();
        
        // 获取标题元素并添加交互效果
        const title = document.querySelector('h1');
        if (title) {
            // 鼠标悬停时显示赞赏提示
            title.addEventListener('mouseover', function() {
                this.textContent = '👉🏻 赞赏 👈🏻';
                this.style.color = 'red';
                this.addEventListener('click', goToAdmirePage);
            });
            
            // 鼠标移出时恢复设置标题
            title.addEventListener('mouseout', function() {
                this.textContent = '👉🏻 设置 👈🏻';
                this.style.color = '#333';
                this.removeEventListener('click', goToAdmirePage);
            });
        }
    }
}

/**
 * 初始化赞赏页面
 * 设置自动关闭和双击关闭功能
 */
function initAdmirePage() {
    // 在指定页面设置自动关闭功能
    if (['/admire.html', '/popup.html', '/options.html'].includes(window.location.pathname)) {
        setupAutoCloseForAdmirer();
    }
    
    // 赞赏页面添加双击关闭功能
    if (window.location.pathname.includes('admire.html')) {
        document.addEventListener('dblclick', closeWindowOnClick);
    }
}

/**
 * 设置页面自动关闭功能
 * 当窗口失去焦点时自动关闭
 */
function setupAutoCloseForAdmirer() {
    // 从存储中获取自动关闭设置
    chrome.storage.local.get(['enableAutoClose'], (result) => {
        // 如果启用自动关闭或未设置(默认启用)
        if (result.enableAutoClose !== false) {
            // 窗口失去焦点时关闭
            window.addEventListener('blur', function() {
                setTimeout(window.close, 30); // 300ms延迟关闭
            });
        }
    });
}

/**
 * 初始化二维码页面
 * 检查URL参数并设置二维码
 */
function initQRCodePage() {
    const urlParams = new URLSearchParams(window.location.search);
    // 检查URL中是否有text参数
    if (urlParams.has('text')) {
        // 如果有text参数则生成二维码
        setupQRCode();
    }
}

/**
 * 设置保存按钮功能
 * 收集所有设置并保存到chrome.storage
 */
function setupSaveButton() {
    document.getElementById('saveSettings').addEventListener('click', () => {
        // 收集所有设置项
        const settings = {
            enablePhoneNumberDetection: document.getElementById('enablePhoneNumberDetection').checked,
            enableVCardGeneration: document.getElementById('enableVCardGeneration').checked,
            enableNewContactFormat: document.getElementById('enableNewContactFormat').checked,
            enableAutoClose: document.getElementById('enableAutoClose').checked,
            popupWidth: parseInt(document.getElementById('popupWidth').value) || 300,
            popupHeight: parseInt(document.getElementById('popupHeight').value) || 400
        };
        
        // 保存设置到chrome.storage
        chrome.storage.local.set(settings, () => {
            // 显示保存成功提示
            showSaveAlert();
        });
    });
}

/**
 * 显示保存成功提示
 * 创建一个临时提示元素并在2秒后消失
 */
function showSaveAlert() {
    // 创建提示元素
    const alertDiv = document.createElement('div');
    
    // 设置提示样式
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
    
    // 添加到页面
    document.body.appendChild(alertDiv);
    
    // 2秒后移除提示并关闭窗口
    setTimeout(() => {
        document.body.removeChild(alertDiv);
        window.close();
    }, 2000);
}

/**
 * 加载设置
 * 从chrome.storage中读取设置并应用到页面
 */
function loadSettings() {
    // 所有设置项的key
    const settingsKeys = [
        'enablePhoneNumberDetection',
        'enableVCardGeneration',
        'enableNewContactFormat',
        'enableAutoClose',
        'popupWidth',
        'popupHeight'
    ];
    
    // 从存储中获取设置
    chrome.storage.local.get(settingsKeys, (result) => {
        settingsKeys.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                // 处理数字输入框
                if (key === 'popupWidth' || key === 'popupHeight') {
                    element.value = result[key] || (key === 'popupWidth' ? 300 : 400);
                } 
                // 处理复选框
                else {
                    element.checked = result[key] !== false;
                }
            }
        });
    });
}

/**
 * 跳转到赞赏页面
 */
function goToAdmirePage() {
    window.location.href = 'admire.html';
}

/**
 * 关闭当前窗口
 */
function closeWindowOnClick() {
    window.close();
}

/**
 * 设置二维码页面
 * 生成并显示二维码
 */
function setupQRCode() {
    // 获取URL中的text参数
    const urlParams = new URLSearchParams(window.location.search);
    let text = urlParams.get('text') || 'options.html';
    // 获取相关设置
    chrome.storage.local.get([
        'enablePhoneNumberDetection',
        'enableVCardGeneration',
        'enableNewContactFormat',
        'enableAutoClose'
    ], (result) => {
        // 处理设置默认值
        const settings = {
            enablePhoneNumberDetection: result.enablePhoneNumberDetection !== false,
            enableVCardGeneration: result.enableVCardGeneration !== false,
            enableNewContactFormat: result.enableNewContactFormat !== false,
            enableAutoClose: result.enableAutoClose !== false
        };
        
        // 处理输入文本生成二维码内容
        const qrText = processInputText(text, settings);
        
        // 显示处理后的文本
        document.getElementById('url').value = qrText;
        
        // 生成二维码
        const qrcodeElement = document.getElementById('qrcode');
        new QRCode(qrcodeElement, {
            text: qrText,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // 双击二维码跳转到设置页面
        qrcodeElement.addEventListener('dblclick', () => {
            window.location.href = chrome.runtime.getURL('options.html');
        });
        
        // 如果启用自动关闭，设置失去焦点关闭
        if (settings.enableAutoClose) {
            window.addEventListener('blur', function() {
                setTimeout(window.close, 300);
            });
        }
    });
}

/**
 * 处理输入文本
 * 根据设置将输入文本转换为合适的二维码内容
 * @param {string} inputText 输入的文本
 * @param {object} settings 用户设置
 * @return {string} 处理后的二维码内容
 */
function processInputText(inputText, settings) {

// 新增逻辑：匹配“数字分钟：X单”格式或20位数字且尾号为40，并提取前18位
const minutePattern = /^([194]\d{19})(?:分钟：\d+单)?$/;
const matchResult = inputText.match(minutePattern);
if (matchResult && matchResult[1] && (matchResult[0].endsWith('40') || matchResult[0].includes('分钟：'))) {
    return matchResult[1].slice(0, 18); // 提取前18位
}
    // 处理手机号格式
    if (settings.enablePhoneNumberDetection && /^1\d{10}$/.test(inputText)) {
        return `tel:${inputText}`; // 返回电话链接格式
    }
    
    // 处理"姓名(电话)"格式
    if (settings.enableVCardGeneration) {
        const namePhonePattern = /([\u4e00-\u9fa5]+)[(（](1\d{10})[)）]/;
        const matchResult = inputText.match(namePhonePattern);
        if (matchResult && matchResult.length === 3) {
            const [_, name, phone] = matchResult;
            // 返回vCard格式
            return `BEGIN:VCARD
VERSION:3.0
N:${name}
FN:${name}
TEL;TYPE=CELL:${phone}
END:VCARD`;
        }
    }
    
    // 处理"姓名 电话"格式
    if (settings.enableNewContactFormat) {
        const newContactPattern = /([\u4e00-\u9fa5]+)\s+(1\d{10})/;
        const matchResult = inputText.match(newContactPattern);
        if (matchResult && matchResult.length === 3) {
            const [_, name, phone] = matchResult;
            // 返回vCard格式
            return `BEGIN:VCARD
VERSION:3.0
N:${name}
FN:${name}
TEL;TYPE=CELL:${phone}
END:VCARD`;
        }
    }
    
    // 默认返回原始文本
    return inputText;
}
/*         // 新增逻辑：匹配“数字分钟：X单”格式并提取前18位
    const minutePattern = /^(\d{20})分钟：\d+单$/;
    const matchResult = inputText.match(minutePattern);
    if (matchResult && matchResult[1]) {
        return matchResult[1].slice(0, 18); // 提取前18位
    }
    // 新增逻辑：判断是否为20位数字且尾号为40
    if (/^\d{20}$/.test(inputText) && inputText.endsWith('40')) {
        return inputText.slice(0, 18); // 仅返回前18位
    }*/
