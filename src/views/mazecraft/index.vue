<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

// ─── Constants ────────────────────────────────────────────────────
const WALL = 0,
  PATH = 1,
  EXPLORED = 4,
  SOLUTION = 5

const COLORS = {
  wall: '#0d0d1a',
  path: '#111128',
  start: '#22d3ee',
  end: '#f43f5e',
  explored: 'rgba(139,92,246,0.25)',
  solution: '#fbbf24',
  current: '#8b5cf6',
  frontier: 'rgba(6,182,212,0.3)',
}

const SPEED_LABELS = ['', 'Rất chậm', 'Chậm', 'Vừa', 'Nhanh', 'Tức thì'] as const

// ─── Reactive state ───────────────────────────────────────────────
const mazeSize = ref(21)
const sizDisplay = ref('21×21')
const genAlgo = ref('dfs')
const genSpeed = ref(4)
const genSpeedLabel = ref('Nhanh')
const solveAlgo = ref('astar')
const solveSpeed = ref(4)
const solveSpeedLabel = ref('Nhanh')
const showExplored = ref(true)
const animateGen = ref(true)
const statusText = ref('Nhấn "Tạo mê cung mới" để bắt đầu')
const isSpinning = ref(false)
const statCells = ref(0)
const statPath = ref(0)
const statTime = ref('0ms')
const statExplored = ref(0)
const btnSolveDisabled = ref(true)
const btnResetDisabled = ref(true)
const btnGenDisabled = ref(false)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapperRef = ref<HTMLDivElement | null>(null)

// ─── Mutable state (not reactive for perf) ───────────────────────
let ctx: CanvasRenderingContext2D | null = null
let grid: number[][] = []
let rows = 21,
  cols = 21
let cellSize = 20
let isGenerating = false,
  isSolving = false
let mazeDone = false
let startCell: { r: number; c: number } | null = null
let endCell: { r: number; c: number } | null = null

// ─── Helpers ──────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function getGenDelay() {
  return [0, 200, 80, 30, 5, 0][genSpeed.value] ?? 0
}

function getSolveDelay() {
  return [0, 200, 80, 30, 5, 0][solveSpeed.value] ?? 0
}

// ─── Canvas ───────────────────────────────────────────────────────
function resizeCanvas(r: number, c: number) {
  const wrapper = canvasWrapperRef.value
  if (!wrapper || !canvasRef.value) return
  const maxW = wrapper.clientWidth - 40
  const maxH = Math.min(window.innerHeight * 0.7, 640)
  cellSize = Math.max(4, Math.floor(Math.min(maxW / c, maxH / r)))
  canvasRef.value.width = c * cellSize
  canvasRef.value.height = r * cellSize
}

function drawPlaceholder() {
  if (!ctx || !canvasRef.value) return
  const canvas = canvasRef.value
  ctx.fillStyle = '#0d0d1a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(139,92,246,0.3)'
  ctx.font = `bold ${Math.floor(canvas.width / 20)}px Outfit, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Nhấn "Tạo mê cung mới" để bắt đầu ✨', canvas.width / 2, canvas.height / 2)
}

function getColor(cell: number, r: number, c: number) {
  if (r === startCell?.r && c === startCell?.c) return COLORS.start
  if (r === endCell?.r && c === endCell?.c) return COLORS.end
  if (cell === SOLUTION) return COLORS.solution
  if (cell === EXPLORED) return COLORS.explored
  if (cell === PATH) return COLORS.path
  return COLORS.wall
}

function drawGrid() {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize,
        y = r * cellSize
      const val = grid[r]![c]!
      ctx.fillStyle = getColor(val, r, c)
      ctx.fillRect(x, y, cellSize, cellSize)
      if (val !== WALL && cellSize > 6) {
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)
      }
    }
  }
  drawMarker(startCell, COLORS.start, 'S')
  drawMarker(endCell, COLORS.end, 'E')
}

function drawMarker(cell: { r: number; c: number } | null, color: string, label: string) {
  if (!cell || !ctx) return
  const x = cell.c * cellSize,
    y = cell.r * cellSize
  const s = cellSize
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x + s * 0.15, y + s * 0.15, s * 0.7, s * 0.7, s * 0.15)
  ctx.fill()
  if (s >= 14) {
    ctx.fillStyle = '#000'
    ctx.font = `bold ${Math.floor(s * 0.55)}px Outfit, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + s / 2, y + s / 2 + 1)
  }
}

