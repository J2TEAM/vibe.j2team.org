// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  caesar,
  decryptMessage,
  deriveSessionKey,
  encryptMessage,
  exportExchangePublicKey,
  generateExchangeKey,
  tamperEnvelope,
  type CryptoContext,
} from '../utils/crypto'

const context: CryptoContext = {
  roomId: 'test-room',
  round: 1,
  senderId: 'sender-A',
  recipientId: 'recipient-B',
}

async function exchangeKeys() {
  const [alice, bob] = await Promise.all([generateExchangeKey(), generateExchangeKey()])
  const [alicePublic, bobPublic] = await Promise.all([
    exportExchangePublicKey(alice.publicKey),
    exportExchangePublicKey(bob.publicKey),
  ])
  const [aliceKey, bobKey] = await Promise.all([
    deriveSessionKey(alice.privateKey, bobPublic, context),
    deriveSessionKey(bob.privateKey, alicePublic, context),
  ])
  return { alice, bob, alicePublic, bobPublic, aliceKey, bobKey }
}

describe('Caesar với Unicode', () => {
  it('dịch và quay vòng đúng chữ ASCII hoa/thường', () => {
    expect(caesar('ARENA xyz XYZ', 3)).toBe('DUHQD abc ABC')
    expect(caesar('DUHQD abc ABC', -3)).toBe('ARENA xyz XYZ')
    expect(caesar('ARENA xyz XYZ', 26)).toBe('ARENA xyz XYZ')
    expect(caesar('Zz', 53)).toBe('Aa')
  })

  it('giữ chữ có dấu, số và emoji, khôi phục chính xác tin gốc', () => {
    const message = 'Hãy chọn cửa số 3 — Đừng mở cửa 1! 🔒'
    const encrypted = caesar(message, 7)
    expect(encrypted).toContain('ã')
    expect(encrypted).toContain('ọ')
    expect(encrypted).toContain('3')
    expect(encrypted).toContain('🔒')
    expect(caesar(encrypted, -7)).toBe(message)
  })

  it('giữ nguyên cả chữ có dấu tổ hợp mà không normalize đầu vào', () => {
    const decomposed = 'a\u0302 e\u0301 ĐƯỜNG'
    expect(caesar(decomposed, 5)).toBe('a\u0302 e\u0301 ĐƯỜSL')
    expect(caesar(caesar(decomposed, 5), -5)).toBe(decomposed)
  })

  it('từ chối khóa không nguyên', () => {
    expect(() => caesar('ARENA', 2.5)).toThrow(RangeError)
    expect(() => caesar('ARENA', Number.NaN)).toThrow(RangeError)
  })
})

describe('ECDH / HKDF / AES-GCM thật', () => {
  it('A/B trao đổi khóa công khai và giải mã đúng Unicode, khóa bí mật không extract được', async () => {
    const { alice, aliceKey, bobKey } = await exchangeKeys()
    const message = 'Hãy chọn cửa số 3. 🔐'
    const envelope = await encryptMessage(aliceKey, message, context)
    expect(await decryptMessage(bobKey, envelope, context)).toBe(message)
    expect(alice.privateKey.extractable).toBe(false)
    expect(aliceKey.extractable).toBe(false)
    expect(bobKey.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', aliceKey)).rejects.toThrow(/not extractable/)
  })

  it('sinh IV 96 bit mới cho mỗi bản tin, kể cả cùng nội dung', async () => {
    const { aliceKey, bobKey } = await exchangeKeys()
    const first = await encryptMessage(aliceKey, 'Cửa 3', context)
    const second = await encryptMessage(aliceKey, 'Cửa 3', context)
    expect(atob(first.iv)).toHaveLength(12)
    expect(first.iv).not.toBe(second.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
    expect(await decryptMessage(bobKey, second, context)).toBe('Cửa 3')
  })

  it('từ chối bản mã bị C lật một bit và vẫn nhận được bản gốc', async () => {
    const { aliceKey, bobKey } = await exchangeKeys()
    const original = await encryptMessage(aliceKey, 'Cửa 3', context)
    const tampered = tamperEnvelope(original)
    expect(tampered.ciphertext).not.toBe(original.ciphertext)
    await expect(decryptMessage(bobKey, tampered, context)).rejects.toMatchObject({
      name: 'OperationError',
    })
    expect(await decryptMessage(bobKey, original, context)).toBe('Cửa 3')
  })

  it('từ chối IV bị sửa', async () => {
    const { aliceKey, bobKey } = await exchangeKeys()
    const original = await encryptMessage(aliceKey, 'Cửa 3', context)
    const changedIv = btoa(
      String.fromCharCode(atob(original.iv).charCodeAt(0) ^ 1) + atob(original.iv).slice(1),
    )
    await expect(
      decryptMessage(bobKey, { ...original, iv: changedIv }, context),
    ).rejects.toMatchObject({ name: 'OperationError' })
  })

  it.each([
    { roomId: 'other-room' },
    { round: 2 },
    { senderId: 'other-sender' },
    { recipientId: 'other-recipient' },
  ])('ràng buộc metadata công khai vào xác thực: %o', async (change) => {
    const { aliceKey, bobKey } = await exchangeKeys()
    const envelope = await encryptMessage(aliceKey, 'Cửa 3', context)
    await expect(decryptMessage(bobKey, envelope, { ...context, ...change })).rejects.toMatchObject(
      { name: 'OperationError' },
    )
  })

  it('người C chỉ có khóa công khai không thể tạo cùng khóa AES', async () => {
    const { alicePublic, aliceKey } = await exchangeKeys()
    const charlie = await generateExchangeKey()
    const charlieKey = await deriveSessionKey(charlie.privateKey, alicePublic, context)
    const envelope = await encryptMessage(aliceKey, 'Cửa 3', context)
    await expect(decryptMessage(charlieKey, envelope, context)).rejects.toMatchObject({
      name: 'OperationError',
    })
  })

  it('khóa của vòng cũ không đọc được vòng mới sau khi đổi vai', async () => {
    const { alice, bobPublic, aliceKey } = await exchangeKeys()
    const nextRound = { ...context, round: 2 }
    const nextKey = await deriveSessionKey(alice.privateKey, bobPublic, nextRound)
    const envelope = await encryptMessage(nextKey, 'Cửa 2', nextRound)
    await expect(decryptMessage(aliceKey, envelope, nextRound)).rejects.toMatchObject({
      name: 'OperationError',
    })
  })

  it('từ chối bản mã sai định dạng hoặc thiếu authentication tag', async () => {
    const { bobKey } = await exchangeKeys()
    await expect(decryptMessage(bobKey, { iv: '!', ciphertext: '!' }, context)).rejects.toThrow(
      'Bản mã không đúng định dạng Base64.',
    )
    await expect(
      decryptMessage(bobKey, { iv: btoa('123456789012'), ciphertext: btoa('short') }, context),
    ).rejects.toThrow('Bản mã hoặc IV không hợp lệ.')
  })
})
