import { describe, expect, it } from 'vitest'
import { readNumber } from './read-number'

describe('readNumber', () => {
  it('reads small numbers with mốt, tư and lăm', () => {
    expect(readNumber('0')).toBe('Không')
    expect(readNumber('5')).toBe('Năm')
    expect(readNumber('10')).toBe('Mười')
    expect(readNumber('11')).toBe('Mười một')
    expect(readNumber('14')).toBe('Mười bốn')
    expect(readNumber('15')).toBe('Mười lăm')
    expect(readNumber('21')).toBe('Hai mươi mốt')
    expect(readNumber('24')).toBe('Hai mươi tư')
    expect(readNumber('25')).toBe('Hai mươi lăm')
  })

  it('keeps trăm and linh inside a group', () => {
    expect(readNumber('100')).toBe('Một trăm')
    expect(readNumber('101')).toBe('Một trăm linh một')
    expect(readNumber('110')).toBe('Một trăm mười')
    expect(readNumber('115')).toBe('Một trăm mười lăm')
    expect(readNumber('1001')).toBe('Một nghìn không trăm linh một')
    expect(readNumber('1015')).toBe('Một nghìn không trăm mười lăm')
    expect(readNumber('1100')).toBe('Một nghìn một trăm')
  })

  it('skips a scale that is entirely zero', () => {
    expect(readNumber('1000000')).toBe('Một triệu')
    expect(readNumber('1000001')).toBe('Một triệu không trăm linh một')
    expect(readNumber('1001000')).toBe('Một triệu không trăm linh một nghìn')
    expect(readNumber('1000000000')).toBe('Một tỷ')
  })

  it('accepts grouped digits, a minus sign, and the currency suffix', () => {
    expect(readNumber('1.001.000')).toBe('Một triệu không trăm linh một nghìn')
    expect(readNumber('1,001,000')).toBe('Một triệu không trăm linh một nghìn')
    expect(readNumber('-15')).toBe('Âm mười lăm')
    expect(readNumber('-0')).toBe('Không')
    expect(readNumber('21', true)).toBe('Hai mươi mốt đồng')
  })

  it('rejects decimals and numbers that are too long', () => {
    expect(() => readNumber('10.5')).toThrow(/số nguyên/)
    expect(() => readNumber('1'.repeat(22))).toThrow(/21 chữ số/)
  })
})
