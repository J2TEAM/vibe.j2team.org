<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useLocalStorage, useClipboard, useTimeoutFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// ─── Types ───────────────────────────────────────────────────────────────────
type ScenarioDomain = 'career' | 'relationship' | 'finance' | 'learning' | 'random'

interface ScenarioLayer {
  core: string
  obstacle: string
  stake: string
  wildcard: string
}

interface Scenario {
  domain: ScenarioDomain
  layers: ScenarioLayer
}

type Phase = 'TUTORIAL' | 'SELECT' | 'DIFFICULTY' | 'PLAY' | 'OUTCOME'
type ActionKind = 'active' | 'standard' | 'observe' | 'signature'
type Difficulty = 'de' | 'thuong' | 'kho'

interface ResourceExplanation {
  mastery?: string
  energy?: string
  clarity?: string
  momentum?: string
  overall: string
}

interface ComparativeHint {
  vs_active?: string
  vs_standard?: string
  vs_observe?: string
  vs_sig?: string
  lesson: string
}

interface TwistEffect {
  kind: 'disable_action' | 'resource_delta' | 'none'
  target?: ActionKind
  delta?: Partial<Resources>
  message: string
}

interface Twist {
  text: string
  effect: TwistEffect
}

interface QuizOption {
  label: string
  hand: string
}

interface QuizQuestion {
  question: string
  options: QuizOption[]
}

interface Resources {
  energy: number
  clarity: number
  momentum: number
  mastery: number
}

interface PressureState {
  energy: boolean
  momentum: boolean
  clarity: boolean
  mastery: boolean
}

interface BlindspotPattern {
  trigger: ActionKind[]
  penalty: Partial<Resources>
  message: string
}

interface MentorVoiceConfig {
  normal: string
  pressure: string
  blindspot: string
  villain_avoided: string
}

interface VillainAction {
  id: string
  label: string
  description: string
  bias: string
  delta: Partial<Resources>
  consequence: string
  avoidBonus: Partial<Resources>
}
interface GameData {
  scenarioPool: Scenario[]
  resourceExplanations: Record<string, ResourceExplanation>
  comparativeHints: Record<string, ComparativeHint>
  mentorVoice: Record<string, MentorVoiceConfig>
  blindspotPatterns: Record<string, BlindspotPattern>
  villainActions: VillainAction[]
  actionInsights: Record<string, Record<ActionKind, string[]>>
  modelQuotes: Record<string, string>
}

interface ResourceDelta {
  energy?: number
  clarity?: number
  momentum?: number
  mastery?: number
}

interface Action {
  kind: ActionKind
  label: string
  description: string
  delta: ResourceDelta
  consequence: string
}

interface Hand {
  id: string
  icon: string
  color: string
  name: string
  tagline: string
  bio: string
  skills: string[]
  blindspot: string
  sigThreshold: number
  sigBody: string
  active: Action
  standard: Action
  observe: Action
  signature: Action
}

interface TurnRecord {
  turnIndex: number
  actionKind: ActionKind
}

interface OutcomeResult {
  quality: number
  finalMastery: number
  consistency: number
  grade: string
  gradeIcon: string
  insightUnlocked: boolean
}

interface ActionState {
  action: Action
  disabled: boolean
  disabledReason: string
}

interface ProgressData {
  gamesPlayed: number
  gamesPerHand: Record<string, number>
  bestScorePerHand: Record<string, number>
  unlockedHands: string[]
  completedDifficulties: Record<string, Difficulty[]>
}

interface DifficultyConfig {
  label: string
  totalTurns: number
  startResources: Resources
  hasTwist: boolean[]
  scoreMultiplier: number
  requiresCompletion: boolean
}

interface TutorialStep {
  title: string
  body: string
  highlight: string
}

