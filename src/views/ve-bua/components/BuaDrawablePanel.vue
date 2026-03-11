<script setup lang="ts">
const props = defineProps<{
  open: boolean
  showDrawableEditor: boolean
}>()

const emit = defineEmits<{
  'toggle-drawable-editor': []
  'reset-drawable-box': []
}>()
</script>

<template>
  <div
    v-if="props.open"
    class="pointer-events-auto w-[320px] border border-border-default bg-bg-surface p-3"
  >
    <button
      class="w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
      @click="emit('toggle-drawable-editor')"
    >
      {{ props.showDrawableEditor ? 'Ẩn chỉnh vùng vẽ' : 'Hiện chỉnh vùng vẽ' }}
    </button>
    <button
      class="mt-2 w-full border border-border-default px-3 py-2 text-left text-sm text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
      @click="emit('reset-drawable-box')"
    >
      Trả vùng vẽ mặc định
    </button>
  </div>
</template>
