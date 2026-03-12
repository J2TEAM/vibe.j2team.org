<template>
  <transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[250] flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm border-2 border-accent-amber bg-bg-surface p-6 shadow-[0_0_30px_rgba(255,184,48,0.2)]"
      >
        <h2
          class="mb-6 font-display text-2xl font-bold uppercase tracking-widest text-text-primary text-center flex items-center justify-center gap-3"
        >
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Cài Đặt
        </h2>

        <!-- Phần Âm Thanh -->
        <p class="text-xs font-display tracking-widest text-text-dim mb-3 uppercase">
          <span class="text-accent-coral mr-1">//</span> Âm Thanh
        </p>

        <button
          type="button"
          class="mb-4 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm font-display tracking-widest transition hover:border-accent-sky hover:text-accent-sky"
          @click="$emit('update:isSoundOn', !isSoundOn)"
        >
          {{ isSoundOn ? 'Tắt hiệu ứng (SFX)' : 'Bật hiệu ứng (SFX)' }}
        </button>

        <div class="mb-6 border border-border-default bg-bg-deep p-4">
          <p class="text-xs font-display tracking-widest text-text-dim mb-2 uppercase">
            ÂM LƯỢNG HIỆU ỨNG: {{ sfxVolume }}%
          </p>
          <input
            :value="sfxVolume"
            @input="$emit('update:sfxVolume', Number(($event.target as HTMLInputElement).value))"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full accent-accent-coral cursor-pointer"
          />
        </div>

        <!-- Phần Độ Khó AI -->
        <p class="text-xs font-display tracking-widest text-text-dim mb-3 uppercase">
          <span class="text-accent-coral mr-1">//</span> Độ Khó AI
        </p>

        <div class="mb-6 flex gap-2">
          <button
            v-for="opt in difficultyOptions"
            :key="opt.value"
            type="button"
            class="flex-1 border px-3 py-3 text-center font-display text-sm tracking-wider transition-all duration-300 cursor-pointer"
            :class="
              aiDifficulty === opt.value
                ? 'border-accent-amber bg-accent-amber/15 text-accent-amber shadow-[0_0_15px_rgba(255,184,48,0.15)]'
                : 'border-border-default bg-bg-deep text-text-secondary hover:border-text-dim hover:text-text-primary'
            "
            @click="$emit('changeDifficulty', opt.value)"
          >
            <span class="block font-bold uppercase">{{ opt.label }}</span>
            <span class="block text-[10px] mt-1 text-text-dim tracking-normal">{{ opt.desc }}</span>
          </button>
        </div>

        <button
          type="button"
          class="w-full border-2 border-border-default bg-transparent px-4 py-3 text-lg font-display font-bold tracking-widest transition hover:bg-border-default hover:text-bg-deep cursor-pointer"
          @click="$emit('update:modelValue', false)"
        >
          ĐÓNG
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { AIDifficulty } from '../composables/useAI'

defineProps<{
  modelValue: boolean
  isSoundOn: boolean
  sfxVolume: number
  aiDifficulty: AIDifficulty
  difficultyOptions: readonly {
    readonly value: AIDifficulty
    readonly label: string
    readonly desc: string
  }[]
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:isSoundOn', value: boolean): void
  (e: 'update:sfxVolume', value: number): void
  (e: 'changeDifficulty', value: AIDifficulty): void
}>()
</script>
