<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  getScoreHistory,
  getHighScores,
  clearHighScores,
  type HighScore,
} from '../composables/useHighScores'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const history = ref<HighScore[]>([])
const activeTab = ref<'history' | 'top'>('history')

function loadData() {
  if (activeTab.value === 'history') {
    history.value = getScoreHistory()
  } else {
    history.value = getHighScores()
  }
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'Dễ',
    medium: 'Trung bình',
    hard: 'Khó',
  }
  return labels[difficulty] || difficulty
}

function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: 'text-green-400',
    medium: 'text-amber-400',
    hard: 'text-red-400',
  }
  return colors[difficulty] || 'text-text-primary'
}

function handleExportHistory() {
  const dataStr = JSON.stringify(history.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `gach-bong-scores-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function handleClearHistory() {
  if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử điểm số?')) {
    clearHighScores()
    loadData()
  }
}

function handleClose() {
  emit('close')
}

// Load data when tab changes or modal opens
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadData()
    }
  },
)
watch(activeTab, () => {
  loadData()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleClose" />

        <!-- Modal -->
        <div
          class="relative w-full max-w-md max-h-[80vh] overflow-hidden rounded-xl border border-border-default bg-bg-surface shadow-2xl"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-border-default px-5 py-4">
            <h2 class="font-display text-lg font-bold text-text-primary">Lịch Sử Điểm Số</h2>
            <button class="text-text-dim transition hover:text-text-primary" @click="handleClose">
              ✕
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-border-default">
            <button
              class="flex-1 px-4 py-3 font-display text-sm font-medium transition"
              :class="
                activeTab === 'history'
                  ? 'text-accent-coral border-b-2 border-accent-coral'
                  : 'text-text-secondary hover:text-text-primary'
              "
              @click="activeTab = 'history'"
            >
              Lịch sử
            </button>
            <button
              class="flex-1 px-4 py-3 font-display text-sm font-medium transition"
              :class="
                activeTab === 'top'
                  ? 'text-accent-coral border-b-2 border-accent-coral'
                  : 'text-text-secondary hover:text-text-primary'
              "
              @click="activeTab = 'top'"
            >
              Top 10
            </button>
          </div>

          <!-- Content -->
          <div class="overflow-y-auto p-4" style="max-height: calc(80vh - 140px)">
            <div v-if="history.length === 0" class="py-8 text-center text-text-dim">
              <p class="text-4xl mb-2">📊</p>
              <p>Chưa có điểm số nào</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(item, index) in history"
                :key="index"
                class="flex items-center justify-between rounded-lg border border-border-default bg-bg-elevated px-4 py-3"
              >
                <div class="flex flex-col">
                  <span class="font-display text-lg font-bold text-accent-coral">
                    {{ item.score.toLocaleString() }} điểm
                  </span>
                  <span class="text-xs text-text-dim">
                    {{ formatDate(item.date) }}
                  </span>
                </div>
                <span
                  class="font-display text-xs font-medium uppercase tracking-wider"
                  :class="getDifficultyColor(item.difficulty)"
                >
                  {{ getDifficultyLabel(item.difficulty) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-border-default px-5 py-3 flex gap-2">
            <button
              v-if="history.length > 0"
              class="flex-1 rounded-lg border border-blue-400/50 bg-blue-400/10 px-4 py-2 font-display text-sm font-medium text-blue-400 transition hover:bg-blue-400/20"
              @click="handleExportHistory"
            >
              📥 Xuất JSON
            </button>
            <button
              v-if="history.length > 0"
              class="flex-1 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 font-display text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              @click="handleClearHistory"
            >
              🗑️ Xóa
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
