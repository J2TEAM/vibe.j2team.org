import type { GameMode, Incident, RandomEvent, Severity, TacticalEdge, TacticalNode } from './types'

export const maxRoundsByMode: Record<GameMode, number> = {
  normal: 12,
  hardcore: 16,
}

export const randomEventChanceByMode: Record<GameMode, number> = {
  normal: 0.25,
  hardcore: 0.37,
}

export const severityPressureByLevel: Record<Severity, number> = {
  'SEV-1': 7,
  'SEV-2': 4,
  'SEV-3': 2,
}

export const incidents: Incident[] = [
  {
    id: 'payment-lag',
    title: 'Thanh toán bị treo 45 giây',
    severity: 'SEV-1',
    context: 'Người dùng checkout tăng mạnh, queue xử lý payment backlog đỏ rực.',
    choices: [
      {
        title: 'Rollback bản release mới',
        description: 'An toàn nhanh, giảm rủi ro ngay nhưng mất tính năng vừa ra.',
        effect: { stability: 20, trust: 8, energy: -10, minutes: -18, chaos: -16 },
      },
      {
        title: 'Scale worker + tạm giới hạn retry',
        description: 'Tối ưu đúng điểm nghẽn, cần phối hợp nhanh với hạ tầng.',
        effect: { stability: 15, trust: 12, energy: -14, minutes: -14, chaos: -10 },
      },
      {
        title: 'Chờ thêm dữ liệu',
        description: 'Ít thay đổi hệ thống nhưng nguy cơ mất khách cao.',
        effect: { stability: -14, trust: -18, energy: 4, minutes: -9, chaos: 12 },
      },
    ],
  },
  {
    id: 'login-fail',
    title: 'Đăng nhập social lỗi gián đoạn',
    severity: 'SEV-2',
    context: 'Một phần request OAuth thất bại do endpoint đối tác timeout.',
    choices: [
      {
        title: 'Fallback sang đăng nhập mật khẩu',
        description: 'Giảm ma sát tạm thời, cần thông báo rõ ràng cho người dùng.',
        effect: { stability: 12, trust: 6, energy: -8, minutes: -10, chaos: -7 },
      },
      {
        title: 'Bật circuit breaker + cache token ngắn hạn',
        description: 'Giải pháp kỹ thuật chắc tay, triển khai cần phối hợp nhanh.',
        effect: { stability: 16, trust: 10, energy: -12, minutes: -13, chaos: -11 },
      },
      {
        title: 'Tắt hẳn social login',
        description: 'Dễ làm nhưng tác động UX nặng.',
        effect: { stability: 6, trust: -12, energy: -4, minutes: -7, chaos: -1 },
      },
    ],
  },
  {
    id: 'cdn-stale',
    title: 'CDN trả JS cũ sau deploy',
    severity: 'SEV-2',
    context: 'Người dùng thấy giao diện vỡ do mismatch asset hash.',
    choices: [
      {
        title: 'Purge cache toàn bộ',
        description: 'Khắc phục nhanh nhưng tăng tải origin.',
        effect: { stability: 14, trust: 9, energy: -9, minutes: -12, chaos: -9 },
      },
      {
        title: 'Chỉ purge route trọng điểm',
        description: 'Cân bằng rủi ro, yêu cầu xác định phạm vi chuẩn.',
        effect: { stability: 10, trust: 8, energy: -7, minutes: -9, chaos: -6 },
      },
      {
        title: 'Đợi cache tự hết hạn',
        description: 'Nhẹ đội vận hành nhưng khó chấp nhận với người dùng.',
        effect: { stability: -10, trust: -14, energy: 3, minutes: -8, chaos: 10 },
      },
    ],
  },
  {
    id: 'db-spike',
    title: 'CPU database chạm mốc 95%',
    severity: 'SEV-1',
    context: 'Query mới đột ngột full scan bảng lớn vào giờ cao điểm.',
    choices: [
      {
        title: 'Kill query + tạo index nóng',
        description: 'Hiệu quả cao, cần phối hợp DBA chính xác.',
        effect: { stability: 18, trust: 9, energy: -15, minutes: -15, chaos: -14 },
      },
      {
        title: 'Read replica cho truy vấn đọc',
        description: 'Giảm tải tốt nhưng thao tác infra nhiều bước.',
        effect: { stability: 13, trust: 8, energy: -11, minutes: -13, chaos: -9 },
      },
      {
        title: 'Thông báo bảo trì ngắn hạn',
        description: 'Giữ an toàn hệ thống, đánh đổi trải nghiệm.',
        effect: { stability: 9, trust: -6, energy: -6, minutes: -8, chaos: -5 },
      },
    ],
  },
  {
    id: 'cache-poison',
    title: 'Dữ liệu cache sai khiến giá hiển thị lệch',
    severity: 'SEV-1',
    context: 'Một key cache bị ghi đè sai định dạng sau batch import.',
    choices: [
      {
        title: 'Flush nhóm key ảnh hưởng + rewarm',
        description: 'Chữa đúng điểm đau, đòi hỏi checklist cẩn thận.',
        effect: { stability: 17, trust: 11, energy: -12, minutes: -14, chaos: -12 },
      },
      {
        title: 'Khóa checkout tạm thời',
        description: 'An toàn dữ liệu, doanh thu ảnh hưởng ngắn hạn.',
        effect: { stability: 11, trust: -5, energy: -8, minutes: -10, chaos: -6 },
      },
      {
        title: 'Sửa tay dữ liệu bị lệch',
        description: 'Dễ sai sót và kéo dài nếu phạm vi lớn.',
        effect: { stability: -6, trust: -10, energy: -6, minutes: -14, chaos: 9 },
      },
    ],
  },
  {
    id: 'queue-duplication',
    title: 'Queue gửi trùng notification hàng loạt',
    severity: 'SEV-3',
    context: 'Người dùng nhận thông báo lặp lại 3-4 lần trong 10 phút.',
    choices: [
      {
        title: 'Bật idempotency key ở consumer',
        description: 'Giải quyết duplicate tận gốc, cần cập nhật worker nhanh.',
        effect: { stability: 10, trust: 8, energy: -8, minutes: -10, chaos: -8 },
      },
      {
        title: 'Dừng queue 5 phút để gỡ kẹt',
        description: 'Nhanh và chắc, nhưng user chờ thông báo lâu hơn.',
        effect: { stability: 8, trust: -3, energy: -4, minutes: -5, chaos: -6 },
      },
      {
        title: 'Gửi xin lỗi và theo dõi thêm',
        description: 'PR tốt nhưng chưa xử lý nguyên nhân hệ thống.',
        effect: { stability: -6, trust: 2, energy: -2, minutes: -4, chaos: 6 },
      },
    ],
  },
  {
    id: 'feature-flag-chaos',
    title: 'Feature flag bật sai nhóm người dùng',
    severity: 'SEV-2',
    context: 'Tính năng beta hiển thị nhầm cho user trả phí, support bị quá tải.',
    choices: [
      {
        title: 'Tắt nhanh flag sai scope',
        description: 'Nhanh gọn, cần kiểm tra side-effect ở các service liên quan.',
        effect: { stability: 12, trust: 7, energy: -6, minutes: -8, chaos: -8 },
      },
      {
        title: 'Rollback config toàn bộ',
        description: 'An toàn cao nhưng mất nhiều tối ưu vừa release.',
        effect: { stability: 14, trust: 5, energy: -9, minutes: -11, chaos: -10 },
      },
      {
        title: 'Tạm ẩn thông báo user bị ảnh hưởng',
        description: 'Giảm pressure support nhưng không giải quyết tận gốc.',
        effect: { stability: -5, trust: -8, energy: -2, minutes: -5, chaos: 7 },
      },
    ],
  },
  {
    id: 'hotfix-regression',
    title: 'Hotfix gây regression module thanh toán',
    severity: 'SEV-1',
    context: 'Sau hotfix, 20% transaction fail với mã lỗi mới.',
    choices: [
      {
        title: 'Rollback hotfix và đóng release train',
        description: 'Dập lửa nhanh, đổi lại dừng các commit khác đang chờ.',
        effect: { stability: 16, trust: 8, energy: -10, minutes: -16, chaos: -12 },
      },
      {
        title: 'Patch tiếp trên production',
        description: 'Nhanh nếu đúng, nhưng rủi ro dẫn đến double incident.',
        effect: { stability: 7, trust: 3, energy: -14, minutes: -10, chaos: 4 },
      },
      {
        title: 'Bật degraded mode checkout',
        description: 'Hạn chế tác động kinh doanh tạm thời.',
        effect: { stability: 11, trust: -3, energy: -7, minutes: -7, chaos: -4 },
      },
    ],
  },
  {
    id: 'search-meltdown',
    title: 'Search index lỗi sau reindex',
    severity: 'SEV-2',
    context: 'Kết quả tìm kiếm trả thiếu dữ liệu, user report tăng nhanh.',
    choices: [
      {
        title: 'Swap về snapshot index cũ',
        description: 'Khôi phục độ chính xác cao, đánh đổi dữ liệu mới vài phút.',
        effect: { stability: 13, trust: 8, energy: -9, minutes: -12, chaos: -9 },
      },
      {
        title: 'Patch incremental theo batch',
        description: 'Giữ dữ liệu mới tốt hơn nhưng mất thời gian điều phối.',
        effect: { stability: 9, trust: 7, energy: -11, minutes: -14, chaos: -5 },
      },
      {
        title: 'Tạm ẩn module search',
        description: 'Giảm khiếu nại kết quả sai, mất trải nghiệm khám phá.',
        effect: { stability: 6, trust: -6, energy: -5, minutes: -6, chaos: -4 },
      },
    ],
  },
  {
    id: 'reporting-lag',
    title: 'Báo cáo realtime chậm 12 phút',
    severity: 'SEV-3',
    context: 'Dashboard BI dùng dữ liệu trễ, các team quyết định sai theo số liệu cũ.',
    choices: [
      {
        title: 'Thông báo stale data + freeze report',
        description: 'Minh bạch, tránh quyết định sai tiếp tục.',
        effect: { stability: 7, trust: 8, energy: -4, minutes: -6, chaos: -4 },
      },
      {
        title: 'Scale stream processor ngay',
        description: 'Giải quyết nghẽn nhanh nhưng cần theo dõi memory leak.',
        effect: { stability: 10, trust: 5, energy: -8, minutes: -9, chaos: -6 },
      },
      {
        title: 'Bỏ qua và chờ data tự cân bằng',
        description: 'Nhẹ tay nhưng dễ lan ra quyết định sai.',
        effect: { stability: -7, trust: -9, energy: 1, minutes: -4, chaos: 8 },
      },
    ],
  },
  {
    id: 'gateway-ratelimit',
    title: 'Rate limit gateway cấu hình lệch',
    severity: 'SEV-2',
    context: 'Người dùng hợp lệ bị block, conversion giảm mạnh trong 15 phút.',
    choices: [
      {
        title: 'Sửa threshold và mở lại traffic',
        description: 'Khôi phục nhanh nhưng cần theo dõi abuse.',
        effect: { stability: 11, trust: 9, energy: -7, minutes: -8, chaos: -8 },
      },
      {
        title: 'Tạm whitelist traffic quan trọng',
        description: 'Bảo toàn doanh thu trước, vẫn còn nhiều user bị ảnh hưởng.',
        effect: { stability: 8, trust: 4, energy: -5, minutes: -6, chaos: -4 },
      },
      {
        title: 'Chờ team security review xong mới sửa',
        description: 'An toàn quy trình, nhưng quá chậm cho incident hiện tại.',
        effect: { stability: -8, trust: -11, energy: -2, minutes: -9, chaos: 9 },
      },
    ],
  },
  {
    id: 'websocket-storm',
    title: 'WebSocket reconnect bão request',
    severity: 'SEV-2',
    context: 'Client reconnect đồng loạt sau sự cố mạng khiến gateway ngập.',
    choices: [
      {
        title: 'Áp dụng exponential backoff phía client',
        description: 'Giảm peak load rõ rệt, cần phát hành config nóng.',
        effect: { stability: 14, trust: 6, energy: -9, minutes: -11, chaos: -10 },
      },
      {
        title: 'Tăng node gateway tạm thời',
        description: 'Mua thời gian tốt nhưng chi phí và vận hành tăng.',
        effect: { stability: 10, trust: 5, energy: -8, minutes: -9, chaos: -6 },
      },
      {
        title: 'Chặn reconnect trong 2 phút',
        description: 'Giảm tải nhanh nhưng UX ảnh hưởng rõ.',
        effect: { stability: 7, trust: -8, energy: -4, minutes: -5, chaos: -3 },
      },
    ],
  },
  {
    id: 'api-timeout',
    title: 'API đối tác phản hồi chậm bất thường',
    severity: 'SEV-3',
    context: 'Tỉ lệ timeout tăng gấp đôi, hệ thống lõi vẫn chạy.',
    choices: [
      {
        title: 'Giảm timeout + retry có kiểm soát',
        description: 'Giữ trải nghiệm ổn định cho đa số user.',
        effect: { stability: 8, trust: 7, energy: -6, minutes: -8, chaos: -5 },
      },
      {
        title: 'Bật degraded mode rõ ràng',
        description: 'Minh bạch, giảm kỳ vọng và pressure support.',
        effect: { stability: 6, trust: 10, energy: -4, minutes: -6, chaos: -4 },
      },
      {
        title: 'Chờ đối tác tự ổn định lại',
        description: 'Đỡ tốn công trước mắt nhưng dễ thành sự cố dây chuyền.',
        effect: { stability: -8, trust: -10, energy: 2, minutes: -6, chaos: 8 },
      },
    ],
  },
  {
    id: 'mobile-crash-loop',
    title: 'App mobile crash loop sau cập nhật',
    severity: 'SEV-1',
    context: 'Phiên bản mới khiến app crash ngay khi mở ở Android 13.',
    choices: [
      {
        title: 'Tạm rollback phiên bản trên store',
        description: 'Giảm ảnh hưởng tức thì nhưng mất tính năng mới.',
        effect: { stability: 17, trust: 9, energy: -9, minutes: -15, chaos: -13 },
      },
      {
        title: 'Bật remote config tắt module lỗi',
        description: 'Giữ app sống, cần xác nhận tỷ lệ áp dụng cấu hình.',
        effect: { stability: 13, trust: 8, energy: -11, minutes: -10, chaos: -8 },
      },
      {
        title: 'Chờ hotfix binary mới',
        description: 'Đúng quy trình nhưng quá chậm cho user hiện tại.',
        effect: { stability: -9, trust: -14, energy: -3, minutes: -8, chaos: 11 },
      },
    ],
  },
  {
    id: 'webhook-backlog',
    title: 'Webhook đối tác bị dồn backlog lớn',
    severity: 'SEV-2',
    context: 'Hơn 120k webhook chờ xử lý, trạng thái đơn hàng cập nhật rất trễ.',
    choices: [
      {
        title: 'Tăng consumer theo cụm và ưu tiên đơn mới',
        description: 'Giảm độ trễ hiệu quả, cần giám sát retry storm.',
        effect: { stability: 12, trust: 9, energy: -10, minutes: -12, chaos: -9 },
      },
      {
        title: 'Chạy replay có kiểm soát theo từng batch',
        description: 'Ổn định hơn, tốc độ xử lý chậm hơn chút.',
        effect: { stability: 9, trust: 7, energy: -8, minutes: -9, chaos: -6 },
      },
      {
        title: 'Để queue tự xử lý dần',
        description: 'Ít can thiệp nhưng khiến user thấy trạng thái sai lâu.',
        effect: { stability: -7, trust: -9, energy: 1, minutes: -5, chaos: 8 },
      },
    ],
  },
  {
    id: 'redis-eviction',
    title: 'Redis eviction tăng đột biến',
    severity: 'SEV-2',
    context: 'Nhiều key nóng bị đẩy khỏi cache, latency API tăng liên tục.',
    choices: [
      {
        title: 'Tăng memory + tối ưu TTL nhóm key nóng',
        description: 'Giảm eviction nhanh nhưng cần theo dõi chi phí.',
        effect: { stability: 13, trust: 8, energy: -9, minutes: -11, chaos: -9 },
      },
      {
        title: 'Tách namespace cache theo dịch vụ',
        description: 'Kiểm soát tốt dài hạn, triển khai nhanh vừa phải.',
        effect: { stability: 10, trust: 7, energy: -10, minutes: -12, chaos: -7 },
      },
      {
        title: 'Giảm cache ở endpoint ít dùng',
        description: 'Đỡ áp lực RAM nhưng tăng tải backend nền.',
        effect: { stability: 5, trust: -3, energy: -6, minutes: -8, chaos: -2 },
      },
    ],
  },
  {
    id: 'email-bounce-spike',
    title: 'Tỉ lệ email bounce tăng bất thường',
    severity: 'SEV-3',
    context: 'Nhà cung cấp email đánh tụt reputation domain gửi thông báo.',
    choices: [
      {
        title: 'Giảm lưu lượng gửi + tách warm-up IP',
        description: 'Giữ uy tín domain, chấp nhận chậm thông báo marketing.',
        effect: { stability: 8, trust: 8, energy: -6, minutes: -7, chaos: -5 },
      },
      {
        title: 'Chuyển khẩn sang provider dự phòng',
        description: 'Nhanh nhưng có rủi ro template/track lệch.',
        effect: { stability: 9, trust: 6, energy: -8, minutes: -9, chaos: -6 },
      },
      {
        title: 'Tiếp tục gửi như cũ',
        description: 'Không tốn công ngay nhưng dễ bị chặn diện rộng.',
        effect: { stability: -8, trust: -10, energy: 2, minutes: -4, chaos: 8 },
      },
    ],
  },
  {
    id: 'permission-misconfig',
    title: 'Phân quyền nội bộ cấu hình sai',
    severity: 'SEV-1',
    context: 'Một nhóm nhân sự có quyền truy cập dữ liệu vượt phạm vi.',
    choices: [
      {
        title: 'Khóa tạm role bị lỗi + audit access log',
        description: 'Giảm rủi ro ngay, cần phối hợp bảo mật và pháp chế.',
        effect: { stability: 14, trust: 11, energy: -12, minutes: -13, chaos: -11 },
      },
      {
        title: 'Rollback policy về bản ổn định gần nhất',
        description: 'Nhanh và chắc, nhưng gián đoạn vài tác vụ nội bộ.',
        effect: { stability: 12, trust: 8, energy: -9, minutes: -10, chaos: -8 },
      },
      {
        title: 'Theo dõi thêm trước khi can thiệp',
        description: 'Giảm áp lực thao tác nhưng rủi ro tuân thủ cao.',
        effect: { stability: -12, trust: -16, energy: 3, minutes: -6, chaos: 12 },
      },
    ],
  },
  {
    id: 'billing-double-charge',
    title: 'Lỗi ghi nhận thanh toán trùng giao dịch',
    severity: 'SEV-1',
    context: 'Một nhóm khách bị trừ tiền hai lần do retry không idempotent.',
    choices: [
      {
        title: 'Tắt cổng thanh toán 7 phút để chặn phát sinh mới',
        description: 'Ngăn thiệt hại lan rộng, nhưng doanh thu tức thời bị ảnh hưởng.',
        effect: { stability: 15, trust: 10, energy: -10, minutes: -10, chaos: -11 },
      },
      {
        title: 'Bật hard-check idempotency ở payment service',
        description: 'Can thiệp đúng lõi sự cố, cần phối hợp nhanh với backend.',
        effect: { stability: 17, trust: 8, energy: -12, minutes: -14, chaos: -12 },
      },
      {
        title: 'Theo dõi thêm trước khi hoàn tiền',
        description: 'Ít thao tác ngay nhưng rủi ro bùng nổ khiếu nại rất cao.',
        effect: { stability: -13, trust: -18, energy: 2, minutes: -6, chaos: 13 },
      },
    ],
  },
  {
    id: 'partner-api-schema-break',
    title: 'Đối tác đổi schema API không báo trước',
    severity: 'SEV-2',
    context: 'Payload mới khiến parser fail trên 40% request đồng bộ dữ liệu.',
    choices: [
      {
        title: 'Fallback về parser version cũ',
        description: 'Khôi phục luồng chính nhanh, dữ liệu mới bị giới hạn tạm thời.',
        effect: { stability: 12, trust: 8, energy: -8, minutes: -9, chaos: -8 },
      },
      {
        title: 'Viết adapter map schema nóng',
        description: 'Giữ đầy đủ dữ liệu, đổi lại team phải xử lý áp lực cao.',
        effect: { stability: 14, trust: 9, energy: -11, minutes: -12, chaos: -9 },
      },
      {
        title: 'Tạm ngắt đồng bộ đối tác',
        description: 'An toàn hệ thống nội bộ nhưng gián đoạn nghiệp vụ ngoài.',
        effect: { stability: 7, trust: -7, energy: -5, minutes: -7, chaos: -3 },
      },
    ],
  },
  {
    id: 'invoice-mismatch',
    title: 'Hóa đơn VAT sinh sai thuế suất',
    severity: 'SEV-1',
    context: 'Nhiều hóa đơn trong ngày bị tính thuế lệch do rule cập nhật thiếu điều kiện.',
    choices: [
      {
        title: 'Dừng phát hành hóa đơn tự động và chuyển thủ công',
        description: 'Chặn phát sinh sai mới, nhưng tải vận hành tăng đáng kể.',
        effect: { stability: 13, trust: 10, energy: -13, minutes: -11, chaos: -10 },
      },
      {
        title: 'Hotfix rule và chạy đối soát toàn bộ hóa đơn lỗi',
        description: 'Phương án toàn diện nhưng yêu cầu liên phòng ban đồng bộ.',
        effect: { stability: 16, trust: 11, energy: -15, minutes: -14, chaos: -12 },
      },
      {
        title: 'Đợi batch đêm rồi xử lý sau',
        description: 'Tiết kiệm công trước mắt nhưng rủi ro tuân thủ tăng nhanh.',
        effect: { stability: -12, trust: -17, energy: 2, minutes: -5, chaos: 12 },
      },
    ],
  },
  {
    id: 'search-abuse-bot',
    title: 'Bot cào dữ liệu làm nghẽn cụm search',
    severity: 'SEV-2',
    context: 'QPS search tăng đột biến từ nhiều IP xoay vòng, người dùng thật bị chậm.',
    choices: [
      {
        title: 'Bật challenge theo hành vi bất thường',
        description: 'Giảm bot hiệu quả, có thể làm tăng ma sát nhẹ cho user thật.',
        effect: { stability: 11, trust: 6, energy: -8, minutes: -8, chaos: -8 },
      },
      {
        title: 'Tăng node search + giới hạn burst rate',
        description: 'Vừa mở rộng tài nguyên vừa kiểm soát đỉnh tải.',
        effect: { stability: 13, trust: 7, energy: -10, minutes: -10, chaos: -9 },
      },
      {
        title: 'Tạm hạ độ chi tiết kết quả tìm kiếm',
        description: 'Giảm tải nhanh nhưng trải nghiệm khám phá giảm rõ.',
        effect: { stability: 8, trust: -4, energy: -5, minutes: -6, chaos: -4 },
      },
    ],
  },
  {
    id: 'kafka-lag-spike',
    title: 'Kafka lag tăng vọt ở topic đơn hàng',
    severity: 'SEV-2',
    context: 'Consumer tụt tốc độ xử lý, trạng thái đơn hàng hiển thị trễ trên app.',
    choices: [
      {
        title: 'Tăng partition + rebalance consumer',
        description: 'Giải quyết triệt để hơn, nhưng thao tác cần chính xác để tránh rung lắc.',
        effect: { stability: 14, trust: 8, energy: -11, minutes: -12, chaos: -10 },
      },
      {
        title: 'Ưu tiên consume luồng trạng thái quan trọng',
        description: 'Cải thiện phần người dùng thấy trước, giảm bớt áp lực support.',
        effect: { stability: 10, trust: 9, energy: -8, minutes: -9, chaos: -7 },
      },
      {
        title: 'Giữ nguyên cấu hình và theo dõi thêm',
        description: 'Ít rủi ro thao tác nhưng backlog có thể phình nhanh.',
        effect: { stability: -9, trust: -11, energy: 2, minutes: -6, chaos: 9 },
      },
    ],
  },
]

