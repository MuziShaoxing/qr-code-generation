// 向背景脚本发送消息，传递屏幕宽高和选中文本
chrome.runtime.sendMessage({
    action: "getScreenSize", // 消息类型
    screenWidth: window.screen.width, // 屏幕宽度
    screenHeight: window.screen.height, // 屏幕高度
    selectedText: window.getSelection().toString() // 选中文本
});