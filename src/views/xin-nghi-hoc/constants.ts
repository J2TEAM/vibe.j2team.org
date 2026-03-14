export const CATEGORIES = [
  { id: 'health', label: 'Sức khỏe', icon: 'lucide:heart-pulse' },
  { id: 'work', label: 'Công việc', icon: 'lucide:briefcase' },
  { id: 'family', label: 'Gia đình', icon: 'lucide:users' },
  { id: 'accident', label: 'Tai nạn bất ngờ', icon: 'lucide:alert-triangle' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export const REASONS: Record<CategoryId, string[]> = {
  health: [
    'Đau nửa đầu cấp tính',
    'Viêm xoang cấp nặn',
    'Đau dạ dày co thắt',
    'Ngộ độc thực phẩm',
    'Chấn thương phần mềm',
    'Sốt siêu vi cao độ',
    'Viêm họng mất tiếng',
    'Dị ứng thời tiết nặng',
  ],
  work: [
    'Họp đột xuất với đối tác quan trọng',
    'Đi công tác gấp theo yêu cầu công ty',
    'Xử lý deadline dự án khẩn cấp',
    'Sự cố hệ thống server cần cứu net',
    'Tham gia khóa đào tạo nội bộ bắt buộc',
    'Tiếp đoàn thanh tra tại văn phòng',
  ],
  family: [
    'Đám giỗ quan trọng tại quê',
    'Đưa người thân đi khám bệnh định kỳ',
    'Sự cố điện nước tại nhà cần xử lý ngay',
    'Việc gia đình đột xuất không có người quán xuyến',
    'Hỗ trợ em nhỏ đi thi/nhập học',
    'Người thân ở quê lên chơi cần đón',
  ],
  accident: [
    'Hỏng xe dọc đường đang chờ cứu hộ',
    'Va chạm giao thông nhẹ đang giải quyết',
    'Thất lạc giấy tờ quan trọng cần đi trình báo',
    'Sự cố giao thông công cộng trì trệ',
    'Bị kẹt thang máy khu chung cư',
    'Mưa bão ngập lụt không thể di chuyển',
  ],
}

export const REASONS_EN: Record<CategoryId, string[]> = {
  health: [
    'Acute migraine',
    'Severe sinusitis flare-up',
    'Stomach cramps',
    'Food poisoning',
    'Soft tissue injury',
    'High-grade viral fever',
    'Severe laryngitis',
    'Severe seasonal allergies',
  ],
  work: [
    'Urgent meeting with key partners',
    'Unscheduled business trip',
    'Critical project deadline',
    'Critical server system failure',
    'Mandatory internal training session',
    'Hosting an official inspection at the office',
  ],
  family: [
    'Important family memorial service',
    'Escorting a relative for medical check-up',
    'Urgent home maintenance (water/electricity)',
    'Unforeseen family emergency',
    'Assisting a sibling with exams/enrollment',
    'Picking up a relative from the countryside',
  ],
  accident: [
    'Vehicle breakdown waiting for recovery',
    'Minor traffic accident being resolved',
    'Lost important documents needing reporting',
    'Severe public transport delay',
    'Stuck in the apartment elevator',
    'Severe flooding/storm making travel impossible',
  ],
}

export const TEMPLATES = {
  vi: {
    subject: 'Đơn xin nghỉ học - [Name] - [ID]',
    body: `Kính gửi Thầy/Cô,

Em tên là [Name] - MSSV: [ID], hiện đang theo học lớp [Subject] của Thầy/Cô vào lúc [Time], ngày [Date].

Vì lý do [Reason], em xin phép Thầy/Cô cho em được nghỉ buổi học này. Em rất lấy làm tiếc vì sự vắng mặt này và xin hứa sẽ hoàn thành bài tập, bài luận đúng hạn.

Em chân thành cảm ơn sự thông cảm của Thầy/Cô.

Trân trọng,
[Name]`,
  },
  en: {
    subject: 'Absence Request - [Name] - [ID]',
    body: `Dear teacher,

My name is [Name] - ID: [ID], attending your [Subject] class at [Time], [Date].

Due to [Reason], I am unable to attend your class this session. I am really sorry for this inconvenience and I promise to submit the homework and assignments on time.

Thank you for your attention and understanding.

Best regards,
[Name]`,
  },
}
