import type { DailyOracleInfo } from './types'

export const LUCKY_NUMBERS = [8080, 3000, 3306, 400, 401, 403, 404, 419, 429, 500, 503]

export const DEITIES = [
  'Anh Shipper chăm chỉ',
  'Chị Kế toán tốt bụng',
  'Anh PM hiền lành',
  'Chị HR dễ tính',
  'Cậu Intern may mắn',
  'Vị Senior gánh tạ',
  'Cô Lao công vui vẻ',
  'Chú Bảo vệ vui tính',
  'Anh DevOps mát tay',
  'Bạn Designer tâm lý',
  'Chị QA mắt ưng',
  'Anh Support nhiệt tình',
  'Bác Mentor kiên nhẫn',
  'Anh Bridge SE linh hoạt',
]

export const DIRECTIONS = [
  'Hướng có sóng WiFi 5 vạch: Để Zoom không biến bạn thành robot giữa cuộc họp.',
  'Tránh xa máy pha cà phê: Nơi dễ bị PM "tiện tay" giao thêm task ngoài giờ.',
  'Hướng cửa sổ nhìn xa: Để mắt được nghỉ ngơi sau 8 tiếng nhìn chằm chằm vào Dark Mode.',
  'Hướng gần lối thoát hiểm: Phòng khi Prod sập và bạn cần "biến mất" trong 1 nốt nhạc.',
  'Hướng ổ cắm điện còn trống: Vì một chiếc Laptop hết pin là một chiếc Laptop vô dụng.',
  'Góc khuất ít người Ping: Nơi bạn có thể "Deep Work" (hoặc lướt Reddit) mà không bị soi.',
  'Cạnh một chậu cây xanh: Giúp giảm bức xạ màn hình và hạ hỏa khi bị Reject PR.',
  'Đối diện Whiteboard: Để trông có vẻ đang tư duy hệ thống khi thực ra đang vẽ bậy.',
  'Góc nhìn rõ màn hình Pipeline: Thấy màu xanh thì cười, thấy màu đỏ thì... chạy.',
  'Bàn rộng rãi: Đủ chỗ cho 2 màn hình, 1 ly cà phê và 3 gói snack cứu đói deadline.',
  'Xa cửa phòng họp: Tránh việc bị "vơ" vào những cuộc họp mà bạn không thuộc về.',
  'Nơi ánh sáng dịu nhẹ: Để code đêm không bị lóa và tăng cảm giác "Hacker".',
  'Ngồi cạnh đồng nghiệp vui tính: Để có người cùng cười (hoặc cùng khóc) khi gặp lỗi logic.',
  'Hướng xa máy in: Tránh tiếng ồn và những lần "nhờ check hộ sao giấy kẹt".',
  'Hướng về phía Pantry: Để là người đầu tiên biết khi nào có trà chiều miễn phí.',
]

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pickByDate<T>(items: readonly T[], date: Date, salt: string): T {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${salt}-${date.getMinutes()}`
  const index = hashString(key) % items.length
  return items[index]!
}

export function getDailyOracleInfo(date = new Date()): DailyOracleInfo {
  return {
    luckyNumber: pickByDate(LUCKY_NUMBERS, date, 'lucky-number'),
    deity: pickByDate(DEITIES, date, 'deity'),
    direction: pickByDate(DIRECTIONS, date, 'direction'),
  }
}

// --- Hexagram-specific guidance (hours & actions)
export const AUSPICIOUS_HOURS = [
  'Giờ Tý (23h-1h): Thích hợp đọc log và làm code yên tĩnh',
  'Giờ Sửu (1h-3h): Thời điểm tư duy sâu cho kiến trúc',
  'Giờ Dần (3h-5h): Lên kế hoạch và chuẩn bị checklist',
  'Giờ Mão (5h-7h): Tốt cho việc rà soát PR nhỏ',
  'Giờ Thìn (7h-9h): Fix bug nhanh và hiệu quả',
  'Giờ Tỵ (9h-11h): Họp sync ngắn và rõ ràng',
  'Giờ Ngọ (11h-13h): Triển khai thử nghiệm trên staging',
  'Giờ Mùi (13h-15h): Tốt cho review code và pair programming',
  'Giờ Thân (15h-17h): Tối ưu performance và profiling',
  'Giờ Dậu (17h-19h): Hoàn thiện task nhỏ trước khi ra về',
  'Giờ Tuất (19h-21h): Chốt issue nhẹ và chuẩn bị release notes',
  'Giờ Hợi (21h-23h): Thời gian phù hợp để lên lịch backup',
]

export const INAUSPICIOUS_HOURS = [
  'Giờ Hợi (21h-23h): Tuyệt đối không chạm vào server production',
  'Giờ Tý (23h-1h): Tránh deploy khi team nghỉ ngơi',
  'Giờ Sửu (1h-3h): Không nên bắt đầu task lớn',
  'Giờ Dần (3h-5h): Tránh migrate database trong giờ này',
  'Giờ Thìn (7h-9h): Không làm việc phá cấu trúc lớn',
  'Giờ Ngọ (11h-13h): Tránh thay đổi cấu hình lúc ăn trưa',
]

export const SHOULD_DO = [
  'Viết unit test cho chức năng vừa sửa',
  'Cập nhật Documentation ngắn gọn',
  'Tạo ticket chi tiết kèm reproduction steps',
  'Thực hiện code review nhẹ và hợp nhất nhanh',
  'Tối ưu query hoặc cache ở phần nóng',
  'Lên kế hoạch rollback trước khi deploy',
  'Chạy script kiểm tra môi trường trước khi thao tác',
]

export const SHOULD_NOT_DO = [
  'Đụng vào migration trên production không có backup',
  'Deploy vào cuối giờ và không có người on-call',
  'Xóa log hay dữ liệu mà không có export',
  'Refactor lớn ngay trước release',
  'Tin vào cảm tính mà không có reproduction steps',
  'Thử nghiệm trên prod khi có traffic cao',
]

/**
 * Return guidance for a hexagram identified by id or binary string.
 * Uses deterministic hashing so the mapping is stable per-hexagram.
 */
export function getHexagramGuidance() {
  const date = new Date()

  return {
    auspicious: pickByDate(AUSPICIOUS_HOURS, date, 'auspicious-hour'),
    inauspicious: pickByDate(INAUSPICIOUS_HOURS, date, 'inauspicious-hour'),
    shouldDo: pickByDate(SHOULD_DO, date, 'should-do'),
    shouldNotDo: pickByDate(SHOULD_NOT_DO, date, 'should-not-do'),
  }
}
