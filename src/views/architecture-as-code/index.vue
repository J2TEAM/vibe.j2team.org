<script setup lang="ts">
import { computed, onUnmounted, ref, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

type SystemType =
  | 'kafka'
  | 'airflow'
  | 'spark'
  | 'redis'
  | 'postgres'
  | 's3'
  | 'circle'
  | 'square'
  | 'triangle'
  | 'tetrahedron'
type CanvasMode = 'select' | 'pan' | 'connect'
type PreviewTab = 'mermaid' | 'yaml'
type EdgeKind = 'line' | 'flowchart' | 'crowfoot'

interface DiagramNode {
  id: string
  type: SystemType
  x: number
  y: number
  label: string
  width: number
  height: number
}
interface DiagramEdge {
  id: string
  fromId: string
  toId: string
  kind: EdgeKind
}
interface DiagramSnapshot {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}
interface Viewport {
  x: number
  y: number
  scale: number
}
interface EdgePath extends DiagramEdge {
  path: string
  markerEnd?: string
  dashArray?: string
}

type SyncMessage =
  | { type: 'snapshot'; payload: DiagramSnapshot }
  | { type: 'diagram:replace'; payload: DiagramSnapshot }
  | { type: 'node:create'; payload: DiagramNode }
  | { type: 'node:update-position'; payload: { id: string; x: number; y: number } }
  | { type: 'node:update-label'; payload: { id: string; label: string } }
  | { type: 'node:update-size'; payload: { id: string; width: number; height: number } }
  | { type: 'node:delete'; payload: { id: string } }
  | { type: 'edge:create'; payload: DiagramEdge }
  | { type: 'edge:delete'; payload: { id: string } }

const NODE_WIDTH = 180
const NODE_HEIGHT = 72
const GRID_SIZE = 24
const MIN_SCALE = 0.45
const MAX_SCALE = 2.2
const SVG_NS = 'http://www.w3.org/2000/svg'

const SYSTEMS: Array<{ type: SystemType; label: string; tone: string }> = [
  { type: 'kafka', label: 'Kafka', tone: 'text-accent-coral' },
  { type: 'airflow', label: 'Airflow', tone: 'text-accent-amber' },
  { type: 'spark', label: 'Spark', tone: 'text-accent-sky' },
  { type: 'redis', label: 'Redis', tone: 'text-accent-coral' },
  { type: 'postgres', label: 'Postgres', tone: 'text-accent-amber' },
  { type: 's3', label: 'S3', tone: 'text-accent-sky' },
  { type: 'circle', label: 'Circle', tone: 'text-accent-coral' },
  { type: 'square', label: 'Square', tone: 'text-accent-amber' },
  { type: 'triangle', label: 'Triangle', tone: 'text-accent-sky' },
  { type: 'tetrahedron', label: 'Tetrahedron', tone: 'text-accent-coral' },
]

const EDGE_KINDS: Array<{ value: EdgeKind; label: string; hint: string }> = [
  { value: 'line', label: 'Line', hint: 'Đường cong cơ bản' },
  { value: 'flowchart', label: 'Flowchart', hint: 'Mũi tên điều hướng' },
  { value: 'crowfoot', label: 'Chân gà', hint: 'Kiểu quan hệ dữ liệu' },
]

function useDiagramState() {
  const nodes = ref<DiagramNode[]>([])
  const edges = ref<DiagramEdge[]>([])
  const selectedNodeId = ref('')
  const connectSourceId = ref('')
  const makeId = (prefix: 'node' | 'edge') =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e5)}`
  const getSnapshot = (): DiagramSnapshot => ({
    nodes: nodes.value.map((n) => ({ ...n })),
    edges: edges.value.map((e) => ({ ...e })),
  })
  const replaceDiagram = (payload: DiagramSnapshot) => {
    nodes.value = payload.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      x: n.x,
      y: n.y,
      label: n.label,
      width: n.width ?? NODE_WIDTH,
      height: n.height ?? NODE_HEIGHT,
    }))
    edges.value = payload.edges.map((e) => ({
      id: e.id,
      fromId: e.fromId,
      toId: e.toId,
      kind: e.kind ?? 'line',
    }))
  }
  const createNode = (type: SystemType, x: number, y: number): DiagramNode => {
    const node: DiagramNode = {
      id: makeId('node'),
      type,
      x,
      y,
      label: type.toUpperCase(),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }
    nodes.value.push(node)
    selectedNodeId.value = node.id
    return node
  }
  const updateNodePosition = (id: string, x: number, y: number) => {
    const n = nodes.value.find((i) => i.id === id)
    if (n) {
      n.x = x
      n.y = y
    }
  }
  const updateNodeLabel = (id: string, label: string) => {
    const n = nodes.value.find((i) => i.id === id)
    if (n) n.label = label
  }
  const updateNodeSize = (id: string, width: number, height: number) => {
    const n = nodes.value.find((i) => i.id === id)
    if (n) Object.assign(n, { width, height })
  }
  const createEdge = (fromId: string, toId: string, kind: EdgeKind): DiagramEdge | null => {
    if (fromId === toId) return null
    if (!nodes.value.some((n) => n.id === fromId) || !nodes.value.some((n) => n.id === toId))
      return null
    if (edges.value.some((e) => e.fromId === fromId && e.toId === toId && e.kind === kind))
      return null
    const edge: DiagramEdge = { id: makeId('edge'), fromId, toId, kind }
    edges.value.push(edge)
    return edge
  }
  const deleteEdge = (id: string): DiagramEdge | null => {
    const e = edges.value.find((i) => i.id === id) ?? null
    if (!e) return null
    edges.value = edges.value.filter((i) => i.id !== id)
    return e
  }
  const deleteNode = (id: string): string[] => {
    nodes.value = nodes.value.filter((n) => n.id !== id)
    const removed = edges.value.filter((e) => e.fromId === id || e.toId === id).map((e) => e.id)
    edges.value = edges.value.filter((e) => e.fromId !== id && e.toId !== id)
    if (selectedNodeId.value === id) selectedNodeId.value = ''
    if (connectSourceId.value === id) connectSourceId.value = ''
    return removed
  }
  return {
    nodes,
    edges,
    selectedNodeId,
    connectSourceId,
    getSnapshot,
    replaceDiagram,
    createNode,
    updateNodePosition,
    updateNodeLabel,
    updateNodeSize,
    createEdge,
    deleteEdge,
    deleteNode,
  }
}

function useSvgViewport() {
  const viewport = ref<Viewport>({ x: 160, y: 100, scale: 1 })
  const clampScale = (s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s))
  const screenToWorld = (el: SVGSVGElement, clientX: number, clientY: number) => {
    const r = el.getBoundingClientRect()
    return {
      x: (clientX - r.left - viewport.value.x) / viewport.value.scale,
      y: (clientY - r.top - viewport.value.y) / viewport.value.scale,
    }
  }
  const setScaleAt = (el: SVGSVGElement, nextScale: number, clientX: number, clientY: number) => {
    const scale = clampScale(nextScale)
    const p = screenToWorld(el, clientX, clientY)
    const r = el.getBoundingClientRect()
    viewport.value.scale = scale
    viewport.value.x = clientX - r.left - p.x * scale
    viewport.value.y = clientY - r.top - p.y * scale
  }
  return {
    viewport,
    screenToWorld,
    setScaleAt,
    reset: () => (viewport.value = { x: 160, y: 100, scale: 1 }),
  }
}

function useEdgeRouting(nodes: { value: DiagramNode[] }, edges: { value: DiagramEdge[] }) {
  const getIntersection = (node: DiagramNode, oppositeCenter: { x: number; y: number }) => {
    const { width, height } = node
    const cx = node.x + width / 2
    const cy = node.y + height / 2
    if (node.type === 'circle' || node.type === 'tetrahedron') {
      const rx = width / 2
      const ry = height / 2
      const dx = oppositeCenter.x - cx
      const dy = oppositeCenter.y - cy
      if (dx === 0 && dy === 0) return { x: cx, y: cy, isHorizontal: false }
      const t = 1 / Math.sqrt(Math.pow(dx / rx, 2) + Math.pow(dy / ry, 2))
      return {
        x: cx + t * dx,
        y: cy + t * dy,
        isHorizontal: Math.abs(dy) * width < Math.abs(dx) * height,
      }
    }
    const w = width
    const h = height
    const x = node.x
    const dx = oppositeCenter.x - cx
    const dy = oppositeCenter.y - cy
    if (dx === 0 && dy === 0) {
      return { x: cx, y: cy, isHorizontal: false }
    }
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const isHorizontal = absDy * w < absDx * h
    let ix: number, iy: number
    if (isHorizontal) {
      if (dx === 0) {
        ix = cx
        iy = dy > 0 ? node.y + h : node.y
      } else {
        if (dx > 0) ix = x + w
        else ix = x
        iy = cy + ((ix - cx) * dy) / dx
      }
    } else {
      if (dy === 0) {
        iy = cy
        ix = dx > 0 ? x + w : x
      } else {
        if (dy > 0) iy = node.y + h
        else iy = node.y
        ix = cx + ((iy - cy) * dx) / dy
      }
    }
    return { x: ix, y: iy, isHorizontal }
  }
  return computed<EdgePath[]>(() =>
    edges.value
      .map((e) => {
        const from = nodes.value.find((n) => n.id === e.fromId)
        const to = nodes.value.find((n) => n.id === e.toId)
        if (!from || !to) return null
        const fromCx = from.x + from.width / 2
        const fromCy = from.y + from.height / 2
        const toCx = to.x + to.width / 2
        const toCy = to.y + to.height / 2
        if (from.id === to.id) return null
        const {
          x: sx,
          y: sy,
          isHorizontal: fromIsHorizontal,
        } = getIntersection(from, {
          x: toCx,
          y: toCy,
        })
        const {
          x: tx,
          y: ty,
          isHorizontal: toIsHorizontal,
        } = getIntersection(to, {
          x: fromCx,
          y: fromCy,
        })
        const dx = tx - sx
        const dy = ty - sy
        if (e.kind === 'flowchart') {
          if (fromIsHorizontal) {
            const midX = sx + dx * 0.5
            return {
              ...e,
              path: `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`,
              markerEnd: 'url(#marker-arrow)',
              dashArray: '8 5',
            }
          } else {
            const midY = sy + dy * 0.5
            return {
              ...e,
              path: `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`,
              markerEnd: 'url(#marker-arrow)',
              dashArray: '8 5',
            }
          }
        }
        const c = Math.max(64, Math.sqrt(dx * dx + dy * dy) * 0.3)
        const c1x = fromIsHorizontal ? sx + c * Math.sign(dx) : sx
        const c1y = fromIsHorizontal ? sy : sy + c * Math.sign(dy)
        const c2x = toIsHorizontal ? tx - c * Math.sign(dx) : tx
        const c2y = toIsHorizontal ? ty : ty - c * Math.sign(dy)
        if (e.kind === 'crowfoot') {
          return {
            ...e,
            path: `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${tx} ${ty}`,
            markerEnd: 'url(#marker-crowfoot)',
          }
        }
        return { ...e, path: `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${tx} ${ty}` }
      })
      .filter((e): e is EdgePath => e !== null),
  )
}

function useTransformPreview(nodes: { value: DiagramNode[] }, edges: { value: DiagramEdge[] }) {
  const q = (v: string) => `"${v.split('\\').join('\\\\').split('"').join('\\"')}"`
  const mermaid = computed(() => {
    if (!nodes.value.length) return 'flowchart LR\n  %% Add systems...'
    const out: string[] = ['flowchart LR']
    for (const n of nodes.value) out.push(`  ${n.id}[${n.label} (${n.type})]`)
    for (const e of edges.value) {
      const connector = e.kind === 'flowchart' ? '-.->' : '-->'
      const label = e.kind === 'line' ? '' : `|${e.kind}|`
      out.push(`  ${e.fromId} ${connector}${label} ${e.toId}`)
    }
    return out.join('\n')
  })
  const yaml = computed(() => {
    const out: string[] = ['nodes:']
    if (!nodes.value.length) out.push('  []')
    for (const n of nodes.value) {
      out.push(`  - id: ${q(n.id)}`)
      out.push(`    type: ${q(n.type)}`)
      out.push(`    x: ${n.x}`)
      out.push(`    y: ${n.y}`)
      out.push(`    width: ${n.width}`)
      out.push(`    height: ${n.height}`)
      out.push(`    label: ${q(n.label)}`)
    }
    out.push('edges:')
    if (!edges.value.length) out.push('  []')
    for (const e of edges.value) {
      out.push(`  - id: ${q(e.id)}`)
      out.push(`    fromId: ${q(e.fromId)}`)
      out.push(`    toId: ${q(e.toId)}`)
      out.push(`    kind: ${q(e.kind)}`)
    }
    return out.join('\n')
  })
  return { mermaid, yaml }
}

function useExportSvg(svgRef: { value: SVGSVGElement | null }) {
  const downloadSvg = () => {
    if (!svgRef.value) return
    const cloned = svgRef.value.cloneNode(true) as SVGSVGElement
    cloned.setAttribute('xmlns', SVG_NS)
    cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    cloned.setAttribute('width', String(svgRef.value.clientWidth || 1280))
    cloned.setAttribute('height', String(svgRef.value.clientHeight || 720))
    const xml = new XMLSerializer().serializeToString(cloned)
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `architecture-${Date.now()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }
  return { downloadSvg }
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
}
const sdpToBase64 = (s: string) => btoa(s)
const base64ToSdp = (s: string) => {
  const t = s.trim()
  if (t.startsWith('{')) return t
  try {
    return atob(t)
  } catch {
    return t
  }
}
function parseSyncMessage(text: string): SyncMessage | null {
  try {
    const p = JSON.parse(text) as { type?: string }
    if (
      p.type === 'snapshot' ||
      p.type === 'diagram:replace' ||
      p.type === 'node:create' ||
      p.type === 'node:update-position' ||
      p.type === 'node:update-label' ||
      p.type === 'node:update-size' ||
      p.type === 'node:delete' ||
      p.type === 'edge:create' ||
      p.type === 'edge:delete'
    )
      return p as SyncMessage
    return null
  } catch {
    return null
  }
}

