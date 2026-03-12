export interface CommandResponse {
  // Từ khóa để match lệnh (regex pattern)
  patterns: string[]
  // Các câu trả lời ngẫu nhiên của Senior
  responses: string[]
  // Mức độ khó chịu (1-5)
  annoyanceLevel: number
  // Emoji reaction
  emoji: string
}

// Danh sách phản hồi của Senior Dev
export const commands: CommandResponse[] = [
  // === GIT ===
  {
    patterns: ['git push -f', 'git push --force', 'force push'],
    responses: [
      'Cậu bị ĐIÊN à? Force push lên production? Nguyên team sẽ mất code vì cậu đấy!',
      'Force push hả? Tôi force push cậu ra khỏi team luôn cho nhanh.',
      'Lần cuối có đứa force push, team mất 3 ngày rollback. Đứa đó giờ đang bán phở.',
      'git push --force? Hay git push --fired luôn đi cho nhanh.',
    ],
    annoyanceLevel: 5,
    emoji: '💀',
  },
  {
    patterns: ['git add .', 'git add -A', 'git add --all'],
    responses: [
      'git add . hả? Cậu có biết mình vừa add gì vào staging không? .env, node_modules, cái gì cũng quăng vào à?',
      'Thay vì git add . thì git add từng file đã review đi. Đây không phải chợ đầu mối.',
      'git add ALL? Kể cả file debug.log 500MB cậu quên xóa ấy hả?',
    ],
    annoyanceLevel: 3,
    emoji: '😤',
  },
  {
    patterns: ['git commit -m', 'git commit', 'commit'],
    responses: [
      '"fix bug" là commit message hả? Fix bug NÀO? Ở ĐÂU? Cậu viết nhật ký còn chi tiết hơn.',
      'Commit message 2 chữ? Convention đâu? Tôi đọc git log mà tưởng đang đọc tin nhắn của người yêu cũ.',
      'Nhớ viết commit message cho tử tế. 6 tháng sau cậu đọc lại "update code" thì cậu tự hiểu được không?',
      '"wip" commit hả? Work In Progress hay Wasted In Procrastination?',
    ],
    annoyanceLevel: 3,
    emoji: '📝',
  },
  {
    patterns: ['git merge', 'merge'],
    responses: [
      'Merge trước khi rebase? Cậu muốn git history trông như đường cao tốc giờ cao điểm à?',
      'Có resolve conflict chưa hay merge đại rồi deploy luôn? Tôi hỏi thật đấy.',
      'Merge xong nhớ test lại nhé. Lần trước có đứa merge xong deploy thẳng, production sập 2 tiếng.',
    ],
    annoyanceLevel: 3,
    emoji: '🔀',
  },

  // === CODE QUALITY ===
  {
    patterns: ['console.log', 'console log', 'log'],
    responses: [
      'Debug bằng console.log à? Năm 2026 rồi bạn ơi. Debugger, breakpoint nghe quen không?',
      'console.log("here"), console.log("here2"), console.log("why???")... Classic.',
      'Tôi đếm được 47 cái console.log trong PR của cậu. Cậu đang code hay đang viết nhật ký?',
      'console.log là debugger của người nghèo. Mà cậu không nghèo, cậu chỉ lười thôi.',
    ],
    annoyanceLevel: 4,
    emoji: '🪲',
  },
  {
    patterns: ['var ', 'dùng var', 'khai báo var'],
    responses: [
      'VAR?! Năm 2026 mà còn xài var? Cậu code từ thời Internet Explorer 6 à?',
      'var bị hoisting biết chưa? Dùng const/let đi, đây không phải bảo tàng JavaScript.',
      'Tôi tưởng var đã bị khai tử rồi chứ? À không, code của cậu là bảo tàng mã nguồn.',
    ],
    annoyanceLevel: 4,
    emoji: '🦕',
  },
  {
    patterns: ['any', 'type any', ': any', 'as any'],
    responses: [
      'TypeScript mà xài `any` thì code JavaScript cho rồi, đỡ tốn não.',
      '`any` là viết tắt của "Anh Ngại Yếu" (kiểu dữ liệu). Chịu khó type cho đàng hoàng.',
      'Mỗi lần cậu dùng `any`, một Senior Dev ở đâu đó trên thế giới lại rụng thêm 1 sợi tóc.',
      'as any? Tức TypeScript nói cậu sai mà cậu bảo "kệ tao"? Hay lắm.',
    ],
    annoyanceLevel: 5,
    emoji: '🔥',
  },
  {
    patterns: ['!important', 'important'],
    responses: [
      '!important? Cậu đang cãi nhau với CSS hay đang override code của cả team?',
      'Mỗi lần dùng !important, một CSS architect ở đâu đó khóc thầm.',
      '!important là vũ khí hạng nặng. Dùng nhiều quá thì stylesheet của cậu thành bãi chiến trường.',
    ],
    annoyanceLevel: 4,
    emoji: '💣',
  },

  // === TOOLS & DEPS ===
  {
    patterns: ['npm install', 'npm i', 'yarn add', 'pnpm add', 'install'],
    responses: [
      'Lại thêm một dependency nữa hả? node_modules đã to hơn cả vũ trụ rồi.',
      'npm install is-odd? Cậu không tự viết được hàm check số lẻ à? Một dòng code thôi mà!',
      'Cứ mỗi tuần cậu install thêm 10 packages. Tháng sau node_modules nặng hơn black hole.',
      'Cậu biết left-pad incident không? Đừng phụ thuộc quá nhiều vào packages bên ngoài.',
    ],
    annoyanceLevel: 3,
    emoji: '📦',
  },
  {
    patterns: ['stackoverflow', 'stack overflow', 'copy paste', 'copypaste'],
    responses: [
      'Copy từ StackOverflow mà quên bỏ chữ "answered by" ở comment à? Classic.',
      'StackOverflow là nguồn tham khảo, không phải source code chính thức của cậu.',
      'Tôi đọc PR của cậu thấy quen quen. À đúng rồi, tôi cũng đọc cái answer đó trên SO.',
    ],
    annoyanceLevel: 3,
    emoji: '📋',
  },

  // === DEPLOY & PRODUCTION ===
  {
    patterns: ['deploy', 'production', 'prod'],
    responses: [
      'Deploy thẳng lên production? Không qua staging? Cậu thích mạo hiểm nhỉ.',
      'Deploy chiều thứ 6 hả? Cậu muốn cả team OT cuối tuần à?',
      'KHÔNG ĐƯỢC DEPLOY CHIỀU THỨ 6. Đây là luật bất thành văn. Vi phạm là bị cả team nguyền rủa.',
      '"Chạy trên máy em ngon mà" — câu nói kinh điển trước khi production cháy.',
    ],
    annoyanceLevel: 5,
    emoji: '🚀',
  },
  {
    patterns: ['friday', 'thứ 6', 'thu 6', 'cuối tuần'],
    responses: [
      'Deploy chiều thứ 6? Bạn ghét gia đình bạn lắm hả? Hay muốn cả team ở lại OT?',
      'Thứ 6 là để merge docs và update README. KHÔNG PHẢI ĐỂ DEPLOY FEATURE MỚI.',
      'Rule #1: Never deploy on Friday. Rule #2: NEVER DEPLOY ON FRIDAY!',
    ],
    annoyanceLevel: 5,
    emoji: '📅',
  },

  // === MEETING & PROCESS ===
  {
    patterns: ['meeting', 'họp', 'hop', 'standup', 'daily'],
    responses: [
      'Cái meeting này lẽ ra là 1 cái email. Tôi mất 1 tiếng ngồi nghe mà tóm tắt lại 2 dòng.',
      'Daily standup 45 phút? "Stand up" chứ không phải "sit down and tell your life story".',
      'Họp xong rồi thì code đi. Đừng có "cần thêm 1 meeting nữa để clarify meeting trước".',
    ],
    annoyanceLevel: 3,
    emoji: '🗓️',
  },
  {
    patterns: ['estimate', 'ước lượng', 'bao lâu', 'mấy ngày', 'story point'],
    responses: [
      'Task này bao lâu? Cậu hỏi tôi à? Cậu code mà cậu phải tự biết chứ.',
      '3 story points? Cậu biết 3 story points của cậu bằng 13 của team khác không?',
      'Estimate 1 ngày tức là 3 ngày thực tế. Quy tắc nhân 3 kinh điển.',
      '"Chắc 2 tiếng là xong" — câu nói đánh dấu sự bắt đầu của 2 tuần debugging.',
    ],
    annoyanceLevel: 3,
    emoji: '⏱️',
  },

  // === CAREER ===
  {
    patterns: ['junior', 'fresher', 'thực tập', 'intern'],
    responses: [
      'Junior hỏi nhiều không sao, nhưng hỏi cùng 1 câu 5 lần thì có vấn đề đấy.',
      'Fresher thì nhớ: Google trước khi hỏi. StackOverflow trước khi ping Senior. Tôi không phải ChatGPT.',
      'Intern à? Chào mừng đến với ngành. Hãy nhớ: code cậu viết hôm nay, cậu sẽ ghét nó 6 tháng sau.',
    ],
    annoyanceLevel: 2,
    emoji: '🐣',
  },
  {
    patterns: ['senior', 'lên senior', 'thăng chức', 'tăng lương'],
    responses: [
      'Muốn lên Senior? Viết code mà không ai phải review lại 5 lần đi đã.',
      'Senior không phải là người code giỏi nhất. Senior là người biết cái gì KHÔNG nên code.',
      'Tăng lương? Cậu fix được cái bug production tồn tại 2 năm kia thì tôi tự tay đề xuất.',
    ],
    annoyanceLevel: 2,
    emoji: '👴',
  },

  // === MISC ===
  {
    patterns: ['help', '--help', 'giúp', 'làm sao', 'how'],
    responses: [
      'Help? RTFM. Read The... Fine Manual. Documentation có đó mà lười đọc.',
      'Trước khi hỏi "làm sao", cậu đã Google chưa? Đã đọc docs chưa? Đã thử debug chưa?',
      'Tôi giúp cậu 1 lần, cậu hỏi tôi 10 lần. Lần sau tự research đi nhé.',
    ],
    annoyanceLevel: 3,
    emoji: '📖',
  },
  {
    patterns: ['chatgpt', 'ai', 'copilot', 'gpt'],
    responses: [
      'Dùng AI viết code rồi không hiểu nó viết gì? Chúc mừng, cậu vừa tạo ra technical debt AI.',
      'ChatGPT viết code cho cậu hả? Vậy khi code bug thì cậu debug hay ChatGPT debug?',
      'AI Copilot gợi ý cậu dùng callback hell à? AI cũng có lúc sai, đừng tin mù quáng.',
      'Cậu copy code từ ChatGPT xong bảo "em tự viết"? Camera phòng họp quay hết rồi nhé.',
    ],
    annoyanceLevel: 4,
    emoji: '🤖',
  },
  {
    patterns: ['test', 'testing', 'kiểm thử', 'unit test'],
    responses: [
      '"Em test xong rồi" — F5 trình duyệt 1 lần rồi bảo test xong hả?',
      'Unit test đâu? "Chạy được là test pass" — không phải cách test đâu cậu ơi.',
      'Code coverage 5%? Cậu test có 1 happy path rồi bảo "đã test kỹ" hả?',
      'Test bằng manual à? Năm 2026 mà test bằng tay thì đi bán chè đi.',
    ],
    annoyanceLevel: 4,
    emoji: '🧪',
  },
  {
    patterns: ['deadline', 'trễ', 'chậm', 'delay', 'muộn'],
    responses: [
      'Trễ deadline? Lại do "requirement thay đổi" hay do 3 ngày đầu sprint cậu ngồi setup IDE?',
      'Deadline là DƯ ÁN LINE, không phải gợi ý. Nó quan trọng đấy.',
      '"Cần thêm 2 ngày nữa" — cậu nói câu này 3 lần rồi. 2 ngày x 3 = 6 ngày trễ.',
    ],
    annoyanceLevel: 4,
    emoji: '⏰',
  },
  {
    patterns: ['css', 'style', 'giao diện', 'ui'],
    responses: [
      'CSS cậu viết trông như mì Ý — rối bời, dính nhau, không ai muốn chạm vào.',
      'Margin top 47px? Tại sao lại 47? Cậu random số à?',
      'z-index: 99999? Cậu đang chơi ai cao hơn với browser à?',
      '!important ở mọi dòng CSS? Thôi inline style luôn đi, kết quả cũng vậy thôi.',
    ],
    annoyanceLevel: 3,
    emoji: '🎨',
  },
  {
    patterns: ['bug', 'lỗi', 'fix', 'sửa'],
    responses: [
      '"Không phải bug, đó là feature." — cậu nói câu này với khách hàng được không?',
      'Fix 1 bug, sinh ra 3 bug mới. Code của cậu là hydra à?',
      '"Máy em chạy ngon mà" — câu thần chú không bao giờ hết hạn sử dụng.',
      'Bug regression? Tức là cậu fix bug bằng cách tạo bug khác để che bug cũ à?',
    ],
    annoyanceLevel: 3,
    emoji: '🐛',
  },
]

