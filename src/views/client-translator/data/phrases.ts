export interface Translation {
  id: string
  client: string
  coder: string
  category: string
  keywords: string[]
}

export const translations: Translation[] = [
  // UI/UX
  {
    id: '1',
    client: 'Làm cho logo to hơn nhưng vẫn giữ sự tinh tế hiện tại.',
    coder: 'Scale 1.5x, kệ padding. Trông lố lăng kệ khách.',
    category: 'UI/UX',
    keywords: ['logo', 'to', 'tinh', 'tế', 'header', 'brand', 'bự'],
  },
  {
    id: '2',
    client: 'Chỗ này em thêm hiệu ứng bay lượn lấp lánh cho anh.',
    coder: 'Thêm CSS animation làm tuột FPS trang web còn 10. Xong.',
    category: 'UI/UX',
    keywords: ['hiệu', 'ứng', 'bay', 'lượn', 'lấp', 'lánh', 'animation', 'đẹp'],
  },
  {
    id: '3',
    client: 'Anh muốn màu đỏ nhưng nó phải mang lại cảm giác hiền hoà, thân thiện.',
    coder: 'Đỏ tươi mã #FF0000 thẳng tiến. Đau mắt người dùng ráng chịu.',
    category: 'UI/UX',
    keywords: ['màu', 'color', 'đỏ', 'xanh', 'hiền', 'hoà', 'thân', 'thiện', 'phối'],
  },
  {
    id: '4',
    client: 'Trang web nhìn nó cứ sai sai thế nào ấy.',
    coder: "Tự đi mà tìm bug giao diện, tôi không rảnh ngồi mò xem nó 'sai' ở pixels nào.",
    category: 'Feedback',
    keywords: ['trang', 'web', 'nhìn', 'sai', 'thế', 'nào', 'xấu', 'kỳ'],
  },
  {
    id: '5',
    client: 'Cái viền này làm mỏng lại một nửa pixel được không?',
    coder: 'Border: 0.5px. Trình duyệt không render được thì do màn hình khách cùi.',
    category: 'UI/UX',
    keywords: ['viền', 'border', 'mỏng', 'dày', 'pixel', 'nửa'],
  },
  // Estimation & Feature Request
  {
    id: '6',
    client: 'Tính năng này đơn giản ấy mà, chắc làm nhanh thôi nhỉ?',
    coder: 'Chuẩn bị OT xuyên 3 ngày cuối tuần vì cái đống logic hầm bà lằng ẩn bên dưới.',
    category: 'Estimation',
    keywords: ['tính', 'năng', 'đơn', 'giản', 'nhanh', 'chút', 'thôi', 'dễ', 'tí', 'chắc'],
  },
  {
    id: '7',
    client: 'Thêm cái nút nhỏ xíu ở góc kia thôi, không ảnh hưởng gì đâu.',
    coder: 'Vỡ layout cứng ngắc toàn bộ màn hình mobile. Phải refactor lại nguyên cái Component.',
    category: 'Feature Request',
    keywords: ['thêm', 'nút', 'nhỏ', 'góc', 'ảnh', 'hưởng', 'button', 'click'],
  },
  {
    id: '8',
    client: 'Anh muốn giống y hệt Shopee nhưng ngân sách 5 triệu.',
    coder: 'Tải template Bootstrap free về đổi màu cam. Xong dự án 5 củ.',
    category: 'Budget',
    keywords: ['giống', 'y', 'hệt', 'shopee', 'tiki', 'facebook', 'ngân', 'sách', 'rẻ', 'tiền'],
  },
  {
    id: '9',
    client: 'Em cứ làm đi, xong anh xem rồi góp ý sau.',
    coder: 'Tức là làm xong bỏ hết đập đi làm lại từ đầu. Chúc may mắn.',
    category: 'Process',
    keywords: ['cứ', 'làm', 'xong', 'xem', 'góp', 'ý', 'chỉnh', 'sửa', 'demo'],
  },
  {
    id: '10',
    client: 'Anh có ý tưởng này tỷ đô, em làm free rồi mình chia cổ phần 9-1.',
    coder: 'Scam dụ dev gà. Block số, kết thúc câu chuyện.',
    category: 'Startup',
    keywords: ['ý', 'tưởng', 'tỷ', 'đô', 'triệu', 'cổ', 'phần', 'chia', 'free', 'miễn', 'phí'],
  },
  {
    id: '11',
    client: 'Chỉ là một web thay đổi trạng thái thôi, 1 tuần xong không?',
    coder: 'State management chằng chịt, race condition nổ tung trời. 1 tháng chưa xong.',
    category: 'Estimation',
    keywords: ['web', 'trạng', 'thái', 'thay', 'đổi', 'tuần', 'ngày', 'thời', 'gian'],
  },
  // Tech & Performance
  {
    id: '12',
    client: 'Sao web load chậm thế em?',
    coder: 'Do mạng công ty anh cùi bắp, server em response 20ms cmnr.',
    category: 'Performance',
    keywords: ['chậm', 'load', 'lag', 'giật', 'ping', 'quay', 'đơ', 'tốc', 'độ'],
  },
  {
    id: '13',
    client: 'AI giờ thông minh lắm, tích hợp ChatGPT vào là nó tự viết content đúng không?',
    coder: 'Tích hợp API mất 1 ngày, vò đầu bứt tai xử lý prompt rác của người dùng mất 2 tháng.',
    category: 'AI/Trend',
    keywords: ['ai', 'thông', 'minh', 'chatgpt', 'tích', 'hợp', 'tự', 'động', 'viết', 'content'],
  },
  {
    id: '14',
    client: 'Bảo mật tuyệt đối nha em, không được để lọt data. Hệ thống này quan trọng.',
    coder:
      'User password xài sha-1 không muối. Database bị túm là lỗi do Devops, không phải do coder em.',
    category: 'Security',
    keywords: ['bảo', 'mật', 'tuyệt', 'đối', 'lọt', 'data', 'dữ', 'liệu', 'hack', 'an', 'toàn'],
  },
  {
    id: '15',
    client: 'Hôm qua web chạy ngon mà, sao nay vô lỗi rồi?',
    coder: 'Hỏi thằng Junior nào tối qua lén bấm deploy đè lên nhánh master kìa.',
    category: 'Bug',
    keywords: ['hôm', 'qua', 'ngon', 'lỗi', 'sao', 'bị', 'hỏng', 'chết', 'sập'],
  },
  {
    id: '16',
    client: 'Làm server chịu tải 10 triệu người dùng cùng lúc nhé.',
    coder: 'Lắp cái Nginx xài free tier AWS, khi nào có đủ 100 người dùng rồi tính tiếp hão huyền.',
    category: 'Scale',
    keywords: ['chịu', 'tải', 'triệu', 'người', 'dùng', 'cùng', 'lúc', 'ccu', 'traffic', 'quá'],
  },
  {
    id: '17',
    client: 'Em tối ưu SEO sao cho top 1 Google ngày mai là được.',
    coder: 'Gắn thẻ meta lôm côm rồi cúng ông địa, Google nó index hay không thì trời biết.',
    category: 'SEO',
    keywords: ['tối', 'ưu', 'seo', 'top', 'google', 'tìm', 'kiếm', 'lên', 'trang'],
  },
  {
    id: '18',
    client: 'Dùng Blockchain đi em, nghe nói dạo này đang hot.',
    coder: 'Lưu dữ liệu vào MongoDB rồi vẽ cái UI có chữ Web3 là lùa được Gà.',
    category: 'Hype/Trend',
    keywords: ['blockchain', 'hot', 'trend', 'crypto', 'web3', 'công', 'nghệ'],
  },
  {
    id: '19',
    client: 'Làm cái app xài cả iPhone, Android, Web mà mượt như Native nhé.',
    coder: 'Đóng cái WebView vào PWA. Chậm hay lag là do máy khách thôi.',
    category: 'Mobile',
    keywords: ['app', 'iphone', 'android', 'web', 'mượt', 'native', 'điện', 'thoại', 'ứng', 'dụng'],
  },
  // Content & Features
  {
    id: '20',
    client: 'Em thêm cho nút share Facebook, Zalo, Tiktok, Instagram, Threads, X,...',
    coder: 'Thêm một đống rác script tracking làm trang chậm đi x10 lần. Cuối cùng chả ai xài.',
    category: 'Social',
    keywords: ['share', 'facebook', 'zalo', 'chức', 'năng', 'chia', 'sẻ', 'mạng', 'xã', 'hội'],
  },
  {
    id: '21',
    client: 'Trang admin cần làm bảng thống kê với 20 loại biểu đồ nhé.',
    coder: 'Nhét iframe của Google Data Studio vào. Xong tính năng Dashboard.',
    category: 'Admin',
    keywords: ['admin', 'thống', 'kê', 'biểu', 'đồ', 'dashboard', 'báo', 'cáo', 'chart'],
  },
  {
    id: '22',
    client: 'Web mình cần tính năng thanh toán, hỗ trợ đủ thẻ quốc tế nhé.',
    coder:
      'Gắn Stripe chắp vá hoặc chuyển khoản Momo thủ công rồi ngồi chờ mail đối soát. Sợ lỗ thì đừng test.',
    category: 'Payment',
    keywords: ['thanh', 'toán', 'thẻ', 'quốc', 'tế', 'tiền', 'mua', 'hàng', 'giỏ'],
  },
  {
    id: '23',
    client: 'Người dùng đăng nhập không cần mật khẩu cho tiện.',
    coder:
      'Lưu thẳng cookie trọn đời không mã hóa. Bay account thì đổ thừa do người dùng lướt web bậy bạ.',
    category: 'Auth',
    keywords: ['đăng', 'nhập', 'mật', 'khẩu', 'login', 'password', 'tiện', 'otp'],
  },
  {
    id: '24',
    client: 'Search gì cũng phải ra nhanh tay xíu em, như Google đó.',
    coder: 'Làm cái LIKE %...% trong SQL nặng nề. Tra được 3 chữ thì CPU server quá tải 100%.',
    category: 'Search',
    keywords: ['search', 'tìm', 'kiếm', 'nhanh', 'google', 'kết', 'quả'],
  },
  {
    id: '25',
    client: 'Chức năng này không gấp, khi nào em rảnh làm cũng được.',
    coder:
      'Tức là sáng mai là Hạn chót (Deadline) đó. Đêm nay xác định dọn dẹp cày OT mọt gông nha.',
    category: 'Timeline',
    keywords: ['không', 'gấp', 'rảnh', 'khi', 'nào', 'deadline', 'thoải', 'mái', 'từ'],
  },
  {
    id: '26',
    client: 'Logo này em xuất viền trong suốt rồi gắn lên nhé.',
    coder:
      'Paint xài magic wand xóa nền lẹ, còn dính cái viền trắng cưa sừng thì do khách gửi file JPEG.',
    category: 'Assets',
    keywords: ['logo', 'trong', 'suốt', 'png', 'viền', 'nền', 'ảnh', 'hình'],
  },
  {
    id: '27',
    client: 'Giao diện không cần đẹp đâu, phần luồng nghiệp vụ chạy là được em.',
    coder:
      'Lừa đấy! Lúc demo màn hình xấu tí thì 10 lỗi backend không ai soi, nhưng 1 cái nút màu gắt là nghe chửi nguyên ngày.',
    category: 'UI/UX vs Logic',
    keywords: ['giao', 'diện', 'đẹp', 'luồng', 'nghiệp', 'vụ', 'chạy', 'backend', 'chính'],
  },
  {
    id: '28',
    client: 'Khách bên nhà báo bảo cần có công cụ soạn thảo như Word 365 ấy.',
    coder: 'Lắp cái CKEditor bản free 2015. Bấm Ctrl+V bể banh xác layout ráng chịu.',
    category: 'Editor',
    keywords: ['soạn', 'thảo', 'word', 'nhập', 'bài', 'viết', 'editor', 'đăng'],
  },
  {
    id: '29',
    client: 'Bỏ đi em, tính năng này anh suy nghĩ kĩ rồi không hợp.',
    coder:
      'Mình vừa tốn 5 ngày thức trắng để code xong. Mất bao giọt mồ hôi và tiền điện. Giờ bắt xóa nguyên một đống file.',
    category: 'Scope Creep',
    keywords: ['bỏ', 'đi', 'tính', 'năng', 'suy', 'nghĩ', 'không', 'hợp', 'cần', 'ẩn'],
  },
  {
    id: '30',
    client: 'Hôm nay launch app nhưng anh thêm xíu nhạc lúc vào màn hình cho sinh động nha em.',
    coder:
      'Thêm cái mp3 15MB bắt user tải lúc mở app, auto-play bị trình duyệt chặn, báo lỗi cả hệ thống vỡ tè le lúc 23:59.',
    category: 'Last minute',
    keywords: [
      'thêm',
      'nhạc',
      'âm',
      'thanh',
      'sinh',
      'động',
      'launch',
      'chút',
      'xíu',
      'mai',
      'demo',
    ],
  },
]
