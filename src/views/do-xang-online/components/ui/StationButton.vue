<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    ariaBusy?: boolean
  }>(),
  {
    variant: 'primary',
    disabled: false,
    type: 'button',
    ariaBusy: false,
  },
)

const base =
  'min-h-11 min-w-0 font-display font-bold px-4 sm:px-5 py-2.5 transition-colors active:scale-[0.98] cursor-pointer touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-coral disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-inherit disabled:active:scale-100'

const variantClass = {
  primary: 'bg-accent-coral text-bg-deep hover:bg-accent-amber disabled:hover:bg-accent-coral',
  secondary: 'bg-accent-amber text-bg-deep hover:bg-accent-coral disabled:hover:bg-accent-amber',
  ghost:
    'border border-border-default bg-bg-surface text-text-primary hover:border-accent-coral hover:bg-bg-elevated disabled:hover:border-border-default disabled:hover:bg-bg-surface',
}
</script>

<template>
  <button
    :type="props.type"
    class="flex-1 sm:flex-initial sm:min-w-[7.5rem]"
    :class="[base, variantClass[props.variant]]"
    :disabled="props.disabled"
    :aria-busy="props.ariaBusy || undefined"
  >
    <slot />
  </button>
</template>
