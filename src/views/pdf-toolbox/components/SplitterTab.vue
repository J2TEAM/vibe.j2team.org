<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { PDFDocument } from 'pdf-lib'
import { downloadFile } from '../utils/download'
import { saveFileToDB } from '../utils/storage'
import { PdfSplitter } from '../utils/PdfSplitter'
import type { HistoryItem, SplitterRange } from '../types'

const props = defineProps<{
  splitterFile: File | null
  splitterNumPages: number
  splitterRanges: SplitterRange[]
  splitterMode: 'ranges' | 'single'
}>()

const emit = defineEmits<{
  (e: 'update:splitterFile', file: File | null): void
  (e: 'update:splitterNumPages', num: number): void
  (e: 'update:splitterRanges', ranges: SplitterRange[]): void
  (e: 'update:splitterMode', mode: 'ranges' | 'single'): void
  (e: 'add-history', item: Omit<HistoryItem, 'id' | 'date' | 'downloadCount'>, id: string): void
  (e: 'show-toast', msg: string, type?: 'success' | 'error' | 'info'): void
  (e: 'success', fileName?: string): void
}>()

const isSplitting = ref(false)
const splitResultBlob = ref<Blob | null>(null)
const splitResultFileName = ref('')
const splitterInput = ref<HTMLInputElement | null>(null)

const onSplitterDrop = async (e: DragEvent | Event) => {
  let files: File[] = []
  if (e instanceof DragEvent) {
    files = Array.from(e.dataTransfer?.files || [])
  } else {
    files = Array.from((e.target as HTMLInputElement).files || [])
  }

  if (files.length > 0 && files[0]!.type === 'application/pdf') {
    const file = files[0]!
    emit('update:splitterFile', file)
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pageCount = pdfDoc.getPageCount()
    emit('update:splitterNumPages', pageCount)
    emit('update:splitterRanges', [{ id: '1', start: 1, end: pageCount }])
    splitResultBlob.value = null
  } else if (files.length > 0) {
    emit('show-toast', 'Vui lòng chọn file PDF hợp lệ.', 'error')
  }
}

const handleSplit = async () => {
  if (!props.splitterFile) return
  isSplitting.value = true
  try {
    const { blob, fileName } = await PdfSplitter.split(
      props.splitterFile,
      props.splitterMode,
      props.splitterNumPages,
      props.splitterRanges,
    )

    splitResultBlob.value = blob
    splitResultFileName.value = fileName

    const id = Math.random().toString(36).substring(2, 11)
    await saveFileToDB(id, blob)
    emit(
      'add-history',
      {
        action: 'Tách PDF',
        fileName: fileName,
        fileSize: blob.size,
      },
      id,
    )
    emit('success', fileName)
  } catch (error) {
    console.error('Split failed:', error)
    emit('show-toast', 'Lỗi khi tách PDF. Vui lòng thử lại.', 'error')
  } finally {
    isSplitting.value = false
  }
}

const handleDownloadAndReset = () => {
  if (!splitResultBlob.value) return
  downloadFile(splitResultBlob.value, splitResultFileName.value)
  // Reset state after download
  emit('update:splitterFile', null)
  splitResultBlob.value = null
}

const addRange = () => {
  emit('update:splitterRanges', [
    ...props.splitterRanges,
    { id: Math.random().toString(), start: 1, end: props.splitterNumPages },
  ])
}

