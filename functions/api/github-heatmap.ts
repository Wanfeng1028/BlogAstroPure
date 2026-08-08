// Cloudflare Pages Functions: /api/github-heatmap
// 用 GitHub GraphQL API 的 contributionCalendar 拉取贡献数据（与 GitHub 主页一致）。
// 支持可选 GITHUB_TOKEN 环境变量以提升限流（匿名 60/小时，有 PAT 5000/小时）。
// 浏览器 + CDN 双缓存 1 小时。

const GRAPHQL_QUERY = `
query($user: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $user) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`

export async function onRequest(context: any) {
  const { request, env } = context
  const url = new URL(request.url)
  const username = url.searchParams.get('user') || 'Wanfeng1028'

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    })
  }

  // 拉取 [今天 - 1 年, 今天] 范围的贡献（热力图组件会按选中年份筛）
  const end = new Date()
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'AstroBlog',
    Accept: 'application/vnd.github+json'
  }
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`

  const data: Record<string, number> = {}

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: {
          user: username,
          from: start.toISOString(),
          to: end.toISOString()
        }
      })
    })

    if (res.ok) {
      const json = await res.json()
      const weeks =
        json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || []
      for (const week of weeks) {
        for (const day of week?.contributionDays || []) {
          const count = Number(day.contributionCount) || 0
          if (count > 0) data[String(day.date)] = count
        }
      }
    }
  } catch {
    // GraphQL 出错时兜底返回空对象（前端仅显示博客数据）
  }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
