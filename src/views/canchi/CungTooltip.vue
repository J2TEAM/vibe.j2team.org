<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  label: string
}>()

const show = ref(false)
const position = ref<'top' | 'bottom'>('top')
const triggerEl = ref<HTMLDivElement>()

function handleMouseEnter() {
  if (triggerEl.value) {
    const rect = triggerEl.value.getBoundingClientRect()
    position.value = rect.top < 160 ? 'bottom' : 'top'
  }
  show.value = true
}
</script>

<template>
  <div
    ref="triggerEl"
    class="relative inline-block cursor-help"
    @mouseenter="handleMouseEnter"
    @mouseleave="show = false"
  >
    <slot />
    <div
      v-if="show"
      class="cung-tooltip"
      :class="position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
    >
      <div
        class="absolute left-4 w-2 h-2 bg-bg-elevated border-border-default transform rotate-45"
        :class="
          position === 'top' ? 'bottom-[-5px] border-b border-r' : 'top-[-5px] border-t border-l'
        "
      />
      <div class="font-bold text-xs text-text-primary mb-1">{{ label }}</div>
      <div class="text-[11px] text-text-secondary leading-relaxed">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>
