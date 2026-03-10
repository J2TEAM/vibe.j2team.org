<template>
  <div class="rpg-root">
    <!-- Particles -->
    <div v-for="p in particles" :key="p.id" class="particle"
      :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }" />

    <h1>⚔️ Dev RPG</h1>
    <p class="subtitle">~ Vén màn số phận lập trình của ngươi ~</p>

    <div class="input-zone">
      <input v-model="nameInput" placeholder="Nhập tên ngươi vào đây..." maxlength="30"
        @keydown.enter="generateCard" />
      <button @click="generateCard">Triệu Hồi ✨</button>
    </div>

    <transition name="card-fade">
      <div v-if="card" class="card-wrapper">
        <div class="card" :class="{ shimmer: isShimmering }">
          <!-- Header -->
          <div class="card-header">
            <div class="rarity-badge" :class="card.rarity.cls">{{ card.rarity.label }}</div>
            <div class="hero-name">{{ card.name }}</div>
            <div class="hero-class">{{ card.cls.name }}</div>
          </div>

          <!-- Portrait -->
          <div class="card-portrait">
            <div class="portrait-frame">
              <span class="portrait-emoji">{{ card.cls.emoji }}</span>
              <div class="level-badge">Lv.{{ card.level }}</div>
            </div>
            <div class="title-tag">
              <span class="tag-label">Danh hiệu</span>
              <span class="tag-value">{{ card.title }}</span>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body">
            <div class="stats-title">Chỉ Số</div>
            <div class="stats-grid">
              <div v-for="s in card.stats" :key="s.name" class="stat-row">
                <span class="stat-icon">{{ s.icon }}</span>
                <div class="stat-info">
                  <div class="stat-name">{{ s.name }}</div>
                  <div class="stat-bar-wrap">
                    <div class="stat-bar" :style="{ width: barsAnimated ? s.val + '%' : '0%', background: s.color }" />
                  </div>
                </div>
                <div class="stat-val">{{ s.val }}</div>
              </div>
            </div>

            <div class="ornament-divider">✦ ✦ ✦</div>

            <div class="stats-title">Kỹ Năng</div>
            <div class="skills-wrap">
              <span v-for="(sk, i) in card.skills" :key="sk"
                class="skill-chip" :class="{ active: i === 0 }">{{ sk }}</span>
            </div>

            <div class="passive-box">
              <span class="passive-label">⚠ Bị Động Đặc Biệt</span>
              {{ card.passive }}
            </div>

            <div class="ornament-divider">✦ ✦ ✦</div>

            <div class="lore-box"><em>"{{ card.lore }}"</em></div>
          </div>

          <!-- Footer -->
          <div class="card-footer">
            <span class="footer-text">J2TEAM VIBE • DEV RPG</span>
            <div class="hp-mp">
              <span>HP: {{ card.hp }}</span>
              <span>MP: {{ card.mp }}</span>
            </div>
          </div>
        </div>

        <button class="share-btn" @click="shareCard">
          {{ copied ? '✅ Đã sao chép! Đi khoe ngay!' : '📜 Sao Chép Kết Quả Để Khoe' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ===================== DATA =====================

const CLASSES = [
  { name: "Intern Hoang Mang",             emoji: "😵", color: "#9E9E9E" },
  { name: "Junior Ngộ Nhận",               emoji: "🌱", color: "#81C784" },
  { name: "Trainee Vô Định",               emoji: "🐣", color: "#FFD54F" },
  { name: "Fresher Ảo Tưởng Sức Mạnh",    emoji: "💫", color: "#A5D6A7" },
  { name: "Bug Hunter Bất Tử",             emoji: "🐛", color: "#4CAF50" },
  { name: "Fullstack Ảo Tưởng",            emoji: "🔮", color: "#9C27B0" },
  { name: "CSS Chiến Binh",                emoji: "🎨", color: "#E91E63" },
  { name: "Stack Overflow Pháp Sư",        emoji: "🧙", color: "#FF6F00" },
  { name: "Console.log Đạo Sĩ",           emoji: "📜", color: "#0288D1" },
  { name: "Deadline Samurai",              emoji: "⚔️", color: "#C62828" },
  { name: "Dark Mode Hiệp Sĩ",            emoji: "🌙", color: "#37474F" },
  { name: "npm install Hành Giả",          emoji: "📦", color: "#795548" },
  { name: "Comment Hóa Thạch",            emoji: "💀", color: "#607D8B" },
  { name: "Regex Pháp Sư Điên",           emoji: "🌀", color: "#7B1FA2" },
  { name: "Copy-Paste Thần Tốc",          emoji: "⚡", color: "#FFC107" },
  { name: "Meeting Chống Đỡ Cao Thủ",     emoji: "🛡️", color: "#1565C0" },
  { name: "Localhost Nhà Tu Hành",         emoji: "🏠", color: "#FF8F00" },
  { name: "Git Rebase Liều Mạng",          emoji: "🌿", color: "#2E7D32" },
  { name: "Environment Variable Phù Thủy", emoji: "🔑", color: "#6A1B9A" },
  { name: "Async/Await Thần Nông",         emoji: "⏳", color: "#00838F" },
  { name: "PR Chờ Review Mãi Mãi",        emoji: "👻", color: "#78909C" },
  { name: "Sprint Planning Nạn Nhân",      emoji: "📋", color: "#D84315" },
  { name: "Docker Thần Bí",               emoji: "🐳", color: "#0277BD" },
  { name: "TypeScript Tín Đồ",            emoji: "📐", color: "#1565C0" },
  { name: "Vim Kẻ Lạc Đường",             emoji: "🗡️", color: "#558B2F" },
  { name: "Agile Scrum Master Giả Mạo",   emoji: "🏃", color: "#EF6C00" },
  { name: "AI Prompt Engineer Thời Đại",  emoji: "🤖", color: "#00695C" },
  { name: "JIRA Ticket Farmer",           emoji: "🌾", color: "#BF8C00" },
  { name: "Senior Huyền Thoại",           emoji: "👑", color: "#F9A825" },
  { name: "Architect Ảo",                 emoji: "🏛️", color: "#4527A0" },
  { name: "10x Developer Tự Phong",       emoji: "💎", color: "#00BCD4" },
  { name: "Tech Lead Kiêm Trị Liệu Viên", emoji: "🩺", color: "#C62828" },
  { name: "CTO Tương Lai Xa Vời",         emoji: "🚀", color: "#1A237E" },
  { name: "Open Source Ghost",            emoji: "👻", color: "#37474F" },
  { name: "Blockchain Nhầm Đường",        emoji: "⛓️", color: "#FF6F00" },
  { name: "Indie Hacker Cô Đơn",          emoji: "🏝️", color: "#00897B" },
  { name: "Burnout Warrior",              emoji: "🔥", color: "#B71C1C" },
]

const TITLES = [
  "Kẻ Chạy Deadline", "Người Gánh Team", "Thức Khuya Coder", "Tab Collector",
  "Sát Thủ Semicolon", "Kẻ Copy Paste", "Vua Squiggly Line", "Chiến Thần Gg Bro",
  "Thám Tử Stack Trace", "Bậc Thầy Ctrl+Z", "'Works On My Machine'", "Nghệ Nhân TODO Comment",
  "Kẻ Không Viết Test", "PR Chưa Merge Bao Giờ", "Người Xóa Node_Modules",
  "Kẻ Rebase Sai Nhánh", "Bậc Thầy Force Push", "Chuyên Gia Hotfix",
  "Ẩn Sĩ Localhost", "Thiền Sư Dark Mode", "Phật Tử Của Semicolon", "Thánh Ngủ Họp",
  "Mãng Xà Phím Tắt", "Kẻ Mở 50 Tabs", "Thần Hồn Bất Ổn", "Bộ Trưởng Viện Cớ",
  "Kẻ Ghét Estimate", "Chuyên Gia Nói Ngày Mai", "Bậc Thầy Blame Git",
  "Hoàng Tử StackOverflow", "Thánh npm install", "Kẻ Lint Vô Hiệu",
  "Đại Hiệp .gitignore", "Thánh Nhân .env", "Người Kiếm Lỗi Hàng Giờ",
  "Kẻ Đặt Tên Biến 'x'", "Chúa Tể Comment Vô Nghĩa", "Hoà Thượng Legacy Code",
  "Kẻ Sợ Production", "Thám Ma Deploy", "Chiến Thần Friday Deploy",
  "Người Đọc Docs Bằng Linh Cảm", "Nhà Tiên Tri Timeout", "Đại Sư Cắt Cúp Scope",
  "Kẻ Viết Docs Ảo", "Thần Tài Tech Debt", "Hiệp Sĩ Legacy Code",
  "Thủ Lĩnh Vô Danh Slack",
]

const ALL_STAT_POOLS = [
  [
    { name: "Bug Resistance",     icon: "🛡️", color: "#4CAF50" },
    { name: "Stack Overflow IQ",  icon: "📚", color: "#FF9800" },
    { name: "Coffee Dep.",        icon: "☕",  color: "#795548" },
    { name: "Deadline Courage",   icon: "⏰", color: "#F44336" },
    { name: "Dark Mode Zen",      icon: "🌙", color: "#3F51B5" },
    { name: "Tab vs Space",       icon: "⚡", color: "#FFEB3B" },
  ],
  [
    { name: "Meeting Endurance",  icon: "😴", color: "#9C27B0" },
    { name: "Blame Dodge",        icon: "🤸", color: "#009688" },
    { name: "Scope Creep Resist", icon: "🧱", color: "#607D8B" },
    { name: "Imposter Syndrome",  icon: "😰", color: "#E91E63" },
    { name: "Google Fu",          icon: "🔍", color: "#2196F3" },
    { name: "Salary Negotiation", icon: "💰", color: "#8BC34A" },
  ],
  [
    { name: "Git Wizardry",       icon: "🌿", color: "#2E7D32" },
    { name: "Docker Luck",        icon: "🐳", color: "#0277BD" },
    { name: "CI/CD Patience",     icon: "⚙️", color: "#546E7A" },
    { name: "Regex Mastery",      icon: "🌀", color: "#6A1B9A" },
    { name: "Deploy Fear",        icon: "😱", color: "#BF360C" },
    { name: "Env Var Paranoia",   icon: "🔑", color: "#FFA000" },
  ],
  [
    { name: "PR Description Effort", icon: "📝", color: "#0097A7" },
    { name: "Code Review Cruelty",   icon: "🗡️", color: "#C62828" },
    { name: "Tech Debt Tolerance",   icon: "💸", color: "#E65100" },
    { name: "Async Brain",           icon: "🧠", color: "#4527A0" },
    { name: "Rubber Duck Power",     icon: "🦆", color: "#F9A825" },
    { name: "Friday Bravery",        icon: "🎲", color: "#D81B60" },
  ],
]

const SKILLS_ALL = [
  "Ctrl+C Ctrl+V ✦", "Blame Git Log", "'Chạy Được Là Được'", "Giả Vờ Bận",
  "Mở 40+ Tabs", "'Works On My Machine'", "Vô Hiệu Hóa Linting", "Commit 'Fix'",
  "'Để Mai Refactor'", "Console.log Thần Chú", "Đọc Docs Ngầu", "Estimate × 3",
  "Dark Mode Tâm Linh", "npm audit --fix Cầu Nguyện", "Đổ Lỗi Requirements",
  "rm -rf node_modules", "git push --force Liều Lĩnh", "git stash Bỏ Quên",
  "Rebase Lúc Xỉn", "Merge Conflict Chịu Trận", "Cherry-pick Ăn May",
  "Commit 'WIP' Mãi Mãi", "Branch 'test2-final-v3'", "Vắng Mặt Daily",
  "Mute Mic Cả Buổi", "Camera Off Vĩnh Viễn", "Slack Seen Không Rep",
  "LGTM Không Đọc PR", "Close Issue Không Fix", "Deploy Thứ Sáu 5h",
  "Tắt Alert Production", "Xóa Logs Phi Tang", "Hardcode Production URL",
  ".env Commit Bởi Nhầm", "Kill -9 Mọi Thứ", "Restart Để Giải Quyết",
  "Biến Tên 'x', 'y', 'z'", "Function 500 Dòng", "Nested If 7 Tầng",
  "Magic Number Khắp Nơi", "TODO 2019 Còn Đó", "Copy Code Không Hiểu",
  "AI Gen Không Đọc", "Type 'any' Tất Cả", "Uống Cà Phê Lúc 11pm",
  "Code Lúc 2am Sung Nhất", "Bug Fix Tạo Ra 3 Bug Mới", "Đọc Hacker News Suốt Ngày",
  "Học Framework Mới Mỗi Tuần", "Side Project Bỏ Dở x10", "Tự Gọi Là Full-Stack",
  "Flex Màn Hình 3 Monitor", "Dùng Vim 'Cho Ngầu'", "Arch Linux Flex",
  "Assign Ticket Cho Người Khác", "Cache Là Kẻ Thù",
]

const PASSIVES = [
  "Mỗi khi bị hỏi tiến độ, tự động mở IDE cho có vẻ bận.",
  "Khi gặp bug lạ, HP hồi 50 nhưng mất 2 tiếng thực.",
  "Khi deploy lúc thứ Sáu, nhận buff +99 Courage và debuff -99 Wisdom.",
  "Miễn nhiễm với mọi PR comment dưới 3 dòng.",
  "Mỗi lần bị merge conflict, điện thoại tự gọi mẹ.",
  "Coffee thứ 3 trong ngày kích hoạt chế độ Speed Coding.",
  "Khi bị hỏi 'cái này bao lâu xong?', tự động nhân estimate lên x2.",
  "Khi nghe từ 'microservices', tự động sản sinh thêm 1 issue mới.",
  "Mỗi lần type 'any' trong TypeScript, mất 5 Integrity Point.",
  "Có 30% cơ hội giải quyết bug bằng cách tắt rồi bật lại.",
  "Sau 22:00, tốc độ code tăng 40% nhưng code quality giảm 60%.",
  "Khi gặp legacy code của chính mình, tự động giả vờ không biết.",
  "Mỗi meeting quá 1 tiếng, tự động vào trạng thái ngủ mắt mở.",
  "Khi bị gán ticket mới, có 40% khả năng tự động assign lại cho người khác.",
  "Buff 'Flow State' khi cả team offline, nhưng mất buff khi có Slack ping.",
  "Miễn dịch với yêu cầu viết unit test. Hoàn toàn.",
  "Khi nghe 'quick win', tự động cộng thêm 3 ngày vào estimate.",
  "Tự động nhớ syntax Python nhưng quên mật khẩu Jira.",
  "Khi dùng AI gen code, mất 10 EXP nhưng tiết kiệm 2 tiếng.",
  "Mỗi lần commit 'final', vũ trụ cộng thêm 1 lần commit nữa.",
  "Khi bị hỏi 'tại sao code thế này?', tự động trả lời 'nó chạy mà'.",
  "Khi nhận được 'LGTM' không có comment, cảm thấy nghi ngờ nhất đời.",
  "Khả năng giải thích code của người khác: 0. Của chính mình sau 1 tuần: cũng 0.",
  "Khi nghe 'chỉ thêm 1 tính năng nhỏ thôi', HP tự động giảm 20.",
  "Mỗi lần xóa node_modules, cảm thấy được thanh tẩy tâm hồn.",
]

const LORES = [
  "Người này từng bảo 'code chạy là được' và thực sự tin vào điều đó đến tận bây giờ.",
  "Tổ tiên truyền lại: không có bug nào không giải được bằng một lần tắt rồi bật lại.",
  "Nghe đồn người này viết TODO comment từ năm 2019. Chưa bao giờ quay lại fix.",
  "Được cho là đã mở 47 tabs Chrome mà không bị máy chết — huyền thoại đang được xác minh.",
  "Kẻ duy nhất trong team dùng vim vì 'thấy ngầu'. Chưa thoát ra được lần nào.",
  "Người này merge main vào production lúc 17:00 thứ Sáu và coi đó là chuyện bình thường.",
  "Cha đẻ của triết lý: 'Nếu client không tìm ra thì không phải bug'.",
  "Git history của người này là bằng chứng cho thấy con người tiến hóa ngược.",
  "Dùng AI để gen code rồi không đọc gì cả. Đã có 3 bằng chứng hình ảnh.",
  "Commit message của họ chỉ có một từ: 'fix'. Có 47 commit như vậy trong tuần này.",
  "Người ta nói khi ngươi đủ mạnh, ngươi sẽ viết docs tự nguyện. Người này chưa đủ mạnh.",
  "Triết lý sống: code không cần comment nếu viết đủ tệ để không ai dám đọc.",
  "Đã từng thề sẽ học TypeScript đúng cách. Lời thề đó đang nằm trong nhánh 'draft' chưa merge.",
  "Người này tin rằng mọi vấn đề đều giải quyết được nếu restart đủ số lần.",
  "Nghe nói đã bắt đầu học React năm 2017 và vẫn đang học đến tận bây giờ.",
  "Truyền thuyết kể rằng có một lần người này viết unit test. Không ai tin cả.",
  "Ba lần trong đời đã xóa production database. Lần thứ tư đang được lên kế hoạch.",
  "Người này từng tự tin nói 'tôi fix xong rồi' trước khi kiểm tra. Đó là câu nói cuối cùng của họ trong ngày.",
  "Sợ hãi nhất không phải bug, không phải deadline — mà là lúc phải đọc code của chính mình 6 tháng trước.",
  "Có một nhánh git tên 'fix-for-real-this-time-v7'. Câu chuyện đằng sau nó không ai muốn kể.",
  "Mỗi buổi sáng thức dậy với câu hỏi: 'build có pass không?'. Câu trả lời thường là không.",
  "Người này có 12 side project đang dở. 11 cái bị bỏ ở bước setup môi trường.",
  "Định viết blog chia sẻ kinh nghiệm từ năm ngoái. Tab draft vẫn đang mở.",
  "Mỗi khi senior hỏi 'có test chưa?', người này trả lời 'đang làm' và mở file test lần đầu tiên.",
  "Năng suất cao nhất là 30 phút trước deadline. Đây là khi thiên tài thực sự tỉnh dậy.",
  "Người này code bằng cả hai tay nhưng dùng chuột bằng tay trái để 'trông chuyên nghiệp hơn'.",
  "Từng cãi nhau 2 tiếng về tab vs space. Không nhớ bên nào thắng. Code vẫn dùng cả hai.",
  "Màn hình setup có 3 monitor nhưng chỉ dùng 1 cái để chat Slack.",
  "Đã đặt tên biến là 'data2', 'data3', 'dataFinal', 'dataFinalV2'. Không ai can ngăn được.",
  "Người này từng comment 'magic' vào một đoạn code. Đoạn code đó vẫn đang chạy production.",
  "Sống sót qua 7 lần công ty 'pivot'. Lần thứ 8 đang được sếp chuẩn bị announce.",
  "Từng tự hào làm fullstack. Bây giờ hiểu fullstack nghĩa là fix mọi thứ khi team không ai làm.",
  "Câu thần chú trước mỗi deploy: 'lạy trời cho nó qua'. Hiệu quả hơn unit test.",
  "Trong team chỉ có người này biết legacy system hoạt động ra sao. Đây là vũ khí tối thượng.",
  "Khởi nghiệp thất bại 2 lần, hiện đang là nhân viên công ty to để 'học kinh nghiệm' rồi khởi nghiệp lại.",
]

const RARITIES = [
  { label: "COMMON",    cls: "rarity-common",    minSum: 0   },
  { label: "RARE",      cls: "rarity-rare",       minSum: 290 },
  { label: "EPIC",      cls: "rarity-epic",       minSum: 360 },
  { label: "LEGENDARY", cls: "rarity-legendary",  minSum: 430 },
  { label: "✦ MYTHIC ✦",cls: "rarity-mythic",     minSum: 480 },
]

// ===================== ENGINE =====================

function seededRand(seed: number) {
  let s = seed
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}
function hashStr(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}
function pickFrom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}
function pickUniqueN<T>(arr: T[], n: number, rand: () => number): T[] {
  return [...arr].sort(() => rand() - 0.5).slice(0, n)
}

// ===================== STATE =====================

const nameInput = ref('')
const card = ref<any>(null)
const copied = ref(false)
const barsAnimated = ref(false)
const isShimmering = ref(false)

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: Math.random() * 100 + 'vw',
  delay: (Math.random() * 8) + 's',
  duration: (6 + Math.random() * 6) + 's',
}))

