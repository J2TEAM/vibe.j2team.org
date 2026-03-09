<script setup lang="ts">
const props = defineProps<{
  open: boolean
  mode: 'style' | 'drawing'
  code: string
}>()

const emit = defineEmits<{
  close: []
  copy: []
}>()
</script>

<template>
  <section
    v-if="props.open"
    class="absolute inset-0 z-[60] grid place-items-center bg-bg-deep/85 p-4"
  >
    <div class="w-full max-w-2xl border border-border-default bg-bg-surface p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-display text-sm uppercase tracking-wider text-text-primary">
          {{ props.mode === 'style' ? 'Mã style đã tạo' : 'Mã nét vẽ đã tạo' }}
        </h3>
        <button
          class="border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="emit('close')"
        >
          Đóng
        </button>
      </div>
      <textarea
        :value="props.code"
        rows="8"
        readonly
        class="w-full border border-border-default bg-bg-elevated px-3 py-2 font-mono text-xs"
      />
      <button
        class="mt-3 w-full border border-accent-sky bg-accent-sky/15 px-3 py-2 text-left text-sm text-accent-sky transition hover:bg-accent-sky/25"
        @click="emit('copy')"
      >
        Copy mã
      </button>
    </div>
  </section>
</template>
