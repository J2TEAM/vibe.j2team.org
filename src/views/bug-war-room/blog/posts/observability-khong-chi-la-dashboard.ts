import type { BlogPost } from '../types'

export const observabilityKhongChiLaDashboardPost: BlogPost = {
  id: 'post-observability-003',
  slug: 'observability-khong-chi-la-dashboard',
  title: 'Observability Không Chỉ Là Dashboard: Thiết Kế Tín Hiệu Đủ Để Điều Tra Sự Cố',
  excerpt: 'Nhiều đội có rất nhiều biểu đồ nhưng vẫn mất nhiều thời gian để chẩn đoán lỗi. Bài viết này hướng dẫn cách thiết kế log, metric và trace để điều tra nhanh hơn trong tình huống áp lực cao.',
  author: 'TranQui004',
  publishedAt: '2026-03-07',
  updatedAt: '2026-03-07',
  tags: ['observability', 'metrics', 'tracing'],
  readMinutes: 16,
  coverImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
  coverImageAlt: 'Dashboard giám sát hệ thống với nhiều biểu đồ vận hành',
  imageLinks: [
    {
      label: 'Unsplash - Monitoring Dashboard',
      url: 'https://unsplash.com/photos/turned-on-gray-laptop-computer-I7A_pHLcQK8',
    },
    {
      label: 'Unsplash - Site Reliability Monitoring',
      url: 'https://unsplash.com/photos/photo-of-imac-near-macbook-pro-5fNmWej4tAA',
    },
    {
      label: 'Pexels - Observability And Analytics',
      url: 'https://www.pexels.com/search/data%20dashboard/',
    },
  ],
  sections: [
    {
      heading: 'Vì sao nhiều dashboard nhưng vẫn khó điều tra',
      paragraphs: [
        'Nguyên nhân phổ biến là dữ liệu đo lường không gắn chặt với câu hỏi điều tra. Dashboard đẹp nhưng không trả lời được “lỗi bắt đầu ở đâu” hoặc “request nào bị ảnh hưởng nặng nhất”.',
        'Khi thiếu correlation giữa log, metric và trace, đội kỹ thuật phải chuyển qua lại nhiều công cụ và mất thời gian tổng hợp thủ công. Trong incident, đây là điểm nghẽn rất lớn.',
        'Một vấn đề khác là biểu đồ chỉ hiển thị dữ liệu tổng hợp theo phút hoặc theo service, trong khi sự cố thực tế thường xuất hiện ở một nhóm tenant hoặc một endpoint cụ thể.',
      ],
    },
    {
      heading: 'Thiết kế observability theo câu hỏi điều tra',
      paragraphs: [
        'Trước khi tạo dashboard, hãy liệt kê các câu hỏi team luôn cần trả lời khi có sự cố: lỗi bắt đầu từ phiên bản nào, ảnh hưởng tenant nào, có liên quan dependency ngoài hay không.',
        'Mỗi câu hỏi nên có ít nhất một nguồn tín hiệu chính và một nguồn tín hiệu đối chiếu. Ví dụ metric báo tăng lỗi, log xác nhận lỗi nghiệp vụ, trace xác định điểm nghẽn downstream.',
        'Khi thiết kế theo câu hỏi, dashboard không cần quá nhiều panel, nhưng mỗi panel đều có mục đích và giúp rút ngắn thời gian ra quyết định.',
      ],
    },
    {
      heading: 'Bộ tín hiệu tối thiểu cần có cho service quan trọng',
      paragraphs: [
        'Metric: p95/p99 latency, error rate theo endpoint, throughput theo route, và saturation tài nguyên (CPU, memory, queue length, connection pool).',
        'Log: cấu trúc JSON thống nhất, có request_id hoặc trace_id, có trường service, version, tenant, và mã lỗi nghiệp vụ.',
        'Trace: bật trace cho các đường đi quan trọng như đăng nhập, thanh toán, ghi dữ liệu. Sampling có thể giảm tải, nhưng cần luôn giữ trace cho request lỗi.',
        'Ngoài ra, với hệ thống có queue hoặc event bus, cần có thêm metric độ trễ end-to-end theo nghiệp vụ. Chỉ đo thời gian xử lý từng service riêng lẻ thường không phản ánh đúng trải nghiệm người dùng.',
      ],
    },
    {
      heading: 'Chuẩn hóa log để giảm thời gian truy vết',
      paragraphs: [
        'Áp dụng schema log chung cho toàn bộ service: timestamp, level, service, environment, request_id, trace_id, user_or_tenant_id, error_code và message chuẩn hóa.',
        'Dùng error_code ổn định theo nghiệp vụ thay vì chỉ dựa vào raw exception message. Exception message dễ đổi theo phiên bản thư viện và khó tổng hợp thống kê.',
        'Thêm trường deployment_version trong log và metric để đối chiếu nhanh lỗi với thay đổi gần nhất. Đây là tín hiệu rất hữu ích trong 30 phút đầu sau deploy.',
      ],
    },
    {
      heading: 'Cách thiết kế alert để giảm nhiễu',
      paragraphs: [
        'Alert tốt cần bám vào SLO và tác động người dùng, không chỉ dựa trên ngưỡng hạ tầng đơn lẻ. Ví dụ: error rate tăng liên tục 5 phút quan trọng hơn một đỉnh CPU ngắn.',
        'Nên dùng nhiều mức cảnh báo: warning để theo dõi sớm và critical để kích hoạt xử lý sự cố. Mỗi alert cần kèm runbook link để người trực có thể hành động ngay.',
        'Định kỳ rà soát alert nhiễu. Alert không có hành động rõ ràng nên được sửa hoặc loại bỏ để tránh mệt mỏi cảnh báo.',
        'Hạn chế alert chồng chéo cùng một nguyên nhân. Nên gom thành một alert chính có ngữ cảnh đầy đủ, thay vì để 5-6 alert nhỏ bắn cùng lúc gây nhiễu.',
      ],
    },
    {
      heading: 'Xây dashboard theo hành trình người dùng',
      paragraphs: [
        'Thay vì chỉ chia dashboard theo service, hãy có dashboard theo hành trình: đăng nhập, tạo đơn, thanh toán, đồng bộ. Cách này giúp nhận ra nhanh bước nào của user journey đang đứt.',
        'Mỗi hành trình nên có: tỷ lệ thành công, độ trễ end-to-end, phân rã theo bước chính, và liên kết trực tiếp sang trace mẫu lỗi gần nhất.',
        'Với sản phẩm nhiều tenant, thêm bộ lọc tenant hoặc nhóm khách hàng để tránh bỏ sót lỗi cục bộ chỉ xảy ra ở một phân khúc.',
      ],
    },
    {
      heading: 'Mẫu checklist cải thiện observability sau postmortem',
      paragraphs: [
        'Kiểm tra xem sự cố vừa qua có thiếu trường log nào khiến việc truy vết khó khăn. Nếu có, đưa vào backlog chuẩn hóa logging.',
        'Bổ sung dashboard theo hành trình người dùng thay vì chỉ theo service kỹ thuật. Cách này giúp đánh giá tác động kinh doanh nhanh hơn.',
        'Đảm bảo mỗi lỗi nghiêm trọng đều có ít nhất một alert sớm và một trace mẫu, để lần sau thời gian xác định nguyên nhân được rút ngắn.',
        'Kiểm tra lại runbook kèm alert: người trực có thể từ alert đi đến bước hành động trong dưới 2 phút hay chưa. Nếu chưa, cần viết lại runbook rõ hơn.',
        'Đánh giá định kỳ MTTA và MTTR theo loại sự cố để đo hiệu quả cải tiến observability qua thời gian, thay vì chỉ cảm nhận chủ quan.',
      ],
    },
  ],
}
