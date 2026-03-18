export type ToolType = 'select' | 'rect' | 'circle' | 'ellipse' | 'line' | 'path' | 'polygon' | 'text' | 'image' | 'group'
export type LineCap = 'butt' | 'round' | 'square'
export type LineJoin = 'miter' | 'round' | 'bevel'
export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

export interface SvgGradient {
  id: string
  type: 'linear' | 'radial'
  stops: { offset: string; color: string; opacity?: number }[]
  x1?: string; y1?: string; x2?: string; y2?: string // For linear
  cx?: string; cy?: string; r?: string; fx?: string; fy?: string // For radial
}

export interface SvgElement {
  id: string
  type: 'rect' | 'circle' | 'ellipse' | 'line' | 'path' | 'polygon' | 'text' | 'group' | 'image'
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  rotation: number
  strokeDasharray: string
  lineCap: LineCap
  lineJoin: LineJoin
  fillRule?: 'nonzero' | 'evenodd'
  locked: boolean
  visible: boolean
  name: string
  // Common geometry
  x?: number
  y?: number
  width?: number
  height?: number
  // circle / ellipse
  cx?: number
  cy?: number
  r?: number
  rx?: number
  ry?: number
  // line
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  // path
  d?: string
  // polygon
  points?: string
  // text
  text?: string
  fontSize?: number
  fontFamily?: string
  // image
  href?: string
  // group
  children?: SvgElement[]
  transform?: string
}

export interface HistoryState {
  elements: SvgElement[]
  label: string
}

export interface GridConfig {
  enabled: boolean
  size: number
  snap: boolean
}

export function createDefaultElement(overrides: Partial<SvgElement> & { id: string; type: SvgElement['type'] }): SvgElement {
  return {
    fill: overrides.type === 'path' || overrides.type === 'line' ? 'none' : '#FF6B4A',
    stroke: overrides.type === 'path' || overrides.type === 'line' ? '#F0EDE6' : 'none',
    strokeWidth: overrides.type === 'path' || overrides.type === 'line' ? 2 : 0,
    opacity: 1,
    rotation: 0,
    strokeDasharray: '',
    lineCap: 'butt',
    lineJoin: 'miter',
    locked: false,
    visible: true,
    name: overrides.type,
    ...overrides,
  }
}

