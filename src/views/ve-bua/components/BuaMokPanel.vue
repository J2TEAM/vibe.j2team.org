<script setup lang="ts">
const props = defineProps<{
  open: boolean
  mokEnabled: boolean
  mokSpeed: number
}>()

const emit = defineEmits<{
  'update:mokEnabled': [value: boolean]
  'update:mokSpeed': [value: number]
}>()
</script>

<template>
  <div
    v-if="props.open"
    class="pointer-events-auto w-[320px] border border-border-default bg-bg-surface p-3"
  >
    <label
      class="mb-2 flex items-center justify-between gap-2 border border-border-default px-3 py-2 text-sm"
    >
      <span>Bật gõ mõ khi đốt bùa</span>
      <input
        :checked="props.mokEnabled"
        type="checkbox"
        class="h-4 w-4 accent-[#FFB830]"
        @change="emit('update:mokEnabled', ($event.target as HTMLInputElement).checked)"
      />
    </label>
    <label class="block">
      <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
        >Tốc độ gõ mõ: {{ props.mokSpeed }} BPM</span
      >
      <input
        :value="props.mokSpeed"
        type="range"
        min="40"
        max="260"
        step="1"
        class="w-full accent-[#FFB830]"
        @input="emit('update:mokSpeed', Number(($event.target as HTMLInputElement).value))"
      />
    </label>
  </div>
</template>
