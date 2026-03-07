<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const imageSrc = ref<string | null>(null)
const outputText = ref('')
const isRunning = ref(false)
const isLoading = ref(true)
const progress = ref(0)
const status = ref('')

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/tesseract.js@v5.0.4/dist/tesseract.min.js'
  script.async = true
  script.onload = () => {
    isLoading.value = false
  }
  document.head.appendChild(script)
})

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    imageSrc.value = URL.createObjectURL(file)
    outputText.value = ''
  }
}

const runOcr = async () => {
  const Tesseract = (window as any).Tesseract
  if (!imageSrc.value || !Tesseract) return
  
  isRunning.value = true
  outputText.value = ''
  progress.value = 0
  
  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => {
        status.value = m.status
        if (m.status === 'recognizing text') {
          progress.value = Math.round(m.progress * 100)
        }
      }
    })
    
    const { data: { text } } = await worker.recognize(imageSrc.value)
    outputText.value = text
    await worker.terminate()
  } catch (err: any) {
    outputText.value = `Error: ${err.message}`
  } finally {
    isRunning.value = false
    status.value = 'Done'
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-mono uppercase text-text-secondary">Image Input (Tesseract.js)</span>
          <button @click="runOcr" :disabled="isLoading || isRunning || !imageSrc" class="wasm-btn">
            {{ isRunning ? 'SCANNING...' : 'EXTRACT TEXT' }}
          </button>
        </div>
        <div class="flex-1 bg-[rgba(15,15,15,0.7)] border border-[rgba(255,255,255,0.1)] p-4 flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <input type="file" accept="image/*" @change="handleImageUpload" class="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-accent-coral file:text-bg-deep hover:file:opacity-90 cursor-pointer" />
          <img v-if="imageSrc" :src="imageSrc" class="max-h-[200px] object-contain border border-border-default/30 rounded" />
          <div v-else class="text-text-secondary/50 italic text-sm">Select an image to scan</div>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Extracted Text</span>
        <div class="wasm-console">
          <div v-if="isLoading" class="animate-pulse">Loading Tesseract Core...</div>
          <div v-else-if="isRunning" class="text-accent-coral">
            Processing: {{ status }} ({{ progress }}%)
            <div class="w-full bg-white/10 h-1 mt-2 rounded overflow-hidden">
              <div class="bg-accent-coral h-full transition-all duration-200" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
          <div v-else-if="!outputText" class="opacity-30 italic">Extracted text will appear here.</div>
          <div v-else class="text-white whitespace-pre-wrap">{{ outputText }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles.css";
</style>