function drawCurrentCell(r: number, c: number, color: string) {
  if (!ctx) return
  const x = c * cellSize,
    y = r * cellSize
  ctx.fillStyle = color
  ctx.fillRect(x, y, cellSize, cellSize)
  if (cellSize >= 8) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
  }
}

// ─── Grid init ────────────────────────────────────────────────────
function initGrid() {
  grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => WALL as number))
}

// ─── Slider handlers ──────────────────────────────────────────────
function onSizeInput() {
  let v = mazeSize.value
  if (v % 2 === 0) v++
  mazeSize.value = v
  sizDisplay.value = `${v}×${v}`
}

function onGenSpeedInput() {
  genSpeedLabel.value = SPEED_LABELS[genSpeed.value] ?? 'Nhanh'
}

function onSolveSpeedInput() {
  solveSpeedLabel.value = SPEED_LABELS[solveSpeed.value] ?? 'Nhanh'
}

// ─── Generation ───────────────────────────────────────────────────
async function startGeneration(animated: boolean) {
  if (isGenerating || isSolving) return
  isGenerating = true
  mazeDone = false

  btnSolveDisabled.value = true
  btnResetDisabled.value = true
  btnGenDisabled.value = true

  let v = mazeSize.value
  if (v % 2 === 0) v++
  rows = cols = v
  resizeCanvas(rows, cols)
  initGrid()

  isSpinning.value = true
  statusText.value = `Đang tạo mê cung (${genAlgo.value.toUpperCase()})…`
  statCells.value = 0
  statPath.value = 0
  statTime.value = '0ms'
  statExplored.value = 0

  const t0 = performance.now()

  if (!animated || getGenDelay() === 0) {
    await generateMaze(genAlgo.value, false)
    drawGrid()
  } else {
    await generateMaze(genAlgo.value, true)
  }

  const dt = Math.round(performance.now() - t0)
  statTime.value = `${dt}ms`
  statCells.value = countCells()

  startCell = { r: 1, c: 1 }
  endCell = { r: rows - 2, c: cols - 2 }
  drawGrid()

  statusText.value = 'Mê cung đã tạo xong! Nhấn "Tìm đường" để giải.'
  isSpinning.value = false
  mazeDone = true
  btnSolveDisabled.value = false
  btnGenDisabled.value = false
  isGenerating = false
}

async function generateMaze(algo: string, animated: boolean) {
  switch (algo) {
    case 'dfs':
      await genDFS(animated)
      break
    case 'prim':
      await genPrim(animated)
      break
    case 'kruskal':
      await genKruskal(animated)
      break
    case 'eller':
      await genEller(animated)
      break
    default:
      await genDFS(animated)
  }
}

// ── DFS ──────────────────────────────────────────────────────────
async function genDFS(animated: boolean) {
  const delay = getGenDelay()
  const stack: { r: number; c: number }[] = []
  grid[1]![1] = PATH
  stack.push({ r: 1, c: 1 })
  const dirs = [
    { dr: -2, dc: 0 },
    { dr: 2, dc: 0 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: 2 },
  ]

  while (stack.length > 0) {
    const top = stack[stack.length - 1]!
    const { r, c } = top
    const neighbors = dirs
      .map((d) => ({ r: r + d.dr, c: c + d.dc, mr: r + d.dr / 2, mc: c + d.dc / 2 }))
      .filter(
        (n) => n.r > 0 && n.r < rows - 1 && n.c > 0 && n.c < cols - 1 && grid[n.r]![n.c] === WALL,
      )

    if (neighbors.length === 0) {
      stack.pop()
    } else {
      const n = neighbors[Math.floor(Math.random() * neighbors.length)]!
      grid[n.mr]![n.mc] = PATH
      grid[n.r]![n.c] = PATH
      stack.push({ r: n.r, c: n.c })
      if (animated && delay > 0) {
        drawCurrentCell(n.r, n.c, COLORS.current)
        await sleep(delay)
      }
    }
  }
}

