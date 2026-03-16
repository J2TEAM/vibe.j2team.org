<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Piece, BoardPosition } from '../types'
import { useGameStore } from '../composables/useGameState'
import GameBoard from './GameBoard.vue'
import PieceInventory from './PieceInventory.vue'
import ChallengeViewer from './ChallengeViewer.vue'
import { useEventListener } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

const gameStore = useGameStore()
const containerRef = ref<HTMLDivElement>()
const showRules = ref(false)
const activeTab = ref<'challenge' | 'board'>('challenge')

// Pointer-based drag state (to replace native HTML5 drag)
const dragPointer = ref<{ clientX: number; clientY: number } | null>(null)
const dragPointerOffset = ref<{ x: number; y: number } | null>(null)
const isPointerDragging = ref(false)
const boardHoverPosition = ref<BoardPosition | null>(null)
const isInventoryHover = ref(false)

// Keep focus within the app while dragging so key events are delivered.
watch(
  () => gameStore.dragState?.piece,
  (piece) => {
    if (!piece) return
    containerRef.value?.focus()
  },
)

// Global pointer move / up listeners while a custom drag is active
watch(isPointerDragging, (isDragging) => {
  if (!isDragging) return

  const handlePointerMove = (event: PointerEvent) => {
    dragPointer.value = { clientX: event.clientX, clientY: event.clientY }
  }

  const handlePointerUp = () => {
    isPointerDragging.value = false
    dragPointer.value = null
    dragPointerOffset.value = null

    const dragState = gameStore.dragState
    if (!dragState) return

    const { piece } = dragState

    if (boardHoverPosition.value) {
      handlePieceDrop(piece, boardHoverPosition.value)
    } else if (isInventoryHover.value) {
      handlePieceReturnToInventory(piece)
    } else {
      handleDragCancel()
    }
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)

  return () => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }
})

const handlePiecePickupFromInventory = (piece: Piece) => {
  gameStore.pickUpPiece(piece, 'inventory')
}

const handlePiecePickupFromBoard = (piece: Piece, position: BoardPosition) => {
  gameStore.pickUpPiece(piece, 'board', position)
}

const startPointerDragFromInventory = (
  piece: Piece,
  event: PointerEvent,
  pointerOffset: { x: number; y: number },
) => {
  event.preventDefault()
  event.stopPropagation()
  isPointerDragging.value = true
  dragPointer.value = { clientX: event.clientX, clientY: event.clientY }
  dragPointerOffset.value = pointerOffset
}

const startPointerDragFromBoard = (
  piece: Piece,
  position: BoardPosition,
  event: PointerEvent,
  pointerOffset: { x: number; y: number },
) => {
  event.preventDefault()
  event.stopPropagation()
  handlePiecePickupFromBoard(piece, position)
  isPointerDragging.value = true
  dragPointer.value = { clientX: event.clientX, clientY: event.clientY }
  dragPointerOffset.value = pointerOffset
}

const handlePieceDrop = (piece: Piece, position: BoardPosition) => {
  gameStore.dropPiece(position)
}

const handleDragCancel = () => {
  gameStore.cancelDrag()
}

const handlePieceReturnToInventory = (piece: Piece) => {
  gameStore.returnToInventory(piece)
}

const handleRotate = (pieceId: string, direction: 'clockwise' | 'counterclockwise') => {
  gameStore.rotatePiece(pieceId, direction)
}

const rotateCurrentlyDraggedPiece = (direction: 'clockwise' | 'counterclockwise') => {
  const currentId = gameStore.dragState?.piece.id
  if (!currentId) return
  handleRotate(currentId, direction)
}

const handleReset = () => {
  if (confirm('Đặt lại bảng? Tất cả mảnh đã đặt sẽ bị xóa.')) {
    gameStore.resetBoard()
  }
}

// Keyboard input for rotation during drag
useEventListener(
  document,
  'keydown',
  (event: KeyboardEvent) => {
    if (!gameStore.dragState?.piece) return

    const key = event.key.toLowerCase()
    if (key === 'q') {
      event.preventDefault()
      rotateCurrentlyDraggedPiece('counterclockwise')
    } else if (key === 'e') {
      event.preventDefault()
      rotateCurrentlyDraggedPiece('clockwise')
    }
  },
  { capture: true },
)

const openSolutions = () => {
  window.open('/digit-packing-puzzle/solutions.pdf', '_blank')
}
</script>

