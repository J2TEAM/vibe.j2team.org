/**
 * Run-Length Encoding for compression (supports 32-bit indices)
 * Converts a Set or array of indices into a compressed base64 string
 */
export function encodeRLE(indices: Set<number> | number[], limit?: number): string {
  if (indices instanceof Set) {
    if (indices.size === 0) return ''
  } else if (indices.length === 0) return ''

  const sorted = Array.from(indices).sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  const encoded: number[] = []

  let start = sorted[0]!
  let end = sorted[0]!

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]!
    } else {
      encoded.push(start, end - start + 1)
      start = sorted[i]!
      end = sorted[i]!
    }
  }
  encoded.push(start, end - start + 1)

  // Encode as base64 string of 32-bit integers
  const activeLimit = limit ? Math.min(encoded.length, limit) : encoded.length

  // To avoid huge allocations on sync
  const bytes = new Uint8Array(activeLimit * 4)
  for (let i = 0; i < activeLimit; i++) {
    const val = encoded[i]!
    bytes[i * 4] = val & 0xff
    bytes[i * 4 + 1] = (val >> 8) & 0xff
    bytes[i * 4 + 2] = (val >> 16) & 0xff
    bytes[i * 4 + 3] = (val >> 24) & 0xff
  }

  // Convert Uint8Array to base64
  // Chunking to avoid stack overflow or memory issues on huge arrays
  let binary = ''
  const chunkSize = 10000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  return btoa(binary)
}

/**
 * Decodes an RLE-compressed base64 string back into an array of indices
 */
export function decodeRLE(encoded: string): number[] {
  if (!encoded) return []

  // Cap the encoded string length (e.g. 5MB of base64 ~ 3.75MB bytes) to prevent memory attacks
  if (encoded.length > 5 * 1024 * 1024) {
    console.error('RLE decode failed: payload too large')
    return []
  }

  try {
    const binary = atob(encoded)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    let totalLength = 0
    for (let i = 0; i < len; i += 8) {
      if (i + 7 >= len) break
      totalLength +=
        bytes[i + 4]! | (bytes[i + 5]! << 8) | (bytes[i + 6]! << 16) | (bytes[i + 7]! << 24)
    }

    // Cap total decoded indices to e.g. 10 million to avoid massive arrays crashing the tab
    if (totalLength > 10_000_000) {
      console.error('RLE decode failed: too many indices')
      return []
    }

    const indices: number[] = []
    indices.length = totalLength
    let idx = 0
    for (let i = 0; i < len; i += 8) {
      if (i + 7 >= len) break
      const start = bytes[i]! | (bytes[i + 1]! << 8) | (bytes[i + 2]! << 16) | (bytes[i + 3]! << 24)
      const count =
        bytes[i + 4]! | (bytes[i + 5]! << 8) | (bytes[i + 6]! << 16) | (bytes[i + 7]! << 24)
      for (let j = 0; j < count; j++) {
        indices[idx++] = start + j
      }
    }
    return indices
  } catch {
    return []
  }
}
