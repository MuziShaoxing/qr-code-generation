// 初始化屏幕宽高
let screenWidth = 1920;
let screenHeight = 1080;

// 监听屏幕尺寸更新消息
chrome.runtime.onMessage.addListener((message) => {
    // 检查消息的action是否为getScreenSize
    if (message.action === "getScreenSize") {
        // 更新屏幕宽度
        screenWidth = message.screenWidth;
        // 更新屏幕高度
        screenHeight = message.screenHeight;
    }
    return true;
});

// 插件安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    // 创建文本二维码右键菜单项
    chrome.contextMenus.create({id: "generateQRCode", title: "文本二维码", contexts: ["selection"]});
    // 创建音频二维码右键菜单项
    chrome.contextMenus.create({id: "generateAudioQRCode", title: "音频二维码", contexts: ["audio"]});
    // 创建链接二维码右键菜单项
    chrome.contextMenus.create({id: "generateLinkQRCode", title: "链接二维码", contexts: ["link"]});
    // 创建图片二维码右键菜单项
    chrome.contextMenus.create({id: "generateImageQRCode", title: "图片二维码", contexts: ["image"]});
    // 新增页面二维码菜单项
    chrome.contextMenus.create({id: "generatePageQRCode", title: "页面二维码", contexts: ["page"]});
});

// 创建二维码弹窗的通用函数
function createQRPopup(content, width, height, left, top) {
    // 创建一个新的弹出窗口，传递二维码内容和窗口位置信息
    chrome.windows.create({
        type: "popup",
        url: `popup.html?text=${encodeURIComponent(content)}`,
        width,
        height,
        top,
        left,
        focused: true
    });
}

/**
 * 处理右键菜单点击事件
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // 从本地存储获取用户自定义的弹窗尺寸设置
    chrome.storage.local.get(['popupWidth', 'popupHeight'], (result) => {
        // 解析弹窗宽度，若无设置则使用默认值300
        const popupWidth = parseInt(result.popupWidth, 10) || 300;
        // 解析弹窗高度，若无设置则使用默认值400
        const popupHeight = parseInt(result.popupHeight, 10) || 400;
        
        // 计算弹窗居中显示的位置
        const left = Math.floor((screenWidth - popupWidth) / 2);  // 水平居中
        const top = Math.floor((screenHeight - popupHeight) / 2); // 垂直居中

        let content = null;
        
        // 根据菜单项类型选择内容来源
        switch (info.menuItemId) {
            case "generateQRCode": // 文本二维码
                content = info.selectionText; // 只使用选中的文本
                break;
            case "generateLinkQRCode": // 链接二维码
                content = info.linkUrl; // 使用链接URL
                break;
            case "generateAudioQRCode": // 音频二维码
                content = info.srcUrl; // 使用音频源URL
                break;
            case "generateImageQRCode": // 图片二维码
                content = info.srcUrl; // 使用图片源URL
                break;
            case "generatePageQRCode": // 页面二维码
                content = tab.url; // 使用当前页面URL
                break;
            default:
                // 其他情况保持原逻辑
                const contentSource = ["linkUrl", "selectionText", "srcUrl", "frameUrl", "pageUrl"]
                    .find(source => info[source]);
                content = info[contentSource];
        }

        if (content) {
            // 若有有效内容，创建二维码弹窗
            createQRPopup(content, popupWidth, popupHeight, left, top);
        } else {
            // 没有有效内容时显示提示
            alert("请选择要生成二维码的有效内容。");
        }
    });
});

/**
 * 创建二维码窗口
 * @param {string} content 二维码内容
 * @param {number} width 窗口宽度
 * @param {number} height 窗口高度
 * @param {number} left 窗口左侧位置
 * @param {number} top 窗口顶部位置
 */
function createQRWindow(content, width, height, left, top) {
    // 创建二维码生成弹窗
    chrome.windows.create({
        type: "popup",  // 弹出窗口类型
        url: `popup.html?text=${encodeURIComponent(content)}`, // 传递内容参数
        width: width,   // 设置窗口宽度
        height: height, // 设置窗口高度
        top: top,       // 窗口顶部位置
        left: left,     // 窗口左侧位置
        focused: true   // 自动聚焦新窗口
    });
}