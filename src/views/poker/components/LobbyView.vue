<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import type { LobbyConfig, FriendsConfig } from '../types'

type Step = 'mode' | 'bot-setup' | 'friends-setup'

const emit = defineEmits<{
  startSolo: [config: LobbyConfig]
  startFriends: [config: FriendsConfig]
  openRules: []
}>()

const step = ref<Step>('mode')

function goTo(s: Step) {
  step.value = s
}
function goBack() {
  step.value = 'mode'
}

// ── SHARED CONFIG ─────────────────────────────────────────────────────────────

interface ChipPreset {
  chips: number
  blinds: number[]
  label: string
}
const CHIP_PRESETS: ChipPreset[] = [
  { chips: 500, blinds: [5], label: '500' },
  { chips: 1000, blinds: [5, 10], label: '1,000' },
  { chips: 2000, blinds: [10, 25], label: '2,000' },
  { chips: 5000, blinds: [25, 50], label: '5,000' },
]

// ── BOT CONFIG ────────────────────────────────────────────────────────────────

const botPlayerName = ref('Player')
const botCount = ref(3)
const botChips = ref(1000)
const botBlind = ref(10)
const botBlindIncrease = ref(0)

const botAvailableBlinds = computed(() => {
  const preset = CHIP_PRESETS.find((p) => p.chips === botChips.value)
  return preset?.blinds ?? [10]
})

watch(botChips, () => {
  if (!botAvailableBlinds.value.includes(botBlind.value) && botAvailableBlinds.value[0]) {
    botBlind.value = botAvailableBlinds.value[0]
  }
})

function startSolo() {
  if (!botPlayerName.value.trim()) botPlayerName.value = 'Player'
  emit('startSolo', {
    playerName: botPlayerName.value.trim(),
    botCount: Number(botCount.value),
    startingChips: Number(botChips.value),
    smallBlind: Number(botBlind.value),
    blindIncreaseHands: Number(botBlindIncrease.value),
  })
}

// ── FRIENDS CONFIG ────────────────────────────────────────────────────────────

const friendNames = ref<string[]>(['', ''])
const friendNewName = ref('')
const friendChips = ref(1000)
const friendBlind = ref(10)
const friendBlindIncrease = ref(0)

const friendAvailableBlinds = computed(() => {
  const preset = CHIP_PRESETS.find((p) => p.chips === friendChips.value)
  return preset?.blinds ?? [10]
})

watch(friendChips, () => {
  if (!friendAvailableBlinds.value.includes(friendBlind.value) && friendAvailableBlinds.value[0]) {
    friendBlind.value = friendAvailableBlinds.value[0]
  }
})

function addFriend() {
  const name = friendNewName.value.trim()
  if (!name || friendNames.value.length >= 8) return
  friendNames.value.push(name)
  friendNewName.value = ''
}

function removeFriend(idx: number) {
  if (friendNames.value.length <= 2) return
  friendNames.value.splice(idx, 1)
}

function updateFriendName(idx: number, val: string) {
  friendNames.value[idx] = val
}

const validFriendNames = computed(() => friendNames.value.filter((n) => n.trim()))
const canStartFriends = computed(() => validFriendNames.value.length >= 2)

function startFriends() {
  if (!canStartFriends.value) return
  emit('startFriends', {
    playerNames: validFriendNames.value.map((n) => n.trim()),
    startingChips: Number(friendChips.value),
    smallBlind: Number(friendBlind.value),
    blindIncreaseHands: Number(friendBlindIncrease.value),
  })
}

// Mini table preview angle positions
const previewAngles = [270, 330, 30, 90, 150, 210, 240, 300]
function previewSeat(idx: number, total: number): { left: string; top: string } {
  const angles = previewAngles.slice(0, total)
  const angle = (angles[idx] ?? 0) * (Math.PI / 180)
  return {
    left: `${50 + 36 * Math.cos(angle)}%`,
    top: `${50 + 36 * Math.sin(angle)}%`,
  }
}
</script>

