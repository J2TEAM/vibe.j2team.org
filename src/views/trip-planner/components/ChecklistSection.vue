<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import type { ChecklistItem } from '../types'

const props = defineProps<{
  checklist: ChecklistItem[]
}>()

const emit = defineEmits<{
  add: [text: string]
  toggle: [id: string]
  remove: [id: string]
}>()

const newItem = ref('')

const progress = computed(() => {
  if (props.checklist.length === 0) return 0
  return Math.round(
    (props.checklist.filter((c) => c.checked).length / props.checklist.length) * 100,
  )
})

function handleAdd() {
  if (!newItem.value.trim()) return
  emit('add', newItem.value)
  newItem.value = ''
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-2">
      <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
      <h3 class="font-display text-lg font-semibold text-text-primary">Checklist</h3>
      <span v-if="checklist.length > 0" class="text-xs text-text-dim">
        {{ checklist.filter((c) => c.checked).length }}/{{ checklist.length }}
      </span>
    </div>

    <!-- Progress bar -->
    <div v-if="checklist.length > 0" class="mb-4">
      <div class="flex items-center justify-between text-xs text-text-dim">
        <span>Tiến độ</span>
        <span
          class="font-display font-semibold"
          :class="progress === 100 ? 'text-accent-sky' : 'text-accent-amber'"
        >
          {{ progress }}%
        </span>
      </div>
      <div class="mt-1 h-1.5 w-full bg-border-default">
        <div
          class="h-full transition-all duration-500"
          :class="progress === 100 ? 'bg-accent-sky' : 'bg-accent-coral'"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Add item -->
    <div class="mb-4 flex gap-2">
      <input
        v-model="newItem"
        type="text"
        placeholder="Thêm vật cần mang, việc cần làm..."
        class="flex-1 border border-border-default bg-bg-deep px-4 py-2.5 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
        @keydown.enter="handleAdd"
      />
      <button
        class="inline-flex items-center gap-1.5 border border-accent-coral bg-accent-coral/10 px-4 py-2.5 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
        @click="handleAdd"
      >
        <Icon icon="lucide:plus" class="size-3.5" />
      </button>
    </div>

    <div v-if="checklist.length === 0" class="py-4 text-center text-sm text-text-dim">
      Thêm những thứ cần chuẩn bị
    </div>

    <div v-else class="space-y-1">
      <div
        v-for="item in checklist"
        :key="item.id"
        :class="[
          'group flex items-center gap-3 border border-border-default bg-bg-surface px-4 py-2.5 transition hover:bg-bg-elevated',
          item.checked ? 'opacity-60' : '',
        ]"
      >
        <button
          :class="[
            'flex size-5 shrink-0 items-center justify-center border transition',
            item.checked
              ? 'border-accent-sky bg-accent-sky/20 text-accent-sky'
              : 'border-border-default hover:border-accent-coral',
          ]"
          @click="emit('toggle', item.id)"
        >
          <Icon v-if="item.checked" icon="lucide:check" class="size-3" />
        </button>
        <span
          :class="[
            'flex-1 text-sm',
            item.checked ? 'line-through text-text-dim' : 'text-text-primary',
          ]"
        >
          {{ item.text }}
        </span>
        <button
          class="p-1 text-text-dim opacity-0 transition hover:text-accent-coral group-hover:opacity-100"
          @click="emit('remove', item.id)"
        >
          <Icon icon="lucide:x" class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
