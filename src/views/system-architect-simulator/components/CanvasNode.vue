<template>
  <div
    class="absolute cursor-grab active:cursor-grabbing transition-shadow duration-200 select-none pointer-events-auto"
    :class="[isDragged ? 'z-50 opacity-90' : 'z-10', isSelected ? 'z-40' : '']"
    :style="{ left: `${node.x}px`, top: `${node.y}px`, width: '180px' }"
    @mousedown.stop="$emit('drag-start', $event)"
    @click.stop="$emit('select')"
  >
    <div
      class="border rounded-sm overflow-hidden transition-all duration-300"
      :class="[
        node.isOverloaded
          ? 'animate-shake border-accent-coral shadow-[0_0_20px_rgba(255,107,74,0.3)]'
          : node.hasWarning
            ? 'border-accent-amber/70 shadow-[0_0_12px_rgba(255,184,48,0.15)]'
            : 'border-default/60 shadow-lg',
        isSelected ? 'ring-1 ring-accent-amber/60' : '',
        node.circuitOpen ? 'opacity-60' : '',
      ]"
    >
      <!-- Header -->
      <div
        class="px-2.5 py-1 flex justify-between items-center pointer-events-none"
        :style="{
          backgroundColor: nodeColor + '18',
          borderBottom: '1px solid ' + nodeColor + '30',
        }"
      >
        <span class="text-[9px] text-text-dim font-display tracking-widest">{{ node.id }}</span>
        <div class="flex items-center gap-1">
          <span
            v-if="
              node.config.instanceTier &&
              node.config.instanceTier !== 'custom' &&
              node.type !== 'CLIENT' &&
              node.type !== 'RATELIMIT'
            "
            class="text-[8px] text-text-dim bg-black/30 px-1 rounded uppercase mr-1"
            title="Instance Tier"
          >
            {{ String(node.config.instanceTier).charAt(0) }}
          </span>
          <span
            v-if="(node.config.replicas || 1) > 1"
            class="text-[8px] text-text-dim bg-black/30 px-1 rounded"
            >×{{ node.config.replicas }}</span
          >
          <span class="text-sm">{{ typeDef?.icon }}</span>
        </div>
      </div>

      <!-- Body -->
      <div class="bg-bg-surface/90 backdrop-blur-sm px-2.5 py-2 pointer-events-none">
        <div
          class="text-[10px] font-display tracking-wider text-center mb-1.5"
          :style="{ color: nodeColor }"
        >
          {{ typeDef?.label }}
        </div>

        <!-- Client Stats -->
        <div v-if="node.type === 'CLIENT'" class="text-center">
          <div class="font-display text-xs text-accent-coral">
            {{ node.config.inputTraffic || 0 }} <span class="text-[9px] text-text-dim">req/s</span>
          </div>
          <div class="text-[8px] text-text-dim mt-0.5">
            R:{{ node.config.readPercent || 70 }}% W:{{ 100 - (node.config.readPercent || 70) }}%
          </div>
        </div>
        <!-- Service Stats -->
        <div v-else class="space-y-1">
          <div class="flex items-center justify-between text-[10px]">
            <span class="text-text-dim">Load</span>
            <span
              :class="
                node.isOverloaded
                  ? 'text-accent-coral font-bold'
                  : node.hasWarning
                    ? 'text-accent-amber'
                    : 'text-text-primary'
              "
              class="font-display"
            >
              {{ formatTraffic(node.currentTraffic || 0) }} / {{ formatTraffic(effectiveCapacity) }}
            </span>
          </div>
          <!-- Load Bar -->
          <div class="h-1 bg-black/40 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{
                width: `${Math.min(100, ((node.currentTraffic || 0) / (effectiveCapacity || 1)) * 100)}%`,
                backgroundColor: node.isOverloaded
                  ? '#ff6b4a'
                  : node.hasWarning
                    ? '#ffb830'
                    : nodeColor,
              }"
            ></div>
          </div>
          <!-- Metrics Row -->
          <div class="flex justify-between text-[8px] text-text-dim">
            <span>{{ node.config.latency || 0 }}ms</span>
            <span v-if="node.circuitOpen" class="text-accent-coral font-bold">CIRCUIT OPEN</span>
            <span
              v-else-if="node.currentErrorRate"
              :class="(node.currentErrorRate || 0) > 5 ? 'text-accent-coral' : ''"
            >
              err: {{ node.currentErrorRate?.toFixed(1) }}%
            </span>
            <span>${{ cost }}/mo</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Ports -->
    <div
      class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full port cursor-crosshair hover:scale-150 transition-transform duration-150"
      style="
        left: -6px;
        background: #38bdf8;
        border: 2px solid #0ea5e9;
        box-shadow: 0 0 6px rgba(56, 189, 248, 0.4);
      "
      @mousedown.stop="$emit('wire-start', $event, 'in')"
      @mouseup.stop="$emit('wire-end', 'in')"
    ></div>
    <div
      class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full port cursor-crosshair hover:scale-150 transition-transform duration-150"
      style="
        right: -6px;
        background: #ff6b4a;
        border: 2px solid #ef4444;
        box-shadow: 0 0 6px rgba(255, 107, 74, 0.4);
      "
      @mousedown.stop="$emit('wire-start', $event, 'out')"
      @mouseup.stop="$emit('wire-end', 'out')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { nodeTypeMap } from '../constants'
import type { NodeData } from '../types'
import { formatTraffic, getEffectiveCapacity, getNodeCost } from '../utils'

const props = defineProps<{
  node: NodeData
  isSelected: boolean
  isDragged: boolean
}>()

defineEmits<{
  (e: 'drag-start', ev: MouseEvent): void
  (e: 'select'): void
  (e: 'wire-start', ev: MouseEvent, type: 'in' | 'out'): void
  (e: 'wire-end', type: 'in' | 'out'): void
}>()

const typeDef = computed(() => nodeTypeMap[props.node.type])
const nodeColor = computed(() => typeDef.value?.color || '#fff')
const effectiveCapacity = computed(() => getEffectiveCapacity(props.node))
const cost = computed(() => getNodeCost(props.node))
</script>