// ─── Data: Hands ─────────────────────────────────────────────────────────────
const HANDS: Hand[] = [
  {
    id: 'first-principles',
    icon: '⚗',
    color: '#7F77DD',
    name: 'First Principles',
    tagline: 'The Dismantler',
    bio: 'Phá vỡ mọi giả định. Xây lại từ sự thật cốt lõi. Không chấp nhận "vì mọi người đều làm vậy".',
    skills: ['Tách biệt sự thật khỏi giả định', 'Tư duy từ nền tảng', 'Xây giải pháp gốc rễ'],
    blindspot: 'Kém hiệu quả khi áp lực thời gian cao — cần thời gian để Deconstruct đúng cách',
    sigThreshold: 40,
    sigBody:
      'Zero-Base Rebuild: Khi bạn loại bỏ mọi rào cản tưởng tượng và chỉ giữ lại những gì thực sự không thể thay đổi, không gian giải pháp mở ra rộng hơn bạn nghĩ. Câu hỏi không phải "làm sao cải thiện?" mà là "nếu xây lại từ đầu, tôi sẽ thiết kế thế nào?"',
    active: {
      kind: 'active',
      label: 'Deconstruct',
      description: 'Phá vỡ vấn đề thành các phần nguyên thủy, loại bỏ mọi giả định',
      delta: { energy: -2, clarity: 2, momentum: -5, mastery: 18 },
      consequence:
        'Bạn tách toàn bộ vấn đề ra từng lớp. Những gì tưởng chắc chắn hóa ra là giả định. Sự rõ ràng tăng vọt — nhưng năng lượng và sự tập trung của bạn đã tiêu hao đáng kể.',
    },
    standard: {
      kind: 'standard',
      label: 'Ground Truth',
      description: 'Xác định những sự thật không thể tranh cãi làm nền tảng quyết định',
      delta: { clarity: 1, mastery: 8 },
      consequence:
        'Bạn liệt kê những điều chắc chắn là thật. Không nhiều, nhưng đủ để đứng vững. Nền tảng được thiết lập.',
    },
    observe: {
      kind: 'observe',
      label: 'Map Assumptions',
      description: 'Lùi lại, ghi lại tất cả các giả định đang ảnh hưởng đến tình huống',
      delta: { momentum: -10, clarity: 3, mastery: 3 },
      consequence:
        'Bạn kiểm đếm từng giả định trong đầu. Có nhiều hơn bạn nghĩ. Đà tiến lên chậm lại nhưng thông tin rõ ràng hơn nhiều.',
    },
    signature: {
      kind: 'signature',
      label: 'Zero-Base Rebuild',
      description: 'Xóa bỏ toàn bộ khuôn mẫu cũ, xây lại từ những gì thực sự đúng',
      delta: { energy: -1, clarity: 4, mastery: 25 },
      consequence:
        'Bạn thực hiện rebuild hoàn toàn từ đầu. Bỏ qua mọi tiền lệ, mọi "cách chúng ta vẫn làm". Kết quả: một hướng đi nguyên bản, đúng từ gốc rễ.',
    },
  },
  {
    id: 'inversion',
    icon: '↩',
    color: '#378ADD',
    name: 'Inversion',
    tagline: "Devil's Advocate",
    bio: 'Thay vì hỏi "làm sao thành công?", hỏi "làm sao thất bại?". Sau đó tránh đi những con đường đó.',
    skills: ['Phân tích Pre-Mortem', 'Nhận diện các điểm thất bại', 'Đảo ngược vấn đề'],
    blindspot:
      'Cần sự lạc quan để thực thi — quá nhiều suy nghĩ ngược làm giảm đà tiến lên và ý chí hành động',
    sigThreshold: 40,
    sigBody:
      'Full Inversion: Thay vì hỏi "đâu là hướng đi tốt nhất?", hãy hỏi "đâu là tất cả những cách chúng ta có thể thất bại thảm hại?". Khi bạn biết rõ mọi con đường dẫn đến thất bại, con đường còn lại chính là hướng đi đúng.',
    active: {
      kind: 'active',
      label: 'Pre-Mortem',
      description: 'Tưởng tượng đã thất bại, làm việc ngược lại để tìm nguyên nhân',
      delta: { energy: -2, momentum: 0, mastery: 15 },
      consequence:
        'Bạn sống trong kịch bản thất bại hoàn toàn. Từ đó nhìn ngược lại thấy rõ đâu là điểm gãy. Đà tiến lên giữ nguyên — sự rõ ràng về con đường thất bại bù đắp lại cái giá của sự tập trung.',
    },
    standard: {
      kind: 'standard',
      label: 'Worst Case',
      description: 'Xác định kịch bản tệ nhất có thể xảy ra và khả năng chịu đựng',
      delta: { mastery: 8 },
      consequence:
        'Bạn nhìn thẳng vào kịch bản xấu nhất. Nó không dễ chịu, nhưng bây giờ nó không còn là ẩn số đáng sợ nữa.',
    },
    observe: {
      kind: 'observe',
      label: 'Failure Audit',
      description: 'Rà soát lại các kiểu thất bại tương tự trong quá khứ',
      delta: { momentum: -10, clarity: 3, mastery: 5 },
      consequence:
        'Bạn dành thời gian nhìn lại những lần tương tự trước đây. Có điểm chung. Đà tiến lên giảm nhưng bạn có dữ liệu thực.',
    },
    signature: {
      kind: 'signature',
      label: 'Full Inversion',
      description: 'Đảo ngược hoàn toàn vấn đề — tìm mọi con đường thất bại rồi loại trừ',
      delta: { energy: -1, clarity: 3, momentum: 5, mastery: 22 },
      consequence:
        'Bạn vẽ lại toàn bộ bức tranh thất bại. Sau đó xác định con đường duy nhất còn lại. Nghịch lý thay, nhìn vào mảng tối đã tạo ra sự rõ ràng nhất.',
    },
  },
  {
    id: 'second-order',
    icon: '♟',
    color: '#1D9E75',
    name: 'Second-Order Thinking',
    tagline: 'The Chessmaster',
    bio: 'Mọi hành động đều có hệ quả. Mọi hệ quả đều tạo ra hệ quả tiếp theo. Bạn đang chơi cờ vua, không phải cờ đam.',
    skills: ['Dự đoán hiệu ứng dây chuyền', 'Bản đồ người liên quan', 'Chiến lược dài hạn'],
    blindspot: 'Áp lực thời gian cao dẫn đến sự tê liệt — quá nhiều biến số cần xử lý đồng thời',
    sigThreshold: 40,
    sigBody:
      'Butterfly Effect: Một quyết định nhỏ hôm nay tạo ra hệ quả bậc hai, bậc ba và bậc tư mà bạn sẽ không thấy trong 6 tháng tới. Câu hỏi không phải "điều này có tốt không?" mà là "3 năm nữa, ai sẽ bị ảnh hưởng và nhân quả dây chuyền sẽ trông như thế nào?"',
    active: {
      kind: 'active',
      label: 'Consequence Chain',
      description: 'Truy theo chuỗi hệ quả: nếu A, thì B; nếu B, thì C; ...',
      delta: { energy: -2, momentum: -5, mastery: 15 },
      consequence:
        'Bạn lần theo từng bước: hành động này → hệ quả này → hệ quả tiếp theo. Sau 5 bước bạn thấy điều không ai khác thấy — nhưng sự tập trung cao độ tiêu hao đà tiến lên.',
    },
    standard: {
      kind: 'standard',
      label: 'Next-Turn View',
      description: 'Nhìn xa hơn một bước: sau hành động này, trạng thái tiếp theo sẽ là gì?',
      delta: { mastery: 8 },
      consequence:
        'Bạn dừng lại đủ lâu để nhìn bước tiếp theo. Không phải 5 bước, chỉ một bước — nhưng đó là bước quan trọng nhất.',
    },
    observe: {
      kind: 'observe',
      label: 'Stakeholder Map',
      description: 'Vẽ bản đồ ai bị ảnh hưởng và như thế nào theo thời gian',
      delta: { momentum: -10, clarity: 3, mastery: 5 },
      consequence:
        'Bạn liệt kê từng bên liên quan và tác động theo thời gian. Phức tạp hơn bạn nghĩ. Đà tiến lên chậm lại nhưng bức tranh rõ ràng hơn nhiều.',
    },
    signature: {
      kind: 'signature',
      label: 'Butterfly Effect',
      description: 'Mô phỏng toàn bộ hiệu ứng dây chuyền, từ 3 bậc hệ quả trở lên',
      delta: { energy: -1, clarity: 3, mastery: 23 },
      consequence:
        'Bạn lần theo chuỗi hệ quả đến bậc ba và bậc tư. Một số người bị ảnh hưởng không ai nghĩ đến. Một số rủi ro hóa ra không có thật. Bức tranh thực sự lộ diện.',
    },
  },
  {
    id: 'occams-razor',
    icon: '✂',
    color: '#BA7517',
    name: "Occam's Razor",
    tagline: 'The Surgeon',
    bio: 'Khi có nhiều cách giải thích hợp lý, hãy chọn cái đơn giản nhất. Sự phức tạp là kẻ thù của thực thi.',
    skills: ['Loại bỏ nhiễu', 'Singular Focus', 'Radical Simplification'],
    blindspot:
      'Nguy hiểm với các hệ thống phức tạp luôn thích nghi — đơn giản hóa quá mức sẽ bỏ sót biến số quan trọng',
    sigThreshold: 35,
    sigBody:
      "Radical Simplification: Sau khi cắt bỏ mọi thứ không cần thiết, câu hỏi tiếp theo là: còn có thể cắt thêm gì không? Occam's Razor dạy rằng giải pháp đúng thường không phải là giải pháp phức tạp nhất — mà là giải pháp đơn giản nhất vẫn giải quyết được vấn đề cốt lõi.",
    active: {
      kind: 'active',
      label: 'Cut the Noise',
      description: 'Mạnh tay loại bỏ mọi thứ không thiết yếu',
      delta: { energy: -1, momentum: 10, mastery: 12 },
      consequence:
        'Bạn cắt bỏ không do dự. Một nửa những gì tưởng là cần thiết hóa ra là nhiễu. Đà tiến lên tăng — con đường phía trước bỗng rõ ràng hơn.',
    },
    standard: {
      kind: 'standard',
      label: 'Singular Focus',
      description: 'Chọn một điểm then chốt duy nhất cần giải quyết',
      delta: { momentum: 8, mastery: 8 },
      consequence:
        'Bạn xác định điều quan trọng nhất. Một điều thôi. Và quyết định tập trung toàn lực vào đó.',
    },
    observe: {
      kind: 'observe',
      label: 'Simplicity Audit',
      description: 'Kiểm tra xem đang tạo ra sự phức tạp không cần thiết ở đâu',
      delta: { momentum: -5, clarity: 2, mastery: 5 },
      consequence:
        'Bạn nhìn lại xem đang phức tạp hóa điều gì. Câu trả lời: khá nhiều. Một chút đà tiến đên giảm nhưng bạn tìm ra những nơi cần đơn giản hóa.',
    },
    signature: {
      kind: 'signature',
      label: 'Radical Simplification',
      description: 'Loại bỏ tất cả — chỉ giữ lại điều thiết yếu nhất',
      delta: { energy: -1, momentum: 12, clarity: 2, mastery: 20 },
      consequence:
        'Bạn thực hiện Radical Simplification. Bỏ đi những gì tưởng là không thể bỏ. Điều còn lại: một giải pháp đơn giản đến mức tưởng hiển nhiên — nhưng không ai làm vì sợ "quá đơn giản".',
    },
  },
  {
    id: 'sys',
    icon: '◈',
    color: '#0F6E56',
    name: 'Systems Thinking',
    tagline: 'The Ecologist',
    bio: 'Không có vấn đề nào tồn tại độc lập. Nhìn mọi thứ như một hệ thống với vòng phản hồi và độ trễ. Thấy mạng nhện khi người khác thấy sợi dây. Mạnh nhất khi kết hợp với model khác — synergy nhân đôi.',
    skills: ['Bản đồ hệ thống', 'Vòng phản hồi', 'Tư duy mạng lưới'],
    blindspot:
      'Khi cần hành động ngay lập tức — thấy quá nhiều mối liên hệ khiến không thể chọn điểm bắt đầu.',
    sigThreshold: 40,
    sigBody:
      'Emergence Protocol: Nhìn thấy giải pháp sẽ tự nảy sinh từ hệ thống — không cần ép buộc. Vượt qua mọi trở ngại trong 1 lượt.',
    active: {
      kind: 'active',
      label: 'Map the Web',
      description: 'Vẽ toàn bộ vòng phản hồi và mối liên hệ của tình huống',
      delta: { energy: -2, momentum: -5, clarity: 3, mastery: 18 },
      consequence:
        'Bạn lập sơ đồ toàn bộ các lặp phản hồi và mạng lưới. Bạn thấy được toàn cục, nhưng tiêu hao không ít năng lượng và đà tiến lên.',
    },
    standard: {
      kind: 'standard',
      label: 'Find the Loop',
      description: 'Xác định vòng phản hồi chủ chốt — củng cố hay cân bằng?',
      delta: { mastery: 8 },
      consequence:
        'Bạn xác định chính xác vòng phản hồi nào đang kiểm soát hệ thống. Lựa chọn an toàn, luôn phù hợp.',
    },
    observe: {
      kind: 'observe',
      label: 'Network Scan',
      description: 'Lập danh sách tất cả bên bị ảnh hưởng gián tiếp',
      delta: { momentum: -10, clarity: 3 },
      consequence:
        'Bạn theo dõi toàn bộ các ảnh hưởng vòng ngoài. Đà tiến lên giảm lại đáng kể để đổi lấy thông tin bao quát hơn.',
    },
    signature: {
      kind: 'signature',
      label: 'Emergence Protocol',
      description: 'Nhìn thấy giải pháp tự nảy sinh từ hệ thống — không ép buộc',
      delta: { energy: -1, clarity: 4, mastery: 25 },
      consequence:
        'Bạn để hệ thống tự vận hành và dẫn lối mà không cản trở. Mọi trở ngại tự động cân bằng và tự giải quyết.',
    },
  },
  {
    id: 'bay',
    icon: '◎',
    color: '#185FA5',
    name: 'Bayesian Thinking',
    tagline: 'The Probabilist',
    bio: 'Niềm tin là xác suất, không phải sự thật tuyệt đối. Không giữ nguyên quan điểm khi có bằng chứng mới. Liên tục cập nhật ước lượng dựa trên dữ liệu thực tế. Không bao giờ chắc chắn 100% — nhưng luôn chính xác hơn.',
    skills: ['Cập nhật niềm tin', 'Tỷ lệ nền', 'Ước lượng xác suất'],
    blindspot: 'Khi cần quyết định dứt khoát và nhanh — luôn muốn thêm dữ liệu trước khi kết luận.',
    sigThreshold: 45,
    sigBody:
      'Bayesian Update: Cập nhật toàn bộ ước lượng dựa trên bằng chứng mới nhất. Đảo ngược một quyết định sai trước đó nếu data không ủng hộ.',
    active: {
      kind: 'active',
      label: 'Prior Check',
      description: 'Đặt câu hỏi: niềm tin hiện tại của tôi dựa trên bằng chứng nào?',
      delta: { energy: -2, momentum: -5, clarity: 2, mastery: 18 },
      consequence:
        'Bạn lật lại niềm tin trước đây. Nhiều thứ chỉ là thói quen vô thức. Bạn tiêu hao đà nhưng buộc phải nhìn nhận thực tế chuẩn xác hơn.',
    },
    standard: {
      kind: 'standard',
      label: 'Evidence Scan',
      description: 'Thu thập bằng chứng có thực trước khi đưa ra nhận định',
      delta: { clarity: 1, mastery: 8 },
      consequence:
        'Bạn tìm kiếm và xác minh được mảnh ghép nhỏ của sự thật có thực. Ổn định và an toàn.',
    },
    observe: {
      kind: 'observe',
      label: 'Base Rate Check',
      description: 'Tìm tỷ lệ nền — điều này thường xảy ra như thế nào?',
      delta: { momentum: -10, clarity: 3 },
      consequence:
        'Bạn quy chiếu sự việc về tần suất xảy ra phổ biến nhất. Khựng lại một nhịp dài nhưng bạn có cơ sở dữ liệu nền cứng cáp.',
    },
    signature: {
      kind: 'signature',
      label: 'Bayesian Update',
      description: 'Cập nhật toàn bộ ước lượng và đảo ngược nếu cần',
      delta: { energy: -2, clarity: 4, mastery: 25 },
      consequence:
        'Bạn đập bỏ niềm tin cũ thiếu căn cứ và dũng cảm đảo ngược quyết định mấu chốt dựa vào bằng chứng mới.',
    },
  },
  {
    id: 'mc',
    icon: '◐',
    color: '#534AB7',
    name: 'Mental Contrasting',
    tagline: 'The Architect',
    bio: 'Nhìn rõ đích đến lẫn chướng ngại vật. Không lạc quan mù quáng cũng không bi quan. Visualize mục tiêu thực tế, anticipate trở ngại cụ thể, tạo kế hoạch if-then. Lý tưởng cho người mới bắt đầu.',
    skills: ['Wish-Outcome', 'Trở ngại thực tế', 'If-Then Plan'],
    blindspot:
      'Khi cần giải pháp đột phá hoặc tư duy phi tuyến — Quá có cấu trúc để tạo ra ý tưởng hoàn toàn mới.',
    sigThreshold: 35,
    sigBody:
      'WOOP Frame: Wish → Outcome → Obstacle → Plan. Tạo kế hoạch if-then cụ thể cho mọi trở ngại. Tăng toàn bộ resource.',
    active: {
      kind: 'active',
      label: 'Obstacle Map',
      description: 'Liệt kê trở ngại thực tế ngăn cản mục tiêu',
      delta: { energy: -1, momentum: -5, clarity: 2, mastery: 15 },
      consequence:
        'Bạn phác thảo rõ ràng các rào cản. Hao hụt năng lượng ít nhưng đủ để vạch ra chiến lược dài hơi.',
    },
    standard: {
      kind: 'standard',
      label: 'If-Then Plan',
      description: 'Tạo một kế hoạch dự phòng cụ thể cho trở ngại rõ nhất',
      delta: { mastery: 8 },
      consequence:
        'Bạn nhanh chóng lên xong kịch bản phòng hờ. Cảm giác kiểm soát được duy trì mạnh mẽ.',
    },
    observe: {
      kind: 'observe',
      label: 'Reality Check',
      description: 'So sánh kỳ vọng với thực tế hiện tại',
      delta: { momentum: -10, clarity: 3 },
      consequence:
        'Bạn đánh giá sự lệch pha giữa kế hoạch và hiện tại. Nó làm đà bị chậm lại đáng kể để nhìn rõ mặt đất đang đứng.',
    },
    signature: {
      kind: 'signature',
      label: 'WOOP Frame',
      description: 'Trình tự Wish-Outcome-Obstacle-Plan toàn diện',
      delta: { energy: 3, momentum: 3, clarity: 3, mastery: 15 },
      consequence:
        'Mọi mục tiêu, trở ngại và dự phòng liền mạch thành một thiết kế thống nhất. Các chỉ số được tái tạo tràn trề.',
    },
  },
]

// ─── Data: Decks ─────────────────────────────────────────────────────────────

