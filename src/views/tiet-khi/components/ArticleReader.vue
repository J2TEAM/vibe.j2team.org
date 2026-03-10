<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Article } from '../articles'

const props = defineProps<{
  article: Article
}>()

const activeSectionId = ref('')

const observeSections = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSectionId.value = entry.target.id
        }
      })
    },
    { threshold: 0.5, rootMargin: '-10% 0px -70% 0px' },
  )

  document.querySelectorAll('.article-section').forEach((el) => {
    observer.observe(el)
  })
}

const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let currentAnimController: { resize: (w: number, h: number) => void; stop: () => void } | null =
  null

const loadCanvasAnimation = async (articleName: string) => {
  // Try to load the corresponding animation script
  if (currentAnimController) {
    currentAnimController.stop()
    currentAnimController = null
  }

  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  try {
    // Dynamic import of the extracted canvas function
    // Map string name back to file name e.g. "Lập Xuân" -> "LapXuan"
    const termMap: Record<string, string> = {
      'Lập Xuân': 'LapXuan',
      'Vũ Thủy': 'VuThuy',
      'Kinh Trập': 'KinhTrap',
      'Xuân Phân': 'XuanPhan',
      'Thanh Minh': 'ThanhMinh',
      'Cốc Vũ': 'CocVu',
      'Lập Hạ': 'LapHa',
      'Tiểu Mãn': 'TieuMan',
      'Mang Chủng': 'MangChung',
      'Hạ Chí': 'HaChi',
      'Tiểu Thử': 'TieuThu',
      'Đại Thử': 'DaiThu',
      'Lập Thu': 'LapThu',
      'Xử Thử': 'XuThu',
      'Bạch Lộ': 'BachLo',
      'Thu Phân': 'ThuPhan',
      'Hàn Lộ': 'HanLo',
      'Sương Giáng': 'SuongGiang',
      'Lập Đông': 'LapDong',
      'Tiểu Tuyết': 'TieuTuyet',
      'Đại Tuyết': 'DaiTuyet',
      'Đông Chí': 'DongChi',
      'Tiểu Hàn': 'TieuHan',
      'Đại Hàn': 'DaiHan',
    }

    // Fallback dictionary map to catch matches
    let fileName = ''
    for (const key in termMap) {
      if (articleName.includes(key)) {
        fileName = termMap[key] || ''
        break
      }
    }

    if (fileName) {
      const module = await import(`../articles/animations/${fileName}.ts`)
      if (module && module.initAnimation) {
        currentAnimController = module.initAnimation(canvasRef.value, ctx)
        if (currentAnimController) {
          currentAnimController.resize(window.innerWidth, window.innerHeight)

          // Wrap the window resize handler strictly for this controller
          const resizeHandler = () => {
            currentAnimController?.resize(window.innerWidth, window.innerHeight)
          }
          window.addEventListener('resize', resizeHandler)
          // Store handler on the controller to remove it later
          const oldStop = currentAnimController.stop
          currentAnimController.stop = () => {
            window.removeEventListener('resize', resizeHandler)
            oldStop()
          }
        }
      }
    }
  } catch {
    console.debug('No specific canvas animation found for:', articleName)
  }
}

watch(
  () => props.article,
  (newArticle) => {
    if (newArticle) {
      loadCanvasAnimation(newArticle.title)
    }
  },
)

onMounted(() => {
  observeSections()
  if (props.article) loadCanvasAnimation(props.article.title)
})

onUnmounted(() => {
  if (currentAnimController) currentAnimController.stop()
})

// Feature 2: Global Mouse Tracking for Interactive Canvas Particles
const handleInteraction = (e: MouseEvent | TouchEvent) => {
  let clientX, clientY
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0]!.clientX
    clientY = e.touches[0]!.clientY
  } else {
    clientX = (e as MouseEvent).clientX
    clientY = (e as MouseEvent).clientY
  }

  // Inject into global window object safely so the vanilla JS animations can read it
  ;(window as unknown as { tietkhiMouseX: number; tietkhiMouseY: number }).tietkhiMouseX = clientX
  ;(window as unknown as { tietkhiMouseX: number; tietkhiMouseY: number }).tietkhiMouseY = clientY
}
</script>

