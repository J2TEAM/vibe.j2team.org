<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useNow } from '@vueuse/core'

const now = useNow({ interval: 1000 })

// Analog clock hands
const secondDeg = computed(() => now.value.getSeconds() * 6)
const minuteDeg = computed(() => now.value.getMinutes() * 6 + now.value.getSeconds() * 0.1)
const hourDeg = computed(() => (now.value.getHours() % 12) * 30 + now.value.getMinutes() * 0.5)

// Digital time
const timeStr = computed(() =>
  now.value.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
)
const dateStr = computed(() =>
  now.value.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

// Countdown to end of day
const toEndOfDay = computed(() => {
  const eod = new Date(now.value)
  eod.setHours(23, 59, 59, 999)
  const ms = eod.getTime() - now.value.getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// Countdown to Friday 6PM
const weekendInfo = computed(() => {
  const d = now.value
  const day = d.getDay()
  const fridayEnd = new Date(d)
  const daysToFriday = (5 - day + 7) % 7 || (d.getHours() >= 18 ? 7 : 0)
  fridayEnd.setDate(d.getDate() + daysToFriday)
  fridayEnd.setHours(18, 0, 0, 0)
  const diff = fridayEnd.getTime() - d.getTime()
  if (diff <= 0) return { label: 'ĐÃ WEEKEND!', isWeekend: true }
  const days = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return { label: days > 0 ? `${days}n ${time}` : time, isWeekend: false }
})

// Day progress
const dayProgress = computed(() => {
  const elapsed =
    now.value.getHours() * 3600000 + now.value.getMinutes() * 60000 + now.value.getSeconds() * 1000
  return (elapsed / 86400000) * 100
})

// World clocks
const cities = [
  { name: 'Hà Nội', tz: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { name: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
  { name: 'London', tz: 'Europe/London', flag: '🇬🇧' },
  { name: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
  { name: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
  { name: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
]

const worldTimes = computed(() =>
  cities.map(({ name, tz, flag }) => ({
    name,
    flag,
    time: now.value.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: tz,
    }),
    date: now.value.toLocaleDateString('vi-VN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    }),
  })),
)

// Tick marks for analog clock
const tickMarks = Array.from({ length: 60 }, (_, i) => i)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Hero -->
      <header class="mb-12 text-center">
        <h1 class="font-display text-5xl sm:text-7xl font-bold text-accent-coral animate-fade-up">
          Mấy Giờ Rồi?
        </h1>
        <p class="mt-3 text-text-secondary text-lg animate-fade-up animate-delay-2">
          {{ dateStr }}
        </p>
      </header>

      <!-- Analog Clock + Digital Time -->
      <div class="flex flex-col items-center gap-6 mb-12 animate-fade-up animate-delay-3">
        <svg viewBox="0 0 220 220" width="220" height="220">
          <!-- Outer ring -->
          <circle
            cx="110"
            cy="110"
            r="108"
            fill="none"
            stroke="#FF6B4A"
            stroke-width="1.5"
            opacity="0.3"
          />
          <!-- Clock face -->
          <circle cx="110" cy="110" r="104" fill="#0F1923" />
          <circle cx="110" cy="110" r="104" fill="none" stroke="#253549" stroke-width="2" />

          <!-- Tick marks -->
          <g v-for="i in tickMarks" :key="i">
            <line
              :transform="`rotate(${i * 6}, 110, 110)`"
              x1="110"
              y1="12"
              :x2="110"
              :y2="i % 5 === 0 ? 24 : 18"
              :stroke="i % 5 === 0 ? '#8B9DB5' : '#253549'"
              :stroke-width="i % 5 === 0 ? 2 : 1"
              stroke-linecap="round"
            />
          </g>

          <!-- Hour numbers -->
          <text
            v-for="h in [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]"
            :key="h"
            :x="110 + 82 * Math.sin((h * 30 * Math.PI) / 180)"
            :y="110 - 82 * Math.cos((h * 30 * Math.PI) / 180)"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#4A6180"
            font-size="11"
            font-weight="600"
          >
            {{ h }}
          </text>

          <!-- Hour hand -->
          <line
            :transform="`rotate(${hourDeg}, 110, 110)`"
            x1="110"
            y1="110"
            x2="110"
            y2="52"
            stroke="#F0EDE6"
            stroke-width="5"
            stroke-linecap="round"
          />
          <!-- Minute hand -->
          <line
            :transform="`rotate(${minuteDeg}, 110, 110)`"
            x1="110"
            y1="110"
            x2="110"
            y2="36"
            stroke="#8B9DB5"
            stroke-width="3.5"
            stroke-linecap="round"
          />
          <!-- Second hand -->
          <line
            :transform="`rotate(${secondDeg}, 110, 110)`"
            x1="110"
            y1="124"
            x2="110"
            y2="30"
            stroke="#FF6B4A"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <!-- Center dot -->
          <circle cx="110" cy="110" r="5" fill="#FF6B4A" />
          <circle cx="110" cy="110" r="2.5" fill="#F0EDE6" />
        </svg>

        <!-- Digital time -->
        <div
          class="font-display text-6xl sm:text-7xl font-bold tabular-nums text-text-primary tracking-tight"
        >
          {{ timeStr }}
        </div>
      </div>

      <!-- Day progress bar -->
      <section class="mb-10 animate-fade-up animate-delay-4">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-4">
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Tiến độ ngày hôm nay
        </h2>
        <div class="border border-border-default bg-bg-surface p-5">
          <div class="flex justify-between text-xs text-text-dim mb-2 font-mono">
            <span>00:00</span>
            <span class="text-text-secondary">{{ Math.round(dayProgress) }}% đã trôi qua</span>
            <span>23:59</span>
          </div>
          <div class="h-2 bg-bg-elevated border border-border-default overflow-hidden">
            <div
              class="h-full bg-accent-coral transition-all duration-1000"
              :style="{ width: `${dayProgress}%` }"
            />
          </div>
        </div>
      </section>

      <!-- Countdowns -->
      <section class="mb-10 animate-fade-up animate-delay-5">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-4">
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Đếm ngược
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- End of day -->
          <div class="border border-border-default bg-bg-surface p-5">
            <div class="flex items-center gap-2 mb-3">
              <Icon icon="lucide:sunset" class="size-4 text-accent-amber" />
              <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                >Còn lại hôm nay</span
              >
            </div>
            <div class="font-mono font-bold tabular-nums text-accent-amber text-3xl">
              {{ toEndOfDay }}
            </div>
          </div>

          <!-- Weekend countdown -->
          <div
            class="border p-5 transition-colors"
            :class="
              weekendInfo.isWeekend
                ? 'border-accent-coral bg-accent-coral/5'
                : 'border-border-default bg-bg-surface'
            "
          >
            <div class="flex items-center gap-2 mb-3">
              <Icon icon="lucide:beer" class="size-4 text-accent-coral" />
              <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                >Đến cuối tuần</span
              >
            </div>
            <div
              class="font-mono font-bold tabular-nums text-3xl"
              :class="weekendInfo.isWeekend ? 'text-accent-coral' : 'text-accent-coral'"
            >
              {{ weekendInfo.label }}
            </div>
          </div>
        </div>
      </section>

      <!-- World clocks -->
      <section class="mb-12 animate-fade-up animate-delay-6">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-4">
          <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
          Giờ thế giới
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="city in worldTimes"
            :key="city.name"
            class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xl">{{ city.flag }}</span>
              <span class="text-xs text-text-dim font-display tracking-wide">{{ city.name }}</span>
            </div>
            <div class="font-mono font-bold tabular-nums text-text-primary text-lg">
              {{ city.time }}
            </div>
            <div class="text-xs text-text-dim mt-0.5">{{ city.date }}</div>
          </div>
        </div>
      </section>

      <!-- Back to Home -->
      <div class="text-center animate-fade-up animate-delay-7">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
