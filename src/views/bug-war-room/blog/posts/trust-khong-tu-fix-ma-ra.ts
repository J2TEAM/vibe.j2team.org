import type { BlogPost } from '../types'

export const trustKhongTuFixMaRaPost: BlogPost = {
  id: 'post-trust-comms-002',
  slug: 'trust-khong-tu-fix-ma-ra',
  title: 'Trust Không Tự Sinh Từ Việc Fix: Truyền Thông Sự Cố Rõ Ràng Và Có Kỷ Luật',
  excerpt:
    'Người dùng không chỉ quan tâm hệ thống đã phục hồi hay chưa, họ còn quan tâm đội vận hành đang xử lý minh bạch và có trách nhiệm hay không. Bài viết này tập trung vào cách truyền thông hiệu quả khi có sự cố.',
  author: 'TranQui004',
  publishedAt: '2026-03-07',
  updatedAt: '2026-03-07',
  tags: ['communication', 'trust', 'postmortem'],
  readMinutes: 14,
  coverImageUrl:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
  coverImageAlt: 'Đội vận hành đang họp nhanh để cập nhật trạng thái sự cố',
  imageLinks: [
    {
      label: 'Unsplash - Incident Communication Team',
      url: 'https://unsplash.com/photos/people-sitting-near-table-with-assorted-laptop-computers-QBpZGqEMsKg',
    },
    {
      label: 'Unsplash - Support And Stakeholder Updates',
      url: 'https://unsplash.com/photos/woman-writing-on-white-board-while-holding-marker-5fNmWej4tAA',
    },
    {
      label: 'Pexels - Customer Support Communication',
      url: 'https://www.pexels.com/search/customer%20support%20team/',
    },
  ],
  sections: [
    {
      heading: 'Vì sao truyền thông incident cần được xem là một phần của vận hành',
      paragraphs: [
        'Trong sự cố production, độ trễ thông tin thường tạo ra áp lực lớn không kém chính lỗi kỹ thuật. Người dùng có thể chấp nhận gián đoạn ngắn, nhưng khó chấp nhận cảm giác không được cập nhật.',
        'Một thông báo ngắn, chính xác và đúng thời điểm sẽ giảm lượng ticket trùng lặp, giúp đội kỹ thuật tập trung xử lý vấn đề trọng tâm. Điều này cải thiện cả hiệu quả vận hành và trải nghiệm người dùng.',
        'Truyền thông tốt còn giúp ban lãnh đạo và các team liên quan ra quyết định đúng nhịp, ví dụ có cần tạm dừng chiến dịch marketing, tạm khóa luồng thanh toán, hay chuẩn bị kênh hỗ trợ bổ sung hay không.',
      ],
    },
    {
      heading: 'Nguyên tắc viết thông báo: rõ, trung thực, có mốc thời gian',
      paragraphs: [
        'Rõ nghĩa là người đọc hiểu ngay họ bị ảnh hưởng hay không. Tránh câu chung chung kiểu "hệ thống đang gặp vấn đề" mà không nói rõ khu vực nào bị tác động.',
        'Trung thực nghĩa là chỉ công bố những gì đã xác nhận. Nếu chưa biết nguyên nhân, hãy nói "đang điều tra" thay vì đưa giả thuyết như kết luận.',
        'Có mốc thời gian nghĩa là luôn chốt lần cập nhật kế tiếp. Dù chưa có tiến triển lớn, việc cập nhật đúng hẹn vẫn tạo cảm giác đáng tin cậy.',
      ],
    },
    {
      heading: 'Cấu trúc thông báo nên dùng trong 30 phút đầu',
      paragraphs: [
        'Phần 1 - Trạng thái: hệ thống đang gặp lỗi ở khu vực nào, mức ảnh hưởng ra sao. Câu chữ cần cụ thể nhưng không lan man.',
        'Phần 2 - Tác động: người dùng nào bị ảnh hưởng, chức năng nào hoạt động không ổn định, và dữ liệu có rủi ro hay không.',
        'Phần 3 - Kế hoạch tiếp theo: đội kỹ thuật đang áp dụng biện pháp gì và khi nào có bản cập nhật mới. Hãy ưu tiên mốc cập nhật thay vì hứa thời gian khắc phục chưa chắc chắn.',
        'Phần 4 - Kênh theo dõi chính thức: chỉ định một trang hoặc một thread duy nhất để người dùng nắm bản cập nhật mới nhất.',
      ],
    },
    {
      heading: 'Gợi ý mẫu status page theo từng trạng thái',
      paragraphs: [
        'Investigating: "Chúng tôi đang ghi nhận lỗi ảnh hưởng đến [dịch vụ]. Đội kỹ thuật đang điều tra. Cập nhật tiếp theo lúc [hh:mm]."',
        'Identified: "Đã xác định được khu vực có vấn đề tại [thành phần]. Đang áp dụng biện pháp hạn chế ảnh hưởng."',
        'Monitoring: "Biện pháp đã triển khai, hệ thống đang ổn định dần. Tiếp tục theo dõi trước khi xác nhận phục hồi hoàn toàn."',
        'Resolved: "Sự cố đã được xử lý. Chúng tôi sẽ công bố tóm tắt nguyên nhân và hành động phòng ngừa trong bản hậu kiểm."',
      ],
    },
    {
      heading: 'Những lỗi truyền thông làm giảm trust nhanh nhất',
      paragraphs: [
        'Lỗi phổ biến đầu tiên là im lặng quá lâu do chờ thông tin đầy đủ. Khi không có thông tin chính thức, người dùng sẽ tự suy đoán và mức độ lo lắng tăng nhanh.',
        'Lỗi thứ hai là dùng ngôn ngữ kỹ thuật quá sâu cho thông báo công khai. Người dùng cuối cần thông tin tác động và bước tiếp theo, không cần toàn bộ chi tiết triển khai.',
        'Lỗi thứ ba là thay đổi thông điệp không nhất quán giữa các kênh. Cần có một nguồn cập nhật trung tâm để tránh mâu thuẫn nội dung.',
        'Lỗi thứ tư là viết ETA thiếu cơ sở. Nếu ETA đổi nhiều lần mà không giải thích, mức độ tin cậy giảm rất mạnh sau sự cố.',
      ],
    },
    {
      heading: 'Đánh giá hiệu quả truyền thông sau sự cố',
      paragraphs: [
        'Sau khi hệ thống ổn định, hãy theo dõi tỷ lệ ticket mới, tỷ lệ ticket mở lại, mức độ hài lòng hỗ trợ và phản hồi từ khách hàng trong 24 đến 72 giờ.',
        'Nếu có đăng postmortem công khai, nên đo mức độ đọc và câu hỏi phát sinh để biết phần nào vẫn chưa rõ. Kết quả này giúp nâng chất lượng thông báo cho các sự cố sau.',
        'Nên ghi nhận cả dữ liệu định tính từ team CS và team Sales, vì đây là nơi phản ánh trực tiếp mức độ lo ngại của khách hàng doanh nghiệp.',
      ],
    },
    {
      heading: 'Cách biến postmortem thành tài sản trust dài hạn',
      paragraphs: [
        'Postmortem hiệu quả cần ngắn gọn, có timeline, có nguyên nhân, có hành động phòng ngừa và có trạng thái triển khai các hành động đó.',
        'Với các hành động quan trọng, hãy cập nhật tiến độ sau 1-2 tuần để người dùng thấy cam kết cải thiện là thật, không chỉ là lời hứa sau sự cố.',
        'Khi làm tốt phần này liên tục qua nhiều sự cố, trust tăng không phải vì không có lỗi, mà vì người dùng tin rằng đội vận hành xử lý có trách nhiệm và học được từ mỗi lần lỗi.',
      ],
    },
  ],
}