<template>
  <div class="h-full bg-bg-deep text-text-primary font-body flex flex-col overflow-y-auto">
    <!-- Top bar -->
    <div
      class="flex items-center justify-between px-4 py-2.5 border-b border-border-default bg-bg-surface flex-shrink-0"
    >
      <button
        v-if="step !== 'mode'"
        class="flex items-center gap-1.5 text-text-dim hover:text-text-primary transition-colors text-sm"
        @click="goBack"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Quay lại
      </button>
      <RouterLink
        v-else
        to="/"
        class="flex items-center gap-1.5 text-text-dim hover:text-text-primary transition-colors text-sm"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Trang chủ
      </RouterLink>

      <span class="font-display font-bold text-base text-text-primary">♠ Texas Hold'em</span>

      <a
        href="https://github.com/Xernnn"
        target="_blank"
        rel="noopener noreferrer"
        class="text-text-dim/50 text-xs font-body hover:text-accent-coral transition-colors"
        >by Xern</a
      >
    </div>

    <!-- ═══════════════════════════════════════════
         MODE SELECT
    ═══════════════════════════════════════════ -->
    <template v-if="step === 'mode'">
      <div class="flex flex-col items-center pt-5 pb-3 flex-shrink-0">
        <h1 class="font-display text-xl font-bold text-text-primary">Poker Texas Hold'em</h1>
        <p class="text-text-dim text-xs font-body mt-1">
          Tác giả:
          <a
            href="https://github.com/Xernnn"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-coral/70 font-display hover:text-accent-coral hover:underline transition-colors"
            >Son Nguyen (Xern)</a
          >
        </p>
      </div>

      <div class="flex-1 flex flex-col items-center justify-start px-4 gap-3">
        <!-- 2 big play boxes -->
        <div class="grid grid-cols-2 gap-3 w-full max-w-lg">
          <button
            class="group flex flex-col items-center gap-3 p-6 sm:p-8 border-2 border-border-default bg-bg-surface hover:border-accent-coral hover:bg-bg-elevated transition-all active:scale-[0.98]"
            @click="goTo('bot-setup')"
          >
            <Icon
              icon="lucide:bot"
              class="size-12 text-text-dim group-hover:text-accent-coral transition-colors"
            />
            <div class="text-center">
              <div
                class="font-display font-bold text-lg text-text-primary group-hover:text-accent-coral transition-colors"
              >
                Vs Bot
              </div>
              <div class="text-text-dim text-xs mt-1">Chơi với AI</div>
            </div>
          </button>

          <button
            class="group flex flex-col items-center gap-3 p-6 sm:p-8 border-2 border-border-default bg-bg-surface hover:border-accent-amber hover:bg-bg-elevated transition-all active:scale-[0.98]"
            @click="goTo('friends-setup')"
          >
            <Icon
              icon="lucide:users"
              class="size-12 text-text-dim group-hover:text-accent-amber transition-colors"
            />
            <div class="text-center">
              <div
                class="font-display font-bold text-lg text-text-primary group-hover:text-accent-amber transition-colors"
              >
                Với Bạn Bè
              </div>
              <div class="text-text-dim text-xs mt-1">Quản lý chip & blind</div>
            </div>
          </button>
        </div>

        <!-- Long help button -->
        <button
          class="w-full max-w-lg p-3 border-2 border-border-default bg-bg-surface hover:border-accent-sky hover:bg-bg-elevated transition-all active:scale-[0.99] flex items-center justify-center gap-2 group"
          @click="emit('openRules')"
        >
          <Icon
            icon="lucide:book-open"
            class="size-5 text-text-dim group-hover:text-accent-sky transition-colors"
          />
          <span
            class="font-display font-semibold text-sm text-text-primary group-hover:text-accent-sky transition-colors"
            >Luật chơi & Hướng dẫn</span
          >
        </button>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════
         BOT SETUP
    ═══════════════════════════════════════════ -->
    <template v-else-if="step === 'bot-setup'">
      <div class="flex-1 flex items-center justify-center px-4 py-4">
        <div class="w-full max-w-sm space-y-3.5 animate-fade-up">
          <div class="text-center mb-1">
            <Icon icon="lucide:bot" class="size-8 text-accent-coral mx-auto mb-1" />
            <h2 class="font-display text-lg font-bold text-text-primary">Vs Bot AI</h2>
          </div>

          <!-- Name -->
          <div class="space-y-1">
            <label class="text-text-dim text-xs font-display tracking-widest">// TÊN</label>
            <input
              v-model="botPlayerName"
              type="text"
              placeholder="Player"
              maxlength="20"
              class="w-full bg-bg-surface border border-border-default px-3 py-2 text-text-primary font-body text-sm focus:border-accent-coral outline-none transition-colors placeholder:text-text-dim"
            />
          </div>

          <!-- Bot count -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-text-dim text-xs font-display tracking-widest">// SỐ BOT</label>
              <span class="text-accent-coral font-display font-bold text-sm">{{ botCount }}</span>
            </div>
            <input
              v-model.number="botCount"
              type="range"
              min="1"
              max="5"
              class="w-full accent-[#FF6B4A] cursor-pointer h-1.5"
            />
          </div>

          <!-- Chips -->
          <div class="space-y-1">
            <label class="text-text-dim text-xs font-display tracking-widest">// CHIPS</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="p in CHIP_PRESETS"
                :key="p.chips"
                :class="[
                  'py-1.5 text-xs font-display border transition-colors',
                  botChips === p.chips
                    ? 'border-accent-coral bg-accent-coral/15 text-accent-coral font-bold'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral/50',
                ]"
                @click="botChips = p.chips"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Blind -->
          <div class="space-y-1">
            <label class="text-text-dim text-xs font-display tracking-widest">// BLIND</label>
            <div class="flex gap-1.5">
              <button
                v-for="b in botAvailableBlinds"
                :key="b"
                :class="[
                  'flex-1 py-1.5 text-xs font-display border transition-colors',
                  botBlind === b
                    ? 'border-accent-amber bg-accent-amber/15 text-accent-amber font-bold'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber/50',
                ]"
                @click="botBlind = b"
              >
                {{ b }}/{{ b * 2 }}
              </button>
            </div>
          </div>

          <!-- Blind increase -->
          <div class="space-y-1">
            <label class="text-text-dim text-xs font-display tracking-widest">// TĂNG BLIND</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="opt in [
                  { v: 0, label: 'Không' },
                  { v: 5, label: '5 ván' },
                  { v: 10, label: '10 ván' },
                  { v: 15, label: '15 ván' },
                ]"
                :key="opt.v"
                :class="[
                  'py-1.5 text-xs font-display border transition-colors',
                  botBlindIncrease === opt.v
                    ? 'border-accent-sky bg-accent-sky/15 text-accent-sky font-bold'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-sky/50',
                ]"
                @click="botBlindIncrease = opt.v"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Summary -->
          <div
            class="bg-bg-surface border border-border-default px-3 py-1.5 text-text-dim text-xs font-body"
          >
            Bàn {{ botCount + 1 }} người · {{ botChips.toLocaleString() }} chips · Blind
            {{ botBlind }}/{{ botBlind * 2 }}
            <span v-if="botBlindIncrease > 0"> · Tăng mỗi {{ botBlindIncrease }} ván</span>
          </div>

          <button
            class="w-full py-3 border border-accent-coral bg-accent-coral/20 text-accent-coral font-display font-bold text-sm hover:bg-accent-coral/30 transition-colors active:scale-95 flex items-center justify-center gap-2"
            @click="startSolo"
          >
            <Icon icon="lucide:play" class="size-4" />
            Bắt đầu
          </button>
        </div>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════
         FRIENDS SETUP
    ═══════════════════════════════════════════ -->
    <template v-else-if="step === 'friends-setup'">
      <div class="flex-1 flex flex-col lg:flex-row gap-4 px-4 py-4 overflow-y-auto min-h-0">
        <!-- Left: player list + config -->
        <div class="flex-1 space-y-3 max-w-sm mx-auto lg:mx-0 animate-fade-up">
          <div class="text-center lg:text-left mb-1">
            <Icon icon="lucide:users" class="size-8 text-accent-amber mx-auto lg:mx-0 mb-1" />
            <h2 class="font-display text-lg font-bold text-text-primary">Với Bạn Bè</h2>
            <p class="text-text-dim text-xs">Quản lý chip cho bàn poker thật</p>
          </div>

          <!-- Player list -->
          <div class="space-y-1">
            <label class="text-text-dim text-xs font-display tracking-widest"
              >// NGƯỜI CHƠI ({{ friendNames.length }}/8)</label
            >
            <div class="space-y-1">
              <div v-for="(name, idx) in friendNames" :key="idx" class="flex items-center gap-1.5">
                <input
                  :value="name"
                  type="text"
                  :placeholder="`Người chơi ${idx + 1}`"
                  maxlength="20"
                  class="flex-1 bg-bg-surface border border-border-default px-2.5 py-1.5 text-text-primary font-body text-sm focus:border-accent-amber outline-none transition-colors placeholder:text-text-dim"
                  @input="updateFriendName(idx, ($event.target as HTMLInputElement).value)"
                />
                <button
                  v-if="friendNames.length > 2"
                  class="size-7 flex items-center justify-center border border-border-default text-text-dim text-xs hover:border-red-400 hover:text-red-400 transition-colors"
                  @click="removeFriend(idx)"
                >
                  <Icon icon="lucide:x" class="size-3.5" />
                </button>
              </div>
            </div>

            <!-- Add player -->
            <div v-if="friendNames.length < 8" class="flex gap-1.5">
              <input
                v-model="friendNewName"
                type="text"
                placeholder="Thêm người chơi..."
                maxlength="20"
                class="flex-1 bg-bg-surface border border-border-default px-2.5 py-1.5 text-text-primary font-body text-sm focus:border-accent-amber outline-none transition-colors placeholder:text-text-dim"
                @keydown.enter="addFriend"
              />
              <button
                class="px-3 py-1.5 border border-accent-amber/50 text-accent-amber font-display text-xs hover:bg-accent-amber/10 transition-colors"
                @click="addFriend"
              >
                + Thêm
              </button>
            </div>
          </div>

          <!-- Config -->
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-text-dim text-xs font-display tracking-widest">// CHIPS</label>
              <div class="space-y-1">
                <button
                  v-for="p in CHIP_PRESETS"
                  :key="p.chips"
                  :class="[
                    'w-full py-1 text-xs font-display border transition-colors',
                    friendChips === p.chips
                      ? 'border-accent-coral bg-accent-coral/15 text-accent-coral font-bold'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral/50',
                  ]"
                  @click="friendChips = p.chips"
                >
                  {{ p.label }}
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-text-dim text-xs font-display tracking-widest">// BLIND</label>
              <div class="space-y-1">
                <button
                  v-for="b in friendAvailableBlinds"
                  :key="b"
                  :class="[
                    'w-full py-1 text-xs font-display border transition-colors',
                    friendBlind === b
                      ? 'border-accent-amber bg-accent-amber/15 text-accent-amber font-bold'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber/50',
                  ]"
                  @click="friendBlind = b"
                >
                  {{ b }}/{{ b * 2 }}
                </button>
              </div>
              <label class="text-text-dim text-xs font-display tracking-widest mt-2 block"
                >// TĂNG BLIND</label
              >
              <div class="space-y-1">
                <button
                  v-for="opt in [
                    { v: 0, label: 'Không' },
                    { v: 5, label: '5 ván' },
                    { v: 10, label: '10 ván' },
                  ]"
                  :key="opt.v"
                  :class="[
                    'w-full py-1 text-xs font-display border transition-colors',
                    friendBlindIncrease === opt.v
                      ? 'border-accent-sky bg-accent-sky/15 text-accent-sky font-bold'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-sky/50',
                  ]"
                  @click="friendBlindIncrease = opt.v"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>

          <button
            :disabled="!canStartFriends"
            class="w-full py-2.5 border border-accent-amber bg-accent-amber/20 text-accent-amber font-display font-bold text-sm hover:bg-accent-amber/30 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="startFriends"
          >
            <Icon icon="lucide:play" class="size-4" />
            Bắt đầu
          </button>
        </div>

        <!-- Right: mini table preview -->
        <div class="hidden lg:flex flex-1 items-center justify-center">
          <div class="relative w-64 h-48">
            <div
              class="absolute inset-0 border border-border-default/50 bg-bg-surface/30"
              style="border-radius: 45%"
            />
            <div
              v-for="(name, idx) in validFriendNames"
              :key="idx"
              class="absolute flex items-center justify-center"
              :style="{
                ...previewSeat(idx, validFriendNames.length),
                transform: 'translate(-50%, -50%)',
              }"
            >
              <div
                class="px-2 py-1 border border-border-default bg-bg-surface text-text-primary text-xs font-body truncate max-w-20"
              >
                {{ name || `P${idx + 1}` }}
              </div>
            </div>
            <div
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text-dim/30 text-xs font-display"
            >
              {{ validFriendNames.length }} người
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
