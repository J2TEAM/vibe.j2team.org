<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

defineProps<{
  bpm: number
  isPlaying: boolean
  metronomeEnabled: boolean
  stepCount: 16 | 32 | 64
  masterVolume: number
}>()

const emit = defineEmits<{
  (e: 'togglePlay'): void
  (e: 'update:bpm', value: number): void
  (e: 'update:masterVolume', value: number): void
  (e: 'update:metronomeEnabled', value: boolean): void
  (e: 'update:stepCount', value: 16 | 32 | 64): void
}>()

const editingBpm = ref(false)
const bpmInput = ref('')

const startEditBpm = (bpm: number) => {
  editingBpm.value = true
  bpmInput.value = String(bpm)
}

const commitBpm = () => {
  const v = Math.max(40, Math.min(250, Number(bpmInput.value) || 120))
  emit('update:bpm', v)
  editingBpm.value = false
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-bg-surface border-b border-border-default"
  >
    <!-- Play/Stop — bigger on mobile for touch -->
    <button
      @click="$emit('togglePlay')"
      class="flex h-10 w-10 items-center justify-center transition-all flex-shrink-0"
      :class="
        isPlaying
          ? 'bg-accent-coral text-white'
          : 'bg-bg-elevated text-text-primary hover:bg-accent-coral hover:text-white'
      "
    >
      <Icon :icon="isPlaying ? 'lucide:square' : 'lucide:play'" class="size-5" />
    </button>

    <!-- BPM display -->
    <div
      class="flex items-center gap-1 bg-bg-elevated px-2 sm:px-3 py-1.5 cursor-pointer"
      @click="startEditBpm(bpm)"
    >
      <Icon icon="lucide:clock" class="size-3 text-accent-amber mr-1" />
      <span
        class="text-[10px] font-display uppercase tracking-widest text-text-secondary mr-1 sm:mr-2"
        >BPM</span
      >
      <input
        v-if="editingBpm"
        v-model="bpmInput"
        type="number"
        class="w-12 bg-transparent font-display text-sm font-bold text-accent-amber outline-none border-b border-accent-amber"
        @blur="commitBpm"
        @keydown.enter="commitBpm"
        @click.stop
        autofocus
      />
      <span v-else class="font-display text-sm font-bold text-accent-amber">{{ bpm }}</span>
    </div>

    <!-- BPM Slider — wider on mobile for easier touch -->
    <input
      type="range"
      :value="bpm"
      @input="$emit('update:bpm', Number(($event.target as HTMLInputElement).value))"
      min="40"
      max="250"
      step="1"
      class="w-20 sm:w-24 h-3 sm:h-1 cursor-pointer appearance-none bg-bg-elevated accent-accent-amber"
    />

    <div class="h-6 w-px bg-border-default mx-0.5 sm:mx-1 hidden sm:block"></div>

    <!-- Step Count -->
    <div class="flex items-center gap-0.5 sm:gap-1">
      <span
        class="text-[9px] font-display uppercase tracking-widest text-text-secondary mr-0.5 sm:mr-1 hidden xs:inline"
        >Steps</span
      >
      <button
        v-for="s in [16, 32, 64] as (16 | 32 | 64)[]"
        :key="s"
        @click="$emit('update:stepCount', s)"
        class="px-1.5 sm:px-2 py-1 text-[10px] font-display transition-colors"
        :class="
          stepCount === s
            ? 'bg-accent-coral text-white'
            : 'text-text-secondary hover:text-text-primary bg-bg-elevated'
        "
      >
        {{ s }}
      </button>
    </div>

    <div class="h-6 w-px bg-border-default mx-0.5 sm:mx-1 hidden sm:block"></div>

    <!-- Metronome -->
    <button
      @click="$emit('update:metronomeEnabled', !metronomeEnabled)"
      class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] font-display uppercase tracking-wider transition-colors"
      :class="
        metronomeEnabled
          ? 'bg-accent-sky text-white'
          : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
      "
    >
      <Icon icon="mdi:metronome" class="size-4" />
      <span class="hidden sm:inline">Metro</span>
    </button>

    <!-- Master Volume — pushed to right, hidden label on mobile -->
    <div class="ml-auto flex items-center gap-1 sm:gap-2">
      <Icon icon="lucide:volume-2" class="size-4 text-text-secondary" />
      <input
        type="range"
        :value="masterVolume * 100"
        @input="
          $emit('update:masterVolume', Number(($event.target as HTMLInputElement).value) / 100)
        "
        min="0"
        max="100"
        step="1"
        class="w-16 sm:w-20 h-3 sm:h-1 cursor-pointer appearance-none bg-bg-elevated accent-accent-sky"
      />
      <span class="text-[10px] font-display text-text-secondary w-7 sm:w-8 hidden sm:inline"
        >{{ Math.round(masterVolume * 100) }}%</span
      >
    </div>
  </div>
</template>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: currentColor;
  cursor: pointer;
  border-radius: 50%;
}
@media (min-width: 640px) {
  input[type='range']::-webkit-slider-thumb {
    width: 10px;
    height: 10px;
  }
}
</style>
