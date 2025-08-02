// 移除默认屏幕尺寸变量
// 监听屏幕尺寸更新消息 - 移除这部分功能
// chrome.runtime.onMessage.addListener((message) => {
//     if (message.action === "getScreenSize") {
//         screenWidth = message.screenWidth;
//         screenHeight = message.screenHeight;
//     }
//     return true;
// });

// 插件安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({id: "generateQRCode", title: "文本二维码", contexts: ["selection"]});
    chrome.contextMenus.create({id: "generateAudioQRCode", title: "音频二维码", contexts: ["audio"]});
    chrome.contextMenus.create({id: "generateLinkQRCode", title: "链接二维码", contexts: ["link"]});
    chrome.contextMenus.create({id: "generateImageQRCode", title: "图片二维码", contexts: ["image"]});
    chrome.contextMenus.create({id: "generatePageQRCode", title: "页面二维码", contexts: ["page"]});
});

// 创建二维码弹窗的通用函数
async function createQRPopup(content, width, height) {
    try {
        // 获取当前屏幕信息
        const displays = await chrome.system.display.getInfo();
        const currentScreen = displays[0]; // 默认使用主屏幕
        
        // 计算居中位置
        const left = Math.floor(currentScreen.bounds.left + (currentScreen.bounds.width - width) / 2);
        const top = Math.floor(currentScreen.bounds.top + (currentScreen.bounds.height - height) / 2);

        // 创建弹窗
        chrome.windows.create({
            type: "popup",
            url: `popup.html?text=${encodeURIComponent(content)}`,
            width,
            height,
            top,
            left,
            focused: true
        });
    } catch (error) {
        console.error("获取屏幕信息失败:", error);
        // 出错时使用默认位置
        chrome.windows.create({
            type: "popup",
            url: `popup.html?text=${encodeURIComponent(content)}`,
            width,
            height,
            focused: true
        });
    }
}

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.storage.local.get(['popupWidth', 'popupHeight'], (result) => {
        const popupWidth = parseInt(result.popupWidth, 10) || 300;
        const popupHeight = parseInt(result.popupHeight, 10) || 400;
        
        let content = null;
        
        switch (info.menuItemId) {
            case "generateQRCode": content = info.selectionText; break;
            case "generateLinkQRCode": content = info.linkUrl; break;
            case "generateAudioQRCode": content = info.srcUrl; break;
            case "generateImageQRCode": content = info.srcUrl; break;
            case "generatePageQRCode": content = tab.url; break;
            default:
                const contentSource = ["linkUrl", "selectionText", "srcUrl", "frameUrl", "pageUrl"]
                    .find(source => info[source]);
                content = info[contentSource];
        }

        if (content) {
            createQRPopup(content, popupWidth, popupHeight);
        } else {
            alert("请选择要生成二维码的有效内容。");
        }
    });
});