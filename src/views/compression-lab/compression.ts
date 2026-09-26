export interface CompressionStep {
  title: string
  description: string
  processedCount: number
  outputBytes: number
  activeStart?: number
  activeEnd?: number
  pool?: PoolItem[]
}

export interface PoolItem {
  label: string
  frequency: number
}

export interface RleRun {
  byte: number
  count: number
}

export interface HuffmanCode {
  byte: number
  frequency: number
  length: number
  bits: string
}

export interface CompressionResult {
  encoded: Uint8Array
  payloadBytes: number
  headerBytes: number
  steps: CompressionStep[]
  runs: RleRun[]
  codes: HuffmanCode[]
  bitPreview: string
  bitCount: number
  roundTripOk: boolean
}

interface TreeNode {
  frequency: number
  minByte: number
  symbolCount: number
  byte?: number
  left?: TreeNode
  right?: TreeNode
}

export function byteLabel(byte: number): string {
  if (byte === 32) return 'SPACE'
  if (byte === 10) return 'LF'
  if (byte === 9) return 'TAB'
  if (byte >= 33 && byte <= 126) return String.fromCharCode(byte)
  return byte.toString(16).toUpperCase().padStart(2, '0')
}

export function hexByte(byte: number): string {
  return byte.toString(16).toUpperCase().padStart(2, '0')
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index])
}

export function decodeRle(encoded: Uint8Array): Uint8Array {
  const decoded: number[] = []
  for (let index = 0; index + 1 < encoded.length; index += 2) {
    const count = encoded[index] ?? 0
    const byte = encoded[index + 1] ?? 0
    for (let repeat = 0; repeat < count; repeat++) decoded.push(byte)
  }
  return Uint8Array.from(decoded)
}

export function analyzeRle(input: Uint8Array): CompressionResult {
  const runs: RleRun[] = []
  const output: number[] = []
  const steps: CompressionStep[] = [
    {
      title: 'Dữ liệu gốc',
      description: 'RLE đọc các byte từ trái sang phải và tìm những byte liên tiếp giống nhau.',
      processedCount: 0,
      outputBytes: 0,
    },
  ]

  for (let start = 0; start < input.length; ) {
    const byte = input[start] ?? 0
    let count = 1
    while (start + count < input.length && input[start + count] === byte && count < 255) {
      count++
    }

    runs.push({ byte, count })
    output.push(count, byte)
    steps.push({
      title: `Ghi chuỗi ${runs.length}`,
      description: `${count} byte ${byteLabel(byte)} liên tiếp → cặp [${count}, ${hexByte(byte)}].`,
      processedCount: start + count,
      outputBytes: output.length,
      activeStart: start,
      activeEnd: start + count,
    })
    start += count
  }

  const encoded = Uint8Array.from(output)
  return {
    encoded,
    payloadBytes: encoded.length,
    headerBytes: 0,
    steps,
    runs,
    codes: [],
    bitPreview: '',
    bitCount: 0,
    roundTripOk: sameBytes(input, decodeRle(encoded)),
  }
}

function nodeLabel(node: TreeNode): string {
  return node.byte === undefined ? `Nhóm ${node.symbolCount} byte` : byteLabel(node.byte)
}

function poolSnapshot(pool: TreeNode[]): PoolItem[] {
  return pool.map((node) => ({ label: nodeLabel(node), frequency: node.frequency }))
}

function sortPool(pool: TreeNode[]): void {
  pool.sort((left, right) => left.frequency - right.frequency || left.minByte - right.minByte)
}

function canonicalCodes(lengths: Map<number, number>, frequencies: Uint32Array): HuffmanCode[] {
  const codes = [...lengths.entries()]
    .map(([byte, length]) => ({ byte, length, frequency: frequencies[byte] ?? 0, bits: '' }))
    .sort((left, right) => left.length - right.length || left.byte - right.byte)

  let code = 0n
  let previousLength = 0
  for (let index = 0; index < codes.length; index++) {
    const row = codes[index]
    if (!row) continue
    if (index > 0) code = (code + 1n) << BigInt(row.length - previousLength)
    row.bits = code.toString(2).padStart(row.length, '0')
    previousLength = row.length
  }
  return codes
}

