import { describe, expect, it } from 'vitest'
import { toSlug } from './slug'

describe('toSlug', () => {
  it('strips Vietnamese marks and joins words', () => {
    expect(toSlug('Xin chào Việt Nam')).toBe('xin-chao-viet-nam')
    expect(toSlug('Đường Đỗ')).toBe('duong-do')
    expect(toSlug('  Hello, World! ')).toBe('hello-world')
    expect(toSlug('Số 01 — năm 2026')).toBe('so-01-nam-2026')
    expect(toSlug('bánh & trà')).toBe('banh-va-tra')
    expect(toSlug('---')).toBe('')
  })
})
