// 调试接口：返回 Functions 实际读到的环境变量（只返回是否存在/长度，不泄露值）
// /api/debug-env
export async function onRequest(context: any) {
  const { env } = context
  function info(name: string) {
    const v = (env[name] as string | undefined) || ''
    return {
      set: !!v,
      isDefaultYours: v.startsWith('YOUR_') || v.startsWith('0x000000'),
      length: v.length
    }
  }
  const data = {
    TURNSTILE_SITE_KEY: info('TURNSTILE_SITE_KEY'),
    TURNSTILE_SECRET_KEY: info('TURNSTILE_SECRET_KEY'),
    GITHUB_TOKEN: info('GITHUB_TOKEN')
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
