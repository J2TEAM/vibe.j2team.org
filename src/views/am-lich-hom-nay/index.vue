<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useSwipe } from '@vueuse/core'
import {
  solarToLunar,
  getYearCanChi,
  getMonthCanChi,
  getDayCanChi,
  getZodiacHours,
} from './utils/lunar'

// --- State ---
const todayDate = new Date()
const viewDate = ref(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1))
const selectedDate = ref<Date | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const showYearSelector = ref(false)

// --- Data ---
const DOW_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DOW_FULL = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const availableYears = Array.from({ length: 200 }, (_, i) => 1900 + i)

const prevMonth = () => {
  const newViewDate = new Date(viewDate.value)
  newViewDate.setMonth(newViewDate.getMonth() - 1)
  viewDate.value = newViewDate
}

const nextMonth = () => {
  const newViewDate = new Date(viewDate.value)
  newViewDate.setMonth(newViewDate.getMonth() + 1)
  viewDate.value = newViewDate
}

const goToToday = () => {
  viewDate.value = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  selectedDate.value = new Date()
}

const isSameDate = (d1: Date, d2: Date) => {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  )
}

const selectYear = (y: number) => {
  const newViewDate = new Date(viewDate.value)
  newViewDate.setFullYear(y)
  viewDate.value = newViewDate
  showYearSelector.value = false
}

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []

  // Add days from the previous month to fill the first row
  for (let i = firstDay - 1; i >= 0; i--) {
    const prevMonthDate = new Date(year, month - 1, daysInPrevMonth - i)
    const lunar = solarToLunar(
      prevMonthDate.getDate(),
      prevMonthDate.getMonth() + 1,
      prevMonthDate.getFullYear(),
    )
    days.push({ date: prevMonthDate, isCurrentMonth: false, lunar })
  }

  // Add days for the current month
  for (let i = 1; i <= daysInMonth; i++) {
    const currentMonthDate = new Date(year, month, i)
    const lunar = solarToLunar(
      currentMonthDate.getDate(),
      currentMonthDate.getMonth() + 1,
      currentMonthDate.getFullYear(),
    )
    days.push({ date: currentMonthDate, isCurrentMonth: true, lunar })
  }

  // Add days from the next month to fill exactly 42 slots (6 weeks)
  const remainingCells = 42 - days.length
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i)
    const lunar = solarToLunar(
      nextMonthDate.getDate(),
      nextMonthDate.getMonth() + 1,
      nextMonthDate.getFullYear(),
    )
    days.push({ date: nextMonthDate, isCurrentMonth: false, lunar })
  }

  return days
})

const lunarDetails = computed(() => {
  if (!selectedDate.value) return null
  const date = selectedDate.value
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  const dayOfWeek = DOW_FULL[date.getDay()]

  const lunar = solarToLunar(day, month, year)
  const yearCC = getYearCanChi(lunar.year)
  const monthCC = getMonthCanChi(lunar.month, lunar.year)
  const dayCC = getDayCanChi(lunar.jd)
  const zodiacHours = getZodiacHours(lunar.jd)

  return {
    solar: { day, month, year, dayOfWeek },
    lunar,
    yearCC,
    monthCC,
    dayCC,
    zodiacHours,
  }
})

useSwipe(containerRef, {
  onSwipeEnd: (e, direction) => {
    if (!selectedDate.value) {
      if (direction === 'left') nextMonth()
      if (direction === 'right') prevMonth()
      return
    }

    // Swipe navigate days when modal is open
    const newSelectedDate = new Date(selectedDate.value)
    if (direction === 'left') {
      newSelectedDate.setDate(newSelectedDate.getDate() + 1)
      selectedDate.value = new Date(newSelectedDate)
    } else if (direction === 'right') {
      newSelectedDate.setDate(newSelectedDate.getDate() - 1)
      selectedDate.value = new Date(newSelectedDate)
    } else if (direction === 'down') {
      selectedDate.value = null
    }
  },
})