export const randomEvents: RandomEvent[] = [
  {
    id: 'dns-flap',
    title: 'DNS flapping bất ngờ',
    description: 'DNS resolver trả kết quả không nhất quán giữa các region.',
    severity: 'SEV-2',
    effect: { stability: -8, trust: -5, energy: -4, minutes: -3, chaos: 7 },
    weight: 3,
  },
  {
    id: 'cert-expire',
    title: 'SSL cert sắp hết hạn',
    description: 'Wildcard cert còn dưới 2 giờ. Cần renew gấp để tránh fail HTTPS.',
    severity: 'SEV-1',
    effect: { stability: -6, trust: -8, energy: -6, minutes: -5, chaos: 10 },
    weight: 1,
  },
  {
    id: 'memory-leak',
    title: 'Memory leak xuất hiện',
    description: 'Một service tăng RAM đều, nguy cơ OOM trong ít phút tới.',
    severity: 'SEV-2',
    effect: { stability: -10, trust: -3, energy: -5, minutes: -4, chaos: 8 },
    weight: 3,
  },
  {
    id: 'ddos-mini',
    title: 'Mini DDoS từ botnet',
    description: 'Traffic bất thường tăng x3, WAF chặn 60% nhưng vẫn gây chậm.',
    severity: 'SEV-1',
    effect: { stability: -12, trust: -6, energy: -7, minutes: -5, chaos: 12 },
    weight: 1,
  },
  {
    id: 'config-drift',
    title: 'Config drift staging/prod',
    description: 'Feature flag lệch môi trường, hành vi production không đúng dự kiến.',
    severity: 'SEV-3',
    effect: { stability: -5, trust: -4, energy: -3, minutes: -2, chaos: 5 },
    weight: 3,
  },
  {
    id: 'disk-full',
    title: 'Disk /var/log đầy 98%',
    description: 'Log rotation fail 3 ngày, service có nguy cơ crash.',
    severity: 'SEV-2',
    effect: { stability: -7, trust: -2, energy: -4, minutes: -3, chaos: 6 },
    weight: 3,
  },
  {
    id: 'token-storm',
    title: 'Auth token refresh bão request',
    description: 'Client đồng loạt refresh token do sai cache expiry.',
    severity: 'SEV-2',
    effect: { stability: -9, trust: -4, energy: -4, minutes: -3, chaos: 7 },
    weight: 3,
  },
  {
    id: 'storage-throttle',
    title: 'Storage bị throttle',
    description: 'I/O object storage bị hạn chế, upload media fail từng đợt.',
    severity: 'SEV-2',
    effect: { stability: -8, trust: -6, energy: -3, minutes: -4, chaos: 8 },
    weight: 2,
  },
  {
    id: 'time-sync-drift',
    title: 'Server time drift',
    description: 'Lệch NTP gây sai session signature trên một nhóm node.',
    severity: 'SEV-3',
    effect: { stability: -6, trust: -3, energy: -2, minutes: -2, chaos: 5 },
    weight: 3,
  },
  {
    id: 'cache-node-restart',
    title: 'Node cache tự restart hàng loạt',
    description: 'Cụm cache mất nóng cục bộ, API latency tăng theo nhịp.',
    severity: 'SEV-2',
    effect: { stability: -9, trust: -5, energy: -5, minutes: -4, chaos: 8 },
    weight: 2,
  },
  {
    id: 'payment-provider-warning',
    title: 'Đối tác thanh toán cảnh báo suy giảm',
    description: 'Tỉ lệ approve giảm nhẹ nhưng chưa quá ngưỡng incident chính.',
    severity: 'SEV-3',
    effect: { stability: -5, trust: -6, energy: -3, minutes: -2, chaos: 5 },
    weight: 3,
  },
  {
    id: 'waf-false-positive',
    title: 'WAF chặn nhầm traffic hợp lệ',
    description: 'Một rule mới quá nhạy, request người dùng thật bị từ chối tăng mạnh.',
    severity: 'SEV-2',
    effect: { stability: -8, trust: -7, energy: -4, minutes: -3, chaos: 7 },
    weight: 2,
  },
  {
    id: 'smtp-delay',
    title: 'Hàng đợi SMTP gửi chậm bất thường',
    description: 'Email OTP và thông báo giao dịch đến trễ hơn 4-6 phút.',
    severity: 'SEV-3',
    effect: { stability: -6, trust: -6, energy: -3, minutes: -2, chaos: 5 },
    weight: 3,
  },
  {
    id: 'fraud-flag-spike',
    title: 'Hệ thống chống gian lận cảnh báo quá mức',
    description: 'Tỉ lệ đơn hợp lệ bị giữ để review tăng cao ngoài dự kiến.',
    severity: 'SEV-2',
    effect: { stability: -7, trust: -8, energy: -5, minutes: -3, chaos: 7 },
    weight: 2,
  },
  {
    id: 'timezone-bug',
    title: 'Lệch múi giờ gây sai lịch khuyến mãi',
    description: 'Một số chương trình flash sale mở sai giờ ở vài khu vực.',
    severity: 'SEV-3',
    effect: { stability: -5, trust: -7, energy: -2, minutes: -2, chaos: 5 },
    weight: 3,
  },
  {
    id: 'observability-gap',
    title: 'Mất một phần telemetry production',
    description: 'Metric ingestion drop 35%, khả năng quan sát giảm đáng kể.',
    severity: 'SEV-2',
    effect: { stability: -7, trust: -4, energy: -4, minutes: -3, chaos: 6 },
    weight: 2,
  },
]

