/**
 * Cloudflare Turnstile 隐形验证的前端逻辑。
 * 由 <Turnstile /> 组件在页面加载时调用。
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => void
      reset: (el: HTMLElement) => void
    }
  }
}

export function initTurnstile() {
  const anchor = document.getElementById('turnstile-anchor')
  if (!anchor) return
  const siteKey = anchor.dataset.sitekey || ''
  if (!siteKey) return

  loadScript().then(() => {
    if (!window.turnstile) return

    // 隐形模式：后台静默验证，正常访客无感知
    window.turnstile.render(anchor, {
      sitekey: siteKey,
      size: 'invisible',
      callback: async (token: string) => {
        const ok = await verify(token)
        document.body.classList.toggle('turnstile-verified', ok)
        if (!ok) {
          // 验证失败 → 回退为交互式挑战，让真实用户手动完成
          window.turnstile?.reset(anchor)
          window.turnstile?.render(anchor, {
            sitekey: siteKey,
            size: 'normal',
            callback: async (t2: string) => {
              const ok2 = await verify(t2)
              document.body.classList.toggle('turnstile-verified', ok2)
            }
          })
        }
      }
    })
  })
}

function loadScript() {
  return new Promise<void>((resolve) => {
    if (window.turnstile) return resolve()
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

async function verify(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    const data = await res.json()
    return data && data.success === true
  } catch {
    return false
  }
}