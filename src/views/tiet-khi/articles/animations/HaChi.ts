/// <reference lib="dom" />
// @ts-nocheck

export function initAnimation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width, height

  let rotation = 0

  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  window.addEventListener('resize', resize)
  resize()

  function drawFlare(x, y, radius, rays, color) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    ctx.beginPath()
    for (let i = 0; i < rays; i++) {
      const angle = ((Math.PI * 2) / rays) * i
      const rayLength = radius * (1 + Math.random() * 0.2) // Jittery rays
      ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength)
      ctx.lineTo(
        Math.cos(angle + Math.PI / rays) * (radius * 0.5),
        Math.sin(angle + Math.PI / rays) * (radius * 0.5),
      )
    }
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  }

  function animate() {
    ctx.clearRect(0, 0, width, height)
    // Draw a massive, slow-rotating sun flare in top left corner or center
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width,
    )
    gradient.addColorStop(0, 'rgba(255, 84, 0, 0.1)')
    gradient.addColorStop(1, 'rgba(255, 209, 102, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw rotating solar flare
    drawFlare(width / 2, height / 2, width * 0.4, 12, 'rgba(255, 209, 102, 0.2)')

    rotation += 0.001
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