export const tacticalNodes: TacticalNode[] = [
  { id: 'lb', x: 12, y: 20, lane: 'gateway', label: 'LB' },
  { id: 'gw-1', x: 12, y: 50, lane: 'gateway', label: 'GW-1' },
  { id: 'gw-2', x: 12, y: 80, lane: 'gateway', label: 'GW-2' },
  { id: 'api-1', x: 38, y: 25, lane: 'api', label: 'API-1' },
  { id: 'api-2', x: 38, y: 55, lane: 'api', label: 'API-2' },
  { id: 'api-3', x: 38, y: 80, lane: 'api', label: 'API-3' },
  { id: 'queue-1', x: 62, y: 35, lane: 'queue', label: 'MQ' },
  { id: 'queue-2', x: 62, y: 70, lane: 'queue', label: 'WORKER' },
  { id: 'db-1', x: 88, y: 30, lane: 'db', label: 'DB-M' },
  { id: 'db-2', x: 88, y: 65, lane: 'db', label: 'DB-R' },
]

export const tacticalEdges: TacticalEdge[] = [
  { from: 'lb', to: 'gw-1' },
  { from: 'lb', to: 'gw-2' },
  { from: 'gw-1', to: 'api-1' },
  { from: 'gw-1', to: 'api-2' },
  { from: 'gw-2', to: 'api-2' },
  { from: 'gw-2', to: 'api-3' },
  { from: 'api-1', to: 'queue-1' },
  { from: 'api-2', to: 'queue-1' },
  { from: 'api-3', to: 'queue-2' },
  { from: 'queue-1', to: 'db-1' },
  { from: 'queue-2', to: 'db-1' },
  { from: 'db-1', to: 'db-2' },
]
