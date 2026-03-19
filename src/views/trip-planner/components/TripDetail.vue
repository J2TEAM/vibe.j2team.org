<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { Activity, BudgetItem, TripPlan } from '../types'
import { TRIP_TYPE_ICONS, TRIP_TYPE_LABELS } from '../types'
import { useShare } from '../composables/useShare'
import ActivitySection from './ActivitySection.vue'
import BudgetSection from './BudgetSection.vue'
import ChecklistSection from './ChecklistSection.vue'
import MemberSection from './MemberSection.vue'

defineProps<{
  trip: TripPlan
  total: number
  perPerson: number
}>()

const emit = defineEmits<{
  back: []
  addMember: [name: string]
  removeMember: [id: string]
  addActivity: [data: Omit<Activity, 'id' | 'done'>]
  toggleActivity: [id: string]
  removeActivity: [id: string]
  addBudget: [data: Omit<BudgetItem, 'id'>]
  removeBudget: [id: string]
  addChecklist: [text: string]
  toggleChecklist: [id: string]
  removeChecklist: [id: string]
}>()

const { exporting, sharing, exportImage, copyShareLink } = useShare()
const shareMsg = ref('')
const exportRef = ref<HTMLElement | null>(null)
const activeTab = ref<'schedule' | 'budget' | 'checklist'>('schedule')

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function daysUntil(d: string): string {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `Đã qua ${Math.abs(diff)} ngày`
  if (diff === 0) return 'Hôm nay!'
  if (diff === 1) return 'Ngày mai!'
  return `Còn ${diff} ngày nữa`
}

async function handleExport() {
  if (!exportRef.value) return
  await exportImage(exportRef.value, 'trip-plan')
}

async function handleShare(trip: TripPlan) {
  shareMsg.value = ''
  const isUrl = await copyShareLink(trip)
  shareMsg.value = isUrl
    ? 'Đã sao chép link chia sẻ!'
    : 'Dữ liệu lớn, đã sao chép mã. Gửi mã này cho người khác.'
  setTimeout(() => {
    shareMsg.value = ''
  }, 3000)
}

const tabs = [
  { key: 'schedule' as const, label: 'Lịch trình', icon: 'lucide:calendar-clock' },
  { key: 'budget' as const, label: 'Chi phí', icon: 'lucide:wallet' },
  { key: 'checklist' as const, label: 'Checklist', icon: 'lucide:list-checks' },
]
</script>

<template>
  <div>
    <button
      class="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
      @click="emit('back')"
    >
      <Icon icon="lucide:arrow-left" class="size-4" />
      Quay lại
    </button>

    <!-- ── Hero header ─────────────────────────────────── -->
    <div
      class="relative mb-8 overflow-hidden border border-border-default bg-bg-surface p-6 md:p-8"
    >
      <!-- Background emoji -->
      <div
        class="pointer-events-none absolute -right-4 -top-4 select-none text-[120px] opacity-[0.04]"
      >
        {{ trip.coverEmoji }}
      </div>

      <div class="relative">
        <div class="mb-4 flex items-center gap-3">
          <span class="text-3xl">{{ trip.coverEmoji }}</span>
          <div>
            <h2 class="font-display text-2xl font-bold text-text-primary md:text-3xl">
              {{ trip.title }}
            </h2>
            <p v-if="trip.description" class="mt-1 text-sm text-text-secondary">
              {{ trip.description }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-sm">
          <span class="inline-flex items-center gap-1.5 text-accent-amber">
            <Icon icon="lucide:calendar" class="size-4" />
            {{ formatDate(trip.date) }}
          </span>
          <span class="inline-flex items-center gap-1.5 font-semibold text-accent-coral">
            {{ daysUntil(trip.date) }}
          </span>
          <span class="inline-flex items-center gap-1.5 text-text-dim">
            <Icon :icon="TRIP_TYPE_ICONS[trip.type]" class="size-4" />
            {{ TRIP_TYPE_LABELS[trip.type] }}
          </span>
        </div>

        <!-- Share / Export -->
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-sky hover:text-accent-sky disabled:opacity-50"
            :disabled="exporting"
            @click="handleExport"
          >
            <Icon icon="lucide:image-down" class="size-3.5" />
            {{ exporting ? 'Đang xuất...' : 'Xuất ảnh' }}
          </button>
          <button
            class="inline-flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-xs text-text-dim transition hover:border-accent-amber hover:text-accent-amber disabled:opacity-50"
            :disabled="sharing"
            @click="handleShare(trip)"
          >
            <Icon icon="lucide:share-2" class="size-3.5" />
            Chia sẻ link
          </button>
          <span v-if="shareMsg" class="text-xs text-accent-sky">{{ shareMsg }}</span>
        </div>
      </div>
    </div>

    <!-- Members -->
    <div class="mb-8">
      <MemberSection
        :members="trip.members"
        @add="(name) => emit('addMember', name)"
        @remove="(id) => emit('removeMember', id)"
      />
    </div>

    <!-- ── Tabs ────────────────────────────────────────── -->
    <div class="mb-6 flex gap-1 border-b border-border-default">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition',
          activeTab === tab.key
            ? 'border-accent-coral text-accent-coral'
            : 'border-transparent text-text-dim hover:text-text-secondary',
        ]"
        @click="activeTab = tab.key"
      >
        <Icon :icon="tab.icon" class="size-4" />
        {{ tab.label }}
        <span
          v-if="tab.key === 'checklist' && trip.checklist.length > 0"
          class="ml-1 text-xs opacity-60"
        >
          {{ trip.checklist.filter((c) => c.checked).length }}/{{ trip.checklist.length }}
        </span>
      </button>
    </div>

    <!-- ── Tab content (exportable area) ───────────────── -->
    <div ref="exportRef">
      <ActivitySection
        v-if="activeTab === 'schedule'"
        :activities="trip.activities"
        @add="(data) => emit('addActivity', data)"
        @toggle="(id) => emit('toggleActivity', id)"
        @remove="(id) => emit('removeActivity', id)"
      />

      <BudgetSection
        v-if="activeTab === 'budget'"
        :budget="trip.budget"
        :members="trip.members"
        :total="total"
        :per-person="perPerson"
        @add="(data) => emit('addBudget', data)"
        @remove="(id) => emit('removeBudget', id)"
      />

      <ChecklistSection
        v-if="activeTab === 'checklist'"
        :checklist="trip.checklist"
        @add="(text) => emit('addChecklist', text)"
        @toggle="(id) => emit('toggleChecklist', id)"
        @remove="(id) => emit('removeChecklist', id)"
      />
    </div>
  </div>
</template>
