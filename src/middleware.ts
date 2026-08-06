import { defineMiddleware } from 'astro:middleware'

import { security } from '@/security-config'

/**
 * 安全响应头集合。
 * Content-Security-Policy 需放行主题依赖的内联脚本/样式以及外部资源
 * （Waline 评论、引用 API、字体、Turnstile 验证脚本等）。
 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  // 现代浏览器已移除 XSS Auditor，且该机制可能引入新的漏洞，OWASP 推荐显式关闭。
  'X-XSS-Protection': '0',
  // 强制 HTTPS：Vercel/Cloudflare 默认会注入，这里兜底防止裸域名直连场景。
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "connect-src 'self' https:",
    "frame-src https://challenges.cloudflare.com",
    // 现代浏览器优先识别 frame-ancestors，与 X-Frame-Options 共存做向后兼容。
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

/**
 * 简单的内存限流（滑动窗口）。
 * 注意：Cloudflare 等 Serverless 环境按实例计数，属于尽力而为的防护，
 * 用于拦截肉眼可见的批量抓取，无法做到跨实例全局精确限流。
 */
const buckets = new Map<string, number[]>()

function rateLimitHit(ip: string): boolean {
  const { windowMs, maxRequests } = security.rateLimit
  const now = Date.now()
  const recent = (buckets.get(ip) || []).filter((t) => now - t < windowMs)

  if (recent.length >= maxRequests) {
    buckets.set(ip, recent)
    return true
  }

  recent.push(now)
  buckets.set(ip, recent)

  // 防止 Map 无限增长：定期清理窗口外的过期条目
  if (buckets.size > 10_000) {
    for (const [key, timestamps] of buckets) {
      if (timestamps.every((t) => now - t >= windowMs)) buckets.delete(key)
    }
  }
  return false
}

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf
  return 'unknown'
}

function shouldSkip(pathname: string): boolean {
  return security.rateLimit.skipPaths.some((p) => pathname.startsWith(p))
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url)

  // —— 限流 / 防批量访问 ——
  // 开发环境下跳过限流：本地请求 IP 会归一为 'unknown'，共享同一计数桶，
  // 频繁刷新/热更新极易触发 429。生产环境保留限流。
  if (!import.meta.env.DEV && security.rateLimit.enabled && !shouldSkip(pathname)) {
    const ip = getClientIp(context.request)
    if (rateLimitHit(ip)) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { ...SECURITY_HEADERS, 'Retry-After': '60' }
      })
    }
  }

  const response = await next()

  // —— 安全响应头 ——
  // 注意：SSR/Cloudflare 下 response.headers 是 immutable（不可变）的，
  // 直接 .set 会抛 "Can't modify immutable headers"，需新建 Response + 新 Headers
  if (security.headers.enabled) {
    const newHeaders = new Headers(response.headers)
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      newHeaders.set(key, value)
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }

  return response
})