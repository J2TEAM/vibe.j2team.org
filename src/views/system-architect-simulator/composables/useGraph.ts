import { ref, computed } from 'vue'
import type { NodeData, EdgeData, NodeType, Template } from '../types'
import { nodeTypeMap } from '../constants'
import { getNodeCost } from '../utils'

export function useGraph() {
  const zoomLevel = ref(1)
  const zoomIn = () => {
    zoomLevel.value = Math.min(2, zoomLevel.value + 0.1)
  }
  const zoomOut = () => {
    zoomLevel.value = Math.max(0.3, zoomLevel.value - 0.1)
  }
  const resetZoom = () => {
    zoomLevel.value = 1
    panOffset.value = { x: 0, y: 0 }
  }

  const panOffset = ref({ x: 0, y: 0 })
  const isPanning = ref(false)
  const panStartPos = { x: 0, y: 0 }

  const nodes = ref<NodeData[]>([])
  const edges = ref<EdgeData[]>([])
  const nextId = ref(1)

  const selectedNodeId = ref<string | null>(null)
  const selectedNode = computed(() => nodes.value.find((n) => n.id === selectedNodeId.value))

  const totalMonthlyCost = computed(() => nodes.value.reduce((sum, n) => sum + getNodeCost(n), 0))

  const getNodeConnections = (nodeId: string) =>
    edges.value.filter((e) => e.fromNodeId === nodeId || e.toNodeId === nodeId).length
  const getConnectedEdges = (nodeId: string) =>
    edges.value.filter((e) => e.fromNodeId === nodeId || e.toNodeId === nodeId)

  const deleteSelectedNode = () => {
    if (!selectedNodeId.value) return
    edges.value = edges.value.filter(
      (e) => e.fromNodeId !== selectedNodeId.value && e.toNodeId !== selectedNodeId.value,
    )
    nodes.value = nodes.value.filter((n) => n.id !== selectedNodeId.value)
    selectedNodeId.value = null
  }

  const deleteEdge = (edgeId: string) => {
    edges.value = edges.value.filter((e) => e.id !== edgeId)
  }
  const clearCanvas = () => {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    nextId.value = 1
    panOffset.value = { x: 0, y: 0 }
    zoomLevel.value = 1
  }

  // Panning
  const startPan = (event: MouseEvent) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    // Only pan if clicking squarely on the canvas background, not on nodes/edges/ports
    if (!target.closest('.canvas-node') && !target.closest('svg')) {
      isPanning.value = true
      panStartPos.x = event.clientX - panOffset.value.x
      panStartPos.y = event.clientY - panOffset.value.y
    }
  }

  const onPan = (event: MouseEvent) => {
    if (!isPanning.value) return
    panOffset.value.x = event.clientX - panStartPos.x
    panOffset.value.y = event.clientY - panStartPos.y
  }

  const stopPan = () => {
    isPanning.value = false
  }

  // Dragging
  const draggedNodeId = ref<string | null>(null)
  const canvasRef = ref<HTMLElement | null>(null)
  const dragOffset = { x: 0, y: 0 }

  const onNodeDrag = (event: MouseEvent) => {
    if (!draggedNodeId.value) return
    const node = nodes.value.find((n) => n.id === draggedNodeId.value)
    const r = canvasRef.value?.getBoundingClientRect()
    if (node && r) {
      node.x = (event.clientX - r.left - panOffset.value.x) / zoomLevel.value - dragOffset.x
      node.y = (event.clientY - r.top - panOffset.value.y) / zoomLevel.value - dragOffset.y
    }
  }

  const stopNodeDrag = () => {
    draggedNodeId.value = null
    window.removeEventListener('mousemove', onNodeDrag)
    window.removeEventListener('mouseup', stopNodeDrag)
  }

  const startNodeDrag = (event: MouseEvent, node: NodeData) => {
    if (event.button !== 0 || (event.target as HTMLElement).classList.contains('port')) return
    draggedNodeId.value = node.id
    const r = canvasRef.value?.getBoundingClientRect()
    if (r) {
      dragOffset.x = (event.clientX - r.left - panOffset.value.x) / zoomLevel.value - node.x
      dragOffset.y = (event.clientY - r.top - panOffset.value.y) / zoomLevel.value - node.y
    }
    window.addEventListener('mousemove', onNodeDrag)
    window.addEventListener('mouseup', stopNodeDrag)
  }

  // Wiring
  const wiringFromNodeId = ref<string | null>(null)
  const activeWireEnd = ref<{ x: number; y: number } | null>(null)
  const NODE_WIDTH = 180

  const startWiring = (event: MouseEvent, nodeId: string, type: 'in' | 'out') => {
    if (event.button !== 0 || type !== 'out') return
    event.stopPropagation()
    wiringFromNodeId.value = nodeId
    const onMove = (e: MouseEvent) => {
      const r = canvasRef.value?.getBoundingClientRect()
      if (r)
        activeWireEnd.value = {
          x: (e.clientX - r.left - panOffset.value.x) / zoomLevel.value,
          y: (e.clientY - r.top - panOffset.value.y) / zoomLevel.value,
        }
    }
    const onUp = () => {
      wiringFromNodeId.value = null
      activeWireEnd.value = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    onMove(event)
  }

  const finishWiring = (nodeId: string, type: 'in' | 'out') => {
    if (type === 'in' && wiringFromNodeId.value && wiringFromNodeId.value !== nodeId) {
      if (
        !edges.value.find(
          (e) =>
            (e.fromNodeId === wiringFromNodeId.value && e.toNodeId === nodeId) ||
            (e.fromNodeId === nodeId && e.toNodeId === wiringFromNodeId.value),
        )
      ) {
        edges.value.push({
          id: `ED-${Date.now()}`,
          fromNodeId: wiringFromNodeId.value,
          toNodeId: nodeId,
        })
      }
    }
  }

  const generateBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    // SVG is naturally absolutely positioned mapping to node coords.
    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60)
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }
  const getNodeMidY = (n: NodeData) => n.y + 55

  const activeWirePath = computed(() => {
    if (!wiringFromNodeId.value || !activeWireEnd.value) return ''
    const f = nodes.value.find((n) => n.id === wiringFromNodeId.value)
    if (!f) return ''
    return generateBezierPath(
      f.x + NODE_WIDTH,
      getNodeMidY(f),
      activeWireEnd.value.x,
      activeWireEnd.value.y,
    )
  })

  interface RenderedEdge {
    id: string
    path: string
    traffic: number
    midX: number
    midY: number
    isOverloaded: boolean
  }

  const renderedEdges = computed<RenderedEdge[]>(() => {
    return edges.value
      .map((edge) => {
        const f = nodes.value.find((n) => n.id === edge.fromNodeId)
        const t = nodes.value.find((n) => n.id === edge.toNodeId)
        if (!f || !t)
          return { id: edge.id, path: '', traffic: 0, midX: 0, midY: 0, isOverloaded: false }
        const x1 = f.x + NODE_WIDTH,
          y1 = getNodeMidY(f),
          x2 = t.x,
          y2 = getNodeMidY(t)
        return {
          id: edge.id,
          path: generateBezierPath(x1, y1, x2, y2),
          traffic: edge.traffic || 0,
          midX: (x1 + x2) / 2,
          midY: (y1 + y2) / 2,
          isOverloaded: !!t.isOverloaded,
        }
      })
      .filter((e): e is RenderedEdge => e.path !== '')
  })

  // Drop
  const onDragStart = (event: DragEvent, type: NodeType) => {
    event.dataTransfer?.setData('application/json', JSON.stringify(type))
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
  }

  const onDrop = (event: DragEvent) => {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) return
    try {
      const type = JSON.parse(data) as NodeType
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const config: Record<string, string | number | boolean | undefined> = {
        latency: type.defaultLatency,
        replicas: type.defaultReplicas,
        baseErrorRate: type.defaultErrorRate,
        ...(type.type === 'CLIENT' ? { inputTraffic: 1000, readPercent: 70 } : {}),
        ...(type.type === 'RATELIMIT' ? { rateLimit: 5000 } : {}),
        ...(type.type !== 'CLIENT' && type.type !== 'RATELIMIT' ? { instanceTier: 'micro' } : {}),
      }
      nodes.value.push({
        id: `ND-${String(nextId.value++).padStart(2, '0')}`,
        type: type.type,
        x: Math.max(0, (event.clientX - rect.left - panOffset.value.x) / zoomLevel.value - 90),
        y: Math.max(0, (event.clientY - rect.top - panOffset.value.y) / zoomLevel.value - 55),
        config,
      })
    } catch (e) {
      console.error(e)
    }
  }

  const loadTemplate = (tpl: Template) => {
    clearCanvas()
    tpl.nodes.forEach((n, i) => {
      const typeDef = nodeTypeMap[n.type]
      const config: Record<string, string | number | boolean | undefined> = {
        latency: typeDef?.defaultLatency || 10,
        replicas: typeDef?.defaultReplicas || 1,
        baseErrorRate: typeDef?.defaultErrorRate || 0,
        ...(n.type === 'CLIENT' ? { inputTraffic: 1000, readPercent: 70 } : {}),
        ...(n.type === 'RATELIMIT' ? { rateLimit: 5000 } : {}),
        ...(n.type !== 'CLIENT' && n.type !== 'RATELIMIT' ? { instanceTier: 'micro' } : {}),
        ...n.config,
      }
      nodes.value.push({
        id: `ND-${String(i + 1).padStart(2, '0')}`,
        type: n.type,
        x: n.x,
        y: n.y,
        config,
      })
    })
    nextId.value = tpl.nodes.length + 1
    tpl.edges.forEach((e) => {
      edges.value.push({
        id: `ED-${Date.now()}-${Math.random()}`,
        fromNodeId: nodes.value[e.from]!.id,
        toNodeId: nodes.value[e.to]!.id,
      })
    })
  }

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    panOffset,
    isPanning,
    startPan,
    onPan,
    stopPan,
    nodes,
    edges,
    nextId,
    selectedNodeId,
    selectedNode,
    draggedNodeId,
    canvasRef,
    totalMonthlyCost,
    getNodeConnections,
    getConnectedEdges,
    deleteSelectedNode,
    deleteEdge,
    clearCanvas,
    startNodeDrag,
    onDragStart,
    onDrop,
    wiringFromNodeId,
    activeWireEnd,
    activeWirePath,
    renderedEdges,
    startWiring,
    finishWiring,
    loadTemplate,
  }
}
