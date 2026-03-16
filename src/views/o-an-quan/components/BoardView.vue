<script setup lang="ts">
/**
 * BoardView — Bàn cờ Ô Ăn Quan
 * Layout: hình chữ nhật ngang
 *   - 2 ô quan ở 2 đầu (bán nguyệt lớn)
 *   - 5 ô dân phía trên (máy: 11, 10, 9, 8, 7 — hiện ngược)
 *   - 5 ô dân phía dưới (người: 1, 2, 3, 4, 5)
 */
import { computed } from 'vue'
import type { CellIndex, Direction, GamePhase } from '../composables/useOAnQuan'

const props = defineProps<{
  board: number[]
  gamePhase: GamePhase
  currentPlayer: 'human' | 'computer'
  highlightedCell: CellIndex | null
  lastCapturedCells: CellIndex[]
  selectedCell: CellIndex | null
  quanLeft: number
  quanRight: number
  isPlayableCell: (index: CellIndex) => boolean
}>()

const emit = defineEmits<{
  (e: 'select-cell', cellIndex: CellIndex, direction: Direction): void
}>()

// Dân phía trên (máy): hiển thị từ phải sang trái (11→7)
const topRow = computed(() => [11, 10, 9, 8, 7])
// Dân phía dưới (người): hiển thị từ trái sang phải (1→5)
const bottomRow = computed(() => [1, 2, 3, 4, 5])

/** Tạo biểu diễn quân trong ô (hiệu ứng scatter) */
function getStonesDisplay(count: number): { size: string; opacity: string }[] {
  if (count === 0) return []
  const display = []
  const showCount = Math.min(count, 12) // Tối đa hiện 12 viên
  for (let i = 0; i < showCount; i++) {
    display.push({
      size: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
      opacity: i < 5 ? 'opacity-100' : i < 10 ? 'opacity-70' : 'opacity-50',
    })
  }
  return display
}

/** Kiểm tra ô có đang bị capture (hiệu ứng flash) */
function isCaptured(index: CellIndex): boolean {
  return props.lastCapturedCells.includes(index)
}

/** Xử lý click vào ô dân (người chơi) */
function handleCellClick(cellIndex: CellIndex) {
  if (!props.isPlayableCell(cellIndex)) return
  // Mặc định đi sang phải, sẽ confirm hướng bằng DirectionPicker
  emit('select-cell', cellIndex, 'right')
}
</script>

