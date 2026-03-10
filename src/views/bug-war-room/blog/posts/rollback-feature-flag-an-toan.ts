import type { BlogPost } from '../types'

export const rollbackFeatureFlagAnToanPost: BlogPost = {
  id: 'post-rollout-safety-004',
  slug: 'rollback-feature-flag-an-toan',
  title: 'Rollback Và Feature Flag An Toàn: Giảm Rủi Ro Khi Phát Hành Nhanh',
  excerpt:
    'Tốc độ phát hành cao chỉ bền vững khi có cơ chế rollback và feature flag rõ ràng. Bài viết trình bày quy trình vận hành thực tế để giảm lỗi sau triển khai.',
  author: 'TranQui004',
  publishedAt: '2026-03-07',
  updatedAt: '2026-03-07',
  tags: ['deployment', 'rollback', 'feature-flag'],
  readMinutes: 15,
  coverImageUrl:
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80',
  coverImageAlt: 'Màn hình code và pipeline triển khai phần mềm',
  imageLinks: [
    {
      label: 'Unsplash - Deployment Pipeline',
      url: 'https://unsplash.com/photos/person-using-black-laptop-computer-Hcfwew744z4',
    },
    {
      label: 'Unsplash - Continuous Delivery Workflow',
      url: 'https://unsplash.com/photos/macbook-pro-displaying-programming-source-code-pfR18JNEMv8',
    },
    {
      label: 'Pexels - CI CD Deployment Setup',
      url: 'https://www.pexels.com/search/software%20deployment/',
    },
  ],
  sections: [
    {
      heading: 'Rollback nhanh là yêu cầu bắt buộc của hệ thống phát hành liên tục',
      paragraphs: [
        'Trong môi trường triển khai nhiều lần mỗi ngày, sự cố sau deploy là điều khó tránh. Điều tạo khác biệt là khả năng quay về trạng thái an toàn trong vài phút.',
        'Nếu rollback mất nhiều bước thủ công, đội vận hành sẽ chậm phản ứng và rủi ro tác động người dùng tăng lên. Vì vậy, rollback cần được xem như một tính năng sản phẩm nội bộ.',
        'Mỗi bản phát hành nên được thiết kế với câu hỏi: nếu cần rollback trong 5 phút, chúng ta phải làm gì. Câu trả lời này cần rõ từ trước khi release, không phải chờ sự cố mới nghĩ.',
      ],
    },
    {
      heading: 'Thiết kế release để rollback được ngay từ đầu',
      paragraphs: [
        'Nguyên tắc quan trọng là thay đổi nhỏ, độc lập, và có thể tắt từng phần. Release càng lớn, rollback càng khó và càng dễ kéo theo lỗi phụ.',
        'Với thay đổi schema dữ liệu, nên theo chiến lược expand and contract: thêm cấu trúc mới tương thích ngược trước, chuyển traffic dần, sau đó mới dọn cấu trúc cũ.',
        'Không gắn nhiều thay đổi rủi ro vào cùng một release window. Khi xảy ra lỗi, bạn sẽ khó xác định thành phần nào cần rollback trước.',
      ],
    },
    {
      heading: 'Chiến lược kết hợp feature flag và rollout theo tỷ lệ',
      paragraphs: [
        'Bật tính năng theo nhóm nhỏ trước (canary): nội bộ, beta user, rồi mở rộng theo phần trăm traffic. Mỗi giai đoạn cần tiêu chí dừng rõ ràng dựa trên error rate và latency.',
        'Feature flag nên được phân loại: release flag, ops flag, experiment flag. Mỗi loại có owner và hạn sử dụng để tránh tồn tại lâu gây phức tạp code.',
        'Không nên dùng một flag cho quá nhiều logic. Flag đơn mục tiêu giúp rollback chính xác và giảm lỗi ngoài ý muốn.',
        'Khi rollout theo tỷ lệ, nên có dashboard so sánh cohort bật flag và cohort chưa bật flag. Nếu chỉ nhìn số liệu tổng, bạn dễ bỏ sót sự khác biệt quan trọng.',
      ],
    },
    {
      heading: 'Mẫu tiêu chí dừng rollout thực tế',
      paragraphs: [
        'Dừng ngay khi error rate tăng vượt baseline đã thỏa thuận, hoặc p95 latency tăng mạnh ở cohort có bật flag. Không chờ đủ 100% traffic mới đánh giá.',
        'Dừng nếu xuất hiện lỗi dữ liệu không thể tự phục hồi, dù tỉ lệ nhỏ. Đây là nhóm lỗi có chi phí hậu kiểm cao và dễ ảnh hưởng niềm tin người dùng.',
        'Dừng nếu đội on-call mất khả năng theo dõi do alert nhiễu. Khi khả năng quan sát suy giảm, rủi ro mở rộng rollout tăng lên đáng kể.',
      ],
    },
    {
      heading: 'Checklist trước và sau deploy',
      paragraphs: [
        'Trước deploy: xác nhận migration tương thích ngược, chuẩn bị lệnh rollback, kiểm tra dashboard và alert cho tính năng mới.',
        'Trong deploy: theo dõi chỉ số chính mỗi 3-5 phút, so sánh với baseline trước phát hành, và ghi lại quyết định mở rộng hoặc dừng rollout.',
        'Sau deploy: theo dõi thêm ít nhất 30-60 phút với các luồng nghiệp vụ chính, sau đó mới xác nhận kết thúc phiên theo dõi.',
        'Ngoài ra nên chuẩn bị sẵn kịch bản truyền thông nội bộ nếu phải rollback, để Product, CS và Business nhận thông tin đồng bộ cùng lúc.',
      ],
    },
    {
      heading: 'Các lỗi triển khai thường gặp cần tránh',
      paragraphs: [
        'Bỏ qua khả năng tương thích ngược của dữ liệu: service cũ và mới chạy đồng thời có thể đọc/ghi sai định dạng.',
        'Không dọn flag cũ: số lượng flag tăng nhanh làm giảm độ rõ ràng của code và tăng rủi ro cấu hình sai.',
        'Không diễn tập rollback định kỳ: đến khi có sự cố thật mới phát hiện quy trình thiếu bước hoặc thiếu quyền truy cập cần thiết.',
        'Thiếu owner rõ ràng cho từng flag: khi sự cố xảy ra, không ai chắc chắn ai có quyền quyết định tắt flag, dẫn tới chậm phản ứng.',
      ],
    },
    {
      heading: 'Nhịp review định kỳ để hệ thống rollout bền vững',
      paragraphs: [
        'Đặt lịch review hàng tuần cho các flag còn tồn tại, phân loại flag nào cần xóa ngay, flag nào cần gia hạn có lý do rõ ràng.',
        'Thống kê thời gian rollback thực tế qua các lần diễn tập hoặc sự cố thật để đánh giá mức độ sẵn sàng. Mục tiêu nên đo bằng phút, không đo bằng cảm giác.',
        'Kết hợp review kỹ thuật với review sản phẩm để đảm bảo các quyết định rollout vừa an toàn vận hành, vừa giữ tốc độ phát triển ổn định.',
      ],
    },
  ],
}
