<script setup lang="ts">
import type { LeaderboardCategory, LeaderboardStep, RecordItem } from '../types'

defineProps<{
  open: boolean
  surfaceClass: string
  panelInnerClass: string
  textMutedClass: string
  leaderboardCategory: LeaderboardCategory
  leaderboardStep: LeaderboardStep
  leaderboardDifficulty: number
  difficultyOptions: number[]
  storyBoard: RecordItem[]
  gravityBoard: RecordItem[]
  classicBoard: RecordItem[]
  timedBoard: RecordItem[]
}>()

const emit = defineEmits<{
  close: []
  'update:leaderboardCategory': [value: LeaderboardCategory]
  'update:leaderboardStep': [value: LeaderboardStep]
  'update:leaderboardDifficulty': [value: number]
}>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4">
    <div class="w-full max-w-3xl border p-5" :class="surfaceClass">
      <h2 class="font-display text-xl font-semibold text-accent-coral">Kỷ lục</h2>
      <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          class="border px-2 py-2 text-xs transition"
          :class="[panelInnerClass, leaderboardCategory === 'story' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
          @click="emit('update:leaderboardCategory', 'story')"
        >
          Story
        </button>
        <button
          type="button"
          class="border px-2 py-2 text-xs transition"
          :class="[panelInnerClass, leaderboardCategory === 'gravity' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
          @click="emit('update:leaderboardCategory', 'gravity')"
        >
          Gravity
        </button>
        <button
          type="button"
          class="col-span-2 border px-2 py-2 text-xs transition sm:col-span-2"
          :class="[panelInnerClass, leaderboardCategory === 'custom' ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
          @click="emit('update:leaderboardCategory', 'custom'); emit('update:leaderboardStep', 'pick')"
        >
          Custom mode
        </button>
      </div>

      <div v-if="leaderboardCategory === 'story'" class="mt-4 border p-3" :class="panelInnerClass">
        <h3 class="font-display text-sm font-semibold text-accent-coral">Story Mode</h3>
        <ol v-if="storyBoard.length > 0" class="mt-2 grid gap-1 text-xs">
          <li v-for="(item, idx) in storyBoard" :key="`${item.name}-${item.createdAt}-s`" class="flex justify-between gap-2">
            <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
            <span class="text-accent-amber">{{ Math.floor(item.timeSpent / 60).toString().padStart(2, '0') }}:{{ (item.timeSpent % 60).toString().padStart(2, '0') }}</span>
          </li>
        </ol>
        <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa có dữ liệu Story mode.</p>
      </div>

      <div v-if="leaderboardCategory === 'gravity'" class="mt-4 border p-3" :class="panelInnerClass">
        <h3 class="font-display text-sm font-semibold text-accent-sky">Gravity Mode</h3>
        <ol v-if="gravityBoard.length > 0" class="mt-2 grid gap-1 text-xs">
          <li v-for="(item, idx) in gravityBoard" :key="`${item.name}-${item.createdAt}-g`" class="flex justify-between gap-2">
            <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
            <span class="text-accent-amber">{{ Math.floor(item.timeSpent / 60).toString().padStart(2, '0') }}:{{ (item.timeSpent % 60).toString().padStart(2, '0') }}</span>
          </li>
        </ol>
        <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa có dữ liệu Gravity mode.</p>
      </div>

      <div v-if="leaderboardCategory === 'custom' && leaderboardStep === 'pick'" class="mt-4">
        <p class="mb-2 text-sm" :class="textMutedClass">Chọn độ khó để xem bảng điểm Classic/Timed.</p>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button
            v-for="level in difficultyOptions"
            :key="level"
            type="button"
            class="border px-2 py-1.5 text-xs transition"
            :class="[panelInnerClass, leaderboardDifficulty === level ? 'border-accent-coral text-accent-coral' : 'hover:border-accent-amber']"
            @click="emit('update:leaderboardDifficulty', level); emit('update:leaderboardStep', 'view')"
          >
            Level {{ level }}
          </button>
        </div>
      </div>

      <div v-if="leaderboardCategory === 'custom' && leaderboardStep === 'view'" class="mt-4">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm" :class="textMutedClass">Độ khó: Level {{ leaderboardDifficulty }}</p>
          <button type="button" class="border px-2 py-1 text-xs transition hover:border-accent-amber" :class="panelInnerClass" @click="emit('update:leaderboardStep', 'pick')">Chọn lại độ khó</button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="border p-3" :class="panelInnerClass">
            <h3 class="font-display text-sm font-semibold text-accent-amber">Không thời gian</h3>
            <ol v-if="classicBoard.length > 0" class="mt-2 grid gap-1 text-xs">
              <li v-for="(item, idx) in classicBoard" :key="`${item.name}-${item.createdAt}-c`" class="flex justify-between gap-2">
                <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
                <span class="text-accent-coral">{{ item.score }}</span>
              </li>
            </ol>
            <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa có dữ liệu.</p>
          </div>

          <div class="border p-3" :class="panelInnerClass">
            <h3 class="font-display text-sm font-semibold text-accent-sky">Có thời gian</h3>
            <ol v-if="timedBoard.length > 0" class="mt-2 grid gap-1 text-xs">
              <li v-for="(item, idx) in timedBoard" :key="`${item.name}-${item.createdAt}-t`" class="flex justify-between gap-2">
                <span class="truncate">{{ idx + 1 }}. {{ item.name }}</span>
                <span class="text-accent-coral">{{ item.score }}</span>
              </li>
            </ol>
            <p v-else class="mt-2 text-xs" :class="textMutedClass">Chưa có dữ liệu.</p>
          </div>
        </div>
      </div>

      <button type="button" class="mt-4 w-full border px-3 py-2 text-sm transition hover:border-accent-coral" :class="panelInnerClass" @click="emit('close')">
        Đóng
      </button>
    </div>
  </div>
</template>
