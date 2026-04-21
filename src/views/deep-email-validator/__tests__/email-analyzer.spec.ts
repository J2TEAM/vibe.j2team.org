import { describe, expect, it } from 'vitest'
import { analyzeEmail } from '../utils/email-analyzer'

describe('analyzeEmail', () => {
  it('returns fail for empty input', () => {
    const result = analyzeEmail('')

    expect(result.status).toBe('fail')
    expect(result.checks.find((check) => check.id === 'required')?.status).toBe('fail')
  })

  it('returns pass for a common valid email', () => {
    const result = analyzeEmail('first.last@company.vn')

    expect(result.status).toBe('pass')
    expect(result.suggestions).toHaveLength(0)
    expect(result.score).toBe(100)
  })

  it('returns warning for disposable domain', () => {
    const result = analyzeEmail('hello@tempmail.com')

    expect(result.status).toBe('warning')
    expect(result.warnings.some((check) => check.id === 'disposable')).toBe(true)
  })

  it('suggests domain correction for typo-like domain', () => {
    const result = analyzeEmail('hello@gmial.com')

    expect(result.status).toBe('warning')
    expect(result.suggestions[0]?.value).toBe('hello@gmail.com')
    expect(result.warnings.some((check) => check.id === 'typo')).toBe(true)
  })

  it('keeps score between 0 and 100 for malformed email', () => {
    const result = analyzeEmail('@@@')

    expect(result.status).toBe('fail')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
