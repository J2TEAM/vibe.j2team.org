<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage, useClipboard } from '@vueuse/core'

const name = useLocalStorage('spirit-name', 'Quoc Developer')
const birthday = useLocalStorage('spirit-dob', '2000-01-01')

const getZodiac = computed(() => {
  const date = new Date(birthday.value)
  const m = date.getMonth() + 1
  const d = date.getDate()
  if ((m == 3 && d >= 21) || (m == 4 && d <= 19))
    return { n: 'Bạch Dương', e: 'Lửa', i: 'lucide:zap', c: 'text-orange-500' }
  if ((m == 4 && d >= 20) || (m == 5 && d <= 20))
    return { n: 'Kim Ngưu', e: 'Đất', i: 'lucide:mountain', c: 'text-emerald-500' }
  if ((m == 5 && d >= 21) || (m == 6 && d <= 21))
    return { n: 'Song Tử', e: 'Khí', i: 'lucide:wind', c: 'text-sky-400' }
  if ((m == 6 && d >= 22) || (m == 7 && d <= 22))
    return { n: 'Cự Giải', e: 'Nước', i: 'lucide:droplets', c: 'text-blue-400' }
  if ((m == 7 && d >= 23) || (m == 8 && d <= 22))
    return { n: 'Sư Tử', e: 'Lửa', i: 'lucide:sun', c: 'text-yellow-500' }
  if ((m == 8 && d >= 23) || (m == 9 && d <= 22))
    return { n: 'Xử Nữ', e: 'Đất', i: 'lucide:leaf', c: 'text-green-600' }
  if ((m == 9 && d >= 23) || (m == 10 && d <= 23))
    return { n: 'Thiên Bình', e: 'Khí', i: 'lucide:scale', c: 'text-pink-400' }
  if ((m == 10 && d >= 24) || (m == 11 && d <= 22))
    return { n: 'Bọ Cạp', e: 'Nước', i: 'lucide:skull', c: 'text-purple-600' }
  if ((m == 11 && d >= 23) || (m == 12 && d <= 21))
    return { n: 'Nhân Mã', e: 'Lửa', i: 'lucide:send', c: 'text-red-500' }
  if ((m == 12 && d >= 22) || (m == 1 && d <= 19))
    return { n: 'Ma Kết', e: 'Đất', i: 'lucide:anchor', c: 'text-gray-500' }
  if ((m == 1 && d >= 20) || (m == 2 && d <= 18))
    return { n: 'Bảo Bình', e: 'Khí', i: 'lucide:waves', c: 'text-cyan-400' }
  return { n: 'Song Ngư', e: 'Nước', i: 'lucide:fish', c: 'text-indigo-400' }
})

const nameVibration = computed(() => {
  const charMap: Record<string, number> = {
    a: 1,
    j: 1,
    s: 1,
    b: 2,
    k: 2,
    t: 2,
    c: 3,
    l: 3,
    u: 3,
    d: 4,
    m: 4,
    v: 4,
    e: 5,
    n: 5,
    w: 5,
    f: 6,
    o: 6,
    x: 6,
    g: 7,
    p: 7,
    y: 7,
    h: 8,
    q: 8,
    z: 8,
    i: 9,
    r: 9,
  }
  const sum = name.value
    .toLowerCase()
    .replace(/\s/g, '')
    .split('')
    .reduce((acc, char) => acc + (charMap[char] || 0), 0)
  return sum % 9 || 9
})

const biorhythm = computed(() => {
  const start = new Date(birthday.value).getTime()
  const end = new Date().getTime()
  const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24))
  const physical = Math.sin((2 * Math.PI * diff) / 23)
  const emotional = Math.sin((2 * Math.PI * diff) / 28)
  const intellectual = Math.sin((2 * Math.PI * diff) / 33)
  return {
    p: Math.round((physical + 1) * 50),
    e: Math.round((emotional + 1) * 50),
    i: Math.round((intellectual + 1) * 50),
  }
})

const messages = [
  'Năng lượng hôm nay thích hợp để bắt đầu một dự án mới.',
  'Hãy tin vào trực giác, vũ trụ đang gửi tín hiệu cho bạn.',
  'Sự kiên nhẫn là chìa khóa để khai mở tần số thịnh vượng.',
  'Một cuộc gặp gỡ tình cờ sẽ mang lại cơ hội lớn.',
  'Dành thời gian tĩnh lặng để tái tạo rung động cá nhân.',
]
const randomMsg = ref(messages[Math.floor(Math.random() * messages.length)])

const { copy, copied } = useClipboard()

