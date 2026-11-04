// Byte-mode QR, error level M, versions 1–10. Drawn locally so the page
// never calls a QR website.

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)

function initField(): void {
  let value = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = value
    LOG[value] = i
    value <<= 1
    if (value >= 0x100) value ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255] ?? 0
}

initField()

function mul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[(LOG[a] ?? 0) + (LOG[b] ?? 0)] ?? 0
}

const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346] as const
const ECC_TOTAL = [10, 16, 26, 36, 48, 64, 72, 88, 110, 130] as const
const BLOCKS = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5] as const
const ALIGNMENT: readonly (readonly number[])[] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const MAX_VERSION = TOTAL_CODEWORDS.length

export function maxQrBytes(): number {
  return capacity(MAX_VERSION)
}

function capacity(version: number): number {
  const dataCodewords = (TOTAL_CODEWORDS[version - 1] ?? 0) - (ECC_TOTAL[version - 1] ?? 0)
  const countBits = version <= 9 ? 8 : 16
  return Math.floor((dataCodewords * 8 - 4 - countBits) / 8)
}

function rsDivisor(degree: number): Uint8Array {
  const result = new Uint8Array(degree)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      const mixed = mul(result[j] ?? 0, root)
      const next = j + 1 < result.length ? (result[j + 1] ?? 0) : 0
      result[j] = mixed ^ next
    }
    root = mul(root, 0x02)
  }
  return result
}

function rsRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length)
  for (const byte of data) {
    const factor = byte ^ (result[0] ?? 0)
    result.copyWithin(0, 1)
    result[result.length - 1] = 0
    for (let i = 0; i < result.length; i++) {
      result[i] = (result[i] ?? 0) ^ mul(divisor[i] ?? 0, factor)
    }
  }
  return result
}

class Bits {
  readonly bytes: number[] = []
  private acc = 0
  private filled = 0
  length = 0

  put(value: number, width: number): void {
    for (let i = width - 1; i >= 0; i--) {
      this.acc = (this.acc << 1) | ((value >>> i) & 1)
      this.filled++
      this.length++
      if (this.filled === 8) {
        this.bytes.push(this.acc)
        this.acc = 0
        this.filled = 0
      }
    }
  }

  finish(totalCodewords: number): Uint8Array {
    const room = totalCodewords * 8 - this.length
    const terminator = Math.min(4, Math.max(0, room))
    if (terminator > 0) this.put(0, terminator)
    if (this.filled > 0) this.put(0, 8 - this.filled)
    const pads = [0xec, 0x11]
    let pad = 0
    while (this.bytes.length < totalCodewords) {
      this.bytes.push(pads[pad % 2] ?? 0xec)
      pad++
    }
    return Uint8Array.from(this.bytes)
  }
}

function dataCodewords(bytes: Uint8Array, version: number): Uint8Array {
  const total = (TOTAL_CODEWORDS[version - 1] ?? 0) - (ECC_TOTAL[version - 1] ?? 0)
  const bits = new Bits()
  bits.put(0b0100, 4)
  bits.put(bytes.length, version <= 9 ? 8 : 16)
  for (const byte of bytes) bits.put(byte, 8)
  return bits.finish(total)
}

function interleave(data: Uint8Array, version: number): Uint8Array {
  const eccTotal = ECC_TOTAL[version - 1] ?? 0
  const blocks = BLOCKS[version - 1] ?? 1
  const eccEach = eccTotal / blocks
  const shortCount = blocks - (data.length % blocks)
  const shortLen = Math.floor(data.length / blocks)
  const divisor = rsDivisor(eccEach)
  const dataBlocks: Uint8Array[] = []
  const eccBlocks: Uint8Array[] = []
  let offset = 0
  for (let i = 0; i < blocks; i++) {
    const len = shortLen + (i >= shortCount ? 1 : 0)
    const block = data.slice(offset, offset + len)
    offset += len
    dataBlocks.push(block)
    eccBlocks.push(rsRemainder(block, divisor))
  }
  const out: number[] = []
  const longest = shortLen + 1
  for (let i = 0; i < longest; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) out.push(block[i] ?? 0)
    }
  }
  for (let i = 0; i < eccEach; i++) {
    for (const block of eccBlocks) out.push(block[i] ?? 0)
  }
  return Uint8Array.from(out)
}