export function getBBox(el: SvgElement): { x: number; y: number; w: number; h: number } {
  let x = 0, y = 0, w = 0, h = 0

  if (el.type === 'rect' || el.type === 'text' || el.type === 'image') {
    x = el.x ?? 0; y = el.y ?? 0; w = el.width ?? 0; h = el.height ?? el.fontSize ?? 0
  } else if (el.type === 'circle' && el.cx !== undefined && el.cy !== undefined && el.r !== undefined) {
    x = el.cx - el.r; y = el.cy - el.r; w = el.r * 2; h = el.r * 2
  } else if (el.type === 'ellipse' && el.cx !== undefined && el.cy !== undefined && el.rx !== undefined && el.ry !== undefined) {
    x = el.cx - el.rx; y = el.cy - el.ry; w = el.rx * 2; h = el.ry * 2
  } else if (el.type === 'line' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    x = Math.min(el.x1, el.x2); y = Math.min(el.y1, el.y2); w = Math.abs(el.x2 - el.x1); h = Math.abs(el.y2 - el.y1)
  } else if (el.type === 'path' && el.d) {
    const commands = el.d.match(/[a-zA-Z][^a-zA-Z]*/g) || []
    let curX = 0, curY = 0
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const updateBounds = (px: number, py: number) => {
      minX = Math.min(minX, px); maxX = Math.max(maxX, px)
      minY = Math.min(minY, py); maxY = Math.max(maxY, py)
    }
    for (const cmd of commands) {
      const type = cmd[0]!
      const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
      const isRel = type === type.toLowerCase()
      const uType = type.toUpperCase()
      if (uType === 'M' || uType === 'L') {
        for (let i = 0; i < args.length; i += 2) {
          if (isRel) { curX += args[i] || 0; curY += args[i+1] || 0 }
          else { curX = args[i] || 0; curY = args[i+1] || 0 }
          updateBounds(curX, curY)
        }
      } else if (uType === 'H') {
        for (const v of args) { if (isRel) curX += v; else curX = v; updateBounds(curX, curY) }
      } else if (uType === 'V') {
        for (const v of args) { if (isRel) curY += v; else curY = v; updateBounds(curX, curY) }
      } else if (uType === 'C') {
        for (let i = 0; i < args.length; i += 6) {
          if (isRel) {
            updateBounds(curX + (args[i]||0), curY + (args[i+1]||0))
            updateBounds(curX + (args[i+2]||0), curY + (args[i+3]||0))
            curX += args[i+4] || 0; curY += args[i+5] || 0
          } else {
            updateBounds(args[i]||0, args[i+1]||0)
            updateBounds(args[i+2]||0, args[i+3]||0)
            curX = args[i+4] || 0; curY = args[i+5] || 0
          }
          updateBounds(curX, curY)
        }
      } else if (uType === 'S' || uType === 'Q') {
        for (let i = 0; i < args.length; i += 4) {
          if (isRel) {
            updateBounds(curX + (args[i]||0), curY + (args[i+1]||0))
            curX += args[i+2] || 0; curY += args[i+3] || 0
          } else {
            updateBounds(args[i]||0, args[i+1]||0)
            curX = args[i+2] || 0; curY = args[i+3] || 0
          }
          updateBounds(curX, curY)
        }
      } else if (uType === 'T') {
        for (let i = 0; i < args.length; i += 2) {
          if (isRel) { curX += args[i] || 0; curY += args[i+1] || 0 }
          else { curX = args[i] || 0; curY = args[i+1] || 0 }
          updateBounds(curX, curY)
        }
      } else if (uType === 'Z') {
        // Close path doesn't move curX/curY for bbox purposes usually
      }
    }
    if (minX !== Infinity) { x = minX; y = minY; w = maxX - minX; h = maxY - minY }
  } else if (el.type === 'polygon' && el.points) {
    const pts = el.points.split(/[\s,]+/).map(Number)
    if (pts.length >= 2) {
      let minX = pts[0]!, minY = pts[1]!, maxX = pts[0]!, maxY = pts[1]!
      for (let i = 0; i < pts.length; i += 2) {
        if (pts[i] !== undefined) { minX = Math.min(minX, pts[i]!); maxX = Math.max(maxX, pts[i]!) }
        if (pts[i+1] !== undefined) { minY = Math.min(minY, pts[i+1]!); maxY = Math.max(maxY, pts[i+1]!) }
      }
      x = minX; y = minY; w = maxX - minX; h = maxY - minY
    }
  } else if (el.type === 'group' && el.children) {
    if (el.children.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const child of el.children) {
        const b = getBBox(child)
        minX = Math.min(minX, b.x)
        minY = Math.min(minY, b.y)
        maxX = Math.max(maxX, b.x + b.w)
        maxY = Math.max(maxY, b.y + b.h)
      }
      x = minX; y = minY; w = maxX - minX; h = maxY - minY
    }
  }

  // Handle transforms (translate, scale)
  if (el.transform) {
    const transformMatches = el.transform.match(/(\w+)\(([^)]+)\)/g) || []
    // Apply from RIGHT to LEFT
    for (let i = transformMatches.length - 1; i >= 0; i--) {
      const t = transformMatches[i]!
      const type = t.split('(')[0]!
      const args = (t.match(/\(([^)]+)\)/)?.[1] || '').split(/[\s,]+/).map(parseFloat)
      
      if (type === 'scale') {
        const sx = isNaN(args[0]!) ? 1 : args[0]!
        const sy = isNaN(args[1]!) ? sx : args[1]!
        x *= sx; y *= sy; w = Math.abs(w * sx); h = Math.abs(h * sy)
      } else if (type === 'translate') {
        x += args[0] || 0
        y += args[1] || 0
      }
    }
  }

  return { x, y, w, h }
}
