import type { APIRoute } from 'astro'

import { security } from '@/security-config'

export const prerender = false

/**
 * Turnstile 服务端验证接口：把前端拿到的 token 交给 Cloudflare siteverify 校验。
 * 返回 { success: boolean, 'error-codes'?: string[] }。
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = security.turnstile.secretKey
  if (!secret || secret.startsWith('YOUR_')) {
    return new Response(
      JSON.stringify({ success: false, error: 'turnstile-not-configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let token: string | undefined
  try {
    const body = await request.json()
    token = body?.token
  } catch {
    token = undefined
  }

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'missing-token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const remoteip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    undefined

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, ...(remoteip ? { remoteip } : {}) })
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' }
  })
}