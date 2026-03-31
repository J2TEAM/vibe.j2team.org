export interface PeriodCycle {
  id: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  length: number // days of period
  cycleLength: number // days from this start to next start (0 if latest)
}

export interface DayLog {
  date: string
  symptoms: SymptomType[]
  flow: FlowLevel | null
  notes: string
}

export type FlowLevel = 'light' | 'medium' | 'heavy'

export const FLOW_OPTIONS: { value: FlowLevel; label: string; color: string }[] = [
  { value: 'light', label: 'Nhẹ', color: '#FFB830' },
  { value: 'medium', label: 'Vừa', color: '#FF6B4A' },
  { value: 'heavy', label: 'Nhiều', color: '#dc2626' },
]

export type SymptomType =
  | 'cramps'
  | 'headache'
  | 'fatigue'
  | 'bloating'
  | 'mood-swings'
  | 'breast-tender'
  | 'acne'
  | 'backache'
  | 'nausea'
  | 'insomnia'

export interface SymptomOption {
  value: SymptomType
  label: string
  icon: string
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { value: 'cramps', label: 'Đau bụng', icon: 'lucide:flame' },
  { value: 'headache', label: 'Đau đầu', icon: 'lucide:brain' },
  { value: 'fatigue', label: 'Mệt mỏi', icon: 'lucide:battery-low' },
  { value: 'bloating', label: 'Đầy hơi', icon: 'lucide:circle-dot' },
  { value: 'mood-swings', label: 'Thay đổi tâm trạng', icon: 'lucide:heart-crack' },
  { value: 'breast-tender', label: 'Đau ngực', icon: 'lucide:shield-alert' },
  { value: 'acne', label: 'Mụn', icon: 'lucide:sparkles' },
  { value: 'backache', label: 'Đau lưng', icon: 'lucide:move-vertical' },
  { value: 'nausea', label: 'Buồn nôn', icon: 'lucide:frown' },
  { value: 'insomnia', label: 'Mất ngủ', icon: 'lucide:moon-star' },
]

export type CyclePhase = 'period' | 'follicular' | 'ovulation' | 'luteal'

export interface PhaseInfo {
  key: CyclePhase
  label: string
  color: string
  description: string
}

export const PHASE_INFO: PhaseInfo[] = [
  {
    key: 'period',
    label: 'Kinh nguyệt',
    color: '#FF6B4A',
    description: 'Cơ thể đang thải lớp niêm mạc tử cung. Nghỉ ngơi và bổ sung sắt.',
  },
  {
    key: 'follicular',
    label: 'Nang trứng',
    color: '#38BDF8',
    description: 'Estrogen tăng, năng lượng phục hồi. Thích hợp tập thể dục và lên kế hoạch.',
  },
  {
    key: 'ovulation',
    label: 'Rụng trứng',
    color: '#22c55e',
    description: 'Khả năng thụ thai cao nhất. Năng lượng và tự tin đạt đỉnh.',
  },
  {
    key: 'luteal',
    label: 'Hoàng thể',
    color: '#FFB830',
    description: 'Progesterone tăng, có thể xuất hiện PMS. Ưu tiên tự chăm sóc bản thân.',
  },
]