const selectDay = (day: { date: Date; isCurrentMonth: boolean }) => {
  selectedDate.value = day.date
  if (!day.isCurrentMonth) {
    viewDate.value = new Date(day.date.getFullYear(), day.date.getMonth(), 1)
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="min-h-screen bg-bg-deep text-text-primary px-4 py-8 font-body overflow-hidden relative flex flex-col items-center"
  >
    <!-- Background Decor -->
    <div
      class="fixed inset-0 pointer-events-none opacity-5 mix-blend-screen"
      style="
        background-image:
          linear-gradient(to right, currentColor 1px, transparent 1px),
          linear-gradient(to bottom, currentColor 1px, transparent 1px);
        background-size: 40px 40px;
      "
    ></div>

    <!-- Main Container (Month View) -->
    <div
      class="relative z-10 w-full max-w-5xl transition-all duration-500 will-change-transform animate-fade-up"
      :class="
        selectedDate ? 'opacity-30 scale-95 blur-sm pointer-events-none' : 'opacity-100 scale-100'
      "
    >
      <!-- Standard Page Template Back Link -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary mb-8"
      >
        <Icon icon="lucide:arrow-left" class="size-4" /> Về trang chủ
      </RouterLink>

      <!-- Header -->
      <header
        class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-border-default gap-4 relative"
      >
        <div class="absolute -bottom-px left-0 w-32 h-px bg-accent-coral"></div>
        <div class="flex flex-col animate-fade-up">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            <span class="font-display text-xs tracking-widest text-text-secondary uppercase"
              >Khám phá dòng thời gian</span
            >
          </div>
          <h1
            class="font-display text-7xl md:text-8xl font-bold tracking-tight text-accent-coral uppercase"
          >
            Âm Lịch
          </h1>
        </div>

        <button
          @click="goToToday"
          class="flex items-center gap-2 px-4 py-2 border border-border-default bg-bg-surface hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 transition-all duration-300 focus:outline-none uppercase font-display text-xs tracking-widest group animate-fade-up animate-delay-2"
        >
          <Icon
            icon="lucide:crosshair"
            class="size-4 text-accent-coral group-hover:rotate-90 transition-transform duration-500"
          />
          <span>Hôm Nay</span>
        </button>
      </header>

      <!-- Month Controls -->
      <div
        class="flex items-center justify-between mb-6 bg-bg-surface border border-border-default p-4 group transition-all duration-300 hover:border-accent-sky focus-within:border-accent-sky hover:shadow-lg hover:shadow-accent-sky/5 animate-fade-up animate-delay-3"
      >
        <button
          @click="prevMonth"
          class="p-2.5 border border-border-default hover:border-accent-sky hover:bg-bg-elevated transition-colors focus:outline-none text-text-secondary hover:text-accent-sky"
        >
          <Icon
            icon="lucide:chevron-left"
            class="size-5 hover:-translate-x-1 transition-transform"
          />
        </button>
        <div class="flex flex-col items-center">
          <span class="text-xs text-text-dim font-display tracking-wide uppercase mb-1"
            >Thời gian hiển thị</span
          >
          <div class="flex items-center gap-2">
            <span class="font-display text-2xl font-semibold text-text-primary"
              >THÁNG {{ viewDate.getMonth() + 1 }} /
            </span>

            <button
              @click="showYearSelector = true"
              class="group/btn flex items-center gap-1.5 focus:outline-none"
            >
              <span
                class="font-display text-2xl font-semibold text-text-primary border-b-2 border-dashed border-accent-sky/40 group-hover/btn:border-accent-sky group-hover/btn:text-accent-sky transition-colors cursor-pointer pb-0.5"
              >
                {{ viewDate.getFullYear() }}
              </span>
              <Icon
                icon="lucide:chevron-down"
                class="size-4 text-accent-sky/50 group-hover/btn:text-accent-sky transition-transform group-hover/btn:translate-y-0.5"
              />
            </button>
          </div>
        </div>
        <button
          @click="nextMonth"
          class="p-2.5 border border-border-default hover:border-accent-sky hover:bg-bg-elevated transition-colors focus:outline-none text-text-secondary hover:text-accent-sky"
        >
          <Icon
            icon="lucide:chevron-right"
            class="size-5 hover:translate-x-1 transition-transform"
          />
        </button>
      </div>

      <!-- Calendar Grid -->
      <div
        class="bg-bg-surface border border-border-default p-2 sm:p-4 relative animate-fade-up animate-delay-4"
      >
        <!-- Decoration corners -->
        <div class="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent-sky"></div>
        <div class="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-accent-sky"></div>
        <div class="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-accent-sky"></div>
        <div
          class="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent-sky"
        ></div>

        <!-- Days of Week Header -->
        <div class="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
          <div
            v-for="(day, idx) in DOW_SHORT"
            :key="day"
            class="text-center py-2 text-xs text-text-dim font-display tracking-wide uppercase border-b border-border-default/50"
            :class="idx === 0 || idx === 6 ? 'text-accent-coral' : ''"
          >
            {{ day }}
          </div>
        </div>

        <!-- Days Grid -->
        <div class="grid grid-cols-7 gap-1 sm:gap-2">
          <button
            v-for="day in calendarDays"
            :key="day.date.toISOString()"
            @click="selectDay(day)"
            class="relative flex flex-col p-1.5 sm:p-3 sm:min-h-[100px] border transition-all duration-300 focus:outline-none group text-left items-start justify-between"
            :class="[
              day.isCurrentMonth
                ? 'border-border-default bg-bg-deep hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-sky/5'
                : 'border-transparent opacity-40 hover:opacity-100 hover:bg-bg-elevated hover:border-border-default hover:-translate-y-1',
              isSameDate(day.date, todayDate)
                ? 'border-accent-amber! bg-accent-amber/5! opacity-100!'
                : '',
            ]"
          >
            <div class="flex justify-between w-full items-start mb-1 sm:mb-0">
              <span
                class="font-display text-lg font-semibold leading-none transition-colors"
                :class="[
                  isSameDate(day.date, todayDate)
                    ? 'text-accent-amber'
                    : day.date.getDay() === 0 || day.date.getDay() === 6
                      ? 'text-accent-coral'
                      : 'text-text-primary',
                  day.isCurrentMonth ? '' : 'group-hover:text-text-primary',
                ]"
              >
                {{ day.date.getDate() }}
              </span>
              <!-- Indicator for 1st / 15th lunar -->
              <Icon
                v-if="day.lunar.day === 1 || day.lunar.day === 15"
                icon="lucide:moon"
                class="size-3"
                :class="day.lunar.day === 1 ? 'text-accent-amber' : 'text-accent-sky'"
              />
            </div>

            <span
              class="text-[10px] sm:text-xs text-text-dim font-display tracking-wide mt-auto w-full text-right"
              :class="
                day.lunar.day === 1 || day.lunar.day === 15
                  ? 'text-accent-amber font-semibold'
                  : 'group-hover:text-text-secondary transition-colors'
              "
            >
              {{ day.lunar.day === 1 ? day.lunar.month + ' ÂL' : day.lunar.day }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Daily Details Modal (Popup HUD) -->
    <transition
      enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="opacity-0 translate-y-8 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-8 scale-95"
    >
      <div
        v-if="selectedDate && lunarDetails"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"
        @click.self="selectedDate = null"
      >
        <div
          class="w-full max-w-md bg-bg-surface border border-accent-sky shadow-[0_0_30px_rgba(56,189,248,0.1)] relative flex flex-col"
        >
          <!-- Close button -->
          <button
            @click="selectedDate = null"
            class="absolute top-0 right-0 p-4 text-text-secondary hover:text-accent-coral transition-colors focus:outline-none z-20 hover:scale-110"
          >
            <Icon icon="lucide:x" class="size-6" />
          </button>

          <!-- Modal Header (Solar) -->
          <div
            class="bg-bg-elevated p-6 border-b border-border-default flex flex-col items-center relative"
          >
            <div class="absolute top-0 left-0 w-8 h-1 bg-accent-sky"></div>
            <!-- ID badge -->
            <div
              class="absolute top-3 left-4 bg-accent-sky text-bg-deep font-display font-medium text-[10px] tracking-widest px-2 py-1 rotate-2"
            >
              VOL.{{ String(lunarDetails.solar.month).padStart(2, '0') }}
            </div>

            <div class="flex items-center gap-2 mb-3 mt-4">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                >Dữ liệu Dương Lịch</span
              >
            </div>

            <div
              class="text-5xl md:text-6xl font-display font-bold tracking-tight text-text-primary mb-1"
            >
              {{ lunarDetails.solar.day }}
              <span class="text-3xl text-text-dim">/ {{ lunarDetails.solar.month }}</span>
            </div>
            <div class="text-xs text-text-dim font-display tracking-wide uppercase">
              {{ lunarDetails.solar.dayOfWeek }} - NĂM {{ lunarDetails.solar.year }}
            </div>
          </div>

          <!-- Modal Body (Lunar) -->
          <div class="p-8 relative text-center border-b border-border-default bg-bg-surface">
            <div class="flex items-center justify-center gap-2 mb-4">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                >Tọa độ Âm Lịch</span
              >
            </div>

            <div
              class="font-display text-7xl md:text-[8rem] font-bold leading-none tracking-tight text-accent-coral mb-4"
            >
              {{ lunarDetails.lunar.day }}
            </div>

            <div
              class="text-sm font-display font-medium tracking-[0.2em] text-text-primary uppercase flex items-center justify-center gap-2"
            >
              <span>THÁNG {{ lunarDetails.lunar.month }}</span>
              <span
                v-if="lunarDetails.lunar.leap"
                class="text-bg-deep bg-accent-coral px-2 py-0.5 text-[10px] tracking-widest font-bold"
                >NHUẬN</span
              >
            </div>
          </div>

          <!-- Can Chi & Zodiac grid -->
          <div
            class="grid grid-cols-3 border-b border-border-default divide-x divide-border-default bg-bg-deep"
          >
            <div class="p-4 flex flex-col items-center hover:bg-bg-elevated transition-colors">
              <span class="text-xs text-text-dim font-display tracking-wide uppercase mb-2"
                >Năm</span
              >
              <span
                class="font-display text-lg font-semibold text-text-primary text-center uppercase leading-snug"
                >{{ lunarDetails.yearCC.can }}<br />{{ lunarDetails.yearCC.chi }}</span
              >
            </div>
            <div class="p-4 flex flex-col items-center hover:bg-bg-elevated transition-colors">
              <span class="text-xs text-text-dim font-display tracking-wide uppercase mb-2"
                >Tháng</span
              >
              <span
                class="font-display text-lg font-semibold text-text-primary text-center uppercase leading-snug"
                >{{ lunarDetails.monthCC.can }}<br />{{ lunarDetails.monthCC.chi }}</span
              >
            </div>
            <div class="p-4 flex flex-col items-center hover:bg-bg-elevated transition-colors">
              <span class="text-xs text-text-dim font-display tracking-wide uppercase mb-2"
                >Ngày</span
              >
              <span
                class="font-display text-lg font-semibold text-text-primary text-center uppercase leading-snug"
                >{{ lunarDetails.dayCC.can }}<br />{{ lunarDetails.dayCC.chi }}</span
              >
            </div>
          </div>

          <!-- Giờ hoàng đạo footer -->
          <div class="p-6 bg-bg-surface relative border-b border-border-default">
            <div
              class="absolute bottom-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
            >
              ZH
            </div>
            <div class="flex items-center gap-2 mb-4 relative z-10">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              <span class="font-display text-sm tracking-widest text-text-secondary uppercase"
                >Giờ Hoàng Đạo</span
              >
            </div>
            <div class="flex flex-wrap gap-2 relative z-10">
              <span
                v-for="chi in lunarDetails.zodiacHours"
                :key="chi"
                class="px-3 py-1.5 text-xs font-display font-medium tracking-wider text-accent-amber bg-bg-deep border border-accent-amber/30 uppercase"
              >
                {{ chi }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Year Selector Modal (Popup HUD) -->
    <transition
      enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="opacity-0 translate-y-8 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-8 scale-95"
    >
      <div
        v-if="showYearSelector"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"
        @click.self="showYearSelector = false"
      >
        <div
          class="w-full max-w-sm bg-bg-surface border border-accent-sky shadow-[0_0_30px_rgba(56,189,248,0.1)] relative flex flex-col h-[70vh] max-h-[800px]"
        >
          <!-- Close button -->
          <button
            @click="showYearSelector = false"
            class="absolute top-0 right-0 p-4 text-text-secondary hover:text-accent-coral transition-colors focus:outline-none z-20 hover:scale-110"
          >
            <Icon icon="lucide:x" class="size-6" />
          </button>

          <!-- Modal Header -->
          <div
            class="bg-bg-elevated p-6 border-b border-border-default flex flex-col items-center relative shrink-0"
          >
            <div class="absolute top-0 left-0 w-8 h-1 bg-accent-sky"></div>

            <div class="flex items-center gap-2 mb-2 mt-2">
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                >Quản lý dòng thời gian</span
              >
            </div>

            <div class="font-display text-2xl font-semibold text-text-primary uppercase mb-2">
              CHỌN NĂM HIỂN THỊ
            </div>
          </div>

          <!-- Modal Body (Grid List) -->
          <div class="flex-1 overflow-y-auto p-4 custom-scrollbar bg-bg-deep/50 relative">
            <!-- decorative corners -->
            <div
              class="absolute inset-x-4 top-4 h-px bg-linear-to-r from-transparent via-accent-sky/20 to-transparent"
            ></div>

            <div class="grid grid-cols-3 gap-2 relative z-10 pt-4 pb-8">
              <button
                v-for="y in availableYears"
                :key="y"
                @click="selectYear(y)"
                class="py-3 px-2 text-center border transition-all duration-300 font-display font-bold text-lg focus:outline-none"
                :class="
                  y === viewDate.getFullYear()
                    ? 'bg-accent-sky/20 border-accent-sky text-accent-sky shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                    : 'bg-bg-surface border-border-default text-text-secondary hover:bg-bg-elevated hover:border-accent-sky/50 hover:text-text-primary'
                "
              >
                {{ y }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for Sci-Fi Theme */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 25, 35, 0.5); /* bg-bg-deep */
  border-left: 1px solid rgba(37, 53, 73, 0.5); /* border-border-default */
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3); /* accent-sky */
  border-radius: 0; /* Sharp corners */
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.8);
}
</style>
