<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  surfaceClass: string
  panelInnerClass: string
  isPaused: boolean
  bgmVolume: number
  sfxVolume: number
}>()

const emit = defineEmits<{
  'update:bgmVolume': [value: number]
  'update:sfxVolume': [value: number]
  'open-new-game': []
  'open-settings': []
  'toggle-pause': []
  'open-leaderboard': []
  'open-credits': []
}>()

const bgmModel = computed({
  get: () => props.bgmVolume,
  set: (value: number) => emit('update:bgmVolume', value),
})

const sfxModel = computed({
  get: () => props.sfxVolume,
  set: (value: number) => emit('update:sfxVolume', value),
})
</script>

<template>
  <aside class="animate-fade-up animate-delay-1 border p-3" :class="surfaceClass">
    <h2 class="mb-2.5 flex items-center gap-2 font-display text-base font-semibold">
      <span class="text-accent-coral text-xs tracking-widest">//</span>
      Menu
    </h2>

    <div class="grid gap-1.5">
      <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('open-new-game')">
        Bắt đầu ván mới
      </button>
      <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('open-settings')">
        Setting
      </button>
      <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-sky" :class="panelInnerClass" @click="emit('toggle-pause')">
        {{ isPaused ? 'Tiếp tục' : 'Tạm dừng' }}
      </button>
      <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('open-leaderboard')">
        Kỷ lục
      </button>
      <button type="button" class="border px-2.5 py-1.5 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('open-credits')">
        Credit
      </button>
    </div>

    <div class="mt-2.5 border p-2" :class="panelInnerClass">
      <p class="text-[10px] font-display tracking-widest">BGM {{ bgmModel }}%</p>
      <input v-model.number="bgmModel" type="range" min="0" max="100" step="1" class="mt-1 w-full accent-accent-coral" />
      <p class="mt-2 text-[10px] font-display tracking-widest">SFX {{ sfxModel }}%</p>
      <input v-model.number="sfxModel" type="range" min="0" max="100" step="1" class="mt-1 w-full accent-accent-coral" />
    </div>
  </aside>
</template>
