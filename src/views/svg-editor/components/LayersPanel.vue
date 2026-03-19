<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { SvgElement } from '../types'

defineProps<{
  elements: SvgElement[]
  selectedIds: Set<string>
}>()

const emit = defineEmits<{
  select: [id: string]
  toggleVisibility: [id: string]
  toggleLock: [id: string]
}>()

const typeIcons: Record<string, string> = {
  rect: 'lucide:square',
  circle: 'lucide:circle',
  ellipse: 'lucide:circle',
  line: 'lucide:minus',
  path: 'lucide:pen-tool',
  polygon: 'lucide:hexagon',
  text: 'lucide:type',
  group: 'lucide:group',
}
</script>

<template>
  <div class="flex flex-col overflow-hidden">
    <div class="p-3 border-b border-border-default flex items-center gap-2 shrink-0">
      <span class="text-accent-sky text-[10px] tracking-widest font-display">//</span>
      <span class="font-display text-sm font-semibold">Lớp</span>
      <span class="ml-auto text-[10px] text-text-dim font-mono">{{ elements.length }}</span>
    </div>
    <div class="relative flex-1 min-h-0">
      <div class="absolute inset-0 overflow-y-auto">
        <div
          v-for="el in [...elements].reverse()" :key="el.id"
          class="group w-full flex items-center gap-2 px-3 py-2 text-text-secondary transition-all duration-150 border-l-2 cursor-pointer hover:bg-bg-elevated hover:text-text-primary"
          :class="selectedIds.has(el.id)
            ? 'bg-accent-coral/10 text-accent-coral border-l-accent-coral'
            : el.visible ? 'border-l-transparent' : 'border-l-transparent opacity-40'"
          @click="emit('select', el.id)"
        >
          <Icon :icon="typeIcons[el.type] ?? 'lucide:shapes'" class="size-3.5 shrink-0" :class="el.type === 'ellipse' ? 'scale-x-[1.4] scale-y-[0.8]' : ''" />
          <span class="truncate font-mono text-[11px] flex-1">{{ el.name || el.type }}</span>
          <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="p-0.5 hover:text-accent-amber transition" :title="el.visible ? 'Ẩn' : 'Hiện'" @click.stop="emit('toggleVisibility', el.id)">
              <Icon :icon="el.visible ? 'lucide:eye' : 'lucide:eye-off'" class="size-3" />
            </button>
            <button class="p-0.5 hover:text-accent-coral transition" :title="el.locked ? 'Mở khoá' : 'Khoá'" @click.stop="emit('toggleLock', el.id)">
              <Icon :icon="el.locked ? 'lucide:lock' : 'lucide:unlock'" class="size-3" />
            </button>
          </div>
        </div>
        <div v-if="elements.length === 0" class="p-6 flex flex-col items-center gap-2 text-center">
          <Icon icon="lucide:layers" class="size-6 text-text-dim/40" />
          <p class="text-text-dim text-[11px]">Chưa có element nào</p>
        </div>
      </div>
    </div>
  </div>
</template>
