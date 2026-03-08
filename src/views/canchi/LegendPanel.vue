<script setup lang="ts">
import { ref } from 'vue'
import type { Laso } from './lib/canchi-engine'

const props = defineProps<{
  laso: Laso
  gridEl?: HTMLDivElement | null
  mode?: 'buttons' | 'content'
  ten?: string
}>()

const emit = defineEmits<{
  toggleLegend: []
}>()

const exporting = ref(false)
const copied = ref(false)

function getFileName() {
  const { input } = props.laso
  const name = (props.ten || 'canchi').replace(/\s+/g, '-').toLowerCase()
  const d = input.ngayDuong || input.ngayAm
  const m = input.thangDuong || input.thangAm
  const y = input.namDuong || input.namAm
  return `${name}-${d}-${m}-${y}`
}

function getLasoJson() {
  return JSON.stringify(props.laso, null, 2)
}

function handleDownloadJson() {
  const json = getLasoJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const name = getFileName()
  link.download = `${name}.json`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

async function handleCopyJson() {
  await navigator.clipboard.writeText(getLasoJson())
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}

async function handleExport() {
  if (!props.gridEl) return
  exporting.value = true
  try {
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(props.gridEl, {
      backgroundColor: '#0F1923',
      pixelRatio: 2,
      style: { transform: 'none' },
    })
    const link = document.createElement('a')
    link.download = `${getFileName()}.png`
    link.href = dataUrl
    link.click()
  } catch {
    alert('Không thể xuất hình ảnh. Vui lòng thử lại.')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <!-- Action buttons -->
  <div v-if="props.mode !== 'content'" class="flex items-center gap-3 justify-center flex-wrap">
    <button class="canchi-btn" @click="emit('toggleLegend')">
      <slot name="legend-icon" />
    </button>
    <button class="canchi-btn" :disabled="exporting" @click="handleExport">
      <template v-if="exporting">
        <svg
          class="w-3.5 h-3.5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Đang xuất...
      </template>
      <template v-else>
        <svg
          class="w-3.5 h-3.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        Tải lá số
      </template>
    </button>
    <button class="canchi-btn" @click="handleDownloadJson">
      <svg
        class="w-3.5 h-3.5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
      Tải JSON
    </button>
    <button class="canchi-btn" @click="handleCopyJson">
      <template v-if="copied">
        <svg
          class="w-3.5 h-3.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Đã copy
      </template>
      <template v-else>
        <svg
          class="w-3.5 h-3.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        Copy JSON
      </template>
    </button>
  </div>

  <!-- Legend Panel content -->
  <div v-if="props.mode !== 'buttons'" class="legend-panel">
    <h3 class="font-display font-bold text-sm mb-3 text-text-primary">📖 Chú thích Lá Số CanChi</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Ngũ Hành -->
      <div>
        <h4
          class="font-display font-semibold text-xs text-text-secondary mb-1.5 uppercase tracking-wider"
        >
          Ngũ Hành (Màu sao)
        </h4>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs">
            <span class="w-3 h-3 rounded-full bg-red-400" /><span class="text-red-400 font-semibold"
              >Hỏa</span
            ><span class="text-text-dim">— Nóng, mạnh, bùng phát</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-3 h-3 rounded-full bg-emerald-400" /><span
              class="text-emerald-400 font-semibold"
              >Mộc</span
            ><span class="text-text-dim">— Sinh trưởng, phát triển</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-3 h-3 rounded-full bg-amber-400" /><span
              class="text-amber-400 font-semibold"
              >Thổ</span
            ><span class="text-text-dim">— Ổn định, trung hòa</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-3 h-3 rounded-full bg-zinc-300" /><span
              class="text-zinc-300 font-semibold"
              >Kim</span
            ><span class="text-text-dim">— Sắc bén, quyết đoán</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-3 h-3 rounded-full bg-sky-400" /><span class="text-sky-400 font-semibold"
              >Thủy</span
            ><span class="text-text-dim">— Linh hoạt, biến đổi</span>
          </div>
        </div>
      </div>

      <!-- Đặc tính -->
      <div>
        <h4
          class="font-display font-semibold text-xs text-text-secondary mb-1.5 uppercase tracking-wider"
        >
          Đặc Tính Sao (M/V/Đ/H/B)
        </h4>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 font-bold text-[10px]"
              >M</span
            ><span class="font-semibold text-text-primary">Miếu</span
            ><span class="text-text-dim">— Vị trí tốt nhất</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 bg-blue-900/50 text-blue-400 font-bold text-[10px]">V</span
            ><span class="font-semibold text-text-primary">Vượng</span
            ><span class="text-text-dim">— Vị trí mạnh</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 bg-purple-900/50 text-purple-400 font-bold text-[10px]"
              >Đ</span
            ><span class="font-semibold text-text-primary">Đắc</span
            ><span class="text-text-dim">— Vị trí khá</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 bg-red-900/50 text-red-400 font-bold text-[10px]">H</span
            ><span class="font-semibold text-text-primary">Hãm</span
            ><span class="text-text-dim">— Vị trí yếu</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 bg-bg-elevated text-text-secondary font-bold text-[10px]"
              >B</span
            ><span class="font-semibold text-text-primary">Bình</span
            ><span class="text-text-dim">— Trung bình</span>
          </div>
        </div>
      </div>

      <!-- Cấu trúc & Tam Phương -->
      <div>
        <h4
          class="font-display font-semibold text-xs text-text-secondary mb-1.5 uppercase tracking-wider"
        >
          Cấu trúc Cung
        </h4>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold text-base text-text-primary">Sao</span
            ><span class="text-text-dim">— Chính tinh (chữ to, đậm)</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="font-semibold text-sm text-text-primary">Sao</span
            ><span class="text-text-dim">— Phụ tinh quan trọng</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="font-normal text-sm text-text-secondary">Sao</span
            ><span class="text-text-dim">— Phụ tinh thường</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-text-dim">Cột trái = Cát tinh</span
            ><span class="text-border-default">|</span
            ><span class="text-text-dim">Cột phải = Hung tinh</span>
          </div>
        </div>
        <h4
          class="font-display font-semibold text-xs text-text-secondary mt-3 mb-1.5 uppercase tracking-wider"
        >
          Tam Phương Tứ Chính
        </h4>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-xs">
            <span class="w-4 h-3 border-2 border-sky-400 bg-sky-400/10 inline-block" /><span
              class="text-text-secondary"
              >Cung đang xem</span
            >
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span
              class="w-4 h-3 border-2 border-accent-coral bg-accent-coral/10 inline-block"
            /><span class="text-text-secondary">Xung Chiếu (đối diện)</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-4 h-3 border-2 border-emerald-400 bg-emerald-400/10 inline-block" /><span
              class="text-text-secondary"
              >Tam Hợp (cách 4 cung)</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
