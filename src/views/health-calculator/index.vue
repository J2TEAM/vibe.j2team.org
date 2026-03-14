<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage, useClipboard } from '@vueuse/core'

const gender = useLocalStorage('health-gender', 'male')
const weight = useLocalStorage('health-weight', 70)
const height = useLocalStorage('health-height', 170)
const age = useLocalStorage('health-age', 25)
const activityLevel = ref(1.2)

const bmi = computed(() => {
  const hMeter = height.value / 100
  return parseFloat((weight.value / (hMeter * hMeter)).toFixed(1))
})

const bmiCategory = computed(() => {
  if (bmi.value < 18.5) return { label: 'Gầy', color: 'text-sky-400', bg: 'bg-sky-400/10' }
  if (bmi.value < 24.9)
    return { label: 'Bình thường', color: 'text-green-400', bg: 'bg-green-400/10' }
  if (bmi.value < 29.9)
    return { label: 'Tiền béo phì', color: 'text-accent-amber', bg: 'bg-accent-amber/10' }
  return { label: 'Béo phì', color: 'text-accent-coral', bg: 'bg-accent-coral/10' }
})

const tdee = computed(() => {
  let bmr = 10 * weight.value + 6.25 * height.value - 5 * age.value
  bmr = gender.value === 'male' ? bmr + 5 : bmr - 161
  return Math.round(bmr * activityLevel.value)
})

const waterIntake = computed(() => (weight.value * 0.033).toFixed(1))

const wakeUpTime = ref('06:30')
const sleepCycles = computed(() => {
  const parts = wakeUpTime.value.split(':')
  const h = parseInt(parts[0] || '0', 10)
  const m = parseInt(parts[1] || '0', 10)

  const date = new Date()
  date.setHours(h, m, 0)

  return [9, 7.5, 6].map((hours) => {
    const d = new Date(date.getTime() - hours * 60 * 60 * 1000)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  })
})

const beerAmount = ref(0)
const beerAlco = ref(5)
const hoursSinceDrink = ref(1)
const bac = computed(() => {
  if (beerAmount.value === 0) return 0
  const eth = beerAmount.value * (beerAlco.value / 100) * 0.8
  const r = gender.value === 'male' ? 0.68 : 0.55
  const res = eth / (weight.value * r) - 0.015 * hoursSinceDrink.value
  return Math.max(0, parseFloat(res.toFixed(3)))
})

