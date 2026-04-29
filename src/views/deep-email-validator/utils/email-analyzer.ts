export type CheckStatus = 'pass' | 'warning' | 'fail'

export interface ValidationCheck {
  id: string
  label: string
  status: CheckStatus
  message: string
  technical: string
}

export interface ValidationSuggestion {
  value: string
  reason: string
}

export interface ValidationResult {
  status: CheckStatus
  score: number
  normalizedEmail: string
  checks: ValidationCheck[]
  suggestions: ValidationSuggestion[]
  warnings: ValidationCheck[]
}

interface ParsedEmail {
  normalizedEmail: string
  hasSingleAt: boolean
  localPart: string
  domainPart: string
  domainLabels: string[]
}

const ROLE_BASED_LOCALS = new Set([
  'admin',
  'administrator',
  'billing',
  'contact',
  'hello',
  'hr',
  'info',
  'marketing',
  'noreply',
  'no-reply',
  'sales',
  'support',
  'team',
])

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'maildrop.cc',
  'temp-mail.org',
  'tempmail.com',
  'yopmail.com',
])

const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'aol.com',
  'gmx.com',
]

export function analyzeEmail(rawEmail: string): ValidationResult {
  const parsed = parseEmail(rawEmail)
  const checks = runBaseChecks(parsed)
  const suggestions = runRiskChecks(parsed, checks)
  const score = computeScore(checks)
  const status = computeStatus(checks)

  return {
    status,
    score,
    normalizedEmail: parsed.normalizedEmail,
    checks,
    suggestions,
    warnings: checks.filter((check) => check.status === 'warning'),
  }
}

function parseEmail(rawEmail: string): ParsedEmail {
  const normalizedEmail = rawEmail.toLowerCase()
  const atIndex = normalizedEmail.lastIndexOf('@')
  const hasSingleAt = atIndex > 0 && atIndex === normalizedEmail.indexOf('@')
  const localPart = hasSingleAt ? normalizedEmail.slice(0, atIndex) : ''
  const domainPart = hasSingleAt ? normalizedEmail.slice(atIndex + 1) : ''
  const domainLabels = domainPart.length > 0 ? domainPart.split('.') : []

  return {
    normalizedEmail,
    hasSingleAt,
    localPart,
    domainPart,
    domainLabels,
  }
}

function runBaseChecks(parsed: ParsedEmail): ValidationCheck[] {
  const checks: ValidationCheck[] = []
  const { normalizedEmail, hasSingleAt, localPart, domainPart, domainLabels } = parsed

  checks.push({
    id: 'required',
    label: 'Không để trống',
    status: normalizedEmail.length > 0 ? 'pass' : 'fail',
    message: normalizedEmail.length > 0 ? 'Đã nhập email.' : 'Email đang để trống.',
    technical: 'Input phải chứa ít nhất 1 ký tự khác khoảng trắng.',
  })

  checks.push({
    id: 'at-sign',
    label: 'Cấu trúc @',
    status: hasSingleAt ? 'pass' : 'fail',
    message: hasSingleAt ? 'Có đúng một ký tự @.' : 'Email cần đúng một ký tự @.',
    technical: 'Chuỗi phải có local-part và domain-part phân tách bởi 1 ký tự @.',
  })

  const syntaxPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/
  const syntaxOk = syntaxPattern.test(normalizedEmail)
  checks.push({
    id: 'syntax',
    label: 'Cú pháp cơ bản',
    status: syntaxOk ? 'pass' : 'fail',
    message: syntaxOk
      ? 'Khớp cú pháp email phổ biến.'
      : 'Chưa khớp cú pháp email phổ biến (ký tự hoặc định dạng chưa đúng).',
    technical: 'Regex baseline cho local/domain và yêu cầu domain có ít nhất 1 dấu chấm.',
  })

  const totalLengthOk = normalizedEmail.length > 0 && normalizedEmail.length <= 254
  checks.push({
    id: 'total-length',
    label: 'Độ dài tổng',
    status: totalLengthOk ? 'pass' : 'fail',
    message: totalLengthOk ? 'Độ dài tổng hợp lệ.' : 'Email vượt quá 254 ký tự.',
    technical: 'Giới hạn độ dài chuẩn thường dùng: tối đa 254 ký tự.',
  })

  const localLengthOk = localPart.length > 0 && localPart.length <= 64
  checks.push({
    id: 'local-length',
    label: 'Độ dài local-part',
    status: localLengthOk ? 'pass' : 'fail',
    message: localLengthOk ? 'Local-part hợp lệ.' : 'Local-part phải từ 1 đến 64 ký tự.',
    technical: 'Giới hạn local-part tối đa 64 ký tự.',
  })

  const domainLengthOk = domainPart.length > 0 && domainPart.length <= 253
  checks.push({
    id: 'domain-length',
    label: 'Độ dài domain',
    status: domainLengthOk ? 'pass' : 'fail',
    message: domainLengthOk ? 'Domain hợp lệ.' : 'Domain phải từ 1 đến 253 ký tự.',
    technical: 'Giới hạn domain tổng tối đa 253 ký tự.',
  })

  const dotRulesOk =
    localPart.length > 0 &&
    domainPart.length > 0 &&
    !localPart.startsWith('.') &&
    !localPart.endsWith('.') &&
    !localPart.includes('..') &&
    !domainPart.startsWith('.') &&
    !domainPart.endsWith('.') &&
    !domainPart.includes('..')

  checks.push({
    id: 'dot-rules',
    label: 'Quy tắc dấu chấm',
    status: dotRulesOk ? 'pass' : 'fail',
    message: dotRulesOk
      ? 'Không có dấu chấm ở vị trí cấm.'
      : 'Dấu chấm đầu/cuối hoặc liên tiếp chưa hợp lệ.',
    technical: 'Không bắt đầu/kết thúc bằng dấu chấm, không có 2 dấu chấm liền nhau.',
  })

  const labelsOk =
    domainLabels.length >= 2 &&
    domainLabels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        !label.startsWith('-') &&
        !label.endsWith('-'),
    )

  checks.push({
    id: 'domain-labels',
    label: 'Domain labels',
    status: labelsOk ? 'pass' : 'fail',
    message: labelsOk
      ? 'Các nhãn domain hợp lệ.'
      : 'Mỗi nhãn domain phải 1-63 ký tự, không bắt đầu/kết thúc bằng dấu gạch ngang.',
    technical: 'Kiểm tra từng nhãn trong domain (ngăn cách bởi dấu chấm).',
  })

  const tld = domainLabels[domainLabels.length - 1] ?? ''
  const tldOk = /^[a-z]{2,24}$/.test(tld)
  checks.push({
    id: 'tld',
    label: 'Top-level domain',
    status: tldOk ? 'pass' : 'fail',
    message: tldOk ? 'TLD có vẻ hợp lệ.' : 'TLD nên là chữ cái, độ dài 2-24 ký tự.',
    technical: 'Heuristic TLD: chỉ gồm chữ và có độ dài phổ biến.',
  })

  return checks
}

