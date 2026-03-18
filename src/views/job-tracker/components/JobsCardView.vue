<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PropType } from 'vue'
import type { ColumnKey, JobApplication, JobStatus } from '../types'

defineProps({
  jobs: {
    type: Array as PropType<JobApplication[]>,
    required: true,
  },
  visibleColumns: {
    type: Object as PropType<Record<ColumnKey, boolean>>,
    required: true,
  },
  statusById: {
    type: Object as PropType<Map<string, JobStatus>>,
    required: true,
  },
  formatDisplayDate: {
    type: Function as PropType<(dateText: string) => string>,
    required: true,
  },
  daysSince: {
    type: Function as PropType<(dateText: string) => number>,
    required: true,
  },
})

const emit = defineEmits<{
  edit: [job: JobApplication]
  remove: [id: string]
}>()
</script>

<template>
  <div class="grid gap-3">
    <article
      v-for="job in jobs"
      :key="job.id"
      class="border border-border-default bg-bg-deep p-4 transition hover:border-accent-coral hover:bg-bg-elevated"
    >
      <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="font-display text-lg font-semibold text-text-primary">{{ job.position }}</p>
          <p class="text-sm text-text-secondary">{{ job.company }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1 border border-border-default bg-bg-surface px-2.5 py-1.5 text-xs text-text-primary transition hover:border-accent-amber"
            @click="emit('edit', job)"
          >
            <Icon icon="lucide:pencil" class="size-3.5" />
            Sửa
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 border border-border-default bg-bg-surface px-2.5 py-1.5 text-xs text-text-primary transition hover:border-accent-coral"
            @click="emit('remove', job.id)"
          >
            <Icon icon="lucide:trash-2" class="size-3.5" />
            Xoá
          </button>
        </div>
      </div>

      <div class="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div v-if="visibleColumns.sentDate" class="border border-border-default bg-bg-surface p-3">
          <p class="text-xs text-text-dim">Ngày gửi</p>
          <p class="mt-1 text-text-primary">{{ formatDisplayDate(job.sentDate) }}</p>
          <p class="mt-1 text-xs text-accent-amber" v-if="parseInt(job.sentDate) > 0">
            Đã gửi cách đây {{ daysSince(job.sentDate) }} ngày
          </p>
          <p class="mt-1 text-xs text-accent-amber" v-else>Hôm nay</p>
        </div>

        <div v-if="visibleColumns.company" class="border border-border-default bg-bg-surface p-3">
          <p class="text-xs text-text-dim">Công ty</p>
          <p class="mt-1 text-text-primary">{{ job.company }}</p>
        </div>

        <div v-if="visibleColumns.position" class="border border-border-default bg-bg-surface p-3">
          <p class="text-xs text-text-dim">Vị trí</p>
          <p class="mt-1 text-text-primary">{{ job.position }}</p>
        </div>

        <div v-if="visibleColumns.jobUrl" class="border border-border-default bg-bg-surface p-3">
          <p class="text-xs text-text-dim">Link tuyển dụng</p>
          <a
            v-if="job.jobUrl"
            :href="job.jobUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-flex items-center gap-1 break-all text-accent-sky hover:text-accent-amber"
          >
            <Icon icon="lucide:external-link" class="size-3.5" />
            {{ job.jobUrl }}
          </a>
          <p v-else class="mt-1 text-text-secondary">Chưa có link</p>
        </div>

        <div
          v-if="visibleColumns.submitMethod"
          class="border border-border-default bg-bg-surface p-3"
        >
          <p class="text-xs text-text-dim">Hình thức gửi</p>
          <p class="mt-1 text-text-primary">{{ job.submitMethod }}</p>
        </div>

        <div
          v-if="visibleColumns.salaryExpectation"
          class="border border-border-default bg-bg-surface p-3"
        >
          <p class="text-xs text-text-dim">Lương deal</p>
          <p class="mt-1 text-text-primary">{{ job.salaryExpectation || 'Chưa cập nhật' }}</p>
        </div>

        <div
          v-if="visibleColumns.hrResponseDays"
          class="border border-border-default bg-bg-surface p-3"
        >
          <p class="text-xs text-text-dim">Trạng thái HR</p>
          <p
            v-if="job.hrResponseDays === null"
            class="mt-1 inline-flex items-center gap-1 text-text-secondary"
          >
            <Icon icon="lucide:clock-3" class="size-4" />
            Chưa phản hồi
          </p>
          <p v-else class="mt-1 inline-flex items-center gap-1 text-accent-amber">
            <Icon icon="lucide:badge-check" class="size-4" />
            {{ job.hrResponseDays }} ngày
          </p>
        </div>

        <div
          v-if="visibleColumns.interviewer"
          class="border border-border-default bg-bg-surface p-3"
        >
          <p class="text-xs text-text-dim">Người phỏng vấn</p>
          <p class="mt-1 text-text-primary">{{ job.interviewer || 'Chưa cập nhật' }}</p>
        </div>

        <div v-if="visibleColumns.status" class="border border-border-default bg-bg-surface p-3">
          <p class="text-xs text-text-dim">Trạng thái</p>
          <p
            class="mt-1 inline-flex items-center gap-2 border border-border-default px-2.5 py-1 text-text-primary"
          >
            <span
              class="size-2.5"
              :style="{ backgroundColor: statusById.get(job.statusId)?.color || '#8B9DB5' }"
            />
            {{ statusById.get(job.statusId)?.name || 'Không xác định' }}
          </p>
        </div>

        <div
          v-if="visibleColumns.notes"
          class="border border-border-default bg-bg-surface p-3 sm:col-span-2 lg:col-span-3"
        >
          <p class="text-xs text-text-dim">Ghi chú</p>
          <p class="mt-1 text-text-primary">{{ job.notes || 'Không có ghi chú.' }}</p>
        </div>
      </div>
    </article>
  </div>
</template>
