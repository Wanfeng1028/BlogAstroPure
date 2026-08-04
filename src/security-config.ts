/**
 * 安全加固配置
 *
 * 上线前请完成以下步骤：
 * 1. 登录 Cloudflare 控制台 → 创建 Turnstile 站点，得到 Site Key 与 Secret Key。
 * 2. 推荐在 Cloudflare 项目设置里配置环境变量（避免把 Secret Key 提交到仓库）：
 *      TURNSTILE_SITE_KEY    = <Site Key>
 *      TURNSTILE_SECRET_KEY  = <Secret Key>
 *    若未配置环境变量，可在此文件直接填入（注意 Secret Key 不要提交到公开仓库）。
 */
export const security = {
  /** Cloudflare Turnstile 人机验证（隐形模式） */
  turnstile: {
    enabled: true,
    /** 公开的 Site Key（前端使用），从 Cloudflare 后台获取 */
    siteKey: import.meta.env.TURNSTILE_SITE_KEY || 'YOUR_TURNSTILE_SITE_KEY',
    /** 私密的 Secret Key（仅服务端，用于 siteverify），从 Cloudflare 后台获取 */
    secretKey: import.meta.env.TURNSTILE_SECRET_KEY || 'YOUR_TURNSTILE_SECRET_KEY'
  },

  /** 限流 / 防批量访问（基于内存计数，按 Serverless 实例生效） */
  rateLimit: {
    enabled: true,
    /** 时间窗口（毫秒） */
    windowMs: 60_000,
    /** 单个 IP 在窗口内允许的最大请求数 */
    maxRequests: 90,
    /** 以下路径不做限流（静态资源、API 等） */
    skipPaths: ['/_astro/', '/favicon/', '/images/', '/icons/', '/assets/', '/api/']
  },

  /** 安全响应头 */
  headers: {
    enabled: true
  }
} as const