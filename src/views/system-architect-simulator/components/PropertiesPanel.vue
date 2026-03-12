<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div
    v-if="selectedNode"
    class="absolute top-4 right-4 w-64 bg-bg-surface/90 backdrop-blur-md border border-default rounded-sm shadow-2xl z-40 pointer-events-auto flex flex-col max-h-[calc(100vh-2rem)]"
    @mousedown.stop
    @click.stop
  >
    <div
      class="px-3 py-2 border-b border-default flex justify-between items-center bg-bg-elevated/50 shrink-0"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm">{{ nodeTypeMap[selectedNode.type]?.icon }}</span>
        <span class="font-display text-[10px] tracking-widest text-text-secondary">{{
          nodeTypeMap[selectedNode.type]?.label
        }}</span>
      </div>
      <button @click="$emit('close')" class="text-text-dim hover:text-white text-xs">✕</button>
    </div>

    <div class="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-4">
      <!-- ID -->
      <div>
        <div class="text-[9px] text-text-dim uppercase tracking-widest mb-1 font-display">
          Node ID
        </div>
        <div
          class="font-mono text-xs text-text-primary bg-black/20 px-2 py-1 rounded-sm border border-default/30"
        >
          {{ selectedNode.id }}
        </div>
      </div>

      <!-- Configs -->
      <div>
        <div class="text-[9px] text-text-dim uppercase tracking-widest mb-2 font-display">
          Configuration
        </div>
        <div class="space-y-3">
          <div v-if="selectedNode.type === 'CLIENT'">
            <label class="block text-[10px] text-text-secondary mb-1">Target Traffic (req/s)</label>
            <input
              type="number"
              v-model.number="selectedNode.config.inputTraffic"
              class="w-full bg-bg-deep border border-default px-2 py-1 text-xs text-white focus:border-accent-sky outline-none transition-colors"
            />
            <label class="block text-[10px] text-text-secondary mb-1 mt-2">Read Traffic (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              v-model.number="selectedNode.config.readPercent"
              class="w-full"
            />
            <div class="text-right text-[9px] text-text-dim mt-0.5">
              {{ selectedNode.config.readPercent || 0 }}% Read /
              {{ 100 - (selectedNode.config.readPercent || 0) }}% Write
            </div>
          </div>
          <div v-else-if="selectedNode.type === 'RATELIMIT'">
            <label class="block text-[10px] text-text-secondary mb-1">Rate Limit (req/s)</label>
            <input
              type="number"
              v-model.number="selectedNode.config.rateLimit"
              class="w-full bg-bg-deep border border-default px-2 py-1 text-xs text-white focus:border-accent-sky outline-none transition-colors"
            />
          </div>
          <div v-else>
            <div class="mb-3">
              <label class="block text-[10px] text-text-secondary mb-1">Instance Size</label>
              <select
                v-model="selectedNode.config.instanceTier"
                class="w-full bg-bg-deep border border-default p-1 text-xs text-white focus:border-accent-sky outline-none transition-colors appearance-none"
              >
                <option value="nano">Nano (0.5 vCPU, 1GB) - $5/mo</option>
                <option value="micro">Micro (1 vCPU, 2GB) - $10/mo</option>
                <option value="small">Small (2 vCPU, 4GB) - $20/mo</option>
                <option value="medium">Medium (4 vCPU, 8GB) - $40/mo</option>
                <option value="large">Large (8 vCPU, 16GB) - $80/mo</option>
                <option value="xlarge">X-Large (16 vCPU, 32GB) - $160/mo</option>
                <option value="custom">Custom Spec...</option>
              </select>
            </div>

            <div
              v-if="selectedNode.config.instanceTier === 'custom'"
              class="mb-3 grid grid-cols-2 gap-2 p-2 bg-bg-deep/50 border border-default/30 rounded-sm"
            >
              <div>
                <label class="block text-[9px] text-text-dim mb-1">vCPU</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  v-model.number="selectedNode.config.customVCpu"
                  class="w-full bg-bg-deep border border-default px-2 py-1 text-xs focus:border-accent-sky"
                />
              </div>
              <div>
                <label class="block text-[9px] text-text-dim mb-1">RAM (GB)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  v-model.number="selectedNode.config.customRamGb"
                  class="w-full bg-bg-deep border border-default px-2 py-1 text-xs focus:border-accent-sky"
                />
              </div>
            </div>
            <div class="mb-3">
              <label class="block text-[10px] text-text-secondary mb-1 flex justify-between">
                <span>Replicas</span>
                <span class="text-text-dim">{{ selectedNode.config.replicas || 1 }}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                v-model.number="selectedNode.config.replicas"
                class="w-full"
              />
            </div>
            <div class="mb-3">
              <label class="block text-[10px] text-text-secondary mb-1">Latency (ms)</label>
              <input
                type="number"
                v-model.number="selectedNode.config.latency"
                class="w-full bg-bg-deep border border-default px-2 py-1 text-xs text-white focus:border-accent-sky outline-none transition-colors"
              />
            </div>
            <div>
              <label class="block text-[10px] text-text-secondary mb-1">Base Error Rate (%)</label>
              <input
                type="number"
                step="0.1"
                v-model.number="selectedNode.config.baseErrorRate"
                class="w-full bg-bg-deep border border-default px-2 py-1 text-xs text-white focus:border-accent-sky outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Auto Scale -->
      <div
        v-if="!['CLIENT', 'RATELIMIT'].includes(selectedNode.type)"
        class="bg-bg-deep/50 p-2 border border-default/30 rounded-sm mb-4"
      >
        <label class="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            v-model="selectedNode.config.autoScale"
            class="accent-accent-sky w-3 h-3 cursor-pointer"
          />
          <span
            class="text-[10px] font-display tracking-wider transition-colors"
            :class="
              selectedNode.config.autoScale
                ? 'text-accent-sky'
                : 'text-text-dim group-hover:text-text-secondary'
            "
          >
            ENABLE AUTO-SCALE
          </span>
        </label>

        <div
          v-if="selectedNode.config.autoScale"
          class="mt-3 pl-5 border-l-2 border-accent-sky/20 space-y-3"
        >
          <div>
            <label class="block text-[9px] text-text-secondary mb-1">Max Replicas Limit</label>
            <input
              type="number"
              min="2"
              max="100"
              step="1"
              v-model.number="selectedNode.config.maxReplicas"
              class="w-full bg-bg-deep border border-default px-2 py-1 text-xs text-white focus:border-accent-sky outline-none transition-colors"
              placeholder="10"
            />
          </div>
          <div>
            <label class="block text-[9px] text-text-secondary mb-1 flex justify-between">
              <span>Scale Up Threshold</span>
              <span class="text-accent-amber"
                >{{ selectedNode.config.scaleUpThreshold || 80 }}% Load</span
              >
            </label>
            <input
              type="range"
              min="40"
              max="95"
              step="5"
              v-model.number="selectedNode.config.scaleUpThreshold"
              class="w-full accent-accent-amber"
            />
          </div>
        </div>
      </div>

      <!-- Live Metrics -->
      <div class="bg-bg-deep/50 p-2 border border-default/30 rounded-sm">
        <div class="text-[9px] text-accent-sky uppercase tracking-widest mb-2 font-display">
          Live Metrics
        </div>
        <div class="space-y-1.5">
          <div class="flex justify-between text-[10px]">
            <span class="text-text-dim">Current Load</span>
            <span
              :class="
                selectedNode.isOverloaded ? 'text-accent-coral font-bold' : 'text-text-primary'
              "
              class="font-display"
            >
              {{ formatTraffic(selectedNode.currentTraffic || 0) }} req/s
            </span>
          </div>
          <div v-if="selectedNode.type !== 'CLIENT'" class="flex justify-between text-[10px]">
            <span class="text-text-dim">Effective Max</span>
            <span class="text-text-secondary font-display"
              >{{ formatTraffic(effectiveCapacity) }} req/s</span
            >
          </div>
          <div v-if="selectedNode.currentErrorRate" class="flex justify-between text-[10px]">
            <span class="text-text-dim">Error Rate</span>
            <span
              :class="
                selectedNode.currentErrorRate > 5 ? 'text-accent-coral' : 'text-text-secondary'
              "
              class="font-display"
              >{{ selectedNode.currentErrorRate?.toFixed(2) }}%</span
            >
          </div>
          <div class="flex justify-between text-[10px]">
            <span class="text-text-dim">Cost</span>
            <span class="text-accent-amber font-display">${{ nodeCost }}/mo</span>
          </div>
        </div>
      </div>

      <!-- Connections -->
      <div>
        <div class="text-[9px] text-text-dim uppercase tracking-widest mb-2 font-display">
          Connections
        </div>
        <div v-if="connectedEdges.length === 0" class="text-[10px] text-text-dim italic">
          No connections
        </div>
        <div v-else class="flex flex-col gap-1">
          <div
            v-for="ce in connectedEdges"
            :key="ce.id"
            class="flex items-center justify-between bg-bg-elevated/30 border border-default/20 px-2 py-1 rounded-sm text-[10px] group"
          >
            <span class="text-text-secondary">{{
              ce.fromNodeId === selectedNode.id ? `→ ${ce.toNodeId}` : `← ${ce.fromNodeId}`
            }}</span>
            <button
              @click="$emit('delete-edge', ce.id)"
              class="text-text-dim hover:text-accent-coral opacity-0 group-hover:opacity-100 transition-all text-[10px]"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-3 border-t border-default shrink-0">
      <button
        @click="$emit('delete-node')"
        class="w-full border border-accent-coral/40 text-accent-coral hover:bg-accent-coral hover:text-bg-deep font-display py-1.5 text-[10px] tracking-wider transition-all duration-200"
      >
        DELETE NODE
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { nodeTypeMap } from '../constants'
import type { NodeData, EdgeData } from '../types'
import { formatTraffic, getEffectiveCapacity, getNodeCost } from '../utils'

const props = defineProps<{
  selectedNode: NodeData | undefined
  connectedEdges: EdgeData[]
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'delete-edge', id: string): void
  (e: 'delete-node'): void
}>()

const effectiveCapacity = computed(() => {
  if (!props.selectedNode) return 0
  return getEffectiveCapacity(props.selectedNode)
})

const nodeCost = computed(() => {
  if (!props.selectedNode) return 0
  return getNodeCost(props.selectedNode)
})
</script>