// ── Prim's ───────────────────────────────────────────────────────
async function genPrim(animated: boolean) {
  const delay = getGenDelay()
  grid[1]![1] = PATH
  const frontier: { r: number; c: number }[] = []

  function addFrontier(r: number, c: number) {
    if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1 && grid[r]![c] === WALL) {
      grid[r]![c] = 2
      frontier.push({ r, c })
    }
  }
  function neighbors(r: number, c: number) {
    return [
      { r: r - 2, c },
      { r: r + 2, c },
      { r, c: c - 2 },
      { r, c: c + 2 },
    ].filter(
      (n) => n.r > 0 && n.r < rows - 1 && n.c > 0 && n.c < cols - 1 && grid[n.r]![n.c] === PATH,
    )
  }

  addFrontier(1 - 2, 1)
  addFrontier(1 + 2, 1)
  addFrontier(1, 1 - 2)
  addFrontier(1, 1 + 2)

  while (frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length)
    const item = frontier.splice(idx, 1)[0]!
    const { r, c } = item
    const nb = neighbors(r, c)
    if (nb.length > 0) {
      const chosen = nb[Math.floor(Math.random() * nb.length)]!
      grid[(r + chosen.r) >> 1]![(c + chosen.c) >> 1] = PATH
      grid[r]![c] = PATH
      addFrontier(r - 2, c)
      addFrontier(r + 2, c)
      addFrontier(r, c - 2)
      addFrontier(r, c + 2)
    } else {
      grid[r]![c] = PATH
    }
    if (animated && delay > 0) {
      drawCurrentCell(r, c, COLORS.frontier)
      await sleep(delay)
    }
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (grid[r]![c] === 2) grid[r]![c] = WALL
}

// ── Kruskal's ────────────────────────────────────────────────────
async function genKruskal(animated: boolean) {
  const delay = getGenDelay()
  const parent: number[] = []
  const rank: number[] = []
  const id = (r: number, c: number) => r * cols + c

  for (let i = 0; i < rows * cols; i++) {
    parent[i] = i
    rank[i] = 0
  }

  function find(x: number): number {
    if (parent[x] !== x) parent[x] = find(parent[x]!)
    return parent[x]!
  }
  function union(a: number, b: number) {
    a = find(a)
    b = find(b)
    if (a === b) return false
    if ((rank[a] ?? 0) < (rank[b] ?? 0)) {
      const tmp = a
      a = b
      b = tmp
    }
    parent[b] = a
    if (rank[a] === rank[b]) rank[a] = (rank[a] ?? 0) + 1
    return true
  }

  const edges: { r1: number; c1: number; r2: number; c2: number; mr: number; mc: number }[] = []
  for (let r = 1; r < rows - 1; r += 2) {
    for (let c = 1; c < cols - 1; c += 2) {
      if (r + 2 < rows - 1) edges.push({ r1: r, c1: c, r2: r + 2, c2: c, mr: r + 1, mc: c })
      if (c + 2 < cols - 1) edges.push({ r1: r, c1: c, r2: r, c2: c + 2, mr: r, mc: c + 1 })
      grid[r]![c] = PATH
    }
  }
  for (let i = edges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = edges[i]!
    edges[i] = edges[j]!
    edges[j] = tmp
  }

  for (const e of edges) {
    if (union(id(e.r1, e.c1), id(e.r2, e.c2))) {
      grid[e.mr]![e.mc] = PATH
      if (animated && delay > 0) {
        drawCurrentCell(e.mr, e.mc, COLORS.current)
        drawCurrentCell(e.r2, e.c2, COLORS.frontier)
        await sleep(delay)
      }
    }
  }
}

