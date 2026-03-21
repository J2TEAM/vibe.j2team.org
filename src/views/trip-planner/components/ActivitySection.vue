<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { Activity } from '../types'
import { ACTIVITY_ICONS } from '../types'

defineProps<{
  activities: Activity[]
}>()

const emit = defineEmits<{
  add: [data: Omit<Activity, 'id' | 'done'>]
  toggle: [id: string]
  remove: [id: string]
}>()

const showForm = ref(false)
const time = ref('09:00')
const actTitle = ref('')
const location = ref('')
const note = ref('')
const icon = ref('lucide:map-pin')

function handleAdd() {
  if (!actTitle.value.trim()) return
  emit('add', {
    time: time.value,
    title: actTitle.value.trim(),
    location: location.value.trim(),
    note: note.value.trim(),
    icon: icon.value,
  })
  actTitle.value = ''
  location.value = ''
  note.value = ''
  showForm.value = false
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
        <h3 class="font-display text-lg font-semibold text-text-primary">Lịch trình</h3>
      </div>
      <button
        class="inline-flex items-center gap-1.5 text-xs text-accent-sky transition hover:text-accent-sky/80"
        @click="showForm = !showForm"
      >
        <Icon :icon="showForm ? 'lucide:x' : 'lucide:plus'" class="size-3.5" />
        {{ showForm ? 'Đóng' : 'Thêm hoạt động' }}
      </button>
    </div>

    <!-- Add form -->
    <div v-if="showForm" class="mb-6 space-y-3 border border-border-default bg-bg-surface p-4">
      <div class="flex gap-3">
        <div class="w-24">
          <label class="mb-1 block text-xs text-text-dim">Giờ</label>
          <input
            v-model="time"
            type="time"
            class="w-full border border-border-default bg-bg-deep px-2 py-2 text-sm text-text-primary outline-none focus:border-accent-coral"
          />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-xs text-text-dim">Hoạt động *</label>
          <input
            v-model="actTitle"
            type="text"
            placeholder="VD: Ăn sáng, Check-in khách sạn..."
            class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder-text-dim outline-none focus:border-accent-coral"
          />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs text-text-dim">Địa điểm</label>
        <input
          v-model="location"
          type="text"
          placeholder="VD: Quán phở Thìn, Hồ Xuân Hương..."
          class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder-text-dim outline-none focus:border-accent-coral"
        />
      </div>

      <div>
        <label class="mb-1 block text-xs text-text-dim">Ghi chú</label>
        <input
          v-model="note"
          type="text"
          placeholder="Nhớ mang theo kem chống nắng..."
          class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-primary placeholder-text-dim outline-none focus:border-accent-coral"
        />
      </div>

      <!-- Icon picker -->
      <div>
        <label class="mb-1 block text-xs text-text-dim">Biểu tượng</label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="ai in ACTIVITY_ICONS"
            :key="ai.icon"
            type="button"
            :title="ai.label"
            :class="[
              'flex size-8 items-center justify-center border transition',
              icon === ai.icon
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-dim hover:bg-bg-elevated',
            ]"
            @click="icon = ai.icon"
          >
            <Icon :icon="ai.icon" class="size-4" />
          </button>
        </div>
      </div>

      <button
        class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
        @click="handleAdd"
      >
        <Icon icon="lucide:plus" class="size-3.5" />
        Thêm vào lịch trình
      </button>
    </div>

    <!-- Timeline -->
    <div v-if="activities.length === 0 && !showForm" class="py-4 text-center text-sm text-text-dim">
      Chưa có hoạt động nào
    </div>

    <div v-else class="relative space-y-0">
      <!-- Timeline line -->
      <div
        v-if="activities.length > 1"
        class="absolute bottom-6 left-[18px] top-6 w-px bg-border-default"
      />

      <div
        v-for="act in activities"
        :key="act.id"
        :class="['group relative flex gap-4 py-3 transition', act.done ? 'opacity-60' : '']"
      >
        <!-- Timeline dot -->
        <div class="relative z-10 flex flex-col items-center">
          <button
            :class="[
              'flex size-9 shrink-0 items-center justify-center border transition',
              act.done
                ? 'border-accent-sky/50 bg-accent-sky/10 text-accent-sky'
                : 'border-border-default bg-bg-surface text-text-dim hover:border-accent-coral hover:text-accent-coral',
            ]"
            :title="act.done ? 'Hoàn tất' : 'Đánh dấu hoàn tất'"
            @click="emit('toggle', act.id)"
          >
            <Icon v-if="act.done" icon="lucide:check" class="size-4" />
            <Icon v-else :icon="act.icon" class="size-4" />
          </button>
        </div>

        <!-- Content -->
        <div
          class="flex-1 border border-border-default bg-bg-surface p-3 transition hover:bg-bg-elevated"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-display text-xs font-semibold text-accent-amber">{{
                  act.time
                }}</span>
                <span
                  :class="[
                    'font-semibold text-sm',
                    act.done ? 'line-through text-text-dim' : 'text-text-primary',
                  ]"
                >
                  {{ act.title }}
                </span>
              </div>
              <p
                v-if="act.location"
                class="mt-1 inline-flex items-center gap-1 text-xs text-text-secondary"
              >
                <Icon icon="lucide:map-pin" class="size-3" />
                {{ act.location }}
              </p>
              <p v-if="act.note" class="mt-0.5 text-xs text-text-dim italic">
                {{ act.note }}
              </p>
            </div>
            <button
              class="shrink-0 p-1 text-text-dim opacity-0 transition hover:text-accent-coral group-hover:opacity-100"
              @click="emit('remove', act.id)"
            >
              <Icon icon="lucide:trash-2" class="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
