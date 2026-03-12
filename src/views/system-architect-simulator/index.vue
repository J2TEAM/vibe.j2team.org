<template>
  <div
    class="h-screen w-full bg-bg-deep text-text-primary flex overflow-hidden font-sans relative selection:bg-accent-sky/30"
  >
    <!-- Sidebar Component -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      :timelineRunning="timelineRunning"
      :activeStressEventId="activeStressEvent?.id"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      @drag-start="onDragStart"
      @load-template="loadTemplate"
      @start-simulation="startTimelineSimulation"
      @reset-simulation="resetSimulation"
      @clear-canvas="clearCanvas"
      @trigger-stress-event="triggerStressEvent"
      @stop-stress-event="stopStressEvent"
    />

    <!-- Main Canvas Area -->
    <div
      class="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,transparent_100%)]"
      :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'"
      @mousedown="startPan"
      @mousemove="onPan"
      @mouseup="stopPan"
      @mouseleave="stopPan"
      @dragover.prevent
      @drop="onDrop"
      ref="canvasRef"
      @click="selectedNodeId = null"
    >
      <!-- Background Grid -->
      <div
        class="absolute inset-0 pointer-events-none opacity-20"
        style="
          background-image:
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px);
          background-size: 40px 40px;
        "
      ></div>

      <!-- Cost Badge -->
      <div
        class="absolute top-4 right-4 bg-bg-surface/80 backdrop-blur-sm border border-default px-3 py-1.5 rounded-sm flex items-center gap-2 z-10 shadow-lg cursor-default"
      >
        <span class="text-xs">💰</span>
        <div class="flex flex-col">
          <span class="text-[8px] text-text-dim uppercase tracking-widest font-display"
            >Est. Monthly Cost</span
          >
          <span class="text-accent-amber font-mono font-bold leading-none"
            >${{ totalMonthlyCost.toLocaleString() }}</span
          >
        </div>
      </div>

      <!-- Timeline Progress -->
      <div
        v-if="timelineRunning"
        class="absolute top-0 left-0 w-full h-1 z-50 bg-bg-deep cursor-default"
      >
        <div
          class="h-full bg-accent-sky transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(56,189,248,0.8)]"
          :style="{ width: `${timelineProgress}%` }"
        ></div>
      </div>

      <!-- Zoom & Pan Wrapper -->
      <div
        class="absolute inset-0 origin-top-left"
        :style="{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }"
      >
        <!-- Edges Layer -->
        <svg
          class="absolute top-0 left-0 pointer-events-none"
          width="8000"
          height="8000"
          style="z-index: 5"
        >
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#ff6b4a" stop-opacity="0.2" />
            </linearGradient>
            <linearGradient id="edge-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#ff6b4a" />
            </linearGradient>
          </defs>

          <!-- Active drawing wire -->
          <path
            v-if="activeWirePath"
            :d="activeWirePath"
            fill="none"
            stroke="url(#edge-active)"
            stroke-width="2"
            stroke-dasharray="6,6"
            class="animate-flow"
          />

          <!-- Rendered edges -->
          <g v-for="edge in renderedEdges" :key="edge.id" class="group">
            <!-- Invisible wide path for easier clicking to delete -->
            <path
              :d="edge.path"
              fill="none"
              stroke="transparent"
              stroke-width="15"
              class="pointer-events-auto cursor-pointer transition-colors hover:stroke-accent-coral/50"
              @mousedown.stop
              @click.stop="deleteEdge(edge.id)"
            />

            <!-- Base subtle line -->
            <path
              :d="edge.path"
              fill="none"
              stroke="url(#edge-gradient)"
              stroke-width="2"
              class="pointer-events-none"
            />
            <!-- Traffic flowing animation -->
            <path
              v-if="edge.traffic > 0"
              :d="edge.path"
              fill="none"
              :stroke="edge.isOverloaded ? '#ff6b4a' : '#38bdf8'"
              stroke-width="2"
              stroke-dasharray="4,8"
              class="animate-flow"
              :style="{ animationDuration: `${Math.max(0.2, 2000 / edge.traffic)}s` }"
            />
            <!-- Traffic Label -->
            <g v-if="edge.traffic > 0" :transform="`translate(${edge.midX}, ${edge.midY})`">
              <rect x="-24" y="-10" width="48" height="20" rx="2" fill="#0f172a" stroke="#1e293b" />
              <text
                x="0"
                y="3"
                fill="#cbd5e1"
                font-size="10"
                font-family="monospace"
                text-anchor="middle"
                dominant-baseline="middle"
              >
                {{ formatTraffic(edge.traffic) }}
              </text>
            </g>
          </g>
        </svg>

        <!-- Nodes Layer -->
        <div
          class="absolute top-0 left-0 w-[8000px] h-[8000px] pointer-events-none"
          style="z-index: 10"
        >
          <CanvasNode
            v-for="node in nodes"
            :key="node.id"
            :node="node"
            :isSelected="selectedNodeId === node.id"
            :isDragged="draggedNodeId === node.id"
            @drag-start="startNodeDrag($event, node)"
            @select="selectedNodeId = node.id"
            @wire-start="(ev, type) => startWiring(ev, node.id, type)"
            @wire-end="(type) => finishWiring(node.id, type)"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="nodes.length === 0"
        class="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      >
        <div class="text-center">
          <div class="text-text-dim/30 text-5xl mb-3">⚙️</div>
          <div class="text-text-dim/40 font-display text-sm tracking-widest">
            DRAG COMPONENTS OR LOAD A TEMPLATE
          </div>
        </div>
      </div>

      <!-- Back to Home Button -->
      <RouterLink
        to="/"
        class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-bg-surface/90 backdrop-blur-md border border-default hover:border-accent-sky px-4 py-2 rounded-full shadow-xl text-text-secondary hover:text-accent-sky font-display tracking-widest text-xs transition-all z-40 group cursor-pointer"
        title="Quay lại Trang Chủ"
      >
        <span class="group-hover:-translate-x-1 transition-transform">←</span>
        <span>TRANG CHỦ</span>
      </RouterLink>

      <!-- Zoom Controls -->
      <div
        class="absolute bottom-6 right-6 flex items-center bg-bg-surface/90 backdrop-blur-md border border-default rounded-sm shadow-xl p-1 z-40 cursor-default"
      >
        <button
          @click="zoomOut"
          class="w-8 h-8 flex items-center justify-center text-text-dim hover:text-accent-sky hover:bg-bg-elevated transition-colors rounded-sm"
          title="Zoom Out"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>
        <button
          @click="resetZoom"
          class="px-3 h-8 flex items-center justify-center text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors border-l border-r border-default/50"
          title="Reset Zoom"
        >
          {{ Math.round(zoomLevel * 100) }}%
        </button>
        <button
          @click="zoomIn"
          class="w-8 h-8 flex items-center justify-center text-text-dim hover:text-accent-sky hover:bg-bg-elevated transition-colors rounded-sm"
          title="Zoom In"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <!-- Event Logs Panel -->
      <EventLogs
        :logs="eventLogs"
        :isVisible="timelineRunning || eventLogs.length > 0"
        :isExpanded="showEventLogs"
        @toggle="showEventLogs = !showEventLogs"
        @clear="eventLogs = []"
      />

      <!-- Analysis Panel -->
      <AnalysisReport
        :hints="simulationHints"
        :stats="simulationStats"
        @dismiss="simulationHints = []"
      />

      <!-- Properties Panel -->
      <PropertiesPanel
        :selectedNode="selectedNode"
        :connectedEdges="selectedNode ? getConnectedEdges(selectedNode.id) : []"
        @close="selectedNodeId = null"
        @delete-edge="deleteEdge"
        @delete-node="deleteSelectedNode"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import Sidebar from './components/Sidebar.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import CanvasNode from './components/CanvasNode.vue'
