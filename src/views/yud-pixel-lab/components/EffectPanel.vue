<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { EFFECTS } from '../utils/effects-config'
import type { EffectId, EffectParams } from '../types'

const props = defineProps<{
  selectedEffect: EffectId
  effectParams: Record<EffectId, EffectParams>
  disabled: boolean
}>()

const emit = defineEmits<{
  'update:selectedEffect': [value: EffectId]
  'update:param': [effectId: EffectId, key: string, value: number]
}>()

function currentParams() {
  return EFFECTS.find((e) => e.id === props.selectedEffect)?.params ?? []
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3
        class="font-display text-sm tracking-widest text-text-secondary mb-3 flex items-center gap-2"
      >
        <span class="text-accent-coral">//</span>
        HIỆU ỨNG
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="effect in EFFECTS"
          :key="effect.id"
          :disabled="disabled"
          class="flex items-center gap-2 border px-3 py-2.5 text-left text-sm transition-all duration-200"
          :class="
            selectedEffect === effect.id
              ? 'border-accent-coral bg-bg-elevated text-text-primary'
              : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-coral/50 hover:text-text-primary'
          "
          @click="emit('update:selectedEffect', effect.id)"
        >
          <Icon :icon="effect.icon" class="size-4 shrink-0" />
          <div>
            <div class="font-display text-xs font-semibold">{{ effect.name }}</div>
            <div class="text-[10px] text-text-dim mt-0.5 hidden sm:block">
              {{ effect.description }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <div>
      <h3
        class="font-display text-sm tracking-widest text-text-secondary mb-3 flex items-center gap-2"
      >
        <span class="text-accent-amber">//</span>
        THÔNG SỐ
      </h3>
      <div class="space-y-4">
        <div v-for="param in currentParams()" :key="param.key">
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs text-text-secondary font-display tracking-wide">
              {{ param.label }}
            </label>
            <span class="text-xs text-accent-amber font-display tabular-nums">
              {{ effectParams[selectedEffect]?.[param.key] ?? param.defaultValue }}
            </span>
          </div>
          <input
            type="range"
            :min="param.min"
            :max="param.max"
            :step="param.step"
            :value="effectParams[selectedEffect]?.[param.key] ?? param.defaultValue"
            :disabled="disabled"
            class="w-full h-1.5 appearance-none bg-bg-elevated rounded-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-accent-coral
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
                   [&::-moz-range-thumb]:bg-accent-coral [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-pointer"
            @input="
              emit(
                'update:param',
                selectedEffect,
                param.key,
                Number(($event.target as HTMLInputElement).value),
              )
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
