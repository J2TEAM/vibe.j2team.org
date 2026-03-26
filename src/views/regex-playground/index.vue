<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

type Difficulty = 'easy' | 'medium' | 'hard'
type CheatGroup = 'common' | 'unicode'

interface CheatItem {
  id: string
  title: string
  pattern: string
  flags: string
  test: string
  note: string
  difficulty: Difficulty
  group: CheatGroup
}

interface PreviewSegment {
  text: string
  matched: boolean
  groupIndex?: number
}

interface GroupUsage {
  index: number
  count: number
  latestValue: string
}

interface TokenCheatItem {
  symbol: string
  meaning: string
  example: string
  group: CheatGroup
}

interface FlagInfo {
  flag: string
  name: string
  meaning: string
}

const sheet: CheatItem[] = [
  {
    id: 'email',
    title: 'Email cơ bản',
    pattern: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}',
    flags: 'gi',
    test: 'hello@j2team.org, support@vibe.vn, invalid@email',
    note: 'Nhận diện email phổ biến trong văn bản.',
    difficulty: 'easy',
    group: 'common',
  },
  {
    id: 'phone-vn',
    title: 'Số điện thoại Việt Nam',
    pattern: '(03|05|07|08|09)\\d{8}',
    flags: 'g',
    test: '0912345678, 0212345678, 0388888888',
    note: 'Bắt đầu bằng các đầu số di động thường gặp.',
    difficulty: 'easy',
    group: 'common',
  },
  {
    id: 'username',
    title: 'Username 4-16 ký tự',
    pattern: '^[a-zA-Z][a-zA-Z0-9_]{3,15}$',
    flags: 'm',
    test: 'valid_user\n2invalid\na\nnew_user_01',
    note: 'Bắt đầu bằng chữ cái, cho phép chữ, số và dấu gạch dưới.',
    difficulty: 'medium',
    group: 'common',
  },
  {
    id: 'hex',
    title: 'Mã màu HEX',
    pattern: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b',
    flags: 'g',
    test: '#fff #12AB8E 123456 #12345',
    note: 'Khớp mã màu 3 hoặc 6 ký tự hệ 16.',
    difficulty: 'medium',
    group: 'common',
  },
  {
    id: 'strong-pass',
    title: 'Mật khẩu mạnh',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,}$',
    flags: 'm',
    test: 'Password1!\nweakpass\nAa1@aaaa',
    note: 'Yêu cầu chữ hoa, chữ thường, số và ký tự đặc biệt.',
    difficulty: 'hard',
    group: 'common',
  },
  {
    id: 'duplicate-word',
    title: 'Từ lặp liên tiếp',
    pattern: '\\b(\\w+)\\s+\\1\\b',
    flags: 'gi',
    test: 'This is is a test. Việt Việt cũng là lặp.',
    note: 'Dùng backreference để phát hiện từ lặp.',
    difficulty: 'hard',
    group: 'common',
  },
  {
    id: 'vi-word-unicode',
    title: 'Từ tiếng Việt có dấu',
    pattern: '\\b[\\p{L}\\p{M}]+\\b',
    flags: 'gu',
    test: 'Tôi học lập trình ở Việt Nam, rất thú vị.',
    note: 'Nhận diện chữ cái Unicode và dấu tổ hợp bằng Unicode property class.',
    difficulty: 'easy',
    group: 'unicode',
  },
  {
    id: 'vi-name',
    title: 'Họ tên tiếng Việt',
    pattern: '^(?=.{2,60}$)([\\p{Lu}][\\p{L}\\p{M}]*)\\s+([\\p{Lu}][\\p{L}\\p{M}]*(?:\\s+[\\p{Lu}][\\p{L}\\p{M}]*)+)$',
    flags: 'u',
    test: 'Nguyễn Nhật Ánh\ntran minh nhat',
    note: 'Dùng capture group để tách phần họ/tên và bắt buộc chữ hoa đầu từ.',
    difficulty: 'medium',
    group: 'unicode',
  },
  {
    id: 'emoji-unicode',
    title: 'Emoji bằng Unicode property',
    pattern: '(\\p{Extended_Pictographic})(\\uFE0F)?',
    flags: 'gu',
    test: 'Code vui 😄🔥 và ổn định ✅',
    note: 'Nhận diện emoji bằng property Unicode thay vì hard-code danh sách ký tự.',
    difficulty: 'hard',
    group: 'unicode',
  },
  {
    id: 'normalize-combining',
    title: 'Ký tự có dấu tổ hợp',
    pattern: '([\\p{L}])(\\p{M}+)',
    flags: 'gu',
    test: 'á ê ơ là dạng ký tự + dấu tách rời',
    note: 'Phù hợp khi xử lý dữ liệu normalize dạng NFD (base char + combining marks).',
    difficulty: 'hard',
    group: 'unicode',
  },
]