function bitAt(codewords: Uint8Array, index: number): boolean {
  const byte = codewords[index >>> 3]
  if (byte === undefined) return false
  return ((byte >>> (7 - (index & 7))) & 1) === 1
}

interface Grid {
  size: number
  dark: boolean[][]
  fn: boolean[][]
}

function blank(size: number): Grid {
  const dark: boolean[][] = []
  const fn: boolean[][] = []
  for (let y = 0; y < size; y++) {
    dark.push(Array.from({ length: size }, () => false))
    fn.push(Array.from({ length: size }, () => false))
  }
  return { size, dark, fn }
}

function mark(grid: Grid, x: number, y: number, dark: boolean): void {
  const row = grid.dark[y]
  const flags = grid.fn[y]
  if (!row || !flags || x < 0 || x >= grid.size) return
  row[x] = dark
  flags[x] = true
}

function drawFinder(grid: Grid, ox: number, oy: number): void {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const x = ox + dx
      const y = oy + dy
      if (x < 0 || y < 0 || x >= grid.size || y >= grid.size) continue
      const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
      const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6
      const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
      mark(grid, x, y, inside && (edge || core))
    }
  }
}

function drawAlignment(grid: Grid, cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy))
      mark(grid, cx + dx, cy + dy, dist !== 1)
    }
  }
}

function overlapsFinder(grid: Grid, cx: number, cy: number): boolean {
  const edge = grid.size - 10
  if (cy < 9 && cx < 9) return true
  if (cy < 9 && cx > edge) return true
  if (cy > edge && cx < 9) return true
  return false
}

function drawFunctionPatterns(version: number): Grid {
  const size = 21 + (version - 1) * 4
  const grid = blank(size)
  drawFinder(grid, 0, 0)
  drawFinder(grid, size - 7, 0)
  drawFinder(grid, 0, size - 7)
  const centers = ALIGNMENT[version - 1] ?? []
  for (const cy of centers) {
    for (const cx of centers) {
      if (!overlapsFinder(grid, cx, cy)) drawAlignment(grid, cx, cy)
    }
  }
  for (let i = 0; i < size; i++) {
    if (!grid.fn[6]?.[i]) mark(grid, i, 6, i % 2 === 0)
    if (!grid.fn[i]?.[6]) mark(grid, 6, i, i % 2 === 0)
  }
  mark(grid, 8, 4 * version + 9, true)
  reserveFormat(grid)
  if (version >= 7) reserveVersion(grid)
  return grid
}

function reserveFormat(grid: Grid): void {
  for (let i = 0; i < 9; i++) {
    if (i !== 6) mark(grid, 8, i, false)
  }
  for (let i = 0; i < 8; i++) if (i !== 6) mark(grid, i, 8, false)
  for (let i = 0; i < 8; i++) mark(grid, grid.size - 1 - i, 8, false)
  for (let i = 0; i < 7; i++) mark(grid, 8, grid.size - 1 - i, false)
}

function reserveVersion(grid: Grid): void {
  for (let i = 0; i < 18; i++) {
    const a = grid.size - 11 + (i % 3)
    const b = Math.floor(i / 3)
    mark(grid, a, b, false)
    mark(grid, b, a, false)
  }
}

function placeData(grid: Grid, codewords: Uint8Array): void {
  let bit = 0
  let upward = true
  for (let right = grid.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < grid.size; vert++) {
      const y = upward ? grid.size - 1 - vert : vert
      for (let j = 0; j < 2; j++) {
        const x = right - j
        if (grid.fn[y]?.[x]) continue
        const row = grid.dark[y]
        if (!row) continue
        row[x] = bitAt(codewords, bit)
        bit++
      }
    }
    upward = !upward
  }
}

function maskFlips(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0
    case 1:
      return y % 2 === 0
    case 2:
      return x % 3 === 0
    case 3:
      return (x + y) % 3 === 0
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  }
}

function formatBits(mask: number): number {
  const data = mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >>> 9) & 1) * 0x537)
  return ((data << 10) | (rem & 0x3ff)) ^ 0x5412
}

function versionBits(version: number): number {
  let rem = version
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ (((rem >>> 11) & 1) * 0x1f25)
  return (version << 12) | (rem & 0xfff)
}

