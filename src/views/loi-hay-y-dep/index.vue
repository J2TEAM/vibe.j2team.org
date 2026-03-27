<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

// Quotes loading
interface Quote {
  text: string
  author: string
}

const quotes = ref<Quote[]>([])
const currentQuote = ref<Quote>({ text: 'Đang tải những lời hay ý đẹp...', author: 'mtdes23' })

const loadQuotes = async () => {
  try {
    const response = await fetch('/loi-hay-y-dep/quotes.json')
    quotes.value = await response.json()
    if (quotes.value.length > 0) {
      nextQuote()
    }
  } catch (error) {
    console.error('Failed to load quotes:', error)
    currentQuote.value = {
      text: 'Kiến thức là kho báu, nhưng thực hành là chìa khóa mở nó.',
      author: 'Lao Tử',
    }
  }
}

// For background particles/effects
const particles = ref<
  Array<{ x: number; y: number; size: number; opacity: number; speed: number }>
>([])

const createParticles = () => {
  for (let i = 0; i < 30; i++) {
    particles.value.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 2,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.05 + 0.01,
    })
  }
}

const updateParticles = () => {
  particles.value.forEach((p) => {
    p.y -= p.speed
    if (p.y < -10) {
      p.y = 110
      p.x = Math.random() * 100
    }
  })
}

let animationFrame: number
onMounted(() => {
  loadQuotes()
  createParticles()
  const animate = () => {
    updateParticles()
    animationFrame = requestAnimationFrame(animate)
  }
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
})

const nextQuote = () => {
  if (quotes.value.length === 0) return
  let nextIndex
  do {
    nextIndex = Math.floor(Math.random() * quotes.value.length)
  } while (quotes.value.length > 1 && quotes.value[nextIndex]?.text === currentQuote.value.text)

  currentQuote.value = quotes.value[nextIndex]!
}
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-slate-950 font-body text-white selection:bg-teal-500/30"
  >
    <!-- Main Content -->
    <div
      class="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 overflow-hidden px-6 py-12"
    >
      <!-- Background Particles -->
      <div
        v-for="(p, index) in particles"
        :key="index"
        class="pointer-events-none absolute rounded-full bg-teal-400/20 blur-[1px]"
        :style="{
          left: p.x + '%',
          top: p.y + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          opacity: p.opacity,
        }"
      ></div>

      <!-- Ambient Glows -->
      <div
        class="pointer-events-none absolute -top-[10%] -left-[10%] size-[500px] rounded-full bg-teal-900/20 blur-[120px]"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-[10%] -right-[10%] size-[500px] rounded-full bg-indigo-900/20 blur-[120px]"
      ></div>

      <!-- Quote Container -->
      <div
        class="w-full max-w-3xl transform rounded-[2rem] border border-white/5 bg-white/5 p-8 backdrop-blur-xl transition-all duration-700 md:p-12 hover:bg-white/10 hover:shadow-2xl hover:shadow-teal-500/5"
      >
        <Icon icon="fa-solid:quote-left" class="mb-4 text-3xl text-teal-400 opacity-50" />

        <h1
          class="mb-8 text-2xl font-medium leading-relaxed tracking-wide font-display md:text-4xl"
          :key="currentQuote.text"
        >
          {{ currentQuote.text }}
        </h1>

        <div class="flex items-center justify-between border-t border-white/10 pt-6">
          <div class="flex flex-col">
            <span class="text-sm font-light uppercase tracking-[0.2em] text-teal-400">Tác giả</span>
            <span class="text-lg font-medium text-white/90">{{ currentQuote.author }}</span>
          </div>

          <button
            @click="nextQuote"
            class="group flex size-14 items-center justify-center rounded-full bg-teal-500 text-slate-950 transition-all hover:scale-110 hover:bg-teal-400 active:scale-95 shadow-lg shadow-teal-500/20"
            title="Câu tiếp theo"
          >
            <Icon
              icon="lucide:refresh-cw"
              class="size-6 transition-transform group-hover:rotate-180 duration-500"
            />
          </button>
        </div>
      </div>

      <!-- Footer Branding -->
      <div class="mt-auto pt-16 text-center text-white/30">
        <p class="text-[10px] font-medium tracking-[0.3em] uppercase mb-1">Designed by mtdes23</p>
        <a
          href="https://www.mtdes23.id.vn"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[9px] hover:text-teal-400 hover:underline"
        >
          www.mtdes23.id.vn
        </a>
      </div>
    </div>

    <!-- Back to home -->
    <RouterLink
      to="/"
      class="fixed bottom-6 left-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-5 py-2.5 text-xs font-medium backdrop-blur-md transition-all hover:border-teal-500/30 hover:bg-black/60 group"
    >
      <Icon
        icon="lucide:chevron-left"
        class="size-4 transition-transform group-hover:-translate-x-1"
      />
      <span>TRANG CHỦ</span>
    </RouterLink>
  </div>
</template>
