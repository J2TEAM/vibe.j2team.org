import { computed, reactive, ref } from 'vue'
import { useLocalStorage, useNow } from '@vueuse/core'
import { columnOptions, defaultStatuses, defaultVisibleColumns, submitMethods } from '../constants'
import type {
  ColumnKey,
  ImportJob,
  ImportPayload,
  ImportStatus,
  JobApplication,
  JobFormModel,
  JobStatus,
  ViewMode,
} from '../types'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function createEmptyForm(statuses: JobStatus[]): JobFormModel {
  return {
    sentDate: todayString(),
    company: '',
    position: '',
    jobUrl: '',
    submitMethod: 'Email',
    salaryExpectation: '',
    hrResponseDays: '',
    interviewer: '',
    statusId: statuses[0]?.id ?? '',
    notes: '',
  }
}

export function useJobTracker() {
  const statuses = useLocalStorage<JobStatus[]>('job-tracket-statuses', [...defaultStatuses])
  if (statuses.value.length === 0) {
    statuses.value = [...defaultStatuses]
  }

  const jobs = useLocalStorage<JobApplication[]>('job-tracket-jobs', [])
  const visibleColumns = useLocalStorage<Record<ColumnKey, boolean>>(
    'job-tracket-visible-columns',
    { ...defaultVisibleColumns },
  )
  const viewMode = useLocalStorage<ViewMode>('job-tracket-view-mode', 'card')

  const now = useNow({ interval: 60_000 })
  const isFormOpen = ref(false)
  const editingJobId = ref<string | null>(null)
  const formError = ref('')
  const statusName = ref('')
  const statusColor = ref('#38BDF8')
  const editingStatusId = ref<string | null>(null)

  const form = reactive<JobFormModel>(createEmptyForm(statuses.value))

  const statusById = computed(() => {
    const statusMap = new Map<string, JobStatus>()
    for (const status of statuses.value) {
      statusMap.set(status.id, status)
    }
    return statusMap
  })

  const sortedJobs = computed(() => {
    return [...jobs.value].sort((first, second) => {
      const dateDiff = new Date(second.sentDate).getTime() - new Date(first.sentDate).getTime()
      if (dateDiff !== 0) return dateDiff
      return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
    })
  })

  const selectedStatus = computed(() => {
    if (!form.statusId) {
      return statuses.value[0] ?? null
    }
    return statusById.value.get(form.statusId) ?? statuses.value[0] ?? null
  })

  const visibleColumnCount = computed(() => {
    return Object.values(visibleColumns.value).filter(Boolean).length
  })

  const pendingStatusIds = computed(() => {
    return new Set(
      statuses.value
        .filter((status) => {
          const normalized = normalizeText(status.name)
          return normalized.includes('cho phan hoi') || normalized.includes('pending')
        })
        .map((status) => status.id),
    )
  })

  const interviewStatusIds = computed(() => {
    return new Set(
      statuses.value
        .filter((status) => {
          const normalized = normalizeText(status.name)
          return normalized.includes('phong van') || normalized.includes('interview')
        })
        .map((status) => status.id),
    )
  })

  const ghostStatusIds = computed(() => {
    return new Set(
      statuses.value
        .filter((status) => {
          const normalized = normalizeText(status.name)
          return normalized.includes('ghost')
        })
        .map((status) => status.id),
    )
  })

  const stats = computed(() => {
    const total = jobs.value.length
    const pending = jobs.value.filter((job) => pendingStatusIds.value.has(job.statusId)).length
    const interview = jobs.value.filter((job) => interviewStatusIds.value.has(job.statusId)).length
    const ghosted = jobs.value.filter((job) => ghostStatusIds.value.has(job.statusId)).length

    return { total, pending, interview, ghosted }
  })

  function formatDisplayDate(dateText: string) {
    const date = new Date(dateText)
    if (Number.isNaN(date.getTime())) return dateText
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  function daysSince(dateText: string) {
    const sentDate = new Date(dateText)
    if (Number.isNaN(sentDate.getTime())) return 0
    const diff = now.value.getTime() - sentDate.getTime()
    return Math.max(0, Math.floor(diff / 86_400_000))
  }

  function resetForm() {
    Object.assign(form, createEmptyForm(statuses.value))
    editingJobId.value = null
    formError.value = ''
  }

  function openCreateForm() {
    resetForm()
    isFormOpen.value = true
  }

  function openEditForm(job: JobApplication) {
    form.sentDate = job.sentDate
    form.company = job.company
    form.position = job.position
    form.jobUrl = job.jobUrl
    form.submitMethod = job.submitMethod
    form.salaryExpectation = job.salaryExpectation
    form.hrResponseDays = job.hrResponseDays === null ? '' : String(job.hrResponseDays)
    form.interviewer = job.interviewer
    form.statusId = job.statusId
    form.notes = job.notes
    editingJobId.value = job.id
    formError.value = ''
    isFormOpen.value = true
  }

  function closeForm() {
    isFormOpen.value = false
    resetForm()
  }

  function ensureAtLeastOneStatus() {
    if (statuses.value.length === 0) {
      statuses.value = [...defaultStatuses]
    }
  }

  function submitJob() {
    ensureAtLeastOneStatus()

    if (!form.company.trim() || !form.position.trim()) {
      formError.value = 'Vui lòng nhập đầy đủ công ty và vị trí ứng tuyển.'
      return
    }

    const fallbackStatusId = statuses.value[0]?.id ?? ''
    if (!form.statusId) {
      form.statusId = fallbackStatusId
    }

    if (!form.statusId) {
      formError.value = 'Vui lòng tạo ít nhất một trạng thái trước khi lưu đơn.'
      return
    }

    const nowIso = new Date().toISOString()
    const hrResponseDays = form.hrResponseDays === '' ? null : Number(form.hrResponseDays)

    if (hrResponseDays !== null && (Number.isNaN(hrResponseDays) || hrResponseDays < 0)) {
      formError.value = 'Thời gian phản hồi phải là số ngày không âm.'
      return
    }

    if (editingJobId.value) {
      jobs.value = jobs.value.map((job) => {
        if (job.id !== editingJobId.value) return job
        return {
          ...job,
          sentDate: form.sentDate,
          company: form.company.trim(),
          position: form.position.trim(),
          jobUrl: form.jobUrl.trim(),
          submitMethod: form.submitMethod,
          salaryExpectation: form.salaryExpectation.trim(),
          hrResponseDays,
          interviewer: form.interviewer.trim(),
          statusId: form.statusId,
          notes: form.notes.trim(),
          updatedAt: nowIso,
        }
      })
    } else {
      jobs.value = [
        {
          id: generateId(),
          sentDate: form.sentDate,
          company: form.company.trim(),
          position: form.position.trim(),
          jobUrl: form.jobUrl.trim(),
          submitMethod: form.submitMethod,
          salaryExpectation: form.salaryExpectation.trim(),
          hrResponseDays,
          interviewer: form.interviewer.trim(),
          statusId: form.statusId,
          notes: form.notes.trim(),
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        ...jobs.value,
      ]
    }

    closeForm()
  }

  function removeJob(id: string) {
    if (!window.confirm('Bạn có chắc muốn xoá đơn ứng tuyển này?')) {
      return
    }
    jobs.value = jobs.value.filter((job) => job.id !== id)
  }

  function startStatusEdit(status: JobStatus) {
    statusName.value = status.name
    statusColor.value = status.color
    editingStatusId.value = status.id
  }

  function resetStatusEditor() {
    statusName.value = ''
    statusColor.value = '#38BDF8'
    editingStatusId.value = null
  }

  function saveStatus() {
    const normalizedName = statusName.value.trim()
    if (!normalizedName) {
      return
    }

    if (editingStatusId.value) {
      statuses.value = statuses.value.map((status) => {
        if (status.id !== editingStatusId.value) return status
        return {
          ...status,
          name: normalizedName,
          color: statusColor.value,
        }
      })
    } else {
      statuses.value = [
        ...statuses.value,
        {
          id: generateId(),
          name: normalizedName,
          color: statusColor.value,
        },
      ]
    }

    resetStatusEditor()
  }

  function removeStatus(statusId: string) {
    if (statuses.value.length <= 1) {
      window.alert('Cần ít nhất một trạng thái để gán cho đơn ứng tuyển.')
      return
    }

    if (
      !window.confirm(
        'Xoá trạng thái này? Các đơn đang dùng sẽ được chuyển sang trạng thái đầu tiên.',
      )
    ) {
      return
    }

    const remainingStatuses = statuses.value.filter((status) => status.id !== statusId)
    const fallbackStatusId = remainingStatuses[0]?.id
    if (!fallbackStatusId) {
      return
    }

    statuses.value = remainingStatuses
    jobs.value = jobs.value.map((job) => {
      if (job.statusId !== statusId) return job
      return {
        ...job,
        statusId: fallbackStatusId,
        updatedAt: new Date().toISOString(),
      }
    })

    if (form.statusId === statusId) {
      form.statusId = fallbackStatusId
    }

    if (editingStatusId.value === statusId) {
      resetStatusEditor()
    }
  }

  function exportData() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      statuses: statuses.value,
      jobs: jobs.value,
      visibleColumns: visibleColumns.value,
      viewMode: viewMode.value,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `job-tracker-backup-${todayString()}.json`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  function parseStatuses(rawStatuses: ImportStatus[] | undefined) {
    if (!rawStatuses || rawStatuses.length === 0) {
      return [] as JobStatus[]
    }

    const parsedStatuses: JobStatus[] = []
    for (const item of rawStatuses) {
      if (!item.id || !item.name) {
        continue
      }
      parsedStatuses.push({
        id: item.id,
        name: item.name,
        color: item.color || '#38BDF8',
      })
    }
    return parsedStatuses
  }

  function parseJobs(rawJobs: ImportJob[] | undefined, allowedStatusIds: Set<string>) {
    if (!rawJobs || rawJobs.length === 0) {
      return [] as JobApplication[]
    }

    const parsedJobs: JobApplication[] = []
    for (const item of rawJobs) {
      if (!item.id || !item.sentDate || !item.company || !item.position) {
        continue
      }

      const submitMethod = submitMethods.includes(item.submitMethod ?? 'Email')
        ? (item.submitMethod ?? 'Email')
        : 'Khác'

      const statusId =
        item.statusId && allowedStatusIds.has(item.statusId)
          ? item.statusId
          : Array.from(allowedStatusIds)[0]

      if (!statusId) {
        continue
      }

      parsedJobs.push({
        id: item.id,
        sentDate: item.sentDate,
        company: item.company,
        position: item.position,
        jobUrl: item.jobUrl ?? '',
        submitMethod,
        salaryExpectation: item.salaryExpectation ?? '',
        hrResponseDays: typeof item.hrResponseDays === 'number' ? item.hrResponseDays : null,
        interviewer: item.interviewer ?? '',
        statusId,
        notes: item.notes ?? '',
        createdAt: item.createdAt ?? new Date().toISOString(),
        updatedAt: item.updatedAt ?? new Date().toISOString(),
      })
    }
    return parsedJobs
  }

  function applyVisibleColumns(importedColumns: Partial<Record<ColumnKey, boolean>> | undefined) {
    if (!importedColumns) {
      return
    }

    const merged: Record<ColumnKey, boolean> = { ...defaultVisibleColumns }
    for (const option of columnOptions) {
      if (typeof importedColumns[option.key] === 'boolean') {
        merged[option.key] = importedColumns[option.key] ?? true
      }
    }
    visibleColumns.value = merged
  }

  function applyViewMode(nextMode: ViewMode | undefined) {
    if (!nextMode) {
      return
    }
    if (nextMode === 'card' || nextMode === 'table') {
      viewMode.value = nextMode
    }
  }

  function importFromText(text: string) {
    const payload = JSON.parse(text) as ImportPayload

    const parsedStatuses = parseStatuses(payload.statuses)
    const nextStatuses = parsedStatuses.length > 0 ? parsedStatuses : [...defaultStatuses]
    const allowedStatusIds = new Set(nextStatuses.map((status) => status.id))
    const parsedJobs = parseJobs(payload.jobs, allowedStatusIds)

    statuses.value = nextStatuses
    jobs.value = parsedJobs
    applyVisibleColumns(payload.visibleColumns)
    applyViewMode(payload.viewMode)
    resetStatusEditor()

    if (!allowedStatusIds.has(form.statusId)) {
      form.statusId = nextStatuses[0]?.id ?? ''
    }
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  return {
    submitMethods,
    statuses,
    jobs,
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
  }
}
