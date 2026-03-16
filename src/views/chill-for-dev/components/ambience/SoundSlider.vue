<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAudio } from '../../composables/useAudio'
import { useAmbienceStore } from '../../stores/ambienceStore'

const props = defineProps<{
  name: string
  sources: string[]
  storeKey: 'rain' | 'birds' | 'keyboard'
}>()

const store = useAmbienceStore()
const audio = useAudio(props.sources)

const volume = computed({
  get() {
    return store[props.storeKey]
  },
  set(v: number) {
    if (props.storeKey === 'rain') store.setRain(v)
    else if (props.storeKey === 'birds') store.setBirds(v)
    else store.setKeyboard(v)
    audio.setVolume(v)
    if (v > 0) audio.play()
    else audio.pause()
  },
})

onMounted(() => {
  const v = store[props.storeKey]
  audio.setVolume(v)
  if (v > 0) audio.play()
})
</script>

<template>
  <div
    class="flex items-center gap-3 border border-border-default bg-bg-deep p-3 transition hover:border-accent-amber/50"
  >
    <label class="min-w-18 font-display text-sm text-text-primary">{{ name }}</label>
    <input
      v-model.number="volume"
      type="range"
      min="0"
      max="1"
      step="0.01"
      class="flex-1 accent-accent-amber"
    />
    <span class="text-xs text-text-dim w-8">{{ Math.round(volume * 100) }}%</span>
  </div>
</template>
