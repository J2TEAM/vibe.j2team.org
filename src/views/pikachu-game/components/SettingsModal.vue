<script setup lang="ts">
const props = defineProps<{
  open: boolean
  surfaceClass: string
  panelInnerClass: string
  textMutedClass: string
  isLightMode: boolean
  isBgmOn: boolean
  isSoundOn: boolean
  bgmVolume: number
  sfxVolume: number
}>()

const emit = defineEmits<{
  close: []
  'toggle-light': []
  'toggle-bgm': []
  'toggle-sound': []
  'update:bgmVolume': [value: number]
  'update:sfxVolume': [value: number]
}>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
    <div class="w-full max-w-sm border p-5" :class="surfaceClass">
      <h2 class="font-display text-xl font-semibold text-accent-amber">Setting</h2>
      <button type="button" class="mt-4 w-full border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('toggle-light')">
        {{ props.isLightMode ? 'Bật dark mode' : 'Bật light mode' }}
      </button>
      <button type="button" class="mt-2 w-full border px-3 py-2 text-sm transition hover:border-accent-sky" :class="panelInnerClass" @click="emit('toggle-bgm')">
        {{ props.isBgmOn ? 'Tắt nhạc nền' : 'Bật nhạc nền' }}
      </button>
      <div class="mt-2 border p-3" :class="panelInnerClass">
        <p class="text-xs font-display tracking-widest" :class="textMutedClass">ÂM LƯỢNG NHẠC NỀN: {{ props.bgmVolume }}%</p>
        <input :value="props.bgmVolume" type="range" min="0" max="100" step="1" class="mt-2 w-full accent-accent-coral" @input="emit('update:bgmVolume', Number(($event.target as HTMLInputElement).value))" />
      </div>
      <button type="button" class="mt-2 w-full border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('toggle-sound')">
        {{ props.isSoundOn ? 'Tắt sound effect' : 'Bật sound effect' }}
      </button>
      <div class="mt-2 border p-3" :class="panelInnerClass">
        <p class="text-xs font-display tracking-widest" :class="textMutedClass">ÂM LƯỢNG HIỆU ỨNG: {{ props.sfxVolume }}%</p>
        <input :value="props.sfxVolume" type="range" min="0" max="100" step="1" class="mt-2 w-full accent-accent-coral" @input="emit('update:sfxVolume', Number(($event.target as HTMLInputElement).value))" />
      </div>
      <button type="button" class="mt-2 w-full border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('close')">
        Đóng
      </button>
    </div>
  </div>
</template>