interface Peer {
  id: string
  pc: RTCPeerConnection
  dc: RTCDataChannel | null
  state: 'connecting' | 'connected' | 'failed' | 'disconnected'
  offer?: string
  answer?: string
}

function useCollaboration(
  getSnapshot: () => DiagramSnapshot,
  onSync: (message: SyncMessage, fromPeerId?: string) => void,
) {
  const collabRole = ref<'idle' | 'host' | 'guest'>('idle')
  const error = ref('')
  const peers = ref<Map<string, Peer>>(new Map())
  const guestState = ref<'idle' | 'joining' | 'connected'>('idle')
  const sessionOffer = ref('')
  const sessionAnswer = ref('')
  const isCreatingInvite = ref(false)
  const isGeneratingAnswer = ref(false)

  const makePeerId = () => `peer-${Date.now()}-${Math.floor(Math.random() * 1e5)}`

  const sendMessageTo = (peerId: string, m: SyncMessage) => {
    const p = peers.value.get(peerId)
    if (p && p.dc && p.dc.readyState === 'open') {
      p.dc.send(JSON.stringify(m))
    }
  }

  const broadcastMessage = (m: SyncMessage, excludePeerId?: string) => {
    for (const [peerId, p] of peers.value.entries()) {
      if (peerId !== excludePeerId && p.dc && p.dc.readyState === 'open') {
        p.dc.send(JSON.stringify(m))
      }
    }
  }

  const bindDataChannel = (peerId: string, channel: RTCDataChannel) => {
    const p = peers.value.get(peerId)
    if (!p) return

    p.dc = channel
    channel.onopen = () => {
      const peer = peers.value.get(peerId)
      if (peer) {
        peer.state = 'connected'
        if (collabRole.value === 'host') {
          sendMessageTo(peerId, { type: 'snapshot', payload: getSnapshot() })
        }
        if (collabRole.value === 'guest') {
          guestState.value = 'connected'
        }
      }
    }
    channel.onclose = () => {
      const peer = peers.value.get(peerId)
      if (peer) peer.state = 'disconnected'
    }
    channel.onerror = () => {
      const peer = peers.value.get(peerId)
      if (peer) peer.state = 'failed'
      error.value = `DataChannel error with peer ${peerId}`
    }
    channel.onmessage = (e) => {
      if (typeof e.data !== 'string') return
      const m = parseSyncMessage(e.data)
      if (m) {
        onSync(m, peerId)
        if (collabRole.value === 'host') {
          broadcastMessage(m, peerId)
        }
      }
    }
  }

  const waitIce = async (conn: RTCPeerConnection) =>
    new Promise<string>((resolve) => {
      const done = () => resolve(JSON.stringify(conn.localDescription))
      if (conn.iceGatheringState === 'complete') {
        done()
        return
      }
      const t = setTimeout(() => {
        conn.onicegatheringstatechange = null
        done()
      }, 2000)
      conn.onicegatheringstatechange = () => {
        if (conn.iceGatheringState === 'complete') {
          clearTimeout(t)
          done()
        }
      }
    })

  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pc.oniceconnectionstatechange = () => {
      const peer = peers.value.get(peerId)
      if (peer) {
        const s = pc.iceConnectionState
        if (s === 'connected' && peer.state !== 'connected') {
          peer.state = 'connected'
        }
        if (s === 'failed' || s === 'disconnected' || s === 'closed') {
          if (peer.state === 'connected') peer.state = 'disconnected'
        }
      }
    }
    return pc
  }

  const startHostSession = () => {
    collabRole.value = 'host'
    peers.value.clear()
  }

  const createInvite = async () => {
    if (collabRole.value !== 'host' || isCreatingInvite.value) return
    isCreatingInvite.value = true
    try {
      const peerId = makePeerId()
      const pc = createPeerConnection(peerId)
      const peer: Peer = { id: peerId, pc, dc: null, state: 'connecting', answer: '' }
      peers.value.set(peerId, peer)

      bindDataChannel(peerId, pc.createDataChannel(`sync-${peerId}`, { ordered: true }))
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      peer.offer = sdpToBase64(await waitIce(pc))
    } finally {
      isCreatingInvite.value = false
    }
  }

  const acceptGuestAnswer = async (peerId: string, answerSdp: string) => {
    const peer = peers.value.get(peerId)
    if (!peer || collabRole.value !== 'host' || !answerSdp) {
      error.value = 'Invalid peer, role, or missing answer.'
      return
    }
    try {
      await peer.pc.setRemoteDescription(
        JSON.parse(base64ToSdp(answerSdp)) as RTCSessionDescriptionInit,
      )
    } catch (e) {
      error.value = `Invalid answer from ${peerId}. Details: ${e}`
      const p = peers.value.get(peerId)
      if (p) p.state = 'failed'
    }
  }

  const joinAsGuest = async () => {
    if (isGeneratingAnswer.value) return
    isGeneratingAnswer.value = true
    error.value = ''
    try {
      collabRole.value = 'guest'
      guestState.value = 'joining'
      const peerId = makePeerId()
      const pc = createPeerConnection(peerId)
      const peer: Peer = { id: peerId, pc, dc: null, state: 'connecting' }
      peers.value.set(peerId, peer)
      pc.ondatachannel = (e) => bindDataChannel(peerId, e.channel)
      await pc.setRemoteDescription(
        JSON.parse(base64ToSdp(sessionOffer.value)) as RTCSessionDescriptionInit,
      )
      const ans = await pc.createAnswer()
      await pc.setLocalDescription(ans)
      sessionAnswer.value = sdpToBase64(await waitIce(pc))
    } catch {
      error.value = 'Invalid offer code. Please check and try again.'
      guestState.value = 'idle'
    } finally {
      isGeneratingAnswer.value = false
    }
  }

  const disconnect = () => {
    for (const p of peers.value.values()) {
      p.dc?.close()
      p.pc?.close()
    }
    peers.value.clear()
    collabRole.value = 'idle'
    guestState.value = 'idle'
    sessionOffer.value = ''
    sessionAnswer.value = ''
    error.value = ''
  }

  onUnmounted(disconnect)

  return {
    collabRole,
    error,
    peers,
    guestState,
    sessionOffer,
    sessionAnswer,
    isCreatingInvite,
    isGeneratingAnswer,
    startHostSession,
    createInvite,
    acceptGuestAnswer,
    joinAsGuest,
    broadcastMessage,
    disconnect,
  }
}

