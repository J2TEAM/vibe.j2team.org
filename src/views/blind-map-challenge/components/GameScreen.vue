<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import type { GameConfig, Province } from '../types'
import { provinces as allProvinces } from '../data/provinces'
import { useGameLogic } from '../composables/useGameLogic'
import VietnamMap from './VietnamMap.vue'
import ProvinceList from './ProvinceList.vue'
import ScoreBoard from './ScoreBoard.vue'
import ProvinceInfoPopup from './ProvinceInfoPopup.vue'

const props = defineProps<{
  config: GameConfig
}>()

const emit = defineEmits<{
  (e: 'game-over'): void
  (e: 'back-to-start'): void
}>()

const game = useGameLogic()

// Province info popup state
const popupProvince = ref<Province | null>(null)
const popupX = ref(0)
const popupY = ref(0)
const showPopup = ref(false)

// Confirm give-up dialog
const showGiveUpDialog = ref(false)

const hasTimeLimit = computed(() => {
  const d = props.config.difficulty
  return d === 'medium' || d === 'hard' || d === 'expert' || props.config.mode === 'time-attack'
})

// Start the game
game.startGame(props.config)

// Watch for timer expiry
const timerCheck = setInterval(() => {
  if (game.checkTimerExpired()) {
    emit('game-over')
  }
}, 500)

onUnmounted(() => {
  clearInterval(timerCheck)
  game.timer.stop()
})

// Watch for win
watch(() => game.isWon.value, (won) => {
  if (won) {
    setTimeout(() => emit('game-over'), 800)
  }
})

// Handle province drop on map
function handleDrop(provinceId: string, svgPathId: string) {
  game.placeProvince(provinceId, svgPathId)
}

// Handle click on map (click-to-place)
function handleMapClick(svgPathId: string) {
  if (game.selectedProvinceId.value) {
    game.placeProvince(game.selectedProvinceId.value, svgPathId)
  }

  // Show popup for correctly placed provinces
  const province = allProvinces.find(p => p.svgPathId === svgPathId)
  if (province) {
    const placed = game.placedProvinces.value.get(province.id)
    if (placed && placed.status === 'correct') {
      popupProvince.value = province
      showPopup.value = true
      // Get mouse position from the last event
      setTimeout(() => { showPopup.value = false }, 3000)
    }
  }
}

// Handle province selection from list
function handleSelectProvince(id: string) {
  if (game.selectedProvinceId.value === id) {
    game.selectProvince(null)
  } else {
    game.selectProvince(id)
  }
}

function handleDragStart(id: string) {
  game.selectProvince(id)
}

function handleHint() {
  game.useHint()
}

function handleGiveUp() {
  showGiveUpDialog.value = true
}

function confirmGiveUp() {
  showGiveUpDialog.value = false
  game.giveUp()
  emit('game-over')
}

// Track mouse for popup positioning
function onMouseMove(e: MouseEvent) {
  popupX.value = e.clientX
  popupY.value = e.clientY
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col"
    @mousemove="onMouseMove"
  >
    <!-- Header -->
    <header class="border-b border-border-default px-4 py-2 flex items-center justify-between
                   shrink-0">
      <button
        class="text-sm text-text-secondary hover:text-text-primary transition-colors"
        @click="emit('back-to-start')"
      >
        &larr; Quay lại
      </button>
      <div class="flex items-center gap-3">
        <span class="font-display text-sm tracking-wide text-accent-coral">🗺️ BLIND MAP</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="border border-border-default p-1.5 text-sm transition-colors
                 hover:border-accent-sky hover:text-accent-sky"
          :title="game.soundEnabled.value ? 'Tắt âm thanh' : 'Bật âm thanh'"
          @click="game.toggleSound()"
        >
          {{ game.soundEnabled.value ? '🔊' : '🔇' }}
        </button>
      </div>
    </header>

    <!-- Score board -->
    <div class="border-b border-border-default px-4 py-2 shrink-0">
      <ScoreBoard
        :display-time="game.timer.displayTime.value"
        :correct-count="game.correctCount.value"
        :total-provinces="game.totalProvinces.value"
        :score="game.score.value"
        :progress-percent="game.progressPercent.value"
        :has-time-limit="hasTimeLimit"
      />
    </div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
      <!-- Map area -->
      <div class="flex-1 p-2 md:p-4 min-h-0"
           :class="{ 'opacity-50': config.difficulty === 'expert' }">
        <VietnamMap
          :game-provinces="game.gameProvinces.value"
          :placed-provinces="game.placedProvinces.value"
          :selected-province-id="game.selectedProvinceId.value"
          :hinted-province-id="game.hintedProvinceId.value"
          :wrong-province-id="game.wrongProvinceId.value"
          :difficulty="config.difficulty"
          @drop="handleDrop"
          @click-province="handleMapClick"
        />
      </div>

      <!-- Province list sidebar -->
      <div class="md:w-72 lg:w-80 border-t md:border-t-0 md:border-l border-border-default
                  p-3 md:p-4 shrink-0 overflow-hidden">
        <ProvinceList
          :provinces="game.remainingProvinces.value"
          :selected-province-id="game.selectedProvinceId.value"
          :difficulty="config.difficulty"
          @select="handleSelectProvince"
          @drag-start="handleDragStart"
        />
      </div>
    </div>

    <!-- Bottom actions -->
    <div class="border-t border-border-default px-4 py-3 flex items-center justify-center gap-4
                shrink-0">
      <button
        class="border border-accent-sky bg-bg-surface px-4 py-2 text-sm font-display
               text-accent-sky transition-all duration-200
               hover:bg-bg-elevated hover:border-accent-sky/80
               disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="game.remainingProvinces.value.length === 0"
        @click="handleHint"
      >
        💡 Gợi ý <span class="text-text-dim">-5đ</span>
      </button>
      <button
        class="border border-accent-coral bg-bg-surface px-4 py-2 text-sm font-display
               text-accent-coral transition-all duration-200
               hover:bg-bg-elevated hover:border-accent-coral/80"
        @click="handleGiveUp"
      >
        🏳️ Bỏ cuộc
      </button>
    </div>

    <!-- Province info popup -->
    <ProvinceInfoPopup
      :province="popupProvince"
      :x="popupX"
      :y="popupY"
      :visible="showPopup"
    />

    <!-- Give up confirmation dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showGiveUpDialog"
          class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80
                 backdrop-blur-sm"
          @click.self="showGiveUpDialog = false"
        >
          <div class="border border-border-default bg-bg-surface p-6 max-w-sm mx-4
                      animate-fade-up">
            <h3 class="font-display text-xl font-bold text-accent-coral mb-3">
              🏳️ Bỏ cuộc?
            </h3>
            <p class="text-text-secondary text-sm mb-6">
              Bạn chắc chắn muốn bỏ cuộc? Các tỉnh chưa gắn sẽ được tính là sai.
            </p>
            <div class="flex gap-3">
              <button
                class="flex-1 border border-border-default bg-bg-elevated py-2 text-sm
                       font-display transition hover:border-text-dim"
                @click="showGiveUpDialog = false"
              >
                Tiếp tục chơi
              </button>
              <button
                class="flex-1 bg-accent-coral text-bg-deep py-2 text-sm font-display
                       font-bold transition hover:bg-accent-amber"
                @click="confirmGiveUp"
              >
                Bỏ cuộc
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
