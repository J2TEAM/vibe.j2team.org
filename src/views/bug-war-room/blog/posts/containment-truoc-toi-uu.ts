import type { BlogPost } from '../types'

export const containmentTruocToiUuPost: BlogPost = {
  id: 'post-chaos-containment-001',
  slug: 'containment-truoc-toi-uu',
  title: 'Containment Trước Tối Ưu: Cách Ổn Định Hệ Thống Khi Sự Cố Vừa Xảy Ra',
  excerpt:
    'Trong giai đoạn đầu của sự cố, mục tiêu quan trọng nhất là giới hạn phạm vi ảnh hưởng. Bài viết này cung cấp quy trình rõ ràng để đội kỹ thuật ổn định hệ thống trước khi tối ưu sâu.',
  author: 'TranQui004',
  publishedAt: '2026-03-07',
  updatedAt: '2026-03-07',
  tags: ['incident-response', 'chaos-control', 'runbook'],
  readMinutes: 15,
  coverImageUrl:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
  coverImageAlt: 'Màn hình giám sát hệ thống trong lúc xử lý sự cố production',
  imageLinks: [
    {
      label: 'Unsplash - Incident Monitoring Dashboard',
      url: 'https://unsplash.com/photos/black-flat-screen-computer-monitor-rH8O0FHFpfw',
    },
    {
      label: 'Unsplash - DevOps War Room Setup',
      url: 'https://unsplash.com/photos/turned-on-gray-laptop-computer-XJXWbfSo2f0',
    },
    {
      label: 'Pexels - Team Investigating Production Issue',
      url: 'https://www.pexels.com/search/devops%20team/',
    },
  ],
  sections: [
    {
      heading: 'Khi nào cần ưu tiên containment',
      paragraphs: [
        'Containment cần được ưu tiên ngay khi lỗi đã ảnh hưởng đến người dùng thật hoặc có dấu hiệu lan sang nhiều service. Ở thời điểm này, việc giảm tốc độ lan rộng quan trọng hơn việc xử lý triệt để nguyên nhân gốc.',
        'Nếu đội kỹ thuật can thiệp quá nhiều thành phần cùng lúc, bạn sẽ khó xác định hành động nào thực sự có hiệu quả. Cách làm an toàn là chọn một thay đổi có thể đảo ngược nhanh, quan sát kết quả, sau đó mới mở rộng bước tiếp theo.',
        'Một dấu hiệu rõ ràng cho thấy cần containment ngay là khi tỉ lệ lỗi tăng đồng thời ở nhiều endpoint, đặc biệt các endpoint liên quan đến giao dịch hoặc xác thực. Trong trường hợp này, mỗi phút chậm trễ có thể làm tăng chi phí hỗ trợ và chi phí khôi phục.',
      ],
    },
    {
      heading: 'Định nghĩa rõ mục tiêu containment để tránh xử lý lan man',
      paragraphs: [
        'Trong war room, team nên thống nhất một mục tiêu đo được: ví dụ đưa error rate về dưới 2%, hoặc giữ p95 latency dưới ngưỡng đã cam kết. Nếu không có mục tiêu đo được, team rất dễ rơi vào vòng lặp thử-sai kéo dài.',
        'Mục tiêu containment không đồng nghĩa với hệ thống đã khỏe hoàn toàn. Đây chỉ là trạng thái tạm ổn để người dùng dùng được dịch vụ cốt lõi trong khi team điều tra sâu hơn.',
        'Nên chia mục tiêu thành hai lớp: mục tiêu dịch vụ bên ngoài (user-facing) và mục tiêu nội bộ (queue lag, saturation). Khi cả hai lớp đều về ngưỡng an toàn, bạn mới nên chuyển sang pha tối ưu.',
      ],
    },
    {
      heading: 'Quy trình 15 phút đầu để giữ hệ thống ổn định',
      paragraphs: [
        'Bước 1: Tạm dừng các thay đổi rủi ro cao như deploy mới, migration chưa cần thiết, hoặc job nền tiêu tốn tài nguyên lớn. Việc này giúp loại bỏ biến động mới phát sinh.',
        'Bước 2: Xác định phạm vi ảnh hưởng theo chức năng người dùng: đăng nhập, thanh toán, truy cập dữ liệu, đồng bộ nền. Ghi nhận rõ phần nào đang lỗi và phần nào vẫn hoạt động.',
        'Bước 3: Chọn một biện pháp containment cụ thể, ví dụ tắt feature gây lỗi, giảm concurrency, hoặc chuyển sang chế độ suy giảm chức năng tạm thời. Mục tiêu là giảm ngay tỷ lệ lỗi và thời gian phản hồi.',
        'Bước 4: Cập nhật ngắn cho các bên liên quan: trạng thái hiện tại, phạm vi ảnh hưởng, và thời điểm cập nhật kế tiếp. Chu kỳ cập nhật nên đều và nhất quán, thường là 10 đến 15 phút.',
        'Bước 5: Chỉ định rõ người điều phối và người thao tác kỹ thuật. Khi một người vừa điều phối vừa sửa hệ thống, quyết định thường chậm và thiếu nhất quán.',
      ],
    },
    {
      heading: 'Playbook containment theo mức độ nghiêm trọng',
      paragraphs: [
        'Với SEV-1: ưu tiên giảm blast radius tức thời. Các hành động thường dùng là rollback phiên bản mới nhất, đóng cổng tính năng không thiết yếu, và tạm dừng xử lý bất đồng bộ gây nghẽn.',
        'Với SEV-2: có thể giữ dịch vụ ở chế độ giảm chất lượng. Ví dụ tạm ẩn một số báo cáo nặng, giảm tần suất đồng bộ nền, nhưng vẫn đảm bảo luồng chính cho người dùng hoạt động.',
        'Với SEV-3: tập trung ghi nhận tín hiệu và tạo guardrail để tránh leo thang. Đây là lúc thích hợp để thử bản vá nhỏ có thể rollback ngay nếu số liệu xấu đi.',
      ],
    },
    {
      heading: 'Các lỗi triển khai thường gặp trong giai đoạn đầu',
      paragraphs: [
        'Sai lầm đầu tiên là chạy tối ưu hiệu năng quá sớm trong khi hệ thống chưa ổn định. Tối ưu sớm thường tăng rủi ro tạo lỗi mới và làm chậm quá trình khôi phục dịch vụ.',
        'Sai lầm thứ hai là thiếu vai trò điều phối. Cần chỉ định rõ Incident Commander để quyết định thứ tự ưu tiên, tránh tình trạng nhiều người sửa cùng lúc nhưng không có kế hoạch chung.',
        'Sai lầm thứ ba là không ghi timeline. Nếu không lưu thời điểm và lý do mỗi quyết định, đội kỹ thuật sẽ khó làm postmortem chất lượng và khó cải thiện quy trình ở sự cố sau.',
        'Sai lầm thứ tư là bỏ qua kênh truyền thông với bộ phận hỗ trợ khách hàng. Khi thông tin kỹ thuật và thông tin gửi khách hàng lệch nhau, trust sẽ giảm rất nhanh dù lỗi đã được xử lý.',
      ],
    },
    {
      heading: 'Sau containment: chuyển sang điều tra nguyên nhân như thế nào',
      paragraphs: [
        'Khi các chỉ số đã ổn định ở mức chấp nhận được, đội kỹ thuật mới nên mở rộng điều tra root cause. Tại giai đoạn này, cần khóa phạm vi thay đổi để giữ tín hiệu quan sát rõ ràng.',
        'Đối với postmortem, hãy tách rõ nguyên nhân gốc và các điều kiện góp phần. Mỗi hành động cải tiến phải có owner và thời hạn cụ thể để tránh dừng ở mức ghi nhận chung chung.',
        'Một thực hành hữu ích là dựng lại timeline theo mốc 5 phút, kèm snapshot số liệu chính. Cách này giúp team thấy chính xác thời điểm quyết định nào tạo cải thiện hoặc làm tình hình xấu đi.',
      ],
    },
    {
      heading: 'Checklist cải tiến sau mỗi incident',
      paragraphs: [
        'Bổ sung runbook chứa lệnh containment chuẩn và người chịu trách nhiệm thực thi. Runbook nên có phiên bản, có ngày cập nhật, và có phần xác nhận đã diễn tập.',
        'Thiết kế alert theo tác động người dùng thay vì chỉ theo tài nguyên hạ tầng. Điều này giúp team ưu tiên đúng việc trong 15 phút đầu.',
        'Đưa tình huống vừa gặp vào buổi drill định kỳ. Khi đã luyện qua trước, tốc độ phản ứng trong sự cố thật sẽ nhanh và ít sai hơn.',
      ],
    },
  ],
}
