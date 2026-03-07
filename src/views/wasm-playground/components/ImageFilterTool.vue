<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const imageSrc = ref<string | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const isProcessing = ref(false)
let photon: any = null

onMounted(async () => {
  try {
    // Import Photon as an ES module from jsDelivr
    // We use version 0.3.3 as recommended
    // @ts-expect-error - CDN import
    const module = await import('https://cdn.jsdelivr.net/npm/@silvia-odwyer/photon@0.3.3/+esm')
    
    // Initialize the WASM module
    if (module.default) {
      await module.default()
    }
    
    photon = module
    isLoading.value = false
  } catch (err) {
    console.error("Photon load failed", err)
  }
})

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageSrc.value = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        if (canvasRef.value) {
          canvasRef.value.width = img.width
          canvasRef.value.height = img.height
          const ctx = canvasRef.value.getContext('2d')
          ctx?.drawImage(img, 0, 0)
        }
      }
      img.src = imageSrc.value
    }
    reader.readAsDataURL(target.files[0])
  }
}

const applyFilter = (filterName: string) => {
  if (!photon || !canvasRef.value) return
  isProcessing.value = true
  
  // Use a small timeout to allow UI to show "processing"
  setTimeout(() => {
    try {
      const canvas = canvasRef.value!
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      
      // Create PhotonImage from canvas
      const photonImg = photon.open_image(canvas, ctx)
      
      if (filterName === 'grayscale') photon.grayscale(photonImg)
      else if (filterName === 'sepia') photon.sepia(photonImg)
      else if (filterName === 'solarize') photon.solarize(photonImg)
      else if (filterName === 'oceanic') photon.filter(photonImg, "oceanic")
      else if (filterName === 'incandescent') photon.filter(photonImg, "incandescent")
      
      // Put back to canvas
      photon.putImageData(canvas, ctx, photonImg)
    } catch (err) {
      console.error("Filter application failed", err)
    } finally {
      isProcessing.value = false
    }
  }, 50)
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      <div class="flex flex-col gap-3">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Trình xử lý ảnh Rust (Photon)</span>
        <div class="flex-1 bg-[rgba(15,15,15,0.7)] border border-[rgba(255,255,255,0.1)] p-4 flex flex-col items-center gap-4 overflow-auto">
          <input type="file" @change="handleImageUpload" class="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-accent-coral file:text-bg-deep cursor-pointer w-full" />
          <canvas ref="canvasRef" class="max-w-full h-auto border border-white/10 rounded shadow-2xl"></canvas>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Bộ lọc WASM</span>
        <div class="grid grid-cols-2 gap-3">
          <button v-for="f in ['grayscale', 'sepia', 'solarize', 'oceanic', 'incandescent']" :key="f" @click="applyFilter(f)" :disabled="isLoading || isProcessing || !imageSrc" class="wasm-btn py-4 uppercase">
            {{ f === 'grayscale' ? 'Màu xám' : f }}
          </button>
        </div>
        <p class="mt-auto text-[10px] text-text-secondary/50 italic leading-relaxed">
          Sử dụng Photon (Rust compiled to WASM) để xử lý pixel ở tốc độ native.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>@import "../styles.css";</style>
