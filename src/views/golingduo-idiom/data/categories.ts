export type IdiomCategoryId =
  | 'drama'
  | 'work'
  | 'love'
  | 'money'
  | 'daily'
  | 'motivation'
  | 'food'
  | 'time'

export interface IdiomCategory {
  id: IdiomCategoryId
  label: string
  emoji: string
  accent: 'coral' | 'amber' | 'sky'
  description: string
}

export const idiomCategories: readonly IdiomCategory[] = [
  {
    id: 'drama',
    label: 'Drama & Cảm Xúc',
    emoji: '😭',
    accent: 'coral',
    description: 'Khi drama bùng nổ, mày cần những câu này',
  },
  {
    id: 'work',
    label: 'Công Sở Sống Còn',
    emoji: '💼',
    accent: 'amber',
    description: 'Để sống sót qua mọi cuộc họp và deadline',
  },
  {
    id: 'love',
    label: 'Yêu Đương Éo Le',
    emoji: '❤️',
    accent: 'coral',
    description: 'Tình yêu muôn vẻ, éo le trăm bề',
  },
  {
    id: 'money',
    label: 'Flex Tài Chính',
    emoji: '🤑',
    accent: 'amber',
    description: 'Khi tiền bạc lên tiếng, ai cũng lắng nghe',
  },
  {
    id: 'daily',
    label: 'Đời Thường Việt Nam',
    emoji: '🍜',
    accent: 'sky',
    description: 'Những tình huống đời thường ai cũng từng gặp',
  },
  {
    id: 'motivation',
    label: 'Sống Ảo Motivate',
    emoji: '💪',
    accent: 'coral',
    description: 'Caption sống ảo nhưng học thật',
  },
  {
    id: 'food',
    label: 'Ăn Uống Nói Chuyện',
    emoji: '🍕',
    accent: 'amber',
    description: 'Ăn cũng phải nói kiểu Tây cho sang',
  },
  {
    id: 'time',
    label: 'Thời Gian & Deadline',
    emoji: '⏰',
    accent: 'sky',
    description: 'Deadline đuổi sát đít, cần biết nói sao cho pro',
  },
] as const

export function getIdiomCategory(id: IdiomCategoryId): IdiomCategory | undefined {
  return idiomCategories.find((c) => c.id === id)
}
