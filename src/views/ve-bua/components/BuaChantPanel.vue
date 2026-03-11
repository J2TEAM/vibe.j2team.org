<script setup lang="ts">
const props = defineProps<{
  open: boolean
  chantEnabled: boolean
  chantText: string
  chantSamples: string[]
  placeholder: string
}>()

const emit = defineEmits<{
  'update:chantEnabled': [value: boolean]
  'update:chantText': [value: string]
  'use-sample': [value: string]
}>()
</script>

<template>
  <div
    v-if="props.open"
    class="pointer-events-auto w-[340px] border border-border-default bg-bg-surface p-3"
  >
    <label
      class="mb-2 flex items-center justify-between gap-2 border border-border-default px-3 py-2 text-sm"
    >
      <span>Bật khấn khi đốt bùa</span>
      <input
        :checked="props.chantEnabled"
        type="checkbox"
        class="h-4 w-4 accent-[#FFB830]"
        @change="emit('update:chantEnabled', ($event.target as HTMLInputElement).checked)"
      />
    </label>
    <textarea
      :value="props.chantText"
      rows="4"
      class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm"
      :placeholder="props.placeholder"
      @input="emit('update:chantText', ($event.target as HTMLTextAreaElement).value)"
    />
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="sample in props.chantSamples"
        :key="sample"
        class="border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
        @click="emit('use-sample', sample)"
      >
        {{ sample }}
      </button>
    </div>
  </div>
</template>
