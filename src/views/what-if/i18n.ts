export type Lang = 'en' | 'vi'

export interface I18nSchema {
  langToggleLabel: string
  heroSubtitle: string
  clickHint: string
  shuffling: string
  drawAnother: string
  backToHome: string
  cardBack: string
  categories: Record<string, string>
}

export const i18n: Record<Lang, I18nSchema> = {
  en: {
    langToggleLabel: 'Tiếng Việt',
    heroSubtitle:
      'Our future is woven from countless assumptions and hidden crossroads behind every choice. Each question, each card revealed opens a door to a new reality. Choose your next path and discover the version of yourself you will become.',
    clickHint: 'Click the deck to draw a card',
    shuffling: 'Shuffling…',
    drawAnother: 'Draw another card',
    backToHome: 'Back to home',
    cardBack: 'What if?',
    categories: {
      career: 'Career & Achievement',
      wealth: 'Wealth & Finance',
      health: 'Health & Wellness',
      relationships: 'Relationships & Family',
      growth: 'Personal Growth',
      lifestyle: 'Lifestyle & Experience',
      impact: 'Social Impact',
      technology: 'Technology & Future',
      alternative: 'Alternative Realities',
      reflection: 'Self-Reflection',
    },
  },
  vi: {
    langToggleLabel: 'English',
    heroSubtitle:
      'Tương lai của mỗi chúng ta vốn được dệt nên từ vô vàn những giả định và ngã rẽ ẩn mình sau mỗi lựa chọn. Mỗi câu hỏi, mỗi lá bài được lật sẽ mở ra cánh cửa đưa chúng ta đến một thực tại mới. Hãy chọn con đường tiếp theo mà bạn sẽ đi và khám phá phiên bản mình sẽ trở thành.',
    clickHint: 'Nhấn vào bộ bài để rút một lá',
    shuffling: 'Đang xào bài…',
    drawAnother: 'Rút lá khác',
    backToHome: 'Về trang chủ',
    cardBack: 'What if?',
    categories: {
      career: 'Sự nghiệp & Thành tựu',
      wealth: 'Tài chính & Thịnh vượng',
      health: 'Sức khỏe & Thể chất',
      relationships: 'Mối quan hệ & Gia đình',
      growth: 'Phát triển bản thân',
      lifestyle: 'Lối sống & Trải nghiệm',
      impact: 'Tác động xã hội',
      technology: 'Công nghệ & Tương lai',
      alternative: 'Thực tại thay thế',
      reflection: 'Tự vấn sâu sắc',
    },
  },
}
