<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import cowLv1Url from './cow_lv1.png'
import cowLv2Url from './cow_lv2.png'
import cowLv3Url from './cow_lv3.png'
import cowLv4Url from './cow_lv4.png'
import cowLv5Url from './cow_lv5.png'

type StepKey = 'market' | 'problem' | 'solution' | 'pricing' | 'channel'

type Option = {
  id: string
  title: string
  description: string
  impact: string
}

type Step = {
  key: StepKey
  marker: string
  label: string
  options: readonly [Option, ...Option[]]
}

type NonEmptyReadonlyArray<T> = readonly [T, ...T[]]

type StatKey = 'growth' | 'cash' | 'trust'

type BattleStats = Record<StatKey, number>
type ActionEffect = Record<StatKey, number>

type BattleAction = {
  id: string
  title: string
  description: string
  effect: ActionEffect
}

type BattleEvent = {
  id: string
  title: string
  description: string
  actions: readonly [BattleAction, BattleAction, BattleAction]
}

type BattleLog = {
  round: number
  eventTitle: string
  actionTitle: string
  effect: ActionEffect
}

type BattlePerk = {
  id: string
  title: string
  description: string
  bonus: ActionEffect
}

type BattleStage = {
  id: string
  title: string
  description: string
  rounds: readonly [number, ...number[]]
  eventIds: readonly [string, ...string[]]
}

type CowSender = 'user' | 'cow'

type CowChatMessage = {
  id: number
  sender: CowSender
  text: string
}

type CowMissionKey = 'phase1' | 'phase2' | 'phase3' | 'ask' | 'copy'

type BuilderPreset = {
  id: string
  title: string
  description: string
  selections: Record<StepKey, string>
}

type ConstraintKey = 'budget' | 'deadline' | 'team'

type ConstraintOption = {
  id: string
  title: string
  description: string
  impact: number
}

type ConstraintOptionsMap = Record<ConstraintKey, NonEmptyReadonlyArray<ConstraintOption>>

type SwotItem = {
  id: string
  text: string
  source: string
}

const steps = [
  {
    key: 'market',
    marker: '01',
    label: 'Chọn thị trường',
    options: [
      {
        id: 'freelancer',
        title: 'Freelancer/Creator',
        description: 'Người làm tự do cần tối ưu thời gian và dòng tiền.',
        impact: 'Tệp khách hàng đông, sẵn sàng trả cho công cụ tăng năng suất.',
      },
      {
        id: 'sme',
        title: 'SME nội địa',
        description: 'Doanh nghiệp nhỏ muốn số hóa nhanh mà không phức tạp.',
        impact: 'Bài toán thực tế, khả năng giữ chân tốt nếu onboarding mượt.',
      },
      {
        id: 'student',
        title: 'Sinh viên công nghệ',
        description: 'Nhóm người dùng thích trải nghiệm mới, lan truyền nhanh.',
        impact: 'Tăng trưởng tự nhiên tốt, phù hợp mô hình freemium.',
      },
    ],
  },
  {
    key: 'problem',
    marker: '02',
    label: 'Chốt pain point',
    options: [
      {
        id: 'planning',
        title: 'Quản lý việc rời rạc',
        description: 'Task nằm rải rác ở nhiều app, khó theo dõi tiến độ.',
        impact: 'Mất tập trung và lỡ deadline liên tục.',
      },
      {
        id: 'communication',
        title: 'Trao đổi không rõ ràng',
        description: 'Yêu cầu công việc dễ bị hiểu sai, chỉnh sửa nhiều vòng.',
        impact: 'Tăng chi phí vận hành, giảm niềm tin khách hàng.',
      },
      {
        id: 'reporting',
        title: 'Thiếu dữ liệu để quyết định',
        description: 'Không có dashboard đủ nhanh để nhìn KPI quan trọng.',
        impact: 'Ra quyết định chậm và cảm tính.',
      },
    ],
  },
  {
    key: 'solution',
    marker: '03',
    label: 'Đề xuất giải pháp',
    options: [
      {
        id: 'copilot',
        title: 'AI Copilot theo ngữ cảnh',
        description: 'Gợi ý hành động tiếp theo dựa trên lịch sử công việc.',
        impact: 'Giảm thao tác thủ công, tăng tốc độ hoàn thành task.',
      },
      {
        id: 'workflow',
        title: 'Workflow 1-click',
        description: 'Template quy trình có sẵn cho từng loại công việc.',
        impact: 'Onboarding nhanh, giảm thời gian đào tạo.',
      },
      {
        id: 'radar',
        title: 'Risk Radar',
        description: 'Cảnh báo sớm rủi ro chậm tiến độ hoặc thiếu nguồn lực.',
        impact: 'Giúp đội ngũ chủ động xử lý trước khi sự cố xảy ra.',
      },
    ],
  },
  {
    key: 'pricing',
    marker: '04',
    label: 'Mô hình giá',
    options: [
      {
        id: 'freemium',
        title: 'Freemium + Pro',
        description: 'Miễn phí cho cá nhân, mở khóa tính năng nâng cao ở gói Pro.',
        impact: 'Giảm rào cản dùng thử và nuôi funnel tự nhiên.',
      },
      {
        id: 'seat',
        title: 'Theo số ghế',
        description: 'Tính phí theo thành viên hoạt động mỗi tháng.',
        impact: 'Dễ dự đoán doanh thu khi đội ngũ khách hàng mở rộng.',
      },
      {
        id: 'usage',
        title: 'Theo mức sử dụng',
        description: 'Trả tiền theo lượt xử lý hoặc khối lượng dữ liệu.',
        impact: 'Công bằng với khách hàng có nhu cầu biến động.',
      },
    ],
  },
  {
    key: 'channel',
    marker: '05',
    label: 'Kênh tăng trưởng',
    options: [
      {
        id: 'community',
        title: 'Community-led',
        description: 'Phát triển qua workshop, group Facebook, case study cộng đồng.',
        impact: 'Niềm tin cao và lan truyền tốt qua trải nghiệm thật.',
      },
      {
        id: 'content',
        title: 'SEO + Content',
        description: 'Xây thư viện nội dung hướng dẫn và template miễn phí.',
        impact: 'Thu hút traffic bền vững với chi phí thấp hơn ads.',
      },
      {
        id: 'partnership',
        title: 'Partnership B2B',
        description: 'Hợp tác với agency, school, coworking để phân phối sản phẩm.',
        impact: 'Rút ngắn thời gian tiếp cận khách hàng trả phí.',
      },
    ],
  },
] as const satisfies readonly [Step, Step, Step, Step, Step]

const [marketStep, problemStep, solutionStep, pricingStep, channelStep] = steps

const selections = reactive<Record<StepKey, string>>({
  market: marketStep.options[0].id,
  problem: problemStep.options[0].id,
  solution: solutionStep.options[0].id,
  pricing: pricingStep.options[0].id,
  channel: channelStep.options[0].id,
})

const builderPresets: readonly BuilderPreset[] = [
  {
    id: 'lean',
    title: 'Lean Launch',
    description: 'Ra mắt nhanh, chi phí thấp, validate càng sớm càng tốt.',
    selections: {
      market: 'student',
      problem: 'planning',
      solution: 'workflow',
      pricing: 'freemium',
      channel: 'community',
    },
  },
  {
    id: 'balanced',
    title: 'Balanced Growth',
    description: 'Cân bằng giữa tốc độ tăng trưởng, doanh thu và trải nghiệm.',
    selections: {
      market: 'sme',
      problem: 'communication',
      solution: 'copilot',
      pricing: 'seat',
      channel: 'content',
    },
  },
  {
    id: 'revenue-first',
    title: 'Revenue First',
    description: 'Ưu tiên dòng tiền và khách hàng trả phí sớm.',
    selections: {
      market: 'freelancer',
      problem: 'reporting',
      solution: 'radar',
      pricing: 'usage',
      channel: 'partnership',
    },
  },
]

const constraintOptions: ConstraintOptionsMap = {
  budget: [
    {
      id: 'tight',
      title: 'Ngân sách thấp',
      description: 'Giới hạn cash, cần tập trung giải pháp gọn nhẹ.',
      impact: -8,
    },
    {
      id: 'normal',
      title: 'Ngân sách vừa',
      description: 'Có thể thử nghiệm và tối ưu dần.',
      impact: 0,
    },
    {
      id: 'strong',
      title: 'Ngân sách mạnh',
      description: 'Có dư địa đẩy growth và test nhiều kênh.',
      impact: 7,
    },
  ],
  deadline: [
    {
      id: 'rush',
      title: 'Deadline 48h',
      description: 'Tập trung core value, cắt bớt phần phụ.',
      impact: -6,
    },
    {
      id: 'normal',
      title: 'Deadline 2 tuần',
      description: 'Nhịp triển khai ổn định, đủ thời gian polish.',
      impact: 1,
    },
    {
      id: 'long',
      title: 'Deadline 1 tháng',
      description: 'Có thêm thời gian cho QA và storytelling.',
      impact: 5,
    },
  ],
  team: [
    {
      id: 'solo',
      title: 'Solo builder',
      description: 'Một người làm tất cả, cần phạm vi cực rõ.',
      impact: -7,
    },
    {
      id: 'duo',
      title: 'Team 2-3 người',
      description: 'Đủ để chia vai và ship đều.',
      impact: 2,
    },
    {
      id: 'squad',
      title: 'Team 4-5 người',
      description: 'Có thể phát triển nhanh và song song nhiều nhánh.',
      impact: 6,
    },
  ],
} as const

const activeConstraints = reactive<Record<ConstraintKey, string>>({
  budget: 'normal',
  deadline: 'normal',
  team: 'duo',
})
const phase1Confirmed = ref(false)
const phase2Confirmed = ref(false)
const phase1SectionRef = ref<HTMLElement | null>(null)
const phase2SectionRef = ref<HTMLElement | null>(null)
const phase3SectionRef = ref<HTMLElement | null>(null)

