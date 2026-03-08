import { computed, ref } from 'vue'

import type { RegexMatch } from '../types'
import {
  collectRegexMatches,
  describeCronField,
  formatDateTimeLocal,
  formatRelativeTime,
  toSlug,
} from '../lib/utils'

export function useTimeTools() {
  const timestampInput = ref(Math.floor(Date.now() / 1000).toString())
  const dateTimeInput = ref(formatDateTimeLocal(new Date()))
  const regexPattern = ref('\\b(dev|tool)\\b')
  const regexFlags = ref('gi')
  const regexSample = ref('Dev Pocket Tools giúp dev kiểm tra regex ngay trong trình duyệt.')
  const slugInput = ref('Bộ công cụ bỏ túi dành cho lập trình viên Việt Nam')
  const cronInput = ref('*/15 9-18 * * 1-5')
  const relativeTimestampInput = ref(Math.floor(Date.now() / 1000).toString())

  const timestampResult = computed(() => {
    const source = timestampInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        normalized: '',
        iso: '',
        local: '',
        message: 'Nhập Unix timestamp theo giây hoặc mili giây.',
      }

    const numericValue = Number(source)
    if (!Number.isFinite(numericValue))
      return {
        tone: 'error' as const,
        normalized: '',
        iso: '',
        local: '',
        message: 'Timestamp phải là số hợp lệ.',
      }

    const milliseconds = source.length <= 10 ? numericValue * 1000 : numericValue
    const date = new Date(milliseconds)
    if (Number.isNaN(date.getTime()))
      return {
        tone: 'error' as const,
        normalized: '',
        iso: '',
        local: '',
        message: 'Timestamp nằm ngoài phạm vi ngày giờ hợp lệ.',
      }

    return {
      tone: 'success' as const,
      normalized: Math.floor(milliseconds / 1000).toString(),
      iso: date.toISOString(),
      local: date.toLocaleString('vi-VN'),
      message: source.length <= 10 ? 'Đang đọc dưới dạng giây.' : 'Đang đọc dưới dạng mili giây.',
    }
  })

  const dateTimeToTimestamp = computed(() => {
    if (!dateTimeInput.value)
      return {
        tone: 'default' as const,
        seconds: '',
        milliseconds: '',
        message: 'Chọn ngày giờ để đổi ngược sang timestamp.',
      }

    const date = new Date(dateTimeInput.value)
    if (Number.isNaN(date.getTime()))
      return {
        tone: 'error' as const,
        seconds: '',
        milliseconds: '',
        message: 'Ngày giờ không hợp lệ.',
      }

    return {
      tone: 'success' as const,
      seconds: Math.floor(date.getTime() / 1000).toString(),
      milliseconds: date.getTime().toString(),
      message: 'Đã chuyển từ ngày giờ cục bộ sang Unix timestamp.',
    }
  })

  const regexResult = computed(() => {
    if (!regexPattern.value)
      return {
        tone: 'default' as const,
        message: 'Nhập pattern và flags để kiểm tra regex.',
        matches: [] as RegexMatch[],
      }

    try {
      const expression = new RegExp(regexPattern.value, regexFlags.value)
      const matches = collectRegexMatches(expression, regexSample.value)
      return {
        tone: matches.length ? ('success' as const) : ('default' as const),
        message: matches.length ? `Tìm thấy ${matches.length} match.` : 'Không có đoạn nào khớp.',
        matches,
      }
    } catch (error) {
      return {
        tone: 'error' as const,
        message: error instanceof Error ? error.message : 'Regex không hợp lệ.',
        matches: [] as RegexMatch[],
      }
    }
  })

  const slugResult = computed(() => {
    const source = slugInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        slug: '',
        message: 'Nhập tiêu đề hoặc cụm từ để tạo slug.',
      }

    const slug = toSlug(source)
    return {
      tone: slug ? ('success' as const) : ('error' as const),
      slug,
      message: slug
        ? 'Slug đã sẵn sàng để dùng trong URL.'
        : 'Không thể tạo slug từ nội dung hiện tại.',
    }
  })

  const cronResult = computed(() => {
    const source = cronInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        message: 'Nhập cron 5 field theo định dạng phút giờ ngày-tháng tháng thứ.',
        output: '',
      }

    const parts = source.split(/\s+/)
    if (parts.length !== 5)
      return {
        tone: 'error' as const,
        message: 'Cron v3 hiện chỉ hỗ trợ đúng 5 field.',
        output: '',
      }

    const [minute = '*', hour = '*', dayOfMonth = '*', month = '*', dayOfWeek = '*'] = parts
    return {
      tone: 'success' as const,
      message: 'Diễn giải cron ở mức đọc nhanh, không thay thế parser đầy đủ.',
      output: `Chạy ${describeCronField(minute, 'phút')} | ${describeCronField(hour, 'giờ')} | ${describeCronField(dayOfMonth, 'ngày trong tháng')} | ${describeCronField(month, 'tháng')} | ${describeCronField(dayOfWeek, 'thứ trong tuần')}.`,
    }
  })

  const relativeTimeResult = computed(() => {
    const source = relativeTimestampInput.value.trim()
    if (!source)
      return {
        tone: 'default' as const,
        message: 'Nhập Unix timestamp để xem relative time.',
        absolute: '',
        relative: '',
      }

    const numericValue = Number(source)
    if (!Number.isFinite(numericValue))
      return {
        tone: 'error' as const,
        message: 'Timestamp phải là số hợp lệ.',
        absolute: '',
        relative: '',
      }

    const milliseconds = source.length <= 10 ? numericValue * 1000 : numericValue
    const date = new Date(milliseconds)
    if (Number.isNaN(date.getTime()))
      return {
        tone: 'error' as const,
        message: 'Timestamp không hợp lệ.',
        absolute: '',
        relative: '',
      }

    return {
      tone: 'success' as const,
      message: 'Đã tính relative time theo thời điểm hiện tại của máy bạn.',
      absolute: date.toLocaleString('vi-VN'),
      relative: formatRelativeTime(date.getTime() - Date.now()),
    }
  })

  function setTimestampNow() {
    timestampInput.value = Math.floor(Date.now() / 1000).toString()
    dateTimeInput.value = formatDateTimeLocal(new Date())
  }

  function useConvertedTimestamp() {
    if (dateTimeToTimestamp.value.seconds) timestampInput.value = dateTimeToTimestamp.value.seconds
  }

  return {
    cronInput,
    cronResult,
    dateTimeInput,
    dateTimeToTimestamp,
    regexFlags,
    regexPattern,
    regexResult,
    regexSample,
    relativeTimeResult,
    relativeTimestampInput,
    setTimestampNow,
    slugInput,
    slugResult,
    timestampInput,
    timestampResult,
    useConvertedTimestamp,
  }
}