const TWISTS: Twist[] = [
  {
    text: 'Một bên liên quan quan trọng vừa thay đổi lập trường hoàn toàn.',
    effect: {
      kind: 'resource_delta',
      delta: { momentum: -2 },
      message: 'Mất 2 Momentum vì phải xây dựng lại sự đồng thuận',
    },
  },
  {
    text: 'Thông tin bạn dùng để quyết định vừa bị bác bỏ.',
    effect: {
      kind: 'resource_delta',
      delta: { clarity: -3 },
      message: 'Mất 3 Clarity — những gì bạn biết vừa trở nên vô dụng',
    },
  },
  {
    text: 'Thời hạn bị kéo ngắn lại 50%.',
    effect: {
      kind: 'disable_action',
      target: 'observe',
      message: 'Không còn thời gian Quan sát — phải hành động ngay',
    },
  },
  {
    text: 'Một lựa chọn bạn đã bỏ qua vừa trở nên khả dụng lại.',
    effect: {
      kind: 'resource_delta',
      delta: { energy: 2 },
      message: 'Thêm 2 Energy — có thêm lựa chọn mở ra',
    },
  },
  {
    text: 'Đồng minh của bạn đang xử lý khủng hoảng riêng — không thể hỗ trợ.',
    effect: {
      kind: 'resource_delta',
      delta: { momentum: -3, energy: -1 },
      message: 'Mất 3 Momentum và 1 Energy — phải xử lý một mình',
    },
  },
  {
    text: 'Kết quả hành động trước vừa lộ diện — khác với dự đoán.',
    effect: {
      kind: 'resource_delta',
      delta: { clarity: -2, mastery: -5 },
      message: 'Mất 2 Clarity và 5 Mastery — phải tính toán lại',
    },
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

const PRESSURE_THRESHOLDS = {
  energy: { danger: 2, label: 'Kiệt sức', effect: 'active_penalty_double' },
  momentum: { danger: 2, label: 'Mất đà', effect: 'standard_no_bonus' },
  clarity: { danger: 8, label: 'Phân tích tê liệt', effect: 'observe_backfire' },
  mastery: { danger: 10, label: 'Mất tự tin', effect: 'all_actions_weak' },
}

const QUIZ_DATA: QuizQuestion[] = [
  {
    question: 'Khi gặp vấn đề, bạn thường làm gì đầu tiên?',
    options: [
      { label: 'Hỏi: tại sao vấn đề này thực sự tồn tại?', hand: 'first-principles' },
      { label: 'Hỏi: điều tệ nhất có thể xảy ra là gì?', hand: 'inversion' },
      { label: 'Hỏi: 3 bước tiếp theo sẽ diễn ra như thế nào?', hand: 'second-order' },
    ],
  },
  {
    question: 'Điểm mạnh bạn tin mình có nhất là gì?',
    options: [
      { label: 'Loại bỏ thứ không cần thiết nhanh chóng', hand: 'occams-razor' },
      { label: 'Nhìn thấy mối liên hệ giữa mọi thứ', hand: 'sys' },
      { label: 'Lên kế hoạch chi tiết trước khi hành động', hand: 'mc' },
    ],
  },
  {
    question: 'Bạn đưa ra quyết định dựa trên điều gì?',
    options: [
      { label: 'Bằng chứng và xác suất cụ thể', hand: 'bay' },
      { label: 'Nguyên lý cơ bản không thể sai', hand: 'first-principles' },
      { label: 'Kịch bản tương lai có thể xảy ra', hand: 'second-order' },
    ],
  },
]

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  de: {
    label: 'Dễ',
    totalTurns: 5,
    startResources: { energy: 6, clarity: 4, momentum: 8, mastery: 0 },
    hasTwist: [false, false, false, false, false],
    scoreMultiplier: 0.8,
    requiresCompletion: false,
  },
  thuong: {
    label: 'Thường',
    totalTurns: 4,
    startResources: { energy: 5, clarity: 3, momentum: 7, mastery: 0 },
    hasTwist: [false, false, true, false],
    scoreMultiplier: 1.0,
    requiresCompletion: false,
  },
  kho: {
    label: 'Khó',
    totalTurns: 3,
    startResources: { energy: 4, clarity: 2, momentum: 5, mastery: 0 },
    hasTwist: [false, true, true],
    scoreMultiplier: 1.3,
    requiresCompletion: true,
  },
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Mental Model là gì?',
    body: 'Đây là các lăng kính tư duy — cùng một tình huống nhưng mỗi người nhìn theo cách khác nhau và đưa ra quyết định khác nhau. Game này cho bạn trải nghiệm 7 cách tư duy khác nhau.',
    highlight: '',
  },
  {
    title: 'Chọn Bàn Tay Vàng',
    body: "Mỗi mô hình là một nhân vật với bộ kỹ năng riêng. Bạn sẽ dùng kỹ năng của nhân vật đó để xử lý tình huống. Bắt đầu với The Dismantler hoặc Devil's Advocate — hai mô hình dễ hiểu nhất.",
    highlight: '',
  },
  {
    title: 'Xử lý tình huống',
    body: 'Mỗi ván có 3-5 lượt. Mỗi lượt bạn đọc tình huống và chọn 1 trong 3 hành động: Kỹ năng chủ động (mạnh nhất, tốn Energy), Tiêu chuẩn (an toàn), hoặc Quan sát (tăng thông tin nhưng mất đà). Hãy chú ý đến 4 thanh resource — chúng ảnh hưởng đến kết quả.',
    highlight: '',
  },
  {
    title: 'Xem kết quả và học',
    body: 'Sau mỗi ván, bạn thấy điểm Outcome, Mastery và Consistency. Insight xuất hiện khi Mastery đủ cao — đây là phần học thật sự. Thử lại cùng tình huống với mô hình khác để thấy sự khác biệt.',
    highlight: '',
  },
]

// ─── State ───────────────────────────────────────────────────────────────────
const progress = useLocalStorage<ProgressData>('mma-progress', {
  gamesPlayed: 0,
  gamesPerHand: {},
  bestScorePerHand: {},
  unlockedHands: ['first-principles', 'inversion'],
  completedDifficulties: {},
})

const tutorialSeen = useLocalStorage('mma-tutorial', false)
const tutorialStep = ref(0)
const selectedDifficulty = ref<Difficulty>('thuong')

const gameData = ref<GameData | null>(null)
const dataLoaded = ref(false)

onMounted(async () => {
  try {
    const resp = await fetch('/mental-model-arena/data.json')
    gameData.value = await resp.json()
    dataLoaded.value = true
  } catch (e) {
    console.error('Failed to load game data', e)
  }
})

const phase = ref<Phase>(tutorialSeen.value ? 'SELECT' : 'TUTORIAL')

const selectedHand = ref<Hand | null>(null)
const resources = ref<Resources>({ energy: 5, clarity: 3, momentum: 7, mastery: 0 })

const scenario = ref('')
const escalation = ref('')

const selectedDomain = ref<ScenarioDomain>('random')
const currentScenario = ref<Scenario | null>(null)
const visibleLayers = ref<string[]>([])
const isScenarioExpanding = ref<boolean>(false)

const twist = ref<Twist | null>(null)
const twistInjected = ref(false)
const twistDisabledAction = ref<ActionKind | null>(null)

const recentActions = ref<ActionKind[]>([])
const blindspotTriggered = ref<boolean>(false)
const mentorMessage = ref<string>('')

const currentVillain = ref<VillainAction | null>(null)
const selectedVillain = ref<VillainAction | null>(null)
const villainAvoided = ref<boolean>(false)
const villainChosen = ref<boolean>(false)
const villainTurns = ref<number[]>([])

const showQuiz = ref(false)
const quizStep = ref(0)
const quizAnswers = ref<string[]>([])
const suggestedHand = ref<string | null>(null)
const showStatsBars = ref(false)
const hasSkippedQuiz = ref(false)

function checkInitialQuiz() {
  if (progress.value.gamesPlayed === 0 && quizAnswers.value.length === 0 && !hasSkippedQuiz.value) {
    showQuiz.value = true
  }
}

const turn = ref(0) // 0-based, 0..3 = turns 1-4
const hasUsedSig = ref(false)
const selectedAction = ref<Action | null>(null)
const showConsequence = ref(false)
const turnHistory = ref<TurnRecord[]>([])

const outcome = ref<OutcomeResult | null>(null)

// Trade-off state
const lastActionWasObserve = ref(false)
const activeWarning = ref('')
const observeHint = ref('')
const standardBonus = ref(false)
const currentInsight = ref('')

// Share + expand state
const copyState = ref<'idle' | 'copied'>('idle')
const expandedHands = ref<Set<string>>(new Set())

// ─── Computed ─────────────────────────────────────────────────────────────────
const currentPressureState = computed<PressureState>(() => ({
  energy: resources.value.energy <= PRESSURE_THRESHOLDS.energy.danger,
  momentum: resources.value.momentum <= PRESSURE_THRESHOLDS.momentum.danger,
  clarity: resources.value.clarity >= PRESSURE_THRESHOLDS.clarity.danger,
  mastery: resources.value.mastery <= PRESSURE_THRESHOLDS.mastery.danger,
}))

const isUnderPressure = computed(() => Object.values(currentPressureState.value).some(Boolean))

const villainShouldAppear = computed(() => {
  return (
    phase.value === 'PLAY' &&
    !showConsequence.value &&
    currentVillain.value !== null &&
    turn.value >= 1
  )
})

const sigUnlocked = computed(() => {
  const hand = selectedHand.value
  if (!hand) return false
  return resources.value.mastery >= hand.sigThreshold && !hasUsedSig.value
})

const actionStates = computed((): ActionState[] => {
  const hand = selectedHand.value
  if (!hand) return []
  const r = resources.value
  const states: ActionState[] = [
    {
      action: hand.active,
      disabled: r.energy + (hand.active.delta.energy ?? 0) < 0,
      disabledReason: 'Không đủ năng lượng',
    },
    { action: hand.standard, disabled: false, disabledReason: '' },
    { action: hand.observe, disabled: false, disabledReason: '' },
  ]
  if (r.mastery >= hand.sigThreshold && !hasUsedSig.value) {
    states.push({
      action: hand.signature,
      disabled: r.momentum < 5,
      disabledReason: 'Cần mức Momentum ≥ 5 để tung Tuyệt chiêu',
    })
  }

  // Handle twist disable override
  return states.map((s) => {
    if (s.action.kind === twistDisabledAction.value) {
      return { ...s, disabled: true, disabledReason: '🚫 Bị khóa bởi Twist' }
    }
    return s
  })
})

const energyBarWidth = computed(() => `${(resources.value.energy / 5) * 100}%`)
const clarityBarWidth = computed(() => `${(resources.value.clarity / 10) * 100}%`)
const momentumBarWidth = computed(() => `${(resources.value.momentum / 10) * 100}%`)
const masteryBarWidth = computed(() => `${resources.value.mastery}%`)

const activeFeedbackKey = computed(() => {
  if (!selectedHand.value || !selectedAction.value) return ''
  return `${selectedHand.value.id}__${selectedAction.value.kind}`
})

const currentResourceExpl = computed(
  () => gameData.value?.resourceExplanations?.[activeFeedbackKey.value],
)
const currentCompHint = computed(() => gameData.value?.comparativeHints?.[activeFeedbackKey.value])

const bestMissedActionRef = computed(() => {
  const hand = selectedHand.value
  const current = selectedAction.value
  if (!hand || !current) return null

  let bestActionKind: string | null = null
  let maxMastery = -Infinity

  const candidates: Action[] = [hand.active, hand.standard, hand.observe]
  if (resources.value.mastery >= hand.sigThreshold) {
    candidates.push(hand.signature)
  }

  for (const a of candidates) {
    if (a.kind === current.kind) continue
    const deltaM = a.delta.mastery ?? 0
    if (deltaM > maxMastery) {
      maxMastery = deltaM
      bestActionKind = a.kind
    }
  }

  return bestActionKind ? `vs_${bestActionKind === 'signature' ? 'sig' : bestActionKind}` : null
})

const comparativeHintText = computed(() => {
  if (!currentCompHint.value || !bestMissedActionRef.value) return ''
  return currentCompHint.value[bestMissedActionRef.value as keyof ComparativeHint] ?? ''
})

// ─── Logic ────────────────────────────────────────────────────────────────────
function generateScenario(): void {
  const pool =
    selectedDomain.value === 'random'
      ? gameData.value?.scenarioPool || []
      : gameData.value?.scenarioPool?.filter((s) => s.domain === selectedDomain.value) || []

  const picked = pool[Math.floor(Math.random() * pool.length)]!
  currentScenario.value = picked
  visibleLayers.value = [picked.layers.core]
  scenario.value = picked.layers.core // backward compat
}

function pickHand(hand: Hand) {
  selectedHand.value = hand
  phase.value = 'DIFFICULTY'
}

function nextTutorialStep() {
  if (tutorialStep.value < TUTORIAL_STEPS.length - 1) {
    tutorialStep.value++
  } else {
    tutorialSeen.value = true
    phase.value = 'SELECT'
    checkInitialQuiz()
  }
}

function skipTutorial() {
  tutorialSeen.value = true
  phase.value = 'SELECT'
  checkInitialQuiz()
}

function reviewTutorial() {
  tutorialStep.value = 0
  phase.value = 'TUTORIAL'
}

function backToSelect() {
  phase.value = 'SELECT'
  selectedDifficulty.value = 'thuong'
  checkInitialQuiz()
}

function answerQuiz(handId: string) {
  quizAnswers.value.push(handId)
  if (quizStep.value < QUIZ_DATA.length - 1) {
    quizStep.value++
  } else {
    const freq = quizAnswers.value.reduce((acc: Record<string, number>, h) => {
      acc[h] = (acc[h] || 0) + 1
      return acc
    }, {})
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]![0]

    suggestedHand.value = progress.value.unlockedHands.includes(best)
      ? best
      : (progress.value.unlockedHands[0] ?? null)
    showQuiz.value = false
  }
}

function skipQuiz() {
  showQuiz.value = false
  hasSkippedQuiz.value = true
  suggestedHand.value = null
}

function resetQuiz() {
  quizStep.value = 0
  quizAnswers.value = []
  suggestedHand.value = null
  hasSkippedQuiz.value = false
  showQuiz.value = true
}

