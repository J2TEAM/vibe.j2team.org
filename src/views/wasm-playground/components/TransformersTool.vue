<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref } from 'vue'

const inputText = ref('I just tried out the new WebAssembly tools on J2TEAM and my mind is blown! The performance is absolutely incredible.')
const outputData = ref<any>(null)
const isRunning = ref(false)
const errorMsg = ref('')
const progressMsg = ref('')

const runSentimentAnalysis = async () => {
  if (!inputText.value) return
  
  isRunning.value = true
  errorMsg.value = ''
  outputData.value = null
  progressMsg.value = 'Initializing Transformers.js...'
  
  try {
    // Dynamic import to keep the initial page load light
    // @ts-expect-error - CDN import
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.1/+esm')
    env.allowLocalModels = false
    
    progressMsg.value = 'Loading DistilBERT Model (~65MB, cached after first run)...'
    
    const classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
      progress_callback: (info: any) => {
        if (info.status === 'downloading') {
          progressMsg.value = `Downloading ${info.file}: ${Math.round((info.loaded / info.total) * 100)}%`
        } else if (info.status === 'ready') {
          progressMsg.value = 'Model ready. Analyzing...'
        }
      }
    })
    
    progressMsg.value = 'Analyzing text...'
    const results = await classifier(inputText.value)
    outputData.value = results
  } catch (err: any) {
    errorMsg.value = `Error: ${err.message}`
    console.error(err)
  } finally {
    isRunning.value = false
    progressMsg.value = ''
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-mono uppercase text-text-secondary">Local AI (Transformers.js)</span>
          <button @click="runSentimentAnalysis" :disabled="isRunning || !inputText" class="wasm-btn">
            {{ isRunning ? 'WORKING...' : 'RUN AI' }}
          </button>
        </div>
        <textarea v-model="inputText" spellcheck="false" class="wasm-editor" placeholder="Nhập văn bản tiếng Anh để phân tích cảm xúc (Sentiment Analysis)..."></textarea>
      </div>
      <div class="flex flex-col gap-3">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Model Inference Output</span>
        <div class="wasm-console flex flex-col justify-center">
          <div v-if="isRunning" class="text-accent-coral text-center flex flex-col items-center gap-4 animate-pulse">
            <div>{{ progressMsg }}</div>
            <div class="w-full max-w-xs bg-white/10 h-1 rounded overflow-hidden">
               <div class="bg-accent-coral h-full w-full animate-[pulse_1s_ease-in-out_infinite]"></div>
            </div>
          </div>
          <div v-else-if="errorMsg" class="text-red-400 font-bold">{{ errorMsg }}</div>
          <div v-else-if="!outputData" class="opacity-30 italic text-center">
            The model runs entirely in your browser using WASM. Data never leaves your device.
          </div>
          <div v-else class="flex flex-col items-center justify-center gap-2 h-full text-lg">
             <div class="font-bold text-white text-2xl uppercase">
               {{ outputData[0].label }}
             </div>
             <div class="text-accent-coral">
               Confidence: {{ (outputData[0].score * 100).toFixed(2) }}%
             </div>
             <pre class="mt-4 text-xs text-text-secondary opacity-50">{{ JSON.stringify(outputData, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles.css";
</style>
