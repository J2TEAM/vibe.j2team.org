<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PropType } from 'vue'
import type { JobStatus } from '../types'

defineProps({
  statuses: {
    type: Array as PropType<JobStatus[]>,
    required: true,
  },
  statusName: {
    type: String,
    required: true,
  },
  statusColor: {
    type: String,
    required: true,
  },
  editingStatusId: {
    type: String as PropType<string | null>,
    required: true,
  },
})

const emit = defineEmits<{
  save: []
  reset: []
  edit: [status: JobStatus]
  remove: [id: string]
  updateName: [name: string]
  updateColor: [color: string]
}>()

function onNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('updateName', target.value)
}

function onColorInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('updateColor', target.value)
}
</script>

<template>
  <aside class="border border-border-default bg-bg-surface p-4 sm:p-5">
    <h2 class="flex items-center gap-2 font-display text-xl font-semibold">
      <span class="text-accent-sky text-sm tracking-widest">//</span>
      Quản lý trạng thái
    </h2>

    <div class="mt-4 grid gap-2">
      <label class="text-xs text-text-dim">Tên trạng thái</label>
      <input
        :value="statusName"
        type="text"
        placeholder="Ví dụ: Offer"
        class="w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
        @input="onNameInput"
      />
    </div>

    <div class="mt-3 grid gap-2">
      <label class="text-xs text-text-dim">Màu</label>
      <div class="flex items-center gap-3 border border-border-default bg-bg-elevated px-3 py-2">
        <input
          :value="statusColor"
          type="color"
          class="h-8 w-12 cursor-pointer border border-border-default bg-bg-deep"
          @input="onColorInput"
        />
        <p class="text-sm text-text-secondary">{{ statusColor }}</p>
      </div>
    </div>

    <div class="mt-3 flex gap-2">
      <button
        type="button"
        class="inline-flex flex-1 items-center justify-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-sm font-medium text-text-primary transition hover:border-accent-coral"
        @click="emit('save')"
      >
        <Icon :icon="editingStatusId ? 'lucide:save' : 'lucide:plus'" class="size-4" />
        {{ editingStatusId ? 'Lưu trạng thái' : 'Thêm trạng thái' }}
      </button>
      <button
        v-if="editingStatusId"
        type="button"
        class="inline-flex items-center justify-center border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
        @click="emit('reset')"
      >
        Huỷ
      </button>
    </div>

    <div class="mt-4 grid max-h-[26rem] gap-2 overflow-y-auto pr-1">
      <article
        v-for="status in statuses"
        :key="status.id"
        class="border border-border-default bg-bg-deep p-3"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="inline-flex min-w-0 items-center gap-2 text-sm text-text-primary">
            <span class="size-2.5 shrink-0" :style="{ backgroundColor: status.color }" />
            <span class="truncate">{{ status.name }}</span>
          </div>
          <div class="flex gap-1">
            <button
              type="button"
              class="border border-border-default bg-bg-surface px-2 py-1 text-xs text-text-primary transition hover:border-accent-amber"
              @click="emit('edit', status)"
            >
              Sửa
            </button>
            <button
              type="button"
              class="border border-border-default bg-bg-surface px-2 py-1 text-xs text-text-primary transition hover:border-accent-coral"
              @click="emit('remove', status.id)"
            >
              Xoá
            </button>
          </div>
        </div>
      </article>
    </div>
  </aside>
</template>
