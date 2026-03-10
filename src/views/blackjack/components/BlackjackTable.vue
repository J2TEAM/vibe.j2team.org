<script setup lang="ts">
import PlayingCard from "./PlayingCard.vue";
import type { Player, Dealer, GameStatus, Card } from "../types/blackjack";

const props = defineProps<{
  player: Player;
  dealer: Dealer;
  status: GameStatus;
  message: string;
  isSoundEnabled: boolean;
  getScoreDisplay: (hand: Card[]) => string;
}>();

const emit = defineEmits<{
  (e: "toggle-sound"): void;
}>();

const getHandResult = (hIdx: number) => {
  if (props.status !== "ended") return null;
  const pScore = props.player.scores[hIdx];
  if (pScore === undefined) return null;
  
  const dScore = props.dealer.score;
  if (pScore > 21) return "QUÁ 21";
  if (dScore > 21 || pScore > dScore) return "THẮNG";
  if (pScore === dScore) return "HÒA";
  return "THUA";
};

// CSS class for result labels
const getResultClass = (res: string | null) => {
  if (!res) return "";
  switch (res) {
    case "THẮNG":
    case "BLACKJACK":
      return "bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]";
    case "THUA":
      return "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]";
    case "HÒA":
    case "QUÁ 21":
      return "bg-amber-500 text-bg-deep shadow-[0_0_20px_rgba(245,158,11,0.4)]";
    default:
      return "bg-accent-coral text-bg-deep shadow-[0_0_20px_rgba(255,107,74,0.3)]";
  }
};
</script>

<template>
  <div
    class="relative w-full flex flex-col items-center select-none font-body py-1 animate-fade-up"
  >
    <!-- Table Container - Fixed Content Area -->
    <div
      class="relative w-full h-95 sm:h-120 bg-bg-surface border-2 border-border-default shadow-[8px_8px_0_rgba(255,107,74,0.1)] overflow-hidden shrink-0 flex flex-col justify-between py-6"
    >
      <!-- Sound Toggle Button - Top Left -->
      <button
        @click="emit('toggle-sound')"
        class="absolute top-3 left-3 z-50 p-2 bg-bg-deep/40 hover:bg-bg-deep/60 border border-border-default/50 transition-all rounded shadow-lg group"
        title="Bật/Tắt âm thanh"
      >
        <span
          v-if="isSoundEnabled"
          class="text-accent-coral text-xs sm:text-sm animate-pulse group-hover:scale-110 block transition-transform"
          >🔊</span
        >
        <span
          v-else
          class="text-text-dim text-xs sm:text-sm grayscale block group-hover:scale-110 transition-transform"
          >🔇</span
        >
      </button>

      <!-- Background Text Decoration -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <h2
          class="font-display text-[15vw] font-black italic tracking-tighter uppercase leading-none select-none opacity-[0.03]"
        >
          J2TEAM
        </h2>
      </div>

      <!-- Dealer Area (Top Fixed) -->
      <div class="relative flex flex-col items-center z-20 min-h-35">
        <!-- Score Badge -->
        <div class="mb-4 flex flex-col items-center">
          <div
            v-if="status !== 'betting'"
            class="bg-bg-deep border border-accent-coral/30 px-4 py-1 flex items-center shadow-xl"
          >
            <span
              class="text-text-primary font-display font-black text-xs sm:text-sm tracking-[0.2em]"
            >
              {{ getScoreDisplay(dealer.hand.filter((c) => c.isFaceUp)) }}
            </span>
          </div>
        </div>

        <!-- Dealer Cards Container -->
        <div class="relative h-24 sm:h-28 flex justify-center w-full px-10">
          <div class="flex -space-x-10 sm:-space-x-12">
            <PlayingCard v-for="(card, index) in dealer.hand" :key="'d' + index" :card="card" />
          </div>
        </div>
      </div>

      <!-- Center Message Divider (Visual Only) -->
      <div
        class="relative h-px w-full max-w-xs mx-auto bg-linear-to-r from-transparent via-border-default to-transparent z-10 opacity-50 my-2"
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-accent-coral rotate-45 border border-bg-deep"></div>
        </div>
      </div>

      <!-- Player Hands Area (Bottom Fixed) -->
      <div class="relative min-h-50 flex justify-center items-end gap-4 sm:gap-12 z-20 px-4">
        <div
          v-for="(hand, hIdx) in player.hands"
          :key="hIdx"
          class="relative flex flex-col items-center min-w-25 h-full justify-end"
        >
          <!-- Unified Info & Result Badge (ABOVE CARDS - Moved Higher) -->
          <div
            class="absolute bottom-36.25 sm:bottom-42.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30 w-full"
          >
            <!-- Result Label -->
            <transition name="fade-pop">
              <div
                v-if="status === 'ended'"
                class="px-4 py-1 font-display font-black text-[10px] sm:text-[11px] tracking-[0.2em] whitespace-nowrap uppercase"
                :class="getResultClass(getHandResult(hIdx))"
              >
                {{ getHandResult(hIdx) }}
              </div>
            </transition>

            <!-- Current Hand Indicator -->
            <div
              v-if="hIdx === player.currentHandIndex && status === 'playing'"
              class="text-accent-coral animate-bounce text-xs font-black"
            >
              ▼
            </div>

            <!-- Score Badge -->
            <div
              v-if="status !== 'betting'"
              class="bg-bg-deep border border-accent-coral/30 px-5 py-1.5 flex flex-col items-center shadow-2xl"
            >
              <span
                class="text-text-primary font-display font-black text-xs sm:text-base tracking-widest"
              >
                {{ getScoreDisplay(hand) }}
              </span>
            </div>
          </div>

          <!-- Player Cards Container -->
          <div
            class="flex -space-x-10 sm:-space-x-12 h-24 sm:h-28 transition-all duration-300 mb-2"
            :class="{
              'opacity-100 scale-105': hIdx === player.currentHandIndex || status !== 'playing',
              'opacity-30 grayscale-[0.8] scale-95':
                hIdx !== player.currentHandIndex && status === 'playing',
            }"
          >
            <PlayingCard v-for="(card, cIdx) in hand" :key="cIdx" :card="card" />
          </div>

          <!-- Bet Amount (BELOW CARDS) -->
          <div v-if="status !== 'betting'" class="h-8 flex flex-col items-center justify-start">
            <div
              v-if="status === 'playing' || status === 'ended'"
              class="bg-bg-deep/60 px-2 py-0.5 border border-accent-amber/20 shadow-lg"
            >
              <span
                class="text-[9px] sm:text-[10px] font-black text-accent-amber tracking-tighter uppercase whitespace-nowrap"
              >
                Cược: ${{ player.bets[hIdx] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-pop-enter-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.fade-pop-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.8);
}

/* Ensure card containers don't shrink */
.min-w-25 {
  min-width: 100px;
}
@media (min-width: 640px) {
  .min-w-25 {
    min-width: 140px;
  }
}
</style>