const constraintGroups: readonly {
  key: ConstraintKey
  label: string
  options: NonEmptyReadonlyArray<ConstraintOption>
}[] = [
  { key: 'budget', label: 'BUDGET', options: constraintOptions.budget },
  { key: 'deadline', label: 'DEADLINE', options: constraintOptions.deadline },
  { key: 'team', label: 'TEAM', options: constraintOptions.team },
]

const copyFeedback = ref('Sao chép one-pager')
const hypeCardFeedback = ref('Copy Hype Card')
const cowInput = ref('')
const cowMessageId = ref(1)
const cowXp = ref(0)
const cowMessages = ref<CowChatMessage[]>([
  {
    id: 1,
    sender: 'cow',
    text: 'Moo! Tôi là Bò Cố Vấn. Hỏi tôi về One-pager, pitch, hoặc chiến lược startup nhé.',
  },
])
const cowMissionStatus = reactive<Record<CowMissionKey, boolean>>({
  phase1: false,
  phase2: false,
  phase3: false,
  ask: false,
  copy: false,
})
const cowQuickPrompts: readonly [string, ...string[]] = [
  'One-pager dùng để làm gì?',
  'Pitch 30 giây của mình nên nói gì?',
  'Mô hình giá hiện tại ổn không?',
  'Mình nên ưu tiên KPI nào trong 30 ngày đầu?',
]
const sprintSeconds = ref(300)
const sprintRunning = ref(false)
let sprintTimer: ReturnType<typeof window.setInterval> | null = null
const roastLines = ref<string[]>([
  'Pitch đang chờ roast. Nhấn "Pitch Roast" để xem investor phản biện.',
])

const funTaglines: NonEmptyReadonlyArray<string> = [
  'Ship nhanh hơn deadline của chính bạn.',
  'Một startup đủ gọn để demo trước khi cà phê nguội.',
  'Từ ý tưởng đến pitch deck nhanh hơn một buổi họp dài.',
  'Build nhỏ, vibe lớn, launch không ngại.',
]

const investorMoods: NonEmptyReadonlyArray<string> = [
  'Investor gật đầu: "Có market pull, nói tiếp đi."',
  'Investor cười nhẹ: "Ý tưởng điên nhưng có thể ăn tiền."',
  'Investor hỏi xoáy: "Retention của bạn nằm ở đâu?"',
  'Investor trầm ngâm: "Nếu execution tốt thì đáng đặt cược."',
]

const chaosCards: NonEmptyReadonlyArray<string> = [
  'Plot twist: Đối thủ vừa copy ý tưởng, bạn có 24h để khác biệt.',
  'Lucky break: Một KOL ngẫu nhiên share sản phẩm của bạn.',
  'Ops panic: Server demo lag đúng lúc pitch, xử lý bằng storytelling.',
  'Growth boost: Một cộng đồng niche bắt đầu dùng app hằng ngày.',
]

const battleEvents: readonly BattleEvent[] = [
  {
    id: 'vc-winter',
    title: 'VC Winter',
    description: 'Thị trường gọi vốn lạnh đột ngột, runway của bạn bị soi kỹ.',
    actions: [
      {
        id: 'cut-burn',
        title: 'Siết burn rate',
        description: 'Cắt chi phí marketing, ưu tiên sống sót.',
        effect: { growth: -8, cash: 14, trust: 2 },
      },
      {
        id: 'double-down',
        title: 'All-in tăng trưởng',
        description: 'Đốt ngân sách để chiếm thị phần lúc đối thủ co cụm.',
        effect: { growth: 12, cash: -16, trust: -2 },
      },
      {
        id: 'transparent-update',
        title: 'Minh bạch với user',
        description: 'Công khai roadmap và tiến độ để giữ niềm tin.',
        effect: { growth: 2, cash: -3, trust: 11 },
      },
    ],
  },
  {
    id: 'copycat',
    title: 'Đối thủ copy ý tưởng',
    description: 'Một đối thủ vừa tung phiên bản giống bạn đến 70%.',
    actions: [
      {
        id: 'speed-ship',
        title: 'Ship nhanh gấp đôi',
        description: 'Đẩy release liên tục để giữ lợi thế tốc độ.',
        effect: { growth: 10, cash: -9, trust: 1 },
      },
      {
        id: 'brand-story',
        title: 'Đánh vào thương hiệu',
        description: 'Tập trung community và câu chuyện sản phẩm.',
        effect: { growth: 3, cash: -4, trust: 10 },
      },
      {
        id: 'price-war',
        title: 'Mở price war',
        description: 'Giảm giá sâu để ép đối thủ rút lui.',
        effect: { growth: 7, cash: -14, trust: -4 },
      },
    ],
  },
  {
    id: 'viral-traffic',
    title: 'Traffic bùng nổ',
    description: 'Một creator lớn review sản phẩm, user tăng đột biến.',
    actions: [
      {
        id: 'stability-first',
        title: 'Ưu tiên ổn định',
        description: 'Tăng hạ tầng, chấp nhận tăng trưởng chậm hơn.',
        effect: { growth: 3, cash: -8, trust: 12 },
      },
      {
        id: 'upsell-now',
        title: 'Upsell ngay',
        description: 'Đẩy gói trả phí ngay khi user vào đông.',
        effect: { growth: 6, cash: 10, trust: -5 },
      },
      {
        id: 'community-loop',
        title: 'Kích hoạt referral',
        description: 'Biến user mới thành vòng lặp giới thiệu.',
        effect: { growth: 12, cash: -2, trust: 4 },
      },
    ],
  },
  {
    id: 'team-burnout',
    title: 'Team burnout alert',
    description: 'Đội ngũ có dấu hiệu quá tải sau nhiều sprint liên tiếp.',
    actions: [
      {
        id: 'cooldown',
        title: 'Giảm nhịp 1 sprint',
        description: 'Tạm giảm scope để hồi phục đội ngũ.',
        effect: { growth: -6, cash: 4, trust: 8 },
      },
      {
        id: 'hire-fast',
        title: 'Tuyển người gấp',
        description: 'Mở rộng team nhanh để giữ tiến độ.',
        effect: { growth: 5, cash: -12, trust: 5 },
      },
      {
        id: 'squeeze-more',
        title: 'Ép thêm deadline',
        description: 'Giữ tốc độ cao bất chấp cảnh báo mệt mỏi.',
        effect: { growth: 9, cash: 2, trust: -12 },
      },
    ],
  },
  {
    id: 'enterprise-offer',
    title: 'Offer từ khách hàng lớn',
    description: 'Một doanh nghiệp lớn muốn custom tính năng riêng cho họ.',
    actions: [
      {
        id: 'take-deal',
        title: 'Nhận deal ngay',
        description: 'Ưu tiên doanh thu ngắn hạn.',
        effect: { growth: -2, cash: 15, trust: -3 },
      },
      {
        id: 'balanced-scope',
        title: 'Scope có kiểm soát',
        description: 'Nhận deal nhưng giới hạn tùy biến.',
        effect: { growth: 4, cash: 8, trust: 6 },
      },
      {
        id: 'decline-focus',
        title: 'Từ chối để giữ roadmap',
        description: 'Không lệch vision sản phẩm.',
        effect: { growth: 7, cash: -5, trust: 8 },
      },
    ],
  },
  {
    id: 'security-incident',
    title: 'Security incident',
    description: 'Có báo cáo lỗ hổng bảo mật mức trung bình.',
    actions: [
      {
        id: 'silent-fix',
        title: 'Fix âm thầm',
        description: 'Khắc phục nhanh nhưng không truyền thông.',
        effect: { growth: 2, cash: -5, trust: -7 },
      },
      {
        id: 'public-postmortem',
        title: 'Public postmortem',
        description: 'Công khai sự cố và kế hoạch phòng ngừa.',
        effect: { growth: -1, cash: -6, trust: 12 },
      },
      {
        id: 'security-sprint',
        title: 'Security sprint toàn đội',
        description: 'Dồn sprint cho hardening hệ thống.',
        effect: { growth: -7, cash: -8, trust: 10 },
      },
    ],
  },
]

const battlePerks: NonEmptyReadonlyArray<BattlePerk> = [
  {
    id: 'growth-hacker',
    title: 'Growth Hacker',
    description: 'Khởi đầu bùng nổ, hợp chiến lược tăng trưởng nhanh.',
    bonus: { growth: 8, cash: -3, trust: 0 },
  },
  {
    id: 'cash-keeper',
    title: 'Cash Keeper',
    description: 'Runway vững hơn, dễ sống sót qua biến động.',
    bonus: { growth: 0, cash: 10, trust: 0 },
  },
  {
    id: 'trust-builder',
    title: 'Trust Builder',
    description: 'User tin bạn sớm hơn, chống sốc truyền thông tốt.',
    bonus: { growth: 0, cash: -2, trust: 9 },
  },
]

const bossBattleEvent: BattleEvent = {
  id: 'boss-final',
  title: 'Boss Round: Black Swan Week',
  description:
    'Tất cả cùng lúc: cashflow hụt, đối thủ giảm giá, user đòi roadmap minh bạch. Chọn 1 nước đi cuối.',
  actions: [
    {
      id: 'boss-allin-product',
      title: 'All-in Product',
      description: 'Đẩy release lớn và giữ giá trị sản phẩm làm trung tâm.',
      effect: { growth: 14, cash: -12, trust: 6 },
    },
    {
      id: 'boss-allin-revenue',
      title: 'All-in Revenue',
      description: 'Tập trung doanh thu ngắn hạn để giữ runway bằng mọi giá.',
      effect: { growth: 5, cash: 16, trust: -8 },
    },
    {
      id: 'boss-allin-community',
      title: 'All-in Community',
      description: 'Minh bạch tuyệt đối, ưu tiên niềm tin và lòng trung thành user.',
      effect: { growth: 6, cash: -6, trust: 15 },
    },
  ],
}