const tokenCheatSheet: TokenCheatItem[] = [
  {
    symbol: '.',
    meaning: 'Khớp mọi ký tự (trừ newline nếu không có s flag)',
    example: 'a.c khớp abc, a9c',
    group: 'common',
  },
  {
    symbol: '*',
    meaning: 'Lặp 0 hoặc nhiều lần',
    example: 'ab*c khớp ac, abc, abbc',
    group: 'common',
  },
  {
    symbol: '+',
    meaning: 'Lặp 1 hoặc nhiều lần',
    example: 'ab+c khớp abc, abbc; không khớp ac',
    group: 'common',
  },
  {
    symbol: '?',
    meaning: 'Tùy chọn 0 hoặc 1 lần',
    example: 'colou?r khớp color và colour',
    group: 'common',
  },
  {
    symbol: '^  $',
    meaning: 'Neo đầu chuỗi và cuối chuỗi',
    example: '^abc$ chỉ khớp đúng chuỗi abc',
    group: 'common',
  },
  {
    symbol: '[...]',
    meaning: 'Character class, chọn 1 ký tự trong tập',
    example: '[aeiou] khớp 1 nguyên âm',
    group: 'common',
  },
  {
    symbol: '(...)',
    meaning: 'Capture group để gom và trích xuất phần khớp',
    example: '(\\d{2})/(\\d{2}) tạo Group 1, Group 2',
    group: 'common',
  },
  {
    symbol: '|',
    meaning: 'OR, chọn 1 trong nhiều nhánh',
    example: 'cat|dog khớp cat hoặc dog',
    group: 'common',
  },
  {
    symbol: '\\d  \\w  \\s',
    meaning: 'Digit, word char, whitespace',
    example: '\\d+ khớp 123; \\s+ khớp khoảng trắng',
    group: 'common',
  },
  {
    symbol: '\\b',
    meaning: 'Word boundary (ranh giới từ)',
    example: '\\bcat\\b không khớp scatter',
    group: 'common',
  },
  {
    symbol: '\\p{L} / \\p{M}',
    meaning: 'Unicode letter / combining mark (cần u flag)',
    example: '[\\p{L}\\p{M}] để bắt chữ tiếng Việt có dấu',
    group: 'unicode',
  },
  {
    symbol: '\\p{Lu} / \\p{Ll}',
    meaning: 'Chữ hoa Unicode / chữ thường Unicode',
    example: '\\p{Lu} hữu ích khi validate tên riêng',
    group: 'unicode',
  },
  {
    symbol: '\\p{Extended_Pictographic}',
    meaning: 'Nhóm Unicode cho emoji/pictographic',
    example: '(\\p{Extended_Pictographic})(\\uFE0F)?',
    group: 'unicode',
  },
  {
    symbol: 'u flag',
    meaning: 'Bật Unicode mode cho property class và code point',
    example: '/\\p{L}+/u',
    group: 'unicode',
  },
  {
    symbol: 'd flag',
    meaning: 'Trả về indices cho từng group, phục vụ tô màu group',
    example: '/(ab)(cd)/gd để lấy vị trí Group 1, 2',
    group: 'unicode',
  },
]

