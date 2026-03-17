<script setup lang="ts">
import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// Components
import ToolHeader from './components/ToolHeader.vue'
import TabNavigation from './components/TabNavigation.vue'
import MergerTab from './components/MergerTab.vue'
import SplitterTab from './components/SplitterTab.vue'
import HistoryTab from './components/HistoryTab.vue'
import HistoryModal from './components/HistoryModal.vue'
import ProjectInfo from './components/ProjectInfo.vue'
import ReadmeModal from './components/ReadmeModal.vue'

// Types
import type { Tab, HistoryItem, SplitterRange } from './types'

// --- State ---
const activeTab = ref<Tab>('merger')
const history = useLocalStorage<HistoryItem[]>('pdf-toolbox-history', [])

// --- Toast State ---
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('success')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
  toastMsg.value = msg
  toastType.value = type
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 4000)
}

// --- Merger State ---
const mergerFiles = ref<File[]>([])

// --- Splitter State ---
const splitterFile = ref<File | null>(null)
const splitterNumPages = ref(0)
const splitterMode = ref<'ranges' | 'single'>('ranges')
const splitterRanges = ref<SplitterRange[]>([])

// --- Modal State ---
const selectedHistoryItem = ref<HistoryItem | null>(null)
const showHistoryModal = ref(false)
const showReadmeModal = ref(false)

const openHistoryModal = (item: HistoryItem) => {
  selectedHistoryItem.value = item
  showHistoryModal.value = true
}

// --- History Logic ---
const addHistory = (item: Omit<HistoryItem, 'id' | 'date' | 'downloadCount'>, id: string) => {
  history.value = [
    { ...item, id, date: new Date().toISOString(), downloadCount: 0 },
    ...history.value,
  ].slice(0, 50)

  // Delay secondary toast
  setTimeout(() => {
    showToast('Lưu lịch sử thành công', 'info')
  }, 1500)
}

const onHistoryDelete = (id: string, index: number) => {
  history.value.splice(index, 1)
  showToast('Đã xóa khỏi lịch sử', 'info')
}

const onActionSuccess = (msg: string) => {
  showToast(msg, 'success')
}

const onDownloadSuccess = (item: HistoryItem) => {
  const index = history.value.findIndex((h) => h.id === item.id)
  if (index !== -1) {
    const updated = { ...history.value[index]! }
    updated.downloadCount = (updated.downloadCount || 0) + 1
    history.value[index] = updated
  }
  showToast(`Tải lại file ${item.fileName} thành công!`, 'success')
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20 relative">
    <!-- Gooey Filter Definition -->
    <svg class="hidden">
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>

    <div class="max-w-5xl mx-auto px-6">
      <ToolHeader />

      <main class="py-12 space-y-12">
        <ProjectInfo @show-readme="showReadmeModal = true" />

        <TabNavigation v-model:activeTab="activeTab" />

        <div class="animate-fade-up">
          <!-- Merger Tab -->
          <MergerTab
            v-if="activeTab === 'merger'"
            v-model:mergerFiles="mergerFiles"
            @add-history="addHistory"
            @show-toast="showToast"
            @success="onActionSuccess('Hợp nhất file thành công')"
          />

          <!-- Splitter Tab -->
          <SplitterTab
            v-if="activeTab === 'splitter'"
            v-model:splitterFile="splitterFile"
            v-model:splitterNumPages="splitterNumPages"
            v-model:splitterRanges="splitterRanges"
            v-model:splitterMode="splitterMode"
            @add-history="addHistory"
            @show-toast="showToast"
            @success="(name) => onActionSuccess(`Tách file ${name} thành công`)"
          />

          <!-- History Tab -->
          <HistoryTab
            v-if="activeTab === 'history'"
            :history="history"
            @delete="onHistoryDelete"
            @view-info="openHistoryModal"
            @download-success="onDownloadSuccess"
            @show-toast="showToast"
          />
        </div>
      </main>

      <!-- History Modal -->
      <HistoryModal
        :show="showHistoryModal"
        :item="selectedHistoryItem"
        @close="showHistoryModal = false"
        @download-success="onDownloadSuccess"
      />

      <!-- Readme Modal -->
      <ReadmeModal :show="showReadmeModal" @close="showReadmeModal = false" />

      <footer class="mt-20 space-y-8">
        <div class="flex flex-col items-center gap-4 text-center">
          <p class="text-text-secondary text-xs max-w-xl leading-relaxed opacity-50">
            Phòng thí nghiệm xử lý tệp tin kỹ thuật số. Toàn bộ logic được thực hiện trực tiếp trong
            môi trường sandbox của trình duyệt, đảm bảo dữ liệu không bao giờ rời khỏi tầm kiểm soát
            của bạn.
          </p>
          <div class="flex gap-1.5 justify-center opacity-30">
            <span v-for="n in 20" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
          </div>
        </div>
      </footer>
    </div>

    <!-- Gooey Toast (Top-Right) -->
    <Teleport to="body">
      <div
        class="fixed top-24 right-6 z-100 transition-all duration-700 pointer-events-none"
        :class="toastVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'"
      >
        <div
          class="relative py-3 px-6 bg-bg-surface border border-border-default flex items-center gap-4 shadow-2xl"
          style="filter: url('#goo')"
        >
          <div
            class="w-1.5 h-full absolute left-0 top-0"
            :class="{
              'bg-green-500': toastType === 'success',
              'bg-accent-sky': toastType === 'info',
              'bg-accent-coral': toastType === 'error',
              'bg-accent-amber': toastType === 'warning',
            }"
          ></div>
          <Icon
            :icon="
              toastType === 'success'
                ? 'lucide:check-circle'
                : toastType === 'error'
                  ? 'lucide:alert-circle'
                  : 'lucide:info'
            "
            class="size-4"
            :class="{
              'text-green-500': toastType === 'success',
              'text-accent-sky': toastType === 'info',
              'text-accent-coral': toastType === 'error',
              'text-accent-amber': toastType === 'warning',
            }"
          />
          <span class="font-display text-[10px] font-bold tracking-widest uppercase">{{
            toastMsg
          }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