// ── Eller's ──────────────────────────────────────────────────────
async function genEller(animated: boolean) {
  const delay = getGenDelay()
  const roomCols = Math.floor(cols / 2)
  const roomRows = Math.floor(rows / 2)

  let setOf = Array.from({ length: roomCols }, (_, i) => i + 1)
  let nextSet = roomCols + 1

  for (let r = 1; r < rows - 1; r += 2) for (let c = 1; c < cols - 1; c += 2) grid[r]![c] = PATH

  for (let row = 0; row < roomRows; row++) {
    const gr = row * 2 + 1
    const last = row === roomRows - 1

    for (let c = 0; c < roomCols - 1; c++) {
      const gc = c * 2 + 1
      const merge = last || (setOf[c] !== setOf[c + 1] && Math.random() < 0.5)
      if (merge && setOf[c] !== setOf[c + 1]) {
        const old = setOf[c + 1],
          nw = setOf[c]
        for (let k = 0; k < roomCols; k++) if (setOf[k] === old) setOf[k] = nw!
        grid[gr]![gc + 1] = PATH
        if (animated && delay > 0) {
          drawCurrentCell(gr, gc + 1, COLORS.frontier)
          await sleep(delay)
        }
      }
    }

    if (last) break

    const sets: Record<number, number[]> = {}
    for (let c = 0; c < roomCols; c++) {
      const s = setOf[c]!
      if (!sets[s]) sets[s] = []
      sets[s]!.push(c)
    }
    const newSetOf = Array.from({ length: roomCols }, () => 0)
    for (const [s, members] of Object.entries(sets)) {
      members.sort(() => Math.random() - 0.5)
      const cnt = Math.max(1, Math.floor(Math.random() * members.length) + 1)
      for (let i = 0; i < members.length; i++) {
        const c = members[i]!
        if (i < cnt) {
          const gc = c * 2 + 1
          grid[gr + 1]![gc] = PATH
          newSetOf[c] = parseInt(s)
          if (animated && delay > 0) {
            drawCurrentCell(gr + 1, gc, COLORS.current)
            await sleep(delay)
          }
        } else {
          newSetOf[c] = nextSet++
        }
      }
    }
    setOf = newSetOf
  }
}

// ─── Solving ──────────────────────────────────────────────────────
async function startSolving() {
  if (!mazeDone || isGenerating || isSolving) return
  isSolving = true
  resetPath(true)

  btnSolveDisabled.value = true
  btnResetDisabled.value = true
  btnGenDisabled.value = true

  isSpinning.value = true
  statusText.value = `Đang tìm đường (${solveAlgo.value.toUpperCase()})…`
  statExplored.value = 0
  statPath.value = 0

  const t0 = performance.now()
  let result: { r: number; c: number }[] | null = null

  switch (solveAlgo.value) {
    case 'astar':
      result = await solveAStar()
      break
    case 'bfs':
      result = await solveBFS()
      break
    case 'dfs':
      result = await solveDFS()
      break
    case 'dijkstra':
      result = await solveDijkstra()
      break
  }

  const dt = Math.round(performance.now() - t0)
  statTime.value = `${dt}ms`

  if (result && result.length > 0) {
    await animateSolution(result)
    statPath.value = result.length
    statusText.value = `✅ Đã tìm thấy đường đi! Độ dài: ${result.length} bước`
  } else {
    statusText.value = '❌ Không tìm thấy đường đi!'
  }

  isSpinning.value = false
  btnSolveDisabled.value = false
  btnResetDisabled.value = false
  btnGenDisabled.value = false
  isSolving = false
}

function resetPath(silent = false) {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const v = grid[r]![c]
      if (v === EXPLORED || v === SOLUTION) grid[r]![c] = PATH
    }
  drawGrid()
  if (!silent) {
    statusText.value = 'Đường đi đã được xóa. Nhấn "Tìm đường" để giải lại.'
    statPath.value = 0
    statExplored.value = 0
    btnResetDisabled.value = true
  }
}

// Solver helpers
function solverNeighbors(r: number, c: number) {
  return [
    { r: r - 1, c },
    { r: r + 1, c },
    { r, c: c - 1 },
    { r, c: c + 1 },
  ].filter((n) => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && grid[n.r]![n.c] !== WALL)
}

function manhattan(r: number, c: number) {
  return Math.abs(r - (endCell?.r ?? 0)) + Math.abs(c - (endCell?.c ?? 0))
}

function reconstructPath(parent: ({ r: number; c: number } | null)[][]) {
  const path: { r: number; c: number }[] = []
  let cur: { r: number; c: number } | null = endCell
  while (cur && !(cur.r === startCell?.r && cur.c === startCell?.c)) {
    path.unshift(cur)
    cur = parent[cur.r]?.[cur.c] ?? null
  }
  if (cur) path.unshift(startCell!)
  return path.length > 1 ? path : []
}

