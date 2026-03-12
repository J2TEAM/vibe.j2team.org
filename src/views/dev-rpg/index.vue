<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body px-4 py-12">
    <div class="max-w-5xl mx-auto">
      <!-- Back link -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary mb-10 animate-fade-up"
      >
        &larr; Back to home
      </RouterLink>

      <!-- Header -->
      <div class="text-center mb-10 animate-fade-up animate-delay-1">
        <div
          class="inline-block bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 mb-6"
        >
          VOL.01 / 2026
        </div>
        <h1
          class="font-display text-7xl md:text-8xl font-bold tracking-tight text-accent-coral mb-4"
        >
          ⚔️ Dev RPG
        </h1>
        <p class="text-text-secondary text-lg max-w-md mx-auto">
          Nhập tên để vén màn nhân vật RPG lập trình của bạn
        </p>
      </div>

      <!-- Dot divider -->
      <div class="flex gap-1.5 justify-center mb-10 animate-fade-up animate-delay-2">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <!-- Input -->
      <div class="flex max-w-lg mx-auto mb-12 animate-fade-up animate-delay-2">
        <input
          v-model="nameInput"
          placeholder="Nhập tên ngươi vào đây..."
          maxlength="30"
          @keydown.enter="generateCard"
          class="flex-1 bg-bg-surface border border-border-default px-5 py-3 text-text-primary text-base outline-none transition focus:border-accent-coral placeholder:text-text-dim font-body"
        />
        <button
          @click="generateCard"
          class="bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-widest px-6 py-3 transition hover:bg-accent-amber whitespace-nowrap"
        >
          TRIỆU HỒI
        </button>
      </div>

      <!-- Card -->
      <transition name="card-fade">
        <div v-if="card" class="max-w-2xl mx-auto">
          <!-- Rarity + Name -->
          <div
            class="border border-border-default bg-bg-surface p-6 mb-1 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <span
              class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
              >RPG</span
            >
            <div class="flex items-start justify-between gap-4">
              <div>
                <span
                  class="font-display text-xs tracking-widest px-2 py-0.5 border mr-3"
                  :class="rarityStyle(card.rarity.label)"
                >
                  {{ card.rarity.label }}
                </span>
                <span class="font-display text-xs tracking-widest text-text-dim"
                  >LV.{{ card.level }}</span
                >
                <h2 class="font-display text-4xl font-bold text-text-primary mt-2">
                  {{ card.name }}
                </h2>
                <p class="text-accent-amber font-display text-sm font-semibold tracking-wide mt-1">
                  {{ card.cls.emoji }} {{ card.cls.name }}
                </p>
                <p class="text-text-dim text-xs mt-1 font-display tracking-widest">
                  // {{ card.title }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <div class="font-display text-xs text-text-dim">HP</div>
                <div class="font-display text-xl font-bold text-accent-coral">{{ card.hp }}</div>
                <div class="font-display text-xs text-text-dim mt-1">MP</div>
                <div class="font-display text-xl font-bold text-accent-sky">{{ card.mp }}</div>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div
            class="border border-border-default border-t-0 bg-bg-surface p-6 mb-1 transition-all duration-300 hover:bg-bg-elevated"
          >
            <h3
              class="font-display text-sm tracking-widest text-accent-coral mb-4 flex items-center gap-3"
            >
              <span class="text-accent-coral">// </span>CHỈ SỐ
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <div v-for="s in card.stats" :key="s.name" class="flex items-center gap-3">
                <span class="text-base shrink-0">{{ s.icon }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs text-text-secondary font-display tracking-wide truncate">{{
                      s.name
                    }}</span>
                    <span class="text-xs font-display font-bold text-text-primary ml-2 shrink-0">{{
                      s.val
                    }}</span>
                  </div>
                  <div class="h-1 bg-bg-elevated">
                    <div
                      class="h-full transition-all duration-700"
                      :style="{ width: barsAnimated ? s.val + '%' : '0%', background: s.color }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div
            class="border border-border-default border-t-0 bg-bg-surface p-6 mb-1 transition-all duration-300 hover:bg-bg-elevated"
          >
            <h3
              class="font-display text-sm tracking-widest text-accent-amber mb-4 flex items-center gap-3"
            >
              <span>// </span>KỸ NĂNG
            </h3>
            <div class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="(sk, i) in card.skills"
                :key="sk"
                class="font-display text-xs tracking-wide px-3 py-1 border transition"
                :class="
                  i === 0
                    ? 'border-accent-coral text-accent-coral bg-accent-coral/10'
                    : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-accent-amber'
                "
              >
                {{ sk }}
              </span>
            </div>
            <div class="border-l-4 border-accent-amber/50 pl-4 bg-accent-amber/5 py-2">
              <p class="font-display text-xs tracking-widest text-accent-amber mb-1">⚠ BỊ ĐỘNG</p>
              <p class="text-text-secondary text-sm italic">{{ card.passive }}</p>
            </div>
          </div>

          <!-- Lore -->
          <div
            class="border border-border-default border-t-0 bg-bg-surface p-6 mb-1 transition-all duration-300 hover:bg-bg-elevated"
          >
            <h3
              class="font-display text-sm tracking-widest text-accent-sky mb-3 flex items-center gap-3"
            >
              <span>// </span>LORE
            </h3>
            <p class="text-text-secondary text-sm italic leading-relaxed">"{{ card.lore }}"</p>
          </div>

          <!-- Share -->
          <button
            @click="shareCard"
            class="w-full border border-border-default bg-bg-surface px-6 py-3 font-display text-sm tracking-widest text-text-secondary transition hover:border-accent-coral hover:text-accent-coral mt-1"
          >
            {{ copied ? '✅ ĐÃ SAO CHÉP — ĐI KHOE ĐI!' : '📜 SAO CHÉP KẾT QUẢ ĐỂ KHOE' }}
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const CLASSES = [
  { name: 'Intern Hoang Mang', emoji: '😵' },
  { name: 'Junior Ngộ Nhận', emoji: '🌱' },
  { name: 'Trainee Vô Định', emoji: '🐣' },
  { name: 'Fresher Ảo Tưởng Sức Mạnh', emoji: '💫' },
  { name: 'Bug Hunter Bất Tử', emoji: '🐛' },
  { name: 'Fullstack Ảo Tưởng', emoji: '🔮' },
  { name: 'CSS Chiến Binh', emoji: '🎨' },
  { name: 'Stack Overflow Pháp Sư', emoji: '🧙' },
  { name: 'Console.log Đạo Sĩ', emoji: '📜' },
  { name: 'Deadline Samurai', emoji: '⚔️' },
  { name: 'Dark Mode Hiệp Sĩ', emoji: '🌙' },
  { name: 'npm install Hành Giả', emoji: '📦' },
  { name: 'Comment Hóa Thạch', emoji: '💀' },
  { name: 'Regex Pháp Sư Điên', emoji: '🌀' },
  { name: 'Copy-Paste Thần Tốc', emoji: '⚡' },
  { name: 'Meeting Chống Đỡ Cao Thủ', emoji: '🛡️' },
  { name: 'Localhost Nhà Tu Hành', emoji: '🏠' },
  { name: 'Git Rebase Liều Mạng', emoji: '🌿' },
  { name: 'Async/Await Thần Nông', emoji: '⏳' },
  { name: 'PR Chờ Review Mãi Mãi', emoji: '👻' },
  { name: 'Sprint Planning Nạn Nhân', emoji: '📋' },
  { name: 'Docker Thần Bí', emoji: '🐳' },
  { name: 'TypeScript Tín Đồ', emoji: '📐' },
  { name: 'Vim Kẻ Lạc Đường', emoji: '🗡️' },
  { name: 'AI Prompt Engineer Thời Đại', emoji: '🤖' },
  { name: 'JIRA Ticket Farmer', emoji: '🌾' },
  { name: 'Senior Huyền Thoại', emoji: '👑' },
  { name: 'Architect Ảo', emoji: '🏛️' },
  { name: '10x Developer Tự Phong', emoji: '💎' },
  { name: 'Tech Lead Kiêm Trị Liệu Viên', emoji: '🩺' },
  { name: 'CTO Tương Lai Xa Vời', emoji: '🚀' },
  { name: 'Blockchain Nhầm Đường', emoji: '⛓️' },
  { name: 'Indie Hacker Cô Đơn', emoji: '🏝️' },
  { name: 'Burnout Warrior', emoji: '🔥' },
  { name: 'No-Code Hero Dỏm', emoji: '🪄' },
]

