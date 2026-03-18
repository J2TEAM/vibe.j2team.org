<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

const emit = defineEmits<{
  close: []
  import: [code: string]
  importImage: [file: File]
}>()

const importText = ref('')
const importError = ref('')

function handleImport() {
  importError.value = ''
  if (!importText.value.trim()) {
    importError.value = 'Vui lòng dán mã SVG hoặc chọn file'
    return
  }
  emit('import', importText.value)
}

function handleFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  if (file.type === 'image/svg+xml') {
    const reader = new FileReader()
    reader.onload = () => {
      importText.value = reader.result as string
      handleImport()
    }
    reader.readAsText(file)
  } else if (file.type.startsWith('image/')) {
    emit('importImage', file)
  } else {
    importError.value = 'Định dạng file không được hỗ trợ. Vui lòng chọn .svg, .png, .jpg hoặc .webp'
  }
  input.value = ''
}

function setError(msg: string) {
  importError.value = msg
}

defineExpose({ setError })
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="emit('close')">
    <div class="w-full max-w-2xl bg-bg-surface border border-border-default flex flex-col shadow-2xl overflow-hidden animate-fade-up">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-deep/50">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:upload" class="size-4 text-accent-sky" />
          <h3 class="font-display font-semibold tracking-wide uppercase text-xs">Nhập SVG / Ảnh (Import)</h3>
        </div>
        <button class="p-1.5 text-text-secondary hover:text-accent-coral transition-colors" @click="emit('close')">
          <Icon icon="lucide:x" class="size-4" />
        </button>
      </div>
      
      <div class="p-4 space-y-4">
        <p class="text-text-secondary text-sm">
          Dán mã SVG hoặc tải file <code class="text-accent-amber font-mono">.svg</code>, <code class="text-accent-amber font-mono">.png</code>, <code class="text-accent-amber font-mono">.jpg</code> để import.
        </p>
        
        <textarea
          v-model="importText"
          class="w-full bg-bg-deep border border-border-default p-4 font-mono text-xs text-text-primary placeholder:text-text-dim/30 focus:border-accent-sky focus:ring-1 focus:ring-accent-sky/30 outline-none resize-none transition-all duration-300"
          rows="10"
          placeholder="<svg viewBox='0 0 24 24'>&#10;  <path d='M...' fill='currentColor' />&#10;</svg>"
        />
        
        <div v-if="importError" class="text-accent-coral text-xs flex items-center gap-2 bg-accent-coral/10 p-2 rounded-sm border border-accent-coral/20">
          <Icon icon="lucide:alert-circle" class="size-3.5 shrink-0" />
          {{ importError }}
        </div>
        
        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-3">
            <button
              class="flex items-center gap-2 px-6 py-2 bg-accent-sky text-bg-deep text-sm font-display font-bold transition-all hover:bg-accent-sky/80 hover:scale-[1.02] active:scale-[0.98]"
              @click="handleImport"
            >
              <Icon icon="lucide:check" class="size-4" />
              NHẬP (IMPORT)
            </button>
            
            <label class="flex items-center gap-2 px-4 py-2 border border-border-default bg-bg-elevated/50 text-text-primary text-sm font-display font-semibold transition-all hover:bg-accent-amber hover:text-bg-deep hover:border-accent-amber cursor-pointer group">
              <Icon icon="lucide:file-up" class="size-4 group-hover:animate-bounce" />
              CHỌN FILE
              <input type="file" accept=".svg,image/*" class="sr-only" @change="handleFile" />
            </label>
          </div>
          
          <div class="text-[10px] text-text-dim uppercase tracking-widest font-display italic">
            Tối đa 5MB (Max 5MB)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