const battleStages: readonly [BattleStage, BattleStage, BattleStage] = [
  {
    id: 'validate',
    title: 'Màn 1 - Validate',
    description: 'Kiểm tra nhu cầu thật và cách phản ứng của user đầu tiên.',
    rounds: [1, 2],
    eventIds: ['copycat', 'viral-traffic'],
  },
  {
    id: 'survival',
    title: 'Màn 2 - Survive',
    description: 'Giữ startup sống sót khi cash và team bắt đầu căng.',
    rounds: [3, 4],
    eventIds: ['vc-winter', 'team-burnout'],
  },
  {
    id: 'scale',
    title: 'Màn 3 - Scale & Boss',
    description: 'Mở rộng có kiểm soát, sau đó đối mặt Black Swan Boss Round.',
    rounds: [5, 6],
    eventIds: ['enterprise-offer', 'security-incident'],
  },
]

const maxBattleRounds = 6
const battleRound = ref(0)
const battleCurrentEvent = ref<BattleEvent | null>(null)
const battleEnded = ref(false)
const battleSummary = ref('Nhấn "Bắt đầu battle" để chạy mô phỏng 6 vòng (có Boss Round).')
const battleLogs = ref<BattleLog[]>([])
const usedBattleEvents = ref<string[]>([])
const usedBattleEventsByStage = reactive<Record<string, string[]>>({
  validate: [],
  survival: [],
  scale: [],
})
const battleActionLocked = ref(false)
const activePerkId = ref<BattlePerk['id']>('growth-hacker')
const battleStats = reactive<BattleStats>({
  growth: 50,
  cash: 50,
  trust: 50,
})

const funState = reactive({
  tagline: funTaglines[0],
  investorMood: investorMoods[0],
  chaosCard: chaosCards[0],
})

function pick(stepKey: StepKey, optionId: string): void {
  selections[stepKey] = optionId
  phase1Confirmed.value = false
  phase2Confirmed.value = false
}

function applyPreset(presetId: string): void {
  const preset = builderPresets.find((item) => item.id === presetId)
  if (!preset) {
    return
  }

  selections.market = preset.selections.market
  selections.problem = preset.selections.problem
  selections.solution = preset.selections.solution
  selections.pricing = preset.selections.pricing
  selections.channel = preset.selections.channel
  phase1Confirmed.value = false
  phase2Confirmed.value = false
}

function resetBuilder(): void {
  selections.market = marketStep.options[0].id
  selections.problem = problemStep.options[0].id
  selections.solution = solutionStep.options[0].id
  selections.pricing = pricingStep.options[0].id
  selections.channel = channelStep.options[0].id
  activeConstraints.budget = 'normal'
  activeConstraints.deadline = 'normal'
  activeConstraints.team = 'duo'
  phase1Confirmed.value = false
  phase2Confirmed.value = false
}

function setConstraint(key: ConstraintKey, optionId: string): void {
  activeConstraints[key] = optionId
  phase1Confirmed.value = false
  phase2Confirmed.value = false
}

