<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useEventListener } from '@vueuse/core'
import Onboard from './components/Onboard.vue'
import Board from './components/Board.vue'
import ShipDock from './components/ShipDock.vue'
import { useBattleship } from './composables/useBattleship'
import { SHIPS } from './utils/ship'

const game = useBattleship()

useEventListener('keydown', (e: KeyboardEvent) => {
  if (game.phase === 'placement' && (e.key === 'r' || e.key === 'R')) {
    e.preventDefault()
    if (game.selectedPlacementIndex !== null) {
      game.rotateSelectedShip()
    } else {
      game.cycleShipRotation()
    }
  }
})

function handlePlaceCell(r: number, c: number, shipIndex?: number) {
  game.placePlayerShip(r, c, shipIndex)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden">
    <div class="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Trang chủ
      </RouterLink>

      <Onboard v-if="game.phase === 'onboard'" @start="game.setPhase('placement')" />

      <div
        v-if="game.phase === 'placement'"
        class="mt-12 space-y-6 animate-fade-up animate-delay-1"
      >
        <h2
          class="font-display text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Đặt tàu của bạn
        </h2>
        <p class="text-text-secondary text-sm leading-relaxed">
          Kéo thả tàu vào bảng, kéo tàu trên bảng để di chuyển, hoặc kéo về ô trái để gỡ. Click tàu
          trên bảng (viền đỏ) rồi nhấn
          <kbd class="px-1.5 py-0.5 border border-border-default bg-bg-elevated font-mono text-xs"
            >R</kbd
          >
          để xoay. Không chọn tàu thì R xoay tàu ở ô bên trái
          {{
            game.placements.length < SHIPS.length
              ? `(${game.placements.length}/${SHIPS.length})`
              : ''
          }}
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-accent-sky bg-bg-surface px-4 py-2 text-sm font-display font-semibold text-accent-sky transition hover:border-accent-sky hover:bg-accent-sky/10"
            @click="game.randomPlacePlayerShips"
          >
            <Icon icon="lucide:shuffle" class="size-4" />
            Sắp xếp ngẫu nhiên
          </button>
        </div>
        <div class="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start w-full">
          <ShipDock
            :placed-ship-indices="game.placedShipIndices"
            :rotation="game.shipRotation"
            :droppable="game.placements.length > 0"
            @remove="game.removeShipAt"
          />
          <div class="w-full min-w-0 overflow-x-auto">
            <Board
              :board="game.playerBoard"
              clickable
              droppable
              removable
              :selected-placement="game.selectedPlacement"
              @cell="handlePlaceCell"
              @select="game.selectPlacementAt"
              @move="game.moveShip"
            />
          </div>
        </div>
        <button
          v-if="game.allShipsPlaced()"
          class="border border-accent-coral bg-accent-coral px-6 py-3 text-bg-deep font-display font-bold text-sm tracking-widest transition hover:bg-accent-coral/90 hover:-translate-y-0.5"
          @click="game.startGame"
        >
          Bắt đầu chiến đấu
        </button>
      </div>

      <div
        v-if="game.phase === 'battle' || game.phase === 'victory' || game.phase === 'defeat'"
        class="mt-12 space-y-8 animate-fade-up animate-delay-1"
      >
        <div
          v-if="game.phase === 'victory'"
          class="border border-accent-coral bg-accent-coral/10 p-4 sm:p-6 text-center"
        >
          <h2 class="font-display text-2xl font-bold text-accent-coral">Bạn thắng!</h2>
          <p class="mt-2 text-text-secondary">Đã tiêu diệt hết tàu đối thủ</p>
        </div>
        <div
          v-else-if="game.phase === 'defeat'"
          class="border border-accent-coral bg-accent-coral/10 p-4 sm:p-6 text-center"
        >
          <h2 class="font-display text-2xl font-bold text-accent-coral">Bạn thua</h2>
          <p class="mt-2 text-text-secondary">Đối thủ đã tiêu diệt hết tàu của bạn</p>
        </div>
        <h2
          v-else
          class="font-display text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Chiến trường
        </h2>
        <p v-if="game.phase === 'battle'" class="text-text-dim text-sm">
          Trúng tàu → tiếp tục bắn. Trượt → tới lượt đối thủ
        </p>
        <p
          v-if="game.phase === 'battle'"
          class="text-accent-amber font-display font-semibold text-base sm:text-lg"
        >
          {{ game.message }}
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div
            class="border border-border-default bg-bg-surface p-4 sm:p-6 transition-all duration-300 hover:border-accent-amber hover:bg-bg-elevated min-w-0 overflow-x-auto"
          >
            <h3 class="font-display text-lg font-semibold mb-4 text-text-primary">Bạn</h3>
            <Board :board="game.playerBoard" />
          </div>
          <div
            class="border border-border-default bg-bg-surface p-4 sm:p-6 transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated min-w-0 overflow-x-auto"
          >
            <h3 class="font-display text-lg font-semibold mb-4 text-text-primary">Đối thủ</h3>
            <Board
              :board="game.enemyBoard"
              :clickable="game.phase === 'battle'"
              hide-ships
              attack-mode
              @cell="game.playerAttack"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
