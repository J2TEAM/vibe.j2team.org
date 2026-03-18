import type { SolarTerm } from '../types'

/**
 * Sinh nội dung file .ics chuẩn RFC 5545 chứa 24 sự kiện Tiết Khí.
 * Mỗi sự kiện là 1 ngày (all-day event) với tên và mô tả tiết khí.
 */
export function generateICS(terms: SolarTerm[], year: number): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TichPhong//NhanGianTietKhi//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:24 Tiết Khí ${year}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ]

  for (const term of terms) {
    // approxDate có dạng "MM-DD", ví dụ "02-04"
    const [month, day] = term.approxDate.split('-')
    if (!month || !day) continue

    // Tạo DTSTART dạng all-day: YYYYMMDD
    const dtStart = `${year}${month}${day}`

    // Ngày kết thúc = ngày bắt đầu + 1 (all-day event cần DTEND = ngày sau)
    const startDate = new Date(year, parseInt(month) - 1, parseInt(day))
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)
    const dtEnd = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`

    // Timestamp hiện tại cho DTSTAMP
    const now = new Date()
    const dtstamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')

    // UID duy nhất
    const uid = `tietKhi-${term.id}-${year}@tichphong.info`

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:🌿 ${term.name} (${term.chineseName || ''}) - ${term.translation}`,
      `DESCRIPTION:${term.description}\\n\\nLời khuyên dưỡng sinh: ${term.tips}`,
      `CATEGORIES:Tiết Khí,${term.season}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/**
 * Tạo và tải file .ics xuống máy người dùng.
 */
export function downloadICS(terms: SolarTerm[], year: number): void {
  const icsContent = generateICS(terms, year)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `TietKhi-${year}.ics`
  document.body.appendChild(link)
  link.click()

  // Dọn dẹp
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