const TITLES = [
  'Kẻ Chạy Deadline',
  'Người Gánh Team',
  'Thức Khuya Coder',
  'Tab Collector',
  'Sát Thủ Semicolon',
  'Kẻ Copy Paste',
  'Vua Squiggly Line',
  'Chiến Thần Gg Bro',
  'Thám Tử Stack Trace',
  'Bậc Thầy Ctrl+Z',
  'Works On My Machine',
  'Nghệ Nhân TODO Comment',
  'Kẻ Không Viết Test',
  'PR Chưa Merge Bao Giờ',
  'Người Xóa Node_Modules',
  'Kẻ Rebase Sai Nhánh',
  'Bậc Thầy Force Push',
  'Chuyên Gia Hotfix',
  'Ẩn Sĩ Localhost',
  'Thiền Sư Dark Mode',
  'Thánh Ngủ Họp',
  'Kẻ Mở 50 Tabs',
  'Bộ Trưởng Viện Cớ',
  'Kẻ Ghét Estimate',
  'Bậc Thầy Blame Git',
  'Hoàng Tử StackOverflow',
  'Thánh npm install',
  'Kẻ Sợ Production',
  'Chiến Thần Friday Deploy',
  'Thần Tài Tech Debt',
  'Hiệp Sĩ Legacy Code',
  'Đại Sư Cắt Cúp Scope',
  'Nhà Tiên Tri Timeout',
]