async function smoothScrollTo(target: HTMLElement | null): Promise<void> {
  if (!target) {
    return
  }
  await nextTick()
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function confirmPhase1(): Promise<void> {
  phase1Confirmed.value = true
  phase2Confirmed.value = false
  markCowMission('phase1')
  generatePitchRoast()
  await smoothScrollTo(phase2SectionRef.value)
}

async function confirmPhase2(): Promise<void> {
  if (!phase1Confirmed.value) {
    return
  }
  phase2Confirmed.value = true
  markCowMission('phase2')
  await smoothScrollTo(phase3SectionRef.value)
}

function pickRandom<T>(items: NonEmptyReadonlyArray<T>): T {
  const randomIndex = Math.floor(Math.random() * items.length)
  return items[randomIndex] ?? items[0]
}

function selectedConstraint(key: ConstraintKey): ConstraintOption {
  const options = constraintOptions[key]
  const option = options.find((item) => item.id === activeConstraints[key])
  return option ?? options[0]
}

function selectedOption(step: Step): Option {
  const matched = step.options.find((option) => option.id === selections[step.key])
  if (matched) {
    return matched
  }
  return step.options[0]
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function stageByRound(round: number): BattleStage {
  const stage = battleStages.find((item) => item.rounds.includes(round))
  return stage ?? battleStages[0]
}

function randomBattleEventForRound(round: number): BattleEvent {
  const stage = stageByRound(round)
  const stageEventPool = battleEvents.filter((event) => stage.eventIds.includes(event.id))
  const usedInStage = usedBattleEventsByStage[stage.id] ?? []
  const remainingInStage = stageEventPool.filter((event) => !usedInStage.includes(event.id))
  const pool = remainingInStage.length > 0 ? remainingInStage : stageEventPool
  const fallback = stageEventPool[0] ?? battleEvents[0] ?? bossBattleEvent
  const randomIndex = Math.floor(Math.random() * pool.length)
  const picked = pool[randomIndex] ?? fallback
  usedBattleEvents.value = [...usedBattleEvents.value, picked.id]
  usedBattleEventsByStage[stage.id] = [...usedInStage, picked.id]
  return picked
}

function resetBattleState(): void {
  battleRound.value = 0
  battleCurrentEvent.value = null
  battleEnded.value = false
  battleActionLocked.value = false
  battleSummary.value = 'Nhấn "Bắt đầu battle" để chạy mô phỏng 6 vòng (có Boss Round).'
  battleLogs.value = []
  usedBattleEvents.value = []
  usedBattleEventsByStage.validate = []
  usedBattleEventsByStage.survival = []
  usedBattleEventsByStage.scale = []
  battleStats.growth = 50
  battleStats.cash = 50
  battleStats.trust = 50
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function beginBattle(): void {
  if (!phase1Confirmed.value || !phase2Confirmed.value) {
    battleSummary.value = 'Hãy chốt đủ Phase 1 và Phase 2 để mở Phase 3 SWOT Analysis.'
    return
  }

  resetBattleState()
  markCowMission('phase3')
  battleStats.growth = clampStat(battleStats.growth + activePerk.value.bonus.growth)
  battleStats.cash = clampStat(battleStats.cash + activePerk.value.bonus.cash)
  battleStats.trust = clampStat(battleStats.trust + activePerk.value.bonus.trust)
  battleStats.growth = clampStat(battleStats.growth + phase2Momentum.value.growth)
  battleStats.cash = clampStat(battleStats.cash + phase2Momentum.value.cash)
  battleStats.trust = clampStat(battleStats.trust + phase2Momentum.value.trust)
  battleRound.value = 1
  battleCurrentEvent.value = randomBattleEventForRound(1)
  battleSummary.value = `Màn 1 bắt đầu với perk ${activePerk.value.title} + momentum từ Phase 2. Chọn chiến lược để phản ứng với sự kiện.`
}

function nextBattleRound(): void {
  if (battleRound.value >= maxBattleRounds) {
    battleCurrentEvent.value = null
    battleEnded.value = true
    battleSummary.value = `Kết thúc battle sau ${maxBattleRounds} vòng.`
    return
  }

  battleRound.value += 1
  battleCurrentEvent.value =
    battleRound.value === maxBattleRounds
      ? bossBattleEvent
      : randomBattleEventForRound(battleRound.value)
  battleSummary.value =
    battleRound.value === maxBattleRounds
      ? 'Boss Round xuất hiện: quyết định cuối cùng sẽ định đoạt ending.'
      : `${stageByRound(battleRound.value).title}: chọn quyết định tiếp theo.`
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function applyBattleAction(action: BattleAction): void {
  const currentEvent = battleCurrentEvent.value
  if (!currentEvent || battleEnded.value || battleActionLocked.value) {
    return
  }
  battleActionLocked.value = true

  battleStats.growth = clampStat(battleStats.growth + action.effect.growth)
  battleStats.cash = clampStat(battleStats.cash + action.effect.cash)
  battleStats.trust = clampStat(battleStats.trust + action.effect.trust)

  battleLogs.value = [
    ...battleLogs.value,
    {
      round: battleRound.value,
      eventTitle: currentEvent.title,
      actionTitle: action.title,
      effect: action.effect,
    },
  ]

  if (battleStats.cash === 0) {
    battleCurrentEvent.value = null
    battleEnded.value = true
    battleActionLocked.value = false
    battleSummary.value = 'Game over sớm: cash đã về 0 trước khi hết round.'
    return
  }

  nextBattleRound()
  battleActionLocked.value = false
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatDelta(value: number): string {
  if (value > 0) {
    return `+${value}`
  }
  return `${value}`
}

function markCowMission(key: CowMissionKey): void {
  if (!cowMissionStatus[key]) {
    cowMissionStatus[key] = true
    cowXp.value += 12
  }
}

function awardCowXp(value: number): void {
  cowXp.value = Math.max(0, cowXp.value + value)
}

function appendCowMessage(sender: CowSender, text: string): void {
  cowMessageId.value += 1
  cowMessages.value = [
    ...cowMessages.value,
    {
      id: cowMessageId.value,
      sender,
      text,
    },
  ]
}

function buildCowReply(question: string): string {
  const normalized = question.toLowerCase()

  if (normalized.includes('one-pager') || normalized.includes('1 pager')) {
    return 'One-pager là bản tóm tắt 1 trang để bạn pitch nhanh: nêu vấn đề, giải pháp, khách hàng, mô hình giá và kế hoạch thực thi.'
  }

  if (normalized.includes('tác dụng') || normalized.includes('dùng để làm gì')) {
    return 'Tác dụng chính: giúp team chốt cùng 1 hướng, gửi mentor/investor review nhanh, và dùng làm checklist trước khi build thật.'
  }

  if (normalized.includes('pitch')) {
    return `Bạn có thể dùng one-pager của ${startupName.value} để mở đầu pitch trong 30-60 giây rồi mới đi sâu vào slide.`
  }

  if (
    normalized.includes('tiền') ||
    normalized.includes('doanh thu') ||
    normalized.includes('pricing')
  ) {
    return `Mô hình giá hiện tại là ${selectedOption(pricingStep).title}. Mẹo: nêu rõ vì sao user chấp nhận trả tiền trong 2 câu ngắn.`
  }

  if (
    normalized.includes('risk') ||
    normalized.includes('rủi ro') ||
    normalized.includes('khả thi')
  ) {
    return `Điểm khả thi hiện là ${feasibilityScore.value}/100 (${riskLevel.value}). Nếu muốn an toàn hơn, ưu tiên scope nhỏ + kênh tăng trưởng rõ.`
  }

  if (normalized.includes('kpi') || normalized.includes('metric')) {
    return '3 KPI nên theo dõi tuần đầu: activation (đăng ký->dùng lần đầu), retention D7, và conversion sang trả phí.'
  }

  if (normalized.includes('phase 3') || normalized.includes('battle')) {
    return `Trước battle, hãy giữ momentum dương ở Phase 2 và chọn perk hợp chiến lược. Mood hiện tại của tôi: ${cowMood.value}.`
  }

  return pickRandom([
    'Moo! Bạn thử hỏi: "One-pager dùng để làm gì?" để tôi trả lời cụ thể hơn.',
    'Nếu bạn định gửi cho mentor, hãy copy one-pager rồi thêm 3 KPI mục tiêu trong 30 ngày.',
    'Một one-pager tốt phải trả lời được: cho ai, giải quyết gì, kiếm tiền ra sao, triển khai thế nào.',
  ] as const)
}

function askCow(): void {
  const question = cowInput.value.trim()
  if (!question) {
    return
  }

  appendCowMessage('user', question)
  appendCowMessage('cow', buildCowReply(question))
  markCowMission('ask')
  awardCowXp(3)
  cowInput.value = ''
}

function cowSpeakAboutOnePager(): void {
  appendCowMessage(
    'cow',
    'Moo! One-pager giúp bạn biến ý tưởng thành tài liệu hành động: dùng để align team, xin feedback nhanh, và làm nền cho pitch deck.',
  )
  awardCowXp(2)
}

function askCowWithPrompt(prompt: string): void {
  cowInput.value = prompt
  askCow()
}

function cowGiveContextTip(): void {
  if (!phase1Confirmed.value) {
    appendCowMessage(
      'cow',
      'Tip hiện tại: chốt Phase 1 trước, vì toàn bộ gameplay phía sau đang phụ thuộc vào checkpoint này.',
    )
    return
  }

  if (!phase2Confirmed.value) {
    appendCowMessage(
      'cow',
      'Tip hiện tại: ở Phase 2 bạn nên tạo roast + hype card, sau đó chốt Phase 2 để unlock battle.',
    )
    return
  }

  if (phase3Unlocked.value && phase2Confirmed.value) {
    appendCowMessage(
      'cow',
      `Tip SWOT: Nhìn vào score ${swotSummary.value.score}/100 - ${swotSummary.value.verdict}. Leverage strengths + opportunities trước, address weaknesses sớm.`,
    )
    return
  }

  appendCowMessage('cow', `Hãy hoàn thành Phase 1 và Phase 2 để mở SWOT Analysis.`)
}

function interactWithCow(): void {
  const interactions = [
    'Moo! Đừng chọc tôi nữa, lo ship MVP đi!',
    'Bạn vừa nhột tôi à? Để sức mà gõ code kìa.',
    'Moo~ Tôi đang bận phân tích thị trường, click gì click hoài.',
    'Có vẻ founder đang rảnh rỗi quá nhỉ? Mở Terminal lên gõ thêm 10 dòng code đi.',
    '*Vuốt ve* Chăm ngoan ghê! Cố gắng chốt sổ Phase này sớm nhé!',
  ]
  const randomMsg = pickRandom(interactions as unknown as NonEmptyReadonlyArray<string>)
  appendCowMessage('cow', randomMsg)
  awardCowXp(1)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function battleStageStatus(stage: BattleStage): 'locked' | 'active' | 'cleared' {
  if (battleRound.value <= 0) {
    return stage.id === battleStages[0].id ? 'active' : 'locked'
  }

  const highestRoundInStage = Math.max(...stage.rounds)
  if (battleRound.value > highestRoundInStage) {
    return 'cleared'
  }

  if (stage.rounds.includes(battleRound.value) && !battleEnded.value) {
    return 'active'
  }

  return 'locked'
}

const startupName = computed(() => {
  const market = selectedOption(marketStep).title.split('/')[0]?.trim() ?? 'Market'
  const solution = selectedOption(solutionStep).title.split(' ')[0] ?? 'Startup'
  return `${solution}Flow for ${market}`
})

const oneLiner = computed(() => {
  return `Nền tảng giúp ${selectedOption(marketStep).title.toLowerCase()} giải quyết “${selectedOption(
    problemStep,
  ).title.toLowerCase()}” bằng ${selectedOption(solutionStep).title.toLowerCase()}.`
})

const feasibilityScore = computed(() => {
  const optionScore: Record<string, number> = {
    freelancer: 10,
    sme: 7,
    student: 8,
    planning: 9,
    communication: 8,
    reporting: 6,
    copilot: 6,
    workflow: 9,
    radar: 7,
    freemium: 8,
    seat: 7,
    usage: 6,
    community: 9,
    content: 8,
    partnership: 6,
  }

  const base =
    (optionScore[selections.market] ?? 6) +
    (optionScore[selections.problem] ?? 6) +
    (optionScore[selections.solution] ?? 6) +
    (optionScore[selections.pricing] ?? 6) +
    (optionScore[selections.channel] ?? 6)

  const constraintImpact =
    selectedConstraint('budget').impact +
    selectedConstraint('deadline').impact +
    selectedConstraint('team').impact

  return Math.max(0, Math.min(100, base * 2 + 25 + constraintImpact))
})

const riskLevel = computed(() => {
  if (feasibilityScore.value >= 78) {
    return 'Low Risk'
  }
  if (feasibilityScore.value >= 58) {
    return 'Medium Risk'
  }
  return 'High Risk'
})

const executionPlan = computed(() => [
  {
    title: 'Tuần 1: MVP',
    detail: `Dựng core flow theo nhịp ${selectedConstraint('deadline').title.toLowerCase()} với phạm vi vừa sức cho ${selectedConstraint('team').title.toLowerCase()}.`,
  },
  {
    title: 'Tuần 2: Validation',
    detail: `Mời 10 người dùng thử, đo activation và tối ưu kênh ${selectedOption(channelStep).title.toLowerCase()}.`,
  },
  {
    title: 'Tuần 3: Monetization',
    detail: `Ra mắt mô hình ${selectedOption(pricingStep).title.toLowerCase()} trong điều kiện ${selectedConstraint('budget').title.toLowerCase()}.`,
  },
])

const pitchSlides = computed(() => [
  {
    title: 'Slide 1 - Problem',
    lines: [selectedOption(problemStep).description, selectedOption(problemStep).impact],
  },
  {
    title: 'Slide 2 - Solution',
    lines: [selectedOption(solutionStep).description, selectedOption(solutionStep).impact],
  },
  {
    title: 'Slide 3 - Market',
    lines: [selectedOption(marketStep).description, selectedOption(marketStep).impact],
  },
  {
    title: 'Slide 4 - Business Model',
    lines: [selectedOption(pricingStep).description, selectedOption(pricingStep).impact],
  },
  {
    title: 'Slide 5 - Go To Market',
    lines: [selectedOption(channelStep).description, selectedOption(channelStep).impact],
  },
])

const onePagerText = computed(() => {
  const lines: string[] = [
    `PROJECT NAME: ${startupName.value}`,
    oneLiner.value,
    '',
    `FEASIBILITY: ${feasibilityScore.value}/100 (${riskLevel.value})`,
    `CONSTRAINTS: ${selectedConstraint('budget').title}, ${selectedConstraint('deadline').title}, ${selectedConstraint('team').title}`,
    '',
    `GO TO MARKET: ${selectedOption(channelStep).description}`,
    `IMPACT: ${selectedOption(channelStep).impact}`,
    '',
    'EXECUTION PLAN:',
    ...executionPlan.value.map((item) => `- ${item.title}: ${item.detail}`),
  ]
  return lines.join('\n')
})

const vibeScore = computed(() => {
  const fingerprint = `${selections.market}-${selections.problem}-${selections.solution}-${selections.pricing}-${selections.channel}`
  const total = [...fingerprint].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (total % 41) + 60
})

const sprintTimeLabel = computed(() => {
  const minutes = Math.floor(sprintSeconds.value / 60)
  const seconds = sprintSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const battleProgress = computed(() => {
  const value = Math.round((battleRound.value / maxBattleRounds) * 100)
  return Math.max(0, Math.min(100, value))
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const currentBattleStage = computed(() => {
  if (battleRound.value <= 0) {
    return battleStages[0]
  }
  return stageByRound(Math.min(battleRound.value, maxBattleRounds - 1))
})

const phase2Unlocked = computed(() => phase1Confirmed.value)
const phase3Unlocked = computed(() => phase1Confirmed.value && phase2Confirmed.value)
const cowLevel = computed(() => Math.min(5, Math.floor(cowXp.value / 40) + 1))
const cowLevelProgress = computed(() => Math.max(0, Math.min(100, (cowXp.value % 40) * 2.5)))

const currentCowUrl = computed(() => {
  if (cowLevel.value >= 5) return cowLv5Url
  if (cowLevel.value === 4) return cowLv4Url
  if (cowLevel.value === 3) return cowLv3Url
  if (cowLevel.value === 2) return cowLv2Url
  return cowLv1Url
})

const cowMood = computed(() => {
  if (battleEnded.value && battleStats.cash === 0) {
    return 'An ủi'
  }
  if (phase3Unlocked.value && phase2Confirmed.value) {
    return 'Phân tích SWOT'
  }
  if (phase1Confirmed.value && phase2Confirmed.value) {
    return 'Sẵn sàng'
  }
  // Change mood based on level if not in special states
  if (cowLevel.value >= 5) {
    return 'Thông thái'
  }
  if (cowLevel.value >= 4) {
    return 'Hứng khởi'
  }
  if (cowLevel.value >= 3) {
    return 'Sáng tạo'
  }
  if (cowLevel.value >= 2) {
    return 'Phấn khích'
  }
  return 'Hiếu kỳ'
})
const cowMissionBoard = computed(() => [
  {
    key: 'phase1' as const,
    title: 'Chốt Phase 1',
    done: cowMissionStatus.phase1,
  },
  {
    key: 'phase2' as const,
    title: 'Chốt Phase 2',
    done: cowMissionStatus.phase2,
  },
  {
    key: 'phase3' as const,
    title: 'Bắt đầu Phase 3',
    done: cowMissionStatus.phase3,
  },
  {
    key: 'ask' as const,
    title: 'Hỏi Bò 1 câu',
    done: cowMissionStatus.ask,
  },
  {
    key: 'copy' as const,
    title: 'Copy One-pager',
    done: cowMissionStatus.copy,
  },
])
const cowMissionCompletedCount = computed(
  () => cowMissionBoard.value.filter((item) => item.done).length,
)

const phase2Momentum = computed(() => {
  const growth = Math.round((vibeScore.value - 70) / 6)
  const trust = riskLevel.value === 'Low Risk' ? 5 : riskLevel.value === 'Medium Risk' ? 1 : -4
  const cash = feasibilityScore.value >= 78 ? 4 : feasibilityScore.value >= 58 ? 1 : -5

  return {
    growth: Math.max(-6, Math.min(8, growth)),
    cash: Math.max(-6, Math.min(8, cash)),
    trust: Math.max(-6, Math.min(8, trust)),
  }
})

const activePerk = computed(() => {
  const perk = battlePerks.find((item) => item.id === activePerkId.value)
  return perk ?? battlePerks[0]
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isBossRound = computed(() => battleCurrentEvent.value?.id === bossBattleEvent.id)

const hypeCardText = computed(() => {
  return [
    'VIBE STARTUP HYPE CARD',
    `Name: ${startupName.value}`,
    `Vibe Score: ${vibeScore.value}/100`,
    `Feasibility: ${feasibilityScore.value}/100 (${riskLevel.value})`,
    `Constraints: ${selectedConstraint('budget').title} | ${selectedConstraint('deadline').title} | ${selectedConstraint('team').title}`,
    `Tagline: ${funState.tagline}`,
    `Investor Mood: ${funState.investorMood}`,
  ].join('\n')
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const battleEnding = computed(() => {
  const total = battleStats.growth + battleStats.cash + battleStats.trust

  if (battleStats.cash === 0) {
    return {
      title: 'Shutdown Arc',
      description: 'Runway cạn trước khi mô hình kịp ổn định. Bài học lớn cho vòng sau.',
    }
  }

  if (total >= 245) {
    return {
      title: 'Unicorn Vibes',
      description: 'Bạn giữ được tăng trưởng, tiền mặt và niềm tin ở mức xuất sắc.',
    }
  }

  if (total >= 205) {
    return {
      title: 'Series A Ready',
      description: 'Startup đủ khỏe để raise vòng tiếp theo với câu chuyện hợp lý.',
    }
  }

  if (total >= 165) {
    return {
      title: 'Acqui-hire Ending',
      description: 'Sản phẩm chưa bùng nổ nhưng đội ngũ và công nghệ vẫn rất có giá trị.',
    }
  }

  return {
    title: 'Zombie Startup',
    description: 'Vẫn sống nhưng tăng trưởng chậm. Cần một cú pivot mạnh ở phiên bản sau.',
  }
})

const swotAnalysis = computed(() => {
  const market = selectedOption(marketStep)
  const problem = selectedOption(problemStep)
  const solution = selectedOption(solutionStep)
  const pricing = selectedOption(pricingStep)
  const channel = selectedOption(channelStep)

  const strengths: SwotItem[] = [
    {
      id: 's1',
      text: `Target ${market.title} - thị trường ${market.impact.toLowerCase()}`,
      source: 'Market',
    },
    {
      id: 's2',
      text: `Giải quyết ${problem.title.toLowerCase()} - pain point rõ ràng`,
      source: 'Problem',
    },
    {
      id: 's3',
      text: `Giải pháp ${solution.title.toLowerCase()} - ${solution.impact.toLowerCase()}`,
      source: 'Solution',
    },
    {
      id: 's4',
      text: `Mô hình ${pricing.title.toLowerCase()} - ${pricing.impact.toLowerCase()}`,
      source: 'Pricing',
    },
  ]

  const weaknesses: SwotItem[] = [
    {
      id: 'w1',
      text: `Budget ${selectedConstraint('budget').title.toLowerCase()} giới hạn tốc độ`,
      source: 'Constraint',
    },
    {
      id: 'w2',
      text: `Deadline ${selectedConstraint('deadline').title.toLowerCase()} cần scope phù hợp`,
      source: 'Constraint',
    },
    {
      id: 'w3',
      text: `Team ${selectedConstraint('team').title.toLowerCase()} - cần ưu tiên đúng`,
      source: 'Constraint',
    },
    {
      id: 'w4',
      text: `Feasibility ${feasibilityScore.value}/100 - ${riskLevel.value.toLowerCase()}`,
      source: 'Analysis',
    },
  ]

  const opportunities: SwotItem[] = [
    {
      id: 'o1',
      text: `Kênh ${channel.title.toLowerCase()} - ${channel.impact.toLowerCase()}`,
      source: 'Channel',
    },
    { id: 'o2', text: 'Freemium model cho phép user trải nghiệm trước khi mua', source: 'Pricing' },
    {
      id: 'o3',
      text: 'Growth qua community/content/partnership có thể scale nhanh',
      source: 'Channel',
    },
    { id: 'o4', text: 'Workflow template giúp onboarding nhanh, giảm churn', source: 'Solution' },
  ]

  const threats: SwotItem[] = [
    { id: 't1', text: 'Đối thủ có thể copy feature nếu không defend được', source: 'Market' },
    { id: 't2', text: 'Retention khó nếu giá trị cốt lõi chưa rõ', source: 'Problem' },
    { id: 't3', text: 'Pricing phụ thuộc vào perceived value của user', source: 'Pricing' },
    { id: 't4', text: 'Execution chậm = mất momentum ban đầu', source: 'Constraint' },
  ]

  return { strengths, weaknesses, opportunities, threats }
})

const swotSummary = computed(() => {
  const s = swotAnalysis.value.strengths.length
  const w = swotAnalysis.value.weaknesses.length
  const o = swotAnalysis.value.opportunities.length
  const t = swotAnalysis.value.threats.length
  const score = (s + o - (w + t)) * 10 + 50
  const clampedScore = Math.max(0, Math.min(100, score))

  let verdict: string
  if (clampedScore >= 75) verdict = 'Khả thi cao - đi tiếp'
  else if (clampedScore >= 50) verdict = 'Cần điều chỉnh'
  else verdict = 'Cần pivot hoặc research thêm'

  return { score: clampedScore, verdict }
})

function randomFunState(): void {
  funState.tagline = pickRandom(funTaglines)
  funState.investorMood = pickRandom(investorMoods)
  funState.chaosCard = pickRandom(chaosCards)
  phase2Confirmed.value = false
  generatePitchRoast()
}

function randomIdea(): void {
  for (const step of steps) {
    const randomIndex = Math.floor(Math.random() * step.options.length)
    const option = step.options[randomIndex]
    if (option) {
      selections[step.key] = option.id
    }
  }
  activeConstraints.budget = pickRandom(constraintOptions.budget).id
  activeConstraints.deadline = pickRandom(constraintOptions.deadline).id
  activeConstraints.team = pickRandom(constraintOptions.team).id
  phase1Confirmed.value = false
  phase2Confirmed.value = false
  randomFunState()
}

function generatePitchRoast(): void {
  const roastPack: string[] = []

  if (feasibilityScore.value < 58) {
    roastPack.push(
      'Investor: Ý tưởng vui nhưng execution plan đang hơi "cầu may", cần bó scope gắt hơn.',
    )
  } else if (feasibilityScore.value < 78) {
    roastPack.push(
      'Investor: Concept ổn, nhưng bạn cần một lợi thế khác biệt rõ hơn để scale nhanh.',
    )
  } else {
    roastPack.push('Investor: Pitch này có mùi tiền, miễn là team ship đúng tiến độ đã hứa.')
  }

  if (selections.pricing === 'usage') {
    roastPack.push(
      'Investor: Usage-based hay, nhưng nhớ làm pricing calculator kẻo user chóng mặt.',
    )
  } else if (selections.pricing === 'freemium') {
    roastPack.push(
      'Investor: Freemium tốt cho growth, nhưng conversion lên Pro phải có trigger thật sắc.',
    )
  } else {
    roastPack.push('Investor: Seat-based ổn cho B2B, đừng quên giới hạn tính năng theo team size.')
  }

  if (selections.channel === 'community') {
    roastPack.push('Investor: Community-led mạnh đấy, nhưng bạn cần lịch nội dung đều như cơm bữa.')
  } else if (selections.channel === 'content') {
    roastPack.push('Investor: SEO là đường dài, giữ nhịp publish thì mới ra lead chất.')
  } else {
    roastPack.push('Investor: Partnership nhanh lead, nhưng đừng để phụ thuộc 1 kênh duy nhất.')
  }

  roastLines.value = roastPack
}

async function copyHypeCard(): Promise<void> {
  try {
    await navigator.clipboard.writeText(hypeCardText.value)
    hypeCardFeedback.value = 'Đã copy Hype Card'
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = hypeCardText.value
    textArea.setAttribute('readonly', 'true')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    hypeCardFeedback.value = 'Đã copy Hype Card'
  } finally {
    window.setTimeout(() => {
      hypeCardFeedback.value = 'Copy Hype Card'
    }, 1600)
  }
}

function stopSprint(): void {
  if (sprintTimer !== null) {
    window.clearInterval(sprintTimer)
    sprintTimer = null
  }
  sprintRunning.value = false
}

function startSprint(): void {
  if (sprintRunning.value) {
    return
  }

  if (sprintSeconds.value <= 0) {
    sprintSeconds.value = 300
  }

  sprintRunning.value = true
  sprintTimer = window.setInterval(() => {
    if (sprintSeconds.value <= 1) {
      sprintSeconds.value = 0
      stopSprint()
      return
    }
    sprintSeconds.value -= 1
  }, 1000)
}

function resetSprint(): void {
  stopSprint()
  sprintSeconds.value = 300
}

async function copyOnePager(): Promise<void> {
  try {
    await navigator.clipboard.writeText(onePagerText.value)
    copyFeedback.value = 'Đã copy one-pager'
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = onePagerText.value
    textArea.setAttribute('readonly', 'true')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copyFeedback.value = 'Đã copy one-pager'
  } finally {
    markCowMission('copy')
    awardCowXp(3)
    window.setTimeout(() => {
      copyFeedback.value = 'Sao chép one-pager'
    }, 1600)
  }
}

generatePitchRoast()

onBeforeUnmount(() => {
  stopSprint()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-10 text-text-primary sm:px-6 lg:px-8">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <header class="animate-fade-up border border-border-default bg-bg-surface p-6 sm:p-8">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <p class="font-display text-sm tracking-[0.2em] text-accent-amber">
              // VIBE STARTUP STUDIO
            </p>
            <h1
              class="mt-3 font-display text-4xl font-bold tracking-tight text-text-primary sm:text-6xl"
            >
              Build-a-Startup in 5 Minutes
            </h1>
          </div>
          <div
            class="shrink-0 bg-accent-coral px-3 py-1.5 font-display text-xs font-bold tracking-widest text-bg-deep"
          >
            VOL.01 / 2026
          </div>
        </div>
        <p class="max-w-3xl text-sm text-text-secondary sm:text-base">
          Đây là playground mô phỏng hành trình startup trong 3 phase: xây chiến lược, luyện pitch
          và phân tích SWOT. Mục tiêu là ra được concept rõ ràng và đánh giá khả thi trước khi
          build.
        </p>
        <div class="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-text-dim">
          <span class="border border-border-default bg-bg-deep px-3 py-1">No Database</span>
          <span class="border border-border-default bg-bg-deep px-3 py-1">Mobile Ready</span>
          <span class="border border-border-default bg-bg-deep px-3 py-1">Community Friendly</span>
        </div>
      </header>

      <section
        class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-4 sm:p-5"
      >
        <h2 class="mb-3 flex items-center gap-3 font-display text-xl font-semibold">
          <span class="text-sm tracking-widest text-accent-sky">//</span>
          How To USE
        </h2>
        <div class="grid gap-3 sm:grid-cols-3 text-sm text-text-secondary">
          <article class="border border-border-default bg-bg-deep p-3">
            <p class="font-display text-xs tracking-widest text-accent-coral">PHASE 1</p>
            <p class="mt-1 text-text-primary">Build Strategy</p>
            <p class="mt-1">Chọn 5 quyết định + constraints để tạo one-pager khả thi.</p>
          </article>
          <article class="border border-border-default bg-bg-deep p-3">
            <p class="font-display text-xs tracking-widest text-accent-amber">PHASE 2</p>
            <p class="mt-1 text-text-primary">Pitch Playground</p>
            <p class="mt-1">Dùng Entertainment Mode để roast pitch và tạo Hype Card chia sẻ.</p>
          </article>
          <article class="border border-border-default bg-bg-deep p-3">
            <p class="font-display text-xs tracking-widest text-accent-sky">PHASE 3</p>
            <p class="mt-1 text-text-primary">SWOT Analysis</p>
            <p class="mt-1">
              Phân tích Strengths/Weaknesses/Opportunities/Threats từ 5 quyết định.
            </p>
          </article>
        </div>
        <ol class="mt-4 grid gap-2 text-xs text-text-secondary sm:grid-cols-3">
          <li class="border border-border-default bg-bg-deep p-3">
            1. Chốt Phase 1 để mở Phase 2 tự động và kéo xuống đúng section.
          </li>
          <li class="border border-border-default bg-bg-deep p-3">
            2. Tại Phase 2, chỉnh vibe/pitch rồi bấm Chốt Phase 2 để unlock SWOT Analysis.
          </li>
          <li class="border border-border-default bg-bg-deep p-3">
            3. Phase 3 hiển thị SWOT tự động từ 5 quyết định + action items.
          </li>
        </ol>
      </section>

      <div class="animate-fade-up animate-delay-3 flex gap-1.5">
        <span v-for="dot in 40" :key="dot" class="h-1 w-1 rounded-full bg-border-default" />
      </div>

      <section
        ref="phase1SectionRef"
        class="grid animate-fade-up animate-delay-4 gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div class="border border-border-default bg-bg-surface p-5 sm:p-6">
          <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
              <span class="text-sm tracking-widest text-accent-coral">//</span>
              Phase 1: Build Strategy
            </h2>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center border border-border-default bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-text-secondary transition-all duration-300 hover:bg-bg-elevated"
                @click="resetBuilder"
              >
                Reset Builder
              </button>
              <button
                type="button"
                class="inline-flex items-center border border-accent-amber bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-amber transition-all duration-300 hover:bg-bg-elevated"
                @click="randomIdea"
              >
                Random Idea
              </button>
            </div>
          </div>
          <p class="mb-4 text-xs text-text-dim">
            Mục đích: tạo concept startup rõ ràng và đo độ khả thi trước khi vào phần giải
            trí/battle.
          </p>

          <div class="mb-5 grid gap-2 sm:grid-cols-3">
            <button
              v-for="preset in builderPresets"
              :key="preset.id"
              type="button"
              class="border border-border-default bg-bg-deep p-3 text-left transition-all duration-300 hover:border-accent-sky hover:bg-bg-elevated"
              @click="applyPreset(preset.id)"
            >
              <p class="font-display text-sm text-text-primary">{{ preset.title }}</p>
              <p class="mt-1 text-xs text-text-secondary">{{ preset.description }}</p>
            </button>
          </div>

          <div class="space-y-5">
            <article
              v-for="step in steps"
              :key="step.key"
              class="border border-border-default bg-bg-deep p-4 transition-all duration-300 hover:bg-bg-elevated"
            >
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-display text-lg font-semibold text-text-primary">
                  {{ step.label }}
                </h3>
                <span class="font-display text-xs tracking-widest text-accent-amber">{{
                  step.marker
                }}</span>
              </div>

              <div class="grid gap-2 sm:grid-cols-3">
                <button
                  v-for="option in step.options"
                  :key="option.id"
                  type="button"
                  class="border px-3 py-3 text-left transition-all duration-300"
                  :class="
                    selections[step.key] === option.id
                      ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                      : 'border-border-default bg-bg-surface text-text-secondary hover:border-accent-amber hover:bg-bg-elevated'
                  "
                  @click="pick(step.key, option.id)"
                >
                  <p class="font-display text-sm font-semibold">{{ option.title }}</p>
                  <p class="mt-1 text-xs leading-relaxed">{{ option.description }}</p>
                </button>
              </div>
            </article>
          </div>

          <article class="mt-5 border border-border-default bg-bg-deep p-4">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="font-display text-lg font-semibold text-text-primary">
                Ràng buộc thực tế
              </h3>
              <span class="font-display text-xs tracking-widest text-accent-sky">REAL WORLD</span>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <div
                v-for="group in constraintGroups"
                :key="group.key"
                class="border border-border-default bg-bg-surface p-3"
              >
                <p class="font-display text-xs tracking-widest text-accent-amber">
                  {{ group.label }}
                </p>
                <div class="mt-2 space-y-2">
                  <button
                    v-for="constraint in group.options"
                    :key="constraint.id"
                    type="button"
                    class="w-full border px-2 py-2 text-left text-xs transition-all duration-300"
                    :class="
                      activeConstraints[group.key] === constraint.id
                        ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                        : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-amber'
                    "
                    @click="setConstraint(group.key, constraint.id)"
                  >
                    <p class="font-display text-xs">{{ constraint.title }}</p>
                    <p class="mt-1 text-text-dim">{{ constraint.description }}</p>
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="mt-5 border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-coral">BUILD HEALTH</p>
            <div class="mt-2 flex items-end justify-between gap-3">
              <p class="font-display text-3xl font-bold">{{ feasibilityScore }}/100</p>
              <p class="text-xs text-text-secondary">{{ riskLevel }}</p>
            </div>
            <div class="mt-3 h-2 w-full bg-bg-surface">
              <div
                class="h-2 transition-all duration-500"
                :class="
                  feasibilityScore >= 78
                    ? 'bg-accent-sky'
                    : feasibilityScore >= 58
                      ? 'bg-accent-amber'
                      : 'bg-accent-coral'
                "
                :style="{ width: `${feasibilityScore}%` }"
              />
            </div>
            <p class="mt-2 text-xs text-text-dim">
              Điểm này tổng hợp từ lựa chọn chiến lược + ràng buộc hiện tại để ước lượng độ khả thi.
            </p>
          </article>

          <article class="mt-5 border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-sky">PHASE 1 CHECKPOINT</p>
            <p class="mt-2 text-sm text-text-secondary">
              Chốt chiến lược để mở toàn bộ phần Pitch Playground và SWOT Analysis.
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="border border-accent-coral px-3 py-2 text-xs text-accent-coral transition-all duration-300 hover:bg-accent-coral/10"
                @click="confirmPhase1"
              >
                Chốt Phase 1 và qua Phase 2
              </button>
              <span
                class="border px-2 py-1 text-xs"
                :class="
                  phase1Confirmed
                    ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                    : 'border-border-default text-text-dim'
                "
              >
                {{ phase1Confirmed ? 'Đã chốt chiến lược' : 'Chưa chốt chiến lược' }}
              </span>
            </div>
          </article>
        </div>

        <aside class="border border-border-default bg-bg-surface p-5 sm:p-6">
          <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
              <span class="text-sm tracking-widest text-accent-sky">//</span>
              One-Pager
            </h2>
            <button
              type="button"
              class="inline-flex items-center border border-accent-sky bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-sky transition-all duration-300 hover:bg-bg-elevated"
              @click="copyOnePager"
            >
              {{ copyFeedback }}
            </button>
          </div>

          <div class="space-y-4">
            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-coral">PROJECT NAME</p>
              <p class="mt-2 font-display text-2xl font-bold">{{ startupName }}</p>
              <p class="mt-3 text-sm text-text-secondary">{{ oneLiner }}</p>
              <p class="mt-3 text-xs text-text-dim">
                Feasibility: {{ feasibilityScore }}/100 ({{ riskLevel }})
              </p>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-sky">CONSTRAINTS</p>
              <ul class="mt-2 space-y-1 text-sm text-text-secondary">
                <li>Budget: {{ selectedConstraint('budget').title }}</li>
                <li>Deadline: {{ selectedConstraint('deadline').title }}</li>
                <li>Team: {{ selectedConstraint('team').title }}</li>
              </ul>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-amber">GO TO MARKET</p>
              <p class="mt-2 text-sm text-text-secondary">
                {{ selectedOption(channelStep).description }}
              </p>
              <p class="mt-2 text-xs text-text-dim">{{ selectedOption(channelStep).impact }}</p>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-sky">EXECUTION PLAN</p>
              <ul class="mt-3 space-y-2">
                <li
                  v-for="item in executionPlan"
                  :key="item.title"
                  class="text-sm text-text-secondary"
                >
                  <span class="font-display text-text-primary">{{ item.title }}</span>
                  <span class="text-text-dim"> - {{ item.detail }}</span>
                </li>
              </ul>
            </div>

            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs tracking-widest text-accent-amber">ONE-PAGER DÙNG ĐỂ LÀM GÌ?</p>
              <ul class="mt-2 space-y-2 text-sm text-text-secondary">
                <li>- Chốt cùng một hướng với team trong 5 phút.</li>
                <li>- Gửi mentor/investor để nhận feedback nhanh trước khi code.</li>
                <li>- Làm sườn cho pitch deck và kế hoạch 30 ngày đầu.</li>
              </ul>
              <p class="mt-2 text-xs text-text-dim">
                Mẹo: copy one-pager, thêm 3 KPI (activation, retention, revenue) để thành bản review
                hoàn chỉnh.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section
        class="animate-fade-up animate-delay-5 border border-border-default bg-bg-surface p-5 sm:p-6"
      >
        <h2 class="mb-6 flex items-center gap-3 font-display text-2xl font-semibold">
          <span class="text-sm tracking-widest text-accent-amber">//</span>
          Pitch Deck Preview (5 slides)
        </h2>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article
            v-for="slide in pitchSlides"
            :key="slide.title"
            class="group relative border border-border-default bg-bg-deep p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <p
              class="font-display text-sm font-semibold text-text-primary group-hover:text-accent-coral"
            >
              {{ slide.title }}
            </p>
            <ul class="mt-3 space-y-2 text-xs leading-relaxed text-text-secondary">
              <li v-for="line in slide.lines" :key="line">{{ line }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section
        ref="phase2SectionRef"
        class="animate-fade-up animate-delay-6 border border-border-default bg-bg-surface p-5 sm:p-6"
        :class="phase2Unlocked ? '' : 'opacity-60'"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="text-sm tracking-widest text-accent-coral">//</span>
            Phase 2: Pitch Playground
          </h2>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center border border-accent-coral bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-coral transition-all duration-300 hover:bg-bg-elevated"
              @click="randomFunState"
              :disabled="!phase2Unlocked"
            >
              Gacha Twist
            </button>
            <button
              type="button"
              class="inline-flex items-center border border-accent-amber bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-amber transition-all duration-300 hover:bg-bg-elevated"
              @click="generatePitchRoast"
              :disabled="!phase2Unlocked"
            >
              Pitch Roast
            </button>
            <button
              type="button"
              class="inline-flex items-center border border-accent-sky bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-sky transition-all duration-300 hover:bg-bg-elevated"
              @click="copyHypeCard"
              :disabled="!phase2Unlocked"
            >
              {{ hypeCardFeedback }}
            </button>
          </div>
        </div>
        <p class="mb-4 text-xs text-text-dim">
          Mục đích: luyện cách kể chuyện startup, tạo nội dung vui để chia sẻ, và nhìn ý tưởng dưới
          góc nhìn investor.
        </p>
        <p v-if="!phase2Unlocked" class="mb-4 text-xs text-accent-amber">
          Phase 2 đang chờ Phase 1. Hãy bấm "Chốt Phase 1" ở trên để mở đầy đủ.
        </p>

        <div class="grid gap-4 lg:grid-cols-3">
          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-amber">VIBE TAGLINE</p>
            <p class="mt-2 text-sm text-text-secondary">{{ funState.tagline }}</p>
          </article>
          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-sky">INVESTOR MOOD</p>
            <p class="mt-2 text-sm text-text-secondary">{{ funState.investorMood }}</p>
          </article>
          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-coral">CHAOS CARD</p>
            <p class="mt-2 text-sm text-text-secondary">{{ funState.chaosCard }}</p>
          </article>
        </div>

        <div class="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <div class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-amber">VIBE SCORE</p>
            <p class="mt-2 font-display text-3xl font-bold text-text-primary">
              {{ vibeScore }}/100
            </p>
            <p class="mt-2 text-xs text-text-dim">
              Điểm cao nghĩa là concept vừa rõ ràng vừa có độ "điên" hợp lý.
            </p>
          </div>
          <div class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-sky">5-MIN SPRINT</p>
            <p class="mt-2 font-display text-3xl font-bold">{{ sprintTimeLabel }}</p>
            <div class="mt-3 flex gap-2">
              <button
                type="button"
                class="border border-accent-coral px-3 py-2 text-xs text-accent-coral transition-all duration-300 hover:bg-accent-coral/10"
                @click="startSprint"
              >
                Start
              </button>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition-all duration-300 hover:bg-bg-elevated"
                @click="stopSprint"
              >
                Pause
              </button>
              <button
                type="button"
                class="border border-accent-amber px-3 py-2 text-xs text-accent-amber transition-all duration-300 hover:bg-accent-amber/10"
                @click="resetSprint"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <article class="mt-4 border border-border-default bg-bg-deep p-4">
          <p class="text-xs tracking-widest text-accent-coral">PITCH ROAST</p>
          <ul class="mt-2 space-y-2 text-sm text-text-secondary">
            <li v-for="(line, index) in roastLines" :key="index">{{ line }}</li>
          </ul>
        </article>

        <article class="mt-4 border border-accent-amber bg-accent-amber/10 p-4">
          <p class="text-xs tracking-widest text-accent-amber">
            SAU KHI HOÀN THÀNH - BƯỚC TIẾP THEO
          </p>
          <p class="mt-2 text-xs text-text-dim">
            Concept của bạn đã sẵn sàng. Dưới đây là hướng phát triển tiếp theo:
          </p>
          <ul class="mt-3 space-y-2 text-sm text-text-secondary">
            <li class="flex items-start gap-2">
              <span class="text-accent-sky">1.</span>
              <span
                ><strong class="text-text-primary">Validate:</strong> Interview 5 người trong target
                market để xác nhận pain point.</span
              >
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent-sky">2.</span>
              <span
                ><strong class="text-text-primary">Sketch MVP:</strong> Vẽ wireframe cho 3 tính năng
                core nhất.</span
              >
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent-sky">3.</span>
              <span
                ><strong class="text-text-primary">Test Pricing:</strong> Hỏi 10 người xem họ có trả
                mức giá bạn định không.</span
              >
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent-sky">4.</span>
              <span
                ><strong class="text-text-primary">Launch Landing Page:</strong> Đặt CTA "Join
                waitlist" để đo interest.</span
              >
            </li>
          </ul>
        </article>

        <article class="mt-4 border border-border-default bg-bg-deep p-4">
          <p class="text-xs tracking-widest text-accent-coral">PHASE 2 CHECKPOINT</p>
          <p class="mt-2 text-sm text-text-secondary">
            Xác nhận pitch hiện tại để mở SWOT Analysis ở Phase 3.
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="border border-accent-coral px-3 py-2 text-xs text-accent-coral transition-all duration-300 hover:bg-accent-coral/10 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!phase2Unlocked"
              @click="confirmPhase2"
            >
              Chốt Phase 2 và qua Phase 3
            </button>
            <span
              class="border px-2 py-1 text-xs"
              :class="
                phase2Confirmed
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-dim'
              "
            >
              {{ phase2Confirmed ? 'Đã chốt pitch' : 'Chưa chốt pitch' }}
            </span>
          </div>
        </article>
      </section>

      <section
        ref="phase3SectionRef"
        class="animate-fade-up animate-delay-7 border border-border-default bg-bg-surface p-5 sm:p-6"
        :class="phase3Unlocked ? '' : 'opacity-60'"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="text-sm tracking-widest text-accent-amber">//</span>
            Phase 3: SWOT Analysis
          </h2>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center border border-accent-coral bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-coral transition-all duration-300 hover:bg-bg-elevated"
              @click="randomIdea"
              :disabled="!phase3Unlocked"
            >
              Random New Idea
            </button>
          </div>
        </div>
        <p class="mb-4 text-xs text-text-dim">
          Mục đích: phân tích điểm mạnh (S), điểm yếu (W), cơ hội (O) và thách thức (T) dựa trên 5
          quyết định chiến lược đã chọn ở Phase 1.
        </p>
        <p v-if="!phase3Unlocked" class="mb-4 text-xs text-accent-amber">
          Phase 3 đang khóa vì bạn chưa chốt đủ Phase 1 và Phase 2.
        </p>

        <div class="mb-4 border border-border-default bg-bg-deep p-4">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs tracking-widest text-accent-sky">SWOT SCORE</p>
            <span
              class="border px-2 py-1 text-xs"
              :class="
                swotSummary.score >= 75
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : swotSummary.score >= 50
                    ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                    : 'border-accent-coral bg-accent-coral/10 text-accent-coral'
              "
            >
              {{ swotSummary.verdict }}
            </span>
          </div>
          <p class="mt-2 font-display text-3xl">{{ swotSummary.score }}/100</p>
          <div class="mt-3 h-2 w-full bg-bg-surface">
            <div
              class="h-2 transition-all duration-500"
              :class="
                swotSummary.score >= 75
                  ? 'bg-accent-sky'
                  : swotSummary.score >= 50
                    ? 'bg-accent-amber'
                    : 'bg-accent-coral'
              "
              :style="{ width: `${swotSummary.score}%` }"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-sky">STRENGTHS</p>
            <ul class="mt-3 space-y-2">
              <li
                v-for="item in swotAnalysis.strengths"
                :key="item.id"
                class="border-l-2 border-accent-sky pl-3 text-sm"
              >
                <p class="text-text-primary">{{ item.text }}</p>
                <p class="text-xs text-text-dim">{{ item.source }}</p>
              </li>
            </ul>
          </article>

          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-coral">WEAKNESSES</p>
            <ul class="mt-3 space-y-2">
              <li
                v-for="item in swotAnalysis.weaknesses"
                :key="item.id"
                class="border-l-2 border-accent-coral pl-3 text-sm"
              >
                <p class="text-text-primary">{{ item.text }}</p>
                <p class="text-xs text-text-dim">{{ item.source }}</p>
              </li>
            </ul>
          </article>

          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-amber">OPPORTUNITIES</p>
            <ul class="mt-3 space-y-2">
              <li
                v-for="item in swotAnalysis.opportunities"
                :key="item.id"
                class="border-l-2 border-accent-amber pl-3 text-sm"
              >
                <p class="text-text-primary">{{ item.text }}</p>
                <p class="text-xs text-text-dim">{{ item.source }}</p>
              </li>
            </ul>
          </article>

          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-text-dim">THREATS</p>
            <ul class="mt-3 space-y-2">
              <li
                v-for="item in swotAnalysis.threats"
                :key="item.id"
                class="border-l-2 border-text-dim pl-3 text-sm"
              >
                <p class="text-text-primary">{{ item.text }}</p>
                <p class="text-xs text-text-dim">{{ item.source }}</p>
              </li>
            </ul>
          </article>
        </div>

        <div class="mt-4 border border-accent-amber bg-accent-amber/10 p-4">
          <p class="text-xs tracking-widest text-accent-amber">ACTION ITEMS</p>
          <ul class="mt-3 space-y-2 text-sm text-text-secondary">
            <li class="flex items-start gap-2">
              <span class="text-accent-sky">+</span>
              <span>Leverage strengths để capture opportunities nhanh</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent-sky">+</span>
              <span>Address weaknesses trước khi scale</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent-coral">-</span>
              <span>Mitigate threats bằng cách build moat sớm</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-accent-coral">-</span>
              <span>Đừng để weaknesses trở thành threats</span>
            </li>
          </ul>
        </div>
      </section>

      <section
        class="animate-fade-up animate-delay-7 border border-border-default bg-bg-surface p-5 sm:p-6"
      >
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="text-sm tracking-widest text-accent-coral">//</span>
            Pet Bò Cố Vấn
          </h2>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center border border-accent-amber bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-amber transition-all duration-300 hover:bg-bg-elevated"
              @click="cowSpeakAboutOnePager"
            >
              Bò giải thích One-pager
            </button>
            <button
              type="button"
              class="inline-flex items-center border border-accent-sky bg-bg-deep px-3 py-2 font-display text-xs tracking-widest text-accent-sky transition-all duration-300 hover:bg-bg-elevated"
              @click="cowGiveContextTip"
            >
              Xin Tip Theo Context
            </button>
          </div>
        </div>
        <p class="mb-4 text-xs text-text-dim">
          Dùng pet này như trợ lý mini: hỏi nhanh về mục đích One-pager, pitch, pricing, rủi ro và
          cách hành động tiếp theo.
        </p>

        <div class="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-coral">COW STATUS</p>
            <div class="mt-2 flex items-start justify-between gap-3">
              <div>
                <p class="font-display text-2xl text-text-primary">Mood: {{ cowMood }}</p>
                <p class="text-xs text-text-secondary">Level {{ cowLevel }} | XP {{ cowXp }}</p>
              </div>
              <button
                type="button"
                class="relative flex cursor-pointer items-center justify-center pt-2 transition-all duration-300 hover:scale-105 hover:opacity-80"
                @click="interactWithCow"
              >
                <img
                  :src="currentCowUrl"
                  alt="Cow Mascot"
                  class="h-24 w-24 object-contain transition-all duration-300 drop-shadow-lg"
                  :class="
                    cowMood === 'Phân tích SWOT'
                      ? 'animate-bounce'
                      : cowMood === 'Sẵn sàng' ||
                          cowMood === 'Hứng khởi' ||
                          cowMood === 'Thông thái'
                        ? 'animate-pulse'
                        : cowMood === 'An ủi'
                          ? 'opacity-60 grayscale'
                          : ''
                  "
                />
              </button>
            </div>
            <div class="mt-3 h-2 w-full bg-bg-surface">
              <div
                class="h-2 bg-accent-coral transition-all duration-500"
                :style="{ width: `${cowLevelProgress}%` }"
              />
            </div>
            <p class="mt-2 text-xs text-text-dim">
              Mỗi hành động chơi/chát đúng flow sẽ tăng bond với Bò Cố Vấn.
            </p>
          </article>

          <article class="border border-border-default bg-bg-deep p-4">
            <p class="text-xs tracking-widest text-accent-amber">MISSION BOARD</p>
            <p class="mt-1 text-xs text-text-dim">
              Hoàn thành {{ cowMissionCompletedCount }}/{{ cowMissionBoard.length }} nhiệm vụ.
            </p>
            <ul class="mt-2 space-y-2">
              <li
                v-for="mission in cowMissionBoard"
                :key="mission.key"
                class="flex items-center justify-between border border-border-default bg-bg-surface px-2 py-1.5 text-xs"
              >
                <span class="text-text-secondary">{{ mission.title }}</span>
                <span
                  class="border px-2 py-0.5"
                  :class="
                    mission.done
                      ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                      : 'border-border-default text-text-dim'
                  "
                >
                  {{ mission.done ? 'Done' : 'Pending' }}
                </span>
              </li>
            </ul>
          </article>
        </div>

        <div class="border border-border-default bg-bg-deep p-4">
          <div class="mb-3 flex flex-wrap gap-2">
            <button
              v-for="prompt in cowQuickPrompts"
              :key="prompt"
              type="button"
              class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition-all duration-300 hover:border-accent-amber hover:bg-bg-elevated"
              @click="askCowWithPrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>

          <div
            class="max-h-64 space-y-2 overflow-y-auto border border-border-default bg-bg-surface p-3"
          >
            <article
              v-for="message in cowMessages"
              :key="message.id"
              class="border p-2 text-sm"
              :class="
                message.sender === 'cow'
                  ? 'border-accent-coral/40 bg-accent-coral/10 text-text-primary animate-fade-up'
                  : 'border-accent-sky/40 bg-accent-sky/10 text-text-primary'
              "
            >
              <p class="text-[11px] tracking-widest text-text-dim">
                {{ message.sender === 'cow' ? 'BO CO VAN' : 'BAN' }}
              </p>
              <p class="mt-1">{{ message.text }}</p>
            </article>
          </div>

          <form class="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]" @submit.prevent="askCow">
            <input
              v-model="cowInput"
              type="text"
              class="border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-all duration-300 focus:border-accent-coral"
              placeholder="Ví dụ: One-pager dùng để làm gì?"
            />
            <button
              type="submit"
              class="border border-accent-coral px-3 py-2 text-xs text-accent-coral transition-all duration-300 hover:bg-accent-coral/10"
            >
              Gửi cho Bò
            </button>
          </form>
        </div>
      </section>

      <footer class="animate-fade-up animate-delay-7 flex flex-wrap items-center gap-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
        <p class="text-xs text-text-dim">Made for vibe.j2team.org community challenge.</p>
      </footer>
    </div>
  </div>
</template>
