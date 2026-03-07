<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const code = ref(`import sys
print("Python version:", sys.version)

def calculate_primes(n):
    primes = []
    for num in range(2, n + 1):
        if all(num % i != 0 for i in range(2, int(num ** 0.5) + 1)):
            primes.append(num)
    return primes

print(f"Primes up to 50: {calculate_primes(50)}")
`)

const output = ref('')
const isRunning = ref(false)
const isLoading = ref(true)
let pyodide: any = null

onMounted(async () => {
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'
  script.async = true
  script.onload = async () => {
    try {
      pyodide = await (window as any).loadPyodide({
        stdout: (text: string) => { output.value += text + '\n' },
        stderr: (text: string) => { output.value += text + '\n' }
      })
      isLoading.value = false
    } catch (err) {
      console.error("Failed to load Pyodide", err)
      output.value = "Failed to load Pyodide. Check console."
    }
  }
  document.head.appendChild(script)
})

const runCode = async () => {
  if (!pyodide) return
  isRunning.value = true
  output.value = ''
  
  try {
    await pyodide.runPythonAsync(code.value)
  } catch (err: any) {
    output.value += `\nError: ${err.message}`
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-mono uppercase text-text-secondary">Python Editor (Pyodide)</span>
          <button @click="runCode" :disabled="isLoading || isRunning" class="wasm-btn">
            {{ isRunning ? 'RUNNING...' : 'RUN PYTHON' }}
          </button>
        </div>
        <textarea v-model="code" spellcheck="false" class="wasm-editor"></textarea>
      </div>
      <div class="flex flex-col gap-3">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Console Output</span>
        <div class="wasm-console">
          <div v-if="isLoading" class="animate-pulse">Downloading Python Runtime (~10MB)...</div>
          <div v-else-if="!output" class="opacity-30 italic">Ready.</div>
          <div v-else>{{ output }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles.css";
</style>
