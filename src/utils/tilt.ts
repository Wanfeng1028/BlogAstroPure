/**
 * 3D Tilt 反光卡片交互
 * 鼠标在卡片上移动时，卡片跟随鼠标做 3D 倾斜，并产生跟随鼠标的光泽高光。
 * 仅在支持 hover 的设备（非触屏）上启用，尊重 prefers-reduced-motion。
 *
 * 用法：在需要启用倾斜的元素上加 `data-tilt` 属性与 `tilt-card` 类，然后调用 initTilt()。
 */
const MAX_TILT = 9 // 最大倾斜角度（度）
const LIFT = 10 // hover 时卡片抬起的高度（px，translateZ）

export function initTilt(selector = '[data-tilt]') {
  // 触屏或不支持 hover 的设备跳过；用户偏好减少动效时跳过
  if (!window.matchMedia('(hover: hover)').matches) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const cards = document.querySelectorAll<HTMLElement>(selector)

  cards.forEach((card) => {
    let rafId: number | null = null

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      // 归一化到 0~1
      const px = rect.width > 0 ? x / rect.width : 0.5
      const py = rect.height > 0 ? y / rect.height : 0.5
      // 鼠标在左上时卡片向右下倾（绕 X 正向、Y 负向）
      const rotateX = (0.5 - py) * MAX_TILT * 2
      const rotateY = (px - 0.5) * MAX_TILT * 2

      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${LIFT}px)`
        card.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`)
        card.style.setProperty('--my', `${(py * 100).toFixed(2)}%`)
      })
    }

    const onEnter = () => {
      card.setAttribute('data-tilt-active', '')
    }

    const onLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      card.removeAttribute('data-tilt-active')
      card.style.transform = ''
    }

    card.addEventListener('mouseenter', onEnter)
    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
  })
}
