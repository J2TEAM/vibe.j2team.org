<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Province } from '../types'

const props = defineProps<{
  provinces: Province[]
  selectedProvinceId: string | null
  difficulty: string
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'drag-start', id: string): void
}>()

const searchQuery = ref('')

const filteredProvinces = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return props.provinces
  return props.provinces.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.shortName.toLowerCase().includes(q)
  )
})

// Show hint info based on difficulty
function getHintText(province: Province): string {
  switch (props.difficulty) {
    case 'easy': return province.zone
    case 'medium': return province.shortName
    default: return ''
  }
}

function onDragStart(e: DragEvent, provinceId: string) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', provinceId)
    e.dataTransfer.effectAllowed = 'move'
  }
  emit('drag-start', provinceId)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Search -->
    <div class="relative mb-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="🔍 Tìm tỉnh..."
        class="w-full bg-bg-deep border border-border-default px-3 py-2 text-sm
               text-text-primary placeholder-text-dim font-body
               focus:outline-none focus:border-accent-sky transition-colors duration-200"
      />
    </div>

    <!-- Province count -->
    <p class="text-xs text-text-dim font-display tracking-wide mb-2">
      Còn lại: {{ provinces.length }} tỉnh
    </p>

    <!-- Province list -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden pr-1 space-y-1.5
                md:max-h-[55vh]
                max-h-[25vh]
                scrollbar-thin">
      <!-- Desktop: vertical list -->
      <div class="hidden md:block space-y-1.5">
        <div
          v-for="p in filteredProvinces"
          :key="p.id"
          draggable="true"
          :class="[
            'border px-3 py-2 text-sm font-display cursor-grab select-none',
            'transition-all duration-200',
            selectedProvinceId === p.id
              ? 'border-2 border-accent-sky bg-bg-elevated text-text-primary shadow-lg shadow-accent-sky/10'
              : 'border-border-default bg-bg-surface text-text-primary hover:border-accent-sky hover:bg-bg-elevated',
          ]"
          @dragstart="(e: DragEvent) => onDragStart(e, p.id)"
          @click="emit('select', p.id)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate">{{ p.name }}</span>
            <span
              v-if="getHintText(p)"
              class="text-xs text-text-dim whitespace-nowrap"
            >
              {{ getHintText(p) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Mobile: horizontal scroll / wrap -->
      <div class="md:hidden flex flex-wrap gap-1.5">
        <div
          v-for="p in filteredProvinces"
          :key="p.id"
          :class="[
            'border px-2.5 py-1.5 text-xs font-display cursor-pointer select-none',
            'transition-all duration-200 whitespace-nowrap',
            selectedProvinceId === p.id
              ? 'border-2 border-accent-sky bg-bg-elevated text-text-primary'
              : 'border-border-default bg-bg-surface text-text-primary hover:border-accent-sky',
          ]"
          @click="emit('select', p.id)"
        >
          {{ p.name }}
          <span v-if="getHintText(p)" class="text-text-dim ml-1">{{ getHintText(p) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: var(--color-bg-deep);
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent-sky);
}
</style>
