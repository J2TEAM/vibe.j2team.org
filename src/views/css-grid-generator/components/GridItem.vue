<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = defineProps<{
  itemId: number
  color: string
  isDragging: boolean
  isBeingDragged: boolean
}>()

const emit = defineEmits<{
  remove: [id: number]
  startMove: [id: number, event: PointerEvent]
  startResize: [id: number, event: PointerEvent]
}>()

function onMoveStart(event: PointerEvent) {
  emit('startMove', props.itemId, event)
}

function onResizeStart(event: PointerEvent) {
  emit('startResize', props.itemId, event)
}

function onRemove() {
  emit('remove', props.itemId)
}
</script>

<template>
  <div
    class="relative select-none overflow-hidden transition-shadow duration-200 group"
    :class="[
      isBeingDragged ? 'opacity-50 scale-95' : 'hover:shadow-lg',
      'cursor-grab active:cursor-grabbing',
    ]"
    :style="{
      backgroundColor: color + '20',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: color,
    }"
    @pointerdown="onMoveStart"
  >
    <!-- Item number -->
    <div class="absolute inset-0 flex items-center justify-center">
      <span
        class="font-display text-2xl font-bold select-none pointer-events-none"
        :style="{ color }"
      >
        {{ itemId }}
      </span>
    </div>

    <!-- Background large number -->
    <span
      class="absolute -bottom-2 -right-1 font-display text-6xl font-black select-none pointer-events-none opacity-[0.06]"
      :style="{ color }"
    >
      {{ itemId }}
    </span>

    <!-- Delete button -->
    <button
      class="absolute top-1 right-1 size-5 flex items-center justify-center bg-bg-deep/70 border border-border-default text-text-dim hover:text-accent-coral hover:border-accent-coral transition-all duration-150 opacity-0 group-hover:opacity-100 z-10"
      @pointerdown.stop
      @click.stop="onRemove"
    >
      <Icon icon="lucide:x" class="size-3" />
    </button>

    <!-- Resize handle -->
    <div
      class="absolute bottom-0 right-0 size-4 cursor-se-resize z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      @pointerdown.stop="onResizeStart"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" class="absolute bottom-0 right-0">
        <path
          d="M14 16L16 14M10 16L16 10M6 16L16 6"
          :stroke="color"
          stroke-width="1.5"
          stroke-linecap="round"
          opacity="0.6"
        />
      </svg>
    </div>
  </div>
</template>
