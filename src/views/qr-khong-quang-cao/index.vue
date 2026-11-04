<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import { makeQr } from './qr'

const text = ref('https://vibe.j2team.org')
const { copy, copied } = useClipboard()

const rants = [
  'Fuck ads. Quét mã để xem thực đơn mà phải xuyên qua banner, pop-up và nút tải app.',
  'Fuck ads. Trang tạo QR miễn phí lấy cái mã của bạn làm mồi. Quảng cáo mới là món chính.',
  'Cái này vẽ trên máy bạn. Không gọi mạng, không tracker, không chèn trang trung gian.',
]

const drawn = computed(() => {
  if (!text.value) return { grid: null, error: '' }
  try {
    return { grid: makeQr(text.value), error: '' }
  } catch (err) {
    return {
      grid: null,
      error: err instanceof Error ? err.message : 'Không tạo được mã.',
    }
  }
})

const modules = computed(() => drawn.value.grid)
const error = computed(() => drawn.value.error)

const quiet = 4

const cells = computed(() => {
  const grid = modules.value
  if (!grid) return []
  const dots: { i: number; x: number; y: number }[] = []
  grid.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) dots.push({ i: y * grid.length + x, x: x + quiet, y: y + quiet })
    })
  })
  return dots
})

const viewSize = computed(() => {
  const grid = modules.value
  return grid ? grid.length + quiet * 2 : 0
})

function downloadPng(): void {
  const grid = modules.value
  if (!grid) return
  const scale = 8
  const size = (grid.length + quiet * 2) * scale
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#111111'
  grid.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale)
    })
  })
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = 'qr-khong-quang-cao.png'
  link.click()
}

function copyText(): void {
  void copy(text.value)
}
</script>

<template>
  <main class="min-h-screen bg-bg-deep text-text-primary px-4 py-8 sm:px-8">
    <div class="mx-auto max-w-3xl">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-coral mb-8"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Trang chủ
      </RouterLink>

      <header class="animate-fade-up">
        <p class="font-display text-accent-coral text-sm tracking-widest">// QR</p>
        <h1 class="font-display text-4xl sm:text-6xl font-bold tracking-tight mt-2">
          QR không quảng cáo
        </h1>
      </header>

      <ul class="mt-8 space-y-3">
        <li
          v-for="(line, index) in rants"
          :key="index"
          class="bg-bg-surface border border-border-default px-4 py-3 text-text-secondary leading-relaxed animate-fade-up"
          :class="
            index === 0 ? 'animate-delay-1' : index === 1 ? 'animate-delay-2' : 'animate-delay-3'
          "
        >
          {{ line }}
        </li>
      </ul>

      <label class="block mt-8 font-display text-sm text-text-secondary" for="qr-text">
        Chữ hoặc link cần nhét vào mã
      </label>
      <textarea
        id="qr-text"
        v-model="text"
        rows="4"
        class="mt-2 w-full bg-bg-surface border border-border-default px-3 py-3 text-text-primary outline-none focus:border-accent-coral"
        spellcheck="false"
      />

      <div class="mt-6 flex flex-col sm:flex-row gap-6 items-start">
        <div class="bg-white p-3 border border-border-default">
          <svg
            v-if="viewSize"
            :viewBox="`0 0 ${viewSize} ${viewSize}`"
            class="w-56 h-56 sm:w-64 sm:h-64"
            role="img"
            aria-label="Mã QR"
          >
            <rect width="100%" height="100%" fill="#ffffff" />
            <rect
              v-for="cell in cells"
              :key="cell.i"
              :x="cell.x"
              :y="cell.y"
              width="1"
              height="1"
              fill="#111111"
            />
          </svg>
          <p
            v-else
            class="w-56 h-56 sm:w-64 sm:h-64 grid place-items-center text-text-secondary text-sm"
          >
            Gõ gì đó để có mã.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <p v-if="error" class="text-accent-coral">{{ error }}</p>
          <button
            type="button"
            class="bg-accent-coral text-bg-deep font-display font-bold px-4 py-3 disabled:opacity-40"
            :disabled="!modules"
            @click="downloadPng"
          >
            Tải PNG
          </button>
          <button
            type="button"
            class="border border-border-default px-4 py-3 font-display"
            :disabled="!text"
            @click="copyText"
          >
            {{ copied ? 'Đã chép' : 'Chép chữ' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
