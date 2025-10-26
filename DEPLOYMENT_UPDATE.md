# 🔧 部署更新说明 - 修复中间件问题

## 问题分析

根据你的部署日志，Cloudflare Pages 已成功部署，但 `_middleware.js` 对静态 HTML 文件不起作用。

## 新的解决方案

我创建了 `functions/[[path]].js` - 这是一个**通配符路由**，会拦截所有请求并使用 **HTMLRewriter API** 动态注入背景脚本。

### 为什么这个方案更好？

1. ✅ **HTMLRewriter** 是 Cloudflare Workers 的原生 API，专门用于修改 HTML
2. ✅ **通配符路由** `[[path]]` 会匹配所有路径
3. ✅ 不依赖文件系统，直接在响应流中注入代码
4. ✅ 性能更好，内存占用更小

## 部署步骤

### 步骤 1: 提交新代码

```bash
# 添加新文件
git add "functions/[[path]].js"

# 提交
git commit -m "修复：使用 HTMLRewriter 注入随机背景"

# 推送
git push
```

### 步骤 2: 等待部署

- Cloudflare Pages 会自动检测并部署
- 等待 1-2 分钟

### 步骤 3: 强制刷新

部署完成后：
1. 访问你的网站
2. 按 **Ctrl + Shift + R**（Windows）或 **Cmd + Shift + R**（Mac）强制刷新
3. 清除浏览器缓存（可选）

### 步骤 4: 验证

打开浏览器控制台（F12），输入：
```javascript
document.getElementById('random-background-container')
```

如果返回一个 DOM 元素，说明注入成功！

## 诊断工具

访问：`https://你的域名/static/debug-background.html`

这个工具会自动检测所有配置和状态。

## 如果还是不行

### 方案 A: 检查 Functions 路由优先级

在 Cloudflare Pages 控制台：
1. 进入你的项目
2. 点击 **Settings** -> **Functions**
3. 确认 Functions 已启用

### 方案 B: 使用 wrangler.toml 配置

创建 `wrangler.toml` 文件：

```toml
name = "cloudflare-imgbed"
compatibility_date = "2024-01-01"

[site]
bucket = "./"

[[routes]]
pattern = "*"
custom_domain = true
```

然后重新部署。

### 方案 C: 手动修改编译后的文件

如果上述方案都不行，可以直接修改前端源码：

1. Fork 前端项目：https://github.com/MarSeventh/Sanyue-ImgHub
2. 在 `public/index.html` 中添加背景容器和脚本
3. 重新编译并替换 `index.html`

## 预期效果

部署成功后，你应该能看到：

✅ 页面加载时显示随机背景
✅ 每 3 秒自动切换背景
✅ 切换页面（上传、管理等）时加载新背景
✅ 平滑的淡入淡出动画效果

## 常见问题

### Q: 为什么删除了 _middleware.js？

A: `_middleware.js` 在 Cloudflare Pages 中对静态资产不起作用。`[[path]].js` 是更可靠的方案。

### Q: [[path]].js 是什么？

A: 这是 Cloudflare Pages Functions 的通配符路由语法，`[[path]]` 会匹配所有路径，包括 `/`、`/admin`、`/upload` 等。

### Q: 会影响性能吗？

A: HTMLRewriter 是流式处理，性能影响极小（< 1ms）。

### Q: 如果我不想要随机背景了怎么办？

A: 在管理端将 `随机背景图API` 清空即可，脚本会自动跳过加载。

## 技术细节

### HTMLRewriter 工作原理

```javascript
new HTMLRewriter()
    .on('body', { element(element) {
        // 在 <body> 后注入容器
        element.prepend('<div id="random-background-container"></div>');
    }})
    .on('head', { element(element) {
        // 在 <head> 中注入样式
        element.append('<style>...</style>');
    }})
    .transform(response);
```

这种方式：
- 不需要读取整个 HTML 到内存
- 流式处理，边读边写
- 性能优秀，适合生产环境

## 下一步

1. 提交代码：`git push`
2. 等待部署完成
3. 强制刷新页面
4. 访问诊断工具验证

如果还有问题，请提供：
- 浏览器控制台的错误信息
- Network 标签中的请求响应
- 诊断工具的测试结果
