import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { SvgElement, SvgGradient, ToolType, LineCap, LineJoin, AlignType, GridConfig } from '../types'
import { createDefaultElement, getBBox } from '../types'

export function useSvgEditor() {
  const elements = useStorage<SvgElement[]>('svg-editor-elements', [])
  const gradients = useStorage<SvgGradient[]>('svg-editor-gradients', [])
  
  const history = ref<SvgElement[][]>([JSON.parse(JSON.stringify(elements.value))])
  const historyIndex = ref(0)
  
  const selectedIds = ref<Set<string>>(new Set())
  const activeTool = ref<ToolType>('select')
  
  // Style defaults
  const fillColor = ref('#FF6B4A')
  const strokeColor = ref('#F0EDE6')
  const strokeWidth = ref(2)
  const elementOpacity = ref(1)
  const fontSize = ref(24)
  const strokeDasharray = ref('')
  const lineCap = ref<LineCap>('butt')
  const lineJoin = ref<LineJoin>('miter')
  
  // Canvas state
  const zoom = ref(1)
  const panX = ref(0)
  const panY = ref(0)
  const grid = ref<GridConfig>({
    enabled: true,
    size: 20,
    snap: true,
  })

  const selectedElement = computed(() => {
    if (selectedIds.value.size !== 1) return null
    const id = Array.from(selectedIds.value)[0]
    return elements.value.find((el) => el.id === id) || null
  })

  const selectedElements = computed(() => {
    return elements.value.filter((el) => selectedIds.value.has(el.id))
  })

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function generateId() {
    return Math.random().toString(36).substring(2, 9)
  }

  function snapToGrid(val: number) {
    if (!grid.value.enabled || !grid.value.snap) return val
    return Math.round(val / grid.value.size) * grid.value.size
  }

  function commitUpdate(_label: string = 'Update') {
    const currentState = JSON.parse(JSON.stringify(elements.value))
    if (JSON.stringify(currentState) === JSON.stringify(history.value[historyIndex.value])) return

    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(currentState)
    if (history.value.length > 50) history.value.shift()
    else historyIndex.value++
  }

  function undo() {
    if (canUndo.value) {
      historyIndex.value--
      elements.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  function redo() {
    if (canRedo.value) {
      historyIndex.value++
      elements.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
    }
  }

  function addElement(el: SvgElement) {
    elements.value.push(el)
    selectedIds.value = new Set([el.id])
    commitUpdate('Thêm đối tượng')
  }

  function setElements(newEls: SvgElement[]) {
    elements.value = newEls
    commitUpdate('Import')
  }

  function deleteSelected() {
    if (selectedIds.value.size === 0) return
    elements.value = elements.value.filter((el) => !selectedIds.value.has(el.id))
    selectedIds.value = new Set()
    commitUpdate('Xoá')
  }

  function duplicateSelected() {
    const newItems: SvgElement[] = []
    selectedElements.value.forEach((el) => {
      const copy = JSON.parse(JSON.stringify(el))
      copy.id = generateId()
      if (copy.x !== undefined) copy.x += 20
      if (copy.y !== undefined) copy.y += 20
      if (copy.cx !== undefined) copy.cx += 20
      if (copy.cy !== undefined) copy.cy += 20
      if (copy.x1 !== undefined && copy.y1 !== undefined && copy.x2 !== undefined && copy.y2 !== undefined) {
        copy.x1 += 20; copy.y1 += 20; copy.x2 += 20; copy.y2 += 20
      }
      newItems.push(copy)
    })
    elements.value.push(...newItems)
    selectedIds.value = new Set(newItems.map((n) => n.id))
    commitUpdate('Nhân bản')
  }

  function moveUp() {
    const ids = Array.from(selectedIds.value)
    ids.forEach((id) => {
      const idx = elements.value.findIndex((el) => el.id === id)
      if (idx < elements.value.length - 1) {
        const temp = elements.value[idx]
        if (temp) {
          elements.value.splice(idx, 1)
          elements.value.splice(idx + 1, 0, temp)
        }
      }
    })
    commitUpdate('Chuyển lên')
  }

  function moveDown() {
    const ids = Array.from(selectedIds.value)
    ids.forEach((id) => {
      const idx = elements.value.findIndex((el) => el.id === id)
      if (idx > 0) {
        const temp = elements.value[idx]
        if (temp) {
          elements.value.splice(idx, 1)
          elements.value.splice(idx - 1, 0, temp)
        }
      }
    })
    commitUpdate('Chuyển xuống')
  }

  function clearAll() {
    elements.value = []
    gradients.value = []
    selectedIds.value = new Set()
    commitUpdate('Xoá tất cả')
  }

  function updateSelected(updates: Partial<SvgElement>) {
    elements.value = elements.value.map((el) => {
      if (selectedIds.value.has(el.id)) {
        return { ...el, ...updates }
      }
      return el
    })
  }

  function moveElement(id: string, dx: number, dy: number) {
    elements.value = elements.value.map((el) => {
      if (el.id === id) {
        const copy = { ...el }
        if (copy.x !== undefined) copy.x += dx
        if (copy.y !== undefined) copy.y += dy
        if (copy.cx !== undefined) copy.cx += dx
        if (copy.cy !== undefined) copy.cy += dy
        if (copy.x1 !== undefined && copy.y1 !== undefined && copy.x2 !== undefined && copy.y2 !== undefined) {
          copy.x1 += dx; copy.y1 += dy; copy.x2 += dx; copy.y2 += dy
        }
        return copy
      }
      return el
    })
  }

  function alignElements(type: AlignType) {
    if (selectedIds.value.size < 2) return
    const sel = selectedElements.value
    const boxes = sel.map((el) => ({ id: el.id, box: getBBox(el) }))
    
    let target = 0
    if (type === 'left') target = Math.min(...boxes.map((b) => b.box.x))
    if (type === 'right') target = Math.max(...boxes.map((b) => b.box.x + b.box.w))
    if (type === 'top') target = Math.min(...boxes.map((b) => b.box.y))
    if (type === 'bottom') target = Math.max(...boxes.map((b) => b.box.y + b.box.h))
    if (type === 'center') {
      const minX = Math.min(...boxes.map((b) => b.box.x))
      const maxX = Math.max(...boxes.map((b) => b.box.x + b.box.w))
      target = minX + (maxX - minX) / 2
    }
    if (type === 'middle') {
      const minY = Math.min(...boxes.map((b) => b.box.y))
      const maxY = Math.max(...boxes.map((b) => b.box.y + b.box.h))
      target = minY + (maxY - minY) / 2
    }

    elements.value = elements.value.map((el) => {
      if (!selectedIds.value.has(el.id)) return el
      const b = getBBox(el)
      const copy = { ...el }
      if (type === 'left') {
        const dx = target - b.x
        return applyOffset(copy, dx, 0)
      }
      if (type === 'right') {
        const dx = target - (b.x + b.w)
        return applyOffset(copy, dx, 0)
      }
      if (type === 'top') {
        const dy = target - b.y
        return applyOffset(copy, 0, dy)
      }
      if (type === 'bottom') {
        const dy = target - (b.y + b.h)
        return applyOffset(copy, 0, dy)
      }
      if (type === 'center') {
        const dx = target - (b.x + b.w / 2)
        return applyOffset(copy, dx, 0)
      }
      if (type === 'middle') {
        const dy = target - (b.y + b.h / 2)
        return applyOffset(copy, 0, dy)
      }
      return el
    })
    commitUpdate('Căn chỉnh')
  }

  function applyOffset(el: SvgElement, dx: number, dy: number): SvgElement {
    if (el.x !== undefined) el.x += dx
    if (el.y !== undefined) el.y += dy
    if (el.cx !== undefined) el.cx += dx
    if (el.cy !== undefined) el.cy += dy
    if (el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
      el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy
    }
    return el
  }

  function groupSelected() {
    if (selectedIds.value.size < 2) return
    const sel = selectedElements.value
    const id = generateId()
    const group: SvgElement = createDefaultElement({
      id, type: 'group', children: JSON.parse(JSON.stringify(sel)),
    })
    elements.value = elements.value.filter((el) => !selectedIds.value.has(el.id))
    elements.value.push(group)
    selectedIds.value = new Set([id])
    commitUpdate('Nhóm')
  }

  function ungroupSelected() {
    if (selectedIds.value.size !== 1) return
    const el = selectedElement.value
    if (!el || el.type !== 'group' || !el.children) return
    const children = JSON.parse(JSON.stringify(el.children)) as SvgElement[]
    elements.value = elements.value.filter((e) => e.id !== el.id)
    elements.value.push(...children)
    selectedIds.value = new Set(children.map((c) => c.id))
    commitUpdate('Bỏ nhóm')
  }

  function toggleVisibility(id: string) {
    elements.value = elements.value.map((el) => el.id === id ? { ...el, visible: !el.visible } : el)
  }

  function toggleLock(id: string) {
    elements.value = elements.value.map((el) => el.id === id ? { ...el, locked: !el.locked } : el)
  }

  function renameElement(id: string, name: string) {
    elements.value = elements.value.map((el) => el.id === id ? { ...el, name } : el)
  }

  // --- Export ---
  function exportSvg() {
    const svgContent = elements.value.map(el => elementToSvg(el)).join('\n  ')
    const gradientContent = gradients.value.map(g => gradientToSvg(g)).join('\n  ')
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">
  <defs>
    ${gradientContent}
  </defs>
  ${svgContent}
</svg>`
  }

  function gradientToSvg(g: SvgGradient): string {
    const stops = g.stops.map(s => `<stop offset="${s.offset}" stop-color="${s.color}" ${s.opacity !== undefined ? `stop-opacity="${s.opacity}"` : ''} />`).join('')
    if (g.type === 'linear') {
      return `<linearGradient id="${g.id}" x1="${g.x1 || '0%'}" y1="${g.y1 || '0%'}" x2="${g.x2 || '100%'}" y2="${g.y2 || '100%'}">${stops}</linearGradient>`
    }
    return `<radialGradient id="${g.id}" cx="${g.cx || '50%'}" cy="${g.cy || '50%'}" r="${g.r || '50%'}">${stops}</radialGradient>`
  }

  function elementToSvg(el: SvgElement): string {
    const attrs: string[] = []
    const push = (k: string, v: string | number | undefined) => attrs.push(`${k}="${v}"`)
    
    push('fill', el.fill)
    push('stroke', el.stroke)
    push('stroke-width', el.strokeWidth)
    push('opacity', el.opacity)
    if (el.strokeDasharray) push('stroke-dasharray', el.strokeDasharray)
    if (el.lineCap !== 'butt') push('stroke-linecap', el.lineCap)
    if (el.lineJoin !== 'miter') push('stroke-linejoin', el.lineJoin)
    if (el.fillRule) push('fill-rule', el.fillRule)

    const transforms: string[] = []
    if (el.transform) transforms.push(el.transform)
    if (el.rotation) {
      const b = getBBox(el)
      transforms.push(`rotate(${el.rotation} ${b.x + b.w / 2} ${b.y + b.h / 2})`)
    }
    if (transforms.length > 0) push('transform', transforms.join(' '))

    if (el.type === 'rect') return `<rect ${attrs.join(' ')} x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" />`
    if (el.type === 'circle') return `<circle ${attrs.join(' ')} cx="${el.cx}" cy="${el.cy}" r="${el.r}" />`
    if (el.type === 'ellipse') return `<ellipse ${attrs.join(' ')} cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}" />`
    if (el.type === 'line') return `<line ${attrs.join(' ')} x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" />`
    if (el.type === 'path') return `<path ${attrs.join(' ')} d="${el.d}" />`
    if (el.type === 'polygon') return `<polygon ${attrs.join(' ')} points="${el.points}" />`
    if (el.type === 'text') return `<text ${attrs.join(' ')} x="${el.x}" y="${el.y}" font-size="${el.fontSize}" font-family="${el.fontFamily}">${el.text}</text>`
    if (el.type === 'image') return `<image ${attrs.join(' ')} x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" href="${el.href}" />`
    if (el.type === 'group' && el.children) {
      const inner = el.children.map(c => elementToSvg(c)).join('\n    ')
      return `<g ${attrs.join(' ')}>\n    ${inner}\n  </g>`
    }
    return ''
  }

  // --- Import ---
  function importSvg(code: string): boolean {
    const parser = new DOMParser()
    try {
      const doc = parser.parseFromString(code, 'image/svg+xml')
      const svg = doc.querySelector('svg')
      if (!svg) return false

      const vbAttr = svg.getAttribute('viewBox')
      const vb = vbAttr ? vbAttr.split(/[\s,]+/).map(Number).filter(n => !isNaN(n)) : null
      
      let vbW = 800, vbH = 600
      if (vb && vb.length >= 4) {
        vbW = vb[2] ?? 800
        vbH = vb[3] ?? 600
      } else {
        vbW = numVal(svg.getAttribute('width') || '800')
        vbH = numVal(svg.getAttribute('height') || '600')
      }

      const scale = Math.min(800 / vbW, 600 / vbH, 10) 
      const translateX = (800 - vbW * scale) / 2 - (vb?.[0] || 0) * scale
      const translateY = (600 - vbH * scale) / 2 - (vb?.[1] || 0) * scale

      // Parse Gradients
      const newGradients: SvgGradient[] = []
      const gradEls = doc.querySelectorAll('linearGradient, radialGradient')
      gradEls.forEach(gel => {
        const id = gel.getAttribute('id')
        if (!id) return
        const type = gel.tagName.toLowerCase() === 'lineargradient' ? 'linear' : 'radial'
        const stops = Array.from(gel.querySelectorAll('stop')).map(s => ({
          offset: s.getAttribute('offset') || '0%',
          color: s.getAttribute('stop-color') || '#000',
          opacity: s.getAttribute('stop-opacity') ? Number(s.getAttribute('stop-opacity')) : undefined
        }))
        const g: SvgGradient = { id, type, stops }
        if (type === 'linear') {
          g.x1 = gel.getAttribute('x1') || undefined
          g.y1 = gel.getAttribute('y1') || undefined
          g.x2 = gel.getAttribute('x2') || undefined
          g.y2 = gel.getAttribute('y2') || undefined
        } else {
          g.cx = gel.getAttribute('cx') || undefined
          g.cy = gel.getAttribute('cy') || undefined
          g.r = gel.getAttribute('r') || undefined
        }
        newGradients.push(g)
      })
      gradients.value = newGradients

      const getRootAttr = (name: string) => svg.getAttribute(name)

      const newElements: SvgElement[] = []
      const initialState: ParseState = {
        fill: getRootAttr('fill') || 'black',
        stroke: getRootAttr('stroke') || 'none',
        strokeWidth: numVal(getRootAttr('stroke-width') || '0'),
        opacity: getRootAttr('opacity') ? Number(getRootAttr('opacity')) : 1,
        fillRule: (getRootAttr('fill-rule') === 'evenodd') ? 'evenodd' : 'nonzero',
        scale,
        translateX,
        translateY,
        isRoot: true,
      }

      parseChildren(svg, newElements, initialState)

      if (newElements.length === 0) return false
      setElements(newElements)
      return true
    } catch (err) {
      console.error('Import error:', err)
      return false
    }
  }

  interface ParseState {
    fill: string
    stroke: string
    strokeWidth: number
    opacity: number
    fillRule: 'nonzero' | 'evenodd'
    scale: number
    translateX: number
    translateY: number
    isRoot: boolean
  }

  function parseChildren(parent: Element, out: SvgElement[], state: ParseState) {
    for (const child of Array.from(parent.children)) {
      const tag = child.tagName.toLowerCase()
      if (['defs', 'title', 'desc', 'metadata', 'style'].includes(tag)) continue

      const elState = getElementState(child, state)
      const el = parseSvgElement(child, tag, { ...elState, isRoot: state.isRoot })
      if (el) out.push(el)
    }
  }

  function getElementState(child: Element, parentState: ParseState): ParseState {
    const styleStr = child.getAttribute('style') || ''
    const style: Record<string, string> = {}
    styleStr.split(';').forEach((s) => {
      const parts = s.split(':').map((x) => x.trim())
      if (parts[0] && parts[1]) style[parts[0]] = parts[1]
    })

    const getAttr = (name: string) => child.getAttribute(name) || style[name]

    let fill = getAttr('fill')
    if (fill === 'currentColor') fill = fillColor.value
    fill = fill || parentState.fill

    let stroke = getAttr('stroke')
    if (stroke === 'currentColor') stroke = strokeColor.value
    stroke = stroke || parentState.stroke

    const swAttr = getAttr('stroke-width')
    const strokeWidth = swAttr ? numVal(swAttr) : parentState.strokeWidth
    const opacityAttr = getAttr('opacity')
    const opacity = opacityAttr ? Number(opacityAttr) : parentState.opacity
    
    const frAttr = getAttr('fill-rule')
    const fillRule = (frAttr === 'evenodd' || frAttr === 'nonzero') ? frAttr : parentState.fillRule

    return { fill, stroke, strokeWidth, opacity, fillRule, scale: parentState.scale, translateX: parentState.translateX, translateY: parentState.translateY, isRoot: false }
  }

  function parseSvgElement(child: Element, tag: string, state: ParseState): SvgElement | null {
    const transform = child.getAttribute('transform') || ''
    
    let finalTransform = transform
    if (state.isRoot) {
      const prefix = `translate(${state.translateX}, ${state.translateY}) scale(${state.scale})`
      finalTransform = finalTransform ? `${prefix} ${finalTransform}` : prefix
    }

    const base: SvgElement = {
      id: generateId(),
      type: 'rect', // placeholder
      fill: state.fill,
      stroke: state.stroke,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
      fillRule: state.fillRule,
      rotation: 0,
      strokeDasharray: child.getAttribute('stroke-dasharray') ?? '',
      lineCap: (child.getAttribute('stroke-linecap') ?? 'butt') as LineCap,
      lineJoin: (child.getAttribute('stroke-linejoin') ?? 'miter') as LineJoin,
      locked: false,
      visible: true,
      name: child.getAttribute('id') || tag,
      transform: finalTransform || undefined,
    }

    if (tag === 'rect') return { ...base, type: 'rect', x: num(child, 'x'), y: num(child, 'y'), width: num(child, 'width'), height: num(child, 'height') }
    if (tag === 'circle') return { ...base, type: 'circle', cx: num(child, 'cx'), cy: num(child, 'cy'), r: num(child, 'r') }
    if (tag === 'ellipse') return { ...base, type: 'ellipse', cx: num(child, 'cx'), cy: num(child, 'cy'), rx: num(child, 'rx'), ry: num(child, 'ry') }
    if (tag === 'line') return { ...base, type: 'line', x1: num(child, 'x1'), y1: num(child, 'y1'), x2: num(child, 'x2'), y2: num(child, 'y2') }
    if (tag === 'path') return { ...base, type: 'path', d: child.getAttribute('d') ?? '' }
    if (tag === 'polygon' || tag === 'polyline') return { ...base, type: 'polygon', points: child.getAttribute('points') ?? '' }
    if (tag === 'image') return { ...base, type: 'image', x: num(child, 'x'), y: num(child, 'y'), width: num(child, 'width'), height: num(child, 'height'), href: child.getAttribute('href') || child.getAttribute('xlink:href') || '' }
    if (tag === 'text') {
      return {
        ...base,
        type: 'text',
        x: num(child, 'x'),
        y: num(child, 'y'),
        text: child.textContent ?? '',
        fontSize: num(child, 'font-size') || 16,
        fontFamily: child.getAttribute('font-family') ?? 'sans-serif',
      }
    }
    if (tag === 'g') {
      const children: SvgElement[] = []
      parseChildren(child, children, { ...state, isRoot: false })
      if (children.length === 0) return null
      return { ...base, type: 'group', children }
    }
    return null
  }

  function num(el: Element, attr: string): number {
    return numVal(el.getAttribute(attr) || '0')
  }

  function numVal(val: string): number {
    if (!val) return 0
    const n = parseFloat(val.replace(/[^\d.-]/g, ''))
    return isNaN(n) ? 0 : n
  }

  // Zoom
  function zoomIn() {
    zoom.value = Math.min(zoom.value * 1.2, 5)
  }
  function zoomOut() {
    zoom.value = Math.max(zoom.value / 1.2, 0.2)
  }
  function zoomFit() {
    zoom.value = 1
    panX.value = 0
    panY.value = 0
  }

  // Import Image (Raster)
  function importImage(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        const el = createDefaultElement({
          id: generateId(),
          type: 'image',
          href: dataUrl,
          x: (800 - img.width) / 2,
          y: (600 - img.height) / 2,
          width: img.width,
          height: img.height,
        })
        if (el.width && el.width > 600) {
          const ratio = 600 / el.width
          el.width *= ratio
          el.height = (el.height ?? 0) * ratio
        }
        addElement(el)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  return {
    elements, gradients, selectedIds, selectedElement, selectedElements,
    activeTool, fillColor, strokeColor, strokeWidth, elementOpacity, fontSize,
    strokeDasharray, lineCap, lineJoin,
    zoom, panX, panY, grid,
    history, historyIndex, canUndo, canRedo,
    undo, redo, generateId, snapToGrid,
    addElement, setElements, deleteSelected, duplicateSelected,
    moveUp, moveDown, clearAll,
    updateSelected, commitUpdate,
    alignElements, moveElement,
    groupSelected, ungroupSelected,
    toggleVisibility, toggleLock, renameElement,
    exportSvg, importSvg, importImage,
    zoomIn, zoomOut, zoomFit,
    createDefaultElement,
  }
}
