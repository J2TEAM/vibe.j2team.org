<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { TripType } from '../types'
import { COVER_EMOJIS, TRIP_TYPE_ICONS, TRIP_TYPE_LABELS } from '../types'

const emit = defineEmits<{
  create: [
    data: { title: string; description: string; type: TripType; date: string; coverEmoji: string },
  ]
  cancel: []
}>()

const title = ref('')
const description = ref('')
const tripType = ref<TripType>('friends')
const date = ref('')
const coverEmoji = ref('🏖️')
const error = ref('')

const types: TripType[] = ['friends', 'family', 'date', 'solo', 'team']

function handleSubmit() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = 'Tên kế hoạch không được để trống'
    return
  }
  if (!date.value) {
    error.value = 'Vui lòng chọn ngày'
    return
  }
  emit('create', {
    title: title.value,
    description: description.value,
    type: tripType.value,
    date: date.value,
    coverEmoji: coverEmoji.value,
  })
}
</script>

<template>
  <div>
    <button
      class="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
      @click="emit('cancel')"
    >
      <Icon icon="lucide:arrow-left" class="size-4" />
      Quay lại
    </button>

    <div class="mb-8">
      <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
      <h2 class="ml-2 inline font-display text-2xl font-semibold text-text-primary">
        Lên kế hoạch mới
      </h2>
    </div>

    <form class="max-w-xl space-y-6" @submit.prevent="handleSubmit">
      <!-- Emoji picker -->
      <div>
        <label class="mb-2 block text-sm font-semibold text-text-primary">Biểu tượng</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="e in COVER_EMOJIS"
            :key="e"
            type="button"
            :class="[
              'flex size-10 items-center justify-center border text-xl transition',
              coverEmoji === e
                ? 'border-accent-coral bg-accent-coral/10 scale-110'
                : 'border-border-default bg-bg-surface hover:border-accent-coral/50 hover:bg-bg-elevated',
            ]"
            @click="coverEmoji = e"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-text-primary">Tên kế hoạch *</label>
        <input
          v-model="title"
          type="text"
          placeholder="VD: Đi Đà Lạt cuối tuần, Sinh nhật bạn Lan..."
          class="w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-text-primary">Mô tả</label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="Ghi chú thêm về chuyến đi..."
          class="w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-text-primary">Ngày *</label>
        <input
          v-model="date"
          type="date"
          class="w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
        />
      </div>

      <div>
        <label class="mb-3 block text-sm font-semibold text-text-primary">Đi cùng ai?</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in types"
            :key="t"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 border px-4 py-2 text-sm transition',
              tripType === t
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-dim hover:bg-bg-elevated',
            ]"
            @click="tripType = t"
          >
            <Icon :icon="TRIP_TYPE_ICONS[t]" class="size-4" />
            {{ TRIP_TYPE_LABELS[t] }}
          </button>
        </div>
      </div>

      <div
        v-if="error"
        class="border border-accent-coral/30 bg-accent-coral/5 px-4 py-3 text-sm text-accent-coral"
      >
        {{ error }}
      </div>

      <button
        type="submit"
        class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral px-6 py-3 text-sm font-semibold text-bg-deep transition hover:bg-accent-coral/90"
      >
        <Icon icon="lucide:rocket" class="size-4" />
        Tạo kế hoạch
      </button>
    </form>
  </div>
</template>
