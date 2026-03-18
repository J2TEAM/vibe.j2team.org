<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useEventListener, useIntervalFn } from '@vueuse/core'
import { RouterLink } from 'vue-router'
import type { SolarTerm } from './types'
import { solarTermsData } from './data/solarTerms'
import { useSolarTermNavigation } from './composables/useSolarTermNavigation'
import GlobalBackground from './components/GlobalBackground.vue'
import SolarWheel from './components/SolarWheel.vue'
import AudioController from './components/AudioController.vue'
import LinhKhiCalculator from './components/LinhKhiCalculator.vue'
import PremiumDatePicker from './components/PremiumDatePicker.vue'
import TermDetailModal from './components/TermDetailModal.vue'
import { downloadICS } from './utils/icsExporter'
import { getLunarFromDisplayDate } from './utils/lunarCalendar'

const solarTerms = ref<SolarTerm[]>(solarTermsData)

const {
  searchQuery,
  selectedSeason,
  selectedDate,
  activeTermIndex,
  currentSeason,
  nextTermCountdown,
  filteredTerms,
  handleTermSelect,
  getSeasonColor,
} = useSolarTermNavigation(solarTerms)

const showModal = ref(false)
const activeTerm = ref<SolarTerm | null>(null)

const openDetail = (term: SolarTerm) => {
  activeTerm.value = term
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = 'auto'
}

// Xuất lịch .ics
const exportCalendar = () => {
  downloadICS(solarTerms.value, new Date().getFullYear())
}

const isScrolled = ref(false)

useEventListener(window, 'scroll', () => {
  isScrolled.value = window.scrollY > 50
})

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showModal.value) {
    closeModal()
  }
})

const isZenMode = ref(false)
const toggleZenMode = () => {
  isZenMode.value = !isZenMode.value
  if (isZenMode.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    nextTick(() => {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-revealed')
      })
    })
  }
}

// Day/Night Cycle Theming
const currentHour = ref(new Date().getHours())

const timeTheme = computed(() => {
  const h = currentHour.value
  if (h >= 5 && h < 9) return 'theme-dawn'
  if (h >= 9 && h < 16) return 'theme-day'
  if (h >= 16 && h < 19) return 'theme-dusk'
  return 'theme-night'
})

useIntervalFn(() => {
  currentHour.value = new Date().getHours()
}, 60000)

// IntersectionObserver (tái sử dụng, không leak)
let sectionObserver: IntersectionObserver | null = null

const observeSections = () => {
  sectionObserver?.disconnect()
  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  )

  document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    sectionObserver!.observe(el)
  })
}

watch(
  filteredTerms,
  () => {
    nextTick(() => {
      observeSections()
    })
  },
  { deep: true },
)

onMounted(() => {
  selectedDate.value = new Date().toISOString().slice(0, 10)
  document.title = 'Tra cứu 24 Tiết Khí - Nhân Gian Tiết Khí'
  nextTick(() => {
    observeSections()
  })
})

onUnmounted(() => {
  sectionObserver?.disconnect()
  document.body.style.overflow = 'auto'
})
</script>

