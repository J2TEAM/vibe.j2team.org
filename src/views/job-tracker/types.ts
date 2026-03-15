export type SubmitMethod = 'Email' | 'LinkedIn' | 'App' | 'Website' | 'Khác'

export type ViewMode = 'card' | 'table'

export type ColumnKey =
  | 'sentDate'
  | 'company'
  | 'position'
  | 'jobUrl'
  | 'submitMethod'
  | 'salaryExpectation'
  | 'hrResponseDays'
  | 'interviewer'
  | 'status'
  | 'notes'

export interface JobStatus {
  id: string
  name: string
  color: string
}

export interface JobApplication {
  id: string
  sentDate: string
  company: string
  position: string
  jobUrl: string
  submitMethod: SubmitMethod
  salaryExpectation: string
  hrResponseDays: number | null
  interviewer: string
  statusId: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface JobFormModel {
  sentDate: string
  company: string
  position: string
  jobUrl: string
  submitMethod: SubmitMethod
  salaryExpectation: string
  hrResponseDays: string
  interviewer: string
  statusId: string
  notes: string
}

export interface ImportStatus {
  id?: string
  name?: string
  color?: string
}

export interface ImportJob {
  id?: string
  sentDate?: string
  company?: string
  position?: string
  jobUrl?: string
  submitMethod?: SubmitMethod
  salaryExpectation?: string
  hrResponseDays?: number | null
  interviewer?: string
  statusId?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface ImportPayload {
  statuses?: ImportStatus[]
  jobs?: ImportJob[]
  visibleColumns?: Partial<Record<ColumnKey, boolean>>
  viewMode?: ViewMode
}