function paintFormat(grid: Grid, mask: number): void {
  const bits = formatBits(mask)
  const bit = (i: number) => ((bits >>> i) & 1) === 1
  for (let i = 0; i <= 5; i++) mark(grid, 8, i, bit(i))
  mark(grid, 8, 7, bit(6))
  mark(grid, 8, 8, bit(7))
  mark(grid, 7, 8, bit(8))
  for (let i = 9; i < 15; i++) mark(grid, 14 - i, 8, bit(i))
  for (let i = 0; i < 8; i++) mark(grid, grid.size - 1 - i, 8, bit(i))
  for (let i = 8; i < 15; i++) mark(grid, 8, grid.size - 15 + i, bit(i))
}

function paintVersion(grid: Grid, version: number): void {
  if (version < 7) return
  const bits = versionBits(version)
  for (let i = 0; i < 18; i++) {
    const on = ((bits >>> i) & 1) === 1
    const a = grid.size - 11 + (i % 3)
    const b = Math.floor(i / 3)
    mark(grid, a, b, on)
    mark(grid, b, a, on)
  }
}

function applyMask(grid: Grid, mask: number): boolean[][] {
  return grid.dark.map((row, y) =>
    row.map((cell, x) => (grid.fn[y]?.[x] ? cell : cell !== maskFlips(mask, x, y))),
  )
}

function penalty(modules: boolean[][]): number {
  const size = modules.length
  let score = 0
  const run = (read: (i: number, j: number) => boolean) => {
    for (let i = 0; i < size; i++) {
      let count = 1
      let prev = read(i, 0)
      for (let j = 1; j < size; j++) {
        const cell = read(i, j)
        if (cell === prev) count++
        else {
          if (count >= 5) score += 3 + (count - 5)
          count = 1
          prev = cell
        }
      }
      if (count >= 5) score += 3 + (count - 5)
    }
  }
  run((row, col) => modules[row]?.[col] === true)
  run((col, row) => modules[row]?.[col] === true)
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const cell = modules[y]?.[x]
      if (
        cell === modules[y]?.[x + 1] &&
        cell === modules[y + 1]?.[x] &&
        cell === modules[y + 1]?.[x + 1]
      ) {
        score += 3
      }
    }
  }
  const finder = (line: boolean[], i: number): boolean => {
    const bits = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]
    const alt = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]
    const match = (pattern: number[]) => pattern.every((bit, k) => line[i + k] === (bit === 1))
    return match(bits) || match(alt)
  }
  for (let i = 0; i < size; i++) {
    const row = modules[i] ?? []
    const col = modules.map((line) => line[i] === true)
    for (let j = 0; j <= size - 11; j++) {
      if (finder(row, j)) score += 40
      if (finder(col, j)) score += 40
    }
  }
  let dark = 0
  for (const row of modules) for (const cell of row) if (cell) dark++
  const total = size * size
  score += (Math.abs(dark * 20 - total * 10) / total) * 10
  return score
}

function chooseMask(grid: Grid, version: number): boolean[][] {
  let best: boolean[][] | null = null
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const painted = applyMask(grid, mask)
    const trial: Grid = { size: grid.size, dark: painted, fn: grid.fn }
    paintFormat(trial, mask)
    paintVersion(trial, version)
    const score = penalty(trial.dark)
    if (score < bestScore) {
      bestScore = score
      best = trial.dark
    }
  }
  return best ?? grid.dark
}

export function makeQr(text: string, mask?: number): boolean[][] {
  const bytes = new TextEncoder().encode(text)
  let version = 1
  while (version < MAX_VERSION && bytes.length > capacity(version)) version++
  if (bytes.length > capacity(version)) {
    throw new Error(`Tối đa ${capacity(MAX_VERSION)} byte. Rút ngắn đoạn chữ.`)
  }
  const codewords = interleave(dataCodewords(bytes, version), version)
  const grid = drawFunctionPatterns(version)
  placeData(grid, codewords)
  if (mask === undefined) return chooseMask(grid, version)
  const painted = applyMask(grid, mask)
  const trial: Grid = { size: grid.size, dark: painted, fn: grid.fn }
  paintFormat(trial, mask)
  paintVersion(trial, version)
  return trial.dark
}
