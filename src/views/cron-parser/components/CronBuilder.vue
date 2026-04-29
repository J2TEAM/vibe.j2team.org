<script setup lang="ts">
import { reactive, watch, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'

import type { CronFormat } from '../types'

const props = defineProps<{
  currentExpression: string
  format: CronFormat
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

const state = reactive({
  second: '0',
  minute: '*',
  hour: '*',
  dayOfMonth: '*',
  month: '*',
  dayOfWeek: '*',
})

// Options for dropdowns
const secondOptions = [
  { label: 'Giây 0', value: '0' },
  { label: 'Mỗi giây (*)', value: '*' },
  { label: 'Mỗi 5 giây (*/5)', value: '*/5' },
  ...Array.from({ length: 60 }, (_, i) => ({ label: `Giây ${i}`, value: `${i}` })),
]

const minuteOptions = [
  { label: 'Mỗi phút (*)', value: '*' },
  { label: 'Phút chẵn (*/2)', value: '*/2' },
  { label: 'Mỗi 5 phút (*/5)', value: '*/5' },
  { label: 'Mỗi 15 phút (*/15)', value: '*/15' },
  { label: 'Mỗi 30 phút (*/30)', value: '*/30' },
  ...Array.from({ length: 60 }, (_, i) => ({ label: `Phút ${i}`, value: `${i}` })),
]

const hourOptions = [
  { label: 'Mỗi giờ (*)', value: '*' },
  { label: 'Giờ chẵn (*/2)', value: '*/2' },
  { label: 'Mỗi 6 giờ (*/6)', value: '*/6' },
  { label: 'Mỗi 12 giờ (*/12)', value: '*/12' },
  ...Array.from({ length: 24 }, (_, i) => ({ label: `${i} giờ`, value: `${i}` })),
]

const dayOfMonthOptions = [
  { label: 'Mỗi ngày (*)', value: '*' },
  ...Array.from({ length: 31 }, (_, i) => ({ label: `Ngày ${i + 1}`, value: `${i + 1}` })),
]

const monthOptions = [
  { label: 'Mỗi tháng (*)', value: '*' },
  { label: 'Tháng 1', value: '1' },
  { label: 'Tháng 2', value: '2' },
  { label: 'Tháng 3', value: '3' },
  { label: 'Tháng 4', value: '4' },
  { label: 'Tháng 5', value: '5' },
  { label: 'Tháng 6', value: '6' },
  { label: 'Tháng 7', value: '7' },
  { label: 'Tháng 8', value: '8' },
  { label: 'Tháng 9', value: '9' },
  { label: 'Tháng 10', value: '10' },
  { label: 'Tháng 11', value: '11' },
  { label: 'Tháng 12', value: '12' },
]

const dayOfWeekOptions = [
  { label: 'Mỗi ngày trong tuần (*)', value: '*' },
  { label: 'Thứ Hai', value: '1' },
  { label: 'Thứ Ba', value: '2' },
  { label: 'Thứ Tư', value: '3' },
  { label: 'Thứ Năm', value: '4' },
  { label: 'Thứ Sáu', value: '5' },
  { label: 'Thứ Bảy', value: '6' },
  { label: 'Chủ Nhật', value: '0' },
]

const updateFromState = () => {
  let expr = ''
  if (props.format === 'quartz') {
    expr = `${state.second} ${state.minute} ${state.hour} ${state.dayOfMonth} ${state.month} ${state.dayOfWeek}`
  } else {
    expr = `${state.minute} ${state.hour} ${state.dayOfMonth} ${state.month} ${state.dayOfWeek}`
  }
  emit('update', expr)
}

const parseExpression = (expr: string) => {
  const parts = expr.trim().split(/\s+/)
  if (parts.length === 6) {
    const [second = '0', minute = '*', hour = '*', dayOfMonth = '*', month = '*', dayOfWeek = '*'] =
      parts
    state.second = second
    state.minute = minute
    state.hour = hour
    state.dayOfMonth = dayOfMonth
    state.month = month
    state.dayOfWeek = dayOfWeek
  } else if (parts.length === 5) {
    const [minute = '*', hour = '*', dayOfMonth = '*', month = '*', dayOfWeek = '*'] = parts
    state.second = '0'
    state.minute = minute
    state.hour = hour
    state.dayOfMonth = dayOfMonth
    state.month = month
    state.dayOfWeek = dayOfWeek
  }
}

watch([() => props.currentExpression, () => props.format], () => {
  const current =
    props.format === 'quartz'
      ? `${state.second} ${state.minute} ${state.hour} ${state.dayOfMonth} ${state.month} ${state.dayOfWeek}`
      : `${state.minute} ${state.hour} ${state.dayOfMonth} ${state.month} ${state.dayOfWeek}`

  if (props.currentExpression !== current) {
    parseExpression(props.currentExpression)
  }
})

onMounted(() => {
  parseExpression(props.currentExpression)
})

const presets = computed(() => {
  if (props.format === 'quartz') {
    return [
      { name: 'Mỗi giây', value: '* * * * * *' },
      { name: 'Mỗi 5 giây', value: '*/5 * * * * *' },
      { name: 'Mỗi phút', value: '0 * * * * *' },
      { name: 'Hàng ngày (00:00:00)', value: '0 0 0 * * *' },
    ]
  }
  return [
    { name: 'Mỗi phút', value: '* * * * *' },
    { name: 'Mỗi 5 phút', value: '*/5 * * * *' },
    { name: 'Mỗi giờ', value: '0 * * * *' },
    { name: 'Hàng ngày (00:00)', value: '0 0 * * *' },
    { name: 'Hàng tuần (CN 00:00)', value: '0 0 * * 0' },
    { name: 'Hàng tháng (Ngày 1)', value: '0 0 1 * *' },
  ]
})
</script>

<template>
  <div class="space-y-8">
    <!-- Presets -->
    <div>
      <h3 class="text-xs font-display tracking-widest text-text-dim mb-4 uppercase">
        Mẫu biểu thức nhanh ({{ format.toUpperCase() }})
      </h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in presets"
          :key="preset.value"
          @click="emit('update', preset.value)"
          class="px-3 py-1.5 text-xs border border-border-default bg-bg-deep text-text-secondary hover:border-accent-coral hover:text-text-primary transition-all"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- Field Selectors -->
    <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
      <!-- Second (only for Quartz) -->
      <div v-if="format === 'quartz'" class="space-y-2">
        <label
          class="text-[10px] font-display tracking-widest text-accent-sky uppercase flex items-center gap-1"
        >
          <Icon icon="lucide:timer" class="size-3" />
          Giây
        </label>
        <select
          v-model="state.second"
          @change="updateFromState"
          class="w-full bg-bg-deep border border-border-default text-text-primary px-3 py-2 text-sm focus:border-accent-sky outline-none appearance-none"
        >
          <option v-for="opt in secondOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <!-- Minute -->
      <div class="space-y-2">
        <label
          class="text-[10px] font-display tracking-widest text-accent-coral uppercase flex items-center gap-1"
        >
          <Icon icon="lucide:clock" class="size-3" />
          Phút
        </label>
        <select
          v-model="state.minute"
          @change="updateFromState"
          class="w-full bg-bg-deep border border-border-default text-text-primary px-3 py-2 text-sm focus:border-accent-coral outline-none appearance-none"
        >
          <option v-for="opt in minuteOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Hour -->
      <div class="space-y-2">
        <label
          class="text-[10px] font-display tracking-widest text-accent-coral uppercase flex items-center gap-1"
        >
          <Icon icon="lucide:sunrise" class="size-3" />
          Giờ
        </label>
        <select
          v-model="state.hour"
          @change="updateFromState"
          class="w-full bg-bg-deep border border-border-default text-text-primary px-3 py-2 text-sm focus:border-accent-coral outline-none appearance-none"
        >
          <option v-for="opt in hourOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Day -->
      <div class="space-y-2">
        <label
          class="text-[10px] font-display tracking-widest text-accent-coral uppercase flex items-center gap-1"
        >
          <Icon icon="lucide:calendar-days" class="size-3" />
          Ngày
        </label>
        <select
          v-model="state.dayOfMonth"
          @change="updateFromState"
          class="w-full bg-bg-deep border border-border-default text-text-primary px-3 py-2 text-sm focus:border-accent-coral outline-none appearance-none"
        >
          <option v-for="opt in dayOfMonthOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Month -->
      <div class="space-y-2">
        <label
          class="text-[10px] font-display tracking-widest text-accent-coral uppercase flex items-center gap-1"
        >
          <Icon icon="lucide:calendar" class="size-3" />
          Tháng
        </label>
        <select
          v-model="state.month"
          @change="updateFromState"
          class="w-full bg-bg-deep border border-border-default text-text-primary px-3 py-2 text-sm focus:border-accent-coral outline-none appearance-none"
        >
          <option v-for="opt in monthOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Weekday -->
      <div class="space-y-2">
        <label
          class="text-[10px] font-display tracking-widest text-accent-coral uppercase flex items-center gap-1"
        >
          <Icon icon="lucide:list" class="size-3" />
          Thứ
        </label>
        <select
          v-model="state.dayOfWeek"
          @change="updateFromState"
          class="w-full bg-bg-deep border border-border-default text-text-primary px-3 py-2 text-sm focus:border-accent-coral outline-none appearance-none"
        >
          <option v-for="opt in dayOfWeekOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A6180'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
}
</style>