const removeRange = (idx: number) => {
  const newRanges = [...props.splitterRanges]
  newRanges.splice(idx, 1)
  emit('update:splitterRanges', newRanges)
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8">
    <div
      v-if="!splitterFile"
      class="border-2 border-dashed border-border-default bg-bg-surface p-12 text-center cursor-pointer hover:border-accent-amber transition-colors"
      @dragover.prevent
      @drop.prevent="onSplitterDrop"
      @click="splitterInput?.click()"
    >
      <input
        type="file"
        ref="splitterInput"
        accept=".pdf"
        class="hidden"
        @change="onSplitterDrop"
      />
      <Icon icon="lucide:scissors" class="size-16 mx-auto mb-6 text-text-dim" />
      <h3 class="font-display text-xl font-bold mb-2 uppercase tracking-wide">
        Chọn tệp PDF để tách
      </h3>
      <p class="text-text-secondary px-8">
        Kéo thả file vào đây để bắt đầu định cấu hình tách trang.
      </p>
    </div>

    <div v-else class="space-y-6">
      <div
        class="border border-border-default bg-bg-surface p-6 flex items-center gap-6 relative overflow-hidden"
      >
        <span
          class="absolute -top-4 -right-2 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
          >PDF</span
        >
        <div class="p-4 bg-bg-elevated border border-border-default">
          <Icon icon="lucide:file-text" class="size-10 text-accent-amber" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-display text-xl font-bold truncate">{{ splitterFile.name }}</h3>
          <p class="text-text-secondary text-sm">
            {{ (splitterFile.size / 1024 / 1024).toFixed(2) }} MB • {{ splitterNumPages }} Trang
          </p>
        </div>
        <button
          @click="emit('update:splitterFile', null)"
          class="p-2 text-text-dim hover:text-accent-coral transition-colors"
          title="Chọn file khác"
        >
          <Icon icon="lucide:refresh-cw" class="size-5" />
        </button>
      </div>

      <div class="border border-border-default bg-bg-surface p-8 space-y-8">
        <div class="flex gap-4 p-1 bg-bg-deep border border-border-default">
          <button
            @click="emit('update:splitterMode', 'ranges')"
            class="flex-1 py-3 text-sm font-display font-bold uppercase transition-all"
            :class="
              splitterMode === 'ranges'
                ? 'bg-accent-amber text-bg-deep'
                : 'text-text-dim hover:text-text-primary'
            "
          >
            Khoảng trang tùy chỉnh
          </button>
          <button
            @click="emit('update:splitterMode', 'single')"
            class="flex-1 py-3 text-sm font-display font-bold uppercase transition-all"
            :class="
              splitterMode === 'single'
                ? 'bg-accent-amber text-bg-deep'
                : 'text-text-dim hover:text-text-primary'
            "
          >
            Mỗi trang 1 file
          </button>
        </div>

        <div v-if="splitterMode === 'ranges'" class="space-y-4">
          <div
            v-for="(range, idx) in splitterRanges"
            :key="range.id"
            class="flex items-center gap-4 group"
          >
            <span class="font-display text-text-dim text-sm w-4">{{ idx + 1 }}</span>
            <input
              type="number"
              v-model.number="range.start"
              :min="1"
              :max="range.end"
              class="w-24 bg-bg-deep border border-border-default p-2 text-center focus:border-accent-amber outline-none"
            />
            <span class="text-text-dim">đến</span>
            <input
              type="number"
              v-model.number="range.end"
              :min="range.start"
              :max="splitterNumPages"
              class="w-24 bg-bg-deep border border-border-default p-2 text-center focus:border-accent-amber outline-none"
            />
            <button
              v-if="splitterRanges.length > 1"
              @click="removeRange(idx)"
              class="p-2 text-text-dim hover:text-accent-coral"
              title="Xóa khoảng"
            >
              <Icon icon="lucide:trash-2" class="size-4" />
            </button>
          </div>
          <button
            @click="addRange"
            class="w-full py-3 border border-dashed border-border-default text-text-dim hover:border-accent-amber hover:text-accent-amber transition-all text-xs uppercase font-bold tracking-widest"
          >
            + Thêm khoảng trang
          </button>
        </div>

        <div v-else class="p-6 bg-bg-elevated border-l-4 border-accent-amber">
          <p class="text-sm text-text-secondary leading-relaxed">
            Hệ thống sẽ tự động tách từng trang của tệp PDF thành một tệp riêng biệt và nén tất cả
            vào một thư mục ZIP để bạn dễ dàng tải xuống.
          </p>
        </div>

        <button
          @click="handleSplit"
          :disabled="isSplitting"
          class="w-full py-4 bg-accent-amber text-bg-deep font-display font-bold uppercase tracking-wider hover:bg-accent-amber/90 disabled:opacity-50 transition-all"
        >
          <span v-if="!isSplitting">Thực hiện tách PDF</span>
          <span v-else class="flex items-center justify-center gap-2">
            <Icon icon="lucide:loader-2" class="size-5 animate-spin" /> Đang xử lý...
          </span>
        </button>
      </div>

      <!-- Split Result -->
      <div
        v-if="splitResultBlob"
        class="animate-fade-up border border-green-500/30 bg-green-500/5 p-8 text-center space-y-4"
      >
        <Icon icon="lucide:check-circle" class="size-16 text-green-500 mx-auto" />
        <h3 class="font-display text-xl font-bold text-green-400">TÁCH THÀNH CÔNG!</h3>
        <div class="max-w-xs mx-auto space-y-2">
          <input
            v-model="splitResultFileName"
            class="w-full bg-bg-deep border border-border-default p-2 text-sm outline-none focus:border-green-500"
          />
          <button
            @click="handleDownloadAndReset"
            class="w-full py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            <Icon icon="lucide:download" class="size-4" /> Tải về ngay
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
