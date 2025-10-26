# 随机背景图功能使用指南

## 功能概述

本功能允许用户在管理端配置第三方随机图片 API，为前端网页添加动态随机背景图。支持多种 API 格式，包括直接返回图片和 JSON 格式。

## 配置步骤

### 1. 进入管理端

访问你的图床管理端，进入 **系统设置 -> 页面设置 -> 全局设置**

### 2. 配置随机背景 API

在全局设置中，你会看到以下三个新增配置项：

#### 2.1 随机背景图API
- **字段名**: `randomBkApiUrl`
- **说明**: 填写第三方随机图片 API 的完整地址
- **示例**: 
  - 直接返回图片: `https://t.alcy.cc/ycy`
  - JSON 格式: `https://t.alcy.cc/ycy?json`
- **留空**: 如果不填写，则不启用随机背景功能

#### 2.2 随机背景API类型
- **字段名**: `randomBkApiType`
- **选项**:
  - `direct` - 直接返回图片（默认）
  - `json` - JSON 格式
- **说明**: 
  - **直接返回图片**: API 直接返回图片文件（如 JPG、PNG）
  - **JSON格式**: API 返回包含图片 URL 的 JSON 数据

#### 2.3 JSON图片路径
- **字段名**: `randomBkJsonPath`
- **默认值**: `url`
- **说明**: 当 API 类型为 JSON 时，指定图片 URL 在 JSON 中的路径
- **示例**:
  - 简单路径: `url`（JSON 格式: `{"url": "https://..."}`）
  - 嵌套路径: `data.imgurl`（JSON 格式: `{"data": {"imgurl": "https://..."}}`）

### 3. 其他相关配置

#### 背景切换间隔
- **字段名**: `bkInterval`
- **默认值**: `3000`
- **单位**: 毫秒（ms）
- **说明**: 设置背景图自动切换的时间间隔，设置为 0 则不自动切换

#### 背景图透明度
- **字段名**: `bkOpacity`
- **默认值**: `1`
- **范围**: 0-1 之间的小数
- **说明**: 控制背景图的透明度，1 为完全不透明，0 为完全透明

## 常见 API 示例

### 示例 1: 直接返回图片
```
API地址: https://t.alcy.cc/ycy
API类型: 直接返回图片
```

### 示例 2: JSON 格式（单个链接）
```
API地址: https://t.alcy.cc/ycy?json
API类型: JSON格式
JSON图片路径: url

返回格式示例:
{
  "url": "https://example.com/image.jpg"
}
```

### 示例 3: JSON 格式（固定数量）
```
API地址: https://t.alcy.cc/ycy?json=6
API类型: JSON格式
JSON图片路径: url

说明: 每次请求返回 6 个图片链接中的一个
```

### 示例 4: JSON 格式（多个随机链接）
```
API地址: https://t.alcy.cc/ycy?json&quantity=20
API类型: JSON格式
JSON图片路径: url

说明: 每次请求返回 20 个随机链接中的一个
```

### 示例 5: 嵌套 JSON 格式
```
API地址: https://api.example.com/random
API类型: JSON格式
JSON图片路径: data.image.url

返回格式示例:
{
  "data": {
    "image": {
      "url": "https://example.com/image.jpg"
    }
  }
}
```

## 功能特性

### 1. 自动切换
- 根据配置的时间间隔自动切换背景图
- 支持平滑的淡入淡出过渡效果

### 2. 预加载
- 图片预加载机制，确保切换流畅
- 加载失败自动跳过，不影响用户体验

### 3. 性能优化
- 自动清理旧的背景层，避免内存占用
- 使用 CSS3 硬件加速，流畅的动画效果

### 4. 灵活配置
- 支持多种 API 格式
- 可自定义透明度和切换间隔
- 支持嵌套 JSON 路径解析

## 技术实现

### 前端实现
- 在 `index.html` 中添加了背景容器 `#random-background-container`
- JavaScript 脚本自动从 API 获取配置并加载背景图
- CSS 实现全屏背景和淡入淡出动画效果

### 后端实现
- 在 `functions/api/manage/sysConfig/page.js` 中添加了三个配置项
- 配置存储在 KV 数据库中
- 通过 `/api/manage/sysConfig/page` 接口获取配置

## 故障排查

### 背景不显示
1. 检查是否填写了 `randomBkApiUrl`
2. 确认 API 地址可访问
3. 检查浏览器控制台是否有错误信息
4. 验证 API 返回格式是否正确

### 背景切换不流畅
1. 检查网络连接速度
2. 适当增加 `bkInterval` 值
3. 确认图片大小合理（建议 < 2MB）

### JSON 格式解析失败
1. 确认 `randomBkApiType` 设置为 `json`
2. 检查 `randomBkJsonPath` 是否正确
3. 在浏览器中直接访问 API，查看返回的 JSON 结构

## 注意事项

1. **跨域问题**: 确保第三方 API 支持 CORS，否则可能无法加载
2. **API 限流**: 注意第三方 API 的调用频率限制
3. **图片大小**: 建议使用压缩过的图片，避免加载时间过长
4. **隐私安全**: 使用可信的第三方 API，避免加载恶意内容
5. **性能考虑**: 切换间隔不宜过短，建议 >= 3000ms

## 禁用功能

如需禁用随机背景功能，只需将 `randomBkApiUrl` 留空或删除即可。

## 更新日志

- **2025-10-26**: 初始版本发布
  - 支持直接返回图片和 JSON 格式 API
  - 支持自定义切换间隔和透明度
  - 支持嵌套 JSON 路径解析
