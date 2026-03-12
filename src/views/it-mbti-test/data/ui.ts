import type { Locale } from '../composables/useLocale'

interface UiLabels {
  backHome: string
  startBtn: string
  tagline: string
  introCopy: string
  introStats: { time: string; questions: string; results: string }
  questionLabel: (current: number, total: number) => string
  calculating: string
  calculatingDesc: string
  tabMbti: string
  tabDevil: string
  traitAnalysis: string
  overview: string
  strengths: string
  weaknesses: string
  roleLabel: string
  ally: string
  nemesis: (name: string) => string
  soulmate: (name: string) => string
  prophecy: string
  warning: string
  devilHeader: (count: number) => string
  devilTraits: string
  devilSigns: string
  devilProphecy: string
  devilWarning: string
  retry: string
}

export const ui: Record<Locale, UiLabels> = {
  vi: {
    backHome: '← Về trang chủ',
    startBtn: 'Bắt đầu →',
    tagline: 'Bạn là kiểu dev nào?',
    introCopy:
      '20 câu hỏi. Mỗi tình huống đều quen thuộc một cách đau đớn. Không có câu trả lời đúng hay sai — chỉ có câu trả lời phản ánh con người thật của bạn trong môi trường IT.',
    introStats: { time: '⏱ ~5 phút', questions: '📊 20 câu hỏi', results: '🎯 16+ kết quả' },
    questionLabel: (c, t) => `Câu ${c} / ${t}`,
    calculating: 'Đang phân tích...',
    calculatingDesc: 'Hệ thống đang xử lý tính cách của bạn',
    tabMbti: '🧠 Kết quả MBTI',
    tabDevil: '👿 Con Quỷ Bên Trong',
    traitAnalysis: 'Phân tích chiều hướng',
    overview: '// Overview',
    strengths: '// Điểm mạnh',
    weaknesses: '// Điểm yếu',
    roleLabel: '// Thiên chức trong team',
    ally: '// Quý nhân',
    nemesis: (name) => `// Thiên địch: ${name}`,
    soulmate: (name) => `// Cốt: ${name}`,
    prophecy: '// Lời sấm truyền công sở',
    warning: '⚠ Cảnh báo thiên cơ',
    devilHeader: (count) => `Bạn đã chọn con đường tối ${count} lần`,
    devilTraits: '// Tính cách đặc trưng',
    devilSigns: '// Dấu hiệu nhận biết',
    devilProphecy: '// Lời sấm truyền hắc ám',
    devilWarning: '☠ Cảnh báo',
    retry: 'Làm lại từ đầu',
  },
  en: {
    backHome: '← Back to Home',
    startBtn: 'Start →',
    tagline: 'What kind of dev are you?',
    introCopy:
      '20 questions. Every scenario will feel painfully familiar. There are no right or wrong answers — only answers that reveal who you truly are in an IT environment.',
    introStats: { time: '⏱ ~5 min', questions: '📊 20 questions', results: '🎯 16+ results' },
    questionLabel: (c, t) => `Question ${c} / ${t}`,
    calculating: 'Analyzing...',
    calculatingDesc: 'The system is processing your personality',
    tabMbti: '🧠 MBTI Result',
    tabDevil: '👿 The Dark Side',
    traitAnalysis: 'Trait Analysis',
    overview: '// Overview',
    strengths: '// Strengths',
    weaknesses: '// Weaknesses',
    roleLabel: '// Role in Team',
    ally: '// Ally',
    nemesis: (name) => `// Nemesis: ${name}`,
    soulmate: (name) => `// Soulmate: ${name}`,
    prophecy: '// Office Prophecy',
    warning: '⚠ Cosmic Warning',
    devilHeader: (count) => `You chose the dark path ${count} times`,
    devilTraits: '// Key Traits',
    devilSigns: '// Tell-tale Signs',
    devilProphecy: '// Dark Prophecy',
    devilWarning: '☠ Warning',
    retry: 'Start Over',
  },
}