const svgRef = ref<SVGSVGElement | null>(null)
const mode = ref<CanvasMode>('select')
const tab = ref<PreviewTab>('mermaid')
const selectedEdgeKind = ref<EdgeKind>('line')
const copiedPreview = ref(false)
const copiedSignal = ref(false)

const ds = useDiagramState()
const vp = useSvgViewport()
const edgePaths = useEdgeRouting(ds.nodes, ds.edges)
const preview = useTransformPreview(ds.nodes, ds.edges)
const exporter = useExportSvg(svgRef)
const {
  nodes,
  edges,
  selectedNodeId,
  connectSourceId,
  getSnapshot,
  replaceDiagram,
  createNode,
  updateNodePosition,
  updateNodeLabel,
  updateNodeSize,
  createEdge,
  deleteEdge,
  deleteNode,
} = ds
const { viewport, screenToWorld, setScaleAt, reset: resetViewport } = vp

const onSync = (m: SyncMessage) => {
  if (m.type === 'snapshot' || m.type === 'diagram:replace') {
    replaceDiagram(m.payload)
    return
  }
  if (m.type === 'node:create') {
    if (!nodes.value.some((n) => n.id === m.payload.id)) {
      nodes.value.push({
        id: m.payload.id,
        type: m.payload.type,
        x: m.payload.x,
        y: m.payload.y,
        label: m.payload.label,
        width: m.payload.width ?? NODE_WIDTH,
        height: m.payload.height ?? NODE_HEIGHT,
      })
    }
    return
  }
  if (m.type === 'node:update-position') {
    updateNodePosition(m.payload.id, m.payload.x, m.payload.y)
    return
  }
  if (m.type === 'node:update-label') {
    updateNodeLabel(m.payload.id, m.payload.label)
    return
  }
  if (m.type === 'node:update-size') {
    updateNodeSize(m.payload.id, m.payload.width, m.payload.height)
    return
  }
  if (m.type === 'node:delete') {
    deleteNode(m.payload.id)
    return
  }
  if (m.type === 'edge:create') {
    if (!edges.value.some((e) => e.id === m.payload.id)) {
      edges.value.push({
        id: m.payload.id,
        fromId: m.payload.fromId,
        toId: m.payload.toId,
        kind: m.payload.kind ?? 'line',
      })
    }
    return
  }
  if (m.type === 'edge:delete') deleteEdge(m.payload.id)
}
const collab = useCollaboration(getSnapshot, onSync)
const {
  collabRole,
  error: collabError,
  peers,
  guestState,
  sessionOffer,
  sessionAnswer,
  isCreatingInvite,
  isGeneratingAnswer,
  startHostSession,
  createInvite,
  acceptGuestAnswer,
  joinAsGuest,
  broadcastMessage,
  disconnect,
} = collab

