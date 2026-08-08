// Cloudflare Pages Functions: /api/github-heatmap
// 优先走 GitHub GraphQL contributionCalendar（与主页数据一致），
// 失败时回退到 REST PushEvent（至少不空白）。
// 支持 GITHUB_TOKEN 环境变量以提升限流。缓存 10 分钟 + 避免陈旧数据。

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

type HeatmapData = Record<string, number>

async function fetchGraphQL(
  username: string,
  headers: Record<string, string>
): Promise<HeatmapData | null> {
  const end = new Date()
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)

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
  if (!res.ok) return null
  const json = (await res.json()) as any
  const weeks =
    json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || []
  const data: HeatmapData = {}
  for (const week of weeks) {
    for (const day of week?.contributionDays || []) {
      const count = Number(day.contributionCount) || 0
      if (count > 0) data[String(day.date)] = count
    }
  }
  // 一个有效贡献日都没有 → 视为失败走 fallback
  return Object.keys(data).length > 0 ? data : null
}

async function fetchRestPushEvents(
  username: string,
  headers: Record<string, string>
): Promise<HeatmapData> {
  const data: HeatmapData = {}
  for (let page = 1; page <= 4; page++) {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
      { headers }
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
  return data
}

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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'AstroBlog',
    Accept: 'application/vnd.github+json'
  }
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`

  let data: HeatmapData = {}
  let source = 'graphql'
  try {
    const gql = await fetchGraphQL(username, headers)
    if (gql) data = gql
    else {
      data = await fetchRestPushEvents(username, headers)
      source = 'rest-fallback'
    }
  } catch {
    data = {}
    source = 'error'
  }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600', // 10 分钟
      'Access-Control-Allow-Origin': '*',
      'X-Heatmap-Source': source
    }
  })
}
