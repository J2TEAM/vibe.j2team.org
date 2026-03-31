<script setup lang="ts">
import { ref } from 'vue'
import { glossary } from '../data/glossary'

const props = defineProps<{
  term: string
}>()

const show = ref(false)
const entry = glossary[props.term]

function handleMouseEnter() {
  show.value = true
}

function handleMouseLeave() {
  show.value = false
}

function handleClick() {
  show.value = !show.value
}
</script>

<template>
  <span
    v-if="entry"
    class="relative inline cursor-help border-b border-dotted border-text-dim"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <slot />
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 border border-border-default bg-bg-elevated p-3 text-xs shadow-lg shadow-black/30"
      >
        <div class="font-display text-sm font-semibold text-accent-sky">
          {{ entry.termVi }}
        </div>
        <div class="mt-1 text-text-secondary leading-relaxed">
          {{ entry.definitionVi }}
        </div>
        <div
          class="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-border-default bg-bg-elevated"
        />
      </div>
    </Transition>
  </span>
  <slot v-else />
</template>
