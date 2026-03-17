<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { PdfMerger } from '../utils/PdfMerger'
import { downloadFile } from '../utils/download'
import { saveFileToDB } from '../utils/storage'
import type { HistoryItem } from '../types'

const props = defineProps<{
  mergerFiles: File[]
}>()

const emit = defineEmits<{
  (e: 'update:mergerFiles', files: File[]): void
  (e: 'add-history', item: Omit<HistoryItem, 'id' | 'date' | 'downloadCount'>, id: string): void
  (e: 'show-toast', msg: string, type?: 'success' | 'error' | 'info'): void
  (e: 'success'): void
}>()

const isMerging = ref(false)
const mergedPdfUrl = ref<string | null>(null)
const mergedBlob = ref<Blob | null>(null)
const mergerDownloadName = ref('merged_document.pdf')
const mergerInput = ref<HTMLInputElement | null>(null)

const onMergerDrop = (e: DragEvent) => {
  const files = Array.from(e.dataTransfer?.files || [])
  const pdfs = files.filter((f) => f.type === 'application/pdf')
  emit('update:mergerFiles', [...props.mergerFiles, ...pdfs])
}

const onFileInputChange = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  const pdfs = files.filter((f) => f.type === 'application/pdf')
  emit('update:mergerFiles', [...props.mergerFiles, ...pdfs])
}

const removeMergerFile = (index: number) => {
  const newFiles = [...props.mergerFiles]
  newFiles.splice(index, 1)
  emit('update:mergerFiles', newFiles)
  resetMergerPreview()
}

const moveFile = (index: number, direction: 'up' | 'down') => {
  const newFiles = [...props.mergerFiles]
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex >= 0 && targetIndex < newFiles.length) {
    const temp = newFiles[index]
    newFiles[index] = newFiles[targetIndex]!
    newFiles[targetIndex] = temp!
    emit('update:mergerFiles', newFiles)
    resetMergerPreview()
  }
}

const resetMergerPreview = () => {
  if (mergedPdfUrl.value) URL.revokeObjectURL(mergedPdfUrl.value)
  mergedPdfUrl.value = null
  mergedBlob.value = null
}

const handleMerge = async () => {
  if (props.mergerFiles.length < 2) return
  isMerging.value = true
  try {
    const mergedBytes = await PdfMerger.merge(props.mergerFiles)
    const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })
    mergedBlob.value = blob
    const url = URL.createObjectURL(blob)
    mergedPdfUrl.value = url

    const id = Math.random().toString(36).substring(2, 11)
    await saveFileToDB(id, blob)
    emit(
      'add-history',
      {
        action: 'Ghép PDF',
        fileName: mergerDownloadName.value,
        details: `${props.mergerFiles.length} tập tin`,
        fileSize: blob.size,
      },
      id,
    )
    emit('success')
  } catch (error) {
    console.error('Merge failed:', error)
    emit('show-toast', 'Lỗi khi ghép PDF. Vui lòng thử lại.', 'error')
  } finally {
    isMerging.value = false
  }
}

const handleDownloadAndReset = () => {
  if (!mergedBlob.value) return
  downloadFile(mergedBlob.value, mergerDownloadName.value)
  // Reset state after download
  emit('update:mergerFiles', [])
  resetMergerPreview()
}

onUnmounted(() => {
  if (mergedPdfUrl.value) URL.revokeObjectURL(mergedPdfUrl.value)
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
    <div class="lg:col-span-2 space-y-6">
      <div
        class="border-2 border-dashed border-border-default bg-bg-surface p-8 text-center cursor-pointer hover:border-accent-coral transition-colors relative"
        @dragover.prevent
        @drop.prevent="onMergerDrop"
        @click="mergerInput?.click()"
      >
        <input
          type="file"
          ref="mergerInput"
          multiple
          accept=".pdf"
          class="hidden"
          @change="onFileInputChange"
        />
        <Icon icon="lucide:upload-cloud" class="size-12 mx-auto mb-4 text-text-dim" />
        <h3 class="font-display font-semibold mb-1">Kéo thả hoặc nhấn để chọn file PDF</h3>
        <p class="text-xs text-text-dim">Chọn ít nhất 2 file để ghép</p>
      </div>

      <div v-if="mergerFiles.length > 0" class="space-y-3">
        <div
          v-for="(file, index) in mergerFiles"
          :key="index"
          class="flex items-center gap-3 p-4 border border-border-default bg-bg-surface group"
        >
          <Icon
            icon="lucide:grip-vertical"
            class="size-4 text-text-dim cursor-grab active:cursor-grabbing shrink-0"
          />
          <Icon icon="lucide:file-text" class="size-5 text-accent-coral shrink-0" />
          <span class="text-sm truncate flex-1">{{ file.name }}</span>

          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click.stop="moveFile(index, 'up')"
              :disabled="index === 0"
              class="p-1 text-text-dim hover:text-accent-amber disabled:opacity-20"
              title="Di chuyển lên"
            >
              <Icon icon="lucide:chevron-up" class="size-4" />
            </button>
            <button
              @click.stop="moveFile(index, 'down')"
              :disabled="index === mergerFiles.length - 1"
              class="p-1 text-text-dim hover:text-accent-amber disabled:opacity-20"
              title="Di chuyển xuống"
            >
              <Icon icon="lucide:chevron-down" class="size-4" />
            </button>
            <button
              @click.stop="removeMergerFile(index)"
              class="p-1 text-text-dim hover:text-accent-coral"
              title="Xóa tệp"
            >
              <Icon icon="lucide:trash-2" class="size-4" />
            </button>
          </div>
        </div>

        <button
          @click="handleMerge"
          :disabled="isMerging || mergerFiles.length < 2"
          class="w-full py-4 bg-accent-coral text-bg-deep font-display font-bold uppercase tracking-wider hover:bg-accent-coral/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span v-if="!isMerging">Hợp nhất ngay</span>
          <span v-else class="flex items-center justify-center gap-2">
            <Icon icon="lucide:loader-2" class="size-5 animate-spin" /> Đang xử lý...
          </span>
        </button>
      </div>
    </div>

    <div class="lg:col-span-3">
      <div
        class="border border-border-default bg-bg-surface h-[600px] flex flex-col relative overflow-hidden"
      >
        <div
          class="flex items-center justify-between p-4 border-b border-border-default bg-bg-elevated"
        >
          <span class="font-display text-xs tracking-widest text-text-dim uppercase"
            >// Bản xem trước</span
          >
          <div v-if="mergedPdfUrl" class="flex items-center gap-2">
            <input
              v-model="mergerDownloadName"
              class="bg-bg-deep border border-border-default px-3 py-1 text-xs outline-none focus:border-accent-coral transition-colors"
            />
            <button
              @click="handleDownloadAndReset"
              class="flex items-center gap-2 bg-accent-amber text-bg-deep px-3 py-1 text-xs font-bold hover:bg-accent-amber/90 transition-colors"
            >
              <Icon icon="lucide:download" class="size-3" /> Tải về
            </button>
          </div>
        </div>
        <div class="flex-1 flex items-center justify-center">
          <iframe v-if="mergedPdfUrl" :src="mergedPdfUrl" class="w-full h-full border-0"></iframe>
          <div v-else class="text-center p-8">
            <Icon icon="lucide:eye-off" class="size-16 mx-auto mb-4 text-bg-elevated" />
            <p class="text-text-dim italic">Hợp nhất file để xem trước kết quả</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
