<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { AppView, TripPlan } from '../types'
import { TRIP_TYPE_ICONS, TRIP_TYPE_LABELS } from '../types'

defineProps<{
  trips: TripPlan[]
}>()

const emit = defineEmits<{
  navigate: [view: AppView, id?: string]
  delete: [id: string]
}>()

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function daysUntil(d: string): string {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'Đã qua'
  if (diff === 0) return 'Hôm nay!'
  if (diff === 1) return 'Ngày mai'
  return `Còn ${diff} ngày`
}

function daysClass(d: string): string {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'text-text-dim'
  if (diff <= 1) return 'text-accent-coral'
  if (diff <= 7) return 'text-accent-amber'
  return 'text-accent-sky'
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        <h2 class="font-display text-2xl font-semibold text-text-primary">Kế hoạch của bạn</h2>
      </div>
      <button
        class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-5 py-2.5 text-sm font-semibold text-accent-coral transition hover:bg-accent-coral/20"
        @click="emit('navigate', 'create')"
      >
        <Icon icon="lucide:plus" class="size-4" />
        Lên kế hoạch
      </button>
    </div>

    <div
      v-if="trips.length === 0"
      class="border border-border-default bg-bg-surface p-12 text-center"
    >
      <div class="mb-4 text-5xl">🗺️</div>
      <p class="text-text-secondary">Chưa có kế hoạch nào</p>
      <p class="mt-1 text-sm text-text-dim">Hãy bắt đầu lên kế hoạch cho chuyến đi tiếp theo!</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="(trip, i) in trips"
        :key="trip.id"
        class="group relative cursor-pointer border border-border-default bg-bg-surface p-5 transition hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
        :style="{ animationDelay: `${i * 60}ms` }"
        @click="emit('navigate', 'detail', trip.id)"
      >
        <!-- Cover emoji -->
        <div
          class="absolute right-4 top-3 select-none text-5xl opacity-10 transition group-hover:opacity-20"
        >
          {{ trip.coverEmoji }}
        </div>

        <div class="relative">
          <div class="mb-3 flex items-center gap-2">
            <span :class="['text-xs font-semibold', daysClass(trip.date)]">
              {{ daysUntil(trip.date) }}
            </span>
            <span class="inline-flex items-center gap-1 text-xs text-text-dim">
              <Icon :icon="TRIP_TYPE_ICONS[trip.type]" class="size-3" />
              {{ TRIP_TYPE_LABELS[trip.type] }}
            </span>
          </div>

          <h3 class="font-display text-lg font-semibold text-text-primary">
            {{ trip.title }}
          </h3>

          <p v-if="trip.description" class="mt-1 line-clamp-2 text-sm text-text-secondary">
            {{ trip.description }}
          </p>

          <div class="mt-3 flex items-center gap-4 text-xs text-text-dim">
            <span class="inline-flex items-center gap-1">
              <Icon icon="lucide:calendar" class="size-3.5" />
              {{ formatDate(trip.date) }}
            </span>
            <span v-if="trip.members.length > 0" class="inline-flex items-center gap-1">
              <Icon icon="lucide:users" class="size-3.5" />
              {{ trip.members.length }}
            </span>
            <span v-if="trip.activities.length > 0" class="inline-flex items-center gap-1">
              <Icon icon="lucide:list-checks" class="size-3.5" />
              {{ trip.activities.filter((a) => a.done).length }}/{{ trip.activities.length }}
            </span>
          </div>

          <!-- Member avatars -->
          <div v-if="trip.members.length > 0" class="mt-3 flex -space-x-1">
            <span
              v-for="m in trip.members.slice(0, 5)"
              :key="m.id"
              class="inline-flex size-7 items-center justify-center border-2 border-bg-surface bg-bg-elevated text-xs"
              :title="m.name"
            >
              {{ m.avatar }}
            </span>
            <span
              v-if="trip.members.length > 5"
              class="inline-flex size-7 items-center justify-center border-2 border-bg-surface bg-bg-elevated text-[10px] text-text-dim"
            >
              +{{ trip.members.length - 5 }}
            </span>
          </div>
        </div>

        <!-- Delete -->
        <button
          class="absolute bottom-4 right-4 p-1.5 text-text-dim opacity-0 transition hover:text-accent-coral group-hover:opacity-100"
          title="Xóa"
          @click.stop="emit('delete', trip.id)"
        >
          <Icon icon="lucide:trash-2" class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>
