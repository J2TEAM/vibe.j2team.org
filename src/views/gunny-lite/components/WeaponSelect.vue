<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { WEAPONS, ANIMAL_PRESETS } from '../composables/useGameState'
import type { WeaponId, MapId, CharacterPreset } from '../types'
import { MAPS } from '../composables/useGameState'
import type { AIHardness } from '../composables/useAI'

const emit = defineEmits<{
  start: [
    p1Name: string,
    p1Weapon: WeaponId,
    p1Preset: CharacterPreset,
    p2Name: string,
    p2Weapon: WeaponId,
    p2Preset: CharacterPreset,
    vsAI: boolean,
    mapId: MapId,
    aiHardness: AIHardness,
  ]
}>()

const p1Name = ref('Người chơi 1')
const p1Weapon = ref<WeaponId>('brick')
const p1Preset = ref<CharacterPreset>(ANIMAL_PRESETS[3]!) // Sói — balanced
const p2Name = ref('Người chơi 2')
const p2Weapon = ref<WeaponId>('grenade')
const p2Preset = ref<CharacterPreset>(ANIMAL_PRESETS[0]!) // Gấu — tank
const vsAI = ref(false)
const aiHardness = ref<AIHardness>('medium')
const selectedMap = ref<MapId>('valley')

const HARDNESS_OPTIONS: { id: AIHardness; label: string; desc: string }[] = [
  { id: 'medium', label: '🐔 Bình thường', desc: 'Gà cũng thắng được' },
  { id: 'hard', label: '😤 Khó', desc: 'Cần chút kỹ năng' },
  { id: 'asian', label: '😈 Asian', desc: 'Bách phát bách trúng' },
]

const weaponList = Object.values(WEAPONS)
const mapList = Object.values(MAPS)

function randomPreset(exclude: CharacterPreset): CharacterPreset {
  const pool = ANIMAL_PRESETS.filter((p) => p.emoji !== exclude.emoji)
  return pool[Math.floor(Math.random() * pool.length)] ?? ANIMAL_PRESETS[0]!
}

function onPlayer2() {
  vsAI.value = false
  p2Name.value = 'Người chơi 2'
  p2Preset.value = randomPreset(p1Preset.value)
}

function onAiPlayer() {
  vsAI.value = true
  p2Name.value = 'AI'
  p2Preset.value = randomPreset(p1Preset.value)
}

function start() {
  emit(
    'start',
    p1Name.value,
    p1Weapon.value,
    p1Preset.value,
    p2Name.value,
    p2Weapon.value,
    p2Preset.value,
    vsAI.value,
    selectedMap.value,
    aiHardness.value,
  )
}
</script>

