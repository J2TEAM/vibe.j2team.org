import { effectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { decodeSignal, encodeSignal, useTransport } from '../composables/use-transport'

type Signal = Parameters<typeof encodeSignal>[0]

const offer: Signal = {
  v: 1,
  kind: 'offer',
  roomId: 'room-123',
  slot: 'p1',
  offerId: 'offer-123',
  description: { type: 'offer', sdp: 'v=0\r\ns=Kết nối giáo dục\r\n' },
}

afterEach(() => vi.unstubAllGlobals())

describe('Mã kết nối WebRTC', () => {
  it('giữ nguyên Unicode và cho phép xuống dòng khi sao chép mã', () => {
    const encoded = encodeSignal(offer)
    expect(decodeSignal(`  ${encoded.slice(0, 20)}\n${encoded.slice(20)}  `, 'offer')).toEqual(
      offer,
    )
  })

  it('từ chối mã thiếu trường, sai ghế, sai loại hoặc quá lớn', () => {
    for (const input of [
      'không-phải-base64',
      btoa('null'),
      btoa('{"v":1}'),
      btoa(JSON.stringify({ ...offer, slot: 'p3', description: { type: 'offer', sdp: 'v=0' } })),
      btoa(JSON.stringify({ ...offer, description: { type: 'answer', sdp: 'v=0' } })),
      'a'.repeat(100_001),
    ]) {
      expect(() => decodeSignal(input, 'offer')).toThrow('Mã mời không hợp lệ')
    }
    expect(() => decodeSignal(encodeSignal(offer), 'answer')).toThrow('Mã trả lời không hợp lệ')
  })

  it('báo rõ thiếu ICE candidate và dọn kết nối thay vì phát mã mời không dùng được', async () => {
    const channel = { label: 'mitm-arena-v1', close: vi.fn() }
    const peer = {
      localDescription: { type: 'offer', sdp: 'v=0\r\ns=no-candidates\r\n' },
      iceGatheringState: 'complete',
      createDataChannel: () => channel,
      createOffer: async () => ({ type: 'offer', sdp: 'v=0\r\ns=no-candidates\r\n' }),
      setLocalDescription: vi.fn(),
      close: vi.fn(),
    }
    vi.stubGlobal(
      'RTCPeerConnection',
      vi.fn(function () {
        return peer
      }),
    )
    const scope = effectScope()
    const transport = scope.run(() =>
      useTransport({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn() }),
    )!
    try {
      transport.createHost('room-123')
      await expect(transport.createOffer('p1', '')).rejects.toThrow('không cung cấp địa chỉ ICE')
      expect(channel.close).toHaveBeenCalledOnce()
      expect(peer.close).toHaveBeenCalledOnce()
      expect(transport.status.value.p1).toBeUndefined()
    } finally {
      scope.stop()
    }
  })

  it('gắn mã trả lời với đúng phòng, ghế và lần mời; không nhận lại một mã', async () => {
    const channel = { label: 'mitm-arena-v1', close: vi.fn() }
    const peer = {
      localDescription: null as RTCSessionDescriptionInit | null,
      signalingState: 'stable' as RTCSignalingState,
      iceGatheringState: 'complete',
      createDataChannel: vi.fn(() => channel),
      createOffer: vi.fn(async () => ({
        type: 'offer' as const,
        sdp: 'v=0\r\ns=test\r\na=candidate:1 1 UDP 2122260223 127.0.0.1 12345 typ host\r\n',
      })),
      setLocalDescription: vi.fn(async (description: RTCSessionDescriptionInit): Promise<void> => {
        peer.localDescription = description
        peer.signalingState = 'have-local-offer'
      }),
      setRemoteDescription: vi.fn(async (): Promise<void> => {
        peer.signalingState = 'stable'
      }),
      close: vi.fn(),
    }
    vi.stubGlobal(
      'RTCPeerConnection',
      vi.fn(function () {
        return peer
      }),
    )
    const scope = effectScope()
    const transport = scope.run(() =>
      useTransport({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn() }),
    )!
    try {
      transport.createHost('room-123')
      const invitation = decodeSignal(await transport.createOffer('p1', ''), 'offer')
      const answer: Signal = {
        ...invitation,
        kind: 'answer',
        description: { type: 'answer', sdp: 'v=0\r\ns=test\r\n' },
      }
      for (const invalid of [
        { ...answer, roomId: 'other-room' },
        { ...answer, slot: 'p2' as const },
        { ...answer, offerId: 'old-offer' },
      ]) {
        await expect(transport.acceptAnswer(encodeSignal(invalid))).rejects.toThrow('không thuộc')
      }
      expect(peer.setRemoteDescription).not.toHaveBeenCalled()
      await transport.acceptAnswer(encodeSignal(answer))
      expect(peer.setRemoteDescription).toHaveBeenCalledOnce()
      await expect(transport.acceptAnswer(encodeSignal(answer))).rejects.toThrow('đã nhận')
      await expect(transport.createOffer('p1', '')).rejects.toThrow('đã có kết nối')
      transport.cancel('p1')
      await expect(transport.acceptAnswer(encodeSignal(answer))).rejects.toThrow('không thuộc')
    } finally {
      scope.stop()
    }
    expect(channel.close).toHaveBeenCalledOnce()
    expect(peer.close).toHaveBeenCalledOnce()
  })
})
