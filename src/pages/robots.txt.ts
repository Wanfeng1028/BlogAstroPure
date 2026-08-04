import type { APIRoute } from 'astro'

/**
 * 屏蔽常见 AI 爬虫与批量抓取机器人。
 * 其余搜索引擎爬虫（Google/Bing 等）正常放行，保证收录。
 */
const blockedBots = [
  // AI 训练 / 生成类
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'Google-Other',
  'CCBot',
  'PerplexityBot',
  'Perplexity-User',
  'Bytespider',
  'Amazonbot',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'cohere-ai',
  'Diffbot',
  'FetcherGPT',
  'YouBot',
  'Timpibot',
  'FriendlyCrawler',
  'KangarooBot',
  'EC2Bot',
  // 批量抓取 / 解析类
  'ImagesiftBot',
  'img2dataset',
  'omgili',
  'omgilibot',
  'FacebookBot',
  'DataForSeoBot',
  'Meltwater',
  'Pinterestbot',
  'Scrapy',
  'Aboundex',
  'AhrefsBot',
  'SemrushBot',
  'Moz',
  'Screaming Frog'
]

const robotsTxt = `
${blockedBots.map((bot) => `User-agent: ${bot}`).join('\n')}

User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', import.meta.env.SITE).href}
`.trim()

export const GET: APIRoute = () =>
  new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })