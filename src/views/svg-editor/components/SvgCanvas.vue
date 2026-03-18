<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { SvgElement, SvgGradient, ToolType, GridConfig } from '../types'
import { getBBox } from '../types'
import SvgElementRenderer from './SvgElementRenderer.vue'

const props = defineProps<{
  elements: SvgElement[]
  selectedIds: Set<string>
  activeTool: ToolType
  fillColor: string
  strokeColor: string
  strokeWidth: number
  zoom: number
  panX: number
  panY: number
  grid: GridConfig
  isDrawing: boolean
  startPoint: { x: number; y: number }
  currentPoint: { x: number; y: number }
  pathPoints: { x: number; y: number }[]
  polygonPoints: { x: number; y: number }[]
  gradients: SvgGradient[]
}>()

const emit = defineEmits<{
  mousedown: [MouseEvent]
  mousemove: [MouseEvent]
  mouseup: []
}>()

const canvasRef = ref<SVGSVGElement | null>(null)
defineExpose({ canvasRef })

const transform = computed(() => `scale(${props.zoom}) translate(${props.panX}px, ${props.panY}px)`)

function previewD(): string {
  if (props.pathPoints.length < 1) return ''
  const pts = props.pathPoints
  if (pts.length === 0) return ''
  let d = `M${pts[0]!.x},${pts[0]!.y}`
  
  if (pts.length < 3) {
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i]!
      d += ` L${p.x},${p.y}`
    }
  } else {
    // Smooth preview using the same midpoint logic
    for (let i = 1; i < pts.length - 1; i++) {
      const p1 = pts[i]!
      const p2 = pts[i + 1]!
      const xc = (p1.x + p2.x) / 2
      const yc = (p1.y + p2.y) / 2
      d += ` Q${p1.x},${p1.y} ${xc},${yc}`
    }
    const last = pts[pts.length - 1]!
    d += ` L${last.x},${last.y}`
  }
  
  // Connect to current move point
  d += ` L${props.currentPoint.x},${props.currentPoint.y}`
  return d
}

function elTransform(el: SvgElement): string | undefined {
  const transforms: string[] = []
  if (el.transform) transforms.push(el.transform)
  if (el.rotation) {
    const cx = el.cx ?? ((el.x ?? 0) + (el.width ?? 0) / 2)
    const cy = el.cy ?? ((el.y ?? 0) + (el.height ?? 0) / 2)
    transforms.push(`rotate(${el.rotation} ${cx} ${cy})`)
  }
  return transforms.length > 0 ? transforms.join(' ') : undefined
}
</script>

