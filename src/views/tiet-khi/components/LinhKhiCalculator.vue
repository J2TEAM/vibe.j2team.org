<script setup lang="ts">
import { ref } from 'vue'
import type { SolarTerm } from '../types'
import { linhKhiData, type LinhKhiData } from '../LinhKhiData'
import PremiumDatePicker from './PremiumDatePicker.vue'

const props = defineProps<{
  terms: SolarTerm[]
}>()

const isOpen = ref(false)
const birthDate = ref('')
const calculatedTerm = ref<SolarTerm | null>(null)
const personalLinhKhi = ref<LinhKhiData | null>(null)

// Card generation
const cardRef = ref<HTMLElement | null>(null)
const isGeneratingCard = ref(false)
const showCardPreview = ref(false)

const calculateLinhKhi = () => {
  if (!birthDate.value) return

  const date = new Date(birthDate.value)
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Ngày bắt đầu gần đúng cho 24 tiết khí
  const termsMap = [
    { id: 'tieu_han', m: 1, d: 5 },
    { id: 'dai_han', m: 1, d: 20 },
    { id: 'lap_xuan', m: 2, d: 4 },
    { id: 'vu_thuy', m: 2, d: 18 },
    { id: 'kinh_trap', m: 3, d: 5 },
    { id: 'xuan_phan', m: 3, d: 20 },
    { id: 'thanh_minh', m: 4, d: 4 },
    { id: 'coc_vu', m: 4, d: 20 },
    { id: 'lap_ha', m: 5, d: 5 },
    { id: 'tieu_man', m: 5, d: 21 },
    { id: 'mang_chung', m: 6, d: 5 },
    { id: 'ha_chi', m: 6, d: 21 },
    { id: 'tieu_thu', m: 7, d: 7 },
    { id: 'dai_thu', m: 7, d: 22 },
    { id: 'lap_thu', m: 8, d: 7 },
    { id: 'xu_thu', m: 8, d: 23 },
    { id: 'bach_lo', m: 9, d: 7 },
    { id: 'thu_phan', m: 9, d: 23 },
    { id: 'han_lo', m: 10, d: 8 },
    { id: 'suong_giang', m: 10, d: 23 },
    { id: 'lap_dong', m: 11, d: 7 },
    { id: 'tieu_tuyet', m: 11, d: 22 },
    { id: 'dai_tuyet', m: 12, d: 7 },
    { id: 'dong_chi', m: 12, d: 21 },
  ]

  const sorted = [...termsMap].sort((a, b) => a.m * 100 + a.d - (b.m * 100 + b.d))

  let selectedId = 'dong_chi'
  for (const term of sorted) {
    if (month > term.m || (month === term.m && day >= term.d)) {
      selectedId = term.id
    }
  }

  calculatedTerm.value = props.terms.find((t) => t.id === selectedId) || props.terms[0]!
  personalLinhKhi.value = linhKhiData.find((t) => t.id === selectedId) || null
}

// Màu nền card theo mùa
const getSeasonCardBg = (season: string) => {
  switch (season) {
    case 'Xuân':
      return '#0a2e1a'
    case 'Hạ':
      return '#2e0a0a'
    case 'Thu':
      return '#2e1f0a'
    case 'Đông':
      return '#0a1a2e'
    default:
      return '#111'
  }
}

const getSeasonAccent = (season: string) => {
  switch (season) {
    case 'Xuân':
      return '#70E000'
    case 'Hạ':
      return '#ff6b4a'
    case 'Thu':
      return '#ffb830'
    case 'Đông':
      return '#38bdf8'
    default:
      return '#ff6b4a'
  }
}

