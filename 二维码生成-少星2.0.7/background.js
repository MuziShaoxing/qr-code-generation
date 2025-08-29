// 插件安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({id: "generateQRCode", title: "文本二维码", contexts: ["selection"]});
    chrome.contextMenus.create({id: "generateAudioQRCode", title: "音频二维码", contexts: ["audio"]});
    chrome.contextMenus.create({id: "generateLinkQRCode", title: "链接二维码", contexts: ["link"]});
    chrome.contextMenus.create({id: "generateImageQRCode", title: "图片二维码", contexts: ["image"]});
    chrome.contextMenus.create({id: "generatePageQRCode", title: "页面二维码", contexts: ["page"]});
});

// 创建二维码弹窗的通用函数
async function createQRPopup(content) {
    const width = 300;
    const height = 400;
    
    try {
        // 获取当前屏幕信息
        const displays = await chrome.system.display.getInfo();
        const currentScreen = displays[0];
        
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

// 获取页面实际内容的函数
async function getActualPageContent(tab, frameId = 0) {
    return new Promise((resolve) => {
        // 向内容脚本发送消息获取页面实际内容
        chrome.tabs.sendMessage(tab.id, {action: "getPageContent"}, {frameId: frameId}, (response) => {
            if (chrome.runtime.lastError || !response) {
                // 如果内容脚本没有响应，使用标签页URL作为备选
                console.warn("内容脚本未响应，使用标签页URL");
                resolve(tab.url);
                return;
            }
            
            // 记录调试信息
            console.log("页面内容响应:", response);
            
            // 优先使用最终URL、规范链接或Open Graph URL
            let content = response.finalUrl || response.canonical || response.ogUrl || tab.url;
            
            // 检查获取的URL是否有效
            try {
                const url = new URL(content);
                resolve(url.href);
            } catch (e) {
                console.warn("获取的URL无效，使用标签页URL:", e);
                resolve(tab.url);
            }
        });
        
        // 设置超时，防止内容脚本无响应
        setTimeout(() => {
            resolve(tab.url);
        }, 1000);
    });
}

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    let content = null;
    
    switch (info.menuItemId) {
        case "generateQRCode": 
            content = info.selectionText; 
            break;
        case "generateLinkQRCode": 
            content = info.linkUrl; 
            break;
        case "generateAudioQRCode": 
            content = info.srcUrl; 
            break;
        case "generateImageQRCode": 
            content = info.srcUrl; 
            break;
        case "generatePageQRCode": 
            // 特殊处理页面二维码，获取实际内容
            // 使用框架ID确保获取正确框架的内容
            const frameId = info.frameId || 0;
            content = await getActualPageContent(tab, frameId);
            break;
        default:
            const contentSource = ["linkUrl", "selectionText", "srcUrl", "frameUrl", "pageUrl"]
                .find(source => info[source]);
            content = info[contentSource];
    }

    if (content) {
        createQRPopup(content);
    } else {
        // 显示错误提示
        try {
            await chrome.notifications.create({
                type: "basic",
                iconUrl: "icons/icon48.png",
                title: "二维码生成器",
                message: "请选择要生成二维码的有效内容。"
            });
        } catch (error) {
            console.error("无法显示通知:", error);
        }
    }
});

// 监听页面导航完成事件，记录最终URL
chrome.webNavigation.onCompleted.addListener((details) => {
    console.log("页面导航完成:", details);
}, {
    url: [{urlMatches: '.*'}]
});