<template>
  <div ref="containerRef" class="h-screen overflow-hidden bg-bg-deep flex flex-col" tabindex="-1">
    <!-- Header -->
    <div
      class="flex items-center shrink-0 animate-fade-up px-4 py-3 border-b border-border-default lg:border-none lg:px-5 lg:pt-5 lg:pb-0 lg:mb-3"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-coral transition-colors duration-200 min-w-[40px] lg:min-w-[120px]"
      >
        <Icon icon="lucide:arrow-left" class="size-3.5 shrink-0" />
        <span class="hidden sm:inline">Về trang chủ</span>
      </RouterLink>
      <h1
        class="flex-1 text-center font-display text-lg lg:text-2xl font-bold text-accent-coral tracking-tight"
      >
        Xếp Hình Số
      </h1>
      <div class="min-w-[40px] lg:min-w-[120px]"></div>
    </div>

    <!-- Mobile tab bar -->
    <div class="lg:hidden flex shrink-0 bg-bg-surface border-b border-border-default">
      <button
        @click="activeTab = 'challenge'"
        class="flex-1 py-2.5 text-xs font-medium transition-colors duration-200"
        :class="
          activeTab === 'challenge'
            ? 'text-accent-coral border-b-2 border-accent-coral'
            : 'text-text-secondary'
        "
      >
        📄 Thử thách
      </button>
      <button
        @click="activeTab = 'board'"
        class="flex-1 py-2.5 text-xs font-medium transition-colors duration-200"
        :class="
          activeTab === 'board'
            ? 'text-accent-coral border-b-2 border-accent-coral'
            : 'text-text-secondary'
        "
      >
        🎮 Bảng chơi
      </button>
    </div>

    <!-- Mobile: Challenge tab -->
    <div v-if="activeTab === 'challenge'" class="lg:hidden flex-1 min-h-0 flex flex-col gap-2 p-3">
      <ChallengeViewer class="flex-1 min-h-0" />
      <div class="flex gap-2 shrink-0">
        <button
          @click="showRules = true"
          class="flex-1 px-2 py-2 text-xs font-semibold cursor-pointer text-white bg-bg-deep border border-accent-coral hover:bg-bg-elevated transition-all duration-200"
        >
          📖 Luật
        </button>
        <button
          @click="openSolutions"
          class="flex-1 px-2 py-2 text-xs font-semibold cursor-pointer text-white bg-bg-surface border border-accent-amber hover:bg-bg-elevated transition-all duration-200"
        >
          ✓ Đáp án
        </button>
        <button
          @click="handleReset"
          class="flex-1 px-2 py-2 text-xs font-display font-bold cursor-pointer text-bg-deep bg-accent-coral hover:brightness-110 transition-all duration-200 uppercase tracking-wide"
        >
          Đặt lại
        </button>
      </div>
      <div class="text-xs text-text-dim shrink-0">
        👆 Kéo mảnh vào bảng · <kbd class="font-mono bg-bg-deep px-0.5">Q</kbd>/<kbd
          class="font-mono bg-bg-deep px-0.5"
          >E</kbd
        >
        xoay
      </div>
    </div>

    <!-- Mobile: Board tab -->
    <div v-if="activeTab === 'board'" class="lg:hidden flex-1 min-h-0 flex flex-col">
      <!-- Compact action bar -->
      <div class="flex gap-2 px-3 py-2 shrink-0 bg-bg-surface border-b border-border-default">
        <button
          @click="showRules = true"
          class="px-3 py-1 text-xs cursor-pointer text-white bg-bg-deep border border-accent-coral hover:bg-bg-elevated transition-all duration-200"
        >
          📖 Luật
        </button>
        <button
          @click="openSolutions"
          class="px-3 py-1 text-xs cursor-pointer text-white bg-bg-surface border border-accent-amber hover:bg-bg-elevated transition-all duration-200"
        >
          ✓ Đáp án
        </button>
        <button
          @click="handleReset"
          class="ml-auto px-3 py-1 text-xs font-display font-bold cursor-pointer text-bg-deep bg-accent-coral hover:brightness-110 transition-all duration-200 uppercase tracking-wide"
        >
          Đặt lại
        </button>
      </div>

      <!-- Board -->
      <div class="flex-1 min-h-0">
        <GameBoard
          :placed-pieces="gameStore.board.placedPieces"
          :occupied-segments="gameStore.board.occupiedSegments"
          @piece-pickup="handlePiecePickupFromBoard"
          :dragged-piece="gameStore.dragState?.piece || null"
          :drag-pointer="dragPointer"
          :drag-pointer-offset="dragPointerOffset"
          @board-hover-change="boardHoverPosition = $event"
          @start-drag-from-board="startPointerDragFromBoard"
        />
      </div>

      <!-- Inventory strip -->
      <div class="h-48 shrink-0 bg-bg-elevated border-t border-border-default overflow-hidden">
        <PieceInventory
          :pieces="gameStore.inventory"
          @piece-pickup="handlePiecePickupFromInventory"
          @rotate="handleRotate"
          @piece-return-to-inventory="handlePieceReturnToInventory"
          :drag-pointer="dragPointer"
          @inventory-hover-change="isInventoryHover = $event"
          @start-drag-from-inventory="startPointerDragFromInventory"
        />
      </div>
    </div>

    <!-- Desktop layout (lg+) -->
    <div class="hidden lg:flex flex-1 min-h-0 px-5 pb-5">
      <div
        class="flex-1 bg-bg-surface border border-border-default shadow-2xl p-4 flex items-center justify-center gap-4 relative overflow-hidden min-h-0"
      >
        <!-- Left: Challenge area + controls -->
        <div
          class="flex-[2] h-full bg-bg-elevated border border-border-default p-3 flex flex-col gap-2 min-h-0 overflow-hidden"
        >
          <ChallengeViewer class="flex-1 min-h-0" />

          <!-- Action buttons -->
          <div class="flex gap-2 shrink-0">
            <button
              @click="showRules = true"
              class="flex-1 px-2 py-1.5 text-xs font-semibold cursor-pointer text-white text-center transition-all duration-200 bg-bg-deep border border-accent-coral hover:bg-bg-elevated"
            >
              📖 Luật
            </button>
            <button
              @click="openSolutions"
              class="flex-1 px-2 py-1.5 text-xs font-semibold cursor-pointer text-white text-center transition-all duration-200 bg-bg-surface border border-accent-amber hover:bg-bg-elevated"
            >
              ✓ Đáp án
            </button>
            <button
              @click="handleReset"
              class="flex-1 px-2 py-1.5 text-xs font-display font-bold cursor-pointer text-bg-deep text-center uppercase tracking-wide bg-accent-coral hover:brightness-110 transition-all duration-200"
            >
              Đặt lại
            </button>
          </div>
        </div>

        <!-- Center: Board -->
        <div class="flex-[3] flex justify-center items-center relative w-full h-full min-w-0">
          <GameBoard
            :placed-pieces="gameStore.board.placedPieces"
            :occupied-segments="gameStore.board.occupiedSegments"
            @piece-pickup="handlePiecePickupFromBoard"
            :dragged-piece="gameStore.dragState?.piece || null"
            :drag-pointer="dragPointer"
            :drag-pointer-offset="dragPointerOffset"
            @board-hover-change="boardHoverPosition = $event"
            @start-drag-from-board="startPointerDragFromBoard"
          />
        </div>

        <!-- Right: Inventory -->
        <div class="flex-[2] flex flex-col h-full bg-bg-elevated border border-border-default">
          <PieceInventory
            :pieces="gameStore.inventory"
            @piece-pickup="handlePiecePickupFromInventory"
            @rotate="handleRotate"
            @piece-return-to-inventory="handlePieceReturnToInventory"
            :drag-pointer="dragPointer"
            @inventory-hover-change="isInventoryHover = $event"
            @start-drag-from-inventory="startPointerDragFromInventory"
          />
        </div>
      </div>
    </div>

    <!-- Rules Modal -->
    <Teleport to="body">
      <div
        v-if="showRules"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-bg-deep/80 backdrop-blur-sm"
        @click.self="showRules = false"
      >
        <div
          class="bg-bg-surface border border-border-default w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        >
          <!-- Modal header -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-border-default shrink-0"
          >
            <h2
              class="font-display text-lg font-bold text-accent-coral tracking-tight flex items-center gap-2"
            >
              <span class="text-xs tracking-widest">//</span>
              Luật chơi
            </h2>
            <button
              @click="showRules = false"
              class="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none cursor-pointer w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <!-- Modal body -->
          <div
            class="px-5 py-4 overflow-y-auto flex-1 text-sm text-text-primary leading-relaxed space-y-4"
          >
            <p>Chọn 1 level bạn muốn chơi từ bảng Thử Thách.</p>
            <p>
              Đặt các số ban đầu lên bảng chơi theo như thử thách hiển thị
              <span class="text-text-secondary"
                >(một số thử thách Chuyên gia và Bậc thầy sẽ không hiển thị số nào)</span
              >.
            </p>
            <p>
              Đặt tất cả các số còn lại lên bảng để hoàn thành thử thách. Nếu thử thách có một
              <span class="text-accent-amber font-semibold">tổng</span>, các số xung quanh phải cộng
              lại đúng bằng tổng đó. Các vạch xung quanh tổng cho biết số lượng và vị trí các số cần
              điền.
            </p>

            <div class="border-t border-border-default pt-4">
              <h3
                class="font-display font-semibold text-text-primary mb-2 flex items-center gap-2 text-sm"
              >
                <span class="text-accent-coral text-xs tracking-widest">//</span>
                Thử thách mẫu
              </h3>
              <img
                src="/digit-packing-puzzle/rules-1.png"
                alt="Thử thách mẫu — trước khi giải"
                class="w-full mt-3 border border-border-default"
              />
              <p class="text-text-secondary">
                Thử thách hiển thị hai tổng bằng 3. Các vạch quanh tổng phía trên cho thấy chỉ có 1
                số để dùng
                <span class="text-text-primary">(1 đường viền trắng liền mạch)</span> — số đó chỉ có
                thể là chính số 3. Các vạch quanh tổng phía dưới cho thấy phải dùng 2 số
                <span class="text-text-primary">(2 đoạn viền trắng)</span>. Dựa theo vị trí các
                vạch, chỉ có một cách đúng duy nhất để đặt số 1 và 2 sao cho tổng bằng 3.
              </p>
            </div>

            <p>
              Mỗi thử thách chỉ có
              <span class="text-accent-coral font-semibold">một lời giải duy nhất</span>, bấm "Đáp
              án" để xem lời giải.
            </p>
            <img
              src="/digit-packing-puzzle/rules-2.png"
              alt="Thử thách mẫu — lời giải"
              class="w-full border border-border-default"
            />

            <div class="bg-bg-elevated border border-border-default p-3 text-text-secondary">
              <span class="text-accent-amber font-semibold">Lưu ý: </span>Bảng chơi sẽ không được
              lấp đầy hoàn toàn — mỗi thử thách luôn còn lại đúng
              <span class="text-text-primary font-semibold">2 ô trống</span>.
            </div>

            <div class="border-t border-border-default pt-4">
              <h3
                class="font-display font-semibold text-text-primary mb-3 flex items-center gap-2 text-sm"
              >
                <span class="text-accent-coral text-xs tracking-widest">//</span>
                Điều khiển
              </h3>
              <div class="space-y-2 text-text-secondary">
                <div class="flex items-start gap-3">
                  <span class="text-accent-coral mt-0.5">🖱</span>
                  <span
                    ><span class="text-text-primary font-medium">Kéo &amp; thả</span> — giữ và kéo
                    mảnh từ kho vào bảng, hoặc từ bảng sang vị trí khác trên bảng hoặc kéo lại vào
                    kho</span
                  >
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-accent-coral mt-0.5 shrink-0">⌨</span>
                  <span
                    ><kbd class="font-mono bg-bg-deep border border-border-default px-1">Q</kbd>
                    xoay ngược chiều kim đồng hồ ·
                    <kbd class="font-mono bg-bg-deep border border-border-default px-1">E</kbd>
                    xoay thuận chiều — nhấn trong khi đang kéo mảnh</span
                  >
                </div>
              </div>
            </div>

            <div class="border-t border-border-default pt-4 text-text-secondary">
              Nếu bạn vẫn chưa hiểu luật, xem video này:
              <a
                href="https://youtu.be/jwbSFhbcHVA?si=88HQHNoOjU5Qz3qY&t=196"
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent-sky hover:brightness-125 transition-all underline underline-offset-2 break-all"
              >
                https://youtu.be/jwbSFhbcHVA?si=88HQHNoOjU5Qz3qY&t=196
              </a>
            </div>
          </div>

          <!-- Mobile tip -->
          <div class="lg:hidden px-5 pb-3 shrink-0">
            <div
              class="bg-bg-elevated border border-accent-sky/30 p-3 text-xs text-text-secondary leading-relaxed"
            >
              <span class="text-accent-sky font-semibold">💡 Mẹo: </span>Để chơi tốt hơn, bạn cần
              nhìn thử thách và bảng chơi cùng lúc. Hãy dùng
              <span class="text-text-primary font-semibold">máy tính hoặc laptop</span> để có trải
              nghiệm tốt nhất.
            </div>
          </div>

          <!-- Modal footer -->
          <div class="px-5 py-3 border-t border-border-default shrink-0">
            <button
              @click="showRules = false"
              class="w-full py-2.5 text-sm font-semibold cursor-pointer bg-accent-coral text-bg-deep hover:brightness-110 transition-all duration-200"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
