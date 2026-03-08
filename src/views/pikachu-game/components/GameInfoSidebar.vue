<script setup lang="ts">
defineProps<{
  surfaceClass: string
  panelInnerClass: string
  textMutedClass: string
  score: number
  timeLabel: string
  appliedMode: 'classic' | 'timed' | 'story' | 'gravity'
  storyLevel: number
  storyTotalLevels: number
  appliedDifficulty: number
  isStoryMode: boolean
  assistsLeft: number
  message: string
}>()

const emit = defineEmits<{
  'use-hint': []
  'use-reload': []
}>()
</script>

<template>
  <aside class="animate-fade-up animate-delay-3 border p-3" :class="surfaceClass">
    <h2 class="mb-2.5 flex items-center gap-2 font-display text-base font-semibold">
      <span class="text-accent-amber text-xs tracking-widest">//</span>
      Thông tin màn chơi
    </h2>

    <div class="grid grid-cols-2 gap-1.5">
      <div class="border p-2.5" :class="panelInnerClass">
        <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">SCORE</p>
        <p class="font-display text-xl font-semibold text-accent-coral">{{ score }}</p>
      </div>
      <div class="border p-2.5" :class="panelInnerClass">
        <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">TIME</p>
        <p class="font-display text-xl font-semibold text-accent-sky">{{ appliedMode === 'timed' ? timeLabel : '∞' }}</p>
      </div>
      <div class="border p-2.5" :class="panelInnerClass">
        <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">MODE</p>
        <p class="font-display text-sm font-semibold text-accent-amber">
          {{
            appliedMode === 'story'
              ? 'STORY'
              : appliedMode === 'gravity'
                ? 'GRAVITY'
                : `CUSTOM / ${appliedMode === 'timed' ? 'TIMED' : 'CLASSIC'}`
          }}
        </p>
      </div>
      <div class="border p-2.5" :class="panelInnerClass">
        <p class="font-display text-[10px] tracking-widest" :class="textMutedClass">{{ isStoryMode ? 'STORY LEVEL' : 'DIFFICULTY' }}</p>
        <p class="font-display text-sm font-semibold text-accent-coral">
          {{ isStoryMode ? `${storyLevel}/${storyTotalLevels}` : `LEVEL ${appliedDifficulty}` }}
        </p>
      </div>
    </div>

    <h3 class="mt-5 flex items-center gap-2 font-display text-sm font-semibold">
      <span class="text-accent-sky text-[10px] tracking-widest">//</span>
      Trợ giúp (Power-up)
    </h3>

    <p class="mt-1 text-xs" :class="textMutedClass">Lượt còn lại: <span class="text-accent-amber">{{ assistsLeft }}</span></p>
    <div class="mt-2 grid grid-cols-2 gap-2">
      <button type="button" class="border px-2 py-2 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('use-hint')">Gợi ý</button>
      <button type="button" class="border px-2 py-2 text-xs transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('use-reload')">Tải lại</button>
    </div>

    <p class="mt-3 text-xs" :class="textMutedClass">{{ message }}</p>
  </aside>
</template>