const selectedNode = computed(() => nodes.value.find((n) => n.id === selectedNodeId.value) ?? null)
const activeText = computed(() =>
  tab.value === 'mermaid' ? preview.mermaid.value : preview.yaml.value,
)
const transform = computed(
  () => `translate(${viewport.value.x} ${viewport.value.y}) scale(${viewport.value.scale})`,
)
const zoomText = computed(() => viewport.value.scale.toFixed(2))
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

watch(
  nodes,
  async () => {
    await nextTick()
    if (!svgRef.value) return
    for (const node of nodes.value) {
      const textEl = svgRef.value.querySelector(`[data-text-id="${node.id}"]`)
      if (textEl) {
        const bbox = (textEl as SVGTextElement).getBBox()
        const newWidth = Math.max(NODE_WIDTH, bbox.width + 48)
        if (node.width !== newWidth) {
          updateNodeSize(node.id, newWidth, NODE_HEIGHT)
          broadcastMessage({
            type: 'node:update-size',
            payload: { id: node.id, width: newWidth, height: NODE_HEIGHT },
          })
        }
      }
    }
  },
  { deep: true, flush: 'post' },
)

const copy = async (text: string, kind: 'preview' | 'signal') => {
  if (!text) return
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    if (kind === 'preview') {
      copiedPreview.value = true
      setTimeout(() => (copiedPreview.value = false), 1500)
    } else {
      copiedSignal.value = true
      setTimeout(() => (copiedSignal.value = false), 1500)
    }
  } catch (e) {
    console.error(e)
    copiedPreview.value = false
    copiedSignal.value = false
  }
}
const addNodeFromPalette = (type: SystemType) => {
  const x = snap((360 - viewport.value.x) / viewport.value.scale)
  const y = snap((260 - viewport.value.y) / viewport.value.scale)
  const n = createNode(type, x, y)
  broadcastMessage({ type: 'node:create', payload: n })
}
const onPaletteDragStart = (e: DragEvent, type: SystemType) =>
  e.dataTransfer?.setData('application/x-system-type', type)
