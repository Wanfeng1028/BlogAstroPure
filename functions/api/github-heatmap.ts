// Cloudflare Pages Functions: /api/github-heatmap
// 代理拉取 GitHub 公开 push 事件，返回 { 'YYYY-MM-DD': 贡献数 }
// 沿用 worker/src/worker.js 逻辑，1 小时浏览器缓存，避免 GitHub 限流。

export async function onRequest(context: any) {
  const { request, env } = context
  const url = new URL(request.url)
  const username = url.searchParams.get('user') || 'Wanfeng1028'

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    })
  }

  const data: Record<string, number> = {}
  for (let page = 1; page <= 4; page++) {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
      {
        headers: {
          'User-Agent': 'AstroBlog',
          Accept: 'application/vnd.github+json',
          ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {})
        }
      }
    )
    if (!res.ok) break
    const events = (await res.json()) as any[]
    if (!Array.isArray(events) || !events.length) break
    for (const ev of events) {
      if (ev.type === 'PushEvent') {
        const key = String(ev.created_at).slice(0, 10)
        const commits = ev.payload?.commits?.length || 1
        data[key] = (data[key] || 0) + commits
      }
    }
  }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