function generateCard() {
  if (!nameInput.value.trim()) return
  const raw = nameInput.value.trim()
  const seed = hashStr(raw.toLowerCase())
  const rand = seededRand(seed)

  const cls      = pickFrom(CLASSES, rand)
  const statPool = pickFrom(ALL_STAT_POOLS, rand)
  const stats    = statPool.map(s => ({ ...s, val: Math.floor(rand() * 65 + 25) }))
  const level    = Math.floor(rand() * 95) + 1
  const title    = pickFrom(TITLES, rand)
  const skills   = pickUniqueN(SKILLS_ALL, 5, rand)
  const passive  = pickFrom(PASSIVES, rand)
  const lore     = pickFrom(LORES, rand)
  const hp       = Math.floor(rand() * 900 + 100)
  const mp       = Math.floor(rand() * 400 + 50)

  const sum = stats.reduce((a: number, s: any) => a + s.val, 0)
  let rarity = RARITIES[0]
  for (const r of RARITIES) { if (sum >= r.minSum) rarity = r }

  card.value = { name: raw, cls, stats, level, title, skills, passive, lore, hp, mp, rarity }

  barsAnimated.value = false
  isShimmering.value = false
  setTimeout(() => { barsAnimated.value = true }, 120)
  setTimeout(() => { isShimmering.value = true }, 50)
  setTimeout(() => { isShimmering.value = false }, 900)
}

