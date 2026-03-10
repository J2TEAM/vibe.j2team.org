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

const calculateLinhKhi = () => {
  if (!birthDate.value) return

  const date = new Date(birthDate.value)
  const month = date.getMonth() + 1
  const day = date.getDate()

  // High-precision approximate start dates for 24 solar terms
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
</script>

<template>
  <div class="fixed bottom-36 right-[92px] z-[70]">
    <!-- Floating Button -->
    <button
      @click="isOpen = true"
      class="group relative flex items-center justify-center w-14 h-14 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-2xl hover:scale-110 hover:border-accent-coral/60 transition-all duration-300"
    >
      <span
        class="absolute inset-0 rounded-full border border-accent-coral/0 group-hover:border-accent-coral/100 group-hover:animate-ping"
      ></span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
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

      <!-- Tooltip -->
      <div
        class="absolute right-16 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white uppercase tracking-widest"
      >
        Linh Khí Cá Nhân
      </div>
    </button>

    <!-- Modal Form & Result -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <div class="absolute inset-0" @click="isOpen = false"></div>

        <div
          class="relative w-full max-w-2xl bg-[#1a1a1a] rounded-[2rem] border border-white/10 shadow-2xl scale-up p-8 sm:p-12 text-center flex flex-col items-center"
        >
          <!-- Close Button -->
          <button
            @click="isOpen = false"
            class="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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

          <h2 class="text-2xl font-display font-bold tracking-widest text-accent-coral mb-2">
            BẢN MỆNH TIẾT KHÍ
          </h2>
          <p class="text-sm text-white/50 mb-8 font-script italic">
            Khám phá trường năng lượng lúc bạn chào đời
          </p>

          <div v-if="!personalLinhKhi" class="w-full flex flex-col gap-6 w-full max-w-xs">
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

          <div v-else class="w-full flex flex-col items-center animate-fade-up">
            <div
              :class="[
                'w-full p-8 rounded-2xl bg-gradient-to-br border flex flex-col items-center relative overflow-hidden',
                getElementBaseClass(calculatedTerm?.season || 'Xuân'),
              ]"
            >
              <div class="absolute -top-8 -right-8 text-9xl opacity-10 font-chinese">
                {{ calculatedTerm?.chineseName }}
              </div>

              <span class="text-[10px] uppercase tracking-widest opacity-60 font-mono mb-2"
                >Bạn mang linh khí</span
              >
              <h3 class="text-5xl font-display font-bold tracking-widest mb-2">
                {{ personalLinhKhi.name }}
              </h3>
              <p class="font-chinese text-2xl opacity-60 mb-6">{{ calculatedTerm?.chineseName }}</p>

              <div class="w-12 h-px bg-white/30 mb-8"></div>

              <p class="text-sm leading-relaxed opacity-90 text-center px-4 max-w-md">
                {{ personalLinhKhi.aura }}
              </p>
            </div>

            <div class="mt-8 flex flex-col gap-6 text-left w-full">
              <div class="bg-white/5 p-6 rounded-2xl border border-white/5">
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
                  SỨ MỆNH NHÂN GIAN
                </h4>
                <p class="text-xl text-white/90 leading-relaxed font-serif italic">
                  {{ personalLinhKhi.mission }}
                </p>
              </div>

              <div class="bg-white/5 p-6 rounded-2xl border border-white/5">
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
                  LỜI KHUYÊN DƯỠNG TÂM
                </h4>
                <p class="text-base text-white/70 leading-relaxed">
                  {{ personalLinhKhi.advice }}
                </p>
              </div>
            </div>

            <button
              @click="personalLinhKhi = null"
              class="mt-8 text-[10px] uppercase tracking-widest font-mono text-white/40 hover:text-white transition-colors underline underline-offset-8"
            >
              Tra cứu lại
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.font-display {
  font-family: var(--font-display);
}
.font-script {
  font-family: var(--font-script);
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
</style>