const { copy, copied } = useClipboard()
const shareResult = () => {
  const text = `Chỉ số sức khỏe: BMI ${bmi.value} (${bmiCategory.value.label}), TDEE ${tdee.value} kcal/ngày.`
  copy(text)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20">
    <div class="max-w-5xl mx-auto px-4 py-12">
      <header class="mb-12 text-center">
        <div class="inline-flex p-3 bg-green-500/10 rounded-full mb-4">
          <Icon icon="lucide:activity" class="size-8 text-green-400" />
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4 font-display italic">
          Sức Khỏe & Lối Sống
        </h1>
        <p class="text-text-secondary max-w-xl mx-auto">
          Theo dõi các chỉ số cơ thể và xây dựng thói quen sinh hoạt lành mạnh.
        </p>
      </header>

      <section class="bg-bg-surface border border-border-default p-6 rounded-sm mb-8 shadow-lg">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label class="text-[10px] uppercase text-text-dim block mb-2 font-bold tracking-widest"
              >Giới tính</label
            >
            <select
              v-model="gender"
              class="w-full bg-bg-elevated border border-border-default p-2 text-sm outline-none focus:border-green-400"
            >
              <option value="male">Nam giới</option>
              <option value="female">Nữ giới</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] uppercase text-text-dim block mb-2 font-bold tracking-widest"
              >Cân nặng (kg)</label
            >
            <input
              v-model.number="weight"
              type="number"
              class="w-full bg-bg-elevated border border-border-default p-2 text-sm outline-none focus:border-green-400"
            />
          </div>
          <div>
            <label class="text-[10px] uppercase text-text-dim block mb-2 font-bold tracking-widest"
              >Chiều cao (cm)</label
            >
            <input
              v-model.number="height"
              type="number"
              class="w-full bg-bg-elevated border border-border-default p-2 text-sm outline-none focus:border-green-400"
            />
          </div>
          <div>
            <label class="text-[10px] uppercase text-text-dim block mb-2 font-bold tracking-widest"
              >Tuổi</label
            >
            <input
              v-model.number="age"
              type="number"
              class="w-full bg-bg-elevated border border-border-default p-2 text-sm outline-none focus:border-green-400"
            />
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-1 space-y-8">
          <div
            class="bg-bg-surface border border-border-default p-6 rounded-sm relative overflow-hidden"
          >
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="lucide:user" class="text-accent-sky" /> Chỉ số BMI
            </h2>
            <div class="text-center py-4">
              <div class="text-5xl font-black font-display mb-2" :class="bmiCategory.color">
                {{ bmi }}
              </div>
              <div
                class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter"
                :class="[bmiCategory.bg, bmiCategory.color]"
              >
                {{ bmiCategory.label }}
              </div>
            </div>
          </div>

          <div class="bg-bg-surface border border-border-default p-6 rounded-sm">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
              <Icon icon="lucide:droplets" class="text-sky-400" /> Nước Uống Mỗi Ngày
            </h2>
            <div class="flex items-end justify-center gap-2 py-4">
              <span class="text-4xl font-bold text-white">{{ waterIntake }}</span>
              <span class="text-sky-400 font-bold mb-1 italic tracking-widest text-xl">LÍT</span>
            </div>
            <div class="space-y-2 mt-4">
              <div class="h-1.5 w-full bg-bg-deep rounded-full overflow-hidden">
                <div class="bg-sky-400 h-full w-2/3"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1 space-y-8">
          <div class="bg-bg-surface border border-border-default p-6 rounded-sm h-full">
            <h2 class="text-lg font-bold mb-6 flex items-center gap-2 text-accent-amber">
              <Icon icon="lucide:flame" /> Nhu Cầu Calo (TDEE)
            </h2>
            <div class="mb-6">
              <label class="text-[10px] text-text-dim block mb-2 uppercase">Mức độ vận động</label>
              <select
                v-model="activityLevel"
                class="w-full bg-bg-elevated border border-border-default p-2 text-xs outline-none"
              >
                <option :value="1.2">Ít vận động</option>
                <option :value="1.375">Nhẹ (1-3 buổi/tuần)</option>
                <option :value="1.55">Vừa (3-5 buổi/tuần)</option>
                <option :value="1.725">Nặng (6-7 buổi/tuần)</option>
              </select>
            </div>
            <div
              class="p-6 bg-accent-amber/5 border border-dashed border-accent-amber/30 text-center rounded-sm"
            >
              <p class="text-4xl font-bold text-accent-amber font-display tracking-tighter">
                {{ tdee }} <span class="text-sm">kcal</span>
              </p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1 space-y-8">
          <div class="bg-bg-surface border border-border-default p-6 rounded-sm">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-400">
              <Icon icon="lucide:moon" /> Chu Kỳ Giấc Ngủ
            </h2>
            <input
              v-model="wakeUpTime"
              type="time"
              class="w-full bg-bg-elevated border border-border-default p-2 mb-4 outline-none font-mono"
            />
            <div class="flex flex-wrap gap-2">
              <span
                v-for="time in sleepCycles"
                :key="time"
                class="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-mono font-bold"
              >
                {{ time }}
              </span>
            </div>
          </div>

          <div class="bg-bg-surface border border-border-default p-6 rounded-sm">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-accent-coral">
              <Icon icon="lucide:beer" /> Nồng Độ Cồn (BAC)
            </h2>
            <div class="grid grid-cols-2 gap-3 mb-4">
              <input
                v-model.number="beerAmount"
                type="number"
                class="w-full bg-bg-elevated border border-border-default p-1 text-xs outline-none"
                placeholder="ml"
              />
              <input
                v-model.number="beerAlco"
                type="number"
                class="w-full bg-bg-elevated border border-border-default p-1 text-xs outline-none"
                placeholder="%"
              />
            </div>
            <div
              class="text-center p-3"
              :class="
                bac > 0 ? 'bg-accent-coral/10 text-accent-coral' : 'bg-green-400/10 text-green-400'
              "
            >
              <div class="text-2xl font-black">{{ bac }}%</div>
            </div>
          </div>
        </div>
      </div>

      <footer class="mt-16 flex flex-col items-center gap-6">
        <button
          @click="shareResult"
          class="flex items-center gap-2 text-text-dim hover:text-green-400 transition text-sm"
        >
          <Icon :icon="copied ? 'lucide:check-circle' : 'lucide:share-2'" />
          {{ copied ? 'Đã copy' : 'Chia sẻ chỉ số' }}
        </button>
        <RouterLink
          to="/"
          class="group flex items-center gap-2 px-8 py-3 border border-border-default hover:border-green-400 transition-all text-sm uppercase tracking-widest"
        >
          <Icon icon="lucide:arrow-left" class="group-hover:-translate-x-1 transition-transform" />
          Quay lại trang chủ
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
</style>