// Phản hồi mặc định khi không match được lệnh nào
export const defaultResponses: string[] = [
  'Cậu gõ cái gì vậy? Tôi không hiểu. Mà có lẽ cậu cũng không hiểu mình đang làm gì.',
  'Command not found. Giống như motivation của cậu vào thứ 2 vậy.',
  'Lệnh gì lạ vậy? Tôi 15 năm kinh nghiệm chưa thấy ai gõ thế bao giờ.',
  'Hmm... cậu tự nghĩ ra câu này hả? Sáng tạo đấy, nhưng vô dụng.',
  'Error 404: Brain not found. Thử reboot não rồi gõ lại.',
  'Tôi không response được vì câu hỏi quá... unique. Giống code cậu vậy.',
]

// Welcome message
export const welcomeLines: string[] = [
  '╔══════════════════════════════════════════════╗',
  '║     SENIOR DEV SIMULATOR v6.6.6             ║',
  '║     "Hỏi gì cũng bị mắng" Edition          ║',
  '╚══════════════════════════════════════════════╝',
  '',
  'Chào cậu. Tôi là Senior Dev của team.',
  '15 năm kinh nghiệm. 10 năm stress. 5 năm muốn nghỉ việc.',
  '',
  'Gõ bất kỳ lệnh/câu hỏi nào, tôi sẽ "review" cho.',
  'Gõ "help" nếu cậu cần gợi ý. Mà tôi khuyên ĐỪNG.',
  '',
]
