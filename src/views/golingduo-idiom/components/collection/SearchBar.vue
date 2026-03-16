<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="relative">
    <Icon
      icon="lucide:search"
      class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-dim"
    />
    <input
      :value="modelValue"
      type="text"
      placeholder="Tìm idiom... (ví dụ: rain, mưa, khóc)"
      class="w-full border border-border-default bg-bg-surface py-3 pl-10 pr-4 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary"
      @click="$emit('update:modelValue', '')"
    >
      <Icon icon="lucide:x" class="size-4" />
    </button>
  </div>
</template>
