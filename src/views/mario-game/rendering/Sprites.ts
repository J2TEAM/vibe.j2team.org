import { TILE_SIZE } from '../engine/Physics'

const T = TILE_SIZE

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return [c, ctx]
}

function drawPixelArt(
  ctx: CanvasRenderingContext2D,
  data: string[],
  colors: Record<string, string>,
  scale: number,
  offsetX = 0,
  offsetY = 0,
) {
  for (let y = 0; y < data.length; y++) {
    const row = data[y]!
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.' || ch === ' ') continue
      const color = colors[ch]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale)
    }
  }
}

// Mario sprite data (16x16 pixel art)
const MARIO_SMALL_STAND = [
  '....RRRRR...',
  '...RRRRRRRRR',
  '...BBBSSBS..',
  '..BSBSSSBS..',
  '..BSBSBSSBS.',
  '..BBSSSSBB..',
  '....SSSSSS..',
  '...RRBRR....',
  '..RRRBRRRR..',
  '.RRRRBRRRRR.',
  '.SSRBBBRSS..',
  '.SSSBBBBSS..',
  '.SSBBBBBB...',
  '...BBB.BBB..',
  '..DDDD.DDDD.',
  '..DDDD.DDDD.',
]

const MARIO_SMALL_RUN1 = [
  '....RRRRR...',
  '...RRRRRRRRR',
  '...BBBSSBS..',
  '..BSBSSSBS..',
  '..BSBSBSSBS.',
  '..BBSSSSBB..',
  '....SSSSSS..',
  '...RRBRRR...',
  '..RRRBRRRRR.',
  '.RRRRBRRRRR.',
  '.SSRBBBRSS..',
  '.SSSBBBBSS..',
  '...SBBBS....',
  '..BBBB......',
  '..DDDD......',
  '.....DDDD...',
]

const MARIO_SMALL_JUMP = [
  '....RRRRR...',
  '...RRRRRRRRR',
  '...BBBSSBS..',
  '..BSBSSSBS..',
  '..BSBSBSSBS.',
  '..BBSSSSBB..',
  '....SSSSSS..',
  '..DDRRBRRDD.',
  '.DDRRRBRRRD.',
  '.DDRRRBRRRR.',
  '..DRBBBRS...',
  '....BBBBS...',
  '...SBBBS....',
  '..SSSS......',
  '..DDDD......',
  '...........D',
]

const MARIO_BIG_STAND = [
  '....RRRRR.......',
  '...RRRRRRRRR....',
  '...BBBSSBS......',
  '..BSBSSSBS......',
  '..BSBSBSSBS.....',
  '..BBSSSSBB......',
  '....SSSSSS......',
  '...RRRRR........',
  '..RRRRRRRR......',
  '.RRRRRRRRRR.....',
  '.SSRRRRRSS......',
  '.SSSRRRRSSS.....',
  '..SSRRRRSSS.....',
  '...RRRRRR.......',
  '..RRRRRRRR......',
  '.RRRRRRRRR......',
  '.RR.RRRR.RR.....',
  '....BBBB........',
  '...BBBBBB.......',
  '..BBB..BBB......',
  '..DDDD.DDDD.....',
  '..DDDD.DDDD.....',
  '................',
  '................',
]

const MARIO_COLORS: Record<string, string> = {
  R: '#E52521', // Red (hat/shirt)
  B: '#6B3E08', // Brown (hair)
  S: '#FBB03B', // Skin
  D: '#6B3E08', // Dark brown (shoes)
}

const MARIO_BIG_COLORS: Record<string, string> = {
  ...MARIO_COLORS,
}

// Goomba sprite
const GOOMBA = [
  '....BBBB....',
  '...BBBBBB...',
  '..BBBBBBBB..',
  '.BWBBBBWBB..',
  '.BWWBBWWBB..',
  '.BWWBBWWBB..',
  '..BBBBBBBB..',
  '...SBBBS....',
  '..SSBBBBSS..',
  '.SSSSBBBSSS.',
  'SSSSBBBBSSSS',
  '..DDDDDDDD..',
  '.DDDD..DDDD.',
]

const GOOMBA_COLORS: Record<string, string> = {
  B: '#8B4513', // Brown body
  S: '#DEB887', // Tan
  D: '#2F1B0E', // Dark feet
  W: '#FFFFFF', // White eyes
}

