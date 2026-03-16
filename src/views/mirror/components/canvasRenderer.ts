import type { ProductItem, Star } from './types'
import { COLORS } from './types'

export function createStars(w: number, h: number, isMobileFlag: boolean): Star[] {
  const starCount = isMobileFlag ? 100 : 200
  const starsArr: Star[] = []

  for (let i = 0; i < starCount; i++) {
    starsArr.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.5 + 0.5,
      twinkleSpeed: Math.random() * 2 + 1,
      twinkleOffset: Math.random() * Math.PI * 2,
    })
  }

  return starsArr
}

export function drawStars(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  elapsed: number,
  stars: Star[],
) {
  stars.forEach((star) => {
    const twinkle = Math.sin(elapsed * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7
    const alpha = star.brightness * twinkle

    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.3})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  })
}

export function drawConstellationLines(ctx: CanvasRenderingContext2D, productTiles: ProductItem[]) {
  const categoryGroups: Record<string, ProductItem[]> = {}
  productTiles.forEach((tile) => {
    if (!categoryGroups[tile.category]) {
      categoryGroups[tile.category] = []
    }
    categoryGroups[tile.category]!.push(tile)
  })

  const categoryValues = Object.values(categoryGroups) as ProductItem[][]
  categoryValues.forEach((group) => {
    if (!group || group.length < 2) return
    for (let i = 0; i < group.length - 1; i++) {
      const current = group[i]
      const next = group[i + 1]
      if (!current || !next) continue
      ctx.beginPath()
      ctx.moveTo(current.x, current.y)
      ctx.lineTo(next.x, next.y)
      ctx.strokeStyle = COLORS.constellationLine
      ctx.lineWidth = 1
      ctx.stroke()
    }
  })

  const authorGroups: Record<string, ProductItem[]> = {}
  productTiles.forEach((tile) => {
    if (!tile.author) return
    if (!authorGroups[tile.author]) {
      authorGroups[tile.author] = []
    }
    authorGroups[tile.author]!.push(tile)
  })

  const authorValues = Object.values(authorGroups) as ProductItem[][]
  authorValues.forEach((group) => {
    if (!group || group.length < 2) return
    for (let i = 0; i < group.length - 1; i++) {
      const current = group[i]
      const next = group[i + 1]
      if (!current || !next) continue
      ctx.beginPath()
      ctx.moveTo(current.x, current.y)
      ctx.lineTo(next.x, next.y)
      ctx.strokeStyle = COLORS.constellationLineAuthor
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  })
}

export function drawProducts(
  ctx: CanvasRenderingContext2D,
  productTiles: ProductItem[],
  isMobile: boolean,
) {
  productTiles.forEach((tile) => {
    const cardWidth = isMobile ? 140 : 180
    const cardHeight = isMobile ? 70 : 85
    const cardX = tile.x - cardWidth / 2
    const padding = 12

    ctx.fillStyle = COLORS.coral
    ctx.beginPath()
    ctx.arc(tile.x, tile.y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(22, 34, 50, 0.9)'
    ctx.beginPath()
    ctx.moveTo(cardX, tile.y)
    ctx.lineTo(cardX + cardWidth, tile.y)
    ctx.lineTo(cardX + cardWidth, tile.y + cardHeight)
    ctx.lineTo(cardX, tile.y + cardHeight)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = COLORS.border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = COLORS.coral
    ctx.fillRect(cardX, tile.y, cardWidth, 3)

    ctx.font = `600 ${isMobile ? 12 : 14}px "Anybody", sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = COLORS.textPrimary

    let displayName = tile.name
    while (ctx.measureText(displayName).width > cardWidth - padding * 2 && displayName.length > 0) {
      displayName = displayName.slice(0, -1)
    }
    if (displayName !== tile.name) displayName += '...'

    ctx.fillText(displayName, cardX + padding, tile.y + 20)

    ctx.font = `${isMobile ? 8 : 10}px "Be Vietnam Pro", sans-serif`
    ctx.fillStyle = COLORS.coral
    ctx.fillText(tile.category.toUpperCase(), cardX + padding, tile.y + 38)

    ctx.fillStyle = COLORS.textDim
    let displayAuthor = 'by ' + (tile.author || '')
    while (
      ctx.measureText(displayAuthor).width > cardWidth - padding * 2 &&
      displayAuthor.length > 0
    ) {
      displayAuthor = displayAuthor.slice(0, -1)
    }
    if (displayAuthor !== 'by ' + (tile.author || '')) displayAuthor += '...'

    ctx.fillText(displayAuthor, cardX + padding, tile.y + cardHeight - 12)
  })
}

export function createProductTiles(
  pages: PageInfo[],
  count: number,
  isMobileFlag: boolean,
): ProductItem[] {
  const tiles: ProductItem[] = []
  const shuffled = [...pages].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)

  const w = typeof window !== 'undefined' ? window.innerWidth || 800 : 800
  const h = typeof window !== 'undefined' ? window.innerHeight || 600 : 600
  const padding = isMobileFlag ? 80 : 120

  selected.forEach((product) => {
    tiles.push({
      name: product.name,
      description: product.description,
      author: product.author || '',
      category: product.category || 'other',
      path: product.path,
      facebook: product.facebook,
      x: padding + Math.random() * (w - padding * 2),
      y: padding + Math.random() * (h - padding * 2),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      isDragging: false,
      lastClickTime: 0,
    })
  })

  return tiles
}

export function updateProductPositions(productTiles: ProductItem[], isMobileFlag: boolean) {
  const w = typeof window !== 'undefined' ? window.innerWidth || 800 : 800
  const h = typeof window !== 'undefined' ? window.innerHeight || 600 : 600
  const cardWidth = isMobileFlag ? 140 : 180
  const cardHeight = isMobileFlag ? 70 : 85

  productTiles.forEach((tile) => {
    if (!tile.isDragging) {
      tile.x += tile.vx
      tile.y += tile.vy

      if (tile.x < cardWidth / 2 || tile.x > w - cardWidth / 2) {
        tile.vx *= -1
        tile.x = Math.max(cardWidth / 2, Math.min(w - cardWidth / 2, tile.x))
      }
      if (tile.y < cardHeight || tile.y > h - cardHeight) {
        tile.vy *= -1
        tile.y = Math.max(cardHeight, Math.min(h - cardHeight, tile.y))
      }
    }
  })
}

export function getProductAtPosition(
  clickX: number,
  clickY: number,
  productTiles: ProductItem[],
  isMobileFlag: boolean,
): ProductItem | null {
  const cardWidth = isMobileFlag ? 140 : 180
  const cardHeight = isMobileFlag ? 70 : 85

  for (const tile of productTiles) {
    const cardX = tile.x - cardWidth / 2
    if (
      clickX >= cardX &&
      clickX <= cardX + cardWidth &&
      clickY >= tile.y &&
      clickY <= tile.y + cardHeight
    ) {
      return tile
    }
  }
  return null
}

export interface PageInfo {
  name: string
  description: string
  author: string
  category: string
  path: string
  facebook?: string
}

export function drawCenterText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isMobile: boolean,
) {
  const textY = h / 2
  const textX = w / 2
  const fontSize = isMobile ? 20 : 30
  const welcomeFontSize = isMobile ? 10 : 12

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(textX, textY)
  ctx.rotate((-1 * Math.PI) / 180)

  ctx.font = `bold ${fontSize}px "Anybody", sans-serif`

  const vibePart = 'vibe'
  const dot1 = '.'
  const j2teamPart = 'j2team'
  const dot2 = '.'
  const orgPart = 'org'

  const vibeWidth = ctx.measureText(vibePart).width
  const dotWidth = ctx.measureText(dot1).width
  const j2teamWidth = ctx.measureText(j2teamPart).width
  const totalWidth = vibeWidth + dotWidth + j2teamWidth + dotWidth + ctx.measureText(orgPart).width

  let currentX = -totalWidth / 2

  ctx.fillStyle = COLORS.textPrimary
  ctx.shadowColor = 'transparent'
  ctx.fillText(vibePart, currentX + vibeWidth / 2, 0)
  currentX += vibeWidth

  ctx.fillStyle = COLORS.coral
  ctx.fillText(dot1, currentX + dotWidth / 2, 0)
  currentX += dotWidth

  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(j2teamPart, currentX + j2teamWidth / 2, 0)
  currentX += j2teamWidth

  ctx.fillStyle = COLORS.coral
  ctx.fillText(dot2, currentX + dotWidth / 2, 0)
  currentX += dotWidth

  ctx.fillStyle = COLORS.textPrimary
  ctx.fillText(orgPart, currentX + ctx.measureText(orgPart).width / 2, 0)

  ctx.restore()

  ctx.save()
  ctx.translate(textX, textY - fontSize * 0.8)
  ctx.rotate((-1 * Math.PI) / 180)
  ctx.font = `${welcomeFontSize}px "Be Vietnam Pro", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = COLORS.textSecondary
  ctx.fillText('Welcome to', 0, 0)
  ctx.restore()
}
