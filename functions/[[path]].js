// 通配符路由：为所有HTML页面注入随机背景脚本
export async function onRequest(context) {
    const { request, next, env } = context;
    
    // 获取原始响应
    const response = await next();
    
    // 只处理HTML页面
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
        return response;
    }
    
    // 使用 HTMLRewriter 注入脚本
    return new HTMLRewriter()
        .on('body', {
            element(element) {
                // 在 body 开始标签后注入背景容器
                element.prepend(`<div id="random-background-container"></div>`, { html: true });
            }
        })
        .on('head', {
            element(element) {
                // 在 head 中注入样式
                element.append(`
<style>
/* 随机背景容器样式 */
#random-background-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
    background-color: #f5f5f5;
}

.random-bg-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0;
    transition: opacity 1s ease-in-out;
}

.random-bg-layer.active {
    opacity: 1;
}

#app {
    position: relative;
    z-index: 1;
}
</style>
                `, { html: true });
            }
        })
        .on('body', {
            element(element) {
                // 在 body 结束标签前注入脚本
                element.append(`
<script>
(function() {
    async function loadRandomBackground() {
        try {
            const response = await fetch('/api/manage/sysConfig/page');
            if (!response.ok) return;
            
            const data = await response.json();
            const config = data.config || [];
            
            const apiUrlConfig = config.find(item => item.id === 'randomBkApiUrl');
            const apiTypeConfig = config.find(item => item.id === 'randomBkApiType');
            const jsonPathConfig = config.find(item => item.id === 'randomBkJsonPath');
            const intervalConfig = config.find(item => item.id === 'bkInterval');
            const opacityConfig = config.find(item => item.id === 'bkOpacity');
            const changeOnNavConfig = config.find(item => item.id === 'randomBkChangeOnNav');
            
            const apiUrl = apiUrlConfig?.value;
            if (!apiUrl) return;
            
            const apiType = apiTypeConfig?.value || 'text';
            const jsonPath = jsonPathConfig?.value || 'url';
            const interval = parseInt(intervalConfig?.value) || 3000;
            const opacity = parseFloat(opacityConfig?.value) || 1;
            const changeOnNav = changeOnNavConfig?.value !== false;
            
            const container = document.getElementById('random-background-container');
            if (!container) return;
            
            container.style.opacity = opacity;
            
            let currentIndex = 0;
            
            async function loadImage() {
                try {
                    let imageUrl;
                    
                    if (apiType === 'json') {
                        const imgResponse = await fetch(apiUrl);
                        const imgData = await imgResponse.json();
                        const pathParts = jsonPath.split('.');
                        imageUrl = pathParts.reduce((obj, key) => obj?.[key], imgData);
                    } else if (apiType === 'text') {
                        const imgResponse = await fetch(apiUrl);
                        const textData = await imgResponse.text();
                        const urlMatch = textData.match(/https?:\\\\/\\\\/[^\\\\s<>"]+\\\\.(jpg|jpeg|png|gif|webp|bmp)/i);
                        imageUrl = urlMatch ? urlMatch[0] : textData.trim().split('\\\\n').pop().trim();
                    } else {
                        imageUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
                    }
                    
                    if (!imageUrl) return;
                    
                    const newBg = document.createElement('div');
                    newBg.className = 'random-bg-layer';
                    newBg.style.backgroundImage = \`url(\${imageUrl})\`;
                    newBg.style.zIndex = currentIndex;
                    
                    const img = new Image();
                    img.onload = function() {
                        container.appendChild(newBg);
                        setTimeout(() => newBg.classList.add('active'), 50);
                        setTimeout(() => {
                            container.querySelectorAll('.random-bg-layer:not(.active)').forEach(layer => layer.remove());
                        }, 1000);
                        currentIndex++;
                    };
                    img.onerror = function() {
                        console.error('Failed to load background:', imageUrl);
                    };
                    img.src = imageUrl;
                } catch (error) {
                    console.error('Failed to load random background:', error);
                }
            }
            
            loadImage();
            
            if (interval > 0) {
                setInterval(loadImage, interval);
            }
            
            if (changeOnNav) {
                let lastPath = window.location.pathname + window.location.hash;
                const checkRouteChange = () => {
                    const currentPath = window.location.pathname + window.location.hash;
                    if (currentPath !== lastPath) {
                        lastPath = currentPath;
                        loadImage();
                    }
                };
                
                const appElement = document.getElementById('app');
                if (appElement) {
                    new MutationObserver(checkRouteChange).observe(appElement, {
                        childList: true,
                        subtree: true
                    });
                }
                
                window.addEventListener('popstate', loadImage);
                window.addEventListener('hashchange', loadImage);
            }
        } catch (error) {
            console.error('Failed to initialize random background:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadRandomBackground);
    } else {
        loadRandomBackground();
    }
})();
</script>
                `, { html: true });
            }
        })
        .transform(response);
}
