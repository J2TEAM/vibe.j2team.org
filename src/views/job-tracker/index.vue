<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { onClickOutside } from '@vueuse/core'
import { columnOptions } from './constants'
import JobsCardView from './components/JobsCardView.vue'
import JobsTableView from './components/JobsTableView.vue'
import StatusManagerPanel from './components/StatusManagerPanel.vue'
import { useJobTracker } from './composables/useJobTracker'
import type { JobStatus } from './types'

const {
  submitMethods,
  statuses,
  visibleColumns,
  viewMode,
  isFormOpen,
  editingJobId,
  formError,
  form,
  statusById,
  sortedJobs,
  selectedStatus,
  visibleColumnCount,
  stats,
  statusName,
  statusColor,
  editingStatusId,
  formatDisplayDate,
  daysSince,
  openCreateForm,
  openEditForm,
  closeForm,
  submitJob,
  removeJob,
  startStatusEdit,
  resetStatusEditor,
  saveStatus,
  removeStatus,
  exportData,
  importFromText,
  setViewMode,
} = useJobTracker()

const importInputRef = ref<HTMLInputElement | null>(null)
const isStatusDropdownOpen = ref(false)
const statusDropdownRef = ref<HTMLElement | null>(null)
const isColumnPanelOpen = ref(false)
const columnPanelRef = ref<HTMLElement | null>(null)

onClickOutside(statusDropdownRef, () => {
  isStatusDropdownOpen.value = false
})

onClickOutside(columnPanelRef, () => {
  isColumnPanelOpen.value = false
})

function openImportDialog() {
  importInputRef.value?.click()
}

function handleStatusEdit(status: JobStatus) {
  startStatusEdit(status)
}

function handleFormClose() {
  isStatusDropdownOpen.value = false
  closeForm()
}

