<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import type { GameState, PlayerAction, Card } from '../types'
import PlayerSeat from './PlayerSeat.vue'
import PlayingCard from './PlayingCard.vue'
import BettingControls from './BettingControls.vue'

const props = defineProps<{
  state: GameState
  localPlayerId: string
  isMyTurn: boolean
}>()

const emit = defineEmits<{
  action: [action: PlayerAction]
  newHand: []
  leave: []
}>()

const isMobile = useMediaQuery('(max-width: 640px)')
const showHistory = ref(false)

const localPlayer = computed(() => props.state.players.find((p) => p.id === props.localPlayerId))

const opponents = computed(() => props.state.players.filter((p) => p.id !== props.localPlayerId))

const phaseLabel = computed(() => {
  switch (props.state.phase) {
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

const waitingMessage = computed(() => {
  const active = props.state.players[props.state.activePlayerIndex]
  if (!active || props.state.phase === 'showdown' || props.state.phase === 'waiting') return null
  if (active.isBot) return `${active.name} đang suy nghĩ...`
  return null
})

function getBlindRole(playerId: string): 'sb' | 'bb' | null {
  if (props.state.phase === 'waiting') return null
  const players = props.state.players
  const count = players.length
  const di = props.state.dealerIndex
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

const SEAT_POSITIONS: [string, string][] = [
  ['50%', '86%'],
  ['82%', '68%'],
  ['84%', '26%'],
  ['50%', '8%'],
  ['16%', '26%'],
  ['18%', '68%'],
]

const orderedPlayers = computed(() => {
  const localIdx = props.state.players.findIndex((p) => p.id === props.localPlayerId)
  if (localIdx === -1) return props.state.players.map((p, i) => ({ player: p, posIndex: i }))
  return props.state.players.map((p, i) => {
    const offset = (i - localIdx + props.state.players.length) % props.state.players.length
    return { player: p, posIndex: offset }
  })
})

function seatPosition(posIndex: number): { left: string; top: string; transform: string } {
  const pos = SEAT_POSITIONS[posIndex]
  if (!pos) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  return { left: pos[0], top: pos[1], transform: 'translate(-50%, -50%)' }
}

const showCommunityCards = computed(
  () => props.state.phase !== 'waiting' && props.state.phase !== 'pre-flop',
)

const communityCardSlots = computed((): (Card | null)[] => {
  const slots: (Card | null)[] = [null, null, null, null, null]
  for (let i = 0; i < 5; i++) slots[i] = props.state.communityCards[i] ?? null
  return slots
})

const isPlayerActive = (playerId: string) =>
  props.state.players.findIndex((p) => p.id === playerId) === props.state.activePlayerIndex &&
  props.state.phase !== 'waiting' &&
  props.state.phase !== 'showdown'

const isPlayerDealer = (playerId: string) =>
  props.state.players.findIndex((p) => p.id === playerId) === props.state.dealerIndex
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
        <button
          class="text-text-dim/60 hover:text-accent-sky transition-colors"
          title="Lịch sử"
          @click="showHistory = !showHistory"
        >
          <Icon icon="lucide:scroll-text" class="size-4" />
        </button>
        <a
          href="https://github.com/Xernnn"
          target="_blank"
          rel="noopener noreferrer"
          class="text-text-dim/40 text-xs font-body hover:text-accent-coral transition-colors"
          >Xern</a
        >
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         MOBILE LAYOUT
    ═══════════════════════════════════════════ -->
    <template v-if="isMobile">
      <div class="flex flex-col flex-1 min-h-0 relative">
        <!-- Opponents -->
        <div
          class="flex gap-1.5 overflow-x-auto px-2 py-1.5 border-b border-border-default bg-bg-surface/40 flex-shrink-0"
        >
          <PlayerSeat
            v-for="opponent in opponents"
            :key="opponent.id"
            :player="opponent"
            :is-active="isPlayerActive(opponent.id)"
            :is-dealer="isPlayerDealer(opponent.id)"
            :blind-role="getBlindRole(opponent.id)"
            :phase="state.phase"
            :is-local-player="false"
          />
        </div>

        <!-- Community cards + pot -->
        <div class="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-2 min-h-0">
          <div v-if="showCommunityCards" class="flex gap-1.5 flex-wrap justify-center">
            <PlayingCard
              v-for="(card, i) in communityCardSlots"
              :key="i"
              :card="card"
              :face-down="!card"
            />
          </div>
          <div
            v-else-if="state.phase === 'pre-flop'"
            class="text-text-dim text-xs font-body italic"
          >
            Chờ flop...
          </div>

          <div
            v-if="state.phase !== 'waiting'"
            class="flex items-center gap-1.5 bg-bg-elevated border border-border-default px-3 py-1.5"
          >
            <Icon icon="lucide:circle-dollar-sign" class="size-4 text-accent-amber" />
            <span class="text-accent-amber font-display font-bold text-base">{{
              state.pot.toLocaleString()
            }}</span>
          </div>

          <div
            v-if="state.lastActionText"
            class="text-text-dim text-xs font-body italic text-center"
          >
            {{ state.lastActionText }}
          </div>
        </div>

        <!-- Local player -->
        <div
          v-if="localPlayer"
          class="flex justify-center px-3 py-1.5 border-t border-border-default flex-shrink-0"
        >
          <PlayerSeat
            :player="localPlayer"
            :is-active="isPlayerActive(localPlayer.id)"
            :is-dealer="isPlayerDealer(localPlayer.id)"
            :blind-role="getBlindRole(localPlayer.id)"
            :phase="state.phase"
            :is-local-player="true"
          />
        </div>

        <!-- History overlay (mobile) -->
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
          <div v-if="showCommunityCards" class="flex gap-1.5">
            <PlayingCard
              v-for="(card, i) in communityCardSlots"
              :key="i"
              :card="card"
              :face-down="!card"
            />
          </div>

          <div
            v-if="state.phase !== 'waiting'"
            class="flex items-center gap-1.5 bg-bg-elevated/90 border border-border-default px-3 py-1"
          >
            <Icon icon="lucide:circle-dollar-sign" class="size-4 text-accent-amber" />
            <span class="text-accent-amber font-display text-sm font-bold">{{
              state.pot.toLocaleString()
            }}</span>
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
          v-for="{ player, posIndex } in orderedPlayers"
          :key="player.id"
          :player="player"
          :is-active="isPlayerActive(player.id)"
          :is-dealer="isPlayerDealer(player.id)"
          :blind-role="getBlindRole(player.id)"
          :phase="state.phase"
          :is-local-player="player.id === localPlayerId"
          class="absolute z-20"
          :style="seatPosition(posIndex)"
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

    <!-- ── SHOWDOWN ── -->
    <div
      v-if="state.phase === 'showdown' && state.winners.length > 0"
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
          <span
            v-if="winner.handResult"
            class="text-accent-sky text-xs font-body hidden sm:inline"
            >{{ winner.handResult.description }}</span
          >
          <span class="text-accent-amber font-display text-xs font-bold"
            >+{{ winner.amount.toLocaleString() }}</span
          >
        </div>
      </div>

      <div class="flex gap-2">
        <button
          class="flex-1 py-2 border border-accent-coral/60 bg-accent-coral/10 text-accent-coral font-display font-semibold text-sm hover:bg-accent-coral/20 transition-colors active:scale-95 flex items-center justify-center gap-1"
          @click="emit('newHand')"
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
    <BettingControls
      v-if="isMyTurn && localPlayer && state.phase !== 'showdown'"
      :player="localPlayer"
      :state="state"
      class="flex-shrink-0"
      @action="emit('action', $event)"
    />

    <!-- ── WAITING MESSAGE ── -->
    <div
      v-else-if="state.phase !== 'showdown' && state.phase !== 'waiting' && waitingMessage"
      class="flex items-center justify-center gap-2 px-3 py-2 bg-bg-surface border-t border-border-default text-text-dim text-xs font-body flex-shrink-0"
    >
      <Icon icon="lucide:loader-2" class="size-3.5 animate-spin" />
      {{ waitingMessage }}
    </div>
  </div>
</template>