<template>
  <div
    :class="[
      'tiet-khi-wrapper min-h-screen text-text-primary font-body overflow-x-hidden selection:bg-accent-coral/30 transition-colors duration-1000 relative',
      timeTheme,
    ]"
  >
    <!-- Global Ambient Effects -->
    <GlobalBackground :season="currentSeason" />
    <AudioController :termName="solarTerms[activeTermIndex]?.name || 'Lập Xuân (立春)'" />

    <!-- Top Navigation -->
    <header
      v-show="!isZenMode"
      :class="[
        'fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-500 border-b border-white/5',
        isScrolled ? 'py-3 bg-black/80 backdrop-blur-2xl shadow-2xl' : 'py-6 bg-transparent',
      ]"
    >
      <div class="max-w-7xl mx-auto flex justify-between items-center w-full">
        <RouterLink
          to="/"
          class="group flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <span class="group-hover:-translate-x-1 transition-transform">&larr;</span>
          <span class="hidden sm:inline">Về trang chủ</span>
        </RouterLink>
        <div class="flex flex-col items-center">
          <h2
            :class="[
              'font-display font-bold tracking-widest transition-all duration-500',
              isScrolled ? 'text-lg' : 'text-2xl',
            ]"
            class="bg-clip-text text-transparent bg-gradient-to-r from-accent-coral via-white to-emerald-400"
          >
            TIẾT KHÍ
          </h2>
          <span
            v-if="!isScrolled"
            class="text-[10px] uppercase tracking-[0.3em] opacity-30 font-mono"
            >24 Tiết Khí</span
          >
        </div>
        <div class="w-24 hidden md:block text-right">
          <span class="text-[10px] uppercase tracking-[0.3em] opacity-20 font-mono"
            >Tịch Phong</span
          >
        </div>
      </div>
    </header>

    <!-- Phase 3: Persona Calculator -->
    <LinhKhiCalculator :terms="solarTerms" />

    <main class="pt-32 pb-24 px-4 max-w-7xl mx-auto relative z-10">
      <!-- Hero -->
      <div class="relative mb-20 sm:mb-32 flex flex-col items-center text-center pt-6 sm:pt-10">
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-accent-coral/5 blur-[120px] rounded-full -z-10"
        ></div>

        <div class="reveal-on-scroll">
          <h1
            class="font-display text-4xl sm:text-6xl md:text-8xl font-black mb-8 sm:mb-12 tracking-tighter leading-none"
          >
            Nhân Gian <br />
            <span
              class="text-transparent bg-clip-text bg-gradient-to-b from-accent-coral to-red-600"
              >Tiết Khí</span
            >
          </h1>
        </div>

        <!-- Solar Wheel Interaction -->
        <div
          class="mb-20 transform hover:scale-[1.02] transition-transform duration-700 reveal-on-scroll"
          style="animation-delay: 0.2s"
        >
          <SolarWheel
            :terms="solarTerms"
            :activeIndex="activeTermIndex"
            @select="handleTermSelect"
          />
        </div>

        <div class="reveal-on-scroll" style="animation-delay: 0.4s">
          <p
            v-if="solarTerms[activeTermIndex]?.proverb"
            class="font-script text-xl sm:text-3xl md:text-5xl text-accent-coral mb-6 sm:mb-10 italic opacity-90 leading-tight"
          >
            "{{ solarTerms[activeTermIndex]?.proverb }}"
          </p>
          <p
            v-if="!isZenMode"
            class="text-text-secondary text-lg max-w-2xl mx-auto font-light leading-relaxed"
          >
            Xoay vòng quay thiên văn để khám phá 24 nhịp thở của đất trời. <br />
            Khám phá sự thay đổi của tự nhiên và lời khuyên dưỡng sinh nghìn năm.
          </p>

          <!-- Time Pulse Widget -->
          <div
            v-if="!isZenMode"
            class="mt-8 inline-block px-8 py-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] text-accent-coral/80 animate-pulse"
          >
            {{ nextTermCountdown }}
          </div>
        </div>

        <!-- Scroll Indicator -->
        <div
          v-if="!isZenMode"
          class="mt-20 flex flex-col items-center gap-4 opacity-30 animate-bounce"
        >
          <span class="text-[8px] uppercase tracking-[0.5em]">Khám phá</span>
          <div class="w-px h-12 bg-gradient-to-b from-accent-coral to-transparent"></div>
        </div>
      </div>

      <!-- Zen Mode Toggle -->
      <button
        @click="toggleZenMode"
        class="fixed bottom-6 left-4 sm:bottom-36 sm:right-[236px] sm:left-auto z-[100] p-3 sm:p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-accent-coral/60 hover:text-accent-coral hover:scale-110 transition-all shadow-2xl group cursor-pointer"
        :title="isZenMode ? 'Thoát chế độ Thiền' : 'Chế độ Thiền (Zen Mode)'"
      >
        <svg
          v-if="!isZenMode"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="group-hover:rotate-12 transition-transform"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="animate-pulse"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
        <span
          class="absolute right-full mr-4 px-3 py-1 bg-black/80 text-[10px] uppercase tracking-widest text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-2xl border border-white/10"
        >
          {{ isZenMode ? 'Thoát Thiền' : 'Thiền định' }}
        </span>
      </button>

      <!-- Controls -->
      <div v-show="!isZenMode" class="sticky top-20 sm:top-24 z-40 mb-12 sm:mb-20 reveal-on-scroll">
        <div
          class="flex flex-col lg:flex-row gap-3 sm:gap-4 justify-center items-stretch lg:items-center bg-bg-surface/30 backdrop-blur-3xl p-3 sm:p-4 rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl"
        >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm tiết khí..."
            class="flex-1 bg-black/20 border border-white/10 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl focus:outline-none focus:border-accent-coral/50 transition-all font-light text-sm sm:text-base"
          />
          <div class="relative group">
            <PremiumDatePicker v-model="selectedDate" placeholder="Chọn ngày tra cứu..." />
          </div>
          <div
            class="flex p-1 bg-black/30 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide"
          >
            <button
              v-for="season in ['Xuân', 'Hạ', 'Thu', 'Đông']"
              :key="season"
              @click="selectedSeason = selectedSeason === season ? null : season"
              :class="[
                'px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
                selectedSeason === season
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/40 hover:text-white/60',
              ]"
            >
              {{ season }}
            </button>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div v-show="!isZenMode" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div
          v-for="(term, index) in filteredTerms"
          :key="term.id"
          :id="`term-${term.id}`"
          :class="[
            'group relative rounded-[2.5rem] transition-all duration-700 h-full reveal-on-scroll',
            term.id === solarTerms[activeTermIndex]?.id
              ? 'scale-105 z-20'
              : 'opacity-80 hover:opacity-100 hover:scale-[1.02]',
          ]"
          :style="{ transitionDelay: `${(index % 24) * 0.05}s` }"
        >
          <div
            v-if="term.id === solarTerms[activeTermIndex]?.id"
            class="absolute -inset-1 bg-gradient-to-br from-accent-coral to-accent-coral/0 rounded-[2.6rem] blur-2xl opacity-20 animate-pulse"
          ></div>
          <div
            class="relative bg-bg-surface/20 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] h-full flex flex-col items-center text-center shadow-xl transition-all"
          >
            <div class="absolute top-6 right-8 text-right">
              <div class="text-xs font-mono opacity-40">{{ term.displayDate }}</div>
              <div class="text-[11px] font-mono text-accent-coral/50">
                {{ getLunarFromDisplayDate(term.displayDate) }}
              </div>
            </div>
            <div
              :class="[
                'text-[9px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border mb-8 font-black bg-gradient-to-br',
                getSeasonColor(term.season),
              ]"
            >
              Tiết {{ term.season }}
            </div>
            <h3
              :class="[
                'text-5xl font-display font-bold mb-2',
                term.id === solarTerms[activeTermIndex]?.id ? 'text-accent-coral' : 'text-white',
              ]"
            >
              {{ term.name }}
            </h3>
            <p
              class="text-2xl md:text-3xl text-white/50 mt-1 uppercase tracking-widest font-chinese"
            >
              {{ term.chineseName }}
            </p>
            <p class="text-xs italic text-text-secondary opacity-40 mb-8">{{ term.translation }}</p>
            <p class="text-base text-white/70 leading-relaxed font-light mb-8">
              {{ term.description }}
            </p>
            <button
              @click="openDetail(term)"
              class="mt-auto text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 hover:text-accent-coral transition-all flex items-center gap-2"
            >
              XEM CHI TIẾT
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- About Section -->
      <section
        v-show="!isZenMode"
        class="mt-40 mb-32 max-w-4xl mx-auto text-center px-10 py-24 bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 relative overflow-hidden group reveal-on-scroll"
      >
        <div
          class="absolute top-0 right-0 w-96 h-96 bg-accent-coral/10 blur-[120px] rounded-full -z-10 group-hover:bg-accent-coral/20 transition-all duration-1000"
        ></div>
        <div
          class="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full -z-10"
        ></div>

        <h2 class="font-display text-5xl font-bold mb-10 text-white tracking-tight">
          Về Nhân Gian Tiết Khí
        </h2>
        <div class="w-20 h-[1.5px] bg-accent-coral mx-auto mb-12"></div>
        <div class="space-y-8 text-text-secondary leading-loose font-light text-xl">
          <p>
            Hệ thống <strong>24 Tiết Khí</strong> là di sản văn hóa phi vật thể quý báu, phản ánh sự
            vận hành tinh vi của vũ trụ và nhịp thở của thiên nhiên. Ứng dụng này được ra đời với
            mong muốn mang đến một cái nhìn mới mẻ, hiện đại nhưng vẫn giữ trọn vẹn bản sắc truyền
            thống.
          </p>
          <p>
            Tại đây, bạn không chỉ tra cứu ngày tháng, mà còn được đắm mình trong
            <em>Không gian Đa giác quan</em>: từ sự luân chuyển của tinh tú trên Vòng quay Thiên
            văn, đến những giai điệu bản địa đầy day dứt của **Âm Khuyết Thi Thính**. Hãy cùng Tịch
            Phong Thiên Sơn - 夕风天山 lắng nghe nhịp thở của đất trời và tìm thấy sự cân bằng cho
            chính mình.
          </p>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer
      v-show="!isZenMode"
      class="mt-20 py-16 bg-black/40 border-t border-white/5 backdrop-blur-md relative z-10"
    >
      <div class="max-w-7xl mx-auto px-6 flex flex-col items-center text-center gap-6">
        <div class="flex flex-col items-center gap-2">
          <h2 class="font-display font-bold tracking-widest text-xl text-white/80">TIẾT KHÍ</h2>
          <span class="text-[9px] uppercase tracking-[0.4em] opacity-30 font-mono"
            >Trải nghiệm 24 Tiết Khí</span
          >
        </div>

        <div class="w-12 h-[1px] bg-white/10"></div>

        <!-- Nút Xuất Lịch -->
        <button
          @click="exportCalendar"
          class="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-accent-coral hover:border-accent-coral/30 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="group-hover:scale-110 transition-transform"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          📅 Xuất lịch 24 Tiết Khí (.ics)
        </button>

        <p class="text-xs italic tracking-wide text-white/30 max-w-md leading-relaxed">
          Nội dung được biên soạn và hệ thống hóa dựa trên nguyên lý Thiên văn & Văn hóa Đông Phương
          cổ truyền.
        </p>

        <div class="flex flex-col gap-2 mt-4">
          <p class="text-[11px] text-white/20 uppercase tracking-[0.2em]">
            &copy; 2026 Bản quyền thuộc về
          </p>
          <span class="font-script text-2xl text-accent-coral/80"
            >Tịch Phong Thiên Sơn - 夕风天山</span
          >
          <p class="text-[9px] text-white/10 uppercase tracking-widest mt-2">
            Phát triển bởi Cộng đồng J2TEAM
          </p>
        </div>
      </div>
    </footer>

    <!-- Modal Chi Tiết Tiết Khí (Component độc lập) -->
    <TermDetailModal :term="activeTerm" :show="showModal" @close="closeModal" />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap');

