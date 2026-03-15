import type { ColumnKey, JobStatus, SubmitMethod } from './types'

export const submitMethods: SubmitMethod[] = ['Email', 'LinkedIn', 'App', 'Website', 'Khác']

export const columnOptions: { key: ColumnKey; label: string }[] = [
  { key: 'sentDate', label: 'Ngày gửi' },
  { key: 'company', label: 'Công ty' },
  { key: 'position', label: 'Vị trí' },
  { key: 'jobUrl', label: 'Link tuyển dụng' },
  { key: 'submitMethod', label: 'Hình thức gửi' },
  { key: 'salaryExpectation', label: 'Lương deal' },
  { key: 'hrResponseDays', label: 'Trạng thái HR' },
  { key: 'interviewer', label: 'Người phỏng vấn' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'notes', label: 'Ghi chú' },
]

export const defaultVisibleColumns: Record<ColumnKey, boolean> = {
  sentDate: true,
  company: true,
  position: true,
  jobUrl: true,
  submitMethod: true,
  salaryExpectation: true,
  hrResponseDays: true,
  interviewer: true,
  status: true,
  notes: true,
}

export const defaultStatuses: JobStatus[] = [
  { id: 'status-pending', name: 'Chờ phản hồi', color: '#FFB830' },
  { id: 'status-interview', name: 'Phỏng vấn', color: '#38BDF8' },
  { id: 'status-ghosted', name: 'Bị Ghost', color: '#FF6B4A' },
  { id: 'status-rejected', name: 'Từ chối', color: '#B38DF5' },
]
