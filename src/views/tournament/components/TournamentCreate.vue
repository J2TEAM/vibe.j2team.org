<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { TournamentFormat } from '../types'
import { FORMAT_LABELS } from '../types'

const emit = defineEmits<{
  create: [name: string, sport: string, format: TournamentFormat]
  cancel: []
}>()

const name = ref('')
const sport = ref('')
const format = ref<TournamentFormat>('single-elimination')
const error = ref('')

const formats: TournamentFormat[] = [
  'single-elimination',
  'double-elimination',
  'group-knockout',
  'round-robin',
]

const formatDescriptions: Record<TournamentFormat, string> = {
  'single-elimination': 'Thua 1 trận = bị loại. Nhanh gọn, phù hợp giải nhỏ.',
  'double-elimination': 'Phải thua 2 trận mới bị loại. Có nhánh thắng và nhánh thua.',
  'group-knockout': 'Chia bảng đấu vòng tròn, sau đó top mỗi bảng vào vòng loại trực tiếp.',
  'round-robin': 'Tất cả đấu với nhau, tính điểm xếp hạng. Phù hợp giải league.',
}

function handleSubmit() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'Tên giải đấu không được để trống'
    return
  }
  if (!sport.value.trim()) {
    error.value = 'Tên bộ môn không được để trống'
    return
  }
  emit('create', name.value, sport.value, format.value)
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
      <h2 class="font-display text-2xl font-semibold text-text-primary">Tạo giải đấu mới</h2>
    </div>

    <form class="max-w-xl space-y-6" @submit.prevent="handleSubmit">
      <div>
        <label class="mb-2 block text-sm font-semibold text-text-primary">Tên giải đấu *</label>
        <input
          v-model="name"
          type="text"
          placeholder="VD: Giải Bóng Đá Mùa Xuân 2026"
          class="w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
        />
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-text-primary">Bộ môn *</label>
        <input
          v-model="sport"
          type="text"
          placeholder="VD: Bóng đá, Cầu lông, Liên Minh Huyền Thoại..."
          class="w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
        />
      </div>

      <div>
        <label class="mb-3 block text-sm font-semibold text-text-primary">Thể thức thi đấu *</label>
        <div class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="f in formats"
            :key="f"
            type="button"
            :class="[
              'border p-4 text-left transition',
              format === f
                ? 'border-accent-coral bg-accent-coral/10'
                : 'border-border-default bg-bg-surface hover:border-accent-coral/50 hover:bg-bg-elevated',
            ]"
            @click="format = f"
          >
            <div class="text-sm font-semibold text-text-primary">
              {{ FORMAT_LABELS[f] }}
            </div>
            <div class="mt-1 text-xs text-text-dim">
              {{ formatDescriptions[f] }}
            </div>
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
        <Icon icon="lucide:plus" class="size-4" />
        Tạo giải đấu
      </button>
    </form>
  </div>
</template>
