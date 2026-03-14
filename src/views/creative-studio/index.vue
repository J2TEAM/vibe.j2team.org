<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'

const branches = ref(12)
const radius = ref(150)
const complexity = ref(5)
const strokeWidth = ref(1)
const mainColor = ref('#6366f1')
const isRotating = ref(true)

const generateMandala = computed(() => {
  const paths = []
  const angleStep = (Math.PI * 2) / branches.value

  for (let i = 0; i < branches.value; i++) {
    const angle = i * angleStep
    const x2 = 200 + Math.cos(angle) * radius.value
    const y2 = 200 + Math.sin(angle) * radius.value

    const cp1x = 200 + Math.cos(angle + 0.5) * ((radius.value * complexity.value) / 2)
    const cp1y = 200 + Math.sin(angle + 0.5) * ((radius.value * complexity.value) / 2)

    paths.push(`M 200 200 Q ${cp1x} ${cp1y} ${x2} ${y2}`)
  }
  return paths
})

const fullSvgCode = computed(() => {
  const content = generateMandala.value
    .map(
      (p) =>
        `<path d="${p}" fill="none" stroke="${mainColor.value}" stroke-width="${strokeWidth.value}" stroke-linecap="round" />`,
    )
    .join('')
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style="background:black">${content}</svg>`
})

const { copy, copied } = useClipboard()

const randomize = () => {
  branches.value = Math.floor(Math.random() * 20) + 4
  radius.value = Math.floor(Math.random() * 100) + 50
  complexity.value = Math.random() * 5
  mainColor.value = `#${Math.floor(Math.random() * 16777215).toString(16)}`
}

const downloadImage = () => {
  const svgData = fullSvgCode.value
  const canvas = document.createElement('canvas')
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const img = new Image()
  img.onload = () => {
    canvas.width = 800
    canvas.height = 800
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 800, 800)
      ctx.drawImage(img, 0, 0, 800, 800)
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `vibe-mandala-${Date.now()}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
    URL.revokeObjectURL(url)
  }
  img.src = url
}
</script>

<template>
  <div
    class="min-h-screen bg-[#0a0a0c] text-slate-300 font-body overflow-hidden flex flex-col md:flex-row"
  >
    <aside
      class="w-full md:w-80 bg-black/40 border-r border-white/5 p-6 backdrop-blur-xl z-20 overflow-y-auto"
    >
      <header class="mb-10">
        <h1 class="text-2xl font-black italic tracking-tighter text-white uppercase">
          Creative Engine
        </h1>
        <p class="text-[10px] text-slate-500 tracking-[0.3em] uppercase">Vạn Hoa Kỹ Thuật Số</p>
      </header>

      <div class="space-y-8">
        <div class="space-y-4">
          <label class="text-[10px] uppercase font-bold text-indigo-400"
            >Kết cấu đối xứng ({{ branches }})</label
          >
          <input
            v-model.number="branches"
            type="range"
            min="3"
            max="36"
            class="w-full accent-indigo-500"
          />

          <label class="text-[10px] uppercase font-bold text-indigo-400">Độ phức tạp</label>
          <input
            v-model.number="complexity"
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            class="w-full accent-indigo-500"
          />

          <label class="text-[10px] uppercase font-bold text-indigo-400">Độ dày nét</label>
          <input
            v-model.number="strokeWidth"
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            class="w-full accent-indigo-500"
          />
        </div>

        <div class="pt-6 border-t border-white/5 space-y-3">
          <button
            @click="randomize"
            class="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2 text-xs uppercase font-bold"
          >
            <Icon icon="lucide:shuffle" /> Ngẫu hứng
          </button>
          <button
            @click="copy(fullSvgCode)"
            class="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2 text-xs uppercase font-bold"
          >
            <Icon :icon="copied ? 'lucide:check' : 'lucide:code'" />
            {{ copied ? 'Đã copy' : 'Copy SVG' }}
          </button>
          <button
            @click="downloadImage"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2 text-xs uppercase font-bold"
          >
            <Icon icon="lucide:download" /> Tải PNG
          </button>
        </div>
      </div>

      <div class="mt-20">
        <RouterLink
          to="/"
          class="text-[10px] uppercase tracking-widest text-slate-600 hover:text-white flex items-center gap-2"
        >
          <Icon icon="lucide:arrow-left" /> Thoát xưởng vẽ
        </RouterLink>
      </div>
    </aside>

    <main
      class="flex-1 relative flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent"
    >
      <div
        class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"
      ></div>

      <div class="relative w-full max-w-2xl aspect-square flex items-center justify-center">
        <svg
          viewBox="0 0 400 400"
          class="w-full h-full drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-transform duration-700"
          :class="{ 'animate-[spin_20s_linear_infinite]': isRotating }"
        >
          <g v-for="(path, index) in generateMandala" :key="index">
            <path
              :d="path"
              fill="none"
              :stroke="mainColor"
              :stroke-width="strokeWidth"
              stroke-linecap="round"
              class="transition-all duration-500"
            />
          </g>
        </svg>
      </div>

      <div class="absolute bottom-8 right-8 flex gap-4 items-center">
        <button
          @click="isRotating = !isRotating"
          class="p-3 bg-black/50 border border-white/10 rounded-full hover:border-indigo-500 transition text-white"
        >
          <Icon :icon="isRotating ? 'lucide:pause' : 'lucide:play'" class="size-5" />
        </button>
        <div class="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
          <input
            type="color"
            v-model="mainColor"
            class="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
input[type='range'] {
  height: 4px;
  background: #1e1e24;
  border-radius: 2px;
  appearance: none;
}
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: #6366f1;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}
</style>