const handleCopy = () => {
  copy(window.location.href)
}
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-slate-200 font-body overflow-x-hidden relative">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"
      ></div>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-16 relative z-10">
      <header class="text-center mb-16">
        <div class="inline-block animate-pulse mb-4">
          <Icon icon="lucide:sparkles" class="size-10 text-purple-400" />
        </div>
        <h1
          class="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-4 italic uppercase"
        >
          Vũ Trụ Vô Cực
        </h1>
        <p class="text-slate-400 font-light tracking-[0.2em] uppercase text-xs">
          Giải mã tần số & Định vị bản mệnh
        </p>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div class="bg-white/5 border border-white/10 p-6 backdrop-blur-md">
          <label class="text-[10px] uppercase tracking-widest text-purple-400 mb-2 block"
            >Danh xưng</label
          >
          <input
            v-model="name"
            type="text"
            class="w-full bg-transparent border-b border-white/20 py-2 outline-none focus:border-purple-400 text-xl font-display"
          />
        </div>
        <div class="bg-white/5 border border-white/10 p-6 backdrop-blur-md">
          <label class="text-[10px] uppercase tracking-widest text-blue-400 mb-2 block"
            >Ngày sinh khởi nguyên</label
          >
          <input
            v-model="birthday"
            type="date"
            class="w-full bg-transparent border-b border-white/20 py-2 outline-none focus:border-blue-400 text-xl font-mono"
          />
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 group relative">
          <div
            class="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"
          ></div>
          <div
            class="relative bg-black border border-white/10 p-8 h-full flex flex-col justify-between"
          >
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-3xl font-bold mb-1">{{ getZodiac.n }}</h2>
                <p class="text-xs uppercase tracking-widest text-slate-500">
                  Nguyên tố: {{ getZodiac.e }}
                </p>
              </div>
              <Icon :icon="getZodiac.i" class="size-12" :class="getZodiac.c" />
            </div>
            <div class="mt-8 p-4 bg-white/5 border-l-2 border-purple-500">
              <p class="text-xs italic text-slate-300">"{{ randomMsg }}"</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white/5 border border-white/10 p-8 flex flex-col items-center justify-center text-center"
        >
          <h3 class="text-xs uppercase tracking-[0.3em] text-slate-500 mb-6">Chỉ số Rung Động</h3>
          <div class="relative">
            <div class="absolute inset-0 animate-ping bg-purple-500/20 rounded-full"></div>
            <div
              class="size-24 border-2 border-purple-500 rounded-full flex items-center justify-center text-4xl font-black text-purple-400 relative z-10"
            >
              {{ nameVibration }}
            </div>
          </div>
          <p class="mt-6 text-sm italic text-slate-400">
            Năng lượng {{ nameVibration > 5 ? 'Kiến tạo' : 'Cân bằng' }}
          </p>
        </div>

        <div class="lg:col-span-3 bg-white/5 border border-white/10 p-8">
          <h3 class="text-xl font-bold mb-8 flex items-center gap-2 italic">
            <Icon icon="lucide:activity" /> Nhịp Sinh Học
          </h3>
          <div class="space-y-8 text-xs tracking-widest uppercase">
            <div>
              <div class="flex justify-between mb-2">
                <span>Thể chất</span><span>{{ biorhythm.p }}%</span>
              </div>
              <div class="h-1 bg-white/10 w-full overflow-hidden">
                <div class="h-full bg-red-500" :style="{ width: biorhythm.p + '%' }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <span>Cảm xúc</span><span>{{ biorhythm.e }}%</span>
              </div>
              <div class="h-1 bg-white/10 w-full overflow-hidden">
                <div class="h-full bg-blue-500" :style="{ width: biorhythm.e + '%' }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <span>Trí tuệ</span><span>{{ biorhythm.i }}%</span>
              </div>
              <div class="h-1 bg-white/10 w-full overflow-hidden">
                <div class="h-full bg-purple-500" :style="{ width: biorhythm.i + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="mt-20 flex flex-col items-center gap-8">
        <button
          @click="handleCopy"
          class="group relative px-6 py-3 overflow-hidden border border-purple-500/50 text-purple-400 hover:text-white transition-colors"
        >
          <span
            class="absolute inset-0 bg-purple-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          ></span>
          <span
            class="relative flex items-center gap-2 text-xs uppercase tracking-widest font-bold"
          >
            <Icon :icon="copied ? 'lucide:check' : 'lucide:share-2'" />
            {{ copied ? 'Đã sao chép' : 'Chia sẻ tần số' }}
          </span>
        </button>
        <RouterLink
          to="/"
          class="text-slate-500 hover:text-white transition-colors text-[10px] uppercase tracking-[0.5em] flex items-center gap-2"
        >
          <Icon icon="lucide:arrow-left" /> Trở về thực tại
        </RouterLink>
      </footer>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}
input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
</style>
