<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import type { FriendsConfig, PlayerAction } from '../types'
import { useFriendsGame } from '../composables/use-friends-game'
import PlayerSeat from './PlayerSeat.vue'
import BettingControls from './BettingControls.vue'

const props = defineProps<{ config: FriendsConfig }>()
const emit = defineEmits<{ leave: [] }>()

const game = useFriendsGame()
game.initGame(props.config)

const isMobile = useMediaQuery('(max-width: 640px)')
const showHistory = ref(false)
const selectedWinners = ref<Set<string>>(new Set())

const { state, awaitingConfirm, nextPhaseLabel, showdownPlayerIds, sidePots } = game

const activePlayer = computed(() => state.players[state.activePlayerIndex])
const activePlayers = computed(() => state.players.filter((p) => p.status !== 'out'))
const isInBettingPhase = computed(
  () => !awaitingConfirm.value && state.phase !== 'waiting' && state.phase !== 'showdown',
)
const showdownRemaining = computed(() =>
  state.players.filter((p) => showdownPlayerIds.value.includes(p.id)),
)
const showWinnerSelection = computed(
  () =>
    state.phase === 'showdown' && state.winners.length === 0 && showdownPlayerIds.value.length > 1,
)

const phaseLabel = computed(() => {
  switch (state.phase) {
    case 'waiting':
      return 'WAITING'
    case 'pre-flop':
      return 'PRE-FLOP'
    case 'flop':
      return 'FLOP'
    case 'turn':
      return 'TURN'
    case 'river':
      return 'RIVER'
    case 'showdown':
      return 'SHOWDOWN'
    default:
      return ''
  }
})

function getBlindRole(playerId: string): 'sb' | 'bb' | null {
  if (state.phase === 'waiting' || state.handNumber === 0) return null
  const players = state.players
  const count = players.length
  const di = state.dealerIndex
  const active = players.filter((p) => p.status !== 'out')
  const isHeadsUp = active.length === 2

  const sbStart = isHeadsUp ? di : (di + 1) % count
  let sbIdx = sbStart
  let tries = 0
  while (players[sbIdx]?.status === 'out' && tries < count) {
    sbIdx = (sbIdx + 1) % count
    tries++
  }

  let bbIdx = (sbIdx + 1) % count
  tries = 0
  while (players[bbIdx]?.status === 'out' && tries < count) {
    bbIdx = (bbIdx + 1) % count
    tries++
  }

  const pidx = players.findIndex((p) => p.id === playerId)
  if (pidx === sbIdx) return 'sb'
  if (pidx === bbIdx) return 'bb'
  return null
}

function handleAction(action: PlayerAction) {
  const player = activePlayer.value
  if (player) game.applyAction(player.id, action)
}