async function solveAStar() {
  const delay = getSolveDelay()
  const visited = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
  const gScore = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Infinity))
  const parent = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null as { r: number; c: number } | null),
  )
  gScore[startCell!.r]![startCell!.c] = 0
  const open = [{ r: startCell!.r, c: startCell!.c, f: manhattan(startCell!.r, startCell!.c) }]
  let explored = 0

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f)
    const cur = open.shift()!
    const { r, c } = cur
    if (visited[r]![c]) continue
    visited[r]![c] = true
    explored++
    if (r === endCell!.r && c === endCell!.c) break
    if (showExplored.value && grid[r]![c] === PATH) {
      grid[r]![c] = EXPLORED
      if (delay > 0) {
        drawGrid()
        statExplored.value = explored
        await sleep(delay)
      }
    }
    for (const n of solverNeighbors(r, c)) {
      if (visited[n.r]![n.c]) continue
      const tentG = (gScore[r]![c] ?? Infinity) + 1
      if (tentG < (gScore[n.r]![n.c] ?? Infinity)) {
        gScore[n.r]![n.c] = tentG
        parent[n.r]![n.c] = { r, c }
        open.push({ r: n.r, c: n.c, f: tentG + manhattan(n.r, n.c) })
      }
    }
  }
  statExplored.value = explored
  return reconstructPath(parent)
}

async function solveBFS() {
  const delay = getSolveDelay()
  const visited = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
  const parent = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null as { r: number; c: number } | null),
  )
  const queue = [{ r: startCell!.r, c: startCell!.c }]
  visited[startCell!.r]![startCell!.c] = true
  let explored = 0

  while (queue.length > 0) {
    const { r, c } = queue.shift()!
    explored++
    if (r === endCell!.r && c === endCell!.c) break
    if (showExplored.value && grid[r]![c] === PATH) {
      grid[r]![c] = EXPLORED
      if (delay > 0) {
        drawGrid()
        statExplored.value = explored
        await sleep(delay)
      }
    }
    for (const n of solverNeighbors(r, c)) {
      if (!visited[n.r]![n.c]) {
        visited[n.r]![n.c] = true
        parent[n.r]![n.c] = { r, c }
        queue.push(n)
      }
    }
  }
  statExplored.value = explored
  return reconstructPath(parent)
}

async function solveDFS() {
  const delay = getSolveDelay()
  const visited = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
  const parent = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null as { r: number; c: number } | null),
  )
  const stack = [{ r: startCell!.r, c: startCell!.c }]
  let explored = 0,
    found = false

  while (stack.length > 0 && !found) {
    const { r, c } = stack.pop()!
    if (visited[r]![c]) continue
    visited[r]![c] = true
    explored++
    if (showExplored.value && grid[r]![c] === PATH) {
      grid[r]![c] = EXPLORED
      if (delay > 0) {
        drawGrid()
        statExplored.value = explored
        await sleep(delay)
      }
    }
    if (r === endCell!.r && c === endCell!.c) {
      found = true
      break
    }
    for (const n of solverNeighbors(r, c)) {
      if (!visited[n.r]![n.c]) {
        parent[n.r]![n.c] = { r, c }
        stack.push(n)
      }
    }
  }
  statExplored.value = explored
  return reconstructPath(parent)
}

async function solveDijkstra() {
  const delay = getSolveDelay()
  const dist = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Infinity))
  const parent = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null as { r: number; c: number } | null),
  )
  const visited = Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
  dist[startCell!.r]![startCell!.c] = 0
  const pq = [{ r: startCell!.r, c: startCell!.c, d: 0 }]
  let explored = 0

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d)
    const { r, c, d } = pq.shift()!
    if (visited[r]![c]) continue
    visited[r]![c] = true
    explored++
    if (r === endCell!.r && c === endCell!.c) break
    if (showExplored.value && grid[r]![c] === PATH) {
      grid[r]![c] = EXPLORED
      if (delay > 0) {
        drawGrid()
        statExplored.value = explored
        await sleep(delay)
      }
    }
    for (const n of solverNeighbors(r, c)) {
      if (!visited[n.r]![n.c] && d + 1 < (dist[n.r]![n.c] ?? Infinity)) {
        dist[n.r]![n.c] = d + 1
        parent[n.r]![n.c] = { r, c }
        pq.push({ r: n.r, c: n.c, d: d + 1 })
      }
    }
  }
  statExplored.value = explored
  return reconstructPath(parent)
}

async function animateSolution(path: { r: number; c: number }[]) {
  const delay = Math.max(5, getSolveDelay())
  for (const { r, c } of path) {
    if (!(r === startCell!.r && c === startCell!.c) && !(r === endCell!.r && c === endCell!.c)) {
      grid[r]![c] = SOLUTION
    }
    drawGrid()
    if (delay > 0) await sleep(delay * 0.6)
  }
  drawGrid()
}

