// Cloudflare Pages Functions: /verify-turnstile
// 校验 Turnstile token。使用 URLSearchParams (application/x-www-form-urlencoded)
// 以获得最佳 siteverify 兼容性。Secret Key 从 Pages 环境变量 TURNSTILE_SECRET_KEY 读取。

export async function onRequestPost(context) {
  const { request, env } = context

  let token: string | undefined
  try {
    const body = (await request.json()) as { token?: string }
    token = body?.token
  } catch {
    token = undefined
  }

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'missing-token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
  }

  const secret = env.TURNSTILE_SECRET_KEY
  if (!secret || secret.startsWith('YOUR_')) {
    return new Response(
      JSON.stringify({ success: false, error: 'turnstile-not-configured' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    )
  }

  const remoteip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    undefined

  const form = new URLSearchParams()
  form.append('secret', secret)
  form.append('response', token)
  if (remoteip) form.append('remoteip', remoteip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    })
    const data = (await res.json()) as any
    return new Response(
      JSON.stringify({
        success: !!data.success,
        'error-codes': data['error-codes'] || undefined
      }),
      {
        status: res.ok ? 200 : 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'siteverify-network-error' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      }
    )
  }
}
