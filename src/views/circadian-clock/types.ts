export interface CircadianPhase {
  id: string
  label: string
  icon: string
  color: string
  offsetHours: number // hours after wake up
  durationHours: number
  description: string
  hormone: string
  tips: string[]
}

export const CIRCADIAN_PHASES: CircadianPhase[] = [
  {
    id: 'wake',
    label: 'Thức dậy',
    icon: 'lucide:sunrise',
    color: '#FFB830',
    offsetHours: 0,
    durationHours: 1,
    description: 'Cortisol tăng cao nhất, cơ thể bắt đầu tỉnh táo',
    hormone: 'Cortisol ↑↑',
    tips: [
      'Uống nước ngay khi thức dậy',
      'Tiếp xúc ánh sáng tự nhiên',
      'Tránh caffeine 90 phút đầu',
    ],
  },
  {
    id: 'morning-peak',
    label: 'Tập trung cao',
    icon: 'lucide:brain',
    color: '#FF6B4A',
    offsetHours: 1,
    durationHours: 3,
    description: 'Thời điểm vàng cho công việc đòi hỏi tư duy, sáng tạo',
    hormone: 'Cortisol ↑, Dopamine ↑',
    tips: ['Làm việc quan trọng nhất', 'Tránh họp không cần thiết', 'Deep work / Coding'],
  },
  {
    id: 'mid-morning',
    label: 'Năng suất cao',
    icon: 'lucide:zap',
    color: '#FF6B4A',
    offsetHours: 4,
    durationHours: 2,
    description: 'Vẫn trong giai đoạn hiệu suất cao, tốt cho giải quyết vấn đề',
    hormone: 'Adrenaline ↑',
    tips: ['Tiếp tục deep work', 'Caffeine hợp lý', 'Xử lý emails/meetings quan trọng'],
  },
  {
    id: 'lunch',
    label: 'Nghỉ trưa',
    icon: 'lucide:utensils',
    color: '#22c55e',
    offsetHours: 6,
    durationHours: 1.5,
    description: 'Cơ thể cần nạp năng lượng, hệ tiêu hóa hoạt động mạnh',
    hormone: 'Insulin ↑',
    tips: ['Ăn trưa cân bằng dinh dưỡng', 'Tránh ăn quá nhiều carbs', 'Đi bộ nhẹ 10 phút sau ăn'],
  },
  {
    id: 'afternoon-dip',
    label: 'Buồn ngủ chiều',
    icon: 'lucide:cloud-moon',
    color: '#38BDF8',
    offsetHours: 7.5,
    durationHours: 1.5,
    description: 'Năng lượng sụt giảm tự nhiên — thời điểm ngủ trưa tốt nhất',
    hormone: 'Melatonin vi lượng ↑',
    tips: [
      'Power nap 20 phút (nếu có thể)',
      'Tránh caffeine sau 14h',
      'Việc nhẹ: đọc, review code',
    ],
  },
  {
    id: 'afternoon-recovery',
    label: 'Phục hồi chiều',
    icon: 'lucide:trending-up',
    color: '#FFB830',
    offsetHours: 9,
    durationHours: 2,
    description: 'Năng lượng phục hồi, tốt cho họp nhóm và cộng tác',
    hormone: 'Serotonin ↑',
    tips: ['Meetings, brainstorming', 'Pair programming', 'Công việc sáng tạo nhẹ'],
  },
  {
    id: 'exercise',
    label: 'Tập thể dục',
    icon: 'lucide:dumbbell',
    color: '#FF6B4A',
    offsetHours: 11,
    durationHours: 2,
    description: 'Thân nhiệt cao nhất, cơ bắp mạnh nhất — tối ưu cho tập luyện',
    hormone: 'Testosterone ↑, Endorphin ↑',
    tips: [
      'Thời điểm tốt nhất để tập gym',
      'Cardio hoặc strength training',
      'Tránh tập quá muộn (sau 20h)',
    ],
  },
  {
    id: 'dinner',
    label: 'Bữa tối',
    icon: 'lucide:cooking-pot',
    color: '#22c55e',
    offsetHours: 13,
    durationHours: 1.5,
    description: 'Bữa tối nhẹ giúp giấc ngủ tốt hơn',
    hormone: 'Insulin ↑',
    tips: ['Ăn tối nhẹ, ít carbs', 'Ăn trước giờ ngủ 3 tiếng', 'Tránh đồ ăn cay, nặng'],
  },
  {
    id: 'wind-down',
    label: 'Thư giãn',
    icon: 'lucide:lamp-desk',
    color: '#8B9DB5',
    offsetHours: 14.5,
    durationHours: 1.5,
    description: 'Melatonin bắt đầu tiết ra, cơ thể chuẩn bị ngủ',
    hormone: 'Melatonin ↑↑',
    tips: [
      'Giảm ánh sáng xanh (dark mode)',
      'Tránh màn hình 1h trước ngủ',
      'Đọc sách, thiền, nhạc nhẹ',
    ],
  },
  {
    id: 'sleep',
    label: 'Ngủ',
    icon: 'lucide:moon',
    color: '#4A6180',
    offsetHours: 16,
    durationHours: 8,
    description: 'Cơ thể phục hồi, ghi nhớ được củng cố, miễn dịch hoạt động',
    hormone: 'Melatonin ↑↑↑, GH ↑',
    tips: ['Phòng tối, mát (18-20°C)', 'Ngủ 7-9 tiếng', 'Giờ ngủ cố định mỗi ngày'],
  },
]

export interface DailyScore {
  date: string
  score: number // 1-10
  notes: string
}