const ALL_STAT_POOLS = [
  [
    { name: 'Bug Resistance', icon: '🛡️', color: '#4CAF50' },
    { name: 'Stack Overflow IQ', icon: '📚', color: '#FFB830' },
    { name: 'Coffee Dep.', icon: '☕', color: '#795548' },
    { name: 'Deadline Courage', icon: '⏰', color: '#FF6B4A' },
    { name: 'Dark Mode Zen', icon: '🌙', color: '#38BDF8' },
    { name: 'Tab vs Space', icon: '⚡', color: '#FFB830' },
  ],
  [
    { name: 'Meeting Endurance', icon: '😴', color: '#9C27B0' },
    { name: 'Blame Dodge', icon: '🤸', color: '#4CAF50' },
    { name: 'Scope Creep Resist', icon: '🧱', color: '#8B9DB5' },
    { name: 'Imposter Syndrome', icon: '😰', color: '#FF6B4A' },
    { name: 'Google Fu', icon: '🔍', color: '#38BDF8' },
    { name: 'Salary Negotiation', icon: '💰', color: '#FFB830' },
  ],
  [
    { name: 'Git Wizardry', icon: '🌿', color: '#4CAF50' },
    { name: 'Docker Luck', icon: '🐳', color: '#38BDF8' },
    { name: 'CI/CD Patience', icon: '⚙️', color: '#8B9DB5' },
    { name: 'Regex Mastery', icon: '🌀', color: '#9C27B0' },
    { name: 'Deploy Fear', icon: '😱', color: '#FF6B4A' },
    { name: 'Env Var Paranoia', icon: '🔑', color: '#FFB830' },
  ],
  [
    { name: 'PR Description', icon: '📝', color: '#38BDF8' },
    { name: 'Code Review Cruelty', icon: '🗡️', color: '#FF6B4A' },
    { name: 'Tech Debt Tolerance', icon: '💸', color: '#FFB830' },
    { name: 'Async Brain', icon: '🧠', color: '#9C27B0' },
    { name: 'Rubber Duck Power', icon: '🦆', color: '#FFB830' },
    { name: 'Friday Bravery', icon: '🎲', color: '#FF6B4A' },
  ],
]

const SKILLS_ALL = [
  'Ctrl+C Ctrl+V ✦',
  'Blame Git Log',
  'Chạy Được Là Được',
  'Giả Vờ Bận',
  'Mở 40+ Tabs',
  'Works On My Machine',
  'Vô Hiệu Hóa Linting',
  'Commit Fix',
  'Để Mai Refactor',
  'Console.log Thần Chú',
  'Đọc Docs Ngầu',
  'Estimate × 3',
  'Dark Mode Tâm Linh',
  'npm audit Cầu Nguyện',
  'Đổ Lỗi Requirements',
  'rm -rf node_modules',
  'git push --force Liều Lĩnh',
  'git stash Bỏ Quên',
  'Rebase Lúc Xỉn',
  'Merge Conflict Chịu Trận',
  'Cherry-pick Ăn May',
  'Commit WIP Mãi Mãi',
  'Branch test2-final-v3',
  'Vắng Mặt Daily',
  'Mute Mic Cả Buổi',
  'Camera Off Vĩnh Viễn',
  'Slack Seen Không Rep',
  'LGTM Không Đọc PR',
  'Close Issue Không Fix',
  'Deploy Thứ Sáu 5h',
  'Hardcode Production URL',
  '.env Commit Nhầm',
  'Kill -9 Mọi Thứ',
  'Restart Để Giải Quyết',
  'Biến Tên x y z',
  'Function 500 Dòng',
  'Nested If 7 Tầng',
  'TODO 2019 Còn Đó',
  'AI Gen Không Đọc',
  'Type any Tất Cả',
  'Code Lúc 2am Sung Nhất',
  'Bug Fix Tạo Ra 3 Bug',
  'Side Project Bỏ Dở x10',
  'Tự Gọi Là Full-Stack',
  'Cache Là Kẻ Thù',
]

