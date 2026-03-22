<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { GameContext } from '../composables/useGame'

const {
  gameState,
  previousGameState,
  initGame,
  score,
  resumingCountdown,
  waveAnnouncement,
  difficulty,
  gameMode,
  resumeGame,
  saves,
  saveCurrentGame,
  loadGame,
  deleteSave,
  exportSaves,
  importSaves,
  notification,
  surrenderGame,
} = inject('game') as GameContext

const diffOptions = [
  {
    id: 'easy',
    name: 'DỄ',
    desc: '• Hệ số điểm: x1\n• 10,000 điểm = +1 Mạng\n• Trải nghiệm cơ bản, dễ thở.',
    color: 'text-green-400',
    border: 'border-green-500',
    hover: 'hover:bg-green-500',
    shadow: 'shadow-[0_0_15px_#22c55e]',
  },
  {
    id: 'normal',
    name: 'VỪA',
    desc: '• Hệ số điểm: x1.5\n• 25,000 điểm = +1 Mạng\n• Độ khó thông thường',
    color: 'text-yellow-400',
    border: 'border-yellow-500',
    hover: 'hover:bg-yellow-500',
    shadow: 'shadow-[0_0_15px_#eab308]',
  },
  {
    id: 'hard',
    name: 'KHÓ',
    desc: '• Hệ số điểm: x2\n• 50,000 điểm = +1 Mạng\n• Tỷ lệ rớt súng giảm mạnh.',
    color: 'text-orange-400',
    border: 'border-orange-500',
    hover: 'hover:bg-orange-500',
    shadow: 'shadow-[0_0_15px_#f97316]',
  },
  {
    id: 'hardcore',
    name: 'HARDCORE',
    desc: '• Hệ số điểm: x3\n• KHÔNG CỘNG MẠNG (Chỉ 1 mạng duy nhất)\n• Sai một ly, đi một dặm.',
    color: 'text-red-500',
    border: 'border-red-600',
    hover: 'hover:bg-red-600',
    shadow: 'shadow-[0_0_15px_#dc2626]',
  },
] as const

const currentIndex = ref(0)
const currentDiff = computed(() => diffOptions[currentIndex.value] || diffOptions[0])

const nextDiff = () => {
  currentIndex.value = (currentIndex.value + 1) % diffOptions.length
}
const prevDiff = () => {
  currentIndex.value = (currentIndex.value - 1 + diffOptions.length) % diffOptions.length
}

const handlePlay = () => {
  difficulty.value = currentDiff.value.id
  initGame()
}

const openSavesMenu = () => {
  previousGameState.value = gameState.value
  gameState.value = 'saves'
}

const showExitConfirm = ref(false)
const confirmExit = () => {
  showExitConfirm.value = false
  gameState.value = 'menu'
}

const saveToDelete = ref<string | null>(null)
const confirmDeleteSave = () => {
  if (saveToDelete.value) {
    deleteSave(saveToDelete.value)
    saveToDelete.value = null
  }
}

const showSurrenderConfirm = ref(false)
const confirmSurrender = () => {
  showSurrenderConfirm.value = false
  surrenderGame()
}