function countCells() {
  let n = 0
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r]![c] !== WALL) n++
  return n
}

// ─── Lifecycle ────────────────────────────────────────────────────
onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  resizeCanvas(21, 21)
  drawPlaceholder()
})

onUnmounted(() => {
  isGenerating = false
  isSolving = false
})
</script>

<template>
  <div class="mc-bg-orbs">
    <div class="mc-orb mc-orb-1" />
    <div class="mc-orb mc-orb-2" />
    <div class="mc-orb mc-orb-3" />
  </div>

  <div class="mc-app">
    <!-- Header -->
    <header class="mc-header">
      <RouterLink to="/" class="mc-btn-back">
        <Icon icon="lucide:arrow-left" class="size-4" /> Trang chủ
      </RouterLink>
      <div class="mc-logo">
        <span class="mc-logo-icon">🌀</span>
        <span class="mc-logo-text">MazeCraft</span>
      </div>
      <p class="mc-subtitle">Tạo &amp; Giải Mê Cung Thông Minh</p>
    </header>

    <!-- Main -->
    <div class="mc-main">
      <!-- Sidebar -->
      <aside class="mc-sidebar">
        <!-- Generation -->
        <section class="mc-panel">
          <h2 class="mc-section-title">⚙️ Cài đặt mê cung</h2>
          <div class="mc-control-group">
            <label class="mc-label">
              Kích thước:
              <span class="mc-badge">{{ sizDisplay }}</span>
            </label>
            <input
              v-model.number="mazeSize"
              type="range"
              class="mc-slider"
              min="11"
              max="51"
              step="2"
              @input="onSizeInput"
            />
          </div>
          <div class="mc-control-group">
            <label class="mc-label">Thuật toán tạo mê cung</label>
            <select v-model="genAlgo" class="mc-select">
              <option value="dfs">Recursive Backtracker (DFS)</option>
              <option value="prim">Prim's Algorithm</option>
              <option value="kruskal">Kruskal's Algorithm</option>
              <option value="eller">Eller's Algorithm</option>
            </select>
          </div>
          <div class="mc-control-group">
            <label class="mc-label">
              Tốc độ tạo:
              <span class="mc-badge">{{ genSpeedLabel }}</span>
            </label>
            <input
              v-model.number="genSpeed"
              type="range"
              class="mc-slider"
              min="1"
              max="5"
              @input="onGenSpeedInput"
            />
          </div>
          <button
            class="mc-btn mc-btn-primary"
            :disabled="btnGenDisabled"
            @click="startGeneration(animateGen)"
          >
            <Icon icon="lucide:sparkles" class="size-4" /> Tạo mê cung mới
          </button>
          <button
            class="mc-btn mc-btn-secondary"
            :disabled="btnGenDisabled"
            @click="startGeneration(false)"
          >
            <Icon icon="lucide:zap" class="size-4" /> Tạo ngay lập tức
          </button>
        </section>

        <!-- Solving -->
        <section class="mc-panel">
          <h2 class="mc-section-title">🔍 Tìm đường</h2>
          <div class="mc-control-group">
            <label class="mc-label">Thuật toán tìm đường</label>
            <select v-model="solveAlgo" class="mc-select">
              <option value="astar">A* (Tìm kiếm theo heuristic)</option>
              <option value="bfs">BFS (Tìm kiếm theo chiều rộng)</option>
              <option value="dfs">DFS (Tìm kiếm theo chiều sâu)</option>
              <option value="dijkstra">Dijkstra's Algorithm</option>
            </select>
          </div>
          <div class="mc-control-group">
            <label class="mc-label">
              Tốc độ giải:
              <span class="mc-badge">{{ solveSpeedLabel }}</span>
            </label>
            <input
              v-model.number="solveSpeed"
              type="range"
              class="mc-slider"
              min="1"
              max="5"
              @input="onSolveSpeedInput"
            />
          </div>
          <button class="mc-btn mc-btn-accent" :disabled="btnSolveDisabled" @click="startSolving">
            <Icon icon="lucide:search" class="size-4" /> Tìm đường
          </button>
          <button class="mc-btn mc-btn-ghost" :disabled="btnResetDisabled" @click="resetPath()">
            <Icon icon="lucide:rotate-ccw" class="size-4" /> Xóa đường đi
          </button>
        </section>

        <!-- Stats -->
        <section class="mc-panel">
          <h2 class="mc-section-title">📊 Thống kê</h2>
          <div class="mc-stats">
            <div class="mc-stat">
              <div class="mc-stat-value">{{ statCells }}</div>
              <div class="mc-stat-label">Ô đã thăm</div>
            </div>
            <div class="mc-stat">
              <div class="mc-stat-value">{{ statPath }}</div>
              <div class="mc-stat-label">Độ dài đường</div>
            </div>
            <div class="mc-stat">
              <div class="mc-stat-value">{{ statTime }}</div>
              <div class="mc-stat-label">Thời gian</div>
            </div>
            <div class="mc-stat">
              <div class="mc-stat-value">{{ statExplored }}</div>
              <div class="mc-stat-label">Ô khám phá</div>
            </div>
          </div>
        </section>

        <!-- Display -->
        <section class="mc-panel">
          <h2 class="mc-section-title">🎨 Hiển thị</h2>
          <div class="mc-toggles">
            <label class="mc-toggle-label">
              <input v-model="showExplored" type="checkbox" class="mc-toggle-input" />
              <span class="mc-toggle-track" />
              <span class="mc-toggle-text">Hiện vùng khám phá</span>
            </label>
            <label class="mc-toggle-label">
              <input v-model="animateGen" type="checkbox" class="mc-toggle-input" />
              <span class="mc-toggle-track" />
              <span class="mc-toggle-text">Hoạt ảnh tạo mê cung</span>
            </label>
          </div>
        </section>

        <!-- Legend -->
        <div class="mc-legend">
          <h2 class="mc-section-title">🗺️ Chú thích</h2>
          <div class="mc-legend-item">
            <span class="mc-legend-color" style="background: #22d3ee" />Điểm bắt đầu (S)
          </div>
          <div class="mc-legend-item">
            <span class="mc-legend-color" style="background: #f43f5e" />Điểm kết thúc (E)
          </div>
          <div class="mc-legend-item">
            <span class="mc-legend-color" style="background: rgba(139, 92, 246, 0.35)" />Vùng đã
            khám phá
          </div>
          <div class="mc-legend-item">
            <span class="mc-legend-color" style="background: #fbbf24" />Đường ngắn nhất
          </div>
        </div>
      </aside>

      <!-- Canvas -->
      <main class="mc-canvas-area">
        <div class="mc-canvas-header">
          <div class="mc-status-bar">
            <span class="mc-status-text">{{ statusText }}</span>
            <div v-if="isSpinning" class="mc-spinner" />
          </div>
        </div>
        <div ref="canvasWrapperRef" class="mc-canvas-wrapper">
          <canvas ref="canvasRef" class="mc-canvas" />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────────── */