function toggleWinner(id: string) {
  const set = new Set(selectedWinners.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  selectedWinners.value = set
}

function confirmWinners() {
  if (selectedWinners.value.size === 0) return
  game.awardWinners([...selectedWinners.value])
  selectedWinners.value = new Set()
}

function handleNewHand() {
  selectedWinners.value = new Set()
  game.startHand()
}

function handleConfirmPhase() {
  game.confirmNextPhase()
}

function seatAngle(idx: number, total: number): { left: string; top: string; transform: string } {
  const angle = ((270 + (idx * 360) / total) % 360) * (Math.PI / 180)
  return {
    left: `${50 + 36 * Math.cos(angle)}%`,
    top: `${48 + 34 * Math.sin(angle)}%`,
    transform: 'translate(-50%, -50%)',
  }
}
</script>

<template>
  <div class="flex flex-col bg-bg-deep overflow-hidden" style="height: 100%; min-height: 0">
    <!-- ── HEADER ── -->
    <div
      class="flex items-center justify-between px-3 py-1.5 border-b border-border-default bg-bg-surface flex-shrink-0"
    >
      <button
        class="flex items-center gap-1 text-text-dim hover:text-accent-coral transition-colors text-xs font-body"
        @click="emit('leave')"
      >
        <Icon icon="lucide:arrow-left" class="size-3.5" />
        <span class="hidden sm:inline">Rời bàn</span>
      </button>

      <div class="flex items-center gap-2 text-xs font-display">
        <span class="text-text-dim">#{{ state.handNumber }}</span>
        <span class="text-accent-coral/40">·</span>
        <span class="text-text-secondary">{{ state.smallBlind }}/{{ state.bigBlind }}</span>
        <span
          :class="[
            'px-1.5 py-0.5 font-bold tracking-widest text-xs',
            state.phase === 'showdown'
              ? 'bg-accent-amber/20 text-accent-amber'
              : 'bg-accent-coral/10 text-accent-coral',
          ]"
          >{{ phaseLabel }}</span
        >
      </div>

      <div class="flex items-center gap-2">
        <span class="text-text-dim text-xs font-body"
          >{{ activePlayers.length }}/{{ state.players.length }}</span
        >
        <button
          class="text-text-dim/60 hover:text-accent-sky transition-colors"
          title="Lịch sử"
          @click="showHistory = !showHistory"
        >
          <Icon icon="lucide:scroll-text" class="size-4" />
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         MOBILE LAYOUT
    ═══════════════════════════════════════════ -->
    <template v-if="isMobile">
      <div class="flex flex-col flex-1 min-h-0 relative">
        <!-- All players in scrollable row -->
        <div
          class="flex gap-1.5 overflow-x-auto px-2 py-1.5 border-b border-border-default bg-bg-surface/40 flex-shrink-0"
        >
          <PlayerSeat
            v-for="player in state.players"
            :key="player.id"
            :player="player"
            :is-active="
              isInBettingPhase && state.players.indexOf(player) === state.activePlayerIndex
            "
            :is-dealer="state.players.indexOf(player) === state.dealerIndex"
            :blind-role="getBlindRole(player.id)"
            :phase="state.phase"
            :is-local-player="false"
          />
        </div>

        <!-- Center area -->
        <div class="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-2 min-h-0">
          <!-- Pot -->
          <div
            v-if="state.phase !== 'waiting'"
            class="flex items-center gap-1.5 bg-bg-elevated border border-border-default px-3 py-1.5"
          >
            <Icon icon="lucide:circle-dollar-sign" class="size-4 text-accent-amber" />
            <span class="text-accent-amber font-display font-bold text-base">{{
              state.pot.toLocaleString()
            }}</span>
          </div>

          <!-- Side pots -->
          <div v-if="sidePots.length > 1" class="flex flex-wrap gap-1 justify-center">
            <div
              v-for="(pot, i) in sidePots"
              :key="i"
              class="text-xs font-display px-2 py-0.5 border border-border-default bg-bg-surface"
            >
              <span class="text-text-dim">{{ i === 0 ? 'Main' : `Side ${i}` }}:</span>
              <span class="text-accent-amber font-bold ml-1">{{
                pot.amount.toLocaleString()
              }}</span>
            </div>
          </div>

          <!-- Phase indicator -->
          <div
            v-if="state.phase !== 'waiting' && state.phase !== 'showdown'"
            class="text-text-dim text-xs font-body text-center"
          >
            <template v-if="isInBettingPhase && activePlayer">
              <span class="text-accent-amber font-display font-bold">{{ activePlayer.name }}</span>
              đang hành động
            </template>
          </div>

          <div
            v-if="state.lastActionText"
            class="text-text-dim text-xs font-body italic text-center"
          >
            {{ state.lastActionText }}
          </div>
        </div>

        <!-- History overlay -->
        <div v-if="showHistory" class="absolute inset-0 bg-bg-deep/90 z-30 flex flex-col">
          <div class="flex items-center justify-between px-3 py-2 border-b border-border-default">
            <span class="font-display text-sm font-bold text-text-primary">Lịch sử</span>
            <button class="text-text-dim hover:text-text-primary" @click="showHistory = false">
              <Icon icon="lucide:x" class="size-5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div
              v-for="(entry, i) in state.actionHistory"
              :key="i"
              class="text-text-secondary text-xs font-body py-0.5 border-b border-border-default/30"
            >
              {{ entry }}
            </div>
            <div v-if="state.actionHistory.length === 0" class="text-text-dim text-xs italic">
              Chưa có hành động nào
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════
         DESKTOP LAYOUT
    ═══════════════════════════════════════════ -->
    <template v-else>
      <div class="relative flex-1 min-h-0">
        <!-- Felt oval -->
        <div
          class="absolute border border-border-default/50 bg-bg-surface/40"
          style="border-radius: 45%; left: 16%; right: 16%; top: 14%; bottom: 14%"
        />

        <!-- Center info -->
        <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10"
        >
          <!-- Pot -->
          <div
            v-if="state.phase !== 'waiting'"
            class="flex items-center gap-1.5 bg-bg-elevated/90 border border-border-default px-3 py-1"
          >
            <Icon icon="lucide:circle-dollar-sign" class="size-4 text-accent-amber" />
            <span class="text-accent-amber font-display text-sm font-bold">{{
              state.pot.toLocaleString()
            }}</span>
          </div>

          <!-- Side pots -->
          <div v-if="sidePots.length > 1" class="flex flex-wrap gap-1 justify-center">
            <div
              v-for="(pot, i) in sidePots"
              :key="i"
              class="text-xs font-display px-2 py-0.5 border border-border-default bg-bg-surface/80"
            >
              <span class="text-text-dim">{{ i === 0 ? 'Main' : `Side ${i}` }}:</span>
              <span class="text-accent-amber font-bold ml-1">{{
                pot.amount.toLocaleString()
              }}</span>
            </div>
          </div>

          <!-- Phase indicator for physical cards -->
          <div v-if="state.phase !== 'waiting' && state.phase !== 'showdown'" class="text-center">
            <div v-if="isInBettingPhase && activePlayer" class="text-text-dim text-xs font-body">
              Lượt của
              <span class="text-accent-amber font-display font-bold">{{ activePlayer.name }}</span>
            </div>
          </div>

          <div
            v-if="state.lastActionText"
            class="text-text-dim text-xs font-body italic max-w-48 text-center"
          >
            {{ state.lastActionText }}
          </div>
        </div>

        <!-- Seats -->
        <PlayerSeat
          v-for="(player, idx) in state.players"
          :key="player.id"
          :player="player"
          :is-active="isInBettingPhase && idx === state.activePlayerIndex"
          :is-dealer="idx === state.dealerIndex"
          :blind-role="getBlindRole(player.id)"
          :phase="state.phase"
          :is-local-player="false"
          class="absolute z-20"
          :style="seatAngle(idx, state.players.length)"
        />

        <!-- History panel (desktop) -->
        <div
          v-if="showHistory"
          class="absolute right-2 top-2 w-56 max-h-64 z-30 bg-bg-surface border border-border-default flex flex-col overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-2.5 py-1.5 border-b border-border-default"
          >
            <span class="font-display text-xs font-bold text-text-primary">Lịch sử</span>
            <button class="text-text-dim hover:text-text-primary" @click="showHistory = false">
              <Icon icon="lucide:x" class="size-3.5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-0.5">
            <div
              v-for="(entry, i) in state.actionHistory"
              :key="i"
              class="text-text-secondary text-xs font-body py-0.5 border-b border-border-default/30"
            >
              {{ entry }}
            </div>
            <div v-if="state.actionHistory.length === 0" class="text-text-dim text-xs italic">
              Chưa có hành động nào
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════
         BOTTOM PANELS (context-dependent)
    ═══════════════════════════════════════════ -->

    <!-- ── WAITING: Start new hand ── -->
    <div
      v-if="state.phase === 'waiting'"
      class="bg-bg-surface border-t border-border-default px-3 py-3 flex-shrink-0"
    >
      <div class="flex gap-2">
        <button
          class="flex-1 py-3 border border-accent-coral/60 bg-accent-coral/10 text-accent-coral font-display font-bold text-sm hover:bg-accent-coral/20 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
          :disabled="activePlayers.length < 2"
          @click="handleNewHand"
        >
          <Icon icon="lucide:play" class="size-4" />
          Ván mới
        </button>
        <button
          class="py-3 px-4 border border-border-default text-text-dim font-display text-xs hover:border-accent-coral hover:text-accent-coral transition-colors active:scale-95"
          @click="emit('leave')"
        >
          Rời bàn
        </button>
      </div>
    </div>

    <!-- ── AWAITING PHASE CONFIRM: Physical dealer prompt ── -->
    <div
      v-else-if="awaitingConfirm"
      class="bg-bg-surface border-t border-border-default px-3 py-3 flex-shrink-0"
    >
      <div class="flex flex-col items-center gap-2">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:layout-grid" class="size-5 text-accent-amber" />
          <span class="font-display font-bold text-sm text-accent-amber">{{ nextPhaseLabel }}</span>
        </div>
        <p class="text-text-dim text-xs font-body text-center">
          Người chia bài hãy lật bài chung, sau đó bấm tiếp tục
        </p>
        <button
          class="w-full max-w-xs py-2.5 border border-accent-coral/60 bg-accent-coral/10 text-accent-coral font-display font-bold text-sm hover:bg-accent-coral/20 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
          @click="handleConfirmPhase"
        >
          <Icon icon="lucide:check" class="size-4" />
          Tiếp tục
        </button>
      </div>
    </div>

    <!-- ── SHOWDOWN: Winner selection ── -->
    <div
      v-else-if="showWinnerSelection"
      class="bg-bg-surface border-t border-border-default px-3 py-2.5 flex-shrink-0"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:trophy" class="size-4 text-accent-amber" />
          <span class="font-display text-sm font-bold text-text-primary">Chọn người thắng</span>
          <span class="text-text-dim text-xs font-body">(có thể chọn nhiều để chia pot)</span>
        </div>

        <!-- Side pot info -->
        <div v-if="sidePots.length > 1" class="flex flex-wrap gap-1">
          <div
            v-for="(pot, i) in sidePots"
            :key="i"
            class="text-xs font-display px-2 py-0.5 border border-border-default bg-bg-elevated"
          >
            {{ i === 0 ? 'Main pot' : `Side pot ${i}` }}:
            <span class="text-accent-amber font-bold">{{ pot.amount.toLocaleString() }}</span>
            <span class="text-text-dim"> ({{ pot.eligibleIds.length }} người)</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="player in showdownRemaining"
            :key="player.id"
            :class="[
              'flex items-center gap-1.5 px-3 py-2 border font-display text-sm transition-all active:scale-95',
              selectedWinners.has(player.id)
                ? 'border-accent-amber bg-accent-amber/20 text-accent-amber font-bold'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:border-accent-amber/50',
            ]"
            @click="toggleWinner(player.id)"
          >
            <Icon
              :icon="selectedWinners.has(player.id) ? 'lucide:check-circle' : 'lucide:circle'"
              class="size-4"
            />
            {{ player.name }}
            <span class="text-xs text-text-dim font-body"
              >({{ player.chips.toLocaleString() }})</span
            >
          </button>
        </div>

        <div class="flex gap-2">
          <button
            :disabled="selectedWinners.size === 0"
            class="flex-1 py-2.5 border border-accent-amber bg-accent-amber/20 text-accent-amber font-display font-bold text-sm hover:bg-accent-amber/30 transition-colors active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="confirmWinners"
          >
            <Icon icon="lucide:trophy" class="size-4" />
            {{ selectedWinners.size > 1 ? 'Chia pot' : 'Xác nhận thắng' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── SHOWDOWN: Results (after winner selected) ── -->
    <div
      v-else-if="state.phase === 'showdown' && state.winners.length > 0"
      class="bg-bg-surface border-t border-border-default px-3 py-2 flex-shrink-0"
    >
      <div class="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
        <div
          v-for="winner in state.winners"
          :key="winner.playerId"
          class="flex items-center gap-1 bg-bg-elevated border border-accent-amber/30 px-2 py-1"
        >
          <Icon icon="lucide:trophy" class="size-3 text-accent-amber shrink-0" />
          <span class="text-text-primary font-body text-xs font-medium">{{
            winner.playerName
          }}</span>
          <span class="text-accent-amber font-display text-xs font-bold"
            >+{{ winner.amount.toLocaleString() }}</span
          >
        </div>
      </div>

      <div class="flex gap-2">
        <button
          class="flex-1 py-2 border border-accent-coral/60 bg-accent-coral/10 text-accent-coral font-display font-semibold text-sm hover:bg-accent-coral/20 transition-colors active:scale-95 flex items-center justify-center gap-1"
          @click="handleNewHand"
        >
          <Icon icon="lucide:refresh-cw" class="size-3.5" />
          Ván tiếp
        </button>
        <button
          class="py-2 px-3 border border-border-default text-text-dim font-display text-xs hover:border-accent-coral hover:text-accent-coral transition-colors active:scale-95"
          @click="emit('leave')"
        >
          Rời bàn
        </button>
      </div>
    </div>

    <!-- ── BETTING CONTROLS ── -->
    <template v-else-if="isInBettingPhase && activePlayer">
      <div class="bg-bg-elevated/50 border-t border-border-default px-3 py-1.5 flex-shrink-0">
        <div class="flex items-center justify-center gap-2 text-sm font-display">
          <Icon icon="lucide:user" class="size-4 text-accent-amber" />
          <span class="text-accent-amber font-bold">{{ activePlayer.name }}</span>
          <span class="text-text-dim font-body text-xs">— Lượt của bạn</span>
        </div>
      </div>
      <BettingControls
        :player="activePlayer"
        :state="state"
        class="flex-shrink-0"
        @action="handleAction"
      />
    </template>
  </div>
</template>
