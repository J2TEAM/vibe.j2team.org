<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SolarTerm } from '../types'
import { getArticle } from '../articles'
import type { Article } from '../articles'

const props = defineProps<{
  term: SolarTerm
}>()

// Lazy-load article data cho theme colors
const articleData = ref<Article | null>(null)

const loadArticle = async () => {
  articleData.value = await getArticle(props.term.name)
}

// Tải article khi component mount hoặc term thay đổi
watch(() => props.term.name, loadArticle, { immediate: true })

const cardRef = ref<HTMLElement | null>(null)
const isGenerating = ref(false)
const cardMode = ref<'card' | 'wallpaper'>('card')

const exportCard = async () => {
  if (!cardRef.value) return
  isGenerating.value = true
  try {
    // Chờ một chút để font chữ và mọi thứ render ổn định
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Dynamic import to avoid bundling html-to-image into the main chunk
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(cardRef.value, {
      quality: 1.0,
      pixelRatio: 3, // Higher quality for wallpapers
      cacheBust: true,
      backgroundColor: '#000',
    })

    const link = document.createElement('a')
    const prefix = cardMode.value === 'card' ? 'TichPhong-Tiet-Khi' : 'TichPhong-Wallpaper'
    link.download = `${prefix}-${props.term.name}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Lỗi khi tạo ảnh:', err)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-6 py-4">
    <!-- Mode Switcher -->
    <div class="flex p-1 bg-white/5 rounded-2xl border border-white/10">
      <button
        @click="cardMode = 'card'"
        :class="[
          'px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all',
          cardMode === 'card'
            ? 'bg-accent-coral text-white shadow-lg'
            : 'text-white/40 hover:text-white/60',
        ]"
      >
        Thiệp chia sẻ
      </button>
      <button
        @click="cardMode = 'wallpaper'"
        :class="[
          'px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all',
          cardMode === 'wallpaper'
            ? 'bg-accent-coral text-white shadow-lg'
            : 'text-white/40 hover:text-white/60',
        ]"
      >
        Hình nền 9:16
      </button>
    </div>

    <!-- The Card Container -->
    <div
      class="relative group p-2 rounded-[3.2rem] bg-white/5 border border-white/10 shadow-3xl overflow-hidden"
    >
      <div
        ref="cardRef"
        :class="[
          'relative overflow-hidden flex flex-col items-center text-center transition-all duration-500',
          cardMode === 'card'
            ? 'w-[400px] h-[600px] p-14 justify-between rounded-[3rem]'
            : 'w-[360px] h-[640px] p-16 justify-center gap-16 rounded-[2rem]',
        ]"
        :style="{
          backgroundColor: articleData?.theme?.bg || '#111',
          color: articleData?.theme?.text || '#fff',
        }"
      >
        <!-- Background Elements -->
        <div
          class="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"
        ></div>
        <div
          class="absolute -bottom-20 -right-20 w-80 h-80 bg-accent-coral/10 blur-[120px] rounded-full"
        ></div>
        <div class="absolute -top-20 -left-20 w-80 h-80 bg-white/5 blur-[100px] rounded-full"></div>

        <!-- Decorative Corners (Only for Card) -->
        <template v-if="cardMode === 'card'">
          <div class="absolute inset-8 border border-white/5 pointer-events-none rounded-2xl"></div>
          <div
            class="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-accent-coral/40"
          ></div>
          <div
            class="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-accent-coral/40"
          ></div>
        </template>

        <div class="z-10">
          <h4 class="font-display text-[9px] tracking-[0.6em] opacity-40 mb-3 uppercase">
            Nhân Gian Tiết Khí
          </h4>
          <div class="w-8 h-[1px] bg-accent-coral mx-auto mb-10"></div>
          <h1
            :class="[
              'font-display font-bold tracking-tighter leading-none transition-all',
              cardMode === 'card' ? 'text-7xl mb-1' : 'text-8xl mb-4',
            ]"
          >
            {{ term.name }}
          </h1>
          <p class="font-chinese text-4xl text-accent-coral/50 my-2">{{ term.chineseName }}</p>
          <p class="font-script text-2xl text-accent-coral/90 mt-2">{{ term.translation }}</p>
        </div>

        <div class="z-10 px-6 max-w-sm">
          <p
            :class="[
              'font-script leading-relaxed italic transition-all opacity-90',
              cardMode === 'card' ? 'text-2xl' : 'text-3xl',
            ]"
            :style="{ color: articleData?.theme?.text || 'inherit' }"
          >
            "{{ term.proverb || term.description }}"
          </p>
          <p
            v-if="cardMode === 'wallpaper'"
            class="mt-8 text-[10px] uppercase tracking-[0.4em] opacity-20 font-mono"
          >
            Tịch Phong Thiên Sơn
          </p>
        </div>

        <div v-if="cardMode === 'card'" class="z-10 flex flex-col items-center gap-6">
          <div class="flex flex-col items-center">
            <div
              class="text-[9px] font-mono tracking-[0.4em] mb-1 uppercase opacity-50"
              :style="{ color: articleData?.theme?.text || 'inherit' }"
            >
              Bắt đầu từ
            </div>
            <div
              class="text-xl font-display font-bold tracking-widest opacity-80"
              :style="{ color: articleData?.theme?.text || 'inherit' }"
            >
              {{ term.displayDate }}
            </div>
          </div>

          <div
            class="w-full max-w-[200px] h-[1px]"
            :style="{ backgroundColor: (articleData?.theme?.text || '#fff') + '40' }"
          ></div>

          <div class="flex flex-col items-center gap-3">
            <span
              class="text-[8px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full bg-accent-coral text-white"
              >Dưỡng Sinh</span
            >
            <p
              class="text-[11px] leading-relaxed max-w-[240px] opacity-70"
              :style="{ color: articleData?.theme?.text || 'inherit' }"
            >
              {{ term.tips }}
            </p>
          </div>
        </div>

        <!-- Logo/Branding (Card only at bottom) -->
        <div
          v-if="cardMode === 'card'"
          class="z-10 pt-4 flex flex-col items-center gap-1 opacity-40"
          :style="{ color: articleData?.theme?.text || 'inherit' }"
        >
          <div class="text-[8px] font-mono tracking-[0.5em] uppercase">CỘNG ĐỒNG TỊCH PHONG</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col items-center gap-3">
      <button
        @click="exportCard"
        :disabled="isGenerating"
        class="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-accent-coral to-red-600 text-white rounded-[2rem] font-bold uppercase tracking-[0.2em] text-xs hover:shadow-[0_20px_40px_rgba(255,107,74,0.3)] hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 shadow-xl"
      >
        <svg
          v-if="!isGenerating"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <div
          v-else
          class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
        ></div>
        {{
          isGenerating
            ? 'Đang kết xuất...'
            : cardMode === 'card'
              ? 'Tải thiệp Tiết Khí'
              : 'Tải hình nền điện thoại'
        }}
      </button>
      <p class="text-[10px] text-white/30 uppercase tracking-widest">
        {{
          cardMode === 'card'
            ? 'Lưu ảnh để chia sẻ với bạn bè'
            : 'Lưu ảnh 9:16 chất lượng cao làm hình nền'
        }}
      </p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap');

.font-chinese {
  font-family: 'ZCOOL XiaoWei', serif;
}

.font-script {
  font-family: var(--font-script);
}
</style>
