<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string // YYYY-MM-DD
  placeholder?: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLElement | null>(null)
const inputValue = ref('')
const dropdownPos = ref({ top: 0, left: 0, width: 300 })

const updateDropdownPos = () => {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  dropdownPos.value = {
    top: rect.bottom + 8,
    left: rect.left + rect.width / 2 - 150,
    width: 300,
  }
}

watch(isOpen, (open) => {
  if (open) {
    nextTick(updateDropdownPos)
  }
})

// Initialize internal input value from prop
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      const [y, m, d] = newVal.split('-')
      inputValue.value = `${d}/${m}/${y}`
    } else {
      inputValue.value = ''
    }
  },
  { immediate: true },
)

// Calendar logic
const viewDate = ref(new Date())
const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const days = []

  // Previous month padding
  const prevMonthLastDay = daysInMonth(year, month - 1)
  const startDay = startDayOfMonth(year, month)
  // Adjust for Monday start if needed, but standard is Sunday (0)
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      current: false,
      date: new Date(year, month - 1, prevMonthLastDay - i),
    })
  }

  // Current month
  const totalDays = daysInMonth(year, month)
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, current: true, date: new Date(year, month, i) })
  }

  // Next month padding
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false, date: new Date(year, month + 1, i) })
  }

  return days
})

const monthYear = computed(() => {
  const months = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ]
  return `${months[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`
})

const changeMonth = (delta: number) => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + delta, 1)
}

const selectDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`

  // Update internal input value immediately for UX
  inputValue.value = `${d}/${m}/${y}`

  emit('update:modelValue', dateStr)
  isOpen.value = false
}

const isSelected = (date: Date) => {
  if (!props.modelValue || !props.modelValue.includes('-')) return false
  const parts = props.modelValue.split('-').map(Number)
  if (parts.length < 3) return false
  const [y, m, d] = parts
  return date.getFullYear() === y && date.getMonth() === (m as number) - 1 && date.getDate() === d
}

const isToday = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// Manual Input Mask/Validation
const handleInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')
  if (val.length > 8) val = val.slice(0, 8)

  let formatted = ''
  if (val.length > 0) {
    formatted = val.slice(0, 2)
    if (val.length > 2) {
      formatted += '/' + val.slice(2, 4)
      if (val.length > 4) {
        formatted += '/' + val.slice(4, 8)
      }
    }
  }

  inputValue.value = formatted

  // Set cursor position back correctly if needed
  // (Simple implementation for end of string)

  if (val.length === 8) {
    const d = val.slice(0, 2)
    const m = val.slice(2, 4)
    const y = val.slice(4)
    const dateStr = `${y}-${m}-${d}`
    // Validate date
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
    if (
      !isNaN(dateObj.getTime()) &&
      dateObj.getFullYear() === Number(y) &&
      dateObj.getMonth() === Number(m) - 1
    ) {
      emit('update:modelValue', dateStr)
    }
  }
}

// Click outside handling
const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="relative w-full group" ref="containerRef">
    <div v-if="label" class="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2 pl-1">
      {{ label }}
    </div>

    <div
      ref="inputRef"
      class="relative flex items-center bg-black/40 border border-white/10 rounded-2xl hover:border-accent-coral/30 transition-all duration-300 overflow-hidden"
      :class="{ 'ring-1 ring-accent-coral/20 border-accent-coral/40': isOpen }"
    >
      <div class="pl-5 pr-3 text-accent-coral/60 cursor-pointer" @click="isOpen = !isOpen">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      <input
        type="text"
        :value="inputValue"
        @input="handleInput"
        @focus="isOpen = true"
        :placeholder="placeholder || 'DD/MM/YYYY'"
        class="w-full bg-transparent py-4 pr-5 text-sm font-mono tracking-widest text-white outline-none placeholder:text-white/20"
      />
    </div>

    <!-- Calendar Dropdown (Teleport to body to escape modal overflow) -->
    <Teleport to="body">
      <Transition name="calendar">
        <div
          v-if="isOpen"
          class="fixed z-[200] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-3xl p-6"
          :style="{
            top: dropdownPos.top + 'px',
            left: dropdownPos.left + 'px',
            width: dropdownPos.width + 'px',
          }"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <button
              @click="changeMonth(-1)"
              class="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div class="font-display font-bold text-sm tracking-widest text-white">
              {{ monthYear }}
            </div>
            <button
              @click="changeMonth(1)"
              class="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <!-- Weekdays -->
          <div class="grid grid-cols-7 mb-4">
            <div
              v-for="day in ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']"
              :key="day"
              class="text-[9px] font-bold text-center opacity-30"
            >
              {{ day }}
            </div>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="(dateObj, idx) in calendarDays"
              :key="idx"
              @click="selectDate(dateObj.date)"
              :class="[
                'aspect-square flex items-center justify-center text-xs rounded-xl transition-all duration-300 relative',
                dateObj.current ? 'text-white' : 'text-white/20',
                isSelected(dateObj.date)
                  ? 'bg-accent-coral text-white font-bold shadow-lg shadow-accent-coral/30'
                  : 'hover:bg-white/5',
                isToday(dateObj.date) && !isSelected(dateObj.date)
                  ? 'border border-accent-coral/30'
                  : '',
              ]"
            >
              {{ dateObj.day }}
              <div
                v-if="isToday(dateObj.date)"
                class="absolute bottom-1.5 w-1 h-1 bg-accent-coral rounded-full"
              ></div>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.calendar-enter-active,
.calendar-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.calendar-enter-from,
.calendar-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
