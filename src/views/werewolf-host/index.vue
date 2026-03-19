<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useGame } from './useGame'
import {
  NIGHT_CALL,
  NIGHT_ORDER,
  ROLE_DESC,
  ROLE_EMOJI,
  ROLE_NAMES,
  ROLE_POINTS,
  type NightStep,
  type RoleId,
  type RoleConfig,
} from './types'

const g = useGame()

// Show/hide time config
const showTimeConfig = ref(false)
// Show/hide guide modal
const showGuide = ref(false)
const showResetConfirm = ref(false)
const showSpeechSettings = ref(false)

const viVoices = computed(() => g.availableVoices.value.filter((v) => v.lang.startsWith('vi')))
const otherVoices = computed(() => g.availableVoices.value.filter((v) => !v.lang.startsWith('vi')))

function handleReset() {
  showResetConfirm.value = false
  g.resetGame()
}

// Night step labels
const STEP_LABELS: Record<NightStep, string> = {
  disruptor: 'Kẻ phá hoại',
  cupid: 'Thần tình yêu',
  wolves: 'Bầy Sói',
  traitor: 'Kẻ phản bội',
  seer: 'Tiên tri',
  guard: 'Bảo vệ',
  witch: 'Phù thủy',
  hunter: 'Thợ săn',
}

const STEP_ICON: Record<NightStep, string> = {
  disruptor: 'lucide:volume-x',
  cupid: 'lucide:heart',
  wolves: 'lucide:moon',
  traitor: 'lucide:user-x',
  seer: 'lucide:eye',
  guard: 'lucide:shield',
  witch: 'lucide:flask-conical',
  hunter: 'lucide:crosshair',
}

// Roles available to configure
const CONFIGURABLE_ROLES: { id: RoleId; faction: 'wolf' | 'villager' }[] = [
  { id: 'wolf', faction: 'wolf' },
  { id: 'wolf-cub', faction: 'wolf' },
  { id: 'cursed-wolf', faction: 'wolf' },
  { id: 'traitor', faction: 'wolf' },
  { id: 'villager', faction: 'villager' },
  { id: 'seer', faction: 'villager' },
  { id: 'guard', faction: 'villager' },
  { id: 'witch', faction: 'villager' },
  { id: 'hunter', faction: 'villager' },
  { id: 'disruptor', faction: 'villager' },
  { id: 'cupid', faction: 'villager' },
]

// ── Presets ─────────────────────────────────────────────────────────────────
interface Preset {
  label: string
  players: number
  config: Partial<RoleConfig>
}

const PRESETS: Preset[] = [
  {
    label: '4–5 người',
    players: 5,
    config: { wolf: 1, villager: 2, seer: 1, guard: 1 },
  },
  {
    label: '6–7 người',
    players: 6,
    config: { wolf: 1, villager: 3, seer: 1, guard: 1 },
  },
  {
    label: '8–10 người',
    players: 8,
    config: { wolf: 2, villager: 4, seer: 1, guard: 1 },
  },
  {
    label: '11–14 người',
    players: 12,
    config: { wolf: 3, villager: 5, seer: 1, guard: 1, witch: 1, hunter: 1 },
  },
  {
    label: '15–20 người',
    players: 16,
    config: { wolf: 4, villager: 8, seer: 1, guard: 1, witch: 1, hunter: 1, disruptor: 1 },
  },
]

function applyPreset(preset: Preset) {
  for (const key in g.roleConfig.value) {
    ;(g.roleConfig.value as Record<string, number>)[key] = 0
  }
  for (const [role, count] of Object.entries(preset.config)) {
    ;(g.roleConfig.value as Record<string, number>)[role] = count ?? 0
  }
}

// ── Balance score ────────────────────────────────────────────────────────────
const balanceScore = computed(() => {
  let score = 0
  for (const [role, count] of Object.entries(g.roleConfig.value)) {
    score += (ROLE_POINTS[role as RoleId] ?? 0) * count
  }
  return score
})

// ── Night step helpers ─────────────────────────────────────────────────────
const currentStepIndex = computed(() => NIGHT_ORDER.indexOf(g.nightStep.value))

// Which wolves haven't voted yet
const wolvesYetToVote = computed(() => {
  const voted = Object.keys(g.wolfVotes.value)
  return g.livingWolves.value.filter((w) => !voted.includes(w.id))
})

const currentWolfVoter = computed(() => {
  return wolvesYetToVote.value[0] ?? null
})

// Wolf tally
const wolfVoteTally = computed(() => {
  const tally: Record<string, number> = {}
  for (const targetId of Object.values(g.wolfVotes.value)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1
  }
  return tally
})

// How many targets wolves can pick (1 or 2 if wolf-cub died)
const wolfBiteCount = computed(() => (g.wolfCubDiedLastNight.value ? 2 : 1))

// All wolves have voted enough targets
const allWolvesVoted = computed(() => {
  const uniqueTargets = new Set(Object.values(g.wolfVotes.value))
  return g.livingWolves.value.length > 0 && uniqueTargets.size > 0
})

// Witch: can she still use her abilities
const witchCanSave = computed(() => !g.witchHealUsed.value && g.witchNightVictim.value !== null)
const witchCanKill = computed(() => !g.witchPoisonUsed.value)
const witchAlreadyActed = computed(() => g.witchSaved.value || g.witchKillTarget.value !== null)

function getPlayerName(id: string | null | undefined) {
  if (!id) return '—'
  return g.players.value.find((p) => p.id === id)?.name ?? '—'
}

function isGuardDisabled(playerId: string) {
  return playerId === g.lastGuardTarget.value
}

