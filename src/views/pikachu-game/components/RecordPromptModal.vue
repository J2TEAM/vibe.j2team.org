<script setup lang="ts">
defineProps<{
  open: boolean
  surfaceClass: string
  panelInnerClass: string
  textMutedClass: string
  appliedMode: 'classic' | 'timed' | 'story' | 'gravity'
  storyTotalLevels: number
  timeLabel: string
  playerName: string
}>()

const emit = defineEmits<{
  close: []
  save: []
  'update:playerName': [value: string]
}>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
    <div class="w-full max-w-sm border p-5" :class="surfaceClass">
      <h2 class="font-display text-xl font-semibold text-accent-coral">Lưu điểm cao</h2>
      <p class="mt-2 text-sm" :class="textMutedClass">
        {{ appliedMode === 'story' || appliedMode === 'gravity' ? `Bạn vừa hoàn thành ${appliedMode === 'gravity' ? 'Gravity' : 'Story'} ${storyTotalLevels} level trong ${timeLabel}. Nhập tên để lưu kỷ lục chính.` : 'Nhập tên để lưu bảng xếp hạng theo độ khó/mode hiện tại.' }}
      </p>
      <input :value="playerName" type="text" maxlength="20" placeholder="Tên của bạn" class="mt-4 w-full border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent-coral" :class="panelInnerClass" @input="emit('update:playerName', ($event.target as HTMLInputElement).value)" />
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('save')">Lưu</button>
        <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('close')">Bỏ qua</button>
      </div>
    </div>
  </div>
</template>