function startPlay(diff: Difficulty) {
  selectedDifficulty.value = diff
  const config = DIFFICULTY_CONFIG[diff]
  resources.value = { ...config.startResources }
  turn.value = 0
  hasUsedSig.value = false
  selectedAction.value = null
  showConsequence.value = false
  turnHistory.value = []
  outcome.value = null
  generateScenario()
  twist.value = pick(TWISTS)
  twistInjected.value = false
  recentActions.value = []
  blindspotTriggered.value = false
  mentorMessage.value = ''

  currentVillain.value = null
  selectedVillain.value = null
  villainAvoided.value = false
  villainChosen.value = false
  villainTurns.value = []

  for (let i = 1; i < config.totalTurns; i++) {
    if (config.hasTwist[i]) continue
    if (villainTurns.value.includes(i - 1)) continue
    if (villainTurns.value.length >= 2) break
    if (Math.random() < 0.3) {
      villainTurns.value.push(i)
    }
  }

  phase.value = 'PLAY'
}

function chooseAction(action: Action) {
  if (showConsequence.value) return
  const hand = selectedHand.value
  if (!hand) return
  const r = resources.value

  let avoidMastery = 0
  let avoidClarity = 0
  let avoidMomentum = 0
  let avoidEnergy = 0

  if (currentVillain.value !== null) {
    const vBonus = currentVillain.value.avoidBonus
    avoidEnergy = vBonus.energy ?? 0
    avoidClarity = vBonus.clarity ?? 0
    avoidMomentum = vBonus.momentum ?? 0
    avoidMastery = vBonus.mastery ?? 0

    villainAvoided.value = true
    selectedVillain.value = currentVillain.value
    currentVillain.value = null
  }

  // Reset modifier flags
  activeWarning.value = ''
  observeHint.value = ''
  standardBonus.value = false

  // A) Cập nhật recentActions
  recentActions.value.push(action.kind)
  if (recentActions.value.length > 3) {
    recentActions.value = recentActions.value.slice(-3)
  }

  // B) Check blindspot pattern
  const pattern = gameData.value?.blindspotPatterns?.[hand.id]
  blindspotTriggered.value = false
  let penaltyToApply: Partial<Resources> = {}

  if (pattern) {
    const triggerLen = pattern.trigger.length
    if (recentActions.value.length >= triggerLen) {
      const recentSlice = recentActions.value.slice(-triggerLen)
      const isMatch = recentSlice.every((val, idx) => val === pattern.trigger[idx])
      if (isMatch) {
        blindspotTriggered.value = true
        penaltyToApply = pattern.penalty
      }
    }
  }

  let masteryGain = action.delta.mastery ?? 0
  let clarityGain = action.delta.clarity ?? 0

  const pressure = currentPressureState.value

  // C) Pressure Effects
  if (pressure.energy && action.kind === 'active') {
    masteryGain = Math.floor(masteryGain * 0.5)
  }

  let applyStandardBonus = true
  if (pressure.momentum && action.kind === 'standard') {
    applyStandardBonus = false
  }

  if (pressure.clarity && action.kind === 'observe') {
    masteryGain -= 5
  }

  if (pressure.mastery) {
    masteryGain = Math.floor(masteryGain * 0.7)
  }

  // Existing logic fallback
  if (action.kind === 'active' && r.momentum < 3 && !pressure.energy) {
    masteryGain = Math.floor(masteryGain / 2)
    activeWarning.value = 'Đà đang thấp — khó tập trung'
  }

  if (action.kind === 'observe' && r.clarity >= 8 && clarityGain > 0 && !pressure.clarity) {
    clarityGain = 0
    observeHint.value = 'Thông tin đã đủ — quan sát thêm không có ích'
  }

  if (action.kind === 'standard' && lastActionWasObserve.value && applyStandardBonus) {
    masteryGain += 5
    standardBonus.value = true
  }

  resources.value = {
    energy: clamp(
      r.energy + (action.delta.energy ?? 0) + (penaltyToApply.energy ?? 0) + avoidEnergy,
      0,
      5,
    ),
    clarity: clamp(r.clarity + clarityGain + (penaltyToApply.clarity ?? 0) + avoidClarity, 0, 10),
    momentum: clamp(
      r.momentum + (action.delta.momentum ?? 0) + (penaltyToApply.momentum ?? 0) + avoidMomentum,
      0,
      10,
    ),
    mastery: clamp(r.mastery + masteryGain + (penaltyToApply.mastery ?? 0) + avoidMastery, 0, 100),
  }

  // D) Generate Mentor Message
  const voice = gameData.value?.mentorVoice?.[hand.id]
  if (blindspotTriggered.value) {
    mentorMessage.value = voice?.blindspot ?? ''
  } else if (isUnderPressure.value) {
    mentorMessage.value = voice?.pressure ?? ''
  } else {
    mentorMessage.value = voice?.normal ?? ''
  }

  if (action.kind === 'signature') hasUsedSig.value = true
  lastActionWasObserve.value = action.kind === 'observe'

  const insightPool = gameData.value?.actionInsights?.[hand.id]?.[action.kind] ?? []
  currentInsight.value = insightPool.length > 0 ? pick(insightPool) : ''

  selectedAction.value = action
  turnHistory.value.push({ turnIndex: turn.value, actionKind: action.kind })
  twistDisabledAction.value = null
  showConsequence.value = true
}

function chooseVillain(villain: VillainAction) {
  const r = resources.value
  resources.value = {
    energy: clamp(r.energy + (villain.delta.energy ?? 0), 0, 5),
    clarity: clamp(r.clarity + (villain.delta.clarity ?? 0), 0, 10),
    momentum: clamp(r.momentum + (villain.delta.momentum ?? 0), 0, 10),
    mastery: clamp(r.mastery + (villain.delta.mastery ?? 0), 0, 100),
  }
  selectedVillain.value = villain
  villainChosen.value = true
  currentVillain.value = null

  const hand = selectedHand.value
  if (hand) {
    const voice = gameData.value?.mentorVoice?.[hand.id]
    mentorMessage.value = voice?.pressure ?? ''
  }
  showConsequence.value = true
  selectedAction.value = null
}

function nextTurn() {
  showConsequence.value = false
  selectedAction.value = null

  const config = DIFFICULTY_CONFIG[selectedDifficulty.value]

  if (turn.value >= config.totalTurns - 1) {
    computeOutcome()
    return
  }

  turn.value += 1

  currentVillain.value = null
  selectedVillain.value = null
  villainAvoided.value = false
  villainChosen.value = false

  // Progressive reveal mapping
  const layers = currentScenario.value?.layers
  if (layers) {
    if (config.totalTurns <= 3) {
      // Hard difficulty
      if (turn.value === 1) {
        visibleLayers.value = [layers.core, layers.obstacle, layers.stake]
        isScenarioExpanding.value = true
        setTimeout(() => (isScenarioExpanding.value = false), 2000)
      } else if (turn.value >= 2) {
        if (!visibleLayers.value.includes(layers.wildcard)) {
          visibleLayers.value = [layers.core, layers.obstacle, layers.stake, layers.wildcard]
          isScenarioExpanding.value = true
          setTimeout(() => (isScenarioExpanding.value = false), 2000)
        }
      }
    } else {
      // Easy/Normal difficulty
      if (turn.value === 1) {
        visibleLayers.value = [layers.core, layers.obstacle]
        isScenarioExpanding.value = true
        setTimeout(() => (isScenarioExpanding.value = false), 2000)
      } else if (turn.value === 2) {
        visibleLayers.value = [layers.core, layers.obstacle, layers.stake]
        isScenarioExpanding.value = true
        setTimeout(() => (isScenarioExpanding.value = false), 2000)
      } else if (turn.value >= 3) {
        if (!visibleLayers.value.includes(layers.wildcard)) {
          visibleLayers.value = [layers.core, layers.obstacle, layers.stake, layers.wildcard]
          isScenarioExpanding.value = true
          setTimeout(() => (isScenarioExpanding.value = false), 2000)
        }
      }
    }
  }

  if (villainTurns.value.includes(turn.value)) {
    currentVillain.value = pick(gameData.value?.villainActions || [])
  } else if (config.hasTwist[turn.value]) {
    twistInjected.value = true
    const currentTwist = twist.value
    if (currentTwist) {
      if (currentTwist.effect.kind === 'resource_delta') {
        const delta = currentTwist.effect.delta
        if (delta) {
          const r = resources.value
          for (const [k, v] of Object.entries(delta)) {
            const key = k as keyof Resources
            r[key] = Math.max(0, r[key] + (v ?? 0))
          }
        }
      } else if (currentTwist.effect.kind === 'disable_action') {
        twistDisabledAction.value = currentTwist.effect.target ?? null
      }
    }
  }
}

function computeOutcome() {
  const r = resources.value
  const baseQuality = ((r.mastery * 0.5 + r.clarity * 3 + r.momentum * 2) / 10) * 10
  const config = DIFFICULTY_CONFIG[selectedDifficulty.value]
  const quality = Math.min(100, Math.round(baseQuality * config.scoreMultiplier))
  const finalMastery = Math.min(100, Math.round(r.mastery))
  const activeOrSigTurns = turnHistory.value.filter(
    (t) => t.actionKind === 'active' || t.actionKind === 'signature',
  ).length
  const consistency =
    turnHistory.value.length > 0
      ? Math.round((activeOrSigTurns / turnHistory.value.length) * 100)
      : 0

  let grade: string
  let gradeIcon: string
  if (quality >= 70) {
    grade = 'Executed Well'
    gradeIcon = '⭐'
  } else if (quality >= 45) {
    grade = 'Adequate'
    gradeIcon = '✓'
  } else {
    grade = 'Blind Spot Hit'
    gradeIcon = '△'
  }

  outcome.value = {
    quality: Math.round(quality),
    finalMastery,
    consistency,
    grade,
    gradeIcon,
    insightUnlocked: r.mastery >= 50,
  }

  // Update progression
  const p = progress.value
  p.gamesPlayed += 1

  const id = selectedHand.value?.id
  if (id) {
    p.gamesPerHand[id] = (p.gamesPerHand[id] ?? 0) + 1
    p.bestScorePerHand[id] = Math.max(p.bestScorePerHand[id] ?? 0, Math.round(quality))
  }

  // Unlock logic
  const unlocked = new Set(p.unlockedHands)
  if (p.gamesPlayed >= 1) {
    unlocked.add('second-order')
    unlocked.add('occams-razor')
  }
  if (p.gamesPlayed >= 3) {
    unlocked.add('sys')
  }
  if (p.gamesPlayed >= 5) {
    unlocked.add('mc')
  }
  if (p.gamesPlayed >= 8) {
    unlocked.add('bay')
  }

  if (id) {
    if (!p.completedDifficulties[id]) {
      p.completedDifficulties[id] = []
    }
    if (!p.completedDifficulties[id].includes(selectedDifficulty.value)) {
      p.completedDifficulties[id].push(selectedDifficulty.value)
    }
  }

  p.unlockedHands = Array.from(unlocked)

  phase.value = 'OUTCOME'
}

function restart() {
  phase.value = 'SELECT'
  selectedHand.value = null
  resources.value = { energy: 5, clarity: 3, momentum: 7, mastery: 0 }
  scenario.value = ''
  escalation.value = ''
  twist.value = null
  twistInjected.value = false
  turn.value = 0
  hasUsedSig.value = false
  selectedAction.value = null
  showConsequence.value = false
  turnHistory.value = []
  outcome.value = null
  lastActionWasObserve.value = false
  activeWarning.value = ''
  observeHint.value = ''
  standardBonus.value = false
  currentInsight.value = ''
  expandedHands.value = new Set()
  recentActions.value = []
  blindspotTriggered.value = false
  mentorMessage.value = ''

  currentVillain.value = null
  villainAvoided.value = false
  villainChosen.value = false
  villainTurns.value = []

  currentScenario.value = null
  visibleLayers.value = []
  isScenarioExpanding.value = false

  checkInitialQuiz()
}

// ─── Helpers for template ─────────────────────────────────────────────────────
function actionKindLabel(kind: ActionKind): string {
  const map: Record<ActionKind, string> = {
    active: 'Kỹ năng chủ động',
    standard: 'Tiêu chuẩn',
    observe: 'Quan sát',
    signature: 'Tuyệt chiêu ✦',
  }
  return map[kind]
}

function actionKindColor(kind: ActionKind): string {
  const map: Record<ActionKind, string> = {
    active: '#ff6b4a',
    standard: '#8b9db5',
    observe: '#38bdf8',
    signature: '#FFB830',
  }
  return map[kind]
}

function deltaDisplay(delta: ResourceDelta): string {
  const parts: string[] = []
  if (delta.energy) parts.push(`${delta.energy > 0 ? '+' : ''}${delta.energy} energy`)
  if (delta.clarity) parts.push(`${delta.clarity > 0 ? '+' : ''}${delta.clarity} clarity`)
  if (delta.momentum) parts.push(`${delta.momentum > 0 ? '+' : ''}${delta.momentum} momentum`)
  if (delta.mastery) parts.push(`${delta.mastery > 0 ? '+' : ''}${delta.mastery} mastery`)
  return parts.join(' · ')
}

