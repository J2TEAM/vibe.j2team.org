<script setup lang="ts">
import { computed, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Icon } from '@iconify/vue'

interface SelectOption {
  value: string
  label: string
  description: string
}

const props = defineProps<{
  modelValue: string
  options: readonly SelectOption[]
  leftIcon: string
  leftIconClass: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootEl = ref<HTMLElement | null>(null)
const opened = ref(false)

onClickOutside(rootEl, () => {
  opened.value = false
})

const selectedOption = computed(() => {
  return props.options.find((option) => option.value === props.modelValue) ?? props.options[0]
})

function toggleDropdown(): void {
  opened.value = !opened.value
}

function chooseOption(value: string): void {
  emit('update:modelValue', value)
  opened.value = false
}
</script>

<template>
  <div ref="rootEl" class="relative mt-1">
    <button
      type="button"
      class="group flex w-full items-center gap-3 border border-border-default bg-bg-deep px-3 py-2 text-left transition-all duration-300 hover:border-accent-coral"
      :class="opened ? 'border-accent-coral' : ''"
      @click="toggleDropdown"
    >
      <Icon :icon="leftIcon" class="size-4" :class="leftIconClass" />
      <div class="min-w-0 flex-1">
        <p class="text-sm text-text-primary">{{ selectedOption?.label }}</p>
        <p class="truncate text-xs text-text-dim">{{ selectedOption?.description }}</p>
      </div>
      <Icon
        icon="lucide:chevrons-up-down"
        class="size-4 text-text-dim transition-colors group-hover:text-accent-coral"
        :class="opened ? 'text-accent-coral' : ''"
      />
    </button>

    <div
      v-if="opened"
      class="absolute left-0 right-0 top-[calc(100%+6px)] z-30 border border-border-default bg-bg-surface p-1.5 shadow-lg shadow-bg-deep/40"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="flex w-full items-center justify-between gap-3 border border-transparent px-3 py-2 text-left transition-all duration-200 hover:border-accent-coral hover:bg-bg-elevated"
        :class="option.value === modelValue ? 'border-border-default bg-bg-deep' : ''"
        @click="chooseOption(option.value)"
      >
        <div>
          <p class="text-sm" :class="option.value === modelValue ? 'text-text-primary' : 'text-text-secondary'">
            {{ option.label }}
          </p>
          <p class="text-xs text-text-dim">{{ option.description }}</p>
        </div>
        <Icon
          v-if="option.value === modelValue"
          icon="lucide:check"
          class="size-4 shrink-0 text-accent-coral"
        />
      </button>
    </div>
  </div>
</template>