const onCanvasDragOver = (e: DragEvent) => e.preventDefault()
const onCanvasDrop = (e: DragEvent) => {
  e.preventDefault()
  if (!svgRef.value) return
  const type = e.dataTransfer?.getData('application/x-system-type') as SystemType
  if (!type) return
  const w = screenToWorld(svgRef.value, e.clientX, e.clientY)
  const n = createNode(type, snap(w.x), snap(w.y))
  broadcastMessage({ type: 'node:create', payload: n })
}

const onNodeClick = (node: DiagramNode) => {
  if (mode.value === 'connect') {
    if (!connectSourceId.value) {
      connectSourceId.value = node.id
      return
    }
    if (connectSourceId.value === node.id) {
      connectSourceId.value = ''
      return
    }
    const edge = createEdge(connectSourceId.value, node.id, selectedEdgeKind.value)
    connectSourceId.value = ''
    if (edge) broadcastMessage({ type: 'edge:create', payload: edge })
    return
  }
  selectedNodeId.value = node.id
}
const removeSelectedNode = () => {
  if (!selectedNodeId.value) return
  const id = selectedNodeId.value
  const removed = deleteNode(id)
  broadcastMessage({ type: 'node:delete', payload: { id } })
  for (const edgeId of removed) broadcastMessage({ type: 'edge:delete', payload: { id: edgeId } })
}
const clearAll = () => {
  replaceDiagram({ nodes: [], edges: [] })
  broadcastMessage({ type: 'diagram:replace', payload: getSnapshot() })
}
const syncAll = () => broadcastMessage({ type: 'diagram:replace', payload: getSnapshot() })
const deleteEdgeById = (edgeId: string) => {
  if (deleteEdge(edgeId)) broadcastMessage({ type: 'edge:delete', payload: { id: edgeId } })
}
const onLabelInput = (label: string) => {
  if (!selectedNode.value) return
  updateNodeLabel(selectedNode.value.id, label)
  broadcastMessage({ type: 'node:update-label', payload: { id: selectedNode.value.id, label } })
}

