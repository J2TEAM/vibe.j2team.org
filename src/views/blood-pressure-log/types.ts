export interface BPReading {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  systolic: number
  diastolic: number
  heartRate: number
  note: string
  category: BPCategory
  createdAt: number
}

export type BPCategory = 'low' | 'normal' | 'elevated' | 'high1' | 'high2' | 'crisis'

export interface BPCategoryInfo {
  key: BPCategory
  label: string
  color: string
  systolicRange: string
  diastolicRange: string
  description: string
}

export const BP_CATEGORIES: BPCategoryInfo[] = [
  {
    key: 'low',
    label: 'Huyết áp thấp',
    color: '#38BDF8',
    systolicRange: '< 90',
    diastolicRange: '< 60',
    description: 'Có thể gây chóng mặt, mệt mỏi. Nên tham khảo ý kiến bác sĩ.',
  },
  {
    key: 'normal',
    label: 'Bình thường',
    color: '#22c55e',
    systolicRange: '90–119',
    diastolicRange: '60–79',
    description: 'Huyết áp lý tưởng. Duy trì lối sống lành mạnh.',
  },
  {
    key: 'elevated',
    label: 'Tăng cao',
    color: '#FFB830',
    systolicRange: '120–129',
    diastolicRange: '< 80',
    description: 'Có nguy cơ phát triển thành tăng huyết áp nếu không kiểm soát.',
  },
  {
    key: 'high1',
    label: 'Cao HA giai đoạn 1',
    color: '#FF6B4A',
    systolicRange: '130–139',
    diastolicRange: '80–89',
    description: 'Nên thay đổi lối sống và có thể cần dùng thuốc theo chỉ định bác sĩ.',
  },
  {
    key: 'high2',
    label: 'Cao HA giai đoạn 2',
    color: '#ef4444',
    systolicRange: '≥ 140',
    diastolicRange: '≥ 90',
    description: 'Cần dùng thuốc và thay đổi lối sống ngay. Theo dõi thường xuyên.',
  },
  {
    key: 'crisis',
    label: 'KHẨN CẤP',
    color: '#dc2626',
    systolicRange: '> 180',
    diastolicRange: '> 120',
    description: 'CẦN GẶP BÁC SĨ NGAY LẬP TỨC! Có thể gây tổn thương cơ quan.',
  },
]

export function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic > 180 || diastolic > 120) return 'crisis'
  if (systolic >= 140 || diastolic >= 90) return 'high2'
  if (systolic >= 130 || diastolic >= 80) return 'high1'
  if (systolic >= 120 && diastolic < 80) return 'elevated'
  if (systolic >= 90 && diastolic >= 60) return 'normal'
  return 'low'
}

export function getCategoryInfo(cat: BPCategory): BPCategoryInfo {
  return BP_CATEGORIES.find((c) => c.key === cat) ?? BP_CATEGORIES[1]!
}

export const BP_KNOWLEDGE = [
  {
    title: 'Cách đo huyết áp đúng',
    items: [
      'Ngồi nghỉ ít nhất 5 phút trước khi đo',
      'Không uống caffeine, hút thuốc 30 phút trước đo',
      'Ngồi thẳng lưng, chân đặt trên sàn, không bắt chéo',
      'Đặt cánh tay ngang tim, lòng bàn tay ngửa lên',
      'Không nói chuyện khi đang đo',
      'Đo 2 lần cách nhau 1 phút, lấy trung bình',
    ],
  },
  {
    title: 'Khi nào cần gặp bác sĩ',
    items: [
      'Huyết áp liên tục ≥ 140/90 mmHg',
      'Huyết áp > 180/120 mmHg (khẩn cấp)',
      'Đau đầu dữ dội, mờ mắt, khó thở',
      'Đau ngực, buồn nôn, chảy máu cam',
      'Huyết áp thấp gây chóng mặt, ngất xỉu',
    ],
  },
  {
    title: 'Cách giảm huyết áp tự nhiên',
    items: [
      'Giảm muối: < 5g/ngày (1 muỗng cà phê)',
      'Tập thể dục 150 phút/tuần (đi bộ nhanh)',
      'Giảm cân nếu thừa cân',
      'Hạn chế rượu bia',
      'Ăn nhiều rau xanh, trái cây, ngũ cốc',
      'Quản lý stress: thiền, yoga, hít thở sâu',
    ],
  },
]