.mc-bg-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.mc-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: mc-orbFloat 12s ease-in-out infinite alternate;
}

.mc-orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #8b5cf6, transparent);
  top: -100px;
  left: -100px;
}

.mc-orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #06b6d4, transparent);
  bottom: -50px;
  right: -50px;
  animation-delay: -4s;
}

.mc-orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #f43f5e, transparent);
  top: 40%;
  left: 40%;
  animation-delay: -8s;
}

@keyframes mc-orbFloat {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(30px, 30px) scale(1.1);
  }
}

.mc-app {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 20px 20px;
  max-width: 1600px;
  margin: 0 auto;
  color: #f0f0ff;
  font-family: 'Outfit', 'Be Vietnam Pro', sans-serif;
  background: transparent;
}

/* ── Header ───────────────────────────────────────────── */
.mc-header {
  text-align: center;
  padding: 28px 0 20px;
  position: relative;
}

.mc-btn-back {
  position: absolute;
  top: 28px;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #9090bb;
  font-size: 0.82rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.mc-btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: #f0f0ff;
  transform: translateX(-3px);
}

.mc-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.mc-logo-icon {
  font-size: 2.2rem;
  animation: mc-spin 8s linear infinite;
}

@keyframes mc-spin {
  to {
    transform: rotate(360deg);
  }
}

