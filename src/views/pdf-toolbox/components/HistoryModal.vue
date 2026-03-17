<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { HistoryItem } from '../types'
import { downloadFile } from '../utils/download'
import { getFileFromDB } from '../utils/storage'

const props = defineProps<{
  show: boolean
  item: HistoryItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'download-success', item: HistoryItem): void
}>()

const pdfUrl = ref<string | null>(null)
const isLoading = ref(false)

const loadFile = async () => {
  if (!props.item) return
  isLoading.value = true
  try {
    const blob = await getFileFromDB(props.item.id)
    if (blob && blob.type === 'application/pdf') {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
      pdfUrl.value = URL.createObjectURL(blob)
    } else {
      pdfUrl.value = null
    }
  } catch (error) {
    console.error('Lỗi tải file preview:', error)
    pdfUrl.value = null
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      loadFile()
    } else if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value)
      pdfUrl.value = null
    }
  },
)

const handleDownload = async () => {
  if (!props.item) return

  try {
    const blob = await getFileFromDB(props.item.id)
    if (blob) {
      await downloadFile(blob, props.item.fileName)
      emit('download-success', props.item)
    }
  } catch (error) {
    console.error('Lỗi download từ modal:', error)
  }
}

const formatSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm" @click="emit('close')"></div>

        <!-- Modal Content -->
        <div
          class="relative w-full max-w-4xl bg-bg-surface border border-border-default shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between p-4 border-b border-border-default bg-bg-elevated"
          >
            <div class="flex items-center gap-3">
              <Icon icon="lucide:file-text" class="size-5 text-accent-sky" />
              <h3
                class="font-display font-bold text-sm tracking-widest uppercase truncate max-w-[200px] sm:max-w-md"
              >
                {{ item?.fileName }}
              </h3>
            </div>
            <button
              @click="emit('close')"
              class="p-1 hover:bg-bg-surface border border-transparent hover:border-border-default transition-colors group"
            >
              <Icon
                icon="lucide:x"
                class="size-5 text-text-secondary group-hover:text-accent-coral"
              />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Sidebar Info -->
            <div class="space-y-6">
              <div class="space-y-1">
                <span
                  class="text-[10px] font-display font-bold text-text-dim uppercase tracking-wider"
                  >Trạng thái</span
                >
                <div class="flex items-center gap-2 text-xs font-bold text-accent-sky italic">
                  <span class="w-1.5 h-1.5 rounded-full bg-accent-sky animate-pulse"></span>
                  Sẵn sàng
                </div>
              </div>

              <div class="space-y-1">
                <span
                  class="text-[10px] font-display font-bold text-text-dim uppercase tracking-wider"
                  >Hành động</span
                >
                <p class="text-xs uppercase">{{ item?.action }}</p>
              </div>

              <div class="space-y-1">
                <span
                  class="text-[10px] font-display font-bold text-text-dim uppercase tracking-wider"
                  >Kích thước</span
                >
                <p class="text-xs">{{ formatSize(item?.fileSize || 0) }}</p>
              </div>

              <div class="space-y-1">
                <span
                  class="text-[10px] font-display font-bold text-text-dim uppercase tracking-wider"
                  >Ngày tạo</span
                >
                <p class="text-xs">{{ item ? new Date(item.date).toLocaleString('vi-VN') : '' }}</p>
              </div>

              <div v-if="item?.downloadCount && item.downloadCount > 0" class="space-y-1">
                <span
                  class="text-[10px] font-display font-bold text-text-dim uppercase tracking-wider"
                  >Lượt tải về</span
                >
                <p class="text-xs font-bold text-accent-sky">{{ item.downloadCount }} lần</p>
              </div>

              <div class="pt-6 border-t border-border-default">
                <button
                  @click="handleDownload"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-sky text-bg-deep font-display font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
                >
                  <Icon icon="lucide:download" class="size-4" />
                  Tải xuống tệp
                </button>
              </div>
            </div>

            <!-- Preview -->
            <div
              class="md:col-span-2 aspect-3/4 md:aspect-auto border border-border-default bg-bg-deep relative overflow-hidden group"
            >
              <div
                v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-bg-deep/50 z-10 backdrop-blur-xs"
              >
                <Icon icon="lucide:loader-2" class="size-8 text-accent-sky animate-spin" />
              </div>

              <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-none"></iframe>
              <div
                v-else-if="!isLoading"
                class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-text-dim p-12 text-center"
              >
                <Icon icon="lucide:eye-off" class="size-12 opacity-20" />
                <p class="text-[10px] font-display uppercase tracking-[0.2em]">
                  Xem trước không khả dụng cho tệp này
                </p>
              </div>

              <!-- Decoration -->
              <div class="absolute top-0 right-0 p-2 opacity-10">
                <Icon icon="lucide:maximize-2" class="size-4" />
              </div>
            </div>
          </div>

          <!-- Decoration Bottom -->
          <div class="h-1 w-full flex">
            <div class="h-full bg-accent-sky flex-1"></div>
            <div class="h-full bg-accent-coral w-1/4"></div>
            <div class="h-full bg-accent-amber w-1/6"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Glass effect for backdrop */
.bg-bg-deep\/80 {
  background-color: rgba(6, 11, 20, 0.8);
}
</style>