// History helpers
function getDeathReasonLabel(reason: string) {
  const map: Record<string, string> = {
    wolf: 'Sói cắn',
    'witch-poison': 'Bình độc',
    'hunter-shot': 'Thợ săn bắn',
    hanged: 'Bị treo cổ',
    'lover-death': 'Chết theo người yêu',
  }
  return map[reason] ?? reason
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Cupid click handler ───────────────────────────────────────────────────
function handleCupidClick(playerId: string) {
  if (g.cupidTarget1.value === playerId) {
    g.cupidTarget1.value = null
  } else if (g.cupidTarget2.value === playerId) {
    g.cupidTarget2.value = null
  } else if (!g.cupidTarget1.value) {
    g.setCupidTarget(1, playerId)
  } else if (!g.cupidTarget2.value) {
    g.setCupidTarget(2, playerId)
  }
}

// ── Wolf vote next handler ────────────────────────────────────────────────
function handleWolfVoteNext() {
  // currentWolfVoter auto-updates from wolvesYetToVote after vote is cast
  // This button just needs to exist for UX; the computed handles the transition
  g.wolfVotePlayerIndex.value++
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <!-- ══════════════════════════════════════════════ SETUP ══ -->
    <div v-if="g.phase.value === 'setup'" class="mx-auto max-w-lg px-4 py-8">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="size-3.5" />
          Trang chủ
        </RouterLink>
        <button
          class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-sky hover:text-accent-sky"
          @click="showGuide = true"
        >
          <Icon icon="lucide:book-open" class="size-3.5" />
          Hướng dẫn
        </button>
        <button
          class="flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
          @click="showSpeechSettings = true"
        >
          <Icon icon="lucide:settings-2" class="size-3.5" />
          Giọng đọc
        </button>
      </div>

      <h1 class="mb-1 font-display text-3xl font-bold">Quản trò Ma Sói</h1>
      <p class="mb-8 text-sm text-text-secondary">
        Quản trò tự động — thay thế hoàn toàn người dẫn chương trình.
      </p>

      <!-- Players section -->
      <div class="mb-6">
        <p class="mb-3 font-display text-xs tracking-widest text-text-dim uppercase">
          <span class="text-accent-coral">//</span> Người chơi
          <span class="ml-2 text-accent-amber">({{ g.players.value.length }})</span>
        </p>

        <div class="mb-3 flex gap-2">
          <input
            v-model="g.playerNameInput.value"
            type="text"
            placeholder="Nhập tên người chơi..."
            class="flex-1 border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
            :class="g.duplicateNameError.value ? 'border-accent-coral' : ''"
            @keyup.enter="g.addPlayer"
          />
          <button
            class="border border-accent-coral bg-accent-coral/10 px-4 py-2.5 text-sm text-accent-coral transition hover:bg-accent-coral/20"
            @click="g.addPlayer"
          >
            <Icon icon="lucide:plus" class="size-4" />
          </button>
        </div>
        <p v-if="g.duplicateNameError.value" class="mb-2 text-xs text-accent-coral">
          Tên này đã có trong danh sách!
        </p>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="p in g.players.value"
            :key="p.id"
            class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-sm"
          >
            {{ p.name }}
            <button class="text-text-dim hover:text-accent-coral" @click="g.removePlayer(p.id)">
              <Icon icon="lucide:x" class="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Roles section -->
      <div class="mb-6">
        <p class="mb-3 font-display text-xs tracking-widest text-text-dim uppercase">
          <span class="text-accent-amber">//</span> Vai trò
          <span
            class="ml-2"
            :class="
              g.totalRoles.value === g.players.value.length
                ? 'text-accent-sky'
                : 'text-accent-coral'
            "
          >
            {{ g.totalRoles.value }}/{{ g.players.value.length }}
          </span>
        </p>

        <!-- Presets -->
        <div class="mb-4">
          <p class="mb-2 text-xs text-text-dim">Gợi ý nhanh:</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in PRESETS"
              :key="preset.label"
              class="border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Wolf roles -->
        <p class="mb-2 font-display text-xs text-accent-coral">Phe Sói</p>
        <div class="mb-4 space-y-2">
          <div
            v-for="r in CONFIGURABLE_ROLES.filter((x) => x.faction === 'wolf')"
            :key="r.id"
            class="flex items-center justify-between border border-border-default bg-bg-surface px-4 py-3"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-base">{{ ROLE_EMOJI[r.id] }}</span>
                <span class="font-display text-sm font-semibold">{{ ROLE_NAMES[r.id] }}</span>
                <span
                  class="ml-2 font-display text-xs font-bold"
                  :class="ROLE_POINTS[r.id] < 0 ? 'text-accent-coral' : 'text-accent-sky'"
                >
                  {{ ROLE_POINTS[r.id] > 0 ? '+' : '' }}{{ ROLE_POINTS[r.id] }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-text-dim">{{ ROLE_DESC[r.id] }}</p>
            </div>
            <div class="ml-4 flex items-center gap-2">
              <button
                class="flex size-7 items-center justify-center border border-border-default text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
                @click="g.setRoleCount(r.id, -1)"
              >
                <Icon icon="lucide:minus" class="size-3.5" />
              </button>
              <span class="w-5 text-center font-display font-bold text-text-primary">
                {{ g.roleConfig.value[r.id] }}
              </span>
              <button
                class="flex size-7 items-center justify-center border border-border-default text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
                @click="g.setRoleCount(r.id, 1)"
              >
                <Icon icon="lucide:plus" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Villager roles -->
        <p class="mb-2 font-display text-xs text-accent-sky">Phe Dân</p>
        <div class="space-y-2">
          <div
            v-for="r in CONFIGURABLE_ROLES.filter((x) => x.faction === 'villager')"
            :key="r.id"
            class="flex items-center justify-between border border-border-default bg-bg-surface px-4 py-3"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-base">{{ ROLE_EMOJI[r.id] }}</span>
                <span class="font-display text-sm font-semibold">{{ ROLE_NAMES[r.id] }}</span>
                <span
                  class="ml-2 font-display text-xs font-bold"
                  :class="ROLE_POINTS[r.id] < 0 ? 'text-accent-coral' : 'text-accent-sky'"
                >
                  {{ ROLE_POINTS[r.id] > 0 ? '+' : '' }}{{ ROLE_POINTS[r.id] }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-text-dim">{{ ROLE_DESC[r.id] }}</p>
            </div>
            <div class="ml-4 flex items-center gap-2">
              <button
                class="flex size-7 items-center justify-center border border-border-default text-text-dim transition hover:border-accent-sky hover:text-accent-sky"
                @click="g.setRoleCount(r.id, -1)"
              >
                <Icon icon="lucide:minus" class="size-3.5" />
              </button>
              <span class="w-5 text-center font-display font-bold text-text-primary">
                {{ g.roleConfig.value[r.id] }}
              </span>
              <button
                class="flex size-7 items-center justify-center border border-border-default text-text-dim transition hover:border-accent-sky hover:text-accent-sky"
                @click="g.setRoleCount(r.id, 1)"
              >
                <Icon icon="lucide:plus" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Balance indicator -->
        <div class="mt-4 border border-border-default bg-bg-surface px-4 py-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-dim">Điểm cân bằng</span>
            <span
              class="font-display text-sm font-bold"
              :class="
                Math.abs(balanceScore) <= 3
                  ? 'text-accent-sky'
                  : balanceScore < 0
                    ? 'text-accent-coral'
                    : 'text-accent-amber'
              "
            >
              {{ balanceScore > 0 ? '+' : '' }}{{ balanceScore }}
              <span class="ml-1 text-xs font-normal text-text-dim">
                {{
                  Math.abs(balanceScore) <= 3
                    ? '(cân bằng)'
                    : balanceScore < 0
                      ? '(nghiêng về Sói)'
                      : '(nghiêng về Dân)'
                }}
              </span>
            </span>
          </div>
          <p class="mt-1 text-xs text-text-dim">Khi tổng âm = tổng dương là cân bằng (gần 0)</p>
        </div>
      </div>

      <!-- Time config toggle -->
      <div class="mb-6">
        <button
          class="flex w-full items-center justify-between border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-secondary transition hover:border-accent-coral"
          @click="showTimeConfig = !showTimeConfig"
        >
          <span class="flex items-center gap-2">
            <Icon icon="lucide:timer" class="size-4" /> Cấu hình thời gian
          </span>
          <Icon
            :icon="showTimeConfig ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="size-4"
          />
        </button>

        <div
          v-if="showTimeConfig"
          class="space-y-3 border border-t-0 border-border-default bg-bg-surface p-4"
        >
          <div
            v-for="[key, label] in [
              ['discussionSeconds', 'Thảo luận (giây)'],
              ['nominateSeconds', 'Bỏ phiếu đề cử/người (giây)'],
              ['explainSeconds', 'Giải thích (giây)'],
              ['hangVoteSeconds', 'Bỏ phiếu treo cổ/người (giây)'],
              ['nightDelayMs', 'Delay giữa bước đêm (ms)'],
            ]"
            :key="key"
            class="flex items-center justify-between"
          >
            <label class="text-xs text-text-secondary">{{ label }}</label>
            <input
              type="number"
              :value="(g.timeConfig.value as Record<string, number>)[key as string]"
              class="w-24 border border-border-default bg-bg-deep px-2 py-1 text-right text-sm text-text-primary focus:border-accent-coral focus:outline-none"
              @input="
                (e) => {
                  ;(g.timeConfig.value as Record<string, number>)[key as string] = +(
                    e.target as HTMLInputElement
                  ).value
                }
              "
            />
          </div>
        </div>
      </div>

      <!-- Start button -->
      <button
        class="w-full border py-4 font-display text-lg font-bold tracking-wide transition"
        :class="
          g.setupValid.value
            ? 'border-accent-coral bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20'
            : 'cursor-not-allowed border-border-default text-text-dim'
        "
        :disabled="!g.setupValid.value"
        @click="g.startGame"
      >
        Bắt đầu game
      </button>

      <p v-if="!g.setupValid.value" class="mt-2 text-center text-xs text-text-dim">
        <span v-if="g.players.value.length < 3">Cần ít nhất 3 người chơi. </span>
        <span v-if="g.totalRoles.value !== g.players.value.length"
          >Tổng vai ({{ g.totalRoles.value }}) phải bằng số người ({{ g.players.value.length }}).
        </span>
      </p>

      <!-- Footer -->
      <footer
        class="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-4 text-xs text-text-dim"
      >
        <span>Được tạo bởi <span class="font-semibold text-text-primary">Hachi Tu</span></span>
        <div class="flex gap-3">
          <a
            href="https://github.com/hachitubg"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:github" class="size-3.5" /> GitHub
          </a>
          <a
            href="https://www.facebook.com/tuhachiz/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1 transition-colors hover:text-accent-coral"
          >
            <Icon icon="lucide:facebook" class="size-3.5" /> Facebook
          </a>
        </div>
      </footer>
    </div>

    <!-- ══════════════════════════════════════════════ ROLE REVEAL ══ -->
    <div
      v-else-if="g.phase.value === 'role-reveal'"
      class="flex min-h-screen flex-col items-center justify-center px-4"
    >
      <div class="w-full max-w-sm text-center">
        <p class="mb-2 font-display text-xs tracking-widest text-text-dim uppercase">
          Xem bài —
          <span class="text-accent-amber"
            >{{ g.roleRevealIndex.value + 1 }}/{{ g.players.value.length }}</span
          >
        </p>

        <div
          v-if="!g.roleRevealShowing.value"
          class="border border-border-default bg-bg-surface p-8"
        >
          <p class="mb-6 font-display text-2xl font-bold text-accent-amber">
            {{ g.players.value[g.roleRevealIndex.value]?.name }}
          </p>
          <p class="mb-6 text-sm text-text-secondary">
            Truyền điện thoại cho người này, rồi bấm xem bài.
          </p>
          <button
            class="w-full border border-accent-coral bg-accent-coral/10 py-3 font-display font-semibold text-accent-coral transition hover:bg-accent-coral/20"
            @click="g.showRoleCard"
          >
            <Icon icon="lucide:eye" class="mr-2 inline size-4" />
            Xem vai
          </button>
        </div>

        <div v-else class="border border-accent-amber bg-bg-surface p-8">
          <div class="mb-3 text-5xl">
            {{ ROLE_EMOJI[g.players.value[g.roleRevealIndex.value]?.role ?? 'villager'] }}
          </div>
          <p class="mb-1 font-display text-3xl font-bold text-accent-amber">
            {{ ROLE_NAMES[g.players.value[g.roleRevealIndex.value]?.role ?? 'villager'] }}
          </p>
          <p
            class="mb-2 font-display text-xs font-semibold"
            :class="
              ['wolf', 'wolf-cub', 'cursed-wolf', 'traitor'].includes(
                g.players.value[g.roleRevealIndex.value]?.role ?? '',
              )
                ? 'text-accent-coral'
                : 'text-accent-sky'
            "
          >
            {{
              ['wolf', 'wolf-cub', 'cursed-wolf', 'traitor'].includes(
                g.players.value[g.roleRevealIndex.value]?.role ?? '',
              )
                ? 'Phe Sói 🐺'
                : 'Phe Dân 👥'
            }}
          </p>
          <p class="mb-6 text-sm text-text-secondary">
            {{ ROLE_DESC[g.players.value[g.roleRevealIndex.value]?.role ?? 'villager'] }}
          </p>
          <button
            class="w-full border border-accent-sky bg-accent-sky/10 py-3 font-display font-semibold text-accent-sky transition hover:bg-accent-sky/20"
            @click="g.nextRoleReveal"
          >
            <Icon icon="lucide:check" class="mr-2 inline size-4" />
            Đã xem — đưa điện thoại lại
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ NIGHT ══ -->
    <div
      v-else-if="g.phase.value === 'night'"
      class="flex min-h-screen flex-col items-center justify-center bg-bg-deep px-4"
      style="background: radial-gradient(ellipse at top, #0d1b2a 0%, #0f1923 100%)"
    >
      <div class="w-full max-w-sm">
        <!-- Night header -->
        <div class="mb-6 text-center">
          <div class="mb-2 text-4xl">🌙</div>
          <h2 class="font-display text-2xl font-bold text-accent-amber">
            Đêm {{ g.roundNumber.value }}
          </h2>
          <!-- Step progress -->
          <div class="mt-3 flex justify-center gap-1.5">
            <div
              v-for="(step, i) in NIGHT_ORDER"
              :key="step"
              class="h-1 w-6 transition-all"
              :class="
                i < currentStepIndex
                  ? 'bg-accent-coral/60'
                  : i === currentStepIndex
                    ? 'bg-accent-amber'
                    : 'bg-border-default'
              "
            />
          </div>
        </div>

        <!-- Calling / fake-wait state -->
        <div
          v-if="
            g.nightUiState.value === 'calling' ||
            g.nightUiState.value === 'fake-wait' ||
            g.nightUiState.value === 'sleeping'
          "
          class="border border-accent-amber/20 bg-bg-surface/80 p-6 text-center backdrop-blur"
        >
          <Icon
            :icon="STEP_ICON[g.nightStep.value]"
            class="mx-auto mb-3 size-8 text-accent-amber/60"
          />
          <p class="font-display text-lg font-semibold text-text-dim">
            {{ STEP_LABELS[g.nightStep.value] }}
          </p>
          <p class="mt-2 text-sm text-text-dim italic">{{ NIGHT_CALL[g.nightStep.value] }}</p>
          <div class="mt-4 flex justify-center gap-1">
            <span
              v-for="n in 3"
              :key="n"
              class="size-1.5 animate-bounce rounded-full bg-accent-amber/40"
              :style="`animation-delay: ${(n - 1) * 200}ms`"
            />
          </div>
        </div>

        <!-- Acting state -->
        <div v-else-if="g.nightUiState.value === 'acting'">
          <!-- DISRUPTOR ACTION -->
          <div
            v-if="g.nightStep.value === 'disruptor'"
            class="border border-accent-coral/30 bg-bg-surface p-5"
          >
            <p class="mb-4 font-display text-sm font-semibold text-accent-coral">
              <Icon icon="lucide:volume-x" class="mr-1 inline size-4" /> Chọn người cấm nói
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="p in g.livingPlayers.value.filter((p) => p.role !== 'disruptor')"
                :key="p.id"
                class="border py-3 font-display text-sm transition"
                :class="
                  g.disruptorTarget.value === p.id
                    ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral/50'
                "
                @click="g.setDisruptorTarget(p.id)"
              >
                {{ p.name }}
              </button>
            </div>
            <button
              class="mt-4 w-full border border-accent-coral bg-accent-coral/10 py-3 font-display text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20 disabled:opacity-40"
              :disabled="!g.disruptorTarget.value"
              @click="g.confirmDisruptor"
            >
              Xác nhận
            </button>
          </div>

          <!-- CUPID ACTION -->
          <div
            v-else-if="g.nightStep.value === 'cupid'"
            class="border border-accent-amber/30 bg-bg-surface p-5"
          >
            <p class="mb-4 font-display text-sm font-semibold text-accent-amber">
              <Icon icon="lucide:heart" class="mr-1 inline size-4" /> Chọn 2 người yêu nhau
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="p in g.livingPlayers.value"
                :key="p.id"
                class="border py-3 font-display text-sm transition"
                :class="[
                  g.cupidTarget1.value === p.id || g.cupidTarget2.value === p.id
                    ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber/50',
                ]"
                @click="handleCupidClick(p.id)"
              >
                {{ p.name }}
                <span v-if="g.cupidTarget1.value === p.id || g.cupidTarget2.value === p.id"
                  >💘</span
                >
              </button>
            </div>
            <button
              class="mt-4 w-full border border-accent-amber bg-accent-amber/10 py-3 font-display text-sm font-semibold text-accent-amber disabled:opacity-40"
              :disabled="!g.cupidTarget1.value || !g.cupidTarget2.value"
              @click="g.confirmCupid"
            >
              Xác nhận
            </button>
          </div>

          <!-- WOLVES ACTION -->
          <div
            v-else-if="g.nightStep.value === 'wolves'"
            class="border border-accent-coral/40 bg-bg-surface p-5"
          >
            <p class="mb-1 font-display text-sm font-semibold text-accent-coral">
              <Icon icon="lucide:moon" class="mr-1 inline size-4" /> Bầy Sói chọn nạn nhân
              <span v-if="wolfBiteCount > 1" class="ml-1 text-accent-amber"
                >(2 người — Sói con vừa chết)</span
              >
            </p>

            <!-- Who's voting now -->
            <p v-if="currentWolfVoter" class="mb-3 text-xs text-text-dim">
              Lượt của:
              <span class="font-semibold text-accent-amber">{{ currentWolfVoter.name }}</span>
            </p>

            <!-- Targets grid -->
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="p in g.livingPlayers.value.filter((pl) => pl.faction !== 'wolf')"
                :key="p.id"
                class="relative border py-3 font-display text-sm transition"
                :class="
                  g.wolfVotes.value[currentWolfVoter?.id ?? ''] === p.id
                    ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral/50'
                "
                @click="currentWolfVoter && g.setWolfVote(currentWolfVoter.id, p.id)"
              >
                {{ p.name }}
                <span
                  v-if="wolfVoteTally[p.id]"
                  class="absolute right-1.5 top-1 text-xs text-accent-amber"
                >
                  {{ wolfVoteTally[p.id] }}
                </span>
              </button>
            </div>

            <!-- Wolves voted list -->
            <div class="mt-3 space-y-1">
              <div
                v-for="wolf in g.livingWolves.value"
                :key="wolf.id"
                class="flex items-center justify-between text-xs"
              >
                <span class="text-text-dim">{{ wolf.name }}</span>
                <span :class="g.wolfVotes.value[wolf.id] ? 'text-accent-sky' : 'text-text-dim'">
                  {{
                    g.wolfVotes.value[wolf.id]
                      ? getPlayerName(g.wolfVotes.value[wolf.id])
                      : 'Chưa chọn'
                  }}
                </span>
              </div>
            </div>

            <!-- Next wolf / Confirm -->
            <div class="mt-4 flex gap-2">
              <button
                v-if="currentWolfVoter && g.wolfVotes.value[currentWolfVoter.id]"
                class="flex-1 border border-accent-amber bg-accent-amber/10 py-3 font-display text-sm font-semibold text-accent-amber transition hover:bg-accent-amber/20"
                @click="handleWolfVoteNext"
              >
                {{ wolvesYetToVote.length > 1 ? 'Sói tiếp theo' : 'Xong' }}
              </button>
              <button
                v-if="allWolvesVoted && wolvesYetToVote.length === 0"
                class="flex-1 border border-accent-coral bg-accent-coral/10 py-3 font-display text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20"
                @click="g.confirmWolfVotes"
              >
                Xác nhận cắn
              </button>
            </div>

            <!-- Simple: if only 1 wolf or all same vote, allow direct confirm -->
            <button
              v-if="
                g.livingWolves.value.length === 1 &&
                g.wolfVotes.value[g.livingWolves.value[0]?.id ?? '']
              "
              class="mt-2 w-full border border-accent-coral bg-accent-coral/10 py-3 font-display text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20"
              @click="g.confirmWolfVotes"
            >
              Xác nhận
            </button>
          </div>

          <!-- TRAITOR ACTION -->
          <div
            v-else-if="g.nightStep.value === 'traitor'"
            class="border border-accent-coral/30 bg-bg-surface p-5"
          >
            <p class="mb-4 font-display text-sm font-semibold text-accent-coral">
              <Icon icon="lucide:user-x" class="mr-1 inline size-4" /> Danh sách phe Sói
            </p>
            <div class="space-y-2">
              <div
                v-for="wolf in g.players.value.filter(
                  (p) => (p.role === 'wolf' || p.role === 'wolf-cub') && p.alive,
                )"
                :key="wolf.id"
                class="border border-accent-coral/20 bg-accent-coral/5 px-4 py-2.5 text-sm"
              >
                <span class="font-semibold text-accent-coral">{{ wolf.name }}</span>
                <span class="ml-2 text-xs text-text-dim">{{ ROLE_NAMES[wolf.role] }}</span>
              </div>
            </div>
            <p class="mt-3 text-xs italic text-text-dim">
              Chỉ Kẻ phản bội mới được xem thông tin này.
            </p>
            <button
              class="mt-4 w-full border border-accent-coral bg-accent-coral/10 py-3 font-display text-sm font-semibold text-accent-coral"
              @click="g.confirmTraitor"
            >
              Đã xem — Nhắm mắt
            </button>
          </div>

          <!-- SEER ACTION -->
          <div
            v-else-if="g.nightStep.value === 'seer'"
            class="border border-accent-sky/30 bg-bg-surface p-5"
          >
            <p class="mb-4 font-display text-sm font-semibold text-accent-sky">
              <Icon icon="lucide:eye" class="mr-1 inline size-4" /> Chọn người để soi
            </p>

            <div v-if="g.seerResult.value === null" class="grid grid-cols-2 gap-2">
              <button
                v-for="p in g.livingPlayers.value.filter((pl) => pl.role !== 'seer')"
                :key="p.id"
                class="border py-3 font-display text-sm transition"
                :class="
                  g.seerTarget.value === p.id
                    ? 'border-accent-sky bg-accent-sky/20 text-accent-sky'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-sky/50'
                "
                @click="g.setSeerTarget(p.id)"
              >
                {{ p.name }}
              </button>
            </div>

            <!-- Result -->
            <div v-else class="py-4 text-center">
              <p class="mb-1 text-sm text-text-secondary">
                {{ getPlayerName(g.seerTarget.value) }} là:
              </p>
              <p
                class="font-display text-3xl font-bold"
                :class="g.seerResult.value ? 'text-accent-coral' : 'text-accent-sky'"
              >
                {{ g.seerResult.value ? '🐺 Là Sói' : '👤 Không phải Sói' }}
              </p>
              <button
                class="mt-6 w-full border border-accent-sky bg-accent-sky/10 py-3 font-display text-sm font-semibold text-accent-sky transition hover:bg-accent-sky/20"
                @click="g.confirmSeer"
              >
                Đã xem — Nhắm mắt
              </button>
            </div>

            <button
              v-if="g.seerTarget.value && g.seerResult.value === null"
              class="mt-4 w-full border border-accent-sky bg-accent-sky/10 py-3 font-display text-sm font-semibold text-accent-sky transition hover:bg-accent-sky/20"
              @click="g.setSeerTarget(g.seerTarget.value)"
            >
              Xem kết quả
            </button>
          </div>

          <!-- GUARD ACTION -->
          <div
            v-else-if="g.nightStep.value === 'guard'"
            class="border border-accent-amber/30 bg-bg-surface p-5"
          >
            <p class="mb-1 font-display text-sm font-semibold text-accent-amber">
              <Icon icon="lucide:shield" class="mr-1 inline size-4" /> Chọn người bảo vệ
            </p>
            <p v-if="g.lastGuardTarget.value" class="mb-3 text-xs text-text-dim">
              Không thể chọn lại:
              <span class="text-accent-coral">{{ getPlayerName(g.lastGuardTarget.value) }}</span>
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="p in g.livingPlayers.value"
                :key="p.id"
                class="border py-3 font-display text-sm transition disabled:cursor-not-allowed disabled:opacity-30"
                :class="
                  g.guardTarget.value === p.id
                    ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber/50'
                "
                :disabled="isGuardDisabled(p.id)"
                @click="!isGuardDisabled(p.id) && g.setGuardTarget(p.id)"
              >
                {{ p.name }}
              </button>
            </div>
            <button
              class="mt-4 w-full border border-accent-amber bg-accent-amber/10 py-3 font-display text-sm font-semibold text-accent-amber transition hover:bg-accent-amber/20 disabled:opacity-40"
              :disabled="!g.guardTarget.value"
              @click="g.confirmGuard"
            >
              Xác nhận bảo vệ
            </button>
          </div>

          <!-- WITCH ACTION -->
          <div
            v-else-if="g.nightStep.value === 'witch'"
            class="border border-accent-sky/30 bg-bg-surface p-5"
          >
            <p class="mb-3 font-display text-sm font-semibold text-accent-sky">
              <Icon icon="lucide:flask-conical" class="mr-1 inline size-4" /> Phù thủy
            </p>

            <!-- Show victim -->
            <div class="mb-4 border border-accent-coral/20 bg-bg-elevated px-4 py-3 text-sm">
              <span class="text-text-dim">Bị cắn đêm nay: </span>
              <span class="font-semibold text-accent-coral">{{
                getPlayerName(g.witchNightVictim.value)
              }}</span>
            </div>

            <!-- Potions status -->
            <div class="mb-4 flex gap-3 text-xs">
              <span
                :class="!g.witchHealUsed.value ? 'text-accent-sky' : 'text-text-dim line-through'"
              >
                💊 Bình cứu {{ g.witchHealUsed.value ? '(đã dùng)' : '' }}
              </span>
              <span
                :class="
                  !g.witchPoisonUsed.value ? 'text-accent-coral' : 'text-text-dim line-through'
                "
              >
                ☠️ Bình độc {{ g.witchPoisonUsed.value ? '(đã dùng)' : '' }}
              </span>
            </div>

            <!-- Save button -->
            <button
              v-if="witchCanSave && !witchAlreadyActed"
              class="mb-2 w-full border border-accent-sky bg-accent-sky/10 py-3 font-display text-sm font-semibold text-accent-sky transition hover:bg-accent-sky/20"
              :class="g.witchSaved.value ? 'bg-accent-sky/20' : ''"
              @click="g.witchDoSave"
            >
              💊 Cứu {{ getPlayerName(g.witchNightVictim.value) }}
            </button>

            <!-- Kill section -->
            <div v-if="witchCanKill && !g.witchSaved.value">
              <p class="mb-2 text-xs text-text-dim">☠️ Hoặc giết:</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="p in g.livingPlayers.value.filter((pl) => pl.role !== 'witch')"
                  :key="p.id"
                  class="border py-2.5 font-display text-xs transition"
                  :class="
                    g.witchKillTarget.value === p.id
                      ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                      : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral/30'
                  "
                  @click="g.witchSetKill(g.witchKillTarget.value === p.id ? null : p.id)"
                >
                  {{ p.name }}
                </button>
              </div>
            </div>

            <!-- Nothing / Confirm -->
            <button
              class="mt-4 w-full border border-border-default bg-bg-elevated py-3 font-display text-sm font-semibold text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              @click="g.confirmWitch"
            >
              {{ witchAlreadyActed ? 'Xác nhận' : 'Không làm gì — Nhắm mắt' }}
            </button>
          </div>

          <!-- HUNTER ACTION -->
          <div
            v-else-if="g.nightStep.value === 'hunter'"
            class="border border-accent-amber/30 bg-bg-surface p-5"
          >
            <p class="mb-4 font-display text-sm font-semibold text-accent-amber">
              <Icon icon="lucide:crosshair" class="mr-1 inline size-4" /> Chỉ định mục tiêu
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="p in g.livingPlayers.value.filter((pl) => pl.role !== 'hunter')"
                :key="p.id"
                class="border py-3 font-display text-sm transition"
                :class="
                  g.hunterTarget.value === p.id
                    ? 'border-accent-amber bg-accent-amber/20 text-accent-amber'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber/50'
                "
                @click="g.setHunterTarget(p.id)"
              >
                {{ p.name }}
              </button>
            </div>
            <button
              class="mt-4 w-full border border-accent-amber bg-accent-amber/10 py-3 font-display text-sm font-semibold text-accent-amber transition hover:bg-accent-amber/20 disabled:opacity-40"
              :disabled="!g.hunterTarget.value"
              @click="g.confirmHunter"
            >
              Chỉ định xong
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ DAY RESULT ══ -->
    <div
      v-else-if="g.phase.value === 'day-result'"
      class="flex min-h-screen flex-col items-center justify-center px-4"
      style="background: linear-gradient(180deg, #1a2a1a 0%, #0f1923 100%)"
    >
      <div class="w-full max-w-sm text-center">
        <div class="mb-4 text-5xl">🌅</div>
        <h2 class="mb-6 font-display text-2xl font-bold text-accent-amber">
          Ngày {{ g.roundNumber.value }}
        </h2>

        <div class="mb-6 border border-border-default bg-bg-surface p-6">
          <p v-if="g.dayDeaths.value.length === 0" class="text-text-secondary">
            Đêm qua bình yên, không ai chết.
          </p>
          <div v-else>
            <p class="mb-3 text-sm text-text-secondary">Đêm qua đã chết:</p>
            <div class="space-y-2">
              <div
                v-for="d in g.dayDeaths.value"
                :key="d.playerId"
                class="flex items-center justify-between border border-accent-coral/20 bg-bg-elevated px-4 py-2"
              >
                <span class="font-display font-semibold text-accent-coral">{{
                  getPlayerName(d.playerId)
                }}</span>
                <span class="text-xs text-text-dim">😵</span>
              </div>
            </div>
          </div>

          <div
            v-if="g.currentNightSilenced.value"
            class="mt-4 border border-accent-amber/20 bg-bg-elevated px-4 py-2 text-sm"
          >
            🤫
            <span class="text-accent-amber">{{ getPlayerName(g.currentNightSilenced.value) }}</span>
            <span class="text-text-secondary"> bị cấm thảo luận hôm nay</span>
          </div>
        </div>

        <button
          class="w-full border border-accent-sky bg-accent-sky/10 py-4 font-display font-semibold text-accent-sky transition hover:bg-accent-sky/20"
          @click="g.acknowledgeDayResult"
        >
          Tiếp tục → Thảo luận
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ DISCUSSION ══ -->
    <div
      v-else-if="g.phase.value === 'day-discussion'"
      class="flex min-h-screen flex-col items-center justify-center px-4"
    >
      <div class="w-full max-w-sm text-center">
        <h2 class="mb-2 font-display text-2xl font-bold">Thảo luận</h2>

        <!-- Timer -->
        <div class="mb-6 border border-border-default bg-bg-surface p-8">
          <div
            class="font-display text-6xl font-bold"
            :class="g.discussionTimeLeft.value < 30 ? 'text-accent-coral' : 'text-accent-amber'"
          >
            {{ formatTime(g.discussionTimeLeft.value) }}
          </div>
        </div>

        <!-- Silenced player notice -->
        <div
          v-if="g.livingPlayers.value.some((p) => p.isSilenced)"
          class="mb-4 border border-accent-amber/30 bg-bg-surface px-4 py-3 text-sm"
        >
          🤫
          <span class="font-semibold text-accent-amber">{{
            g.livingPlayers.value
              .filter((p) => p.isSilenced)
              .map((p) => p.name)
              .join(', ')
          }}</span>
          không được phép nói.
        </div>

        <!-- Living players status -->
        <div class="mb-6 grid grid-cols-3 gap-2">
          <div
            v-for="p in g.livingPlayers.value"
            :key="p.id"
            class="border py-2 font-display text-xs"
            :class="
              p.isSilenced
                ? 'border-accent-amber/30 bg-accent-amber/5 text-accent-amber'
                : 'border-border-default bg-bg-surface text-text-secondary'
            "
          >
            {{ p.name }}
            <span v-if="p.isSilenced"> 🤫</span>
          </div>
        </div>

        <button
          class="w-full border border-border-default bg-bg-surface py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral"
          @click="g.skipDiscussion"
        >
          Bỏ qua → Bỏ phiếu đề cử
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ NOMINATE ══ -->
    <div
      v-else-if="g.phase.value === 'day-nominate'"
      class="flex min-h-screen flex-col items-center justify-center px-4"
    >
      <div class="w-full max-w-sm">
        <h2 class="mb-1 text-center font-display text-2xl font-bold">Đề cử</h2>
        <p class="mb-6 text-center text-sm text-text-secondary">
          Lượt {{ g.nominateCurrentIndex.value + 1 }}/{{ g.livingPlayers.value.length }}
        </p>

        <div class="border border-border-default bg-bg-surface p-6">
          <p class="mb-4 text-center font-display text-lg font-bold text-accent-amber">
            {{ g.currentNominatePlayer.value?.name }}
          </p>
          <p class="mb-4 text-center text-sm text-text-secondary">
            Chọn người nghi ngờ để đề cử xử:
          </p>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="p in g.livingPlayers.value.filter(
                (pl) => pl.id !== g.currentNominatePlayer.value?.id,
              )"
              :key="p.id"
              class="border py-3 font-display text-sm transition"
              :class="
                g.nominations.value[g.currentNominatePlayer.value?.id ?? ''] === p.id
                  ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral/50'
              "
              @click="g.castNomination(p.id)"
            >
              {{ p.name }}
            </button>
          </div>

          <button
            class="mt-3 w-full border border-border-default bg-bg-elevated py-3 text-sm text-text-dim transition hover:border-accent-coral hover:text-text-secondary"
            @click="g.castNomination(null)"
          >
            Bỏ qua (skip)
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ EXPLAIN ══ -->
    <div
      v-else-if="g.phase.value === 'day-explain'"
      class="flex min-h-screen flex-col items-center justify-center px-4"
    >
      <div class="w-full max-w-sm text-center">
        <h2 class="mb-2 font-display text-2xl font-bold">Giải thích</h2>
        <p class="mb-4 text-sm text-text-secondary">
          {{ g.explainCurrentIndex.value + 1 }}/{{ g.nominatedPlayers.value.length }} người bị đề cử
        </p>

        <div class="mb-6 border border-border-default bg-bg-surface p-8">
          <p class="mb-2 text-sm text-text-dim">Mời giải thích:</p>
          <p class="mb-4 font-display text-3xl font-bold text-accent-amber">
            {{ g.currentExplainPlayer.value?.name }}
          </p>
          <div
            class="font-display text-5xl font-bold"
            :class="g.explainTimeLeft.value < 10 ? 'text-accent-coral' : 'text-text-primary'"
          >
            {{ g.explainTimeLeft.value }}s
          </div>
        </div>

        <div class="mb-4 flex flex-wrap justify-center gap-2">
          <span
            v-for="id in g.nominatedPlayers.value"
            :key="id"
            class="border px-3 py-1 font-display text-xs"
            :class="
              id === g.nominatedPlayers.value[g.explainCurrentIndex.value]
                ? 'border-accent-amber text-accent-amber'
                : 'border-border-default text-text-dim'
            "
          >
            {{ getPlayerName(id) }}
          </span>
        </div>

        <button
          class="w-full border border-border-default bg-bg-surface py-3 text-sm text-text-secondary transition hover:border-accent-coral"
          @click="g.nextExplain"
        >
          Tiếp theo
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ HANG VOTE ══ -->
    <div
      v-else-if="g.phase.value === 'day-hang'"
      class="flex min-h-screen flex-col items-center justify-center px-4"
    >
      <div class="w-full max-w-sm">
        <h2 class="mb-1 text-center font-display text-2xl font-bold">Bỏ phiếu treo cổ</h2>
        <p class="mb-6 text-center text-sm text-text-secondary">
          Lượt {{ g.hangVoteCurrentIndex.value + 1 }}/{{ g.livingPlayers.value.length }}
        </p>

        <div class="border border-border-default bg-bg-surface p-6">
          <p class="mb-4 text-center font-display text-lg font-bold text-accent-amber">
            {{ g.currentHangVotePlayer.value?.name }}
          </p>
          <p class="mb-4 text-center text-sm text-text-secondary">Chọn người muốn treo cổ:</p>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="id in g.nominatedPlayers.value"
              :key="id"
              class="border py-3 font-display text-sm transition"
              :class="
                g.hangVotes.value[g.currentHangVotePlayer.value?.id ?? ''] === id
                  ? 'border-accent-coral bg-accent-coral/20 text-accent-coral'
                  : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-coral/50'
              "
              @click="g.castHangVote(id)"
            >
              {{ getPlayerName(id) }}
            </button>
          </div>

          <button
            class="mt-3 w-full border border-border-default bg-bg-elevated py-3 text-sm text-text-dim transition hover:border-accent-coral hover:text-text-secondary"
            @click="g.castHangVote(null)"
          >
            Bỏ qua (skip)
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ GAME OVER ══ -->
    <div v-else-if="g.phase.value === 'game-over'" class="min-h-screen px-4 py-10">
      <div class="mx-auto max-w-lg">
        <!-- Winner banner -->
        <div
          class="mb-8 border p-8 text-center"
          :class="
            g.winnerFaction.value === 'wolf'
              ? 'border-accent-coral bg-accent-coral/5'
              : 'border-accent-sky bg-accent-sky/5'
          "
        >
          <div class="mb-3 text-6xl">{{ g.winnerFaction.value === 'wolf' ? '🐺' : '🎉' }}</div>
          <h1
            class="font-display text-3xl font-bold"
            :class="g.winnerFaction.value === 'wolf' ? 'text-accent-coral' : 'text-accent-sky'"
          >
            {{ g.winnerFaction.value === 'wolf' ? 'Phe Sói chiến thắng!' : 'Phe Dân chiến thắng!' }}
          </h1>
        </div>

        <!-- Player summary -->
        <div class="mb-6">
          <p class="mb-3 font-display text-xs tracking-widest text-text-dim uppercase">
            <span class="text-accent-coral">//</span> Bảng tổng kết
          </p>
          <div class="space-y-2">
            <div
              v-for="p in g.players.value"
              :key="p.id"
              class="flex items-center gap-3 border border-border-default bg-bg-surface px-4 py-3"
              :class="!p.alive ? 'opacity-60' : ''"
            >
              <span class="text-xl">{{ ROLE_EMOJI[p.role] }}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-display font-semibold">{{ p.name }}</span>
                  <span
                    class="text-xs"
                    :class="p.faction === 'wolf' ? 'text-accent-coral' : 'text-accent-sky'"
                  >
                    {{ p.faction === 'wolf' ? 'Sói' : 'Dân' }}
                  </span>
                </div>
                <div class="text-xs text-text-dim">{{ ROLE_NAMES[p.role] }}</div>
              </div>
              <div class="text-right text-xs">
                <div :class="p.alive ? 'text-accent-sky' : 'text-accent-coral'">
                  {{ p.alive ? '✅ Sống' : '💀 Chết' }}
                </div>
                <div v-if="!p.alive" class="text-text-dim">
                  {{ p.deathTime === 'night' ? `Đêm ${p.deathRound}` : `Ngày ${p.deathRound}` }}
                  · {{ getDeathReasonLabel(p.deathReason ?? '') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Night history -->
        <div class="mb-6">
          <p class="mb-3 font-display text-xs tracking-widest text-text-dim uppercase">
            <span class="text-accent-amber">//</span> Lịch sử đêm
          </p>
          <div class="space-y-3">
            <div
              v-for="night in g.history.value.nights"
              :key="night.night"
              class="border border-border-default bg-bg-surface p-4"
            >
              <p class="mb-2 font-display text-sm font-semibold text-accent-amber">
                🌙 Đêm {{ night.night }}
              </p>
              <div class="space-y-1 text-xs text-text-secondary">
                <div v-if="night.wolfTargets.length">
                  🐺 Sói cắn:
                  <span class="text-accent-coral">{{
                    night.wolfTargets.map((id) => getPlayerName(id)).join(', ')
                  }}</span>
                </div>
                <div v-if="night.seerTarget">
                  🔮 Tiên tri soi
                  <span class="text-accent-sky">{{ getPlayerName(night.seerTarget) }}</span
                  >:
                  {{ night.seerIsWolf ? '🐺 Là Sói' : '👤 Không phải Sói' }}
                </div>
                <div v-if="night.guardTarget">
                  🛡️ Bảo vệ:
                  <span class="text-accent-amber">{{ getPlayerName(night.guardTarget) }}</span>
                </div>
                <div v-if="night.witchSaved">
                  💊 Phù thủy cứu:
                  <span class="text-accent-sky">{{ getPlayerName(night.witchSaved) }}</span>
                </div>
                <div v-if="night.witchKilled">
                  ☠️ Phù thủy giết:
                  <span class="text-accent-coral">{{ getPlayerName(night.witchKilled) }}</span>
                </div>
                <div v-if="night.disruptorTarget">
                  🤫 Kẻ phá hoại cấm:
                  <span class="text-accent-amber">{{ getPlayerName(night.disruptorTarget) }}</span>
                </div>
                <div v-if="night.hunterTarget">
                  🏹 Thợ săn chỉ định:
                  <span class="text-text-primary">{{ getPlayerName(night.hunterTarget) }}</span>
                </div>
                <div v-if="night.curseConverted">
                  😈 Sói nguyền chuyển phe:
                  <span class="text-accent-coral">{{ getPlayerName(night.curseConverted) }}</span>
                </div>
                <div v-if="night.deaths.length" class="pt-1">
                  💀 Chết:
                  <span class="text-accent-coral">{{
                    night.deaths.map((d) => getPlayerName(d.playerId)).join(', ')
                  }}</span>
                </div>
                <div v-else class="pt-1 italic text-text-dim">Không ai chết</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Day history -->
        <div class="mb-8">
          <p class="mb-3 font-display text-xs tracking-widest text-text-dim uppercase">
            <span class="text-accent-sky">//</span> Lịch sử ngày
          </p>
          <div class="space-y-3">
            <div
              v-for="day in g.history.value.days"
              :key="day.day"
              class="border border-border-default bg-bg-surface p-4"
            >
              <p class="mb-2 font-display text-sm font-semibold text-accent-sky">
                ☀️ Ngày {{ day.day }}
              </p>
              <div class="space-y-1 text-xs text-text-secondary">
                <div v-if="day.silenced">
                  🤫 Bị cấm:
                  <span class="text-accent-amber">{{ getPlayerName(day.silenced) }}</span>
                </div>
                <div v-if="day.nominated.length">
                  📋 Đề cử:
                  <span class="text-text-primary">{{
                    day.nominated.map((id) => getPlayerName(id)).join(', ')
                  }}</span>
                </div>
                <div v-if="day.hanged">
                  🪢 Bị treo:
                  <span class="font-semibold text-accent-coral">{{
                    getPlayerName(day.hanged)
                  }}</span>
                </div>
                <div v-else class="italic text-text-dim">Không ai bị treo</div>
              </div>
            </div>
          </div>
        </div>

        <button
          class="w-full border border-accent-coral bg-accent-coral/10 py-4 font-display text-lg font-bold text-accent-coral transition hover:bg-accent-coral/20"
          @click="g.resetGame"
        >
          Chơi lại
        </button>

        <!-- Footer -->
        <footer
          class="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-4 text-xs text-text-dim"
        >
          <span>Được tạo bởi <span class="font-semibold text-text-primary">Hachi Tu</span></span>
          <div class="flex gap-3">
            <a
              href="https://github.com/hachitubg"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 transition-colors hover:text-accent-coral"
            >
              <Icon icon="lucide:github" class="size-3.5" /> GitHub
            </a>
            <a
              href="https://www.facebook.com/tuhachiz/"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 transition-colors hover:text-accent-coral"
            >
              <Icon icon="lucide:facebook" class="size-3.5" /> Facebook
            </a>
          </div>
        </footer>
      </div>
    </div>

    <!-- Floating controls - chỉ hiển thị khi đang chơi (không phải setup) -->
    <div
      v-if="g.phase.value !== 'setup' && g.phase.value !== 'game-over'"
      class="fixed right-4 top-4 z-50 flex gap-2"
    >
      <button
        v-if="g.nightSnapshot.value"
        class="flex items-center gap-1.5 border border-border-default bg-bg-deep/90 px-3 py-2 text-xs text-text-secondary backdrop-blur transition hover:border-accent-amber hover:text-accent-amber"
        @click="g.goBackToNight"
      >
        <Icon icon="lucide:rotate-ccw" class="size-3.5" />
        Đêm trước
      </button>
      <button
        class="flex items-center gap-1.5 border border-border-default bg-bg-deep/90 px-3 py-2 text-xs text-text-secondary backdrop-blur transition hover:border-accent-coral hover:text-accent-coral"
        @click="showResetConfirm = true"
      >
        <Icon icon="lucide:refresh-cw" class="size-3.5" />
        Chơi lại
      </button>
      <button
        class="flex items-center gap-1.5 border border-border-default bg-bg-deep/90 px-3 py-2 text-xs text-text-secondary backdrop-blur transition hover:border-accent-amber hover:text-accent-amber"
        @click="showSpeechSettings = true"
      >
        <Icon icon="lucide:settings-2" class="size-3.5" />
        Giọng đọc
      </button>
      <button
        class="flex items-center gap-1.5 border px-3 py-2 text-xs backdrop-blur transition"
        :class="
          g.isPaused.value
            ? 'border-accent-sky bg-accent-sky/20 text-accent-sky hover:bg-accent-sky/30'
            : 'border-border-default bg-bg-deep/90 text-text-secondary hover:border-accent-sky hover:text-accent-sky'
        "
        @click="g.togglePause"
      >
        <Icon :icon="g.isPaused.value ? 'lucide:play' : 'lucide:pause'" class="size-3.5" />
        {{ g.isPaused.value ? 'Tiếp tục' : 'Tạm dừng' }}
      </button>
    </div>

    <!-- Speech Settings modal -->
    <div
      v-if="showSpeechSettings"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg-deep/80 p-4 backdrop-blur"
    >
      <div class="w-full max-w-sm border border-border-default bg-bg-surface">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h3 class="font-display text-base font-bold">
            <Icon icon="lucide:settings-2" class="mr-2 inline size-4 text-accent-amber" />
            Cài đặt giọng đọc
          </h3>
          <button class="text-text-dim hover:text-text-primary" @click="showSpeechSettings = false">
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>

        <div class="space-y-5 p-5">
          <!-- Speed slider -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="text-sm font-semibold text-text-primary">Tốc độ đọc</label>
              <span class="font-display text-sm font-bold text-accent-amber">
                {{ g.speechRate.value.toFixed(1) }}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              :value="g.speechRate.value"
              class="h-1.5 w-full cursor-pointer accent-amber-400 appearance-none rounded bg-border-default"
              @input="(e) => (g.speechRate.value = +(e.target as HTMLInputElement).value)"
            />
            <div class="mt-1 flex justify-between text-xs text-text-dim">
              <span>Chậm (0.5×)</span>
              <span>Bình thường (1.0×)</span>
              <span>Nhanh (2.0×)</span>
            </div>
          </div>

          <!-- Voice selection -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-text-primary">Chọn giọng</label>

            <div v-if="g.availableVoices.value.length === 0" class="text-xs text-text-dim italic">
              Không tìm thấy giọng đọc. Thử tải lại trang hoặc bật TTS trong cài đặt thiết bị.
            </div>

            <div v-else class="max-h-56 overflow-y-auto space-y-1 border border-border-default p-1">
              <!-- Vietnamese voices first -->
              <div v-if="viVoices.length > 0" class="mb-1">
                <p class="px-2 py-1 text-xs font-semibold text-accent-sky">🇻🇳 Tiếng Việt</p>
                <button
                  v-for="v in viVoices"
                  :key="v.voiceURI"
                  class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition"
                  :class="
                    g.selectedVoiceURI.value === v.voiceURI
                      ? 'bg-accent-amber/15 text-accent-amber'
                      : 'text-text-secondary hover:bg-bg-elevated'
                  "
                  @click="g.selectedVoiceURI.value = v.voiceURI"
                >
                  <span>{{ v.name }}</span>
                  <Icon
                    v-if="g.selectedVoiceURI.value === v.voiceURI"
                    icon="lucide:check"
                    class="size-3.5 shrink-0"
                  />
                </button>
              </div>

              <!-- Other voices -->
              <div v-if="otherVoices.length > 0">
                <p class="px-2 py-1 text-xs font-semibold text-text-dim">Giọng khác</p>
                <button
                  v-for="v in otherVoices"
                  :key="v.voiceURI"
                  class="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition"
                  :class="
                    g.selectedVoiceURI.value === v.voiceURI
                      ? 'bg-accent-amber/15 text-accent-amber'
                      : 'text-text-dim hover:bg-bg-elevated'
                  "
                  @click="g.selectedVoiceURI.value = v.voiceURI"
                >
                  <span
                    >{{ v.name }} <span class="opacity-60">({{ v.lang }})</span></span
                  >
                  <Icon
                    v-if="g.selectedVoiceURI.value === v.voiceURI"
                    icon="lucide:check"
                    class="size-3.5 shrink-0"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Test button -->
          <button
            class="w-full border border-accent-amber bg-accent-amber/10 py-2.5 font-display text-sm font-semibold text-accent-amber transition hover:bg-accent-amber/20"
            @click="g.testSpeak"
          >
            <Icon icon="lucide:play-circle" class="mr-2 inline size-4" />
            Thử giọng đọc
          </button>
        </div>
      </div>
    </div>

    <!-- Reset confirm dialog -->
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 backdrop-blur"
    >
      <div class="border border-accent-coral/30 bg-bg-surface p-8 text-center">
        <Icon icon="lucide:alert-triangle" class="mx-auto mb-3 size-10 text-accent-coral" />
        <p class="font-display text-lg font-bold text-text-primary">Bắt đầu game mới?</p>
        <p class="mt-2 text-sm text-text-dim">Toàn bộ dữ liệu game hiện tại sẽ bị xóa.</p>
        <div class="mt-5 flex gap-3">
          <button
            class="flex-1 border border-border-default bg-bg-deep py-2.5 text-sm text-text-secondary transition hover:border-text-secondary"
            @click="showResetConfirm = false"
          >
            Huỷ
          </button>
          <button
            class="flex-1 border border-accent-coral bg-accent-coral/10 py-2.5 text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20"
            @click="handleReset"
          >
            Chơi lại
          </button>
        </div>
      </div>
    </div>

    <!-- Pause overlay -->
    <div
      v-if="g.isPaused.value"
      class="fixed inset-0 z-40 flex items-center justify-center bg-bg-deep/80 backdrop-blur"
    >
      <div class="border border-accent-sky/30 bg-bg-surface p-8 text-center">
        <Icon icon="lucide:pause-circle" class="mx-auto mb-3 size-12 text-accent-sky" />
        <p class="font-display text-xl font-bold text-accent-sky">Đang tạm dừng</p>
        <p class="mt-2 text-sm text-text-dim">Nhấn "Tiếp tục" để chơi lại</p>
        <button
          class="mt-4 border border-accent-sky bg-accent-sky/10 px-6 py-2.5 font-display font-semibold text-accent-sky transition hover:bg-accent-sky/20"
          @click="g.togglePause"
        >
          <Icon icon="lucide:play" class="mr-2 inline size-4" />
          Tiếp tục
        </button>
      </div>
    </div>

    <!-- Floating guide button (visible in all non-setup phases) -->
    <button
      v-if="g.phase.value !== 'setup' && g.phase.value !== 'game-over'"
      class="fixed bottom-4 right-4 z-40 flex size-10 items-center justify-center border border-border-default bg-bg-surface text-text-dim shadow-lg transition hover:border-accent-sky hover:text-accent-sky"
      @click="showGuide = true"
    >
      <Icon icon="lucide:book-open" class="size-4" />
    </button>
    <button
      v-else-if="g.phase.value === 'game-over'"
      class="fixed bottom-4 right-4 z-40 flex size-10 items-center justify-center border border-border-default bg-bg-surface text-text-dim shadow-lg transition hover:border-accent-sky hover:text-accent-sky"
      @click="showGuide = true"
    >
      <Icon icon="lucide:book-open" class="size-4" />
    </button>

    <!-- ══════════════════════════════════════════════ GUIDE MODAL ══ -->
    <Teleport to="body">
      <div
        v-if="showGuide"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg-deep/95 px-4 py-8 backdrop-blur"
        @click.self="showGuide = false"
      >
        <div class="w-full max-w-lg">
          <!-- Modal header -->
          <div class="mb-6 flex items-center justify-between">
            <h2 class="font-display text-2xl font-bold">
              <span class="text-accent-sky">📖</span> Hướng dẫn chơi
            </h2>
            <button
              class="flex size-9 items-center justify-center border border-border-default text-text-dim transition hover:border-accent-coral hover:text-accent-coral"
              @click="showGuide = false"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>

          <!-- Flow overview -->
          <div class="mb-6 border border-border-default bg-bg-surface p-5">
            <p class="mb-3 font-display text-sm font-semibold text-accent-amber">
              <span class="text-accent-amber">//</span> Luật chung
            </p>
            <div class="space-y-2 text-sm text-text-secondary">
              <p>
                🎯 <span class="font-semibold text-text-primary">Phe Sói thắng</span> khi số Sói ≥
                số Dân còn sống.
              </p>
              <p>
                🎯 <span class="font-semibold text-text-primary">Phe Dân thắng</span> khi tất cả Sói
                bị loại.
              </p>
              <p>🔒 Không ai được tiết lộ vai trò của mình trong lúc chơi.</p>
              <p>🤐 Người chết <strong>không được</strong> nói chuyện hay tiết lộ thông tin.</p>
            </div>
          </div>

          <!-- Night order -->
          <div class="mb-6 border border-border-default bg-bg-surface p-5">
            <p class="mb-3 font-display text-sm font-semibold text-accent-amber">
              <span class="text-accent-amber">//</span> Thứ tự mỗi đêm
            </p>
            <div class="flex flex-wrap gap-2 text-xs">
              <span
                v-for="(s, i) in [
                  '🤫 Kẻ phá hoại',
                  '💘 Thần tình yêu',
                  '🐺 Bầy Sói',
                  '🎭 Kẻ phản bội',
                  '🔮 Tiên tri',
                  '🛡️ Bảo vệ',
                  '🧙 Phù thủy',
                  '🏹 Thợ săn',
                ]"
                :key="i"
                class="flex items-center gap-1 border border-border-default bg-bg-elevated px-2 py-1"
              >
                <span class="text-text-dim">{{ i + 1 }}.</span> {{ s }}
              </span>
            </div>
            <p class="mt-2 text-xs italic text-text-dim">
              * Vai nào không có trong game sẽ bị bỏ qua. Vai chết vẫn được gọi (chờ ngẫu nhiên) để
              tránh lộ thông tin.
            </p>
          </div>

          <!-- Wolf faction -->
          <div class="mb-4 border border-accent-coral/20 bg-bg-surface p-5">
            <p class="mb-3 font-display text-sm font-semibold text-accent-coral">🐺 Phe Sói</p>
            <div class="space-y-4">
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Sói thường</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Mỗi đêm cùng các Sói khác <strong>chọn 1 người</strong> để cắn chết. Sói biết nhau
                  từ đầu game.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Sói con 🐺</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Khi Sói con chết (bất kỳ lý do nào), <strong>đêm ngay sau đó</strong> bầy Sói được
                  cắn <strong>2 người</strong>. Hiệu ứng chỉ 1 đêm.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Sói nguyền 😈</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Ban đầu thuộc <strong>Phe Dân</strong> — Tiên tri soi thấy
                  <em>"Không phải Sói"</em>. Khi bị Sói cắn mà không được bảo vệ/cứu →
                  <strong>chuyển sang Phe Sói</strong> (không chết). Sau khi chuyển phe, Tiên tri
                  soi thấy <em>"Là Sói"</em>.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Kẻ phản bội 🎭</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Biết ai là Sói, nhưng Sói không biết bạn. Đêm đầu mở mắt để xem danh sách Sói.
                  <strong>Thắng nếu phe Sói thắng</strong>. Tiên tri soi thấy <em>"Là Sói"</em>.
                </p>
              </div>
            </div>
          </div>

          <!-- Villager faction -->
          <div class="mb-4 border border-accent-sky/20 bg-bg-surface p-5">
            <p class="mb-3 font-display text-sm font-semibold text-accent-sky">👥 Phe Dân</p>
            <div class="space-y-4">
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Dân thường 👤</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Không có kỹ năng đặc biệt. Sử dụng lý lẽ để tìm Sói trong ngày.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Tiên tri 🔮</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Mỗi đêm <strong>soi 1 người</strong> — kết quả chỉ là <em>"Là Sói"</em> hoặc
                  <em>"Không phải Sói"</em>.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Bảo vệ 🛡️</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Mỗi đêm <strong>bảo vệ 1 người</strong> khỏi bị Sói cắn.
                  <strong>Không</strong> được bảo vệ cùng 1 người 2 đêm liên tiếp.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Phù thủy 🧙</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Có <strong>1 bình cứu</strong> và <strong>1 bình độc</strong>, mỗi loại dùng được
                  1 lần. Bình độc <strong>vượt qua</strong> bảo vệ của Bảo vệ.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Thợ săn 🏹</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Mỗi đêm <strong>chỉ định 1 người</strong>. Khi Thợ săn chết,
                  <strong>người bị chỉ định cũng chết theo</strong>.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Kẻ phá hoại 🤫</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Mỗi đêm <strong>cấm 1 người nói</strong> trong giai đoạn thảo luận sáng hôm sau.
                </p>
              </div>
              <div>
                <p class="font-display text-sm font-semibold text-text-primary">Thần tình yêu 💘</p>
                <p class="mt-0.5 text-sm text-text-secondary">
                  Đêm 1: <strong>chọn 2 người yêu nhau</strong>. Nếu 1 người chết, người kia chết
                  theo. Hai người yêu sẽ không biết nhau (chỉ quản trò biết).
                </p>
              </div>
            </div>
          </div>

          <!-- Day flow -->
          <div class="mb-6 border border-border-default bg-bg-surface p-5">
            <p class="mb-3 font-display text-sm font-semibold text-accent-amber">
              <span class="text-accent-amber">//</span> Quy trình ban ngày
            </p>
            <ol class="space-y-2 text-sm text-text-secondary">
              <li>
                <span class="font-semibold text-accent-amber">1.</span> App thông báo ai đã chết đêm
                qua (không nói lý do).
              </li>
              <li>
                <span class="font-semibold text-accent-amber">2.</span> <strong>Thảo luận</strong> —
                đếm ngược, người bị cấm không được nói.
              </li>
              <li>
                <span class="font-semibold text-accent-amber">3.</span> <strong>Đề cử</strong> —
                truyền tay: mỗi người chọn 1 nghi phạm hoặc skip.
              </li>
              <li>
                <span class="font-semibold text-accent-amber">4.</span>
                <strong>Giải thích</strong> — người bị đề cử lần lượt có thời gian biện hộ.
              </li>
              <li>
                <span class="font-semibold text-accent-amber">5.</span>
                <strong>Bỏ phiếu treo cổ</strong> — truyền tay: mỗi người chọn ai treo hoặc skip.
                Hòa phiếu → không ai chết.
              </li>
            </ol>
          </div>

          <button
            class="w-full border border-accent-sky bg-accent-sky/10 py-3 font-display font-semibold text-accent-sky transition hover:bg-accent-sky/20"
            @click="showGuide = false"
          >
            Đã hiểu — Đóng
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