const PASSIVES = [
  'Mỗi khi bị hỏi tiến độ, tự động mở IDE cho có vẻ bận.',
  'Khi deploy lúc thứ Sáu, nhận buff +99 Courage và debuff -99 Wisdom.',
  'Coffee thứ 3 trong ngày kích hoạt chế độ Speed Coding.',
  'Khi bị hỏi cái này bao lâu xong, tự động nhân estimate lên x2.',
  'Mỗi lần type any trong TypeScript, mất 5 Integrity Point.',
  'Có 30% cơ hội giải quyết bug bằng cách tắt rồi bật lại.',
  'Sau 22:00, tốc độ code tăng 40% nhưng quality giảm 60%.',
  'Khi gặp legacy code của chính mình, tự động giả vờ không biết.',
  'Mỗi meeting quá 1 tiếng, tự động vào trạng thái ngủ mắt mở.',
  'Buff Flow State khi cả team offline, mất buff khi có Slack ping.',
  'Miễn dịch với yêu cầu viết unit test. Hoàn toàn.',
  'Khi nghe quick win, tự động cộng thêm 3 ngày vào estimate.',
  'Khi dùng AI gen code, mất 10 EXP nhưng tiết kiệm 2 tiếng.',
  'Mỗi lần commit final, vũ trụ cộng thêm 1 lần commit nữa.',
  'Khi bị hỏi tại sao code thế này, tự động trả lời nó chạy mà.',
  'Khi nghe chỉ thêm 1 tính năng nhỏ thôi, HP tự động giảm 20.',
  'Mỗi lần xóa node_modules, cảm thấy được thanh tẩy tâm hồn.',
  'Miễn nhiễm với mọi PR comment dưới 3 dòng.',
  'Tự động nhớ syntax Python nhưng quên mật khẩu Jira.',
  'Khả năng giải thích code của mình sau 1 tuần: 0.',
]

const LORES = [
  'Người này từng bảo code chạy là được và thực sự tin vào điều đó đến tận bây giờ.',
  'Tổ tiên truyền lại: không có bug nào không giải được bằng một lần tắt rồi bật lại.',
  'Nghe đồn người này viết TODO comment từ năm 2019. Chưa bao giờ quay lại fix.',
  'Được cho là đã mở 47 tabs Chrome mà không bị máy chết — huyền thoại đang được xác minh.',
  'Kẻ duy nhất trong team dùng vim vì thấy ngầu. Chưa thoát ra được lần nào.',
  'Người này merge main vào production lúc 17:00 thứ Sáu và coi đó là chuyện bình thường.',
  'Cha đẻ của triết lý: Nếu client không tìm ra thì không phải bug.',
  'Git history của người này là bằng chứng cho thấy con người tiến hóa ngược.',
  'Dùng AI để gen code rồi không đọc gì cả. Đã có 3 bằng chứng hình ảnh.',
  'Commit message của họ chỉ có một từ: fix. Có 47 commit như vậy trong tuần này.',
  'Đã từng thề sẽ học TypeScript đúng cách. Lời thề đó nằm trong nhánh draft chưa merge.',
  'Người này tin rằng mọi vấn đề đều giải quyết được nếu restart đủ số lần.',
  'Truyền thuyết kể rằng có một lần người này viết unit test. Không ai tin cả.',
  'Ba lần trong đời đã xóa production database. Lần thứ tư đang được lên kế hoạch.',
  'Sợ hãi nhất không phải bug, không phải deadline — mà là đọc code của chính mình 6 tháng trước.',
  'Người này có 12 side project đang dở. 11 cái bị bỏ ở bước setup môi trường.',
  'Mỗi khi senior hỏi có test chưa, người này mở file test lần đầu tiên.',
  'Năng suất cao nhất là 30 phút trước deadline. Đây là khi thiên tài thực sự tỉnh dậy.',
  'Đã đặt tên biến là data2, data3, dataFinal, dataFinalV2. Không ai can ngăn được.',
  'Trong team chỉ có người này biết legacy system hoạt động ra sao. Đây là vũ khí tối thượng.',
  'Câu thần chú trước mỗi deploy: lạy trời cho nó qua. Hiệu quả hơn unit test.',
  'Từng tự hào làm fullstack. Giờ hiểu fullstack nghĩa là fix mọi thứ khi team không ai làm.',
  'Sống sót qua 7 lần công ty pivot. Lần thứ 8 đang được sếp chuẩn bị announce.',
]