import AnalysisReport from './components/AnalysisReport.vue'
import EventLogs from './components/EventLogs.vue'

import { useGraph } from './composables/useGraph'
import { useSimulation } from './composables/useSimulation'

import { formatTraffic } from './utils'

const sidebarCollapsed = ref(false)

const {
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
  selectedNodeId,
  selectedNode,
  draggedNodeId,
  canvasRef,
  totalMonthlyCost,
  getConnectedEdges,
  deleteSelectedNode,
  deleteEdge,
  clearCanvas,
  startNodeDrag,
  onDragStart,
  onDrop,
  activeWirePath,
  renderedEdges,
  startWiring,
  finishWiring,
  loadTemplate,
} = useGraph()

const {
  simulationHints,
  simulationStats,
  timelineRunning,
  timelineProgress,
  eventLogs,
  showEventLogs,
  resetSimulation,
  startTimelineSimulation,
  triggerStressEvent,
  stopStressEvent,
  activeStressEvent,
} = useSimulation(nodes, edges, totalMonthlyCost)
</script>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-2px, 1px);
  }
  50% {
    transform: translate(2px, -1px);
  }
  75% {
    transform: translate(-1px, 2px);
  }
}
.animate-shake {
  animation: shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite both;
}
@keyframes flow {
  to {
    stroke-dashoffset: -14;
  }
}
.animate-flow {
  animation: flow linear infinite;
}
</style>
