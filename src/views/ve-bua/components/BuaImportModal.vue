<script setup lang="ts">
const props = defineProps<{
  open: boolean
  code: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  'update:code': [value: string]
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
          Import mã bùa
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
        class="w-full border border-border-default bg-bg-elevated px-3 py-2 font-mono text-xs"
        placeholder="Dán mã dạng BUA-S1.xxxxx hoặc BUA-D1.xxxxx"
        @input="emit('update:code', ($event.target as HTMLTextAreaElement).value)"
      />
      <button
        class="mt-3 w-full border border-accent-amber bg-accent-amber/15 px-3 py-2 text-left text-sm text-accent-amber transition hover:bg-accent-amber/25"
        @click="emit('confirm')"
      >
        Nạp mã
      </button>
    </div>
  </section>
</template>