function shareCard() {
  if (!card.value) return
  const c = card.value
  const text = `⚔️ DEV RPG — Nhân vật của tôi
━━━━━━━━━━━━━━━━━━━━
👤 ${c.name} [${c.rarity.label.trim()}]
🧙 Class: ${c.cls.name} | Lv.${c.level}
🏆 Danh hiệu: ${c.title}
HP: ${c.hp} | MP: ${c.mp}
━━━━━━━━━━━━━━━━━━━━
💡 Kỹ năng: ${c.skills.join(' | ')}
⚠ Bị Động: ${c.passive}
━━━━━━━━━━━━━━━━━━━━
🎮 Thử ngay tại vibe.j2team.org`

  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=IM+Fell+English:ital@0;1&display=swap');

.rpg-root {
  min-height: 100vh;
  background: #0d0a06;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(180,120,0,.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(139,26,26,.06) 0%, transparent 40%);
  font-family: 'IM Fell English', serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.particle {
  position: fixed;
  width: 3px; height: 3px;
  background: #f5c842;
  border-radius: 50%;
  opacity: 0;
  animation: float-up 8s infinite;
  pointer-events: none;
}
@keyframes float-up {
  0%   { transform: translateY(100vh); opacity: 0; }
  10%  { opacity: .6; }
  90%  { opacity: .2; }
  100% { transform: translateY(-10vh) translateX(30px); opacity: 0; }
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem,5vw,3rem);
  color: #f5c842;
  text-align: center;
  text-shadow: 0 0 30px rgba(245,200,66,.4), 0 2px 4px rgba(0,0,0,.8);
  margin-bottom: .3rem;
}
.subtitle {
  font-style: italic;
  color: rgba(245,200,66,.6);
  text-align: center;
  font-size: 1rem;
  margin-bottom: 2rem;
  letter-spacing: .1em;
}

.input-zone {
  display: flex;
  width: 100%;
  max-width: 500px;
  margin-bottom: 2rem;
}
.input-zone input {
  flex: 1;
  padding: .9rem 1.4rem;
  background: #1a1208;
  border: 1px solid #b8860b;
  border-right: none;
  color: #f4e4bc;
  font-family: 'IM Fell English', serif;
  font-size: 1.1rem;
  outline: none;
  border-radius: 4px 0 0 4px;
  transition: border-color .2s, box-shadow .2s;
}
.input-zone input::placeholder { color: rgba(244,228,188,.3); font-style: italic; }
.input-zone input:focus { border-color: #f5c842; box-shadow: 0 0 15px rgba(245,200,66,.2); }
.input-zone button {
  padding: .9rem 1.6rem;
  background: linear-gradient(135deg, #f5c842, #b8860b);
  border: 1px solid #f5c842;
  color: #2c1a0e;
  font-family: 'Cinzel', serif;
  font-size: .9rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  transition: all .2s;
  white-space: nowrap;
}
.input-zone button:hover { background: linear-gradient(135deg, #ffe066, #f5c842); box-shadow: 0 0 20px rgba(245,200,66,.4); }
.input-zone button:active { transform: scale(.97); }

/* Card transition */
.card-fade-enter-active { transition: opacity .5s, transform .5s; }
.card-fade-enter-from   { opacity: 0; transform: translateY(20px) scale(.97); }

.card-wrapper { width: 100%; max-width: 480px; }

.card {
  background: #f4e4bc;
  border: 3px solid #b8860b;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 0 0 1px rgba(180,134,11,.3), 0 0 40px rgba(245,200,66,.15), 0 20px 60px rgba(0,0,0,.7);
  overflow: hidden;
}
.card::before, .card::after { content: '✦'; position: absolute; font-size: 1.4rem; color: #b8860b; opacity: .7; }
.card::before { top: 8px; left: 12px; }
.card::after  { bottom: 8px; right: 12px; }

@keyframes shimmer { 0%{left:-100%} 100%{left:200%} }
.card.shimmer::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
  animation: shimmer .8s ease-out;
  pointer-events: none;
}

.card-header {
  background: linear-gradient(180deg, #2c1a0e, #3d2410);
  padding: 1rem 1.5rem .8rem;
  text-align: center;
  border-bottom: 2px solid #b8860b;
}
.rarity-badge {
  display: inline-block;
  font-family: 'Cinzel', serif;
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .2em;
  padding: 2px 10px;
  border-radius: 20px;
  margin-bottom: .5rem;
  text-transform: uppercase;
}
.rarity-common   { background: #555; color: #aaa; }
.rarity-rare     { background: #1a3a8f; color: #7eb3ff; }
.rarity-epic     { background: #4a1a8f; color: #c97fff; }
.rarity-legendary{ background: linear-gradient(90deg,#8b1a1a,#b8860b); color: #f5c842; }
.rarity-mythic   { background: linear-gradient(90deg,#006060,#007a50); color: #4fffcf; animation: mythic-glow 2s ease-in-out infinite; }
@keyframes mythic-glow { 0%,100%{box-shadow:0 0 8px rgba(79,255,207,.4)} 50%{box-shadow:0 0 20px rgba(79,255,207,.8)} }

.hero-name  { font-family: 'Cinzel',serif; font-size: 1.6rem; font-weight: 900; color: #f5c842; text-shadow: 0 0 20px rgba(245,200,66,.3); }
.hero-class { font-style: italic; color: rgba(244,228,188,.7); font-size: .95rem; margin-top: 2px; }

.card-portrait {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.2rem;
  background: linear-gradient(180deg, #e8d5a3, #f4e4bc);
  border-bottom: 1px solid rgba(180,134,11,.3);
  position: relative;
}
.portrait-frame {
  width: 120px; height: 120px;
  border: 3px solid #b8860b;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle, #fff8e8, #e8d5a3);
  box-shadow: 0 0 20px rgba(180,134,11,.3);
  animation: portrait-glow 3s ease-in-out infinite;
  position: relative;
}
@keyframes portrait-glow {
  0%,100%{box-shadow:0 0 20px rgba(180,134,11,.3)}
  50%{box-shadow:0 0 35px rgba(245,200,66,.5)}
}
.portrait-emoji { font-size: 3.5rem; }
.level-badge {
  position: absolute; bottom: 0; right: -10px;
  background: #8b1a1a; border: 2px solid #f5c842; color: #f5c842;
  font-family: 'Cinzel',serif; font-weight: 700; font-size: .75rem;
  padding: 2px 8px; border-radius: 10px;
}
.title-tag {
  position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
  background: #2c1a0e; border: 1px solid #b8860b; border-radius: 4px;
  padding: .4rem .7rem; text-align: center; max-width: 110px;
}
.tag-label { font-family:'Cinzel',serif; font-size:.55rem; color:#f5c842; letter-spacing:.15em; display:block; text-transform:uppercase; }
.tag-value { font-style:italic; font-size:.78rem; color:#f4e4bc; display:block; margin-top:2px; line-height:1.2; }

.card-body   { padding: 1rem 1.4rem 1.2rem; }
.stats-title { font-family:'Cinzel',serif; font-size:.65rem; letter-spacing:.25em; text-transform:uppercase; color:#8b1a1a; text-align:center; margin-bottom:.8rem; }
.stats-title::before,.stats-title::after { content:'——'; color:#b8860b; margin:0 8px; opacity:.5; }

.stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:.5rem 1rem; margin-bottom:1rem; }
.stat-row   { display:flex; align-items:center; gap:.5rem; }
.stat-icon  { font-size:.95rem; flex-shrink:0; }
.stat-info  { flex:1; min-width:0; }
.stat-name  { font-size:.72rem; color:#2c1a0e; opacity:.7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.stat-bar-wrap { height:5px; background:rgba(44,26,14,.15); border-radius:3px; overflow:hidden; margin-top:2px; }
.stat-bar { height:100%; border-radius:3px; transition:width .8s cubic-bezier(.34,1.56,.64,1); }
.stat-val { font-family:'Cinzel',serif; font-weight:700; font-size:.85rem; color:#2c1a0e; flex-shrink:0; min-width:28px; text-align:right; }

.ornament-divider { text-align:center; color:#b8860b; font-size:.8rem; letter-spacing:.3em; opacity:.6; margin:.7rem 0; }

.skills-wrap { display:flex; flex-wrap:wrap; gap:.4rem; margin-bottom:.7rem; }
.skill-chip  { background:#2c1a0e; border:1px solid rgba(180,134,11,.5); color:#f4e4bc; font-style:italic; font-size:.78rem; padding:3px 10px; border-radius:3px; }
.skill-chip.active { border-color:#f5c842; color:#f5c842; box-shadow:0 0 8px rgba(245,200,66,.2); }

.passive-box {
  background: rgba(139,26,26,.07);
  border: 1px solid rgba(139,26,26,.25);
  border-radius: 4px;
  padding: .5rem .8rem;
  font-style: italic;
  font-size: .78rem;
  color: #8b1a1a;
  line-height: 1.4;
}
.passive-label { font-family:'Cinzel',serif; font-size:.6rem; letter-spacing:.15em; text-transform:uppercase; display:block; margin-bottom:2px; opacity:.7; }

.lore-box {
  background: rgba(44,26,14,.06);
  border: 1px solid rgba(180,134,11,.3);
  border-radius: 4px;
  padding: .7rem 1rem;
  font-style: italic;
  font-size: .85rem;
  color: #2c1a0e;
  line-height: 1.5;
  text-align: center;
  opacity: .85;
}

.card-footer {
  background: linear-gradient(180deg,#3d2410,#2c1a0e);
  padding: .6rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 2px solid #b8860b;
}
.footer-text { font-family:'Cinzel',serif; font-size:.6rem; color:rgba(245,200,66,.5); letter-spacing:.15em; }
.hp-mp { display:flex; gap:1rem; }
.hp-mp span { font-family:'Cinzel',serif; font-size:.7rem; color:#f5c842; opacity:.8; }

.share-btn {
  margin-top: 1.2rem;
  width: 100%;
  padding: .75rem;
  background: transparent;
  border: 1px solid rgba(245,200,66,.3);
  color: rgba(245,200,66,.6);
  font-family: 'Cinzel',serif;
  font-size: .8rem;
  letter-spacing: .15em;
  cursor: pointer;
  border-radius: 4px;
  transition: all .2s;
  text-transform: uppercase;
}
.share-btn:hover { border-color:#f5c842; color:#f5c842; background:rgba(245,200,66,.05); }

@media (max-width:480px) {
  .title-tag   { display: none; }
  .stats-grid  { grid-template-columns: 1fr; }
}
</style>
