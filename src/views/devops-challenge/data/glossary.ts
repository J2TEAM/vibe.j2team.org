import type { GlossaryEntry } from '../types'

export const glossary: Record<string, GlossaryEntry> = {
  throughput: {
    term: 'Throughput',
    termVi: 'Thông lượng',
    definitionVi:
      'Số lượng request mà hệ thống xử lý được trong 1 giây (req/s). Throughput cao = phục vụ nhiều người dùng cùng lúc.',
  },
  latency: {
    term: 'Latency',
    termVi: 'Độ trễ',
    definitionVi:
      'Thời gian từ lúc gửi request đến khi nhận response (tính bằng ms). Latency thấp = trang load nhanh.',
  },
  reliability: {
    term: 'Reliability',
    termVi: 'Độ tin cậy',
    definitionVi:
      'Khả năng hệ thống chạy liên tục không bị lỗi. Đo bằng % uptime: 99.9% = chỉ được sập 8.7 giờ/năm.',
  },
  scalability: {
    term: 'Scalability',
    termVi: 'Khả năng mở rộng',
    definitionVi:
      'Khả năng tăng sức mạnh hệ thống khi số lượng người dùng tăng. Có 2 loại: horizontal (thêm server) và vertical (nâng cấu hình).',
  },
  'horizontal-scaling': {
    term: 'Horizontal Scaling',
    termVi: 'Mở rộng ngang',
    definitionVi:
      'Thêm nhiều server giống nhau để chia tải. Ví dụ: từ 1 server thành 5 server. Phức tạp hơn nhưng gần như vô hạn.',
  },
  'vertical-scaling': {
    term: 'Vertical Scaling',
    termVi: 'Mở rộng dọc',
    definitionVi:
      'Nâng cấu hình 1 server (thêm RAM, CPU). Đơn giản nhưng có giới hạn vật lý, đến lúc không nâng được nữa.',
  },
  'load-balancer': {
    term: 'Load Balancer',
    termVi: 'Cân bằng tải',
    definitionVi:
      'Phân phối request đều giữa nhiều server. Như nhân viên lễ tân hướng khách vào quầy trống. Giúp không server nào bị quá tải.',
  },
  cdn: {
    term: 'CDN',
    termVi: 'Mạng phân phối nội dung',
    definitionVi:
      'Content Delivery Network — đặt bản sao website ở nhiều nơi trên thế giới. User ở Việt Nam sẽ truy cập server ở Singapore thay vì Mỹ.',
  },
  cache: {
    term: 'Cache',
    termVi: 'Bộ nhớ đệm',
    definitionVi:
      'Lưu tạm kết quả truy vấn vào bộ nhớ nhanh (RAM). Lần sau hỏi cùng câu hỏi sẽ trả lời ngay, không cần hỏi database lại.',
  },
  'message-queue': {
    term: 'Message Queue',
    termVi: 'Hàng đợi tin nhắn',
    definitionVi:
      'Hệ thống xếp hàng tác vụ để xử lý từ từ. Thay vì xử lý ngay 10,000 đơn hàng, đưa vào hàng đợi và xử lý từng cái.',
  },
  microservices: {
    term: 'Microservices',
    termVi: 'Vi dịch vụ',
    definitionVi:
      'Chia ứng dụng lớn thành nhiều service nhỏ độc lập. Mỗi service làm 1 việc. Dễ scale từng phần nhưng phức tạp vận hành.',
  },
  monolith: {
    term: 'Monolith',
    termVi: 'Kiến trúc nguyên khối',
    definitionVi:
      'Toàn bộ ứng dụng chạy trong 1 process. Đơn giản khi bắt đầu, khó scale khi lớn. Phù hợp team nhỏ, MVP.',
  },
  container: {
    term: 'Container',
    termVi: 'Container',
    definitionVi:
      'Đóng gói ứng dụng + thư viện vào 1 "hộp" cách ly. Chạy giống nhau ở mọi nơi: máy dev, server, cloud.',
  },
  kubernetes: {
    term: 'Kubernetes',
    termVi: 'Kubernetes (K8s)',
    definitionVi:
      'Hệ thống quản lý container ở quy mô lớn. Tự động restart khi crash, scale khi tải tăng, rolling update không downtime.',
  },
  docker: {
    term: 'Docker',
    termVi: 'Docker',
    definitionVi:
      'Công cụ tạo container phổ biến nhất. Viết Dockerfile mô tả cách build ứng dụng, chạy "docker run" là xong.',
  },
  'ci-cd': {
    term: 'CI/CD',
    termVi: 'Tích hợp liên tục / Triển khai liên tục',
    definitionVi:
      'CI = tự động test mỗi khi push code. CD = tự động deploy lên server khi test pass. Giảm lỗi, tăng tốc release.',
  },
  waf: {
    term: 'WAF',
    termVi: 'Tường lửa ứng dụng web',
    definitionVi:
      'Web Application Firewall — kiểm tra từng request, chặn SQL injection, XSS, DDoS. Như bảo vệ kiểm tra người vào tòa nhà.',
  },
  ddos: {
    term: 'DDoS',
    termVi: 'Tấn công từ chối dịch vụ',
    definitionVi:
      'Distributed Denial of Service — gửi hàng triệu request giả để làm server sập. Chặn bằng WAF, CDN, rate limiter.',
  },
  'sql-injection': {
    term: 'SQL Injection',
    termVi: 'Tấn công SQL Injection',
    definitionVi:
      'Chèn mã SQL độc vào form input để đánh cắp/xóa dữ liệu. Chặn bằng ORM, parameterized queries, WAF.',
  },
  xss: {
    term: 'XSS',
    termVi: 'Cross-Site Scripting',
    definitionVi:
      'Chèn JavaScript độc vào trang web để đánh cắp cookie/dữ liệu người dùng. Chặn bằng encode output, CSP headers.',
  },
  ssl: {
    term: 'SSL/TLS',
    termVi: 'Mã hóa kết nối',
    definitionVi:
      'Mã hóa dữ liệu giữa browser và server (HTTPS). Biểu tượng ổ khóa xanh trên trình duyệt. Bắt buộc cho web hiện đại.',
  },
  'rate-limiting': {
    term: 'Rate Limiting',
    termVi: 'Giới hạn tần suất',
    definitionVi:
      'Giới hạn số request từ 1 IP/user trong khoảng thời gian. Ví dụ: tối đa 100 request/phút. Chống spam, brute force.',
  },
  oauth2: {
    term: 'OAuth2',
    termVi: 'OAuth2',
    definitionVi:
      'Tiêu chuẩn xác thực cho phép "Đăng nhập bằng Google/Facebook". User không cần tạo tài khoản mới, an toàn hơn.',
  },
  jwt: {
    term: 'JWT',
    termVi: 'JSON Web Token',
    definitionVi:
      'Token mã hóa chứa thông tin user. Server tạo JWT sau khi login, client gửi kèm mỗi request. Không cần lưu session trên server.',
  },
  nosql: {
    term: 'NoSQL',
    termVi: 'NoSQL',
    definitionVi:
      'Cơ sở dữ liệu không dùng bảng/SQL truyền thống. Linh hoạt hơn, scale ngang dễ hơn. Ví dụ: MongoDB, Redis, Cassandra.',
  },
  acid: {
    term: 'ACID',
    termVi: 'ACID',
    definitionVi:
      'Atomicity, Consistency, Isolation, Durability — 4 tính chất đảm bảo giao dịch database an toàn. Ví dụ: chuyển tiền phải hoàn chỉnh hoặc không chuyển.',
  },
  sharding: {
    term: 'Sharding',
    termVi: 'Phân mảnh dữ liệu',
    definitionVi:
      'Chia dữ liệu lớn ra nhiều database server. Ví dụ: user A-M ở server 1, N-Z ở server 2. Giúp scale database ngang.',
  },
  replica: {
    term: 'Replica',
    termVi: 'Bản sao',
    definitionVi:
      'Bản sao của database/server. Read replica = bản chỉ đọc, giảm tải cho database chính. Nếu chính sập, replica lên thay.',
  },
  'api-gateway': {
    term: 'API Gateway',
    termVi: 'Cổng API',
    definitionVi:
      'Điểm vào duy nhất cho tất cả API. Xử lý auth, rate limit, routing đến đúng service. Như lễ tân tòa nhà.',
  },
  webhook: {
    term: 'Webhook',
    termVi: 'Webhook',
    definitionVi:
      'Cơ chế "gọi lại" — khi có sự kiện, hệ thống tự gửi HTTP request đến URL đã đăng ký. Ví dụ: Stripe gọi webhook khi thanh toán thành công.',
  },
  websocket: {
    term: 'WebSocket',
    termVi: 'WebSocket',
    definitionVi:
      'Kết nối 2 chiều liên tục giữa client và server. Dùng cho chat, game, live notification. Nhanh hơn HTTP polling.',
  },
  grpc: {
    term: 'gRPC',
    termVi: 'gRPC',
    definitionVi:
      'Protocol giao tiếp giữa các service, nhanh hơn REST (dùng binary thay JSON). Phổ biến trong microservices.',
  },
  'object-storage': {
    term: 'Object Storage',
    termVi: 'Lưu trữ đối tượng',
    definitionVi:
      'Lưu file dạng object (ảnh, video, backup). Scale vô hạn, rẻ. Khác với filesystem truyền thống — truy cập qua API.',
  },
  serverless: {
    term: 'Serverless',
    termVi: 'Serverless',
    definitionVi:
      'Chạy code không cần quản lý server. Cloud tự scale, tính phí theo số request. Ví dụ: AWS Lambda, Cloudflare Workers.',
  },
  orm: {
    term: 'ORM',
    termVi: 'Object-Relational Mapping',
    definitionVi:
      'Thư viện giúp thao tác database bằng code thay SQL. Ví dụ: Prisma, Sequelize, SQLAlchemy. An toàn hơn, ít SQL injection.',
  },
  'reverse-proxy': {
    term: 'Reverse Proxy',
    termVi: 'Reverse Proxy',
    definitionVi:
      'Server trung gian đứng trước backend. Nhận request từ client, chuyển tiếp đến backend phù hợp. Giúp bảo mật, cache, load balance.',
  },
  'circuit-breaker': {
    term: 'Circuit Breaker',
    termVi: 'Cầu chì (Circuit Breaker)',
    definitionVi:
      'Khi 1 service lỗi liên tục, tự động "ngắt mạch" để không lan lỗi sang service khác. Tự thử lại sau một thời gian.',
  },
}
