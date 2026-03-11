export interface Excuse {
  id: number
  // Lý do "chuyên nghiệp" để nói với sếp
  excuse: string
  // Sự thật phũ phàng đằng sau
  truth: string
  // Thể loại lý do
  category: ExcuseCategory
  // Mức thuyết phục (1-5)
  convincingLevel: number
  // Mức rủi ro bị phát hiện (1-5)
  riskLevel: number
  // Số lần tối đa dùng được trước khi sếp nghi
  maxUses: number
}

export type ExcuseCategory =
  | 'technical'
  | 'infrastructure'
  | 'process'
  | 'personal'
  | 'team'
  | 'external'
  | 'philosophical'

export const categoryLabels: Record<ExcuseCategory, string> = {
  technical: '🔧 Kỹ thuật',
  infrastructure: '🖥️ Hạ tầng',
  process: '📋 Quy trình',
  personal: '🧠 Cá nhân',
  team: '👥 Team',
  external: '🌍 Bên ngoài',
  philosophical: '🤔 Triết học',
}

export const excuses: Excuse[] = [
  // === TECHNICAL ===
  {
    id: 1,
    excuse: 'Em đang refactor lại code cho clean hơn, nên cần thêm thời gian ạ.',
    truth: 'Đang xem YouTube tutorial "10-hour lofi beats to code to" mà quên mất thời gian.',
    category: 'technical',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 5,
  },
  {
    id: 2,
    excuse: 'Code review mất nhiều thời gian hơn dự kiến vì phát hiện nhiều technical debt.',
    truth: 'Đọc code của người khác xong ngồi than thở trong group chat 2 tiếng.',
    category: 'technical',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 10,
  },
  {
    id: 3,
    excuse: 'Em đang viết unit test kỹ hơn để đảm bảo chất lượng ạ.',
    truth: 'Viết 1 test case rồi ngồi debug cái test đó 3 tiếng vì nó fail.',
    category: 'technical',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 8,
  },
  {
    id: 4,
    excuse: 'Cần nghiên cứu thêm best practices trước khi implement ạ.',
    truth: 'Đọc xong 47 bài blog Medium rồi vẫn không biết bắt đầu từ đâu.',
    category: 'technical',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 4,
  },
  {
    id: 5,
    excuse: 'Em phát hiện bug regression từ sprint trước, cần hotfix trước ạ.',
    truth: 'Bug đó do chính em tạo ra tuần trước mà giờ mới phát hiện.',
    category: 'technical',
    convincingLevel: 5,
    riskLevel: 3,
    maxUses: 3,
  },
  {
    id: 6,
    excuse: 'Thuật toán phức tạp hơn em tưởng, cần thêm thời gian nghiên cứu.',
    truth: 'Copy code từ StackOverflow nhưng không hiểu nó hoạt động thế nào.',
    category: 'technical',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 6,
  },

  // === INFRASTRUCTURE ===
  {
    id: 7,
    excuse: 'CI/CD pipeline bị lỗi từ tối hôm qua, em đang chờ DevOps fix ạ.',
    truth: 'Pipeline chạy ngon, nhưng em quên push code lên repo.',
    category: 'infrastructure',
    convincingLevel: 4,
    riskLevel: 3,
    maxUses: 3,
  },
  {
    id: 8,
    excuse: 'Server staging bị down, em không thể test được ạ.',
    truth: 'Em chưa bật VPN để connect vào staging server.',
    category: 'infrastructure',
    convincingLevel: 3,
    riskLevel: 4,
    maxUses: 2,
  },
  {
    id: 9,
    excuse: 'Docker build mất 45 phút mỗi lần, em đang tối ưu Dockerfile.',
    truth: 'Docker build 2 phút nhưng em Alt+Tab sang xem TikTok trong lúc chờ.',
    category: 'infrastructure',
    convincingLevel: 3,
    riskLevel: 2,
    maxUses: 4,
  },
  {
    id: 10,
    excuse: 'Database migration chạy lỗi, em đang rollback và fix ạ.',
    truth: 'Em quên chạy migration luôn, giờ mới nhớ ra.',
    category: 'infrastructure',
    convincingLevel: 4,
    riskLevel: 3,
    maxUses: 3,
  },
  {
    id: 11,
    excuse: 'npm install bị conflict dependencies, cần resolve từng package một.',
    truth: 'npm install xong từ sáng, giờ đang ngồi đọc Reddit r/ProgrammerHumor.',
    category: 'infrastructure',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 5,
  },

  // === PROCESS ===
  {
    id: 12,
    excuse: 'Requirement thay đổi liên tục, em cần confirm lại với BA trước khi code tiếp.',
    truth: 'Requirement rõ ràng lắm, nhưng em lười đọc document nên hỏi lại cho chắc.',
    category: 'process',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 15,
  },
  {
    id: 13,
    excuse: 'Đang chờ approval từ PO cho design mới ạ.',
    truth: 'Chưa gửi request approval, nhưng biết PO hay đi họp nên đổ thừa.',
    category: 'process',
    convincingLevel: 4,
    riskLevel: 4,
    maxUses: 3,
  },
  {
    id: 14,
    excuse: 'Sprint planning hôm qua estimate sai, task này phức tạp hơn 3 story points.',
    truth: 'Hôm planning em vote thấp vì nghĩ task dễ, giờ thì khóc thầm.',
    category: 'process',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 5,
  },
  {
    id: 15,
    excuse: 'PR bị block vì chưa có 2 approvals theo policy ạ.',
    truth: 'Chưa tạo PR, nhưng biết ai cũng bận nên lấy cớ.',
    category: 'process',
    convincingLevel: 3,
    riskLevel: 5,
    maxUses: 2,
  },

  // === PERSONAL ===
  {
    id: 16,
    excuse: 'Em bị đau đầu vì ngồi máy tính nhiều, cần nghỉ 30 phút ạ.',
    truth: '30 phút đó biến thành 3 tiếng nằm cuộn chăn xem Netflix.',
    category: 'personal',
    convincingLevel: 3,
    riskLevel: 3,
    maxUses: 4,
  },
  {
    id: 17,
    excuse: 'Máy em bị lag quá, cần restart lại toàn bộ ạ.',
    truth: 'Mở 47 tab Chrome + 3 IDE + Spotify + Discord. RAM 32GB cũng gục.',
    category: 'personal',
    convincingLevel: 3,
    riskLevel: 2,
    maxUses: 7,
  },
  {
    id: 18,
    excuse: 'Em phải đi khám bác sĩ buổi chiều nay ạ.',
    truth: 'Đi Highlands Coffee ngồi chill với bạn.',
    category: 'personal',
    convincingLevel: 2,
    riskLevel: 5,
    maxUses: 1,
  },
  {
    id: 19,
    excuse: 'Mạng nhà em chập chờn, đang chuyển sang hotspot điện thoại ạ.',
    truth: 'Mạng nhà ngon lắm. Em đang down game 50GB trên Steam.',
    category: 'personal',
    convincingLevel: 3,
    riskLevel: 2,
    maxUses: 6,
  },

  // === TEAM ===
  {
    id: 20,
    excuse: 'Đang chờ API từ team backend, họ chưa deploy ạ.',
    truth: 'Backend deploy xong từ hôm qua, em chưa đọc tin nhắn thôi.',
    category: 'team',
    convincingLevel: 5,
    riskLevel: 4,
    maxUses: 3,
  },
  {
    id: 21,
    excuse: 'Em đang pair programming với junior để mentor, nên progress hơi chậm.',
    truth: 'Junior đang mentor ngược lại em vì nó giỏi hơn.',
    category: 'team',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 8,
  },
  {
    id: 22,
    excuse: 'Team meeting kéo dài 2 tiếng, không còn thời gian code ạ.',
    truth: 'Meeting 30 phút, 1.5 tiếng còn lại ngồi chém gió trong Slack.',
    category: 'team',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 10,
  },
  {
    id: 23,
    excuse: 'Đang giúp teammate debug một issue critical ạ.',
    truth: 'Ngồi cạnh teammate xem nó debug, thi thoảng gật gù ra vẻ hiểu.',
    category: 'team',
    convincingLevel: 5,
    riskLevel: 2,
    maxUses: 6,
  },

  // === EXTERNAL ===
  {
    id: 24,
    excuse: 'Third-party API thay đổi response format, em cần update lại code.',
    truth: 'Em đọc sai documentation từ đầu, giờ mới phát hiện.',
    category: 'external',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 5,
  },
  {
    id: 25,
    excuse: 'GitHub bị outage sáng nay, em không push code được ạ.',
    truth: 'GitHub chạy ngon, em quên password Git.',
    category: 'external',
    convincingLevel: 3,
    riskLevel: 5,
    maxUses: 1,
  },
  {
    id: 26,
    excuse: 'Figma bị lag nên em không xem được design mới ạ.',
    truth: 'Figma chạy mượt, nhưng design xấu quá nên em giả vờ không thấy.',
    category: 'external',
    convincingLevel: 3,
    riskLevel: 3,
    maxUses: 3,
  },
  {
    id: 27,
    excuse: 'Khách hàng gửi feedback dài 10 trang, em cần thời gian phân tích.',
    truth: 'Feedback 3 dòng, nhưng em đọc đi đọc lại vì không hiểu khách muốn gì.',
    category: 'external',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 4,
  },

  // === PHILOSOPHICAL ===
  {
    id: 28,
    excuse: 'Em đang suy nghĩ về architecture lâu dài, không muốn tạo technical debt.',
    truth: 'Suy nghĩ 5 phút rồi lên Twitter cãi nhau về tabs vs spaces 2 tiếng.',
    category: 'philosophical',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 7,
  },
  {
    id: 29,
    excuse: '"Done" nghĩa là gì? Em muốn đảm bảo definition of done rõ ràng.',
    truth: 'Chưa bắt đầu code nhưng cần câu giờ thêm 1 ngày.',
    category: 'philosophical',
    convincingLevel: 4,
    riskLevel: 3,
    maxUses: 2,
  },
  {
    id: 30,
    excuse: 'Em nghĩ mình nên viết documentation trước khi code, theo TDD mindset.',
    truth: 'Viết 2 dòng doc rồi lạc vào rabbit hole đọc blog về "perfect documentation".',
    category: 'philosophical',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 5,
  },
  {
    id: 31,
    excuse: 'Premature optimization is the root of all evil. Em cần thời gian plan kỹ hơn.',
    truth: 'Quote Knuth để trốn việc. Thực ra chưa viết được dòng code nào.',
    category: 'philosophical',
    convincingLevel: 5,
    riskLevel: 1,
    maxUses: 3,
  },
  {
    id: 32,
    excuse: 'Em apply YAGNI principle nên loại bỏ hết feature phụ, chỉ giữ core thôi ạ.',
    truth: 'Lười code feature phụ nên viện dẫn design principle cho sang.',
    category: 'philosophical',
    convincingLevel: 4,
    riskLevel: 2,
    maxUses: 4,
  },
]
