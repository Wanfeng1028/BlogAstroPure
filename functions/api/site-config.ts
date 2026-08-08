// Cloudflare Pages Functions: /api/site-config
// 给前端下发可公开的运行时配置（避免把 Site Key 等写进源代码）。
// Turnstile Site Key 从 Pages 环境变量 TURNSTILE_SITE_KEY 读取。

export async function onRequest(context: any) {
  const { env } = context
  const siteKey = (env.TURNSTILE_SITE_KEY as string | undefined) || ''
  const data = {
    turnstileSiteKey: siteKey && !siteKey.startsWith('YOUR_') ? siteKey : ''
  }
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600'
    }
  })
}