<template>
  <main class="flex-1 relative overflow-hidden" style="background-color: #0c141e; background-image: radial-gradient(circle, #1a2a3a 0.5px, transparent 0.5px); background-size: 24px 24px;">
    <div class="absolute inset-0 flex items-center justify-center">
      <div :style="{ transform }" class="transition-transform duration-150 origin-center">
        <div class="relative border border-border-default" style="box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 80px rgba(255,107,74,0.03);">
          <div class="absolute -inset-px bg-gradient-to-br from-accent-coral/15 via-transparent to-accent-sky/15 pointer-events-none" />
          <svg
            ref="canvasRef"
            viewBox="0 0 800 600"
            class="block relative z-[1]"
            style="width: 800px; height: 600px;"
            :class="activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'"
            @mousedown="emit('mousedown', $event)"
            @mousemove="emit('mousemove', $event)"
            @mouseup="emit('mouseup')"
            @mouseleave="emit('mouseup')"
          >
            <defs>
              <pattern id="checker" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#1a2332" />
                <rect width="10" height="10" fill="#1e2a3a" />
                <rect x="10" y="10" width="10" height="10" fill="#1e2a3a" />
              </pattern>
              <pattern v-if="grid.enabled" id="grid" x="0" y="0" :width="grid.size" :height="grid.size" patternUnits="userSpaceOnUse">
                <path :d="`M ${grid.size} 0 L 0 0 0 ${grid.size}`" fill="none" stroke="#253549" stroke-width="0.5" opacity="0.6" />
              </pattern>

              <!-- Dynamic Gradients -->
              <template v-for="g in gradients" :key="g.id">
                <linearGradient v-if="g.type === 'linear'" :id="g.id" :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2">
                   <stop v-for="(s, i) in g.stops" :key="i" :offset="s.offset" :stop-color="s.color" :stop-opacity="s.opacity" />
                </linearGradient>
                <radialGradient v-if="g.type === 'radial'" :id="g.id" :cx="g.cx" :cy="g.cy" :r="g.r" :fx="g.fx" :fy="g.fy">
                   <stop v-for="(s, i) in g.stops" :key="i" :offset="s.offset" :stop-color="s.color" :stop-opacity="s.opacity" />
                </radialGradient>
              </template>
            </defs>
            <rect width="800" height="600" fill="url(#checker)" />
            <rect v-if="grid.enabled" width="800" height="600" fill="url(#grid)" />

            <!-- Elements -->
            <SvgElementRenderer v-for="el in elements" :key="el.id" :el="el" />

            <!-- Selection highlight (bounding box) -->
            <template v-for="el in elements" :key="'sel-'+el.id">
              <template v-if="el.visible && selectedIds.has(el.id)">
                <rect v-if="el.type === 'rect'" :x="(el.x ?? 0) - 3" :y="(el.y ?? 0) - 3" :width="(el.width ?? 0) + 6" :height="(el.height ?? 0) + 6" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="6 3" :transform="elTransform(el)" style="animation: dash-march 0.6s linear infinite" />
                <circle v-if="el.type === 'circle'" :cx="el.cx" :cy="el.cy" :r="(el.r ?? 0) + 5" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="6 3" :transform="elTransform(el)" style="animation: dash-march 0.6s linear infinite" />
                <ellipse v-if="el.type === 'ellipse'" :cx="el.cx" :cy="el.cy" :rx="(el.rx ?? 0) + 5" :ry="(el.ry ?? 0) + 5" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="6 3" :transform="elTransform(el)" style="animation: dash-march 0.6s linear infinite" />
                <line v-if="el.type === 'line'" :x1="el.x1" :y1="el.y1" :x2="el.x2" :y2="el.y2" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="6 3" opacity="0.5" :transform="elTransform(el)" style="animation: dash-march 0.6s linear infinite" />
                <rect v-if="['path', 'polygon', 'text', 'image', 'group'].includes(el.type)" :x="getBBox(el).x - 4" :y="getBBox(el).y - 4" :width="getBBox(el).w + 8" :height="getBBox(el).h + 8" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="6 3" style="animation: dash-march 0.6s linear infinite" />
              </template>
            </template>

            <!-- Drawing previews -->
            <rect v-if="isDrawing && activeTool === 'rect'" :x="Math.min(startPoint.x, currentPoint.x)" :y="Math.min(startPoint.y, currentPoint.y)" :width="Math.abs(currentPoint.x - startPoint.x)" :height="Math.abs(currentPoint.y - startPoint.y)" :fill="fillColor" :stroke="strokeColor" :stroke-width="strokeWidth" opacity="0.5" />
            <circle v-if="isDrawing && activeTool === 'circle'" :cx="startPoint.x" :cy="startPoint.y" :r="Math.round(Math.sqrt((currentPoint.x - startPoint.x) ** 2 + (currentPoint.y - startPoint.y) ** 2))" :fill="fillColor" :stroke="strokeColor" :stroke-width="strokeWidth" opacity="0.5" />
            <ellipse v-if="isDrawing && activeTool === 'ellipse'" :cx="startPoint.x" :cy="startPoint.y" :rx="Math.abs(currentPoint.x - startPoint.x)" :ry="Math.abs(currentPoint.y - startPoint.y)" :fill="fillColor" :stroke="strokeColor" :stroke-width="strokeWidth" opacity="0.5" />
            <line v-if="isDrawing && activeTool === 'line'" :x1="startPoint.x" :y1="startPoint.y" :x2="currentPoint.x" :y2="currentPoint.y" :stroke="strokeColor" :stroke-width="strokeWidth" opacity="0.5" />
            <path v-if="isDrawing && activeTool === 'path' && pathPoints.length > 0" :d="previewD()" fill="none" :stroke="strokeColor" :stroke-width="strokeWidth" opacity="0.5" />
            <template v-if="activeTool === 'polygon' && polygonPoints.length > 0">
              <circle v-for="(pt, i) in polygonPoints" :key="i" :cx="pt.x" :cy="pt.y" r="4" fill="#38BDF8" stroke="#0F1923" stroke-width="1.5" />
              <polyline :points="[...polygonPoints, currentPoint].map(p => `${p.x},${p.y}`).join(' ')" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4 4" />
            </template>
          </svg>

          <div v-if="activeTool === 'polygon' && polygonPoints.length >= 3" class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-bg-surface/95 border border-accent-sky/50 text-accent-sky text-[11px] px-4 py-2 font-display tracking-wide backdrop-blur-sm z-10">
            <Icon icon="lucide:info" class="inline size-3.5 mr-1 -mt-0.5" />
            Nhấn Esc để hoàn thành
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-3 right-3 text-[10px] font-mono text-text-dim bg-bg-surface/90 px-2.5 py-1 border border-border-default backdrop-blur-sm flex items-center gap-1.5 z-10">
      <Icon icon="lucide:crosshair" class="size-3 text-accent-sky" />
      <span class="text-accent-sky">{{ currentPoint.x }}</span>
      <span>,</span>
      <span class="text-accent-amber">{{ currentPoint.y }}</span>
    </div>
  </main>
</template>

<style scoped>
@keyframes dash-march { to { stroke-dashoffset: -18; } }
</style>
