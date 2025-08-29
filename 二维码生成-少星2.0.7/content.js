// content.js - 获取页面实际内容信息
(function() {
    // 监听来自后台脚本的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getPageContent") {
            // 获取页面实际内容信息
            const pageInfo = getPageContentInfo();
            sendResponse(pageInfo);
        }
        return true; // 保持消息通道开放以支持异步响应
    });

    /**
     * 获取页面内容信息
     */
    function getPageContentInfo() {
        // 获取当前框架的最终URL
        const finalUrl = getFinalUrl();
        
        // 尝试获取页面的规范链接
        let canonicalLink = null;
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && canonical.href) {
            canonicalLink = canonical.href;
        }
        
        // 获取Open Graph URL（如果存在）
        let ogUrl = null;
        const ogUrlMeta = document.querySelector('meta[property="og:url"]');
        if (ogUrlMeta && ogUrlMeta.content) {
            ogUrl = ogUrlMeta.content;
        }
        
        // 获取页面标题
        const pageTitle = document.title || '';
        
        // 返回页面信息
        return {
            url: window.location.href,
            finalUrl: finalUrl,
            canonical: canonicalLink,
            ogUrl: ogUrl,
            title: pageTitle,
            isTopFrame: window === window.top,
            frameId: getFrameId(),
            timestamp: Date.now()
        };
    }
    
    /**
     * 获取当前框架的最终URL（处理重定向后的URL）
     */
    function getFinalUrl() {
        // 如果是顶层框架，直接使用location.href
        if (window === window.top) {
            return window.location.href;
        }
        
        // 对于iframe，尝试获取最终内容URL
        try {
            // 检查是否有重定向或中间页面的迹象
            const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
            if (metaRefresh && metaRefresh.content) {
                const content = metaRefresh.content;
                const urlMatch = content.match(/url=(.*)/i);
                if (urlMatch && urlMatch[1]) {
                    return urlMatch[1].trim();
                }
            }
            
            // 检查是否有JavaScript重定向
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const text = script.textContent || script.innerText;
                if (text.includes('window.location') || text.includes('document.location')) {
                    const redirectMatch = text.match(/(window|document)\.location\s*=\s*["']([^"']+)["']/);
                    if (redirectMatch && redirectMatch[2]) {
                        return redirectMatch[2];
                    }
                }
            }
            
            // 如果没有重定向迹象，返回当前URL
            return window.location.href;
        } catch (e) {
            console.warn("获取最终URL失败:", e);
            return window.location.href;
        }
    }
    
    /**
     * 获取框架ID（用于标识当前框架）
     */
    function getFrameId() {
        try {
            // 尝试获取框架的唯一标识符
            if (window !== window.top) {
                // 对于iframe，尝试找到其在父文档中的索引
                const frames = window.parent.document.getElementsByTagName('iframe');
                for (let i = 0; i < frames.length; i++) {
                    try {
                        if (frames[i].contentWindow === window) {
                            return `frame-${i}`;
                        }
                    } catch (e) {
                        // 跨域限制，无法访问contentWindow
                        continue;
                    }
                }
            }
            return window === window.top ? 'top' : 'unknown';
        } catch (e) {
            return 'error';
        }
    }
    
    // 导出函数供其他脚本使用（如果需要）
    window.getPageContentInfo = getPageContentInfo;
})();