async function importData(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  try {
    const text = await file.text()
    importFromText(text)
    window.alert('Import dữ liệu thành công.')
  } catch {
    window.alert('File JSON không hợp lệ hoặc không đúng định dạng.')
  } finally {
    input.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-8 text-text-primary sm:px-6 lg:px-8">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header class="border border-border-default bg-bg-surface p-6 animate-fade-up">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="font-display text-xs tracking-[0.3em] text-accent-coral">
              // JOB TRACKING SYSTEM
            </p>
            <h1 class="mt-2 font-display text-3xl font-bold sm:text-4xl">Quản lý Ứng tuyển</h1>
            <p class="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
              Theo dõi toàn bộ đơn ứng tuyển, trạng thái xử lý, phản hồi HR và ghi chú quan trọng
              ngay trên trình duyệt.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition hover:border-accent-coral hover:bg-bg-deep"
              @click="openCreateForm"
            >
              <Icon icon="lucide:plus" class="size-4" />
              Thêm đơn
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition hover:border-accent-amber hover:bg-bg-deep"
              @click="exportData"
            >
              <Icon icon="lucide:download" class="size-4" />
              Export JSON
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition hover:border-accent-sky hover:bg-bg-deep"
              @click="openImportDialog"
            >
              <Icon icon="lucide:upload" class="size-4" />
              Import JSON
            </button>
            <RouterLink
              to="/"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            >
              <Icon icon="lucide:house" class="size-4" />
              Về trang chủ
            </RouterLink>
            <input
              ref="importInputRef"
              type="file"
              accept="application/json"
              class="hidden"
              @change="importData"
            />
          </div>
        </div>
      </header>

      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up animate-delay-2">
        <article class="border border-border-default bg-bg-surface p-4">
          <p class="text-xs text-text-dim">Tổng số đơn</p>
          <p class="mt-2 font-display text-3xl font-bold text-text-primary">{{ stats.total }}</p>
        </article>
        <article class="border border-border-default bg-bg-surface p-4">
          <p class="text-xs text-text-dim">Đang chờ</p>
          <p class="mt-2 font-display text-3xl font-bold text-accent-amber">{{ stats.pending }}</p>
        </article>
        <article class="border border-border-default bg-bg-surface p-4">
          <p class="text-xs text-text-dim">Phỏng vấn</p>
          <p class="mt-2 font-display text-3xl font-bold text-accent-sky">{{ stats.interview }}</p>
        </article>
        <article class="border border-border-default bg-bg-surface p-4">
          <p class="text-xs text-text-dim">Đã bị Ghost</p>
          <p class="mt-2 font-display text-3xl font-bold text-accent-coral">{{ stats.ghosted }}</p>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[2fr_1fr] animate-fade-up animate-delay-3">
        <!-- co the scroll bang theobchieu ngang neu bang qua dai -->
        <div class="border border-border-default bg-bg-surface p-4 sm:p-5 overflow-x-auto">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 class="flex items-center gap-2 font-display text-xl font-semibold">
              <span class="text-accent-coral text-sm tracking-widest">//</span>
              Danh sách đơn ứng tuyển
            </h2>

            <div class="flex items-center gap-2">
              <div class="inline-flex border border-border-default bg-bg-elevated p-1">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs transition"
                  :class="
                    viewMode === 'card'
                      ? 'bg-bg-deep text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  "
                  @click="setViewMode('card')"
                >
                  <Icon icon="lucide:layout-grid" class="size-3.5" />
                  Dạng card
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs transition"
                  :class="
                    viewMode === 'table'
                      ? 'bg-bg-deep text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  "
                  @click="setViewMode('table')"
                >
                  <Icon icon="lucide:table" class="size-3.5" />
                  Dạng table
                </button>
              </div>

              <div ref="columnPanelRef" class="relative">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-xs font-medium text-text-primary transition hover:border-accent-coral"
                  @click="isColumnPanelOpen = !isColumnPanelOpen"
                >
                  <Icon icon="lucide:columns-3" class="size-4" />
                  Cột hiển thị ({{ visibleColumnCount }})
                </button>

                <div
                  v-if="isColumnPanelOpen"
                  class="absolute right-0 z-20 mt-2 w-64 border border-border-default bg-bg-elevated p-3"
                >
                  <p class="mb-2 text-xs text-text-dim">Ẩn/hiện cột</p>
                  <div class="grid gap-2">
                    <label
                      v-for="column in columnOptions"
                      :key="column.key"
                      class="flex cursor-pointer items-center justify-between border border-border-default bg-bg-surface px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                    >
                      <span>{{ column.label }}</span>
                      <input
                        v-model="visibleColumns[column.key]"
                        type="checkbox"
                        class="size-4 border-border-default bg-bg-deep accent-accent-coral"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="sortedJobs.length === 0"
            class="border border-dashed border-border-default bg-bg-elevated p-8 text-center"
          >
            <Icon icon="lucide:briefcase-business" class="mx-auto size-12 text-text-dim" />
            <p class="mt-4 font-display text-lg text-text-primary">Chưa có đơn ứng tuyển nào</p>
            <p class="mt-1 text-sm text-text-secondary">
              Nhấn “Thêm đơn” để bắt đầu theo dõi hành trình ứng tuyển của bạn.
            </p>
          </div>

          <JobsCardView
            v-else-if="viewMode === 'card'"
            :jobs="sortedJobs"
            :visible-columns="visibleColumns"
            :status-by-id="statusById"
            :format-display-date="formatDisplayDate"
            :days-since="daysSince"
            @edit="openEditForm"
            @remove="removeJob"
          />

          <JobsTableView
            v-else
            :jobs="sortedJobs"
            :visible-columns="visibleColumns"
            :status-by-id="statusById"
            :format-display-date="formatDisplayDate"
            :days-since="daysSince"
            @edit="openEditForm"
            @remove="removeJob"
          />
        </div>

        <StatusManagerPanel
          :statuses="statuses"
          :status-name="statusName"
          :status-color="statusColor"
          :editing-status-id="editingStatusId"
          @save="saveStatus"
          @reset="resetStatusEditor"
          @edit="handleStatusEdit"
          @remove="removeStatus"
          @update-name="statusName = $event"
          @update-color="statusColor = $event"
        />
      </section>
    </div>

    <div
      v-if="isFormOpen"
      class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-bg-deep/85 p-4 sm:items-center"
    >
      <div class="w-full max-w-3xl border border-border-default bg-bg-surface p-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="font-display text-2xl font-semibold">
            {{ editingJobId ? 'Sửa đơn ứng tuyển' : 'Thêm đơn ứng tuyển' }}
          </h3>
          <button
            type="button"
            class="inline-flex items-center justify-center border border-border-default bg-bg-elevated p-2 text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="handleFormClose"
          >
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </div>

        <p
          v-if="formError"
          class="mb-4 border border-accent-coral bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral"
        >
          {{ formError }}
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1">
            <span class="text-xs text-text-dim">Ngày gửi</span>
            <input
              v-model="form.sentDate"
              type="date"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
            />
          </label>

          <label class="grid gap-1">
            <span class="text-xs text-text-dim">Hình thức gửi</span>
            <select
              v-model="form.submitMethod"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent-coral focus:outline-none"
            >
              <option v-for="method in submitMethods" :key="method" :value="method">
                {{ method }}
              </option>
            </select>
          </label>

          <label class="grid gap-1">
            <span class="text-xs text-text-dim">Tên công ty</span>
            <input
              v-model="form.company"
              type="text"
              placeholder="Ví dụ: J2TEAM"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
            />
          </label>

          <label class="grid gap-1">
            <span class="text-xs text-text-dim">Vị trí ứng tuyển</span>
            <input
              v-model="form.position"
              type="text"
              placeholder="Ví dụ: Frontend Developer"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
            />
          </label>

          <label class="grid gap-1 sm:col-span-2">
            <span class="text-xs text-text-dim">Link bài tuyển dụng</span>
            <input
              v-model="form.jobUrl"
              type="url"
              placeholder="https://..."
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
            />
          </label>

          <label class="grid gap-1">
            <span class="text-xs text-text-dim">Lương deal</span>
            <input
              v-model="form.salaryExpectation"
              type="text"
              placeholder="Ví dụ: 25-30M"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
            />
          </label>

          <label class="grid gap-1">
            <span class="text-xs text-text-dim">Thời gian HR phản hồi (ngày)</span>
            <input
              v-model="form.hrResponseDays"
              type="number"
              min="0"
              placeholder="Để trống nếu chưa phản hồi"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
            />
          </label>

          <label class="grid gap-1">
            <span class="text-xs text-text-dim">Người phỏng vấn</span>
            <input
              v-model="form.interviewer"
              type="text"
              placeholder="Tên HR / Interviewer"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
            />
          </label>

          <div ref="statusDropdownRef" class="relative grid gap-1">
            <span class="text-xs text-text-dim">Trạng thái</span>
            <button
              type="button"
              class="inline-flex w-full items-center justify-between border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary transition hover:border-accent-coral"
              @click="isStatusDropdownOpen = !isStatusDropdownOpen"
            >
              <span class="inline-flex min-w-0 items-center gap-2">
                <span
                  class="size-2.5 shrink-0"
                  :style="{ backgroundColor: selectedStatus?.color || '#8B9DB5' }"
                />
                <span class="truncate">{{ selectedStatus?.name || 'Chọn trạng thái' }}</span>
              </span>
              <Icon icon="lucide:chevron-down" class="size-4 text-text-secondary" />
            </button>

            <div
              v-if="isStatusDropdownOpen"
              class="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto border border-border-default bg-bg-deep p-1"
            >
              <button
                v-for="status in statuses"
                :key="status.id"
                type="button"
                class="flex w-full items-center gap-2 border border-transparent px-2 py-2 text-left text-sm text-text-primary transition hover:border-accent-coral hover:bg-bg-elevated"
                @click="
                  () => {
                    form.statusId = status.id
                    isStatusDropdownOpen = false
                  }
                "
              >
                <span class="size-2.5" :style="{ backgroundColor: status.color }" />
                {{ status.name }}
              </button>
            </div>
          </div>

          <label class="grid gap-1 sm:col-span-2">
            <span class="text-xs text-text-dim">Ghi chú</span>
            <textarea
              v-model="form.notes"
              rows="4"
              placeholder="Mô tả thêm về vòng tuyển dụng, cảm nhận phỏng vấn..."
              class="resize-y border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:border-accent-coral focus:outline-none"
            />
          </label>
        </div>

        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
            @click="handleFormClose"
          >
            Huỷ
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-4 py-2 text-sm font-medium text-text-primary transition hover:border-accent-coral"
            @click="submitJob"
          >
            <Icon :icon="editingJobId ? 'lucide:save' : 'lucide:plus'" class="size-4" />
            {{ editingJobId ? 'Cập nhật đơn' : 'Lưu đơn ứng tuyển' }}
          </button>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="text-center">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
