export type TechCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'cache'
  | 'message-queue'
  | 'cdn'
  | 'load-balancer'
  | 'container'
  | 'monitoring'
  | 'ci-cd'
  | 'security'
  | 'storage'

export const CATEGORY_LABELS: Record<TechCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  cache: 'Cache',
  'message-queue': 'Message Queue',
  cdn: 'CDN',
  'load-balancer': 'Load Balancer',
  container: 'Container & Orchestration',
  monitoring: 'Monitoring',
  'ci-cd': 'CI/CD',
  security: 'Bảo mật',
  storage: 'Lưu trữ',
}

export const CATEGORY_ICONS: Record<TechCategory, string> = {
  frontend: 'lucide:monitor',
  backend: 'lucide:server',
  database: 'lucide:database',
  cache: 'lucide:zap',
  'message-queue': 'lucide:mail',
  cdn: 'lucide:globe',
  'load-balancer': 'lucide:scale',
  container: 'lucide:box',
  monitoring: 'lucide:activity',
  'ci-cd': 'lucide:git-branch',
  security: 'lucide:shield',
  storage: 'lucide:hard-drive',
}

export const CATEGORY_DESCRIPTIONS: Record<TechCategory, string> = {
  frontend: 'Framework giao diện người dùng',
  backend: 'Framework xử lý logic phía server',
  database: 'Cơ sở dữ liệu lưu trữ và truy vấn',
  cache: 'Bộ nhớ đệm tăng tốc truy xuất',
  'message-queue': 'Hàng đợi xử lý tác vụ bất đồng bộ',
  cdn: 'Mạng phân phối nội dung toàn cầu',
  'load-balancer': 'Cân bằng tải giữa các server',
  container: 'Đóng gói và điều phối ứng dụng',
  monitoring: 'Giám sát hiệu suất và lỗi',
  'ci-cd': 'Tự động hóa build, test và deploy',
  security: 'Bảo vệ hệ thống khỏi tấn công',
  storage: 'Lưu trữ file và media',
}

export interface TechMetrics {
  /** Requests per second baseline (single instance) */
  throughput: number
  /** Added latency in ms (lower = better) */
  latency: number
  /** Security score 0-100 */
  security: number
  /** Monthly cost in USD */
  cost: number
  /** Uptime reliability 0-100 */
  reliability: number
  /** Horizontal scaling multiplier 1.0-3.0 */
  scalingFactor: number
}

export interface TechProfile {
  id: string
  name: string
  nameVi: string
  description: string
  category: TechCategory
  icon: string
  complexity: 1 | 2 | 3 | 4 | 5
  metrics: TechMetrics
  synergies: string[]
  conflicts: string[]
  requires: TechCategory[]
  tags: string[]
}

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Nhập môn',
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
  expert: 'Chuyên gia',
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: 'text-accent-sky',
  easy: 'text-green-400',
  medium: 'text-accent-amber',
  hard: 'text-accent-coral',
  expert: 'text-red-500',
}

export interface ChallengeConstraints {
  minThroughput: number
  maxLatency: number
  minSecurity: number
  maxCost: number
  minReliability: number
  requiredCategories: TechCategory[]
}

export interface Challenge {
  id: number
  difficulty: Difficulty
  customerName: string
  customerAvatar: string
  requirement: string
  detailedRequirements: string
  targetUsers: number
  constraints: ChallengeConstraints
  hints: string[]
  starThresholds: { one: number; two: number; three: number }
  bonusObjectives?: string[]
}

export interface SystemMetrics {
  throughput: number
  latency: number
  security: number
  cost: number
  reliability: number
}

export interface MetricBreakdown {
  metric: string
  metricVi: string
  actual: number
  required: number
  subScore: number
  unit: string
}

export interface EvaluationResult {
  score: number
  stars: 0 | 1 | 2 | 3
  passed: boolean
  breakdown: MetricBreakdown[]
  tips: string[]
  optimalTechIds: string[]
}

export interface GameProgress {
  unlockedLevel: number
  stars: Record<number, number>
  totalStars: number
}

export type GameView = 'menu' | 'playing' | 'result'
export type PlayMode = 'level' | 'random' | 'custom'

export interface GlossaryEntry {
  term: string
  termVi: string
  definitionVi: string
  category?: string
}