<template>
  <div class="max-w-lg w-full flex flex-col gap-6">
    <!-- Mode toggle -->
    <div class="flex gap-2">
      <button
        class="flex-1 border py-2 font-display text-sm tracking-wide transition-all duration-200"
        :class="
          !vsAI
            ? 'border-accent-coral bg-bg-elevated text-text-primary'
            : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
        "
        @click="onPlayer2"
      >
        👥 2 Người chơi
      </button>
      <button
        class="flex-1 border py-2 font-display text-sm tracking-wide transition-all duration-200"
        :class="
          vsAI
            ? 'border-accent-coral bg-bg-elevated text-text-primary'
            : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
        "
        @click="onAiPlayer"
      >
        🤖 Chơi với AI
      </button>
    </div>

    <!-- Players -->
    <div class="grid grid-cols-2 gap-4">
      <!-- P1 -->
      <div class="flex flex-col gap-3 border border-accent-coral p-4 bg-bg-surface">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-accent-coral inline-block" />
          <span class="font-display text-sm tracking-wide text-text-primary">NGƯỜI CHƠI 1</span>
        </div>
        <input
          v-model="p1Name"
          maxlength="16"
          class="bg-bg-elevated border border-border-default text-text-primary px-3 py-1.5 text-sm w-full focus:outline-none focus:border-accent-coral"
          placeholder="Tên nhân vật"
        />

        <!-- Character picker P1 -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span class="font-display text-xs text-text-dim tracking-widest">// NHÂN VẬT</span>
            <button
              class="text-xs text-text-dim hover:text-accent-coral transition-colors"
              @click="p1Preset = randomPreset(p1Preset)"
            >
              <Icon icon="lucide:shuffle" class="inline size-3 mr-0.5" />
              Ngẫu nhiên
            </button>
          </div>
          <div class="grid grid-cols-5 gap-1">
            <button
              v-for="preset in ANIMAL_PRESETS"
              :key="preset.emoji"
              :title="`${preset.name} — ${preset.description}`"
              class="aspect-square flex items-center justify-center text-xl border transition-all duration-150"
              :class="
                p1Preset.emoji === preset.emoji
                  ? 'border-accent-coral bg-bg-elevated scale-110'
                  : 'border-border-default hover:border-accent-coral hover:bg-bg-elevated'
              "
              @click="p1Preset = preset"
            >
              {{ preset.emoji }}
            </button>
          </div>
          <!-- Selected character info -->
          <div
            class="border border-border-default bg-bg-elevated px-2 py-1.5 flex items-center gap-2"
          >
            <span class="text-lg">{{ p1Preset.emoji }}</span>
            <div class="flex flex-col min-w-0">
              <span class="font-display text-xs text-text-primary">{{ p1Preset.name }}</span>
              <span class="text-xs text-text-dim truncate">{{ p1Preset.description }}</span>
            </div>
          </div>
          <!-- Stat bars -->
          <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-text-dim mt-1">
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">ATK</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div class="h-1 bg-accent-coral" :style="{ width: `${p1Preset.stats.atk / 3}%` }" />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">DEF</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div class="h-1 bg-accent-sky" :style="{ width: `${p1Preset.stats.def / 2}%` }" />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">AGI</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div
                  class="h-1 bg-accent-amber"
                  :style="{ width: `${p1Preset.stats.agi / 2.5}%` }"
                />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">LCK</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div class="h-1 bg-accent-amber" :style="{ width: `${p1Preset.stats.lck / 2}%` }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Weapon picker P1 -->
        <div class="flex flex-col gap-1">
          <span class="font-display text-xs text-text-dim tracking-widest">// VŨ KHÍ</span>
          <div class="grid grid-cols-1 gap-1">
            <button
              v-for="w in weaponList"
              :key="w.id"
              class="border px-2 py-1.5 text-left flex items-center gap-2 transition-all duration-150"
              :class="
                p1Weapon === w.id
                  ? 'border-accent-amber bg-bg-elevated text-text-primary'
                  : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary'
              "
              @click="p1Weapon = w.id"
            >
              <span class="text-base">{{ w.emoji }}</span>
              <div class="flex flex-col">
                <span class="font-display text-xs">{{ w.name }}</span>
                <span class="text-xs text-text-dim">{{ w.minAngle }}°–{{ w.maxAngle }}°</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- P2 -->
      <div class="flex flex-col gap-3 border border-accent-sky p-4 bg-bg-surface">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-accent-sky inline-block" />
          <span class="font-display text-sm tracking-wide text-text-primary">
            {{ vsAI ? 'AI' : 'NGƯỜI CHƠI 2' }}
          </span>
        </div>
        <input
          v-if="!vsAI"
          v-model="p2Name"
          maxlength="16"
          class="bg-bg-elevated border border-border-default text-text-primary px-3 py-1.5 text-sm w-full focus:outline-none focus:border-accent-sky"
          placeholder="Tên nhân vật"
        />
        <!-- AI hardness picker -->
        <div v-else class="flex flex-col gap-1">
          <span class="font-display text-xs text-text-dim tracking-widest">// ĐỘ KHÓ</span>
          <div class="flex flex-col gap-1">
            <button
              v-for="opt in HARDNESS_OPTIONS"
              :key="opt.id"
              class="border px-2 py-1.5 text-left flex items-center gap-2 transition-all duration-150"
              :class="
                aiHardness === opt.id
                  ? 'border-accent-sky bg-bg-elevated text-text-primary'
                  : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary'
              "
              @click="aiHardness = opt.id"
            >
              <div class="flex flex-col">
                <span class="font-display text-xs">{{ opt.label }}</span>
                <span class="text-xs text-text-dim">{{ opt.desc }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Character picker P2 -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span class="font-display text-xs text-text-dim tracking-widest">// NHÂN VẬT</span>
            <button
              class="text-xs text-text-dim hover:text-accent-sky transition-colors"
              :disabled="vsAI"
              @click="p2Preset = randomPreset(p2Preset)"
            >
              <Icon icon="lucide:shuffle" class="inline size-3 mr-0.5" />
              Ngẫu nhiên
            </button>
          </div>
          <div class="grid grid-cols-5 gap-1" :class="{ 'opacity-40 pointer-events-none': vsAI }">
            <button
              v-for="preset in ANIMAL_PRESETS"
              :key="preset.emoji"
              :title="`${preset.name} — ${preset.description}`"
              class="aspect-square flex items-center justify-center text-xl border transition-all duration-150"
              :class="
                p2Preset.emoji === preset.emoji
                  ? 'border-accent-sky bg-bg-elevated scale-110'
                  : 'border-border-default hover:border-accent-sky hover:bg-bg-elevated'
              "
              @click="p2Preset = preset"
            >
              {{ preset.emoji }}
            </button>
          </div>
          <!-- Selected character info -->
          <div
            class="border border-border-default bg-bg-elevated px-2 py-1.5 flex items-center gap-2"
            :class="{ 'opacity-40': vsAI }"
          >
            <span class="text-lg">{{ p2Preset.emoji }}</span>
            <div class="flex flex-col min-w-0">
              <span class="font-display text-xs text-text-primary">{{ p2Preset.name }}</span>
              <span class="text-xs text-text-dim truncate">{{ p2Preset.description }}</span>
            </div>
          </div>
          <!-- Stat bars -->
          <div
            class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-text-dim mt-1"
            :class="{ 'opacity-40': vsAI }"
          >
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">ATK</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div class="h-1 bg-accent-coral" :style="{ width: `${p2Preset.stats.atk / 3}%` }" />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">DEF</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div class="h-1 bg-accent-sky" :style="{ width: `${p2Preset.stats.def / 2}%` }" />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">AGI</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div
                  class="h-1 bg-accent-amber"
                  :style="{ width: `${p2Preset.stats.agi / 2.5}%` }"
                />
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-10 shrink-0">LCK</span>
              <div class="flex-1 h-1 bg-bg-deep">
                <div class="h-1 bg-accent-amber" :style="{ width: `${p2Preset.stats.lck / 2}%` }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Weapon picker P2 -->
        <div class="flex flex-col gap-1">
          <span class="font-display text-xs text-text-dim tracking-widest">// VŨ KHÍ</span>
          <div class="grid grid-cols-1 gap-1">
            <button
              v-for="w in weaponList"
              :key="w.id"
              class="border px-2 py-1.5 text-left flex items-center gap-2 transition-all duration-150"
              :class="
                p2Weapon === w.id
                  ? 'border-accent-sky bg-bg-elevated text-text-primary'
                  : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary'
              "
              @click="p2Weapon = w.id"
            >
              <span class="text-base">{{ w.emoji }}</span>
              <div class="flex flex-col">
                <span class="font-display text-xs">{{ w.name }}</span>
                <span class="text-xs text-text-dim">{{ w.minAngle }}°–{{ w.maxAngle }}°</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Map selection -->
    <div class="flex flex-col gap-2">
      <span class="font-display text-xs text-text-dim tracking-widest">// BẢN ĐỒ</span>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="m in mapList"
          :key="m.id"
          class="border py-2 font-display text-xs tracking-wide transition-all duration-200"
          :class="
            selectedMap === m.id
              ? 'border-accent-amber bg-bg-elevated text-text-primary'
              : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary'
          "
          @click="selectedMap = m.id"
        >
          {{ m.name }}
        </button>
      </div>
    </div>

    <!-- Start -->
    <button
      class="w-full border-2 border-accent-coral bg-accent-coral/10 py-3 font-display text-lg tracking-widest text-accent-coral transition-all duration-200 hover:bg-accent-coral hover:text-bg-deep"
      @click="start"
    >
      BẮT ĐẦU CHIẾN ĐẤU
    </button>
  </div>
</template>
