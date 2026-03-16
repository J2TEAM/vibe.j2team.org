<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  mode: 'style' | 'drawing'
  code: string
  defaultFileName: string
}>()

const emit = defineEmits<{
  close: []
}>()

const fileName = ref('')
const toastText = ref('')
let toastTimeout = 0
const busy = ref(false)
const busyLabel = ref('')
const busyProgress = ref(0)

function clearToast() {
  toastText.value = ''
  if (toastTimeout) {
    window.clearTimeout(toastTimeout)
    toastTimeout = 0
  }
}

function showToast(text: string) {
  toastText.value = text
  if (toastTimeout) window.clearTimeout(toastTimeout)
  toastTimeout = window.setTimeout(() => {
    toastText.value = ''
    toastTimeout = 0
  }, 1400)
}

function sanitizeFileBaseName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
  return cleaned || 'bua'
}

const downloadName = computed(() => `${sanitizeFileBaseName(fileName.value)}.txt`)

async function copyCode() {
  if (!props.code) return
  busy.value = true
  busyLabel.value = 'Đang copy...'
  busyProgress.value = 35
  try {
    await navigator.clipboard.writeText(props.code)
    busyProgress.value = 100
    showToast('Đã copy mã.')
  } catch {
    showToast('Không copy được tự động.')
  } finally {
    window.setTimeout(() => {
      busy.value = false
      busyLabel.value = ''
      busyProgress.value = 0
    }, 350)
  }
}

function downloadFile() {
  if (!props.code) return
  busy.value = true
  busyLabel.value = 'Đang tạo file...'
  busyProgress.value = 45
  const blob = new Blob([props.code], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadName.value
  a.click()
  URL.revokeObjectURL(url)
  busyProgress.value = 100
  showToast('Đã tạo file .txt.')
  window.setTimeout(() => {
    busy.value = false
    busyLabel.value = ''
    busyProgress.value = 0
  }, 350)
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      clearToast()
      busy.value = false
      busyLabel.value = ''
      busyProgress.value = 0
      return
    }
    clearToast()
    fileName.value = props.defaultFileName
  },
)
</script>

<template>
  <section
    v-if="props.open"
    class="absolute inset-0 z-[60] grid place-items-center bg-bg-deep/85 p-4"
  >
    <div class="w-full max-w-2xl border border-border-default bg-bg-surface p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-display text-sm uppercase tracking-wider text-text-primary">
          {{ props.mode === 'style' ? 'Mã style đã tạo' : 'Mã nét vẽ đã tạo' }}
        </h3>
        <div class="flex items-center gap-2">
          <button
            class="grid size-9 place-items-center border border-border-default text-text-secondary transition hover:border-accent-sky hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Copy mã"
            title="Copy mã"
            @click="copyCode"
          >
            <Icon icon="lucide:copy" class="size-4" />
          </button>
          <button
            class="border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="emit('close')"
          >
            Đóng
          </button>
        </div>
      </div>
      <textarea
        :value="props.code"
        rows="8"
        readonly
        class="w-full border border-border-default bg-bg-elevated px-3 py-2 font-mono text-xs"
      />

      <div class="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label class="block">
          <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim">Tên file</span>
          <div class="flex items-center gap-2">
            <input
              v-model="fileName"
              type="text"
              class="min-w-0 flex-1 border border-border-default bg-bg-elevated px-3 py-2 text-sm"
              placeholder="Ví dụ: Bùa hộ thể cá nhân"
            />
            <span class="text-xs text-text-dim">.txt</span>
          </div>
        </label>

        <button
          class="w-full border border-accent-coral bg-accent-coral/15 px-3 py-2 text-left text-sm text-accent-coral transition hover:bg-accent-coral/25 sm:w-auto"
          @click="downloadFile"
        >
          Xuất file
        </button>
      </div>

      <p
        v-if="toastText"
        class="mt-3 border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary"
      >
        {{ toastText }}
      </p>

      <div v-if="busy" class="mt-3 border border-border-default bg-bg-elevated px-3 py-2">
        <p class="text-[11px] uppercase tracking-wider text-text-dim">// {{ busyLabel }}</p>
        <div class="mt-1 h-1 w-full border border-border-default bg-bg-surface">
          <div
            class="h-full bg-accent-sky transition-[width] duration-200"
            :style="{ width: `${busyProgress}%` }"
          />
        </div>
      </div>
    </div>
  </section>
</template>
