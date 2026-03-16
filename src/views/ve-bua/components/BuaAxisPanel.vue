<script setup lang="ts">
const props = defineProps<{
  open: boolean
  axisCount: number
  showGuides: boolean
  showAxisEditor: boolean
}>()

const emit = defineEmits<{
  'update:axisCount': [value: number]
  'update:showGuides': [value: boolean]
  'toggle-axis-editor': []
  'random-axes': []
  'reset-axes-even': []
}>()
</script>

<template>
  <div
    v-if="props.open"
    class="pointer-events-auto w-[340px] border border-border-default bg-bg-surface p-3"
  >
    <button
      class="w-full border-2 px-3 py-2 text-left text-sm font-semibold tracking-wide transition"
      :class="
        props.showAxisEditor
          ? 'border-accent-coral bg-accent-coral/25 text-accent-coral hover:bg-accent-coral/35'
          : 'border-accent-amber bg-accent-amber/25 text-accent-amber hover:bg-accent-amber/35'
      "
      @click="emit('toggle-axis-editor')"
    >
      {{ props.showAxisEditor ? 'Ẩn trục' : 'Hiện trục' }}
    </button>

    <label class="block">
      <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim"
        >Số trục đối xứng: {{ props.axisCount }}</span
      >
      <input
        :value="props.axisCount"
        type="range"
        min="1"
        max="12"
        class="w-full accent-[#FF6B4A]"
        @input="emit('update:axisCount', Number(($event.target as HTMLInputElement).value))"
      />
    </label>

    <button
      class="mt-2 w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
      @click="emit('random-axes')"
    >
      Ngẫu nhiên góc trục
    </button>

    <button
      class="mt-2 w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-amber hover:bg-bg-elevated hover:text-text-primary"
      @click="emit('reset-axes-even')"
    >
      Chia đều trục
    </button>

    <label
      class="mt-2 flex items-center justify-between gap-2 border border-border-default px-3 py-2 text-sm"
    >
      <span>Hiện hướng dẫn trục</span>
      <input
        :checked="props.showGuides"
        type="checkbox"
        class="h-4 w-4 accent-[#FFB830]"
        @change="emit('update:showGuides', ($event.target as HTMLInputElement).checked)"
      />
    </label>
  </div>
</template>