const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)
const panOriginX = ref(0)
const panOriginY = ref(0)
const dragNodeId = ref('')
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const startPan = (x: number, y: number) => {
  isPanning.value = true
  panStartX.value = x
  panStartY.value = y
  panOriginX.value = viewport.value.x
  panOriginY.value = viewport.value.y
  document.body.style.userSelect = 'none'
}
const startNodeDrag = (node: DiagramNode, x: number, y: number) => {
  if (!svgRef.value) return
  const w = screenToWorld(svgRef.value, x, y)
  dragNodeId.value = node.id
  dragOffsetX.value = w.x - node.x
  dragOffsetY.value = w.y - node.y
}
const stopNodeDrag = () => {
  dragNodeId.value = ''
}
const onCanvasMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  if ((e.target as SVGElement).closest('.cursor-pointer')) return
  if (mode.value === 'select') {
    selectedNodeId.value = ''
  }
  if (mode.value === 'connect') {
    connectSourceId.value = ''
  }
  startPan(e.clientX, e.clientY)
}
const onCanvasTouchStart = (e: TouchEvent) => {
  const t = e.touches[0]
  if (!t) return
  if ((t.target as SVGElement).closest('.cursor-pointer')) return
  if (mode.value === 'select') {
    selectedNodeId.value = ''
  }
  if (mode.value === 'connect') {
    connectSourceId.value = ''
  }
  startPan(t.clientX, t.clientY)
}
const onNodeMouseDown = (e: MouseEvent, node: DiagramNode) => {
  if (mode.value !== 'select') return
  e.stopPropagation()
  e.preventDefault()
  selectedNodeId.value = node.id
  startNodeDrag(node, e.clientX, e.clientY)
}
const onNodeTouchStart = (e: TouchEvent, node: DiagramNode) => {
  if (mode.value !== 'select') return
  const t = e.touches[0]
  if (!t) return
  e.stopPropagation()
  selectedNodeId.value = node.id
  startNodeDrag(node, t.clientX, t.clientY)
}
const onWindowMouseMove = (e: MouseEvent) => {
  if (dragNodeId.value && svgRef.value) {
    const w = screenToWorld(svgRef.value, e.clientX, e.clientY)
    const x = snap(w.x - dragOffsetX.value)
    const y = snap(w.y - dragOffsetY.value)
    updateNodePosition(dragNodeId.value, x, y)
    broadcastMessage({ type: 'node:update-position', payload: { id: dragNodeId.value, x, y } })
    return
  }
  if (!isPanning.value) return
  viewport.value.x = panOriginX.value + (e.clientX - panStartX.value)
  viewport.value.y = panOriginY.value + (e.clientY - panStartY.value)
}
const onWindowTouchMove = (e: TouchEvent) => {
  const t = e.touches[0]
  if (!t) return
  if (dragNodeId.value && svgRef.value) {
    const w = screenToWorld(svgRef.value, t.clientX, t.clientY)
    const x = snap(w.x - dragOffsetX.value)
    const y = snap(w.y - dragOffsetY.value)
    updateNodePosition(dragNodeId.value, x, y)
    broadcastMessage({ type: 'node:update-position', payload: { id: dragNodeId.value, x, y } })
    return
  }
  if (!isPanning.value) return
  viewport.value.x = panOriginX.value + (t.clientX - panStartX.value)
  viewport.value.y = panOriginY.value + (t.clientY - panStartY.value)
}
const onWindowUp = () => {
  isPanning.value = false
  stopNodeDrag()
  document.body.style.userSelect = ''
}
window.addEventListener('mousemove', onWindowMouseMove)
window.addEventListener('mouseup', onWindowUp)
window.addEventListener('touchmove', onWindowTouchMove, { passive: true })
window.addEventListener('touchend', onWindowUp, { passive: true })
onUnmounted(() => {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowUp)
  window.removeEventListener('touchmove', onWindowTouchMove)
  window.removeEventListener('touchend', onWindowUp)
})
const onCanvasWheel = (e: WheelEvent) => {
  if (!svgRef.value) return
  e.preventDefault()
  setScaleAt(svgRef.value, viewport.value.scale + (e.deltaY > 0 ? -0.1 : 0.1), e.clientX, e.clientY)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-6 md:py-8">
    <div class="mx-auto max-w-7xl">
      <header class="animate-fade-up">
        <p class="font-display text-sm tracking-widest text-accent-amber">
          // ARCHITECTURE-AS-CODE
        </p>
        <h1 class="mt-2 font-display text-4xl md:text-6xl font-bold text-accent-coral">
          Diagram to Code
        </h1>
        <p class="mt-3 max-w-3xl text-text-secondary">
          Kéo thả block hệ thống, nối edge và sync với nhiều người qua WebRTC DataChannel.
        </p>
      </header>

      <div class="mt-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
        <aside class="space-y-4 animate-fade-up animate-delay-2">
          <section class="border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-lg flex items-center gap-2">
              <span class="text-accent-coral text-sm tracking-widest">//</span>System Palette
            </h2>
            <p class="mt-2 text-xs text-text-dim">
              Kéo thả vào canvas hoặc bấm nhanh để thêm phần tử.
            </p>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button
                v-for="sys in SYSTEMS"
                :key="sys.type"
                draggable="true"
                class="border border-border-default bg-bg-deep px-3 py-2 text-left transition hover:border-accent-coral hover:bg-bg-elevated"
                @dragstart="onPaletteDragStart($event, sys.type)"
                @click="addNodeFromPalette(sys.type)"
              >
                <p class="font-display text-sm font-semibold" :class="sys.tone">{{ sys.label }}</p>
              </button>
            </div>
          </section>
          <section class="border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-lg flex items-center gap-2">
              <span class="text-accent-amber text-sm tracking-widest">//</span>Canvas Tools
            </h2>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <button
                class="border px-2 py-2 text-xs"
                :class="
                  mode === 'select'
                    ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                    : 'border-border-default bg-bg-deep text-text-secondary'
                "
                @click="mode = 'select'"
              >
                Select
              </button>
              <button
                class="border px-2 py-2 text-xs"
                :class="
                  mode === 'pan'
                    ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
                    : 'border-border-default bg-bg-deep text-text-secondary'
                "
                @click="mode = 'pan'"
              >
                Pan
              </button>
              <button
                class="border px-2 py-2 text-xs"
                :class="
                  mode === 'connect'
                    ? 'border-accent-sky bg-accent-sky/20 text-accent-sky'
                    : 'border-border-default bg-bg-deep text-text-secondary'
                "
                @click="mode = 'connect'"
              >
                Connect
              </button>
            </div>
            <div v-if="mode === 'connect'" class="mt-3 border border-border-default bg-bg-deep p-2">
              <p class="mb-2 text-[11px] text-text-dim">Loại kết nối</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="kind in EDGE_KINDS"
                  :key="kind.value"
                  class="border px-2 py-2 text-left text-[11px] leading-4 transition"
                  :class="
                    selectedEdgeKind === kind.value
                      ? 'border-accent-sky bg-accent-sky/20 text-accent-sky'
                      : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-sky'
                  "
                  @click="selectedEdgeKind = kind.value"
                >
                  <span class="block font-display">{{ kind.label }}</span>
                  <span class="text-text-dim">{{ kind.hint }}</span>
                </button>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <button
                class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                @click="resetViewport"
              >
                Reset view
              </button>
              <button
                class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                @click="clearAll"
              >
                Clear all
              </button>
            </div>
            <p class="mt-2 text-xs text-text-dim">Zoom: {{ zoomText }}x</p>
            <p v-if="connectSourceId" class="text-xs text-text-dim">
              Nguồn chờ nối: {{ connectSourceId }}
            </p>
          </section>
        </aside>

        <section class="animate-fade-up animate-delay-3">
          <section class="mb-3 border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-lg flex items-center justify-between">
              <span class="flex items-center gap-2">
                <span class="text-accent-sky text-sm tracking-widest">//</span>Node Editor
              </span>
              <span v-if="selectedNode" class="text-xs font-semibold text-text-dim">
                Type:
                <span class="font-mono text-text-secondary">{{ selectedNode.type }}</span>
              </span>
            </h2>
            <div
              v-if="selectedNode"
              class="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <input
                :value="selectedNode.label"
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm outline-none focus:border-accent-sky"
                @input="onLabelInput(($event.target as HTMLInputElement).value)"
              />
              <button
                class="border border-accent-coral bg-accent-coral/10 px-4 py-2 text-xs text-accent-coral"
                @click="removeSelectedNode"
              >
                Xóa node
              </button>
            </div>
            <p v-else class="mt-3 text-xs text-text-dim">Chọn một node để sửa label.</p>
          </section>
          <div
            class="border border-border-default bg-bg-deep overflow-hidden select-none"
            @dragover="onCanvasDragOver"
            @drop="onCanvasDrop"
          >
            <svg
              ref="svgRef"
              class="h-[62vh] min-h-[460px] w-full touch-none"
              :class="{ 'cursor-move': mode === 'pan' && !isPanning, 'cursor-grabbing': isPanning }"
              @mousedown="onCanvasMouseDown"
              @touchstart="onCanvasTouchStart"
              @wheel="onCanvasWheel"
            >
              <defs>
                <pattern
                  id="grid-pattern"
                  :width="GRID_SIZE"
                  :height="GRID_SIZE"
                  patternUnits="userSpaceOnUse"
                  :patternTransform="transform"
                >
                  <path
                    :d="`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`"
                    fill="none"
                    stroke="#253549"
                    stroke-width="1"
                    opacity="0.45"
                  />
                </pattern>
                <marker
                  id="marker-arrow"
                  markerWidth="10"
                  markerHeight="8"
                  refX="9"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 0 L 10 4 L 0 8 z" fill="#38BDF8" />
                </marker>
                <marker
                  id="marker-crowfoot"
                  markerWidth="16"
                  markerHeight="16"
                  refX="14"
                  refY="8"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d="M 2 2 L 14 8 M 2 8 L 14 8 M 2 14 L 14 8"
                    fill="none"
                    stroke="#38BDF8"
                    stroke-width="1.8"
                  />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              <g :transform="transform">
                <path
                  v-for="edge in edgePaths"
                  :key="edge.id"
                  :d="edge.path"
                  fill="none"
                  stroke="#38BDF8"
                  stroke-width="2"
                  :stroke-dasharray="edge.dashArray"
                  :marker-end="edge.markerEnd"
                  class="cursor-pointer"
                  @click.stop="deleteEdgeById(edge.id)"
                />
                <g
                  v-for="node in nodes"
                  :key="node.id"
                  :transform="`translate(${node.x} ${node.y})`"
                  class="cursor-pointer"
                  @mousedown="onNodeMouseDown($event, node)"
                  @touchstart="onNodeTouchStart($event, node)"
                  @click.stop="onNodeClick(node)"
                >
                  <rect
                    v-if="
                      node.type !== 'circle' &&
                      node.type !== 'triangle' &&
                      node.type !== 'tetrahedron'
                    "
                    :x="0"
                    :width="node.width"
                    :height="node.height"
                    fill="#162232"
                    stroke-width="2.5"
                    :stroke="
                      connectSourceId === node.id
                        ? '#38BDF8'
                        : selectedNodeId === node.id
                          ? '#FF6B4A'
                          : '#253549'
                    "
                  />
                  <ellipse
                    v-else-if="node.type === 'circle'"
                    :cx="node.width / 2"
                    :cy="node.height / 2"
                    :rx="node.width / 2"
                    :ry="node.height / 2"
                    fill="#162232"
                    stroke-width="2.5"
                    :stroke="
                      connectSourceId === node.id
                        ? '#38BDF8'
                        : selectedNodeId === node.id
                          ? '#FF6B4A'
                          : '#253549'
                    "
                  />
                  <polygon
                    v-else-if="node.type === 'triangle'"
                    :points="`${node.width / 2},0 ${node.width},${node.height} 0,${node.height}`"
                    fill="#162232"
                    stroke-width="2.5"
                    :stroke="
                      connectSourceId === node.id
                        ? '#38BDF8'
                        : selectedNodeId === node.id
                          ? '#FF6B4A'
                          : '#253549'
                    "
                  />
                  <polygon
                    v-else
                    :points="`${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}`"
                    fill="#162232"
                    stroke-width="2.5"
                    :stroke="
                      connectSourceId === node.id
                        ? '#38BDF8'
                        : selectedNodeId === node.id
                          ? '#FF6B4A'
                          : '#253549'
                    "
                  />
                  <text
                    :data-text-id="node.id"
                    :x="node.width / 2"
                    y="29"
                    fill="#F0EDE6"
                    font-size="14"
                    font-weight="600"
                    text-anchor="middle"
                  >
                    {{ node.label.trim() }}
                  </text>
                  <text
                    :x="node.width / 2"
                    :y="node.height - 22"
                    fill="#8B9DB5"
                    font-size="11"
                    text-anchor="middle"
                    class="pointer-events-none"
                  >
                    {{ node.type.toUpperCase() }}
                  </text>
                </g>
              </g>
            </svg>
          </div>
          <p class="mt-2 text-xs text-text-dim">
            Connect: chọn kiểu kết nối, click node nguồn để kết nối với node đích. Click edge để
            xóa.
          </p>
        </section>

        <aside class="space-y-4 animate-fade-up animate-delay-4">
          <section class="border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-lg flex items-center gap-2">
              <span class="text-accent-coral text-sm tracking-widest">//</span>Collaboration
            </h2>

            <div v-if="collabRole === 'idle'">
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="startHostSession"
                  class="border border-accent-coral bg-accent-coral/10 px-3 py-2 text-xs text-accent-coral"
                >
                  Start Session
                </button>
                <button
                  @click="collabRole = 'guest'"
                  class="border border-accent-sky bg-accent-sky/10 px-3 py-2 text-xs text-accent-sky"
                >
                  Join Session
                </button>
              </div>
            </div>

            <div v-if="collabRole === 'host'">
              <p class="text-xs text-text-dim">You are the host. Invite others to join.</p>
              <button
                @click="createInvite"
                :disabled="isCreatingInvite"
                class="mt-2 w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary disabled:opacity-50"
              >
                {{ isCreatingInvite ? 'Generating...' : 'Create Invite' }}
              </button>

              <div
                v-for="peer in Array.from(peers.values())"
                :key="peer.id"
                class="mt-3 border-t border-border-default pt-3"
              >
                <p class="text-xs font-semibold">
                  Participant: {{ peer.id.substring(0, 9) }}... ({{ peer.state }})
                </p>
                <div v-if="peer.offer && peer.state === 'connecting'">
                  <p class="mt-1 text-xs text-text-dim">1. Send this invite code:</p>
                  <textarea
                    :value="peer.offer"
                    readonly
                    class="mt-1 h-16 w-full resize-none border border-border-default bg-bg-deep p-2 text-[11px] text-text-secondary"
                  />
                  <button
                    @click="copy(peer.offer, 'signal')"
                    class="mt-1 w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                  >
                    {{ copiedSignal ? 'Đã copy' : 'Copy Code' }}
                  </button>

                  <p class="mt-2 text-xs text-text-dim">2. Paste their answer here:</p>
                  <textarea
                    v-model="peer.answer"
                    class="mt-1 h-16 w-full resize-none border border-border-default bg-bg-deep p-2 text-[11px] text-text-primary"
                    placeholder="Answer code..."
                  />
                  <button
                    @click="acceptGuestAnswer(peer.id, peer.answer!)"
                    class="mt-1 w-full border border-accent-amber bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber"
                  >
                    Connect
                  </button>
                </div>
              </div>
              <button
                @click="disconnect"
                class="mt-4 w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
              >
                End Session
              </button>
            </div>

            <div v-if="collabRole === 'guest'">
              <div v-if="guestState === 'idle'">
                <p class="text-xs text-text-dim">Paste the invite code from the host:</p>
                <textarea
                  v-model="sessionOffer"
                  class="mt-1 h-20 w-full resize-none border border-border-default bg-bg-deep p-2 text-[11px] text-text-primary"
                  placeholder="Invite code..."
                />
                <p v-if="collabError" class="mt-2 text-xs text-accent-coral">{{ collabError }}</p>
                <button
                  @click="joinAsGuest"
                  :disabled="!sessionOffer || isGeneratingAnswer"
                  class="mt-2 w-full border border-accent-sky bg-accent-sky/10 px-3 py-2 text-xs text-accent-sky disabled:opacity-40"
                >
                  {{ isGeneratingAnswer ? 'Generating...' : 'Generate Answer' }}
                </button>
                <button
                  @click="disconnect"
                  class="mt-2 w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                >
                  Cancel
                </button>
              </div>
              <div v-if="guestState === 'joining'">
                <p class="text-xs text-text-dim">Send this answer code back to the host:</p>
                <textarea
                  :value="sessionAnswer"
                  readonly
                  class="mt-1 h-20 w-full resize-none border border-border-default bg-bg-deep p-2 text-[11px] font-bold text-accent-amber"
                />
                <button
                  @click="copy(sessionAnswer, 'signal')"
                  class="mt-2 w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                >
                  {{ copiedSignal ? 'Đã copy' : 'Copy Answer' }}
                </button>
              </div>
              <div v-if="guestState === 'connected'">
                <p class="text-xs">Connected to session.</p>
                <button
                  @click="disconnect"
                  class="mt-4 w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                >
                  Leave Session
                </button>
              </div>
            </div>
            <div class="mt-4" v-if="collabRole === 'host' || guestState === 'connected'">
              <button
                class="w-full border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                @click="syncAll"
              >
                Sync full diagram
              </button>
            </div>
          </section>
          <section class="border border-border-default bg-bg-surface p-4">
            <h2 class="font-display text-lg flex items-center gap-2">
              <span class="text-accent-amber text-sm tracking-widest">//</span>Transform Preview
            </h2>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                class="border px-2 py-1 text-xs"
                :class="
                  tab === 'mermaid'
                    ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
                    : 'border-border-default bg-bg-deep text-text-secondary'
                "
                @click="tab = 'mermaid'"
              >
                Mermaid
              </button>
              <button
                class="border px-2 py-1 text-xs"
                :class="
                  tab === 'yaml'
                    ? 'border-accent-sky bg-accent-sky/20 text-accent-sky'
                    : 'border-border-default bg-bg-deep text-text-secondary'
                "
                @click="tab = 'yaml'"
              >
                YAML
              </button>
            </div>
            <pre
              class="mt-2 h-52 overflow-auto border border-border-default bg-bg-deep p-3 text-[11px] text-text-secondary"
            ><code>{{ activeText }}</code></pre>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                @click="copy(activeText, 'preview')"
              >
                {{ copiedPreview ? 'Đã copy' : 'Copy code' }}
              </button>
              <button
                class="border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary"
                @click="exporter.downloadSvg"
              >
                Export SVG
              </button>
            </div>
          </section>
        </aside>
      </div>

      <RouterLink
        to="/"
        class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-5"
        >&larr; Về trang chủ</RouterLink
      >
    </div>
  </div>
</template>
