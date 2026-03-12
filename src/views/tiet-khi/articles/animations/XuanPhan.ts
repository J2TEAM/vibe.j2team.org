/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  let angle = 0

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  function drawYinYang(x, y, radius, angle) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // Draw border
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.strokeStyle = '#2A9D8F'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw S-curve
    ctx.beginPath()
    ctx.arc(0, -radius / 2, radius / 2, Math.PI / 2, Math.PI * 1.5)
    ctx.arc(0, radius / 2, radius / 2, Math.PI * 1.5, Math.PI / 2, true)
    ctx.arc(0, 0, radius, Math.PI / 2, Math.PI * 1.5, true)
    ctx.fillStyle = 'rgba(42, 157, 143, 0.1)' // Teal half
    ctx.fill()

    // Draw other half
    ctx.beginPath()
    ctx.arc(0, -radius / 2, radius / 2, Math.PI / 2, Math.PI * 1.5)
    ctx.arc(0, radius / 2, radius / 2, Math.PI * 1.5, Math.PI / 2, true)
    ctx.arc(0, 0, radius, Math.PI / 2, Math.PI * 1.5)
    ctx.fillStyle = 'rgba(233, 196, 106, 0.1)' // Gold half
    ctx.fill()

    ctx.restore()
  }

  function animate() {
    ctx.clearRect(0, 0, width, height)
    // Draw a large rotating Yin Yang in background
    drawYinYang(width / 2, height / 2, Math.min(width, height) * 0.4, angle)
    angle += 0.002
    window.animFrameId = requestAnimationFrame(animate)
  }
  animate()

  return {
    resize: (w: number, h: number) => {
      width = w
      height = h
      if (canvas) {
        canvas.width = w
        canvas.height = h
      }
      if (typeof resize === 'function') resize()
    },
    stop: () => {
      if (typeof window !== 'undefined' && window.animFrameId) {
        cancelAnimationFrame(window.animFrameId)
      }
    },
  }
}