function runRiskChecks(parsed: ParsedEmail, checks: ValidationCheck[]): ValidationSuggestion[] {
  const suggestions: ValidationSuggestion[] = []
  const { localPart, domainPart } = parsed

  const roleBased = ROLE_BASED_LOCALS.has(localPart)
  checks.push({
    id: 'role-based',
    label: 'Role-based email',
    status: roleBased ? 'warning' : 'pass',
    message: roleBased
      ? 'Email dạng role-based (ví dụ info@, support@).'
      : 'Không phải email role-based phổ biến.',
    technical: 'Role-based thường dùng chung cho team, giảm tính định danh cá nhân.',
  })

  const disposable = DISPOSABLE_DOMAINS.has(domainPart)
  checks.push({
    id: 'disposable',
    label: 'Disposable domain',
    status: disposable ? 'warning' : 'pass',
    message: disposable
      ? 'Domain nằm trong danh sách email tạm thời phổ biến.'
      : 'Không trùng domain disposable phổ biến.',
    technical: 'Danh sách heuristic domain tạm thời để đánh dấu rủi ro.',
  })

  const freeProvider = COMMON_EMAIL_DOMAINS.includes(domainPart)
  checks.push({
    id: 'provider',
    label: 'Nhóm nhà cung cấp',
    status: freeProvider ? 'warning' : 'pass',
    message: freeProvider
      ? 'Email thuộc nhà cung cấp miễn phí phổ biến.'
      : 'Domain không thuộc nhóm miễn phí phổ biến.',
    technical: 'Chỉ là phân loại ngữ cảnh, không phải lỗi.',
  })

  if (domainPart.length > 0 && !COMMON_EMAIL_DOMAINS.includes(domainPart)) {
    const candidates = COMMON_EMAIL_DOMAINS
      .map((knownDomain) => ({
        knownDomain,
        distance: levenshteinDistance(domainPart, knownDomain),
      }))
      .sort((a, b) => a.distance - b.distance)

    const nearest = candidates[0]

    if (nearest && nearest.distance <= 2) {
      suggestions.push({
        value: `${localPart}@${nearest.knownDomain}`,
        reason: `Domain "${domainPart}" khá giống "${nearest.knownDomain}".`,
      })

      checks.push({
        id: 'typo',
        label: 'Gợi ý sửa typo domain',
        status: 'warning',
        message: `Có thể bạn muốn dùng "${nearest.knownDomain}".`,
        technical: `Levenshtein distance = ${nearest.distance}.`,
      })
    } else {
      checks.push({
        id: 'typo',
        label: 'Gợi ý sửa typo domain',
        status: 'pass',
        message: 'Không phát hiện typo domain phổ biến.',
        technical: 'So khớp với danh sách domain phổ biến bằng khoảng cách ký tự.',
      })
    }
  } else {
    checks.push({
      id: 'typo',
      label: 'Gợi ý sửa typo domain',
      status: 'pass',
      message: 'Không phát hiện typo domain phổ biến.',
      technical: 'So khớp với danh sách domain phổ biến bằng khoảng cách ký tự.',
    })
  }

  return suggestions
}

function computeScore(checks: ValidationCheck[]): number {
  let score = 100

  for (const check of checks) {
    if (check.status === 'fail') {
      score -= 15
      continue
    }

    if (check.status === 'warning') {
      score -= 6
    }
  }

  return Math.max(0, score)
}

function computeStatus(checks: ValidationCheck[]): CheckStatus {
  if (checks.some((check) => check.status === 'fail')) {
    return 'fail'
  }

  if (checks.some((check) => check.status === 'warning')) {
    return 'warning'
  }

  return 'pass'
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) {
    return 0
  }

  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (let row = 0; row < rows; row += 1) {
    matrix[row]![0] = row
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0]![col] = col
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const replaceCost = a[row - 1] === b[col - 1] ? 0 : 1
      const currentRow = matrix[row]!
      const previousRow = matrix[row - 1]!
      const deletion = (previousRow[col] ?? 0) + 1
      const insertion = (currentRow[col - 1] ?? 0) + 1
      const substitution = (previousRow[col - 1] ?? 0) + replaceCost
      currentRow[col] = Math.min(deletion, insertion, substitution)
    }
  }

  return matrix[rows - 1]![cols - 1] ?? 0
}
