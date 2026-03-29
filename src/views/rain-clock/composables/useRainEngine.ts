import type { Ref } from 'vue'
import { onMounted } from 'vue'
import { useEventListener, useRafFn } from '@vueuse/core'

interface Drop {
  x: number
  y: number
  speed: number
  length: number
  opacity: number
  wind: number
  size: number
}

export function useRainEngine(canvasEl: Ref<HTMLCanvasElement | null>, rainIntensity: Ref<number>) {
  let drops: Drop[] = []
  let ctx: CanvasRenderingContext2D | null = null
  let width = 0
  let height = 0

  function resize() {
    if (!canvasEl.value) return
    width = canvasEl.value.width = canvasEl.value.offsetWidth
    height = canvasEl.value.height = canvasEl.value.offsetHeight
  }

  function spawnDrop(): Drop {
    return {
      x: Math.random() * width,
      y: Math.random() * height * -1,
      speed: 4 + Math.random() * 8 * (rainIntensity.value / 8),
      length: 12 + Math.random() * 30,
      opacity: 0.1 + Math.random() * 0.26,
      wind: 0.25 + Math.random() * 0.8,
      size: Math.random() < 0.1 ? 0.9 : 0.5,
    }
  }

  function initDrops() {
    const count = Math.floor(rainIntensity.value * 35 + 55)
    drops = Array.from({ length: count }, () => {
      const drop = spawnDrop()
      drop.y = Math.random() * height
      return drop
    })
  }

  function drawFrame() {
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    const target = Math.floor(rainIntensity.value * 35 + 55)
    if (drops.length < target) {
      drops.push(spawnDrop())
    }
    else if (drops.length > target + 12) {
      drops.splice(0, 2)
    }

    for (const drop of drops) {
      ctx.beginPath()
      ctx.moveTo(drop.x, drop.y)
      ctx.lineTo(drop.x + drop.wind * drop.length * 0.28, drop.y + drop.length)
      ctx.strokeStyle = `rgba(120, 195, 250, ${drop.opacity})`
      ctx.lineWidth = drop.size
      ctx.stroke()

      drop.y += drop.speed
      drop.x += drop.wind * 0.35

      if (drop.y > height + drop.length || drop.x > width + 24) {
        const nextDrop = spawnDrop()
        drop.x = nextDrop.x
        drop.y = nextDrop.y
        drop.speed = nextDrop.speed
        drop.length = nextDrop.length
        drop.opacity = nextDrop.opacity
        drop.wind = nextDrop.wind
        drop.size = nextDrop.size
      }
    }

    // Light ground ripple for depth.
    if (Math.random() < 0.05 * rainIntensity.value) {
      const rippleX = Math.random() * width
      const rippleY = height - 8 - Math.random() * 14
      ctx.beginPath()
      ctx.ellipse(rippleX, rippleY, 4 + Math.random() * 7, 1.5, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(120, 195, 250, ${0.06 + Math.random() * 0.12})`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
  }

  const { pause, resume } = useRafFn(drawFrame, { immediate: false })

  onMounted(() => {
    if (!canvasEl.value) return
    ctx = canvasEl.value.getContext('2d')
    resize()
    initDrops()
    resume()
  })

  useEventListener(window, 'resize', () => {
    resize()
    initDrops()
  })

  return {
    pause,
    initDrops,
  }
}
