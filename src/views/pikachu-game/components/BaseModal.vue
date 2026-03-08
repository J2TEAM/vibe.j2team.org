<script setup lang="ts">
interface Props {
  open: boolean
  title: string
  maxWidthClass?: string
}

withDefaults(defineProps<Props>(), {
  maxWidthClass: 'max-w-lg',
})

defineEmits<{ close: [] }>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 p-4" @click.self="$emit('close')">
    <div class="w-full border border-border-default bg-bg-surface p-4 sm:p-5" :class="maxWidthClass">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
          <span class="text-xs tracking-widest text-accent-coral">//</span>
          {{ title }}
        </h2>
        <button type="button" class="border border-border-default px-2 py-1 text-xs transition hover:border-accent-amber" @click="$emit('close')">
          Ðóng
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>