<template>
  <div
    class="article-reader-container relative flex flex-col lg:flex-row gap-12 p-6 md:p-12 min-h-full font-serif overflow-hidden transition-colors duration-500"
    @mousemove="handleInteraction"
    @touchmove="handleInteraction"
    :style="{
      backgroundColor: article.theme?.bg || '#0f1923',
      color: article.theme?.text || '#f0ede6',
      '--selection-bg': article.theme?.selectionBg || article.theme?.primary || '#70E000',
      '--selection-text': article.theme?.selectionText || '#ffffff',
    }"
  >
    <!-- Dynamically Injected Visuals Canvas -->
    <canvas ref="canvasRef" class="fixed inset-0 pointer-events-none z-0"></canvas>

    <!-- Sidebar TOC -->
    <aside class="relative z-10 hidden lg:block w-64 sticky top-6 self-start space-y-6">
      <div class="toc-header border-b pb-4" :style="{ borderColor: `${article.theme?.text}20` }">
        <span
          class="text-[10px] uppercase tracking-[0.3em] font-black font-sans"
          :style="{ color: article.theme?.primary }"
        >
          Mục lục
        </span>
      </div>
      <nav class="flex flex-col gap-4">
        <button
          v-for="section in article.sections"
          :key="section.id"
          @click="scrollToSection(section.id)"
          :class="[
            'text-left text-sm transition-all duration-300',
            activeSectionId === section.id
              ? 'pl-4 border-l-2 font-bold'
              : 'border-l pl-4 opacity-40',
          ]"
          :style="{
            color: activeSectionId === section.id ? article.theme?.primary : 'inherit',
            borderColor:
              activeSectionId === section.id ? article.theme?.primary : `${article.theme?.text}10`,
          }"
        >
          {{ section.title }}
        </button>
      </nav>
    </aside>

    <!-- Main Content -->
    <article class="relative z-10 flex-1 max-w-3xl mx-auto space-y-20">
      <header class="text-center space-y-8 animate-fade-in relative">
        <p
          class="text-[11px] uppercase tracking-[0.5em] font-bold font-sans"
          :style="{ color: article.theme?.primary }"
        >
          {{ article.subtitle }}
        </p>
        <h1
          class="text-5xl md:text-7xl font-bold tracking-tight leading-tight relative inline-block"
          :style="{ color: article.theme?.text }"
        >
          {{ article.title }}
          <!-- Floating Decorations -->
          <span
            v-for="(dec, idx) in article.decorations"
            :key="idx"
            class="absolute text-4xl pointer-events-none"
            :class="[`animate-${dec.animation}`]"
            :style="{
              top: dec.position.top,
              right: dec.position.right,
              bottom: dec.position.bottom,
              left: dec.position.left,
            }"
          >
            {{ dec.emoji }}
          </span>
        </h1>
        <div class="w-16 h-0.5 mx-auto" :style="{ backgroundColor: article.theme?.accent }"></div>
        <p
          class="text-2xl font-script italic transform -rotate-1"
          :style="{ color: article.theme?.primary }"
        >
          "{{ article.quote }}"
        </p>
      </header>

      <div class="space-y-24">
        <section
          v-for="section in article.sections"
          :key="section.id"
          :id="section.id"
          class="article-section space-y-8"
        >
          <h2
            class="text-3xl font-bold border-b pb-4"
            :style="{ color: article.theme?.text, borderColor: `${article.theme?.text}10` }"
          >
            {{ section.title }}
          </h2>
          <div
            class="prose prose-lg max-w-none leading-relaxed font-sans font-light whitespace-pre-line opacity-90"
            :style="{ color: article.theme?.text }"
          >
            {{ section.content }}
          </div>
        </section>
      </div>

      <footer
        class="pt-20 border-t text-center"
        :style="{ borderColor: `${article.theme?.text}10` }"
      >
        <p class="text-sm uppercase tracking-[0.3em] font-sans opacity-20">
          © Tịch Phong Thiên Sơn • Nhân Gian Tiết Khí
        </p>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.font-script {
  font-family: 'Dancing Script', cursive;
}

.article-reader-container {
  scrollbar-gutter: stable;
}

.article-reader-container *::selection {
  background-color: var(--selection-bg);
  color: var(--selection-text);
}

h1,
h2 {
  font-family: 'Philosopher', serif;
}

.font-sans {
  font-family: 'Be Vietnam Pro', sans-serif;
}

.animate-fade-in {
  animation: fadeIn 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-bounce {
  animation: bounceSlow 3s infinite;
}

@keyframes bounceSlow {
  0%,
  100% {
    transform: translateY(-5px);
  }
  50% {
    transform: translateY(5px);
  }
}

.animate-spin {
  animation: spinSlow 8s linear infinite;
}

@keyframes spinSlow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-shiver {
  animation: shiver 3s ease-in-out infinite;
}

@keyframes shiver {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

.animate-pulse {
  animation: pulseCustom 2.5s ease-in-out infinite;
}

@keyframes pulseCustom {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

.prose :deep(strong) {
  color: v-bind('article.theme?.accent');
  font-weight: 700;
}
</style>
