/**
 * @cloudflare/pages-plugin-sentry 兼容 shim
 *
 * 导出与原始插件相同的函数签名，确保 functions/utils/middleware.js
 * 无需修改即可正常导入。在 Workers 环境中直接透传请求，
 * Sentry DSN 未配置或初始化失败时静默降级。
 */
export default function sentryPlugin(options) {
  // 返回一个 Pages 中间件函数，直接调用 context.next()
  return function (context) {
    return context.next();
  };
}