// Koopa sprite
const KOOPA = [
  '....GGG.....',
  '...GGGGG....',
  '..GWWGGGG...',
  '..GWWGGGG...',
  '...GGGGG....',
  '..GGGGGG....',
  '.GGGGGGGGG..',
  '.GGGGGGGGG..',
  '.GGYGGYGGG..',
  '.GGYGGYGGG..',
  '.GGGGGGGGG..',
  '..GGGGGGG...',
  '...SS.SS....',
  '..SSSS.SSS..',
  '..DDD..DDD..',
]

const KOOPA_COLORS: Record<string, string> = {
  G: '#2E8B2E', // Green shell
  Y: '#FFFF00', // Yellow
  S: '#FBB03B', // Skin
  D: '#8B4513', // Shoes
  W: '#FFFFFF', // White eyes
}

// Bowser sprite (larger)
const BOWSER = [
  '..GG......GG......GG..',
  '.GGGG...GGGG....GGGG..',
  '.GGGG..GGGGG...GGGGG..',
  '..GG..GGGGGGG.GGGGG...',
  '......GGGGGGGGGGGGG....',
  '.....GGGGGGGGGGGGG.....',
  '....GGGGGGGGGGGGGG.....',
  '...GGGWWGGGGGGGGGG.....',
  '...GGWWWGGGGGWWGGG.....',
  '...GGWWWGGGGGWWGGG.....',
  '...GGGGGGGGGGGGGGG.....',
  '....GSSSSSSSSSSG.......',
  '...GSSWSWSWSWSSG.......',
  '...GSSSSSSSSSSG........',
  '....GGGGGGGGGGG........',
  '...YYYYYYYYYYY.........',
  '..YYYYYYYYYYYYYY.......',
  '..YYYYYYYYYYYYYYY......',
  '..YYYYY.YYYYYYY........',
  '...YYY...YYYYY.........',
  '..DDD....DDDDD.........',
  '..DDDD...DDDDD.........',
]

const BOWSER_COLORS: Record<string, string> = {
  G: '#2E8B2E', // Green
  Y: '#DAA520', // Gold/yellow body
  S: '#FBB03B', // Skin/mouth
  W: '#FFFFFF', // White eyes
  D: '#8B4513', // Feet
}

// Tiles
function drawBrick(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#C84C09'
  ctx.fillRect(0, 0, T, T)
  ctx.fillStyle = '#E87830'
  ctx.fillRect(1, 1, T - 2, T / 2 - 2)
  ctx.fillRect(1, T / 2 + 1, T / 2 - 2, T / 2 - 2)
  ctx.fillRect(T / 2 + 1, T / 2 + 1, T / 2 - 2, T / 2 - 2)
  ctx.strokeStyle = '#8B3000'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, T, T / 2)
  ctx.strokeRect(0, T / 2, T, T / 2)
  ctx.beginPath()
  ctx.moveTo(T / 2, T / 2)
  ctx.lineTo(T / 2, T)
  ctx.stroke()
}

function drawGround(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#8B5E3C'
  ctx.fillRect(0, 0, T, T)
  ctx.fillStyle = '#6B4226'
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * 8, j * 8, 8, 8)
      }
    }
  }
  ctx.strokeStyle = '#4A2E14'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, T, T)
}

function drawQuestionBlock(ctx: CanvasRenderingContext2D, used: boolean) {
  ctx.fillStyle = used ? '#8B6914' : '#FFB800'
  ctx.fillRect(0, 0, T, T)
  ctx.strokeStyle = used ? '#5A4500' : '#E8A000'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, T - 2, T - 2)
  if (!used) {
    ctx.fillStyle = '#FFF'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', T / 2, T / 2 + 1)
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, isTop: boolean) {
  ctx.fillStyle = '#2E8B2E'
  ctx.fillRect(0, 0, T, T)
  ctx.fillStyle = '#3CB043'
  ctx.fillRect(2, 0, T - 8, T)
  if (isTop) {
    ctx.fillStyle = '#2E8B2E'
    ctx.fillRect(0, 0, T, 8)
    ctx.fillStyle = '#3CB043'
    ctx.fillRect(2, 2, T - 4, 4)
    ctx.strokeStyle = '#1A5C1A'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, T, 8)
  }
  ctx.strokeStyle = '#1A5C1A'
  ctx.lineWidth = 1
  ctx.strokeRect(2, 0, T - 4, T)
}

