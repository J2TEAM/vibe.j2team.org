<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

const props = defineProps<{
  selectedDate: Date
}>()

const emit = defineEmits<{
  prev: []
  next: []
  today: []
  selectDate: [date: Date]
}>()

const isToday = computed(() => {
  const now = new Date()
  const d = props.selectedDate
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
})

const displayDate = computed(() => {
  return props.selectedDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

const weekDays = computed(() => {
  const days: Date[] = []
  const current = new Date(props.selectedDate)
  const dayOfWeek = current.getDay()
  const monday = new Date(current)
  monday.setDate(current.getDate() - ((dayOfWeek + 6) % 7))

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
})

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isDayToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
</script>

<template>
  <div class="border border-border-default bg-bg-surface p-4">
    <!-- Header with arrows -->
    <div class="mb-3 flex items-center justify-between">
      <button
        class="flex size-9 items-center justify-center border border-border-default text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @click="emit('prev')"
      >
        <Icon icon="lucide:chevron-left" class="size-5" />
      </button>

      <div class="text-center">
        <div class="font-display text-sm font-semibold capitalize text-text-primary">
          {{ displayDate }}
        </div>
      </div>

      <button
        class="flex size-9 items-center justify-center border border-border-default text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @click="emit('next')"
      >
        <Icon icon="lucide:chevron-right" class="size-5" />
      </button>
    </div>

    <!-- Week days -->
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="(day, index) in weekDays"
        :key="day.toISOString()"
        class="flex flex-col items-center gap-0.5 rounded px-1 py-1.5 text-xs transition"
        :class="[
          isSameDay(day, selectedDate)
            ? 'bg-accent-coral text-white'
            : isDayToday(day)
              ? 'border border-accent-amber/50 text-accent-amber hover:bg-bg-elevated'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
        ]"
        @click="emit('selectDate', day)"
      >
        <span class="text-[10px] uppercase opacity-70">{{ dayLabels[index] }}</span>
        <span class="font-semibold">{{ day.getDate() }}</span>
      </button>
    </div>

    <!-- Today button -->
    <button
      v-if="!isToday"
      class="mt-3 w-full border border-border-default px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      @click="emit('today')"
    >
      Hôm nay
    </button>
  </div>
</template>
