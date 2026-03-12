<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useNow } from '@vueuse/core'

const now = useNow({ interval: 1000 })

// Tết Nguyên Đán 2026 (Năm Bính Ngọ) - 17/02/2026 00:00:00 giờ Việt Nam (UTC+7)
const TET_2026 = new Date('2026-02-17T00:00:00+07:00')

// Tết Nguyên Đán 2027 (Năm Đinh Mùi) - 06/02/2027 00:00:00 giờ Việt Nam (UTC+7)
const TET_2027 = new Date('2027-02-06T00:00:00+07:00')

const targetTet = computed(() => (now.value >= TET_2026 ? TET_2027 : TET_2026))
const tetYear = computed(() => (now.value >= TET_2026 ? 2027 : 2026))
const zodiacName = computed(() => (now.value >= TET_2026 ? 'Đinh Mùi' : 'Bính Ngọ'))
const zodiacIcon = computed(() => (now.value >= TET_2026 ? 'emojione:goat' : 'emojione:horse'))

const isTetNow = computed(() => {
  const diff = targetTet.value.getTime() - now.value.getTime()
  return diff <= 0 && diff > -86400000 // within the first day of Tết
})

const diff = computed(() => {
  const ms = targetTet.value.getTime() - now.value.getTime()
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: ms }
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, total: ms }
})

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const progressPercent = computed(() => {
  const yearStart = new Date(now.value.getFullYear(), 0, 1).getTime()
  const total = targetTet.value.getTime() - yearStart
  const elapsed = now.value.getTime() - yearStart
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <!-- Back to Home -->
      <div class="mb-8">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>

      <!-- Hero -->
      <header class="mb-12 text-center animate-fade-up">
        <div class="flex justify-center mb-4">
          <div
            class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
          >
            TẾT {{ tetYear }}
          </div>
        </div>
        <h1
          class="font-display text-4xl min-[375px]:text-5xl sm:text-6xl font-bold text-accent-coral"
        >
          Đếm Ngược Tết
        </h1>
        <p
          class="mt-3 text-text-secondary text-lg max-w-xl mx-auto animate-fade-up animate-delay-2"
        >
          Năm
          <span class="text-accent-amber font-semibold">{{ zodiacName }}</span>
          — Tết Nguyên Đán
          <span class="text-accent-amber font-semibold">{{ tetYear }}</span>
        </p>
        <div class="mt-2 flex justify-center items-center gap-2 animate-fade-up animate-delay-3">
          <Icon :icon="zodiacIcon" class="size-6" />
          <span class="text-text-dim text-sm">
            {{
              targetTet.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            }}
          </span>
        </div>
      </header>

      <!-- Tết arrived banner -->
      <div
        v-if="isTetNow"
        class="mb-10 border border-accent-coral bg-accent-coral/10 p-8 text-center animate-fade-up"
      >
        <div class="font-display text-5xl sm:text-7xl font-bold text-accent-coral mb-3">
          🎉 Chúc Mừng Năm Mới! 🎉
        </div>
        <p class="text-text-secondary text-lg">Năm {{ zodiacName }} đã đến rồi!</p>
      </div>

      <!-- Countdown blocks -->
      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 animate-fade-up animate-delay-2"
      >
        <!-- Days -->
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-2 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
        >
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-coral/5 select-none pointer-events-none"
          >
            D
          </span>
          <span class="font-display text-5xl sm:text-6xl font-bold text-accent-coral tabular-nums">
            {{ pad(diff.days) }}
          </span>
          <span class="text-text-dim text-xs tracking-widest font-display uppercase">Ngày</span>
        </div>

        <!-- Hours -->
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-2 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated"
        >
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
          >
            H
          </span>
          <span class="font-display text-5xl sm:text-6xl font-bold text-accent-amber tabular-nums">
            {{ pad(diff.hours) }}
          </span>
          <span class="text-text-dim text-xs tracking-widest font-display uppercase">Giờ</span>
        </div>

        <!-- Minutes -->
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-2 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated"
        >
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-sky/5 select-none pointer-events-none"
          >
            M
          </span>
          <span class="font-display text-5xl sm:text-6xl font-bold text-accent-sky tabular-nums">
            {{ pad(diff.minutes) }}
          </span>
          <span class="text-text-dim text-xs tracking-widest font-display uppercase">Phút</span>
        </div>

        <!-- Seconds -->
        <div
          class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-2 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
        >
          <span
            class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-coral/5 select-none pointer-events-none"
          >
            S
          </span>
          <span class="font-display text-5xl sm:text-6xl font-bold text-accent-coral tabular-nums">
            {{ pad(diff.seconds) }}
          </span>
          <span class="text-text-dim text-xs tracking-widest font-display uppercase">Giây</span>
        </div>
      </div>

      <!-- Progress bar -->
      <section class="mb-12 animate-fade-up animate-delay-3">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-amber text-sm tracking-widest font-display">//</span>
          Tiến độ năm nay
        </h2>
        <div class="border border-border-default bg-bg-surface p-6">
          <div class="flex justify-between text-xs text-text-dim font-mono mb-2">
            <span>01/01/{{ now.getFullYear() }}</span>
            <span class="text-accent-amber font-semibold">{{ progressPercent }}%</span>
            <span>Tết {{ tetYear }}</span>
          </div>
          <div class="h-2 bg-bg-elevated border border-border-default">
            <div
              class="h-full bg-accent-coral transition-all duration-1000"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
          <p class="mt-3 text-text-secondary text-sm text-center">
            Còn
            <span class="text-accent-coral font-semibold">{{ diff.days }}</span>
            ngày nữa là đến giao thừa!
          </p>
        </div>
      </section>

      <!-- Tet info -->
      <section class="mb-12 animate-fade-up animate-delay-4">
        <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-6">
          <span class="text-accent-sky text-sm tracking-widest font-display">//</span>
          Về Tết Nguyên Đán
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div
            class="border border-border-default bg-bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
          >
            <div class="flex items-center gap-3 mb-3">
              <Icon icon="lucide:calendar-heart" class="size-5 text-accent-coral shrink-0" />
              <h3 class="font-display text-lg font-semibold">Giao thừa</h3>
            </div>
            <p class="text-text-secondary text-sm">
              Thời điểm chuyển giao giữa năm cũ và năm mới theo lịch âm. Là khoảnh khắc linh thiêng
              nhất trong năm của người Việt.
            </p>
          </div>
          <div
            class="border border-border-default bg-bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent-amber hover:bg-bg-elevated"
          >
            <div class="flex items-center gap-3 mb-3">
              <Icon icon="lucide:gift" class="size-5 text-accent-amber shrink-0" />
              <h3 class="font-display text-lg font-semibold">Lì xì</h3>
            </div>
            <p class="text-text-secondary text-sm">
              Tục lệ tặng phong bao đỏ đựng tiền mừng tuổi cho trẻ em và người lớn tuổi, mang ý
              nghĩa may mắn và thịnh vượng.
            </p>
          </div>
          <div
            class="border border-border-default bg-bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent-sky hover:bg-bg-elevated"
          >
            <div class="flex items-center gap-3 mb-3">
              <Icon icon="lucide:sparkles" class="size-5 text-accent-sky shrink-0" />
              <h3 class="font-display text-lg font-semibold">Pháo hoa</h3>
            </div>
            <p class="text-text-secondary text-sm">
              Màn pháo hoa rực rỡ đón chào năm mới tại các thành phố lớn, đặc biệt tại Hà Nội và TP.
              Hồ Chí Minh.
            </p>
          </div>
          <div
            class="border border-border-default bg-bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated"
          >
            <div class="flex items-center gap-3 mb-3">
              <Icon icon="lucide:utensils" class="size-5 text-accent-coral shrink-0" />
              <h3 class="font-display text-lg font-semibold">Bánh chưng & Bánh tét</h3>
            </div>
            <p class="text-text-secondary text-sm">
              Món ăn truyền thống không thể thiếu trong dịp Tết. Bánh chưng ở miền Bắc, bánh tét ở
              miền Nam — gói trọn hương vị quê hương.
            </p>
          </div>
        </div>
      </section>

      <!-- Dot divider -->
      <div class="flex gap-1.5 justify-center mt-12">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>
    </div>
  </div>
</template>
