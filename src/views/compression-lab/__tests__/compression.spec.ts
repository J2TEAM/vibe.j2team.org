import { describe, expect, it } from 'vitest'
import { analyzeHuffman, analyzeRle, decodeHuffman, decodeRle } from '../compression'

const encoder = new TextEncoder()

describe('RLE theo byte UTF-8', () => {
  it('nén và giải nén chuỗi lặp, gồm cả chuỗi dài hơn 255 byte', () => {
    const input = encoder.encode(`${'A'.repeat(300)}BBBB`)
    const result = analyzeRle(input)

    expect(result.runs.map((run) => run.count)).toEqual([255, 45, 4])
    expect(result.encoded.length).toBe(6)
    expect(Array.from(decodeRle(result.encoded))).toEqual(Array.from(input))
    expect(result.roundTripOk).toBe(true)
  })

  it('hiển thị sự tăng kích thước khi không có byte lặp', () => {
    const input = encoder.encode('ABC')
    const result = analyzeRle(input)

    expect(result.encoded.length).toBe(6)
    expect(result.steps[result.steps.length - 1]?.processedCount).toBe(input.length)
  })
})

describe('Huffman theo byte UTF-8', () => {
  it.each(['AAAAAA', 'BANANA BANDANA', 'Xin chào Việt Nam!', '😀😀😀'])(
    'giải nén khớp dữ liệu gốc: %s',
    (text) => {
      const input = encoder.encode(text)
      const result = analyzeHuffman(input)

      expect(Array.from(decodeHuffman(result.encoded))).toEqual(Array.from(input))
      expect(result.roundTripOk).toBe(true)
      expect(result.encoded.length).toBe(result.headerBytes + result.payloadBytes)
    },
  )

  it('gán mã không chồng tiền tố và tính cả bảng mã', () => {
    const result = analyzeHuffman(encoder.encode('AAAAABBC'))
    const codes = result.codes.map((row) => row.bits)

    const hasOverlappingPrefix = codes.some((left, leftIndex) =>
      codes.some((right, rightIndex) => leftIndex !== rightIndex && right.startsWith(left)),
    )
    expect(hasOverlappingPrefix).toBe(false)
    expect(result.headerBytes).toBe(12)
  })

  it('giải nén được đủ 256 giá trị byte', () => {
    const input = Uint8Array.from({ length: 256 }, (_, byte) => byte)
    const result = analyzeHuffman(input)

    expect(result.codes).toHaveLength(256)
    expect(Array.from(decodeHuffman(result.encoded))).toEqual(Array.from(input))
  })
})