// ─── Share & UI helpers ────────────────────────────────────────────────────────
const shareText = computed(() => {
  if (!outcome.value || !selectedHand.value) return ''
  const o = outcome.value
  const h = selectedHand.value
  return [
    '🧠 Mental Model Arena',
    `Tôi là ${h.tagline} (${h.name})`,
    `${o.gradeIcon} ${o.grade} · ${o.quality} điểm`,
    '',
    `Mastery: ${o.finalMastery}% · Consistency: ${o.consistency}%`,
    `"${gameData.value?.modelQuotes?.[h.id] ?? ''}"`,
    '',
    '→ vibe.j2team.org/mental-model-arena',
  ].join('\n')
})

const { copy } = useClipboard({ legacy: true })
const resetCopyTimer = useTimeoutFn(
  () => {
    copyState.value = 'idle'
  },
  2000,
  { immediate: false },
)

function copyShare() {
  void copy(shareText.value)
  copyState.value = 'copied'
  resetCopyTimer.start()
}

function toggleExpand(id: string, event: Event) {
  event.stopPropagation()
  const next = new Set(expandedHands.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedHands.value = next
}

// Initial check on load if it starts as SELECT
if (phase.value === 'SELECT') {
  checkInitialQuiz()
}
</script>

<template>
  <div v-if="dataLoaded" class="min-h-screen bg-bg-deep text-text-primary font-body">
    <!-- ── Header bar ── -->
    <header class="border-b border-border-default px-4 py-3 flex items-center justify-between">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-text-primary"
      >
        ← Trang chủ
      </RouterLink>
      <span class="font-display text-xs tracking-widest text-text-dim uppercase">
        Mental Model Arena
      </span>
    </header>

    <!-- ══════════════════════════════════════════════════════════════════
         PHASE: TUTORIAL
    ══════════════════════════════════════════════════════════════════ -->
    <section
      v-if="phase === 'TUTORIAL'"
      class="min-h-screen flex flex-col items-center justify-center px-4 py-10 animate-fade-up"
    >
      <div class="w-full max-w-md bg-bg-surface border border-border-default p-8">
        <!-- Step indicator -->
        <div class="flex items-center justify-center gap-2 mb-8">
          <div
            v-for="i in TUTORIAL_STEPS.length"
            :key="i"
            class="w-2.5 h-2.5 rounded-full transition-colors"
            :class="i - 1 === tutorialStep ? 'bg-accent-coral' : 'bg-bg-elevated'"
          ></div>
        </div>

        <!-- Content -->
        <div class="text-center mb-10">
          <h2 class="font-display text-2xl font-bold text-text-primary mb-4">
            {{ TUTORIAL_STEPS[tutorialStep]?.title }}
          </h2>
          <p class="text-text-secondary text-sm leading-relaxed">
            {{ TUTORIAL_STEPS[tutorialStep]?.body }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-4">
          <button
            class="w-full bg-bg-elevated text-text-primary font-display font-semibold tracking-wider py-3 hover:bg-border-default transition-colors"
            @click="nextTutorialStep"
          >
            {{ tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Bắt đầu chơi' : 'Tiếp theo →' }}
          </button>
          <button
            class="text-xs text-text-dim hover:text-text-secondary transition-colors"
            @click="skipTutorial"
          >
            Bỏ qua hướng dẫn
          </button>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════
         PHASE: SELECT
    ══════════════════════════════════════════════════════════════════ -->
    <section v-else-if="phase === 'SELECT'" class="max-w-3xl mx-auto px-4 py-10">
      <!-- Title -->
      <div class="text-center mb-10 animate-fade-up">
        <div class="font-display text-xs tracking-widest text-accent-coral mb-3">
          // CHỌN BÀN TAY VÀNG
        </div>
        <h1 class="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4">
          Mental Model Arena
        </h1>
        <p class="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
          Mỗi Mental Model là một lens đặc biệt để xử lý quyết định khó. Chọn model bạn muốn luyện
          tập — rồi đối mặt với 4 tình huống thật.
        </p>
        <div class="mt-4 text-xs text-text-secondary font-display tracking-widest">
          {{ progress.gamesPlayed }} ván đã chơi · {{ progress.unlockedHands.length }}/7 mô hình đã
          mở
        </div>
      </div>

      <!-- Quiz UI -->
      <div
        v-if="showQuiz"
        class="bg-bg-elevated border border-border-default p-6 mb-8 animate-fade-up max-w-lg mx-auto"
      >
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xs font-display tracking-widest text-text-dim uppercase">
            Bước {{ quizStep + 1 }}/3
          </span>
          <div class="flex-1 h-1.5 bg-bg-surface flex">
            <div
              class="h-full bg-accent-coral transition-all duration-300"
              :style="{ width: `${((quizStep + 1) / 3) * 100}%` }"
            />
          </div>
        </div>
        <h3 class="font-display text-xl font-bold text-text-primary mb-6">
          {{ QUIZ_DATA[quizStep]?.question }}
        </h3>
        <div class="flex flex-col gap-3 mb-6">
          <button
            v-for="opt in QUIZ_DATA[quizStep]?.options"
            :key="opt.label"
            class="w-full text-left bg-bg-surface border border-border-default hover:border-accent-coral hover:bg-bg-elevated p-4 text-sm text-text-primary transition-colors min-h-[44px]"
            @click="answerQuiz(opt.hand)"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="text-center">
          <button
            class="text-xs text-text-dim hover:text-text-secondary transition-colors underline underline-offset-4 min-h-[44px] px-4"
            @click="skipQuiz"
          >
            Bỏ qua bài trắc nghiệm →
          </button>
        </div>
      </div>

      <!-- Hand cards grid -->
      <div class="relative">
        <div class="absolute -top-8 right-0">
          <button
            v-if="suggestedHand && !showQuiz"
            class="text-xs text-text-dim hover:text-text-secondary transition-colors underline underline-offset-4 px-2 py-1"
            @click="resetQuiz"
          >
            Chơi lại trắc nghiệm
          </button>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <template v-for="hand in HANDS" :key="hand.id">
            <!-- Unlocked -->
            <div
              v-if="progress.unlockedHands.includes(hand.id)"
              class="relative bg-bg-surface border border-border-default p-4 cursor-pointer transition-all duration-200 hover:bg-bg-elevated"
              :class="
                suggestedHand === hand.id
                  ? '!border-accent-coral border-2 shadow-[0_0_15px_rgba(244,114,182,0.1)]'
                  : ''
              "
              @click="toggleExpand(hand.id, $event)"
            >
              <!-- Highlight Badge -->
              <div
                v-if="suggestedHand === hand.id"
                class="absolute -top-3 left-4 bg-accent-coral/20 text-accent-coral text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest border border-accent-coral/30 backdrop-blur-sm"
              >
                ✨ Phù hợp với bạn
              </div>
              <!-- Collapsed: always visible -->
              <div class="flex items-center gap-3">
                <span
                  class="text-4xl leading-none shrink-0"
                  :style="{ filter: 'drop-shadow(0 0 6px ' + hand.color + '66)' }"
                >
                  {{ hand.icon }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-display text-base font-semibold" :style="{ color: hand.color }">
                    {{ hand.name }}
                  </div>
                  <div class="text-xs text-text-dim font-display tracking-wide">
                    {{ hand.tagline }}
                  </div>
                </div>
                <span
                  class="text-xs font-display tracking-wide px-2 py-0.5 border shrink-0 transition-all"
                  :style="{
                    borderColor: hand.color,
                    color: hand.color,
                    backgroundColor: hand.color + '11',
                  }"
                >
                  {{ expandedHands.has(hand.id) ? '↑ Thu gọn' : '↓ Xem chi tiết' }}
                </span>
              </div>
              <!-- Expanded content -->
              <div
                v-if="expandedHands.has(hand.id)"
                class="mt-4 pt-3 border-t border-border-default"
              >
                <p class="text-sm text-text-secondary leading-relaxed mb-3">{{ hand.bio }}</p>
                <div class="flex flex-col gap-1 mb-3">
                  <div
                    v-for="skill in hand.skills"
                    :key="skill"
                    class="flex items-center gap-1.5 text-xs text-text-dim"
                  >
                    <span
                      class="w-1 h-1 rounded-full shrink-0"
                      :style="{ backgroundColor: hand.color }"
                    />
                    {{ skill }}
                  </div>
                </div>
                <div class="text-xs text-text-secondary mb-4">
                  <span class="text-text-dim font-display">⚠ Blindspot: </span>{{ hand.blindspot }}
                </div>
                <button
                  class="w-full font-display text-sm tracking-widest py-2.5 border transition-all hover:-translate-y-0.5 focus:outline-none"
                  :style="{
                    borderColor: hand.color,
                    color: hand.color,
                    backgroundColor: hand.color + '11',
                  }"
                  @click.stop="pickHand(hand)"
                >
                  Chọn {{ hand.tagline }} →
                </button>
              </div>
            </div>
            <!-- Locked -->
            <div
              v-else
              class="bg-bg-surface border border-border-default p-4 opacity-50 pointer-events-none flex items-center gap-3"
            >
              <span
                class="text-4xl leading-none shrink-0 grayscale opacity-60"
                :style="{ filter: 'drop-shadow(0 0 6px ' + hand.color + '66)' }"
              >
                {{ hand.icon }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="font-display text-base font-semibold" :style="{ color: hand.color }">
                  {{ hand.name }}
                </div>
                <div class="text-xs text-text-dim font-display tracking-wide mt-0.5">
                  <span v-if="hand.id === 'sys'">🔒 Hoàn thành 3 ván để mở khóa</span>
                  <span v-else-if="hand.id === 'mc'">🔒 Hoàn thành 5 ván để mở khóa</span>
                  <span v-else-if="hand.id === 'bay'">🔒 Hoàn thành 8 ván để mở khóa</span>
                  <span v-else-if="hand.id === 'second-order' || hand.id === 'occams-razor'"
                    >🔒 Hoàn thành 1 ván để mở khóa</span
                  >
                  <span v-else>🔒 Chưa đủ điều kiện mở khóa</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="mt-12 text-center">
        <button
          class="text-xs text-text-dim hover:text-text-secondary transition-colors underline underline-offset-4"
          @click="reviewTutorial"
        >
          Xem lại hướng dẫn
        </button>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════
         PHASE: DIFFICULTY
    ══════════════════════════════════════════════════════════════════ -->
    <section
      v-else-if="phase === 'DIFFICULTY' && selectedHand"
      class="max-w-4xl mx-auto px-4 py-10"
    >
      <div class="text-center mb-10 animate-fade-up">
        <div class="font-display text-xs tracking-widest text-accent-coral mb-3">// CHUẨN BỊ</div>
        <h2 class="font-display text-3xl font-bold text-text-primary mb-2">
          Chọn độ khó — {{ selectedHand.tagline }}
        </h2>
        <p class="text-text-secondary text-sm">
          Độ khó quyết định số lượt chơi, biến cố và hệ số điểm của màn này.
        </p>
      </div>

      <div class="flex flex-col md:flex-row gap-4 mb-10">
        <!-- Loop configs -->
        <div
          v-for="(config, diffId) in DIFFICULTY_CONFIG"
          :key="diffId"
          class="group flex-1 bg-bg-surface border p-6 flex flex-col justify-between transition-all"
          :class="[
            config.requiresCompletion &&
            !Object.values(progress.bestScorePerHand).some((s) => s > 0)
              ? 'border-border-default opacity-50 pointer-events-none'
              : diffId === 'thuong'
                ? 'border-accent-amber hover:bg-bg-elevated cursor-pointer shadow-[0_0_15px_rgba(255,184,48,0.1)]'
                : 'border-border-default hover:border-text-dim hover:bg-bg-elevated cursor-pointer',
          ]"
          @click="startPlay(diffId as Difficulty)"
        >
          <div>
            <div class="flex items-start justify-between mb-4">
              <h3 class="font-display text-xl font-bold truncate">{{ config.label }}</h3>

              <!-- Badges -->
              <span
                v-if="
                  config.requiresCompletion &&
                  !Object.values(progress.bestScorePerHand).some((s) => s > 0)
                "
                class="text-[10px] font-bold px-2 py-1 bg-red-900/30 text-red-400 uppercase tracking-widest border border-red-900"
              >
                Chưa mở
              </span>
              <span
                v-else-if="diffId === 'de'"
                class="text-[10px] font-bold px-2 py-1 bg-green-900/30 text-green-400 uppercase tracking-widest border border-green-900"
              >
                Làm quen
              </span>
              <span
                v-else-if="diffId === 'thuong'"
                class="text-[10px] font-bold px-2 py-1 bg-accent-amber/10 text-accent-amber uppercase tracking-widest border border-accent-amber/20"
              >
                Cân bằng
              </span>
              <span
                v-else-if="diffId === 'kho'"
                class="text-[10px] font-bold px-2 py-1 bg-orange-900/30 text-orange-400 uppercase tracking-widest border border-orange-900"
              >
                ×1.3 Điểm
              </span>
            </div>

            <div class="text-sm text-text-secondary space-y-2 mb-6">
              <p>
                • Số lượt: <span class="text-text-primary">{{ config.totalTurns }}</span>
              </p>
              <p>
                • Biến cố:
                <span class="text-text-primary">{{ config.hasTwist.filter(Boolean).length }}</span>
              </p>
              <p>
                • Tỉ lệ điểm: <span class="text-text-primary">×{{ config.scoreMultiplier }}</span>
              </p>
              <p
                v-if="
                  config.requiresCompletion &&
                  !Object.values(progress.bestScorePerHand).some((s) => s > 0)
                "
                class="text-red-400 mt-2 text-xs"
              >
                ⚠ Yêu cầu hoàn thành Thường
              </p>
            </div>
          </div>
          <button
            class="w-full py-2 border border-border-default font-display text-sm tracking-widest text-text-primary group-hover:bg-text-primary group-hover:text-bg-deep transition-colors"
          >
            Chơi {{ config.label }}
          </button>
        </div>
      </div>

      <!-- Domain Selector -->
      <div class="mb-10 animate-fade-up animate-delay-1">
        <div class="font-display text-xs tracking-widest text-text-dim mb-4 uppercase text-center">
          // Chọn chủ đề tình huống
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="domain in [
              'random',
              'career',
              'relationship',
              'finance',
              'learning',
            ] as ScenarioDomain[]"
            :key="domain"
            @click="selectedDomain = domain"
            class="px-4 py-2 border font-display text-xs tracking-widest transition-all duration-200"
            :class="
              selectedDomain === domain
                ? 'border-accent-coral text-accent-coral bg-accent-coral/10'
                : 'border-border-default text-text-secondary hover:border-text-dim'
            "
          >
            <span v-if="domain === 'random'">🎲 Ngẫu nhiên</span>
            <span v-else-if="domain === 'career'">💼 Công việc</span>
            <span v-else-if="domain === 'relationship'">👥 Quan hệ</span>
            <span v-else-if="domain === 'finance'">💰 Tài chính</span>
            <span v-else-if="domain === 'learning'">📚 Học tập</span>
          </button>
        </div>
      </div>

      <div class="text-center">
        <button
          class="text-sm text-text-dim hover:text-text-secondary transition-colors underline underline-offset-4"
          @click="backToSelect"
        >
          ← Chọn lại mô hình
        </button>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════
         PHASE: PLAY
    ══════════════════════════════════════════════════════════════════ -->
    <section v-else-if="phase === 'PLAY' && selectedHand" class="max-w-2xl mx-auto px-4 py-6">
      <!-- Resource bar header -->
      <div class="bg-bg-surface border border-border-default p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ selectedHand.icon }}</span>
            <div>
              <div
                class="font-display text-sm font-semibold"
                :style="{ color: selectedHand.color }"
              >
                {{ selectedHand.name }}
              </div>
              <div class="text-xs text-text-dim">{{ selectedHand.tagline }}</div>
            </div>
          </div>
          <!-- Turn pips -->
          <div class="flex items-center gap-1.5">
            <div
              v-for="i in DIFFICULTY_CONFIG[selectedDifficulty].totalTurns"
              :key="i"
              class="w-2.5 h-2.5 rounded-full transition-all duration-300"
              :style="{
                backgroundColor:
                  i - 1 < turn
                    ? '#22c55e'
                    : i - 1 === turn
                      ? selectedHand.color
                      : DIFFICULTY_CONFIG[selectedDifficulty].hasTwist[i - 1]
                        ? '#ef4444'
                        : villainTurns.includes(i - 1)
                          ? 'color-mix(in srgb, var(--color-accent-coral) 40%, transparent)'
                          : '#253549',
              }"
            />
          </div>
        </div>

        <!-- Resource bars -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
          <!-- Energy -->
          <div>
            <div class="flex justify-between items-center text-xs mb-1">
              <span class="flex items-center gap-1.5 text-text-dim">
                ⚡ Energy
                <span
                  v-if="currentPressureState.energy"
                  class="px-1.5 py-0.5 bg-red-900/40 text-red-400 text-[9px] font-bold uppercase tracking-widest border border-red-900/50 animate-pulse"
                >
                  {{ PRESSURE_THRESHOLDS.energy.label }}
                </span>
              </span>
              <span class="text-text-secondary">{{ resources.energy }}/5</span>
            </div>
            <div class="h-1.5 bg-bg-elevated w-full">
              <div
                class="h-full transition-all duration-500"
                :style="{
                  width: energyBarWidth,
                  backgroundColor: currentPressureState.energy ? '#ef4444' : '#ff6b4a',
                }"
              />
            </div>
          </div>
          <!-- Clarity -->
          <div>
            <div class="flex justify-between items-center text-xs mb-1">
              <span class="flex items-center gap-1.5 text-text-dim">
                💡 Clarity
                <span
                  v-if="currentPressureState.clarity"
                  class="px-1.5 py-0.5 bg-red-900/40 text-red-400 text-[9px] font-bold uppercase tracking-widest border border-red-900/50 animate-pulse"
                >
                  {{ PRESSURE_THRESHOLDS.clarity.label }}
                </span>
              </span>
              <span class="text-text-secondary">{{ resources.clarity }}/10</span>
            </div>
            <div class="h-1.5 bg-bg-elevated w-full">
              <div
                class="h-full transition-all duration-500"
                :style="{
                  width: clarityBarWidth,
                  backgroundColor: currentPressureState.clarity ? '#ef4444' : '#38bdf8',
                }"
              />
            </div>
          </div>
          <!-- Momentum -->
          <div>
            <div class="flex justify-between items-center text-xs mb-1">
              <span class="flex items-center gap-1.5 text-text-dim">
                🚀 Momentum
                <span
                  v-if="currentPressureState.momentum"
                  class="px-1.5 py-0.5 bg-red-900/40 text-red-400 text-[9px] font-bold uppercase tracking-widest border border-red-900/50 animate-pulse"
                >
                  {{ PRESSURE_THRESHOLDS.momentum.label }}
                </span>
              </span>
              <span class="text-text-secondary">{{ resources.momentum }}/10</span>
            </div>
            <div class="h-1.5 bg-bg-elevated w-full">
              <div
                class="h-full transition-all duration-500"
                :style="{
                  width: momentumBarWidth,
                  backgroundColor: currentPressureState.momentum ? '#ef4444' : '#FFB830',
                }"
              />
            </div>
          </div>
          <!-- Mastery -->
          <div>
            <div class="flex justify-between items-center text-xs mb-1">
              <span class="flex items-center gap-1.5 text-text-dim">
                🎯 Mastery
                <span
                  v-if="currentPressureState.mastery"
                  class="px-1.5 py-0.5 bg-red-900/40 text-red-400 text-[9px] font-bold uppercase tracking-widest border border-red-900/50 animate-pulse"
                >
                  {{ PRESSURE_THRESHOLDS.mastery.label }}
                </span>
              </span>
              <span class="text-text-secondary">{{ resources.mastery }}/100</span>
            </div>
            <div class="h-1.5 bg-bg-elevated w-full">
              <div
                class="h-full transition-all duration-500"
                :style="{
                  width: masteryBarWidth,
                  backgroundColor: currentPressureState.mastery ? '#ef4444' : selectedHand.color,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Turn label -->
      <div class="flex items-center gap-2 mb-3">
        <span class="font-display text-xs tracking-widest text-text-dim uppercase">
          Lượt {{ turn + 1 }}/{{ DIFFICULTY_CONFIG[selectedDifficulty].totalTurns }}
        </span>
        <span v-if="turn === 0" class="text-xs text-text-dim">— Tình huống ban đầu</span>
        <span v-else-if="twistInjected" class="text-xs" style="color: #ef4444">— Biến cố!</span>
        <span
          v-else-if="turn === DIFFICULTY_CONFIG[selectedDifficulty].totalTurns - 1"
          class="text-xs text-accent-amber"
          >— Giải quyết</span
        >
        <span v-else class="text-xs text-accent-coral">— Leo thang</span>
      </div>

      <!-- Scenario card -->
      <div class="bg-bg-surface border border-border-default p-5 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-display text-xs tracking-widest text-text-dim uppercase">
            // Tình huống
          </div>
          <transition name="fade-fast">
            <div
              v-if="isScenarioExpanding"
              class="text-[10px] font-display text-accent-coral animate-pulse uppercase tracking-widest font-bold"
            >
              Tình huống đang mở rộng...
            </div>
          </transition>
        </div>

        <div class="space-y-3">
          <div
            v-for="(layer, idx) in visibleLayers"
            :key="idx"
            class="text-sm leading-relaxed transition-all duration-500 animate-fade-up"
          >
            <template v-if="idx === 0">
              <span class="text-text-primary">{{ layer }}</span>
            </template>
            <template v-else-if="idx === 1">
              <span class="text-text-secondary">→ </span>
              <span class="text-text-primary">{{ layer }}</span>
            </template>
            <template v-else-if="idx === 2">
              <span class="text-accent-amber font-medium">⚠ </span>
              <span class="text-text-primary font-medium">{{ layer }}</span>
            </template>
            <template v-else-if="idx === 3">
              <span class="text-accent-sky italic">✦ </span>
              <span class="text-text-primary italic">{{ layer }}</span>
            </template>
          </div>
        </div>

        <!-- Twist (turn 2+) -->
        <div
          v-if="twistInjected && twist"
          class="mt-3 border-t border-border-default pt-3 animate-fade-up"
        >
          <div class="text-xs font-display tracking-widest mb-1" style="color: #ef4444">
            ⚡ BIẾN CỐ
          </div>
          <p class="text-sm" style="color: #fca5a5">{{ twist.text }}</p>
          <div
            v-if="twist.effect.message"
            class="mt-2 text-xs flex items-center gap-1.5 font-display"
            style="color: var(--color-accent-coral, #f472b6)"
          >
            <Icon icon="ph:warning-fill" class="size-3 shrink-0" />
            {{ twist.effect.message }}
          </div>
        </div>
      </div>

      <!-- Signature unlock banner -->
      <div
        v-if="sigUnlocked"
        class="mb-4 border px-4 py-2.5 text-sm font-display flex items-center gap-2"
        :style="{
          borderColor: selectedHand.color,
          color: selectedHand.color,
          backgroundColor: selectedHand.color + '11',
        }"
      >
        <span>✦</span>
        <span>Tuyệt chiêu đã mở khóa! Mastery đạt ngưỡng {{ selectedHand.sigThreshold }}.</span>
      </div>

      <!-- Action selection (hidden during consequence display) -->
      <div v-if="!showConsequence">
        <div class="font-display text-xs tracking-widest text-text-dim uppercase mb-3">
          // Chọn hành động
        </div>
        <div class="grid gap-3">
          <button
            v-for="state in actionStates"
            :key="state.action.kind"
            class="text-left bg-bg-surface border border-border-default transition-all duration-200 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral"
            :class="[
              state.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-bg-elevated',
              currentPressureState.mastery ? 'bg-red-900/10' : '',
            ]"
            :style="
              selectedAction?.kind === state.action.kind
                ? { borderColor: actionKindColor(state.action.kind) }
                : {}
            "
            :disabled="state.disabled"
            @click="chooseAction(state.action)"
          >
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <span class="font-display text-sm font-semibold text-text-primary">{{
                state.action.label
              }}</span>
              <span
                class="text-xs font-display tracking-wide px-2 py-0.5 shrink-0"
                :style="{
                  color: actionKindColor(state.action.kind),
                  backgroundColor: actionKindColor(state.action.kind) + '22',
                }"
              >
                {{ actionKindLabel(state.action.kind) }}
              </span>
            </div>
            <p class="text-xs text-text-secondary leading-relaxed mb-2">
              {{ state.action.description }}
            </p>
            <div class="text-xs text-text-dim font-display">
              {{ deltaDisplay(state.action.delta) }}
            </div>
            <div
              v-if="state.disabled"
              class="mt-2 text-xs px-2 py-0.5 inline-block"
              style="color: #ef4444; background-color: #ef444422"
            >
              {{ state.disabledReason }}
            </div>
            <div
              v-if="state.action.kind === 'standard' && lastActionWasObserve"
              class="mt-1 text-xs text-accent-amber"
            >
              ✦ Nhận thêm +5 Mastery (nhờ vừa quan sát)
            </div>

            <!-- Pressure warning A: Energy -> active -->
            <div
              v-if="currentPressureState.energy && state.action.kind === 'active'"
              class="mt-2 text-xs px-2 py-1 flex items-center gap-1.5 font-display"
              style="color: #ef4444; background-color: #ef444422"
            >
              <Icon icon="ph:warning-fill" class="size-3 shrink-0" />
              ⚡ Hiệu quả giảm (mastery chia đôi)
            </div>
            <!-- Pressure warning B: Momentum -> standard -->
            <div
              v-if="currentPressureState.momentum && state.action.kind === 'standard'"
              class="mt-2 text-xs px-2 py-1 flex items-center gap-1.5 font-display"
              style="color: #f97316; background-color: #f9731622"
            >
              <Icon icon="ph:warning-fill" class="size-3 shrink-0" />
              📉 Mất bonus (không được +5)
            </div>
            <!-- Pressure warning C: Clarity -> observe -->
            <div
              v-if="currentPressureState.clarity && state.action.kind === 'observe'"
              class="mt-2 text-xs px-2 py-1 flex items-center gap-1.5 font-display"
              style="color: #a855f7; background-color: #a855f722"
            >
              <Icon icon="ph:warning-fill" class="size-3 shrink-0" />
              🔄 Phản tác dụng (trừ 5 mastery)
            </div>

            <!-- Contextual warning A: low momentum on active -->
            <div
              v-if="state.action.kind === 'active' && resources.momentum < 3"
              class="mt-2 text-xs px-2 py-1 flex items-center gap-1.5 font-display"
              style="
                color: var(--color-accent-amber, #f0b030);
                background-color: color-mix(in srgb, #f0b030 12%, transparent);
              "
            >
              <Icon icon="ph:warning-fill" class="size-3 shrink-0" />
              Momentum thấp — hiệu quả bị giảm
            </div>
            <!-- Contextual warning B: clarity maxed on observe -->
            <div
              v-if="state.action.kind === 'observe' && resources.clarity >= 8"
              class="mt-2 text-xs px-2 py-1 flex items-center gap-1.5 font-display"
              style="
                color: var(--color-accent-sky, #38bdf8);
                background-color: color-mix(in srgb, #38bdf8 12%, transparent);
              "
            >
              <Icon icon="ph:info-fill" class="size-3 shrink-0" />
              Clarity đã tối đa — Quan sát không tăng thêm
            </div>
          </button>

          <!-- Hidden Villain Card inserted as normal action -->
          <button
            v-if="villainShouldAppear && currentVillain"
            class="text-left bg-bg-surface border border-border-default transition-all duration-200 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral hover:bg-bg-elevated"
            :class="[currentPressureState.mastery ? 'bg-red-900/10' : '']"
            @click="chooseVillain(currentVillain)"
          >
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <span class="font-display text-sm font-semibold text-text-primary">{{
                currentVillain.label
              }}</span>
            </div>
            <p class="text-xs text-text-secondary leading-relaxed mb-2">
              {{ currentVillain.description }}
            </p>
          </button>
        </div>
      </div>

      <!-- Consequence panel — 3-tier layout -->
      <div
        v-else-if="showConsequence && (selectedAction || selectedVillain)"
        class="border transition-all duration-300 overflow-hidden"
        :style="{
          borderColor: villainChosen
            ? 'var(--color-accent-coral)'
            : actionKindColor(selectedAction?.kind ?? 'standard'),
          backgroundColor: '#162232',
        }"
      >
        <!-- Panel header -->
        <div
          class="px-5 pt-4 pb-3 border-b border-border-default flex items-center gap-2"
          :style="{
            borderBottomColor:
              (villainChosen
                ? 'var(--color-accent-coral)'
                : actionKindColor(selectedAction?.kind ?? 'standard')) + '44',
          }"
        >
          <span
            class="text-xs font-display tracking-widest uppercase"
            :style="{
              color: villainChosen
                ? 'var(--color-accent-coral)'
                : actionKindColor(selectedAction?.kind ?? 'standard'),
            }"
            >//</span
          >
          <span
            class="text-xs font-display tracking-widest uppercase"
            :style="{
              color: villainChosen
                ? 'var(--color-accent-coral)'
                : actionKindColor(selectedAction?.kind ?? 'standard'),
            }"
            >Hậu quả: {{ villainChosen ? selectedVillain?.label : selectedAction?.label }}</span
          >
        </div>

        <div class="px-5 py-4 space-y-5">
          <!-- ─── TẦNG 1: Consequence narrative + inline badges ─────────────── -->
          <div>
            <template v-if="villainChosen && selectedVillain">
              <!-- Banner reveal CHỈ hiện sau khi đã chọn -->
              <div
                class="bg-[color-mix(in_srgb,var(--color-accent-coral)_10%,transparent)] border-l-4 border-accent-coral rounded p-3 mb-3"
              >
                <div
                  class="flex items-center gap-2 text-accent-coral font-bold font-display text-sm mb-1 uppercase tracking-widest"
                >
                  <Icon icon="ph:brain-fill" class="size-4 shrink-0" />
                  Bẫy tư duy: {{ selectedVillain.bias }}
                </div>
              </div>

              <p class="text-sm text-text-primary leading-relaxed">
                {{ selectedVillain.consequence }}
              </p>
            </template>
            <template v-else-if="selectedAction">
              <p class="text-sm text-text-primary leading-relaxed">
                {{ selectedAction.consequence }}
              </p>
              <!-- Penalty / hint badges -->
              <div class="mt-2 space-y-1.5">
                <div
                  v-if="activeWarning"
                  class="text-xs px-2.5 py-1 flex items-center gap-1.5"
                  style="color: #fca5a5; background-color: #ef444411"
                >
                  <Icon icon="ph:warning-fill" class="size-3 shrink-0" />
                  {{ activeWarning }}
                </div>
                <div
                  v-if="observeHint"
                  class="text-xs px-2.5 py-1 flex items-center gap-1.5 text-accent-sky"
                  style="background-color: color-mix(in srgb, #38bdf8 8%, transparent)"
                >
                  <Icon icon="ph:info-fill" class="size-3 shrink-0" />
                  {{ observeHint }}
                </div>
                <div
                  v-if="standardBonus"
                  class="text-xs px-2.5 py-1 flex items-center gap-1.5 text-accent-amber"
                  style="background-color: color-mix(in srgb, #f0b030 8%, transparent)"
                >
                  <Icon icon="ph:star-fill" class="size-3 shrink-0" />
                  Đã nhận thêm +5 Mastery (nhờ vừa quan sát)
                </div>
              </div>
              <!-- Insight -->
              <p
                v-if="currentInsight"
                class="text-xs italic leading-relaxed mt-3 pt-3 border-t border-border-default"
                :style="{ color: selectedHand?.color }"
              >
                {{ currentInsight }}
              </p>
            </template>
          </div>

          <!-- ─── TẦNG 2: Resource Explanations ─────────────────────────────── -->
          <div v-if="villainChosen && selectedVillain" class="pt-4 border-t border-border-default">
            <div class="font-display text-xs tracking-widest text-text-dim uppercase mb-3">
              // Thay đổi chỉ số
            </div>
            <div class="grid gap-2">
              <div v-if="selectedVillain.delta.mastery" class="flex items-center gap-2 text-xs">
                <Icon icon="ph:star-fill" class="size-3.5" style="color: #ef4444" />
                <span class="font-display font-bold text-accent-coral tabular-nums">{{
                  selectedVillain.delta.mastery
                }}</span>
                <span class="text-text-secondary">Mastery</span>
              </div>
              <div v-if="selectedVillain.delta.momentum" class="flex items-center gap-2 text-xs">
                <Icon icon="ph:arrow-up-fill" class="size-3.5 text-text-primary" />
                <span class="font-display font-bold tabular-nums text-text-primary"
                  >{{ selectedVillain.delta.momentum > 0 ? '+' : ''
                  }}{{ selectedVillain.delta.momentum }}</span
                >
                <span class="text-text-secondary">Momentum</span>
              </div>
              <div v-if="selectedVillain.delta.clarity" class="flex items-center gap-2 text-xs">
                <Icon
                  icon="ph:eye-fill"
                  class="size-3.5"
                  :class="
                    selectedVillain.delta.clarity > 0 ? 'text-text-primary' : 'text-accent-coral'
                  "
                />
                <span
                  class="font-display font-bold tabular-nums"
                  :class="
                    selectedVillain.delta.clarity > 0 ? 'text-text-primary' : 'text-accent-coral'
                  "
                  >{{ selectedVillain.delta.clarity > 0 ? '+' : ''
                  }}{{ selectedVillain.delta.clarity }}</span
                >
                <span class="text-text-secondary">Clarity</span>
              </div>
            </div>
          </div>
          <div
            v-else-if="currentResourceExpl && selectedAction"
            class="pt-4 border-t border-border-default"
          >
            <div class="font-display text-xs tracking-widest text-text-dim uppercase mb-3">
              // Vì sao chỉ số thay đổi
            </div>
            <!-- overall summary -->
            <div
              class="text-sm font-semibold text-text-primary leading-relaxed border-l-2 border-accent-coral pl-3 py-1 bg-bg-surface mb-3"
            >
              {{ currentResourceExpl.overall }}
            </div>
            <!-- Per-resource rows -->
            <div class="grid gap-2">
              <div
                v-if="selectedAction.delta.energy !== 0 && currentResourceExpl.energy"
                class="flex items-start gap-2.5 text-xs text-text-secondary"
              >
                <div class="flex items-center gap-1 shrink-0 mt-0.5">
                  <Icon icon="ph:lightning-fill" class="size-3.5 text-accent-amber" />
                  <span
                    class="font-display font-bold tabular-nums"
                    :class="
                      (selectedAction.delta.energy ?? 0) > 0
                        ? 'text-accent-amber'
                        : 'text-accent-coral'
                    "
                  >
                    {{ (selectedAction.delta.energy ?? 0) > 0 ? '+' : ''
                    }}{{ selectedAction.delta.energy }}
                  </span>
                </div>
                <span class="leading-relaxed">{{ currentResourceExpl.energy }}</span>
              </div>
              <div
                v-if="selectedAction.delta.clarity !== 0 && currentResourceExpl.clarity"
                class="flex items-start gap-2.5 text-xs text-text-secondary"
              >
                <div class="flex items-center gap-1 shrink-0 mt-0.5">
                  <Icon icon="ph:eye-fill" class="size-3.5 text-accent-sky" />
                  <span
                    class="font-display font-bold tabular-nums"
                    :class="
                      (selectedAction.delta.clarity ?? 0) > 0
                        ? 'text-accent-sky'
                        : 'text-accent-coral'
                    "
                  >
                    {{ (selectedAction.delta.clarity ?? 0) > 0 ? '+' : ''
                    }}{{ selectedAction.delta.clarity }}
                  </span>
                </div>
                <span class="leading-relaxed">{{ currentResourceExpl.clarity }}</span>
              </div>
              <div
                v-if="selectedAction.delta.momentum !== 0 && currentResourceExpl.momentum"
                class="flex items-start gap-2.5 text-xs text-text-secondary"
              >
                <div class="flex items-center gap-1 shrink-0 mt-0.5">
                  <Icon icon="ph:arrow-up-fill" class="size-3.5 text-accent-coral" />
                  <span
                    class="font-display font-bold tabular-nums"
                    :class="
                      (selectedAction.delta.momentum ?? 0) > 0
                        ? 'text-accent-coral'
                        : 'text-text-dim'
                    "
                  >
                    {{ (selectedAction.delta.momentum ?? 0) > 0 ? '+' : ''
                    }}{{ selectedAction.delta.momentum }}
                  </span>
                </div>
                <span class="leading-relaxed">{{ currentResourceExpl.momentum }}</span>
              </div>
              <div
                v-if="selectedAction.delta.mastery !== 0 && currentResourceExpl.mastery"
                class="flex items-start gap-2.5 text-xs text-text-secondary"
              >
                <div class="flex items-center gap-1 shrink-0 mt-0.5">
                  <Icon icon="ph:star-fill" class="size-3.5" style="color: #7f77dd" />
                  <span
                    class="font-display font-bold tabular-nums"
                    :class="(selectedAction.delta.mastery ?? 0) > 0 ? '' : 'text-text-dim'"
                    :style="(selectedAction.delta.mastery ?? 0) > 0 ? 'color: #7F77DD' : ''"
                  >
                    {{ (selectedAction.delta.mastery ?? 0) > 0 ? '+' : ''
                    }}{{ selectedAction.delta.mastery }}
                  </span>
                </div>
                <span class="leading-relaxed">{{ currentResourceExpl.mastery }}</span>
              </div>
            </div>
          </div>

          <!-- ─── TẦNG 3: Villain Lesson / Comparative Hints ─────────────────────────────────── -->
          <div v-if="villainChosen && selectedVillain" class="pt-4 border-t border-border-default">
            <div class="font-display text-xs tracking-widest text-text-dim uppercase mb-3">
              // Bài học xương máu
            </div>
            <div
              class="bg-[color-mix(in_srgb,var(--color-accent-coral)_8%,transparent)] border border-accent-coral/30 p-3 flex gap-2 items-start"
            >
              <Icon icon="ph:lightbulb-fill" class="size-4 text-accent-coral shrink-0 mt-0.5" />
              <div class="text-xs text-text-primary leading-relaxed">
                <span class="font-display font-semibold text-accent-coral">Nhận ra bẫy này: </span>
                <span v-if="selectedVillain.id === 'sunk-cost'">
                  {{ selectedVillain.bias }} thường xuất hiện khi bạn cảm thấy "đã đầu tư quá nhiều
                  để dừng lại".
                </span>
                <span v-else-if="selectedVillain.id === 'availability'">
                  {{ selectedVillain.bias }} thường xuất hiện khi giải pháp đầu tiên trong đầu có vẻ
                  đủ tốt.
                </span>
                <span v-else-if="selectedVillain.id === 'confirmation'">
                  {{ selectedVillain.bias }} thường xuất hiện khi chỉ muốn tìm thêm lý do để làm
                  điều đã muốn.
                </span>
              </div>
            </div>
          </div>
          <div
            v-else-if="currentCompHint && selectedAction"
            class="pt-4 border-t border-border-default"
          >
            <div class="font-display text-xs tracking-widest text-text-dim uppercase mb-3">
              // Nếu bạn chọn hành động khác
            </div>
            <p
              v-if="comparativeHintText"
              class="text-xs text-text-secondary italic leading-relaxed mb-3"
            >
              {{ comparativeHintText }}
            </p>
            <div class="bg-bg-surface border border-border-default p-3 flex gap-2 items-start">
              <Icon
                icon="ph:book-open-text-fill"
                class="size-4 text-accent-amber shrink-0 mt-0.5"
              />
              <div class="text-xs text-text-primary leading-relaxed">
                <span class="font-display font-semibold text-accent-amber">Bài học: </span>
                {{ currentCompHint.lesson }}
              </div>
            </div>
          </div>

          <!-- ─── TẦNG 4: Mentor Voice & Blindspot ───────────────────────────── -->
          <div
            v-if="mentorMessage || blindspotTriggered"
            class="pt-4 border-t border-border-default"
          >
            <!-- Blindspot Banner -->
            <div
              v-if="blindspotTriggered"
              class="mb-4 bg-bg-surface border-l-4 border-accent-amber p-4"
            >
              <div
                class="text-xs font-display tracking-widest text-accent-amber font-bold mb-1 flex items-center gap-1.5 uppercase"
              >
                <Icon icon="ph:warning-circle-fill" class="size-4 shrink-0" />
                Điểm mù kích hoạt
              </div>
              <p class="text-sm text-text-primary leading-relaxed mb-2">
                {{ gameData?.blindspotPatterns?.[selectedHand.id]?.message }}
              </p>
              <div class="text-xs text-text-secondary italic">
                Penalty:
                <span v-if="gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.energy">
                  Energy {{ gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.energy }}
                </span>
                <span v-if="gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.momentum">
                  Momentum {{ gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.momentum }}
                </span>
                <span v-if="gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.clarity">
                  Clarity {{ gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.clarity }}
                </span>
                <span v-if="gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.mastery">
                  Mastery {{ gameData?.blindspotPatterns?.[selectedHand.id]?.penalty.mastery }}
                </span>
              </div>
            </div>

            <!-- Mentor Voice -->
            <div
              v-if="mentorMessage"
              class="flex gap-3 items-start border-l-2 pl-3"
              :style="{ borderColor: selectedHand.color }"
            >
              <span
                class="text-xl leading-none shrink-0"
                :style="{ filter: 'drop-shadow(0 0 6px ' + selectedHand.color + '66)' }"
              >
                {{ selectedHand.icon }}
              </span>
              <div>
                <div class="text-[10px] font-display uppercase tracking-widest mb-1 text-text-dim">
                  {{ selectedHand.tagline }} nói:
                </div>
                <div class="text-sm italic text-text-secondary leading-relaxed">
                  "{{ mentorMessage }}"
                </div>
              </div>
            </div>
          </div>

          <!-- ─── Footer: next turn button ──────────────────────────────────── -->
          <div class="pt-2">
            <button
              class="w-full font-display text-sm tracking-widest px-6 py-2.5 border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              :style="{
                borderColor: selectedHand?.color,
                color: selectedHand?.color,
                backgroundColor: (selectedHand?.color ?? '#fff') + '11',
              }"
              @click="nextTurn"
            >
              {{ turn >= 3 ? 'Xem kết quả →' : 'Lượt tiếp →' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════════
         PHASE: OUTCOME
    ══════════════════════════════════════════════════════════════════ -->
    <section
      v-else-if="phase === 'OUTCOME' && outcome && selectedHand"
      class="max-w-2xl mx-auto px-4 py-10"
    >
      <!-- Grade header -->
      <div class="text-center mb-10 animate-fade-up">
        <div class="font-display text-xs tracking-widest text-text-dim mb-3 uppercase">
          // Kết quả sau 4 lượt
        </div>
        <div class="text-6xl mb-3">{{ outcome.gradeIcon }}</div>
        <div class="font-display text-3xl font-bold mb-2" :style="{ color: selectedHand.color }">
          {{ outcome.grade }}
        </div>
        <div class="text-text-secondary text-sm">
          {{ selectedHand.name }} · {{ selectedHand.tagline }}
        </div>
      </div>

      <!-- Share card replacement -->
      <div class="max-w-sm mx-auto mb-6">
        <div class="bg-bg-elevated border border-border-default rounded-xl p-6 shadow-lg mb-4">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <span class="font-display text-sm font-semibold text-text-primary"
              >🧠 Mental Model Arena</span
            >
            <Icon icon="game-icons:brain" class="size-6 text-text-dim" />
          </div>

          <!-- Hand info -->
          <div class="mb-8">
            <div
              class="text-4xl leading-none mb-3"
              :style="{ filter: 'drop-shadow(0 0 10px ' + selectedHand.color + '66)' }"
            >
              {{ selectedHand.icon }}
            </div>
            <div class="text-xs text-text-secondary tracking-widest uppercase mb-1 font-display">
              {{ selectedHand.tagline }}
            </div>
            <div class="text-2xl font-display font-bold" :style="{ color: selectedHand.color }">
              {{ selectedHand.name }}
            </div>
          </div>

          <!-- Score -->
          <div class="mb-6">
            <div class="flex items-baseline gap-2 mb-4">
              <span class="text-2xl">{{ outcome.gradeIcon }}</span>
              <span class="text-lg font-bold text-text-primary">{{ outcome.grade }}</span>
              <span
                class="text-sm font-display text-text-secondary line-through opacity-80 decoration-accent-coral"
                >{{ outcome.quality }} điểm</span
              >
            </div>

            <!-- Progress 1 -->
            <div class="mb-3">
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-text-secondary font-display font-semibold tracking-wide"
                  >Mastery</span
                >
                <span class="text-text-primary">{{ outcome.finalMastery }}%</span>
              </div>
              <div class="h-[6px] rounded-full bg-bg-surface overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-[800ms] ease-out"
                  :style="{
                    width: showStatsBars ? `${outcome.finalMastery}%` : '0%',
                    backgroundColor: selectedHand.color,
                  }"
                ></div>
              </div>
            </div>

            <!-- Progress 2 -->
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-text-secondary font-display font-semibold tracking-wide"
                  >Nhất quán</span
                >
                <span class="text-text-primary">{{ outcome.consistency }}%</span>
              </div>
              <div class="h-[6px] rounded-full bg-bg-surface overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-[1000ms] ease-out delay-100"
                  :style="{
                    width: showStatsBars ? `${outcome.consistency}%` : '0%',
                    backgroundColor: selectedHand.color,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-border-default pt-4">
            <p class="text-sm italic text-text-secondary leading-relaxed mb-4">
              "{{ gameData?.modelQuotes?.[selectedHand.id] || selectedHand.tagline }}"
            </p>
            <div class="text-center">
              <span class="text-[10px] text-text-dim tracking-widest font-mono uppercase">
                vibe.j2team.org/mental-model-arena
              </span>
            </div>
          </div>
        </div>

        <!-- Copy button -->
        <button
          class="w-full font-display text-xs tracking-widest border rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5"
          :style="
            copyState === 'copied'
              ? { borderColor: '#22c55e', color: '#22c55e', backgroundColor: '#22c55e11' }
              : {
                  borderColor: selectedHand.color,
                  color: selectedHand.color,
                  backgroundColor: selectedHand.color + '11',
                }
          "
          @click="copyShare"
        >
          {{ copyState === 'copied' ? '✓ Đã sao chép!' : 'Sao chép để chia sẻ' }}
        </button>
      </div>

      <!-- 3-axis metrics -->
      <div class="grid gap-4 sm:grid-cols-3 mb-8">
        <!-- Quality -->
        <div class="bg-bg-surface border border-border-default p-5 text-center">
          <div class="text-xs font-display tracking-widest text-text-dim uppercase mb-2">
            Quality
          </div>
          <div class="font-display text-4xl font-bold text-accent-coral mb-1">
            {{ outcome.quality }}%
          </div>
          <div class="text-xs text-text-secondary">clarity + momentum + mastery</div>
        </div>
        <!-- Mastery -->
        <div class="bg-bg-surface border border-border-default p-5 text-center">
          <div class="text-xs font-display tracking-widest text-text-dim uppercase mb-2">
            Mastery
          </div>
          <div class="font-display text-4xl font-bold text-accent-amber mb-1">
            {{ outcome.finalMastery }}%
          </div>
          <div class="text-xs text-text-secondary">tích lũy từ các hành động</div>
        </div>
        <!-- Consistency -->
        <div class="bg-bg-surface border border-border-default p-5 text-center">
          <div class="text-xs font-display tracking-widest text-text-dim uppercase mb-2">
            Consistency
          </div>
          <div class="font-display text-4xl font-bold mb-1" :style="{ color: selectedHand.color }">
            {{ outcome.consistency }}%
          </div>
          <div class="text-xs text-text-secondary">
            Kỹ năng chủ động + Tuyệt chiêu / tổng số lượt
          </div>
        </div>
      </div>

      <!-- Insight unlock -->
      <div
        v-if="outcome.insightUnlocked"
        class="bg-bg-surface border p-6 mb-8 animate-fade-up animate-delay-3"
        :style="{ borderColor: selectedHand.color }"
      >
        <div
          class="text-xs font-display tracking-widest uppercase mb-3 flex items-center gap-2"
          :style="{ color: selectedHand.color }"
        >
          <span>✦</span> Insight đã mở khóa: {{ selectedHand.signature.label }}
        </div>
        <p class="text-sm text-text-secondary leading-relaxed">{{ selectedHand.sigBody }}</p>
      </div>

      <div
        v-else
        class="bg-bg-surface border border-border-default p-5 mb-8 text-center text-sm text-text-dim animate-fade-up animate-delay-3"
      >
        🔒 Bài học chưa mở — cần điểm Mastery ≥ 50 để xem được Bài học từ Tuyệt chiêu
      </div>

      <!-- Restart -->
      <div class="text-center">
        <button
          class="font-display tracking-widest text-sm border border-border-default bg-bg-surface px-8 py-3 text-text-secondary transition-all duration-200 hover:border-accent-coral hover:text-text-primary hover:-translate-y-0.5"
          @click="restart"
        >
          ↩ Chơi lại
        </button>
      </div>
    </section>
  </div>
  <div v-else class="min-h-screen bg-bg-deep flex items-center justify-center">
    <div class="text-center animate-fade-up">
      <div class="text-4xl mb-4">🧠</div>
      <div class="font-display tracking-widest text-text-dim uppercase text-xs">
        Đang tải dữ liệu đấu trường...
      </div>
    </div>
  </div>
</template>
