<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{
  open: boolean
  code: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  'update:code': [value: string]
}>()

const fileError = ref('')
const busy = ref(false)
const busyLabel = ref('')

async function importFile(event: Event) {
  fileError.value = ''
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return
  busy.value = true
  busyLabel.value = 'Đang đọc file...'
  try {
    const text = await file.text()
    emit('update:code', text)
  } catch {
    fileError.value = 'Không đọc được file.'
  } finally {
    busy.value = false
    busyLabel.value = ''
    if (input) input.value = ''
  }
}
</script>

<template>
  <section
    v-if="props.open"
    class="absolute inset-0 z-[60] grid place-items-center bg-bg-deep/85 p-4"
  >
    <div class="w-full max-w-2xl border border-border-default bg-bg-surface p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-display text-sm uppercase tracking-wider text-text-primary">
          Import mã bùa
        </h3>
        <button
          class="border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="emit('close')"
        >
          Đóng
        </button>
      </div>
      <label class="mb-3 block">
        <span class="mb-1 block text-xs uppercase tracking-wider text-text-dim">Import file</span>
        <input
          type="file"
          accept=".txt,text/plain"
          class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary file:mr-3 file:border-0 file:bg-bg-surface file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-wider file:text-text-primary"
          @change="importFile"
        />
        <p v-if="fileError" class="mt-1 text-xs text-accent-amber">{{ fileError }}</p>
      </label>
      <div v-if="busy" class="mb-3 border border-border-default bg-bg-elevated px-3 py-2">
        <p class="text-[11px] uppercase tracking-wider text-text-dim">// {{ busyLabel }}</p>
        <div class="mt-1 h-1 w-full border border-border-default bg-bg-surface">
          <div class="h-full w-[60%] animate-pulse bg-accent-amber" />
        </div>
      </div>
      <textarea
        :value="props.code"
        rows="8"
        class="w-full border border-border-default bg-bg-elevated px-3 py-2 font-mono text-xs"
        placeholder="Dán mã dạng BUA-S1.xxxxx hoặc BUA-D2.xxxxx"
        @input="emit('update:code', ($event.target as HTMLTextAreaElement).value)"
      />
      <button
        class="mt-3 w-full border border-accent-amber bg-accent-amber/15 px-3 py-2 text-left text-sm text-accent-amber transition hover:bg-accent-amber/25"
        @click="emit('confirm')"
      >
        Nạp mã
      </button>
    </div>
  </section>
</template>
