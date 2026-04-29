<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
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

const NOTES_PREVIEW_LENGTH = 20
const expandedNotes = ref<Set<string>>(new Set())

function toggleNotes(id: string) {
  if (expandedNotes.value.has(id)) {
    expandedNotes.value.delete(id)
  } else {
    expandedNotes.value.add(id)
  }
}
</script>

<template>
  <div class="overflow-x-auto border border-border-default">
    <table class="min-w-full border-collapse text-sm">
      <thead class="bg-bg-elevated text-left text-text-secondary">
        <tr>
          <th
            v-if="visibleColumns.sentDate"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Ngày gửi
          </th>
          <th
            v-if="visibleColumns.company"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Công ty
          </th>
          <th
            v-if="visibleColumns.position"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Vị trí
          </th>
          <th
            v-if="visibleColumns.jobUrl"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Link
          </th>
          <th
            v-if="visibleColumns.submitMethod"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Hình thức
          </th>
          <th
            v-if="visibleColumns.salaryExpectation"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Lương deal
          </th>
          <th
            v-if="visibleColumns.hrResponseDays"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            HR phản hồi
          </th>
          <th
            v-if="visibleColumns.interviewer"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Người PV
          </th>
          <th
            v-if="visibleColumns.status"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Trạng thái
          </th>
          <th
            v-if="visibleColumns.notes"
            class="whitespace-nowrap border-b border-border-default px-3 py-2"
          >
            Ghi chú
          </th>
          <th class="whitespace-nowrap border-b border-border-default px-3 py-2">Thao tác</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="job in jobs"
          :key="job.id"
          class="border-b border-border-default/70 bg-bg-surface transition hover:bg-bg-elevated"
        >
          <td v-if="visibleColumns.sentDate" class="whitespace-nowrap px-3 py-2 align-middle">
            <p>{{ formatDisplayDate(job.sentDate) }}</p>
            <p class="text-xs text-accent-amber">{{ daysSince(job.sentDate) }} ngày trước</p>
          </td>
          <td v-if="visibleColumns.company" class="whitespace-nowrap px-3 py-2 align-middle">
            {{ job.company }}
          </td>
          <td v-if="visibleColumns.position" class="whitespace-nowrap px-3 py-2 align-middle">
            {{ job.position }}
          </td>
          <td v-if="visibleColumns.jobUrl" class="whitespace-nowrap px-3 py-2 align-middle">
            <a
              v-if="job.jobUrl"
              :href="job.jobUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-accent-sky hover:text-accent-amber"
            >
              <Icon icon="lucide:external-link" class="size-3.5" />
              Mở link
            </a>
            <span v-else class="text-text-dim">Chưa có</span>
          </td>
          <td v-if="visibleColumns.submitMethod" class="whitespace-nowrap px-3 py-2 align-middle">
            {{ job.submitMethod }}
          </td>
          <td
            v-if="visibleColumns.salaryExpectation"
            class="whitespace-nowrap px-3 py-2 align-middle"
          >
            {{ job.salaryExpectation || '—' }}
          </td>
          <td v-if="visibleColumns.hrResponseDays" class="whitespace-nowrap px-3 py-2 align-middle">
            <span
              v-if="job.hrResponseDays === null"
              class="inline-flex items-center gap-1 text-text-secondary"
            >
              <Icon icon="lucide:clock-3" class="size-4" />
              Chưa phản hồi
            </span>
            <span v-else class="inline-flex items-center gap-1 text-accent-amber">
              <Icon icon="lucide:badge-check" class="size-4" />
              {{ job.hrResponseDays }} ngày
            </span>
          </td>
          <td v-if="visibleColumns.interviewer" class="whitespace-nowrap px-3 py-2 align-middle">
            {{ job.interviewer || '—' }}
          </td>
          <td v-if="visibleColumns.status" class="whitespace-nowrap px-3 py-2 align-middle">
            <span class="inline-flex items-center gap-2 border border-border-default px-2 py-1">
              <span
                class="size-2.5 shrink-0"
                :style="{ backgroundColor: statusById.get(job.statusId)?.color || '#8B9DB5' }"
              />
              {{ statusById.get(job.statusId)?.name || 'Không xác định' }}
            </span>
          </td>
          <td v-if="visibleColumns.notes" class="px-3 py-2 align-middle text-text-secondary">
            <template v-if="!job.notes">
              <span class="text-text-dim">—</span>
            </template>
            <template
              v-else-if="job.notes.length <= NOTES_PREVIEW_LENGTH || expandedNotes.has(job.id)"
            >
              <span
                class="break-words"
                style="max-width: 480px; display: inline-block; white-space: pre"
                >{{ job.notes }}</span
              >
              <button
                v-if="expandedNotes.has(job.id)"
                type="button"
                class="ml-1 text-xs text-accent-sky hover:text-accent-amber"
                @click="toggleNotes(job.id)"
              >
                thu gọn
              </button>
            </template>
            <template v-else>
              <span class="whitespace-nowrap">{{ job.notes.slice(0, NOTES_PREVIEW_LENGTH) }}…</span>
              <button
                type="button"
                class="ml-1 whitespace-nowrap text-xs text-accent-sky hover:text-accent-amber"
                @click="toggleNotes(job.id)"
              >
                xem thêm
              </button>
            </template>
          </td>
          <td class="whitespace-nowrap px-3 py-2 align-middle">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-border-default bg-bg-deep px-2 py-1 text-xs hover:border-accent-amber"
                @click="emit('edit', job)"
              >
                <Icon icon="lucide:pencil" class="size-3.5" />
                Sửa
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-border-default bg-bg-deep px-2 py-1 text-xs hover:border-accent-coral"
                @click="emit('remove', job.id)"
              >
                <Icon icon="lucide:trash-2" class="size-3.5" />
                Xoá
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
