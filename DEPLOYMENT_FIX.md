# Cloudflare Pages 部署修复说明

## 问题原因

由于 Cloudflare Pages 使用的是编译后的前端静态文件，直接修改 `index.html` 不会生效。我们需要通过 Cloudflare Functions 中间件来动态注入背景脚本。

## 解决方案

已创建 `functions/_middleware.js` 文件，该中间件会：
1. 拦截所有 HTML 页面请求
2. 动态注入随机背景容器和脚本
3. 自动应用到所有页面（上传、管理、用户管理等）

## 部署步骤

### 方式一：Cloudflare Pages 自动部署

1. **提交代码到 Git 仓库**
   ```bash
   git add functions/_middleware.js
   git add functions/api/manage/sysConfig/page.js
   git commit -m "添加随机背景功能"
   git push
   ```

2. **Cloudflare Pages 自动构建**
   - Cloudflare Pages 会自动检测到新的 Functions 文件
   - 等待部署完成（通常 1-2 分钟）

3. **配置随机背景**
   - 访问管理端：`https://你的域名/admin`
   - 进入 **系统设置 -> 页面设置 -> 全局设置**
   - 配置项已有默认值，直接点击**保存**即可

4. **刷新页面查看效果**
   - 刷新前端页面
   - 应该能看到随机背景了

### 方式二：本地测试

1. **启动本地开发服务器**
   ```bash
   npm install
   npm start
   ```

2. **访问本地地址**
   ```
   http://localhost:8080
   ```

3. **配置并测试**
   - 进入管理端配置随机背景
   - 刷新页面查看效果

## 验证步骤

### 1. 检查中间件是否生效

打开浏览器开发者工具（F12），在 Console 中输入：
```javascript
document.getElementById('random-background-container')
```

如果返回一个 DOM 元素（不是 `null`），说明中间件已生效。

### 2. 检查配置是否正确

在 Console 中输入：
```javascript
fetch('/api/manage/sysConfig/page')
  .then(r => r.json())
  .then(d => {
    const config = d.config || [];
    const apiUrl = config.find(item => item.id === 'randomBkApiUrl');
    const apiType = config.find(item => item.id === 'randomBkApiType');
    console.log('API URL:', apiUrl?.value);
    console.log('API Type:', apiType?.value);
  })
```

应该看到：
```
API URL: https://t.alcy.cc/ycy?json
API Type: text
```

### 3. 检查 API 是否可访问

在 Console 中输入：
```javascript
fetch('https://t.alcy.cc/ycy?json')
  .then(r => r.text())
  .then(d => console.log('API Response:', d))
```

应该看到返回的图片 URL。

### 4. 手动触发背景加载

在 Console 中输入：
```javascript
// 手动加载一张背景
fetch('https://t.alcy.cc/ycy?json')
  .then(r => r.text())
  .then(text => {
    const urlMatch = text.match(/https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp|bmp)/i);
    const imageUrl = urlMatch ? urlMatch[0] : text.trim().split('\n').pop().trim();
    console.log('Extracted URL:', imageUrl);
    
    const container = document.getElementById('random-background-container');
    const bg = document.createElement('div');
    bg.className = 'random-bg-layer active';
    bg.style.backgroundImage = `url(${imageUrl})`;
    container.appendChild(bg);
  })
```

如果背景出现，说明功能正常。

## 常见问题排查

### Q1: 中间件没有生效（找不到 random-background-container）

**可能原因**：
- Cloudflare Pages 还未部署最新代码
- 浏览器缓存了旧版本

**解决方法**：
1. 检查 Cloudflare Pages 部署日志，确认最新提交已部署
2. 强制刷新页面（Ctrl + Shift + R 或 Cmd + Shift + R）
3. 清除浏览器缓存

### Q2: 配置保存后没有效果

**可能原因**：
- KV 数据库未正确绑定
- 配置未保存成功

**解决方法**：
1. 检查 Cloudflare Pages 设置，确认 KV 已绑定
2. 在管理端重新保存配置
3. 检查浏览器 Network 标签，查看保存请求是否成功

### Q3: 背景显示但不切换

**可能原因**：
- 背景切换间隔设置为 0
- API 返回相同的图片

**解决方法**：
1. 检查 `bkInterval` 配置，确保 > 0
2. 在 Console 中手动测试 API，查看是否返回不同图片

### Q4: CORS 错误

**可能原因**：
- 第三方 API 不支持跨域请求

**解决方法**：
1. 检查 API 是否支持 CORS
2. 如果不支持，可以考虑使用 Cloudflare Workers 代理

### Q5: 图片加载失败

**可能原因**：
- API 返回的 URL 无效
- 网络问题

**解决方法**：
1. 在浏览器中直接访问提取的图片 URL
2. 检查 Console 中的错误信息
3. 尝试更换其他 API

## 高级配置

### 使用 Cloudflare Workers 代理 API（可选）

如果遇到 CORS 问题，可以创建一个代理：

创建 `functions/api/proxy/random-image.js`：
```javascript
export async function onRequest(context) {
    const { request } = context;
    
    try {
        const response = await fetch('https://t.alcy.cc/ycy?json');
        const text = await response.text();
        
        // 提取图片 URL
        const urlMatch = text.match(/https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp|bmp)/i);
        const imageUrl = urlMatch ? urlMatch[0] : text.trim().split('\n').pop().trim();
        
        return new Response(JSON.stringify({ url: imageUrl }), {
            headers: {
                'content-type': 'application/json',
                'access-control-allow-origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}
```

然后在管理端配置：
```
随机背景图API: /api/proxy/random-image
随机背景API类型: JSON格式
JSON图片路径: url
```

## 性能优化建议

1. **调整切换间隔**：建议设置为 5000ms 以上，减少 API 调用频率
2. **关闭页面切换更新**：如果不需要每次切换页面都换背景，可以关闭此选项
3. **使用 CDN**：确保图片 URL 使用 CDN 加速
4. **图片大小**：建议使用压缩过的图片（< 500KB）

## 完成

按照以上步骤操作后，你的 Cloudflare Pages 部署应该能正常显示随机背景了！

如果还有问题，请检查：
1. Cloudflare Pages 部署日志
2. 浏览器 Console 错误信息
3. Network 标签中的请求响应
