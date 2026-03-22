<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { GameContext } from '../composables/useGame'

const { gameState, leaderboard } = inject('game') as GameContext

// Map cho Leaderboard để hiện màu hiển thị tùy theo độ khó
const diffMap: Record<string, { name: string; color: string }> = {
  easy: { name: 'DỄ', color: 'text-green-400' },
  normal: { name: 'VỪA', color: 'text-yellow-400' },
  hard: { name: 'KHÓ', color: 'text-orange-400' },
  hardcore: { name: 'HARDCORE', color: 'text-red-500 drop-shadow-[0_0_5px_currentColor]' },
}

// --- LOGIC LEADERBOARD PHÂN TRANG & TABS ---
const leaderboardTab = ref<'campaign' | 'endless'>('campaign')
const leaderboardPage = ref(1)
const itemsPerPage = 5

// Lọc dữ liệu theo tab
const filteredLeaderboard = computed(() => {
  if (!leaderboard.value) return []
  return leaderboard.value.filter(
    (entry) =>
      entry.mode === leaderboardTab.value || (!entry.mode && leaderboardTab.value === 'endless'),
  )
})

// Tính tổng số trang
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredLeaderboard.value.length / itemsPerPage))
})

// Dữ liệu cho trang hiện tại
const paginatedLeaderboard = computed(() => {
  const start = (leaderboardPage.value - 1) * itemsPerPage
  return filteredLeaderboard.value.slice(start, start + itemsPerPage)
})

// Chuyển Tab
const setLeaderboardTab = (tab: 'campaign' | 'endless') => {
  leaderboardTab.value = tab
  leaderboardPage.value = 1
}
</script>

<template>
  <div
    v-if="gameState === 'leaderboard'"
    class="absolute inset-0 z-600 bg-bg-deep/95 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto overflow-y-auto py-8"
  >
    <div
      class="flex flex-col items-center w-full max-w-2xl bg-bg-surface border-2 border-border-default p-6 shadow-2xl"
    >
      <div class="relative flex items-center justify-center w-full mb-6">
        <button
          @click="gameState = 'menu'"
          class="absolute left-0 text-text-secondary hover:text-white transition-colors active:scale-95 flex items-center p-2"
          title="Quay lại Menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <h2
          class="text-4xl font-display font-bold text-accent-amber tracking-widest uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] m-0"
        >
          BẢNG THÀNH TÍCH
        </h2>
      </div>

      <div class="flex gap-4 mb-6 w-full justify-center">
        <button
          @click="setLeaderboardTab('campaign')"
          class="px-8 py-3 font-display font-bold text-lg transition-all"
          :class="
            leaderboardTab === 'campaign'
              ? 'bg-accent-sky text-bg-deep shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'bg-bg-elevated text-text-secondary hover:text-white'
          "
        >
          CHIẾN DỊCH
        </button>
        <button
          @click="setLeaderboardTab('endless')"
          class="px-8 py-3 font-display font-bold text-lg transition-all"
          :class="
            leaderboardTab === 'endless'
              ? 'bg-accent-sky text-bg-deep shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'bg-bg-elevated text-text-secondary hover:text-white'
          "
        >
          VÔ HẠN
        </button>
      </div>

      <div
        class="grid grid-cols-4 w-full text-text-secondary font-display font-bold border-b-2 border-border-default pb-2 mb-4 px-4 text-center"
      >
        <div class="text-left">TOP</div>
        <div>ĐIỂM SỐ</div>
        <div>WAVE & ĐỘ KHÓ</div>
        <div class="text-right">NGÀY CHƠI</div>
      </div>

      <div class="flex flex-col w-full gap-2 min-h-62.5">
        <div
          v-for="(entry, index) in paginatedLeaderboard"
          :key="index"
          class="grid grid-cols-4 w-full bg-bg-elevated py-3 px-4 rounded text-center items-center font-display transition-colors hover:bg-border-default"
        >
          <div
            class="text-left font-bold text-xl"
            :class="
              leaderboardPage === 1 && index === 0
                ? 'text-yellow-400'
                : leaderboardPage === 1 && index === 1
                  ? 'text-gray-300'
                  : leaderboardPage === 1 && index === 2
                    ? 'text-amber-600'
                    : 'text-text-primary'
            "
          >
            #{{ (leaderboardPage - 1) * itemsPerPage + index + 1 }}
          </div>
          <div class="font-bold text-accent-coral">{{ entry.score.toLocaleString() }}</div>

          <div class="text-accent-amber text-sm font-bold uppercase tracking-wider">
            Wave {{ entry.wave }} <span class="text-text-secondary mx-1">-</span>
            <span :class="diffMap[entry.difficulty]?.color || 'text-text-primary'">
              {{ diffMap[entry.difficulty]?.name || entry.difficulty }}
            </span>
          </div>

          <div class="text-right text-text-secondary text-sm">
            {{ new Date(entry.date).toLocaleDateString('vi-VN') }}
          </div>
        </div>

        <div
          v-if="paginatedLeaderboard.length === 0"
          class="flex flex-1 items-center justify-center text-text-secondary font-display italic border border-dashed border-border-default p-4"
        >
          Chưa có chiến binh nào ghi danh tại đây...
        </div>
      </div>

      <div
        class="flex w-full justify-between items-center mt-6 pt-4 border-t border-border-default"
      >
        <button
          @click="leaderboardPage--"
          :disabled="leaderboardPage === 1"
          class="px-4 py-2 bg-bg-elevated font-display font-bold text-text-primary transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-border-default"
        >
          &lt; TRƯỚC
        </button>

        <span class="font-display font-bold text-accent-sky">
          TRANG {{ leaderboardPage }} / {{ totalPages }}
        </span>

        <button
          @click="leaderboardPage++"
          :disabled="leaderboardPage === totalPages"
          class="px-4 py-2 bg-bg-elevated font-display font-bold text-text-primary transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-border-default"
        >
          SAU &gt;
        </button>
      </div>
    </div>
  </div>
</template>
