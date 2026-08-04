// Cloudflare Worker：代理拉取 GitHub 公开 push 事件，返回 { 'YYYY-MM-DD': 贡献数 }
// 通过 Cache API 缓存 1 小时，避免每次访问都触发 GitHub 限流。
// 部署后在浏览器访问 /?user=YOURNAME 即可拿到 JSON。
export default {
  async fetch(request) {
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

    const cache = caches.default
    const cacheKey = new Request(`https://github-heatmap/${username}`)

    // 命中缓存直接返回
    const cached = await cache.match(cacheKey)
    if (cached) return cached

    const data = {}
    for (let page = 1; page <= 4; page++) {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
        { headers: { 'User-Agent': 'AstroBlog', Accept: 'application/vnd.github+json' } }
      )
      if (!res.ok) break
      const events = await res.json()
      if (!Array.isArray(events) || !events.length) break
      for (const ev of events) {
        if (ev.type === 'PushEvent') {
          const key = String(ev.created_at).slice(0, 10)
          const commits = ev.payload?.commits?.length || 1
          data[key] = (data[key] || 0) + commits
        }
      }
    }

    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    })

    // response.clone() 保证缓存后原响应仍可返回给客户端
    await cache.put(cacheKey, response.clone())
    return response
  }
}