<template>
  <section class="mb-8 animate-fade-up animate-delay-4">
    <!-- Bàn cờ chính -->
    <div class="border-2 border-border-default bg-bg-surface p-3 sm:p-4">
      <!-- Nhãn phía máy -->
      <div class="flex items-center justify-center gap-2 mb-2">
        <span class="text-accent-sky text-xs font-display tracking-widest">MÁY</span>
        <div class="flex-1 h-px bg-border-default" />
      </div>

      <!-- Layout bàn cờ -->
      <div class="flex items-stretch gap-2 sm:gap-3">
        <!-- Ô Quan TRÁI (index 0) -->
        <div
          class="flex-shrink-0 w-16 sm:w-20 flex flex-col items-center justify-center border-2 rounded-full transition-all duration-300"
          :class="[
            highlightedCell === quanLeft
              ? 'border-accent-amber bg-accent-amber/10 scale-105'
              : isCaptured(quanLeft)
                ? 'border-accent-coral bg-accent-coral/10 animate-pulse'
                : 'border-accent-amber/30 bg-bg-elevated',
          ]"
        >
          <div class="text-accent-amber text-[10px] font-display tracking-wide mb-1">QUAN</div>
          <div
            class="font-display text-2xl sm:text-3xl font-bold tabular-nums transition-all"
            :class="(board[quanLeft] ?? 0) > 0 ? 'text-accent-amber' : 'text-text-dim'"
          >
            {{ board[quanLeft] ?? 0 }}
          </div>
          <!-- Biểu diễn quân -->
          <div class="flex flex-wrap justify-center gap-0.5 mt-1 max-w-12">
            <span
              v-for="(stone, si) in getStonesDisplay(board[quanLeft] ?? 0)"
              :key="si"
              class="rounded-full bg-accent-amber"
              :class="[stone.size, stone.opacity]"
            />
          </div>
        </div>

        <!-- Cột giữa: 2 hàng 5 ô dân -->
        <div class="flex-1 flex flex-col gap-2 sm:gap-3">
          <!-- Hàng trên: ô máy (11→7) -->
          <div class="grid grid-cols-5 gap-1.5 sm:gap-2">
            <div
              v-for="cellIdx in topRow"
              :key="cellIdx"
              class="relative aspect-square border flex flex-col items-center justify-center transition-all duration-300 cursor-default"
              :class="[
                highlightedCell === cellIdx
                  ? 'border-accent-sky bg-accent-sky/10 scale-105 z-10'
                  : isCaptured(cellIdx)
                    ? 'border-accent-coral bg-accent-coral/10 animate-pulse'
                    : 'border-border-default bg-bg-elevated hover:bg-bg-elevated/80',
              ]"
            >
              <!-- Số quân -->
              <div
                class="font-display text-lg sm:text-xl font-bold tabular-nums"
                :class="(board[cellIdx] ?? 0) > 0 ? 'text-accent-sky' : 'text-text-dim'"
              >
                {{ board[cellIdx] ?? 0 }}
              </div>
              <!-- Viên quân nhỏ -->
              <div class="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-10">
                <span
                  v-for="(stone, si) in getStonesDisplay(board[cellIdx] ?? 0).slice(0, 5)"
                  :key="si"
                  class="rounded-full bg-accent-sky/60"
                  :class="stone.size"
                />
              </div>
              <!-- Chỉ số ô -->
              <span class="absolute bottom-0.5 right-1 text-[9px] text-text-dim font-mono">
                {{ cellIdx }}
              </span>
            </div>
          </div>

          <!-- Đường phân cách giữa -->
          <div class="h-px bg-border-default/50" />

          <!-- Hàng dưới: ô người chơi (1→5) -->
          <div class="grid grid-cols-5 gap-1.5 sm:gap-2">
            <div
              v-for="cellIdx in bottomRow"
              :key="cellIdx"
              class="relative aspect-square border flex flex-col items-center justify-center transition-all duration-300"
              :class="[
                selectedCell === cellIdx
                  ? 'border-accent-coral bg-accent-coral/15 scale-105 z-10 ring-2 ring-accent-coral/30'
                  : highlightedCell === cellIdx
                    ? 'border-accent-coral bg-accent-coral/10 scale-105 z-10'
                    : isCaptured(cellIdx)
                      ? 'border-accent-coral bg-accent-coral/10 animate-pulse'
                      : isPlayableCell(cellIdx)
                        ? 'border-border-default bg-bg-elevated hover:border-accent-coral/50 hover:bg-bg-elevated/80 cursor-pointer'
                        : 'border-border-default bg-bg-elevated opacity-60',
              ]"
              @click="handleCellClick(cellIdx)"
            >
              <!-- Số quân -->
              <div
                class="font-display text-lg sm:text-xl font-bold tabular-nums"
                :class="(board[cellIdx] ?? 0) > 0 ? 'text-accent-coral' : 'text-text-dim'"
              >
                {{ board[cellIdx] ?? 0 }}
              </div>
              <!-- Viên quân nhỏ -->
              <div class="flex flex-wrap justify-center gap-0.5 mt-0.5 max-w-10">
                <span
                  v-for="(stone, si) in getStonesDisplay(board[cellIdx] ?? 0).slice(0, 5)"
                  :key="si"
                  class="rounded-full bg-accent-coral/60"
                  :class="stone.size"
                />
              </div>
              <!-- Chỉ số ô -->
              <span class="absolute bottom-0.5 right-1 text-[9px] text-text-dim font-mono">
                {{ cellIdx }}
              </span>
            </div>
          </div>
        </div>

        <!-- Ô Quan PHẢI (index 6) -->
        <div
          class="flex-shrink-0 w-16 sm:w-20 flex flex-col items-center justify-center border-2 rounded-full transition-all duration-300"
          :class="[
            highlightedCell === quanRight
              ? 'border-accent-amber bg-accent-amber/10 scale-105'
              : isCaptured(quanRight)
                ? 'border-accent-coral bg-accent-coral/10 animate-pulse'
                : 'border-accent-amber/30 bg-bg-elevated',
          ]"
        >
          <div class="text-accent-amber text-[10px] font-display tracking-wide mb-1">QUAN</div>
          <div
            class="font-display text-2xl sm:text-3xl font-bold tabular-nums transition-all"
            :class="(board[quanRight] ?? 0) > 0 ? 'text-accent-amber' : 'text-text-dim'"
          >
            {{ board[quanRight] ?? 0 }}
          </div>
          <div class="flex flex-wrap justify-center gap-0.5 mt-1 max-w-12">
            <span
              v-for="(stone, si) in getStonesDisplay(board[quanRight] ?? 0)"
              :key="si"
              class="rounded-full bg-accent-amber"
              :class="[stone.size, stone.opacity]"
            />
          </div>
        </div>
      </div>

      <!-- Nhãn phía người chơi -->
      <div class="flex items-center justify-center gap-2 mt-2">
        <div class="flex-1 h-px bg-border-default" />
        <span class="text-accent-coral text-xs font-display tracking-widest">BẠN</span>
      </div>
    </div>
  </section>
</template>