const RARITIES = [
  { label: 'COMMON', minSum: 0 },
  { label: 'RARE', minSum: 290 },
  { label: 'EPIC', minSum: 360 },
  { label: 'LEGENDARY', minSum: 430 },
  { label: 'MYTHIC', minSum: 480 },
]

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
function hashStr(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  return Math.abs(h)
}
function pickFrom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)] as T
}
function pickUniqueN<T>(arr: T[], n: number, rand: () => number): T[] {
  return [...arr].sort(() => rand() - 0.5).slice(0, n)
}
function rarityStyle(label: string) {
  const map: Record<string, string> = {
    COMMON: 'border-text-dim text-text-dim',
    RARE: 'border-accent-sky text-accent-sky',
    EPIC: 'border-accent-sky text-accent-sky bg-accent-sky/10',
    LEGENDARY: 'border-accent-amber text-accent-amber bg-accent-amber/10',
    MYTHIC: 'border-accent-coral text-accent-coral bg-accent-coral/10',
  }
  return map[label] ?? 'border-border-default text-text-secondary'
}

interface StatItem {
  name: string
  icon: string
  color: string
  val: number
}
interface CardData {
  name: string
  cls: { name: string; emoji: string }
  stats: StatItem[]
  level: number
  title: string
  skills: string[]
  passive: string
  lore: string
  hp: number
  mp: number
  rarity: { label: string; minSum: number }
}

const nameInput = ref('')
const card = ref<CardData | null>(null)
const copied = ref(false)
const barsAnimated = ref(false)

function generateCard() {
  if (!nameInput.value.trim()) return
  const raw = nameInput.value.trim()
  const seed = hashStr(raw.toLowerCase())
  const rand = seededRand(seed)

  const cls = pickFrom(CLASSES, rand)
  const statPool = pickFrom(ALL_STAT_POOLS, rand)
  const stats = statPool.map((s) => ({ ...s, val: Math.floor(rand() * 65 + 25) }))
  const level = Math.floor(rand() * 95) + 1
  const title = pickFrom(TITLES, rand)
  const skills = pickUniqueN(SKILLS_ALL, 5, rand)
  const passive = pickFrom(PASSIVES, rand)
  const lore = pickFrom(LORES, rand)
  const hp = Math.floor(rand() * 900 + 100)
  const mp = Math.floor(rand() * 400 + 50)

  const sum = stats.reduce((a: number, s: StatItem) => a + s.val, 0)
  let rarity = RARITIES[0]!
  for (const r of RARITIES) {
    if (sum >= r.minSum) rarity = r
  }

  card.value = { name: raw, cls, stats, level, title, skills, passive, lore, hp, mp, rarity }
  barsAnimated.value = false
  setTimeout(() => {
    barsAnimated.value = true
  }, 120)
}

function shareCard() {
  if (!card.value) return
  const c = card.value
  const text = `⚔️ DEV RPG — J2TEAM Vibe\n${'━'.repeat(20)}\n👤 ${c.name} [${c.rarity.label}]\n${c.cls.emoji} Class: ${c.cls.name} | Lv.${c.level}\n🏆 ${c.title}\nHP: ${c.hp} | MP: ${c.mp}\n${'━'.repeat(20)}\n💡 ${c.skills.join(' | ')}\n⚠ ${c.passive}\n${'━'.repeat(20)}\n🎮 vibe.j2team.org/dev-rpg`
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  })
}
</script>

<style scoped>
.card-fade-enter-active {
  transition:
    opacity 0.4s,
    transform 0.4s;
}
.card-fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
</style>