// Xuất thiệp Bản Mệnh
const exportCard = async () => {
  if (!cardRef.value) return
  isGeneratingCard.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(cardRef.value, {
      quality: 1.0,
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#000',
    })
    const link = document.createElement('a')
    link.download = `BanMenh-${personalLinhKhi.value?.name || 'LinhKhi'}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Lỗi khi tạo thiệp:', err)
  } finally {
    isGeneratingCard.value = false
  }
}

const getElementBaseClass = (season: string) => {
  switch (season) {
    case 'Xuân':
      return 'from-emerald-500/30 to-green-900/40 text-emerald-100 border-emerald-500/50'
    case 'Hạ':
      return 'from-red-500/30 to-orange-900/40 text-red-100 border-red-400/50'
    case 'Thu':
      return 'from-amber-500/30 to-yellow-900/40 text-amber-100 border-amber-400/50'
    case 'Đông':
      return 'from-blue-500/30 to-indigo-900/40 text-blue-100 border-blue-400/50'
    default:
      return 'from-gray-500/30 to-gray-900/40 text-gray-100 border-gray-400/50'
  }
}

const resetResult = () => {
  personalLinhKhi.value = null
  showCardPreview.value = false
}
</script>

<template>
  <div class="fixed bottom-6 right-4 sm:bottom-36 sm:right-[92px] z-[70]">
    <!-- Floating Button -->
    <button
      @click="isOpen = true"
      class="group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-2xl hover:scale-110 hover:border-accent-coral/60 transition-all duration-300"
    >
      <span
        class="absolute inset-0 rounded-full border border-accent-coral/0 group-hover:border-accent-coral/100 group-hover:animate-ping"
      ></span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="opacity-80 group-hover:opacity-100 transition-opacity"
      >
        <path
          d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>

      <!-- Tooltip (ẩn trên mobile) -->
      <div
        class="hidden sm:block absolute right-16 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white uppercase tracking-widest"
      >
        Linh Khí Cá Nhân
      </div>
    </button>

    <!-- Modal Form & Result -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      >
        <div class="absolute inset-0" @click="isOpen = false"></div>

        <div
          class="relative w-full sm:max-w-2xl max-h-[90vh] bg-[#1a1a1a] rounded-t-[2rem] sm:rounded-[2rem] border border-white/10 shadow-2xl scale-up p-6 sm:p-12 text-center flex flex-col items-center overflow-y-auto"
        >
          <!-- Nút đóng -->
          <button
            @click="isOpen = false"
            class="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/40 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <h2
            class="text-xl sm:text-2xl font-display font-bold tracking-widest text-accent-coral mb-2"
          >
            BẢN MỆNH TIẾT KHÍ
          </h2>
          <p class="text-sm text-white/50 mb-6 sm:mb-8 font-script italic">
            Khám phá trường năng lượng lúc bạn chào đời
          </p>

          <!-- Form nhập ngày sinh -->
          <div v-if="!personalLinhKhi" class="w-full flex flex-col gap-6 max-w-xs">
            <div class="flex flex-col gap-2 text-left">
              <PremiumDatePicker
                v-model="birthDate"
                label="Sinh nhật của bạn"
                placeholder="Chọn ngày sinh..."
              />
            </div>
            <button
              @click="calculateLinhKhi"
              :disabled="!birthDate"
              class="w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 hover:bg-accent-coral text-white"
            >
              Xem Kết Quả
            </button>
          </div>

          <!-- Kết quả Bản Mệnh -->
          <div v-else class="w-full flex flex-col items-center animate-fade-up">
            <!-- Card chính -->
            <div
              :class="[
                'w-full p-6 sm:p-8 rounded-2xl bg-gradient-to-br border flex flex-col items-center relative overflow-hidden',
                getElementBaseClass(calculatedTerm?.season || 'Xuân'),
              ]"
            >
              <div class="absolute -top-8 -right-8 text-8xl sm:text-9xl opacity-10 font-chinese">
                {{ calculatedTerm?.chineseName }}
              </div>

              <span class="text-[10px] uppercase tracking-widest opacity-60 font-mono mb-2"
                >Bạn mang linh khí</span
              >
              <h3 class="text-4xl sm:text-5xl font-script tracking-widest mb-2">
                {{ personalLinhKhi.name }}
              </h3>
              <p class="font-chinese text-xl sm:text-2xl opacity-60 mb-4">
                {{ calculatedTerm?.chineseName }}
              </p>

              <div class="w-12 h-px bg-white/30 mb-5"></div>

              <p class="text-sm leading-relaxed opacity-90 text-center px-2 sm:px-4 max-w-md">
                {{ personalLinhKhi.aura }}
              </p>
            </div>

            <!-- Sứ mệnh + Lời khuyên -->
            <div
              class="mt-5 w-full bg-white/5 p-5 sm:p-6 rounded-2xl border border-white/5 space-y-5"
            >
              <div>
                <h4
                  class="text-[10px] uppercase font-bold tracking-widest text-accent-coral mb-3 flex items-center gap-2"
                >
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
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                  Sứ mệnh nhân gian
                </h4>
                <p class="text-base sm:text-lg text-white/90 leading-relaxed font-serif italic">
                  {{ personalLinhKhi.mission }}
                </p>
              </div>
              <div class="w-full h-px bg-white/10"></div>
              <div>
                <h4
                  class="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-3 flex items-center gap-2"
                >
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Lời khuyên dưỡng tâm
                </h4>
                <p class="text-sm text-white/70 leading-relaxed">
                  {{ personalLinhKhi.advice }}
                </p>
              </div>
            </div>

            <!-- Buttons -->
            <div class="mt-6 flex flex-col sm:flex-row items-center gap-4 w-full">
              <button
                @click="showCardPreview = true"
                class="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-accent-coral to-red-600 text-white rounded-xl font-bold uppercase tracking-[0.15em] text-[10px] hover:shadow-[0_10px_30px_rgba(255,107,74,0.3)] transition-all"
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
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                Tạo thiệp chia sẻ
              </button>
              <button
                @click="resetResult"
                class="text-[10px] uppercase tracking-widest font-mono text-white/40 hover:text-white transition-colors underline underline-offset-8"
              >
                Tra cứu lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal thiệp chia sẻ (tách riêng) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCardPreview && personalLinhKhi"
          class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div class="absolute inset-0" @click="showCardPreview = false"></div>

          <div
            class="relative flex flex-col items-center gap-4 scale-up max-h-[90vh] overflow-y-auto"
          >
            <!-- Nút đóng -->
            <button
              @click="showCardPreview = false"
              class="absolute -top-2 -right-2 z-10 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all border border-white/10"
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
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <!-- Card thiệp -->
            <div
              class="p-2 rounded-[2rem] bg-white/5 border border-white/10 shadow-2xl overflow-hidden"
            >
              <div
                ref="cardRef"
                class="relative w-[340px] sm:w-[420px] h-[510px] sm:h-[630px] overflow-hidden flex flex-col items-center text-center justify-between rounded-[1.8rem]"
                :style="{ backgroundColor: getSeasonCardBg(calculatedTerm?.season || 'Đông') }"
              >
                <!-- Multi-layer decorations -->
                <div
                  class="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/20 pointer-events-none"
                ></div>
                <div
                  class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06)_0%,transparent_60%)] pointer-events-none"
                ></div>
                <div
                  class="absolute -bottom-24 -right-24 w-96 h-96 blur-[140px] rounded-full opacity-80"
                  :style="{
                    backgroundColor: getSeasonAccent(calculatedTerm?.season || 'Đông') + '18',
                  }"
                ></div>
                <div
                  class="absolute -top-24 -left-24 w-96 h-96 bg-white/3 blur-[120px] rounded-full"
                ></div>

                <!-- Subtle noise texture -->
                <div
                  class="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style="
                    background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');
                  "
                ></div>

                <!-- Inner border frame -->
                <div
                  class="absolute inset-5 sm:inset-7 border border-white/8 pointer-events-none rounded-2xl"
                ></div>

                <!-- Corner accents with dots -->
                <div class="absolute top-7 left-7 sm:top-9 sm:left-9">
                  <div
                    class="w-7 h-7 border-t-2 border-l-2"
                    :style="{
                      borderColor: getSeasonAccent(calculatedTerm?.season || 'Đông') + '50',
                    }"
                  ></div>
                  <div
                    class="absolute top-0 left-0 w-1.5 h-1.5 rounded-full -translate-x-0.5 -translate-y-0.5"
                    :style="{
                      backgroundColor: getSeasonAccent(calculatedTerm?.season || 'Đông') + '80',
                    }"
                  ></div>
                </div>
                <div class="absolute bottom-7 right-7 sm:bottom-9 sm:right-9">
                  <div
                    class="w-7 h-7 border-b-2 border-r-2"
                    :style="{
                      borderColor: getSeasonAccent(calculatedTerm?.season || 'Đông') + '50',
                    }"
                  ></div>
                  <div
                    class="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full translate-x-0.5 translate-y-0.5"
                    :style="{
                      backgroundColor: getSeasonAccent(calculatedTerm?.season || 'Đông') + '80',
                    }"
                  ></div>
                </div>

                <!-- Large watermark character -->
                <div
                  class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] sm:text-[16rem] font-chinese opacity-[0.04] pointer-events-none leading-none select-none"
                >
                  {{ calculatedTerm?.chineseName?.charAt(0) }}
                </div>

                <!-- Header -->
                <div class="z-10 text-white pt-12 sm:pt-16">
                  <h4
                    class="font-display text-[8px] sm:text-[9px] tracking-[0.6em] opacity-35 mb-3 uppercase"
                  >
                    Bản Mệnh Linh Khí
                  </h4>
                  <div
                    class="w-10 h-[1px] mx-auto mb-5 sm:mb-7"
                    :style="{ backgroundColor: getSeasonAccent(calculatedTerm?.season || 'Đông') }"
                  ></div>
                  <h1
                    class="text-[2.8rem] sm:text-[3.8rem] tracking-wide leading-none mb-2"
                    :style="{
                      fontFamily: '\'Dancing Script\', cursive',
                      textShadow:
                        '0 2px 20px ' + getSeasonAccent(calculatedTerm?.season || 'Đông') + '25',
                    }"
                  >
                    {{ personalLinhKhi.name }}
                  </h1>
                  <p
                    class="font-chinese text-2xl sm:text-[2rem] opacity-40 mt-1"
                    :style="{ color: getSeasonAccent(calculatedTerm?.season || 'Đông') }"
                  >
                    {{ calculatedTerm?.chineseName }}
                  </p>
                </div>

                <!-- Vertical accent line -->
                <div
                  class="z-10 w-[1px] h-6 sm:h-8 opacity-20"
                  :style="{ backgroundColor: getSeasonAccent(calculatedTerm?.season || 'Đông') }"
                ></div>

                <!-- Sứ mệnh -->
                <div class="z-10 px-8 sm:px-12 max-w-sm">
                  <p
                    class="font-script text-base sm:text-lg leading-relaxed italic opacity-85 text-white"
                  >
                    <span class="opacity-40 text-xl">"</span>{{ personalLinhKhi.mission
                    }}<span class="opacity-40 text-xl">"</span>
                  </p>
                </div>

                <!-- Footer -->
                <div class="z-10 flex flex-col items-center gap-2.5 text-white pb-10 sm:pb-14">
                  <span
                    class="text-[7px] sm:text-[8px] uppercase tracking-[0.3em] font-black px-4 py-1.5 rounded-full"
                    :style="{
                      backgroundColor: getSeasonAccent(calculatedTerm?.season || 'Đông'),
                      color: '#000',
                    }"
                  >
                    Dưỡng Tâm
                  </span>
                  <p
                    class="text-[9px] sm:text-[10px] leading-relaxed max-w-[220px] sm:max-w-[260px] opacity-50 text-center"
                  >
                    {{ personalLinhKhi.advice.slice(0, 80) }}...
                  </p>
                  <div
                    class="w-8 h-px opacity-15 mt-1"
                    :style="{ backgroundColor: getSeasonAccent(calculatedTerm?.season || 'Đông') }"
                  ></div>
                  <div class="text-[7px] font-mono tracking-[0.5em] uppercase opacity-20 mt-0.5">
                    Nhân Gian Tiết Khí
                  </div>
                </div>
              </div>
            </div>

            <!-- Nút tải -->
            <button
              @click="exportCard"
              :disabled="isGeneratingCard"
              class="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-accent-coral to-red-600 text-white rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] hover:shadow-[0_15px_30px_rgba(255,107,74,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 shadow-lg"
            >
              <svg
                v-if="!isGeneratingCard"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
              {{ isGeneratingCard ? 'Đang kết xuất...' : 'Tải thiệp Bản Mệnh' }}
            </button>
            <p class="text-[9px] text-white/30 uppercase tracking-widest">
              Lưu ảnh để chia sẻ với bạn bè
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&display=swap');

.font-calligraphy {
  font-family: 'Cormorant Garamond', serif;
}
.font-display {
  font-family: var(--tk-font-display, var(--font-display));
}
.font-script {
  font-family: var(--tk-font-script, var(--font-script));
}
.font-chinese {
  font-family: 'ZCOOL XiaoWei', serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

.animate-fade-up {
  animation: fadeUp 0.6s ease-out forwards;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
