<script setup lang="ts">
import type { GameMode, GridSize, MainMode } from '../types'

defineProps<{
  open: boolean
  surfaceClass: string
  panelInnerClass: string
  textMutedClass: string
  storyTotalLevels: number
  sizeOptions: readonly GridSize[]
  pendingSize: GridSize
  pendingDifficulty: number
  pendingMainMode: MainMode
  pendingCustomMode: Exclude<GameMode, 'story' | 'gravity'>
  gravityUnlocked: boolean
}>()

const emit = defineEmits<{
  close: []
  apply: []
  'update:pendingSize': [value: GridSize]
  'update:pendingDifficulty': [value: number]
  'update:pendingMainMode': [value: MainMode]
  'update:pendingCustomMode': [value: Exclude<GameMode, 'story' | 'gravity'>]
}>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
    <div class="w-full max-w-md border p-5" :class="surfaceClass">
      <h2 class="font-display text-xl font-semibold text-accent-coral">Bắt đầu ván mới</h2>

      <div class="mt-4 grid gap-3">
        <div>
          <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">MODE</p>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingMainMode === 'story' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="emit('update:pendingMainMode', 'story')">Story</button>
            <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingMainMode === 'custom' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="emit('update:pendingMainMode', 'custom')">Custom</button>
            <button
              type="button"
              class="border px-2 py-1.5 text-xs transition"
              :class="[
                panelInnerClass,
                pendingMainMode === 'gravity' ? 'border-accent-coral text-accent-coral' : '',
                gravityUnlocked ? 'hover:border-accent-amber' : 'cursor-not-allowed opacity-45',
              ]"
              @click="gravityUnlocked && emit('update:pendingMainMode', 'gravity')"
            >
              Gravity
            </button>
          </div>
          <p v-if="!gravityUnlocked" class="mt-1 text-xs text-accent-amber">Gravity mode đang bị khóa, bạn phải tìm Easter Egg ở đâu đó.</p>
        </div>

        <div v-if="pendingMainMode === 'custom'">
          <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">CUSTOM TYPE</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingCustomMode === 'classic' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="emit('update:pendingCustomMode', 'classic')">Classic</button>
            <button type="button" class="border px-2 py-1.5 text-xs transition" :class="[panelInnerClass, pendingCustomMode === 'timed' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']" @click="emit('update:pendingCustomMode', 'timed')">Timed</button>
          </div>
        </div>

        <div>
          <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">GRID SIZE</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="size in sizeOptions"
              :key="size"
              type="button"
              class="border px-2 py-1.5 text-xs transition"
              :class="[panelInnerClass, pendingSize === size ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber', pendingMainMode !== 'custom' ? 'pointer-events-none opacity-50' : '']"
              @click="emit('update:pendingSize', size)"
            >
              {{ size }}
            </button>
          </div>
          <p v-if="pendingMainMode !== 'custom'" class="mt-1 text-xs" :class="textMutedClass">Story/Gravity mode dùng bàn cờ cố định 10x20.</p>
        </div>

        <div>
          <p class="mb-1 text-xs font-display tracking-widest" :class="textMutedClass">DIFFICULTY</p>
          <input :value="pendingDifficulty" type="range" min="0" max="20" step="1" class="w-full accent-accent-coral" :disabled="pendingMainMode !== 'custom'" @input="emit('update:pendingDifficulty', Number(($event.target as HTMLInputElement).value))" />
          <p class="text-xs" :class="textMutedClass">
            {{ pendingMainMode === 'custom' ? `Level ${pendingDifficulty}` : `Tự tăng theo ${storyTotalLevels} level` }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('apply')">Bắt đầu</button>
          <button type="button" class="border px-3 py-2 text-sm transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('close')">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>