.mc-logo-text {
  font-size: 2.4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.mc-subtitle {
  color: #9090bb;
  font-size: 1rem;
}

/* ── Main Layout ──────────────────────────────────────── */
.mc-main {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  flex: 1;
  align-items: start;
}

/* ── Sidebar ──────────────────────────────────────────── */
.mc-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 20px;
}

.mc-panel {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px;
  backdrop-filter: blur(10px);
  transition: border-color 0.2s ease;
}

.mc-panel:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.mc-section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #9090bb;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
}

/* ── Controls ─────────────────────────────────────────── */
.mc-control-group {
  margin-bottom: 14px;
}

.mc-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  color: #9090bb;
  margin-bottom: 8px;
  font-weight: 500;
}

.mc-badge {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
}

.mc-slider {
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  outline: none;
  cursor: pointer;
}

.mc-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  transition: transform 0.2s ease;
}

.mc-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.mc-select {
  width: 100%;
  padding: 10px 32px 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #f0f0ff;
  font-size: 0.88rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239090bb' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.mc-select option {
  background: #1a1a2e;
  color: #f0f0ff;
}
.mc-select:hover {
  border-color: rgba(255, 255, 255, 0.15);
}
.mc-select:focus {
  border-color: #8b5cf6;
}

/* ── Buttons ──────────────────────────────────────────── */
.mc-btn {
  width: 100%;
  padding: 11px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  position: relative;
  overflow: hidden;
}

.mc-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}
.mc-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.mc-btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  color: white;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35);
}
.mc-btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 30px rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

.mc-btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #9090bb;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.mc-btn-secondary:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.15);
  color: #f0f0ff;
}

.mc-btn-accent {
  background: linear-gradient(135deg, #f43f5e, #fbbf24);
  color: white;
  box-shadow: 0 4px 20px rgba(244, 63, 94, 0.3);
}
.mc-btn-accent:hover:not(:disabled) {
  box-shadow: 0 6px 30px rgba(244, 63, 94, 0.45);
  transform: translateY(-1px);
}

.mc-btn-ghost {
  background: transparent;
  color: #5a5a80;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.mc-btn-ghost:hover:not(:disabled) {
  color: #9090bb;
  border-color: rgba(255, 255, 255, 0.08);
}

/* ── Stats ────────────────────────────────────────────── */
.mc-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mc-stat {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: all 0.2s ease;
}
.mc-stat:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
}

.mc-stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #22d3ee;
  line-height: 1;
  margin-bottom: 4px;
}
.mc-stat-label {
  font-size: 0.72rem;
  color: #5a5a80;
  font-weight: 500;
}

/* ── Toggles ──────────────────────────────────────────── */
.mc-toggles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mc-toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.mc-toggle-input {
  display: none;
}

.mc-toggle-track {
  width: 38px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.mc-toggle-track::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.mc-toggle-input:checked + .mc-toggle-track {
  background: #8b5cf6;
}
.mc-toggle-input:checked + .mc-toggle-track::after {
  transform: translateX(18px);
}
.mc-toggle-text {
  font-size: 0.85rem;
  color: #9090bb;
  font-weight: 500;
}

/* ── Legend ───────────────────────────────────────────── */
.mc-legend {
  padding: 0;
}
.mc-legend .mc-section-title {
  margin-bottom: 10px;
}
.mc-legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.84rem;
  color: #9090bb;
  margin-bottom: 8px;
}
.mc-legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ── Canvas Area ──────────────────────────────────────── */
.mc-canvas-area {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mc-canvas-header {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.mc-status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mc-status-text {
  font-size: 0.88rem;
  color: #9090bb;
  font-weight: 500;
}

.mc-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: mc-spin-fast 0.6s linear infinite;
}

@keyframes mc-spin-fast {
  to {
    transform: rotate(360deg);
  }
}

.mc-canvas-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 20px;
  min-height: 500px;
}

.mc-canvas {
  border-radius: 8px;
  max-width: 100%;
  max-height: 70vh;
  box-shadow:
    0 0 40px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(139, 92, 246, 0.2);
  image-rendering: pixelated;
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 900px) {
  .mc-main {
    grid-template-columns: 1fr;
  }
  .mc-sidebar {
    position: static;
  }
  .mc-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 560px) {
  .mc-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .mc-logo-text {
    font-size: 1.8rem;
  }
  .mc-btn-back {
    position: static;
    margin-bottom: 16px;
  }
  .mc-header {
    padding-top: 16px;
  }
}
</style>
