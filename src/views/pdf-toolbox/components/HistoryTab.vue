<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { HistoryItem } from '../types'
import { downloadFile } from '../utils/download'
import { getFileFromDB, deleteFileFromDB } from '../utils/storage'

const props = defineProps<{
  history: HistoryItem[]
}>()

const emit = defineEmits<{
  (e: 'delete', id: string, index: number): void
  (e: 'view-info', item: HistoryItem): void
  (e: 'download-success', item: HistoryItem): void
  (e: 'show-toast', msg: string, type: 'success' | 'error' | 'info'): void
}>()

const searchQuery = ref('')

const filteredHistory = computed(() => {
  if (!searchQuery.value) return props.history
  const q = searchQuery.value.toLowerCase()
  return props.history.filter(
    (item) => item.fileName.toLowerCase().includes(q) || item.action.toLowerCase().includes(q),
  )
})

const groupedHistory = computed(() => {
  const groups: Record<string, HistoryItem[]> = {}

  filteredHistory.value.forEach((item) => {
    const date = new Date(item.date)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    let groupName = ''
    if (date.toDateString() === today.toDateString()) groupName = 'Hôm nay'
    else if (date.toDateString() === yesterday.toDateString()) groupName = 'Hôm qua'
    else
      groupName = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })

    if (!groups[groupName]) groups[groupName] = []
    const targetGroup = groups[groupName]
    if (targetGroup) targetGroup.push(item)
  })

  return groups
})

const deleteHistoryItem = async (id: string) => {
  const index = props.history.findIndex((item) => item.id === id)
  if (index !== -1) {
    await deleteFileFromDB(id)
    emit('delete', id, index)
  }
}

const showInfo = (item: HistoryItem) => {
  emit('view-info', item)
}

const downloadHistoryFile = async (item: HistoryItem) => {
  try {
    const blob = await getFileFromDB(item.id)
    if (blob) {
      await downloadFile(blob, item.fileName)
      emit('download-success', item)
    } else {
      emit('show-toast', 'File không còn tồn tại trong bộ nhớ tạm.', 'error')
    }
  } catch (error) {
    console.error('Lỗi download history:', error)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Search Bar -->
    <div v-if="history.length > 0" class="relative group animate-fade-up">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Tìm kiếm trong lịch sử..."
        class="w-full bg-bg-surface border border-border-default p-4 pl-12 font-body text-sm outline-none focus:border-accent-sky transition-all"
      />
      <Icon
        icon="lucide:search"
        class="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-dim group-focus-within:text-accent-sky transition-colors"
      />
    </div>

    <div
      v-if="Object.keys(groupedHistory).length === 0"
      class="text-center py-20 border border-border-default bg-bg-surface animate-fade-up"
    >
      <Icon icon="lucide:inbox" class="size-16 mx-auto mb-4 text-bg-elevated" />
      <p class="text-text-dim italic">Chưa có lịch sử hoạt động phù hợp.</p>
    </div>

    <div v-else class="space-y-12">
      <div
        v-for="(items, groupName) in groupedHistory"
        :key="groupName"
        class="space-y-4 animate-fade-up"
      >
        <h3
          class="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent-sky flex items-center gap-3"
        >
          <span class="w-8 h-px bg-accent-sky/30"></span>
          {{ groupName }}
          <span class="text-text-dim">({{ items.length }})</span>
        </h3>

        <div class="grid gap-3">
          <div
            v-for="item in items"
            :key="item.id"
            class="border border-border-default bg-bg-surface p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-accent-sky/50 transition-all group relative overflow-hidden"
          >
            <div class="flex items-center gap-4 relative z-10">
              <div
                class="p-3 bg-bg-elevated border border-border-default group-hover:border-accent-sky/30 transition-colors"
              >
                <Icon
                  :icon="item.action.includes('Tách') ? 'lucide:scissors' : 'lucide:layers'"
                  class="size-5 text-accent-sky"
                />
              </div>
              <div class="min-w-0">
                <h4
                  class="font-display font-bold truncate pr-4 text-text-primary group-hover:text-accent-sky transition-colors"
                >
                  {{ item.fileName }}
                </h4>
                <p class="text-[10px] text-text-dim mt-1 font-display tracking-widest uppercase">
                  {{ item.action }} • {{ (item.fileSize! / 1024 / 1024).toFixed(2) }} MB
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0 relative z-10">
              <button
                @click="showInfo(item)"
                class="p-2 border border-border-default text-text-dim hover:text-text-primary hover:bg-bg-elevated transition-all"
                title="Thông tin chi tiết"
              >
                <Icon icon="lucide:info" class="size-4" />
                <span
                  v-if="item.downloadCount && item.downloadCount > 0"
                  class="absolute -top-3 -right-3 bg-accent-sky text-bg-deep text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-bg-surface shadow-lg"
                >
                  {{ item.downloadCount }}
                </span>
              </button>
              <button
                @click="downloadHistoryFile(item)"
                class="flex items-center gap-2 border border-border-default px-4 py-2 text-[10px] font-display font-bold uppercase tracking-widest hover:bg-accent-sky hover:text-bg-deep hover:border-accent-sky transition-all"
              >
                <Icon icon="lucide:download" class="size-3" /> Tải về
              </button>
              <button
                @click="deleteHistoryItem(item.id)"
                class="p-2 border border-border-default text-text-dim hover:text-accent-coral hover:border-accent-coral transition-all"
                title="Xóa lịch sử"
              >
                <Icon icon="lucide:trash-2" class="size-4" />
              </button>
            </div>

            <!-- Background Decoration -->
            <div
              class="absolute -right-4 -bottom-4 text-6xl font-display font-black text-white/5 select-none pointer-events-none group-hover:text-accent-sky/10 transition-colors"
            >
              {{ item.action.split(' ')[0] }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