const fileInput = ref<HTMLInputElement | null>(null)
const triggerImport = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div
    v-if="gameState === 'menu'"
    class="absolute inset-0 z-600 bg-bg-deep/80 backdrop-blur-md flex flex-col items-center pointer-events-auto overflow-y-auto py-8"
  >
    <button
      @click="gameState = 'leaderboard'"
      class="fixed top-4 right-4 lg:top-8 lg:right-8 w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-bg-surface border border-accent-amber rounded-sm text-xl lg:text-2xl transition-all hover:bg-accent-amber hover:scale-105 active:scale-95 shadow-md z-610"
      title="Bảng Thành Tích"
    >
      🏆
    </button>

    <div
      class="border border-border-default bg-bg-surface p-6 max-w-md w-full text-center shadow-xl mb-6 shrink-0 mt-auto"
    >
      <div class="flex gap-2 mb-6 border-b border-border-default pb-6">
        <button
          class="flex-1 py-3 font-display font-bold text-sm tracking-widest uppercase transition-all rounded-sm"
          :class="
            gameMode === 'endless'
              ? 'bg-accent-sky text-bg-deep'
              : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-default'
          "
          @click="gameMode = 'endless'"
        >
          VÔ TẬN
        </button>
        <button
          class="flex-1 py-3 font-display font-bold text-sm tracking-widest uppercase transition-all rounded-sm"
          :class="
            gameMode === 'campaign'
              ? 'bg-accent-coral text-bg-deep'
              : 'bg-bg-elevated text-text-secondary hover:text-text-primary border border-border-default'
          "
          @click="gameMode = 'campaign'"
        >
          CHIẾN DỊCH
        </button>
      </div>

      <h3
        class="text-xl font-display font-bold text-accent-sky tracking-widest mb-6 uppercase border-b border-border-default pb-2"
      >
        CHỌN ĐỘ KHÓ
      </h3>

      <div class="flex items-center justify-between mb-6">
        <button
          @click="prevDiff"
          class="w-12 h-12 shrink-0 flex items-center justify-center bg-bg-elevated border border-border-default text-text-secondary hover:text-accent-sky hover:border-accent-sky transition-colors text-2xl font-bold rounded-sm active:scale-95"
        >
          &lt;
        </button>

        <button
          @click="handlePlay"
          class="flex-1 mx-3 py-3 bg-bg-elevated border-2 transition-all rounded-sm group active:scale-95 flex flex-col items-center justify-center"
          :class="[currentDiff.border, currentDiff.hover, currentDiff.shadow]"
        >
          <span
            class="font-display font-bold text-2xl tracking-widest transition-colors group-hover:text-bg-deep"
            :class="currentDiff.color"
          >
            {{ currentDiff.name }}
          </span>
          <span
            class="text-xs font-body font-bold uppercase tracking-widest opacity-80 mt-1 transition-colors group-hover:text-bg-deep text-text-secondary"
          >
            CHƠI NGAY
          </span>
        </button>

        <button
          @click="nextDiff"
          class="w-12 h-12 shrink-0 flex items-center justify-center bg-bg-elevated border border-border-default text-text-secondary hover:text-accent-sky hover:border-accent-sky transition-colors text-2xl font-bold rounded-sm active:scale-95"
        >
          &gt;
        </button>
      </div>

      <button
        @click="openSavesMenu"
        class="w-full py-3 border border-border-default bg-bg-elevated hover:border-accent-amber text-text-primary font-display font-bold transition-all mb-4"
      >
        TẢI GAME / QUẢN LÝ LƯU TRỮ
      </button>

      <div
        class="bg-bg-elevated p-4 border border-border-default min-h-28 flex items-center justify-center text-left flex-col gap-2"
      >
        <span
          class="text-xs font-bold text-accent-amber bg-accent-amber/10 px-2 py-1 border border-accent-amber/30 w-full text-center tracking-widest"
        >
          CHẾ ĐỘ: {{ gameMode === 'campaign' ? 'CHIẾN DỊCH (120 MÀN)' : 'VÔ TẬN (ĐIỂM CAO)' }}
        </span>
        <p
          class="text-text-secondary whitespace-pre-line leading-relaxed font-semibold text-sm w-full mt-2"
        >
          {{ currentDiff.desc }}
        </p>
      </div>
    </div>

    <div
      class="border border-border-default bg-bg-surface p-6 max-w-md w-full text-center shadow-xl shrink-0 mb-auto"
    >
      <h3
        class="text-xl font-display font-bold text-accent-sky tracking-widest mb-4 uppercase border-b border-border-default pb-2"
      >
        HƯỚNG DẪN
      </h3>
      <div class="hidden lg:flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <span class="text-text-secondary font-bold text-sm tracking-wider">DI CHUYỂN:</span>
          <span
            class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-amber border border-border-default text-xs tracking-widest"
            >CHUỘT / WASD</span
          >
        </div>
        <div class="flex justify-between items-center">
          <span class="text-text-secondary font-bold text-sm tracking-wider">BẮN ĐẠN:</span>
          <span
            class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-coral border border-border-default text-xs tracking-widest"
            >CLICK / SPACE</span
          >
        </div>
      </div>
      <div class="lg:hidden flex flex-col gap-4">
        <div class="flex flex-col items-center gap-2">
          <span class="text-text-secondary font-bold text-sm tracking-wider">DI CHUYỂN & BẮN:</span>
          <span
            class="bg-bg-elevated px-3 py-1.5 font-bold text-accent-amber border border-border-default w-full text-xs tracking-widest"
            >CHẠM KÉO & GIỮ MÀN HÌNH</span
          >
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="gameState === 'gameover'"
    class="absolute inset-0 bg-bg-deep/90 flex flex-col items-center justify-center z-500 backdrop-blur-md pointer-events-auto"
  >
    <h2
      class="text-7xl font-display font-bold mb-2 text-accent-coral tracking-tighter uppercase drop-shadow-[0_0_20px_#FF6B4A]"
    >
      GAME OVER
    </h2>
    <p class="text-3xl text-accent-amber font-display font-bold mb-10">ĐIỂM: {{ score }}</p>
    <button
      @click="gameState = 'menu'"
      class="px-10 py-4 bg-bg-surface border border-border-default text-text-primary font-display font-bold text-xl transition-all hover:border-accent-coral hover:text-accent-coral cursor-pointer active:scale-95 shadow-lg"
    >
      MENU CHÍNH 🔄
    </button>
  </div>

  <div
    v-if="gameState === 'victory'"
    class="absolute inset-0 bg-bg-deep/90 flex flex-col items-center justify-center z-500 backdrop-blur-md pointer-events-auto"
  >
    <h2
      class="text-6xl md:text-8xl font-display font-bold mb-4 text-accent-sky tracking-widest uppercase drop-shadow-[0_0_30px_#38BDF8] animate-fade-up"
    >
      VICTORY!
    </h2>
    <p
      class="text-xl md:text-2xl text-text-primary font-body mb-2 animate-fade-up animate-delay-1 text-center px-4"
    >
      Chúc mừng bạn đã tiêu diệt Phi Thuyền Mẹ và giải cứu Trái Đất!
    </p>
    <p
      class="text-4xl text-accent-amber font-display font-bold mb-10 animate-fade-up animate-delay-2"
    >
      ĐIỂM TỔNG: {{ score.toLocaleString() }}
    </p>
    <button
      @click="gameState = 'menu'"
      class="px-10 py-4 bg-accent-sky text-bg-deep font-display font-bold text-xl transition-all hover:bg-white active:scale-95 shadow-lg animate-fade-up animate-delay-3"
    >
      TRỞ VỀ MENU 🏆
    </button>
  </div>

  <div
    v-if="gameState === 'paused'"
    class="absolute inset-0 bg-bg-deep/80 backdrop-blur-md flex flex-col items-center justify-center z-400 pointer-events-auto"
  >
    <h2 class="text-7xl font-display font-bold text-accent-coral mb-8 tracking-widest uppercase">
      TẠM DỪNG
    </h2>

    <div class="flex flex-col gap-4 w-64">
      <button
        @click="resumeGame"
        class="px-8 py-4 bg-accent-sky text-bg-deep font-display font-bold text-xl transition-all hover:bg-white active:scale-95 shadow-lg cursor-pointer"
      >
        TIẾP TỤC ▶
      </button>

      <button
        @click="openSavesMenu"
        class="px-8 py-4 bg-accent-amber text-bg-deep font-display font-bold text-xl transition-all hover:bg-white active:scale-95 shadow-lg cursor-pointer"
      >
        LƯU GAME / TẢI GAME
      </button>

      <button
        @click="showSurrenderConfirm = true"
        class="px-8 py-4 bg-red-900 border border-red-500 text-white font-display font-bold text-xl transition-all hover:bg-red-600 active:scale-95 cursor-pointer"
      >
        {{ gameMode === 'campaign' ? 'BỎ CUỘC 🏳️' : 'RÚT LUI 🛑' }}
      </button>

      <button
        @click="showExitConfirm = true"
        class="px-8 py-4 bg-accent-coral border border-border-default text-bg-deep font-display font-bold text-xl transition-all hover:bg-white active:scale-95 cursor-pointer"
      >
        MENU
      </button>
    </div>

    <p class="font-display text-xl text-text-secondary mt-8 text-center leading-relaxed">
      <span class="hidden lg:inline">Nhấn SPACE để tiếp tục nhanh</span>
    </p>

    <div
      v-if="showExitConfirm"
      class="fixed inset-0 z-700 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 pointer-events-auto"
    >
      <div
        class="bg-bg-surface border-2 border-accent-coral p-8 max-w-sm w-full text-center shadow-[0_0_30px_rgba(255,107,74,0.3)] scale-in-center"
      >
        <h3
          class="text-2xl font-display font-bold text-text-primary mb-4 uppercase tracking-tighter"
        >
          Xác nhận thoát?
        </h3>
        <p class="font-display text-text-secondary mb-8 leading-relaxed">
          Tiến trình chơi hiện tại của bạn sẽ bị mất hoàn toàn nếu chưa Lưu Game!
        </p>

        <div class="grid grid-cols-2 gap-4">
          <button
            @click="showExitConfirm = false"
            class="font-display py-3 bg-bg-elevated border border-border-default text-text-primary font-bold hover:bg-bg-surface transition-colors cursor-pointer"
          >
            QUAY LẠI
          </button>
          <button
            @click="confirmExit"
            class="font-display py-3 bg-accent-coral text-bg-deep font-bold hover:brightness-110 transition-all cursor-pointer"
          >
            THOÁT
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showSurrenderConfirm"
      class="fixed inset-0 z-700 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 pointer-events-auto"
    >
      <div
        class="bg-bg-surface border-2 p-8 max-w-sm w-full text-center scale-in-center"
        :class="
          gameMode === 'campaign'
            ? 'border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.4)]'
            : 'border-accent-sky shadow-[0_0_40px_rgba(56,189,248,0.3)]'
        "
      >
        <h3
          class="text-2xl font-display font-bold mb-4 uppercase tracking-tighter"
          :class="gameMode === 'campaign' ? 'text-red-500' : 'text-accent-sky'"
        >
          {{ gameMode === 'campaign' ? 'ĐẦU HÀNG?' : 'KẾT THÚC SỚM?' }}
        </h3>

        <p
          v-if="gameMode === 'campaign'"
          class="font-display text-text-secondary mb-8 leading-relaxed"
        >
          Nếu bỏ cuộc, bạn sẽ
          <span class="text-red-400 font-bold font-display">bị tính là THUA</span>, mất hết tiến
          trình và <span class="text-red-400 font-bold">xoá luôn File Save hiện tại</span>. Điểm số
          sẽ được ghi vào Bảng Thành Tích.
        </p>

        <p v-else class="font-display text-text-secondary mb-8 leading-relaxed">
          Bạn có muốn dừng phần chơi
          <span class="text-accent-sky font-bold font-display">Vô Tận</span> tại đây?<br /><br />
          Lượt chơi này sẽ khép lại và Điểm số của bạn sẽ được vinh danh trên Bảng Thành Tích.
        </p>

        <div class="grid grid-cols-2 gap-4">
          <button
            @click="showSurrenderConfirm = false"
            class="font-display py-3 bg-bg-elevated border border-border-default text-text-primary font-bold hover:bg-bg-surface transition-colors cursor-pointer"
          >
            TIẾP TỤC CHƠI
          </button>
          <button
            @click="confirmSurrender"
            class="font-display py-3 font-bold transition-all cursor-pointer"
            :class="
              gameMode === 'campaign'
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-accent-sky text-bg-deep hover:bg-white'
            "
          >
            {{ gameMode === 'campaign' ? 'CHẤP NHẬN THUA' : 'KẾT THÚC GAME' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="gameState === 'saves'"
    class="absolute inset-0 bg-bg-deep/95 backdrop-blur-md z-600 flex flex-col items-center justify-center pointer-events-auto p-4"
  >
    <h2
      class="text-3xl md:text-5xl font-display font-bold text-accent-sky mb-6 drop-shadow-[0_0_10px_#38BDF8]"
    >
      QUẢN LÝ LƯU TRỮ
    </h2>

    <div
      class="w-full max-w-2xl bg-bg-surface border border-border-default p-4 flex flex-col gap-3 max-h-[50vh] overflow-y-auto mb-6"
    >
      <div
        v-if="saves.length === 0"
        class="text-text-secondary font-bold text-center py-10 tracking-widest"
      >
        CHƯA CÓ DỮ LIỆU ĐƯỢC LƯU
      </div>

      <div
        v-for="save in saves"
        :key="save.id"
        class="p-4 border border-border-default bg-bg-elevated flex flex-col md:flex-row md:justify-between md:items-center gap-4 transition-colors hover:border-accent-sky"
      >
        <div class="flex flex-col">
          <span class="text-accent-amber font-bold font-display text-xl uppercase tracking-wider">{{
            save.name
          }}</span>
          <span class="text-sm text-text-secondary font-semibold mt-1">
            ĐIỂM: {{ save.score.toLocaleString() }} | MẠNG: {{ save.lives }}
          </span>
          <span class="text-xs text-text-dim mt-0.5">{{
            new Date(save.date).toLocaleString()
          }}</span>
        </div>
        <div class="flex gap-2 shrink-0">
          <button
            @click="loadGame(save)"
            class="px-5 py-2 bg-accent-sky text-bg-deep font-bold font-display hover:bg-white transition-colors cursor-pointer rounded-sm"
          >
            TẢI
          </button>
          <button
            @click="saveToDelete = save.id"
            class="px-5 py-2 bg-accent-coral text-bg-deep font-bold font-display hover:bg-white transition-colors cursor-pointer rounded-sm"
          >
            XÓA
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-4 w-full max-w-2xl">
      <button
        v-if="previousGameState === 'paused'"
        @click="saveCurrentGame"
        class="px-6 py-4 bg-accent-amber text-bg-deep font-bold font-display hover:bg-white transition-colors cursor-pointer rounded-sm shrink-0 shadow-lg"
      >
        + LƯU GAME HIỆN TẠI
      </button>

      <button
        @click="triggerImport"
        class="px-6 py-4 bg-bg-elevated border border-border-default text-text-primary font-bold font-display hover:border-accent-sky hover:text-accent-sky transition-colors cursor-pointer rounded-sm shrink-0"
      >
        📤 NẠP FILE (.JSON)
      </button>

      <input type="file" ref="fileInput" accept=".json" class="hidden" @change="importSaves" />

      <button
        @click="exportSaves"
        class="px-6 py-4 bg-bg-elevated border border-border-default text-text-primary font-bold font-display hover:border-accent-amber transition-colors cursor-pointer rounded-sm shrink-0"
      >
        📥 XUẤT FILE (.JSON)
      </button>

      <button
        @click="gameState = previousGameState"
        class="px-6 py-4 bg-bg-surface border border-border-default text-text-secondary font-bold font-display hover:text-white transition-colors cursor-pointer rounded-sm shrink-0"
      >
        QUAY LẠI CỬA SỔ
      </button>
    </div>

    <div
      v-if="saveToDelete"
      class="fixed inset-0 z-700 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 pointer-events-auto"
    >
      <div
        class="bg-bg-surface border-2 border-accent-coral p-8 max-w-sm w-full text-center shadow-[0_0_30px_rgba(255,107,74,0.3)] scale-in-center"
      >
        <h3
          class="text-2xl font-display font-bold text-text-primary mb-4 uppercase tracking-tighter"
        >
          Xác nhận xoá?
        </h3>
        <p class="text-text-secondary mb-8 leading-relaxed">
          Bản lưu này sẽ bị xoá vĩnh viễn và không thể khôi phục!
        </p>

        <div class="grid grid-cols-2 gap-4">
          <button
            @click="saveToDelete = null"
            class="font-display py-3 bg-bg-elevated border border-border-default text-text-primary font-bold hover:bg-bg-surface transition-colors cursor-pointer rounded-sm"
          >
            HUỶ BỎ
          </button>
          <button
            @click="confirmDeleteSave"
            class="font-display py-3 bg-accent-coral text-bg-deep font-bold hover:brightness-110 transition-all cursor-pointer rounded-sm"
          >
            XOÁ LUÔN
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="gameState === 'resuming'"
    class="absolute inset-0 flex flex-col items-center justify-center z-400 pointer-events-none"
  >
    <span
      class="text-[150px] font-display font-bold text-accent-amber drop-shadow-[0_0_20px_#FFB830]"
    >
      {{ resumingCountdown }}
    </span>
  </div>

  <div
    v-if="waveAnnouncement"
    class="absolute top-1/3 left-0 w-full flex items-center justify-center z-300 pointer-events-none"
  >
    <h2
      class="text-5xl sm:text-6xl font-display font-bold text-accent-sky tracking-widest text-center px-4 uppercase drop-shadow-lg whitespace-pre-line"
    >
      {{ waveAnnouncement }}
    </h2>
  </div>

  <div
    v-if="notification"
    class="fixed top-8 left-1/2 -translate-x-1/2 bg-bg-surface border-2 border-accent-sky text-accent-sky px-8 py-4 font-display font-bold text-lg sm:text-xl rounded-sm shadow-[0_0_20px_#38BDF8] z-9999 pointer-events-none scale-in-center uppercase tracking-widest"
  >
    {{ notification }}
  </div>
</template>

<style scoped>
.scale-in-center {
  animation: scale-in-center 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes scale-in-center {
  0% {
    transform: scale(0);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