function drawFlag(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#888'
  ctx.fillRect(T / 2 - 2, 0, 4, T)
  ctx.fillStyle = '#00AA00'
  ctx.beginPath()
  ctx.moveTo(T / 2 + 2, 2)
  ctx.lineTo(T - 2, 8)
  ctx.lineTo(T / 2 + 2, 14)
  ctx.fill()
}

function drawCoin(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.ellipse(T / 2, T / 2, 8, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#DAA520'
  ctx.beginPath()
  ctx.ellipse(T / 2, T / 2, 5, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 12px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', T / 2, T / 2 + 1)
}

function drawMushroom(ctx: CanvasRenderingContext2D) {
  // Cap
  ctx.fillStyle = '#E52521'
  ctx.beginPath()
  ctx.ellipse(T / 2, T / 2 - 2, 12, 10, 0, Math.PI, 0)
  ctx.fill()
  // White spots
  ctx.fillStyle = '#FFF'
  ctx.beginPath()
  ctx.arc(T / 2 - 5, T / 2 - 7, 3, 0, Math.PI * 2)
  ctx.arc(T / 2 + 5, T / 2 - 7, 3, 0, Math.PI * 2)
  ctx.fill()
  // Stem
  ctx.fillStyle = '#FBB03B'
  ctx.fillRect(T / 2 - 6, T / 2 - 2, 12, 10)
  // Eyes
  ctx.fillStyle = '#000'
  ctx.fillRect(T / 2 - 4, T / 2 + 1, 3, 3)
  ctx.fillRect(T / 2 + 1, T / 2 + 1, 3, 3)
}

function drawStar(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  const cx = T / 2
  const cy = T / 2
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const x = cx + Math.cos(angle) * 12
    const y = cy + Math.sin(angle) * 12
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#FFA500'
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const x = cx + Math.cos(angle) * 7
    const y = cy + Math.sin(angle) * 7
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

function drawLava(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FF4500'
  ctx.fillRect(0, 0, T, T)
  ctx.fillStyle = '#FF6600'
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.arc(i * 10 + 4, 6, 6, Math.PI, 0)
    ctx.fill()
  }
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(0, 0, T, 3)
}

function drawFireball(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FF6600'
  ctx.beginPath()
  ctx.arc(T / 2, T / 2, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFAA00'
  ctx.beginPath()
  ctx.arc(T / 2, T / 2, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFF00'
  ctx.beginPath()
  ctx.arc(T / 2, T / 2, 2, 0, Math.PI * 2)
  ctx.fill()
}

export class Sprites {
  private cache: Map<string, HTMLCanvasElement> = new Map()

  private getOrCreate(key: string, draw: () => HTMLCanvasElement): HTMLCanvasElement {
    if (!this.cache.has(key)) {
      this.cache.set(key, draw())
    }
    return this.cache.get(key)!
  }

  marioSmallStand(flip: boolean = false): HTMLCanvasElement {
    return this.getOrCreate(`mario_s_stand_${flip}`, () => {
      const [c, ctx] = createCanvas(T, T)
      drawPixelArt(ctx, MARIO_SMALL_STAND, MARIO_COLORS, 2, flip ? 0 : 2, 0)
      if (flip) {
        ctx.save()
        ctx.scale(-1, 1)
        ctx.drawImage(c, -T, 0)
        ctx.restore()
      }
      return c
    })
  }

  marioSmallRun(flip: boolean = false): HTMLCanvasElement {
    return this.getOrCreate(`mario_s_run_${flip}`, () => {
      const [c, ctx] = createCanvas(T, T)
      drawPixelArt(ctx, MARIO_SMALL_RUN1, MARIO_COLORS, 2, 2, 0)
      if (flip) {
        const [c2, ctx2] = createCanvas(T, T)
        ctx2.save()
        ctx2.translate(T, 0)
        ctx2.scale(-1, 1)
        ctx2.drawImage(c, 0, 0)
        ctx2.restore()
        return c2
      }
      return c
    })
  }

  marioSmallJump(flip: boolean = false): HTMLCanvasElement {
    return this.getOrCreate(`mario_s_jump_${flip}`, () => {
      const [c, ctx] = createCanvas(T, T)
      drawPixelArt(ctx, MARIO_SMALL_JUMP, MARIO_COLORS, 2, 2, 0)
      if (flip) {
        const [c2, ctx2] = createCanvas(T, T)
        ctx2.save()
        ctx2.translate(T, 0)
        ctx2.scale(-1, 1)
        ctx2.drawImage(c, 0, 0)
        ctx2.restore()
        return c2
      }
      return c
    })
  }

  marioBigStand(flip: boolean = false): HTMLCanvasElement {
    return this.getOrCreate(`mario_b_stand_${flip}`, () => {
      const [c, ctx] = createCanvas(T, T * 2)
      drawPixelArt(ctx, MARIO_BIG_STAND, MARIO_BIG_COLORS, 2.5, 2, 0)
      if (flip) {
        const [c2, ctx2] = createCanvas(T, T * 2)
        ctx2.save()
        ctx2.translate(T, 0)
        ctx2.scale(-1, 1)
        ctx2.drawImage(c, 0, 0)
        ctx2.restore()
        return c2
      }
      return c
    })
  }

  goomba(frame: number = 0): HTMLCanvasElement {
    return this.getOrCreate(`goomba_${frame}`, () => {
      const [c, ctx] = createCanvas(T, T)
      drawPixelArt(ctx, GOOMBA, GOOMBA_COLORS, 2.5, 1, 4)
      return c
    })
  }

  goombaFlat(): HTMLCanvasElement {
    return this.getOrCreate('goomba_flat', () => {
      const [c, ctx] = createCanvas(T, T)
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(2, T - 8, T - 4, 8)
      ctx.fillStyle = '#DEB887'
      ctx.fillRect(4, T - 6, T - 8, 4)
      return c
    })
  }

  koopa(flip: boolean = false): HTMLCanvasElement {
    return this.getOrCreate(`koopa_${flip}`, () => {
      const [c, ctx] = createCanvas(T, T)
      drawPixelArt(ctx, KOOPA, KOOPA_COLORS, 2.2, 2, 0)
      if (flip) {
        const [c2, ctx2] = createCanvas(T, T)
        ctx2.save()
        ctx2.translate(T, 0)
        ctx2.scale(-1, 1)
        ctx2.drawImage(c, 0, 0)
        ctx2.restore()
        return c2
      }
      return c
    })
  }

  koopaShell(): HTMLCanvasElement {
    return this.getOrCreate('koopa_shell', () => {
      const [c, ctx] = createCanvas(T, T)
      ctx.fillStyle = '#2E8B2E'
      ctx.beginPath()
      ctx.ellipse(T / 2, T / 2 + 4, 12, 10, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFFF00'
      ctx.fillRect(T / 2 - 3, T / 2 + 1, 6, 6)
      return c
    })
  }

  bowser(frame: number = 0): HTMLCanvasElement {
    return this.getOrCreate(`bowser_${frame}`, () => {
      const [c, ctx] = createCanvas(T * 2, T * 2)
      drawPixelArt(ctx, BOWSER, BOWSER_COLORS, 2.8, 0, 2)
      return c
    })
  }

  tile(type: string): HTMLCanvasElement {
    return this.getOrCreate(`tile_${type}`, () => {
      const [c, ctx] = createCanvas(T, T)
      switch (type) {
        case 'brick':
          drawBrick(ctx)
          break
        case 'ground':
          drawGround(ctx)
          break
        case 'question':
          drawQuestionBlock(ctx, false)
          break
        case 'question_used':
          drawQuestionBlock(ctx, true)
          break
        case 'pipe_top':
          drawPipe(ctx, true)
          break
        case 'pipe':
          drawPipe(ctx, false)
          break
        case 'flag':
          drawFlag(ctx)
          break
        case 'coin':
          drawCoin(ctx)
          break
        case 'mushroom':
          drawMushroom(ctx)
          break
        case 'star':
          drawStar(ctx)
          break
        case 'lava':
          drawLava(ctx)
          break
        case 'fireball':
          drawFireball(ctx)
          break
        default:
          ctx.fillStyle = '#888'
          ctx.fillRect(0, 0, T, T)
      }
      return c
    })
  }
}
