export interface GratitudeEntry {
  date: string // YYYY-MM-DD
  items: string[]
  mood: MoodType
  createdAt: number
}

export type MoodType = 'amazing' | 'good' | 'okay' | 'sad' | 'awful'

export interface MoodOption {
  value: MoodType
  label: string
  icon: string
  color: string
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'amazing', label: 'Tuyệt vời', icon: 'lucide:smile-plus', color: '#FFB830' },
  { value: 'good', label: 'Vui vẻ', icon: 'lucide:smile', color: '#38BDF8' },
  { value: 'okay', label: 'Bình thường', icon: 'lucide:meh', color: '#8B9DB5' },
  { value: 'sad', label: 'Buồn', icon: 'lucide:frown', color: '#FF6B4A' },
  { value: 'awful', label: 'Tệ', icon: 'lucide:angry', color: '#ef4444' },
]

export const GRATITUDE_PROMPTS: string[] = [
  'Ai là người đã giúp đỡ bạn hôm nay?',
  'Điều gì khiến bạn mỉm cười hôm nay?',
  'Bạn đã học được gì mới hôm nay?',
  'Khoảnh khắc nào trong ngày bạn cảm thấy bình yên nhất?',
  'Bạn biết ơn sức khỏe của mình vì điều gì?',
  'Ai là người luôn ở bên cạnh bạn?',
  'Điều nhỏ bé nào trong cuộc sống khiến bạn hạnh phúc?',
  'Bạn có thể tự hào về điều gì hôm nay?',
  'Thiên nhiên đã tặng bạn điều gì đẹp đẽ hôm nay?',
  'Bạn biết ơn công việc/học tập của mình vì điều gì?',
  'Ai đã nói điều gì tốt đẹp với bạn gần đây?',
  'Bạn có kỷ niệm nào đẹp muốn nhớ lại?',
  'Bữa ăn nào gần đây khiến bạn thấy ngon miệng?',
  'Bạn đã làm điều tốt gì cho ai khác hôm nay?',
  'Điều gì trong ngôi nhà của bạn khiến bạn cảm thấy thoải mái?',
  'Bạn biết ơn khả năng nào của bản thân?',
  'Bài hát nào gần đây khiến bạn cảm thấy vui?',
  'Điều gì khiến bạn cảm thấy an toàn?',
  'Bạn có người bạn nào muốn nói lời cảm ơn?',
  'Thời tiết hôm nay có điều gì đáng yêu?',
  'Bạn đã vượt qua thử thách gì gần đây?',
  'Cuốn sách/bộ phim nào đã truyền cảm hứng cho bạn?',
  'Bạn biết ơn cơ thể mình vì điều gì?',
  'Điều gì trong công nghệ giúp cuộc sống bạn dễ dàng hơn?',
  'Bạn đã nhận được món quà nào ý nghĩa?',
  'Khoảnh khắc yên tĩnh nào trong ngày bạn yêu thích?',
  'Bạn biết ơn gia đình mình vì điều gì?',
  'Điều gì đã giúp bạn giảm stress hôm nay?',
  'Bạn có cơ hội nào mà nhiều người không có?',
  'Điều giản dị nào khiến bạn cảm thấy đủ đầy?',
]