.font-chinese {
  font-family: 'ZCOOL XiaoWei', serif;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.5s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Tab Transitions */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.scale-up {
  animation: scaleUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes scaleUp {
  from {
    transform: scale(0.95) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.font-display {
  font-family: var(--font-display);
}
.font-script {
  font-family: var(--font-script);
}

.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  filter: blur(10px);
  transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity, filter;
}

.reveal-on-scroll.is-revealed {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.animate-fade-up {
  opacity: 0;
  transform: translateY(40px);
  animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<style>
/* Lazy load fonts specifically for Tiet Khi page */
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=Dancing+Script:wght@400;700&family=ZCOOL+XiaoWei&display=swap');

.tiet-khi-wrapper {
  --tk-font-display: 'Philosopher', serif;
  --tk-font-body: 'Be Vietnam Pro', sans-serif;
  --tk-font-script: 'Dancing Script', cursive;
  --tk-font-chinese: 'ZCOOL XiaoWei', serif;

  /* Theme Overrides */
  --tk-bg-deep: #0f1923;
  --tk-bg-surface: #162232;
  --tk-accent-coral: #ff6b4a;
  --tk-text-primary: #f0ede6;
  --tk-text-secondary: #8b9db5;
}

.tiet-khi-wrapper.theme-dawn {
  --tk-bg-deep: #2a1b32;
  --tk-bg-surface: #3b2a4a;
  --tk-accent-coral: #ff9e7d;
  --tk-text-primary: #fce4ec;
}

.tiet-khi-wrapper.theme-day {
  --tk-bg-deep: #0f1923;
  --tk-bg-surface: #162232;
  --tk-accent-coral: #ff6b4a;
}

.tiet-khi-wrapper.theme-dusk {
  --tk-bg-deep: #1a1425;
  --tk-bg-surface: #2d1f3d;
  --tk-accent-coral: #ff5e3a;
  --tk-text-primary: #ffe0b2;
}

.tiet-khi-wrapper.theme-night {
  --tk-bg-deep: #020617;
  --tk-bg-surface: #0f172a;
  --tk-accent-coral: #e11d48;
  --tk-text-primary: #f1f5f9;
}

.tiet-khi-wrapper {
  --tk-bg-elevated: #1e2f42;
  --tk-accent-amber: #ffb830;
  --tk-accent-sky: #38bdf8;
  --tk-text-dim: #4a6180;
  --tk-border-default: #253549;
  --tk-border-hover: #ff6b4a;

  font-family: var(--tk-font-body);
  background-color: var(--tk-bg-deep);
  color: var(--tk-text-primary);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* Local Noise grain overlay */
.tiet-khi-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  pointer-events: none;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

/* Animations */
@keyframes tk-fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tk-animate-fade-up {
  animation: tk-fade-up 0.6s ease-out both;
}

/* Utility overrides using local tokens */
.text-accent-coral {
  color: var(--tk-accent-coral) !important;
}
.text-text-secondary {
  color: var(--tk-text-secondary) !important;
}
.font-display {
  font-family: var(--tk-font-display) !important;
}
.font-script {
  font-family: var(--tk-font-script) !important;
}
</style>
