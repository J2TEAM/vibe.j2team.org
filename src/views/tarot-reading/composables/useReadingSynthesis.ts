// ──────────────────────────────────────────────
// Tổng hợp lời giải — tạo lời diễn giải ngôn ngữ tự nhiên
// bằng cách kết hợp ý nghĩa ba lá bài qua các vị trí.
//
// Single Responsibility (SRP): module này CHỈ xử lý sinh văn bản.
// Nhận các lá bài đã rút và trả về chuỗi lời giải đã định dạng.
// ──────────────────────────────────────────────

import type { DrawnCard, SpreadPosition } from '../types'

/** Cụm từ mở đầu cho mỗi vị trí trong trải bài */
const POSITION_INTROS: Record<SpreadPosition, string> = {
  past: 'Nhìn lại quá khứ của bạn',
  present: 'Trong khoảnh khắc hiện tại',
  future: 'Hướng về tương lai',
}

/** Nhãn hiển thị cho người dùng ở mỗi vị trí */
export const POSITION_LABELS: Record<SpreadPosition, string> = {
  past: 'Quá Khứ',
  present: 'Hiện Tại',
  future: 'Tương Lai',
}

/** Cụm từ kết nối giữa các vị trí trong lời giải */
const TRANSITIONS: readonly string[] = ['Nền tảng này định hình', 'Dựa trên năng lượng này,']

/**
 * Tạo đoạn diễn giải cho một lá bài.
 * Chọn ý nghĩa xuôi hoặc ngược tùy theo hướng lá bài.
 */
function interpretCard(drawn: DrawnCard): string {
  const { card, reversed, position } = drawn
  const intro = POSITION_INTROS[position]
  const orientation = reversed ? 'ngược' : 'xuôi'
  const meaning = reversed ? card.reversedMeaning : card.uprightMeaning
  const keywordList = card.keywords.slice(0, 3).join(', ')

  return (
    `${intro}, **${card.name}** xuất hiện ở thế ${orientation}. ` +
    `Chủ đề chính: *${keywordList}*. ` +
    meaning
  )
}

/**
 * Tạo tổng kết toàn diện kết nối cả ba lá bài.
 * Cung cấp cung tường thuật từ quá khứ → hiện tại → tương lai.
 */
function generateSummary(spread: DrawnCard[]): string {
  const past = spread[0]
  const present = spread[1]
  const future = spread[2]

  if (!past || !present || !future) return ''

  const pastTheme = past.card.keywords[0] ?? 'quá khứ'
  const futureTheme = future.card.keywords[0] ?? 'tương lai'
  const presentOrientation = present.reversed ? 'thử thách' : 'sức mạnh'

  return (
    `Hành trình của bạn vạch ra một cung từ **${past.card.name}** qua ` +
    `**${present.card.name}** hướng tới **${future.card.name}**. ` +
    `Năng lượng của *${pastTheme}* đã đặt nền móng cho nơi bạn đứng hôm nay. ` +
    `Hãy tựa vào ${presentOrientation} hiện tại và tin rằng ` +
    `chủ đề *${futureTheme}* sẽ dẫn dắt bước tiếp theo của bạn. ` +
    `Hãy nhớ: các lá bài soi sáng khả năng — lựa chọn của bạn định hình kết quả.`
  )
}

/**
 * Tổng hợp lời giải ba lá bài hoàn chỉnh.
 *
 * Cách hoạt động (logic kết hợp):
 * 1. Mỗi lá bài được diễn giải trong ngữ cảnh vị trí (quá khứ/hiện tại/tương lai)
 * 2. Cụm từ chuyển tiếp kết nối các vị trí theo dòng tường thuật
 * 3. Tổng kết toàn diện kết nối cả ba lá thành một cung mạch lạc
 *
 * Trả về mảng các đoạn văn (lời giải từng lá + tổng kết).
 */
export function synthesizeReading(spread: DrawnCard[]): string[] {
  if (spread.length !== 3) return []

  const paragraphs: string[] = []

  // Diễn giải từng lá bài theo ngữ cảnh vị trí
  spread.forEach((drawn, index) => {
    let paragraph = interpretCard(drawn)

    // Thêm cụm từ chuyển tiếp sang lá tiếp theo (trừ lá cuối)
    if (index < 2) {
      const nextPosition = spread[index + 1]?.position ?? 'future'
      const nextLabel = POSITION_LABELS[nextPosition] ?? 'Tương Lai'
      const transition = TRANSITIONS[index] ?? 'Kết nối với'
      paragraph += ` ${transition} năng lượng ${nextLabel} của bạn.`
    }

    paragraphs.push(paragraph)
  })

  // Thêm tổng kết toàn diện
  const summary = generateSummary(spread)
  if (summary) {
    paragraphs.push(summary)
  }

  return paragraphs
}