export function decodeHuffman(encoded: Uint8Array): Uint8Array {
  if (encoded.length === 0) return new Uint8Array()
  const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength)
  const originalLength = view.getUint32(0)
  const symbolCount = view.getUint16(4)
  const lengths = new Map<number, number>()
  for (let index = 0; index < symbolCount; index++) {
    lengths.set(encoded[6 + index * 2] ?? 0, encoded[7 + index * 2] ?? 0)
  }
  const codes = canonicalCodes(lengths, new Uint32Array(256))
  const lookup = new Map(codes.map((row) => [row.bits, row.byte]))
  const decoded = new Uint8Array(originalLength)
  let outputIndex = 0
  let pending = ''

  for (
    let index = 6 + symbolCount * 2;
    index < encoded.length && outputIndex < originalLength;
    index++
  ) {
    const byte = encoded[index] ?? 0
    for (let bit = 7; bit >= 0 && outputIndex < originalLength; bit--) {
      pending += (byte >> bit) & 1 ? '1' : '0'
      const symbol = lookup.get(pending)
      if (symbol !== undefined) {
        decoded[outputIndex++] = symbol
        pending = ''
      }
    }
  }
  return decoded
}

export function analyzeHuffman(input: Uint8Array): CompressionResult {
  const steps: CompressionStep[] = [
    {
      title: 'Dữ liệu gốc',
      description: 'Huffman đếm tần suất từng byte, rồi ghép hai nút ít gặp nhất.',
      processedCount: 0,
      outputBytes: 0,
    },
  ]
  if (input.length === 0) {
    return {
      encoded: new Uint8Array(),
      payloadBytes: 0,
      headerBytes: 0,
      steps,
      runs: [],
      codes: [],
      bitPreview: '',
      bitCount: 0,
      roundTripOk: true,
    }
  }

  const frequencies = new Uint32Array(256)
  for (const byte of input) frequencies[byte] = (frequencies[byte] ?? 0) + 1
  const pool: TreeNode[] = []
  frequencies.forEach((frequency, byte) => {
    if (frequency > 0) pool.push({ frequency, minByte: byte, symbolCount: 1, byte })
  })
  sortPool(pool)
  steps.push({
    title: 'Đếm tần suất',
    description: `Có ${pool.length} byte khác nhau. Byte xuất hiện nhiều hơn sẽ có mã ngắn hơn hoặc bằng.`,
    processedCount: input.length,
    outputBytes: 0,
    pool: poolSnapshot(pool),
  })

  while (pool.length > 1) {
    const left = pool.shift()
    const right = pool.shift()
    if (!left || !right) break
    const merged: TreeNode = {
      frequency: left.frequency + right.frequency,
      minByte: Math.min(left.minByte, right.minByte),
      symbolCount: left.symbolCount + right.symbolCount,
      left,
      right,
    }
    pool.push(merged)
    sortPool(pool)
    steps.push({
      title: `Ghép nút ${steps.length - 1}`,
      description: `${nodeLabel(left)} (${left.frequency}) + ${nodeLabel(right)} (${right.frequency}) → nút ${merged.frequency}.`,
      processedCount: input.length,
      outputBytes: 0,
      pool: poolSnapshot(pool),
    })
  }

  const lengths = new Map<number, number>()
  function visit(node: TreeNode, depth: number): void {
    if (node.byte !== undefined) {
      lengths.set(node.byte, Math.max(1, depth))
      return
    }
    if (node.left) visit(node.left, depth + 1)
    if (node.right) visit(node.right, depth + 1)
  }
  const root = pool[0]
  if (root) visit(root, 0)
  const codes = canonicalCodes(lengths, frequencies)
  const byByte = new Map(codes.map((row) => [row.byte, row.bits]))
  const bitStream = Array.from(input, (byte) => byByte.get(byte) ?? '').join('')
  const payloadBytes = Math.ceil(bitStream.length / 8)
  const headerBytes = 6 + codes.length * 2
  const encoded = new Uint8Array(headerBytes + payloadBytes)
  const view = new DataView(encoded.buffer)
  view.setUint32(0, input.length)
  view.setUint16(4, codes.length)
  codes.forEach((row, index) => {
    encoded[6 + index * 2] = row.byte
    encoded[7 + index * 2] = row.length
  })
  for (let index = 0; index < bitStream.length; index++) {
    if (bitStream[index] === '1') {
      encoded[headerBytes + Math.floor(index / 8)] =
        (encoded[headerBytes + Math.floor(index / 8)] ?? 0) | (1 << (7 - (index % 8)))
    }
  }
  steps.push({
    title: 'Tạo mã và đóng gói',
    description: `${bitStream.length} bit dữ liệu được đóng vào ${payloadBytes} byte; bảng mã cần ${headerBytes} byte.`,
    processedCount: input.length,
    outputBytes: encoded.length,
    pool: poolSnapshot(pool),
  })

  return {
    encoded,
    payloadBytes,
    headerBytes,
    steps,
    runs: [],
    codes,
    bitPreview: bitStream.slice(0, 144),
    bitCount: bitStream.length,
    roundTripOk: sameBytes(input, decodeHuffman(encoded)),
  }
}
