<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'

interface Node {
  id: string
  x: number
  y: number
  type: 'host' | 'target' | 'relay' | 'us'
  label: string
  active: boolean
}

interface Connection {
  from: string
  to: string
  active: boolean
  packets: number
}

const W = 260
const H = 140

const nodes = ref<Node[]>([
  { id: 'us', x: 130, y: 70, type: 'us', label: 'YOU', active: true },
  { id: 'tor1', x: 50, y: 30, type: 'relay', label: 'TOR1', active: true },
  { id: 'tor2', x: 210, y: 30, type: 'relay', label: 'TOR2', active: true },
  { id: 'tor3', x: 40, y: 110, type: 'relay', label: 'TOR3', active: false },
  { id: 'tor4', x: 220, y: 110, type: 'relay', label: 'TOR4', active: true },
  { id: 'nasa', x: 30, y: 65, type: 'target', label: 'NASA', active: false },
  { id: 'fbi', x: 228, y: 65, type: 'target', label: 'FBI', active: false },
])

const connections = ref<Connection[]>([
  { from: 'us', to: 'tor1', active: true, packets: 42 },
  { from: 'us', to: 'tor2', active: true, packets: 18 },
  { from: 'us', to: 'tor4', active: true, packets: 67 },
  { from: 'tor1', to: 'nasa', active: false, packets: 0 },
  { from: 'tor2', to: 'fbi', active: false, packets: 0 },
  { from: 'tor3', to: 'us', active: false, packets: 5 },
])

// Animated packets moving along connections
const packetPositions = ref<Record<string, number>>({})

useIntervalFn(() => {
  // Shift packet positions
  const updated: Record<string, number> = {}
  connections.value.forEach((c) => {
    if (c.active) {
      const key = `${c.from}-${c.to}`
      updated[key] = ((packetPositions.value[key] ?? 0) + 0.06) % 1
    }
  })
  packetPositions.value = updated

  // Randomly toggle outer nodes
  nodes.value = nodes.value.map((n) => {
    if (n.type === 'target' && Math.random() > 0.85) {
      return { ...n, active: !n.active }
    }
    return n
  })

  // Update some connection packets
  connections.value = connections.value.map((c) => ({
    ...c,
    packets: c.active ? Math.floor(Math.random() * 99 + 1) : 0,
  }))
}, 200)

function getNode(id: string): Node | undefined {
  return nodes.value.find((n) => n.id === id)
}

const packetDots = computed(() => {
  return connections.value
    .filter((c) => c.active)
    .map((c) => {
      const from = getNode(c.from)
      const to = getNode(c.to)
      if (!from || !to) return null
      const t = packetPositions.value[`${c.from}-${c.to}`] ?? 0
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        key: `${c.from}-${c.to}`,
      }
    })
    .filter(Boolean)
})

const NODE_COLORS = {
  us: '#00ff41',
  relay: '#00d4ff',
  host: '#ffb830',
  target: '#ff3333',
}
</script>

<template>
  <div class="netgraph-wrap">
    <div class="net-title">// NETWORK MAP</div>
    <svg :width="W" :height="H" class="net-svg">
      <defs>
        <filter id="node-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Connections -->
      <line
        v-for="conn in connections"
        :key="`${conn.from}-${conn.to}`"
        :x1="getNode(conn.from)?.x ?? 0"
        :y1="getNode(conn.from)?.y ?? 0"
        :x2="getNode(conn.to)?.x ?? 0"
        :y2="getNode(conn.to)?.y ?? 0"
        :stroke="conn.active ? '#00ff4140' : '#ffffff10'"
        stroke-width="1"
        stroke-dasharray="3 4"
      />

      <!-- Animated packet dots -->
      <circle
        v-for="dot in packetDots"
        :key="dot!.key"
        :cx="dot!.x"
        :cy="dot!.y"
        r="2.5"
        fill="#00ff41"
        filter="url(#node-glow)"
        opacity="0.9"
      />

      <!-- Nodes -->
      <g v-for="node in nodes" :key="node.id" :transform="`translate(${node.x}, ${node.y})`">
        <!-- Outer ring for active -->
        <circle
          v-if="node.active"
          r="10"
          :fill="NODE_COLORS[node.type] + '15'"
          :stroke="NODE_COLORS[node.type] + '50'"
          stroke-width="0.8"
          class="node-ring"
          style="transform-origin: center; transform-box: fill-box"
        />
        <!-- Main circle -->
        <circle
          r="5"
          :fill="node.active ? NODE_COLORS[node.type] : '#333'"
          :filter="node.active ? 'url(#node-glow)' : ''"
        />
        <!-- Label -->
        <text
          dy="16"
          text-anchor="middle"
          :fill="node.active ? NODE_COLORS[node.type] : '#444'"
          font-size="7"
          font-family="monospace"
        >
          {{ node.label }}
        </text>
      </g>
    </svg>

    <!-- Connection list -->
    <div class="net-stats">
      <div
        v-for="conn in connections.slice(0, 3)"
        :key="`stat-${conn.from}-${conn.to}`"
        class="net-stat-row"
      >
        <span class="net-stat-name">{{ conn.from }}→{{ conn.to }}</span>
        <span class="net-stat-val" :style="{ color: conn.active ? '#00ff41' : '#444' }">
          {{ conn.active ? `${conn.packets}pkt` : 'DEAD' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.netgraph-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.net-title {
  color: #00ff41;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.8;
}
.net-svg {
  display: block;
  width: 100%;
  height: auto;
}
.node-ring {
  animation: ring-pulse 2s ease infinite;
  transform-origin: center;
  transform-box: fill-box;
}
@keyframes ring-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.2;
  }
}
.net-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}
.net-stat-row {
  display: flex;
  justify-content: space-between;
  font-family: 'Courier New', monospace;
  font-size: 9px;
}
.net-stat-name {
  color: rgba(0, 255, 65, 0.4);
}
.net-stat-val {
  font-weight: bold;
}
</style>