const flagDictionary: Record<string, FlagInfo> = {
  g: {
    flag: 'g',
    name: 'Global',
    meaning: 'Tìm tất cả kết quả khớp trong chuỗi, không dừng ở lần đầu.',
  },
  i: {
    flag: 'i',
    name: 'Ignore Case',
    meaning: 'Không phân biệt chữ hoa và chữ thường.',
  },
  m: {
    flag: 'm',
    name: 'Multiline',
    meaning: '^ và $ sẽ hoạt động theo từng dòng.',
  },
  s: {
    flag: 's',
    name: 'DotAll',
    meaning: 'Dấu chấm . sẽ khớp cả ký tự xuống dòng.',
  },
  u: {
    flag: 'u',
    name: 'Unicode',
    meaning: 'Bật Unicode mode, cần cho \\p{...} và xử lý code point đúng.',
  },
  y: {
    flag: 'y',
    name: 'Sticky',
    meaning: 'Chỉ khớp tại vị trí lastIndex hiện tại.',
  },
  d: {
    flag: 'd',
    name: 'Indices',
    meaning: 'Trả về vị trí start/end của từng capture group.',
  },
  v: {
    flag: 'v',
    name: 'Unicode Sets',
    meaning: 'Bật cú pháp Unicode set nâng cao.',
  },
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
const groups: CheatGroup[] = ['common', 'unicode']
const activeDifficulty = ref<Difficulty>('easy')
const activeGroup = ref<CheatGroup>('common')
const regexPattern = ref(sheet[0]?.pattern ?? '')
const regexFlags = ref(sheet[0]?.flags ?? 'g')
const testString = ref(sheet[0]?.test ?? '')
const colorByCapture = ref(true)

const capturePalette = [
  'border border-accent-coral/60 bg-accent-coral/15 text-text-primary px-0.5',
  'border border-accent-sky/60 bg-accent-sky/15 text-text-primary px-0.5',
  'border border-accent-amber/60 bg-accent-amber/15 text-text-primary px-0.5',
] as const

const difficultyLabel = (level: Difficulty) => {
  if (level === 'easy') return 'Dễ'
  if (level === 'medium') return 'Vừa'
  return 'Khó'
}

const groupLabel = (group: CheatGroup) => {
  if (group === 'common') return 'Phổ biến'
  return 'Tiếng Việt & Unicode'
}

const safeFlags = computed(() => {
  const accepted = new Set<string>()

  for (const flag of regexFlags.value) {
    if ('dgimsuvy'.includes(flag)) accepted.add(flag)
  }

  return Array.from(accepted).join('')
})

const visibleSheet = computed(() => {
  return sheet.filter((item) => {
    return item.difficulty === activeDifficulty.value && item.group === activeGroup.value
  })
})

const visibleTokenCheatSheet = computed(() => {
  return tokenCheatSheet.filter((item) => item.group === activeGroup.value)
})

const activeFlagDetails = computed(() => {
  return safeFlags.value
    .split('')
    .map((flag) => flagDictionary[flag])
    .filter((item): item is FlagInfo => item !== undefined)
})

const playgroundWarnings = computed(() => {
  const warnings: string[] = []
  const pattern = regexPattern.value

  if (/\\\\p\{/.test(pattern) && !safeFlags.value.includes('u')) {
    warnings.push('Pattern có \\p{...} nhưng thiếu flag u, regex có thể lỗi hoặc khớp sai.')
  }

  if (colorByCapture.value && !safeFlags.value.includes('d')) {
    warnings.push('Chế độ tô theo capture group đang tự bật thêm flag d để lấy vị trí group.')
  }

  return warnings
})

const preview = computed(() => {
  const content = testString.value
  const initial = {
    segments: [{ text: content || 'Chưa có test string.', matched: false }] as PreviewSegment[],
    count: 0,
    groups: [] as GroupUsage[],
    error: '',
  }

  if (!regexPattern.value || !content) return initial

  try {
    let flags = safeFlags.value.includes('g') ? safeFlags.value : `${safeFlags.value}g`
    if (colorByCapture.value && !flags.includes('d')) {
      flags += 'd'
    }

    const matcher = new RegExp(regexPattern.value, flags)
    const segments: PreviewSegment[] = []
    const groupCounter = new Map<number, number>()
    const groupLatestValue = new Map<number, string>()
    let cursor = 0
    let count = 0
    let match = matcher.exec(content)

    while (match) {
      const matchedText = match[0]
      const index = match.index

      if (matchedText.length === 0) {
        matcher.lastIndex += 1
        match = matcher.exec(content)
        continue
      }

      if (index > cursor) {
        segments.push({ text: content.slice(cursor, index), matched: false })
      }

      for (let groupIndex = 1; groupIndex < match.length; groupIndex += 1) {
        const groupValue = match[groupIndex]
        if (groupValue === undefined) continue

        groupCounter.set(groupIndex, (groupCounter.get(groupIndex) ?? 0) + 1)
        groupLatestValue.set(groupIndex, groupValue)
      }

      if (!colorByCapture.value) {
        segments.push({ text: matchedText, matched: true, groupIndex: 0 })
      }
      else {
        const fullStart = index
        const fullEnd = index + matchedText.length
        let innerCursor = fullStart

        const matchWithIndices = match as RegExpExecArray & {
          indices?: Array<[number, number] | undefined>
        }

        const rawGroupSpans = (matchWithIndices.indices ?? [])
          .slice(1)
          .map((span, groupOffset) => {
            if (!span) return null
            const [start, end] = span
            if (start < fullStart || end > fullEnd || start >= end) return null

            return {
              start,
              end,
              groupIndex: groupOffset + 1,
            }
          })
          .filter((span): span is { start: number, end: number, groupIndex: number } => span !== null)
          .sort((a, b) => {
            if (a.start === b.start) return a.end - b.end
            return a.start - b.start
          })

        for (const span of rawGroupSpans) {
          if (span.start < innerCursor) continue

          if (span.start > innerCursor) {
            segments.push({
              text: content.slice(innerCursor, span.start),
              matched: true,
              groupIndex: 0,
            })
          }

          segments.push({
            text: content.slice(span.start, span.end),
            matched: true,
            groupIndex: span.groupIndex,
          })
          innerCursor = span.end
        }

        if (innerCursor < fullEnd) {
          segments.push({
            text: content.slice(innerCursor, fullEnd),
            matched: true,
            groupIndex: 0,
          })
        }

        if (rawGroupSpans.length === 0) {
          segments.push({ text: matchedText, matched: true, groupIndex: 0 })
        }
      }

      cursor = index + matchedText.length
      count += 1
      match = matcher.exec(content)
    }

    if (cursor < content.length) {
      segments.push({ text: content.slice(cursor), matched: false })
    }

    if (segments.length === 0) {
      segments.push({ text: content, matched: false })
    }

    return {
      segments,
      count,
      groups: Array.from(groupCounter.entries())
        .map(([groupIndex, groupCount]) => ({
          index: groupIndex,
          count: groupCount,
          latestValue: groupLatestValue.get(groupIndex) ?? '',
        }))
        .sort((a, b) => a.index - b.index),
      error: '',
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Regex không hợp lệ'

    return {
      segments: [{ text: content, matched: false }],
      count: 0,
      groups: [],
      error: message,
    }
  }
})

function segmentClass(segment: PreviewSegment): string {
  if (!segment.matched) return ''

  if (!segment.groupIndex || segment.groupIndex <= 0) {
    return 'border border-accent-amber/50 bg-accent-amber/20 text-accent-amber px-0.5'
  }

  return capturePalette[(segment.groupIndex - 1) % capturePalette.length] ?? capturePalette[0]
}

function applyCheat(item: CheatItem): void {
  regexPattern.value = item.pattern
  regexFlags.value = item.flags
  testString.value = item.test
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header class="animate-fade-up">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="font-display text-xs tracking-[0.2em] text-accent-amber">LEARN REGEX STEP BY STEP</p>
            <h1 class="font-display text-4xl font-bold text-accent-coral sm:text-5xl">Regex Playground</h1>
            <p class="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
              Nhập regex pattern, flags và test string để xem match highlight trực tiếp.
              Có cheat sheet theo 3 mức: dễ, vừa, khó.
            </p>
          </div>

          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:house" class="size-4" />
            Trang chủ
          </RouterLink>
        </div>
      </header>

      <section class="mt-6 border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up animate-delay-2">
        <h2 class="font-display text-2xl font-semibold">
          <span class="mr-2 text-accent-coral">//</span>
          Playground
        </h2>

        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <label class="block">
            <span class="text-xs uppercase tracking-wide text-text-dim">Regex pattern</span>
            <input
              v-model="regexPattern"
              type="text"
              placeholder="(03|05|07|08|09)\\d{8}"
              class="mt-2 w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
          </label>

          <label class="block">
            <span class="text-xs uppercase tracking-wide text-text-dim">Flags</span>
            <input
              v-model="regexFlags"
              type="text"
              placeholder="g"
              class="mt-2 w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
            <p class="mt-1 text-xs text-text-dim">Flags hợp lệ đang dùng: {{ safeFlags || '(none)' }}</p>
          </label>
        </div>

        <label class="mt-4 block">
          <span class="text-xs uppercase tracking-wide text-text-dim">Test string</span>
          <textarea
            v-model="testString"
            rows="5"
            class="mt-2 w-full border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            placeholder="Dán chuỗi cần test tại đây"
          />
        </label>

        <div class="mt-4 border border-border-default bg-bg-elevated p-3">
          <p class="text-xs uppercase tracking-wide text-text-dim">Giải thích nhanh</p>
          <p class="mt-2 text-xs text-text-secondary">
            Regex hiện tại: <span class="text-text-primary">/{{ regexPattern || '(trống)' }}/{{ safeFlags || '(none)' }}</span>
          </p>

          <div v-if="activeFlagDetails.length > 0" class="mt-2 grid gap-2 md:grid-cols-2">
            <div
              v-for="item in activeFlagDetails"
              :key="item.flag"
              class="border border-border-default bg-bg-surface px-3 py-2"
            >
              <p class="text-xs text-text-primary">
                <span class="font-semibold">{{ item.flag }}</span>
                · {{ item.name }}
              </p>
              <p class="mt-1 text-xs text-text-secondary">{{ item.meaning }}</p>
            </div>
          </div>

          <p v-else class="mt-2 text-xs text-text-secondary">Chưa có flag nào. Bạn có thể thử g hoặc gi.</p>

          <div v-if="playgroundWarnings.length > 0" class="mt-3 grid gap-2">
            <p
              v-for="warning in playgroundWarnings"
              :key="warning"
              class="border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-xs text-text-primary"
            >
              {{ warning }}
            </p>
          </div>
        </div>

        <div class="mt-4 border border-border-default bg-bg-elevated p-3">
          <p class="text-xs uppercase tracking-wide text-text-dim">Live highlight</p>
          <p class="mt-1 text-xs text-text-secondary">Số match: <span class="text-accent-amber">{{ preview.count }}</span></p>

          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="border px-3 py-1.5 text-xs transition"
              :class="
                !colorByCapture
                  ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                  : 'border-border-default bg-bg-surface text-text-secondary hover:text-text-primary'
              "
              @click="colorByCapture = false"
            >
              Tô theo toàn bộ match
            </button>

            <button
              type="button"
              class="border px-3 py-1.5 text-xs transition"
              :class="
                colorByCapture
                  ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                  : 'border-border-default bg-bg-surface text-text-secondary hover:text-text-primary'
              "
              @click="colorByCapture = true"
            >
              Tô theo từng capture group
            </button>
          </div>

          <div v-if="preview.groups.length > 0 && colorByCapture" class="mt-2 flex flex-wrap gap-2 text-xs">
            <span
              v-for="group in preview.groups"
              :key="group.index"
              :class="segmentClass({ text: '', matched: true, groupIndex: group.index })"
            >
              Group {{ group.index }} · {{ group.count }} lần
            </span>
          </div>

          <div
            v-if="preview.groups.length > 0 && colorByCapture"
            class="mt-3 overflow-x-auto border border-border-default bg-bg-surface"
          >
            <table class="min-w-full text-left text-xs text-text-secondary">
              <thead class="border-b border-border-default bg-bg-elevated text-text-dim">
                <tr>
                  <th class="px-3 py-2 font-medium">Capture group</th>
                  <th class="px-3 py-2 font-medium">Số lần khớp</th>
                  <th class="px-3 py-2 font-medium">Giá trị match gần nhất</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="group in preview.groups" :key="`row-${group.index}`" class="border-b border-border-default/70">
                  <td class="px-3 py-2">
                    <span :class="segmentClass({ text: '', matched: true, groupIndex: group.index })">
                      Group {{ group.index }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-text-primary">{{ group.count }}</td>
                  <td class="px-3 py-2 text-text-primary whitespace-pre-wrap wrap-break-word">
                    {{ group.latestValue || '(rỗng)' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="preview.error" class="mt-2 text-sm text-accent-coral">Regex lỗi: {{ preview.error }}</p>

          <div v-else class="mt-2 min-h-20 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-text-secondary">
            <template v-for="(segment, index) in preview.segments" :key="`${index}-${segment.text}`">
              <span :class="segmentClass(segment)">
                {{ segment.text }}
              </span>
            </template>
          </div>
        </div>
      </section>

      <section class="mt-6 border border-border-default bg-bg-surface p-4 sm:p-6 animate-fade-up animate-delay-3">
        <h2 class="font-display text-2xl font-semibold">
          <span class="mr-2 text-accent-coral">//</span>
          Cheat Sheet
        </h2>
        <p class="mt-2 text-sm text-text-secondary">
          Mẫu regex cho người mới, gồm nhóm phổ biến và nhóm tiếng Việt/Unicode nâng cao.
        </p>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            v-for="group in groups"
            :key="group"
            type="button"
            class="border px-3 py-2 text-sm transition"
            :class="
              activeGroup === group
                ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
            "
            @click="activeGroup = group"
          >
            {{ groupLabel(group) }}
          </button>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            v-for="level in difficulties"
            :key="level"
            type="button"
            class="border px-3 py-2 text-sm transition"
            :class="
              activeDifficulty === level
                ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
            "
            @click="activeDifficulty = level"
          >
            {{ difficultyLabel(level) }}
          </button>
        </div>

        <div class="mt-4 overflow-x-auto border border-border-default bg-bg-elevated">
          <table class="min-w-full text-left text-xs text-text-secondary">
            <thead class="border-b border-border-default bg-bg-surface text-text-dim">
              <tr>
                <th class="px-3 py-2 font-medium">Ký tự / cú pháp</th>
                <th class="px-3 py-2 font-medium">Dùng để làm gì</th>
                <th class="px-3 py-2 font-medium">Ví dụ nhanh</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in visibleTokenCheatSheet"
                :key="`token-${item.symbol}-${item.example}`"
                class="border-b border-border-default/70"
              >
                <td class="px-3 py-2 text-text-primary whitespace-nowrap">{{ item.symbol }}</td>
                <td class="px-3 py-2">{{ item.meaning }}</td>
                <td class="px-3 py-2 text-text-primary whitespace-pre-wrap wrap-break-word">{{ item.example }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 grid gap-3">
          <article
            v-for="item in visibleSheet"
            :key="item.id"
            class="border border-border-default bg-bg-elevated p-3"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="font-display text-base text-text-primary">{{ item.title }}</p>
                <p class="mt-1 text-xs text-text-dim">{{ item.note }}</p>
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-2 border border-accent-sky/60 bg-accent-sky/10 px-3 py-1.5 text-xs text-text-primary transition hover:border-accent-sky"
                @click="applyCheat(item)"
              >
                <Icon icon="lucide:wand-sparkles" class="size-4" />
                Dùng mẫu
              </button>
            </div>

            <pre
              class="mt-3 overflow-x-auto border border-border-default bg-bg-surface p-3 text-xs leading-6 text-text-secondary"
            ><code>/{{ item.pattern }}/{{ item.flags }}</code></pre>

            <p class="mt-2 text-xs text-text-secondary">
              Chuỗi mẫu: <span class="text-text-primary">{{ item.test }}</span>
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
