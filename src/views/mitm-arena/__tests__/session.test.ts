import { webcrypto } from 'node:crypto'
import { effectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useArena } from '../composables/use-arena'

// This is an integration test of three real sessions and Web Crypto. Only the
// transport is in memory: it is explicitly not evidence of working WebRTC/NAT.
const network = vi.hoisted(() => {
  type Callbacks = {
    onOpen: (peerId: string) => void
    onMessage: (peerId: string, text: string) => void
    onClose: (peerId: string, reason: string) => void
  }
  type Endpoint = { callbacks: Callbacks; id: string; links: Map<string, Endpoint> }
  const hosts = new Map<string, Endpoint>()
  const pending = new Map<string, Endpoint>()
  const packets: Array<{ from: string; to: string; text: string }> = []
  return { hosts, pending, packets }
})

vi.mock('../composables/use-transport', async () => {
  const { ref } = await import('vue')
  return {
    useTransport(callbacks: {
      onOpen: (peerId: string) => void
      onMessage: (peerId: string, text: string) => void
      onClose: (peerId: string, reason: string) => void
    }) {
      type Endpoint = Parameters<typeof network.hosts.set>[1]
      const endpoint: Endpoint = { callbacks, id: '', links: new Map() }
      let activeRoom = ''
      return {
        status: ref<Record<string, string>>({}),
        createHost(roomId: string) {
          endpoint.id = 'p0'
          activeRoom = roomId
          network.hosts.set(roomId, endpoint)
        },
        async createOffer(slot: string) {
          return JSON.stringify({ roomId: activeRoom, slot })
        },
        async join(offer: string) {
          const invitation = JSON.parse(offer) as { roomId: string; slot: string }
          endpoint.id = invitation.slot
          activeRoom = invitation.roomId
          network.pending.set(`${activeRoom}:${endpoint.id}`, endpoint)
          return { roomId: activeRoom, peerId: endpoint.id, answer: offer }
        },
        async acceptAnswer(answer: string) {
          const invitation = JSON.parse(answer) as { roomId: string; slot: string }
          const guest = network.pending.get(`${invitation.roomId}:${invitation.slot}`)!
          endpoint.links.set(invitation.slot, guest)
          guest.links.set('host', endpoint)
          endpoint.callbacks.onOpen(invitation.slot)
          guest.callbacks.onOpen('host')
        },
        send(peerId: string, text: string) {
          const remote = endpoint.links.get(peerId)
          if (!remote) return false
          network.packets.push({ from: endpoint.id, to: remote.id, text })
          queueMicrotask(() =>
            remote.callbacks.onMessage(endpoint.id === 'p0' ? 'host' : endpoint.id, text),
          )
          return true
        },
        cancel(peerId: string) {
          endpoint.links.delete(peerId)
        },
        close() {
          endpoint.links.clear()
        },
      }
    },
  }
})

const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => {
  for (const scope of scopes) scope.stop()
  scopes.length = 0
  network.hosts.clear()
  network.pending.clear()
  network.packets.length = 0
  vi.unstubAllGlobals()
})

describe('Ba phiên chơi và Web Crypto thật qua transport kiểm thử trong bộ nhớ', () => {
  it('đổi cả ba vai, không relay plaintext trước công bố, giải mã và từ chối tamper thực tế', async () => {
    vi.stubGlobal('crypto', webcrypto)
    const players = [0, 1, 2].map(() => {
      const scope = effectScope()
      scopes.push(scope)
      return scope.run(useArena)!
    })
    const host = players[0]!
    host.create('Duc', 'authenticated', '')
    for (const [index, slot] of (['p1', 'p2'] as const).entries()) {
      await host.createOffer(slot)
      const guest = players[index + 1]!
      await guest.join(`Khách ${index + 1}`, host.offerCodes[slot], '')
      await host.acceptAnswer(guest.answerCode.value)
      await vi.waitFor(() => expect(guest.view.value?.phase).toBe('lobby'))
    }
    for (const player of players) player.ready()
    await vi.waitFor(() =>
      expect(host.view.value?.players.every((player) => player.ready)).toBe(true),
    )
    host.start()

    for (const round of [1, 2, 3]) {
      const sender = players[(round - 1) % 3]!
      const receiver = players[round % 3]!
      const interceptor = players[(round + 1) % 3]!
      await vi.waitFor(() => {
        expect(sender.view.value?.phase).toBe('compose')
        expect(sender.cryptoReady.value).toBe(true)
        expect(receiver.cryptoReady.value).toBe(true)
      })
      expect(interceptor.cryptoReady.value).toBe(false)
      expect(interceptor.view.value?.otherPublicKey).toBeUndefined()
      expect(interceptor.view.value?.targetDoor).toBeUndefined()
      const target = sender.view.value!.targetDoor!
      const original = `Bản gốc bí mật vòng ${round}: chọn cửa ${target}. <b>Văn bản</b>`
      network.packets.length = 0
      await sender.send(original)
      await vi.waitFor(() => expect(interceptor.view.value?.phase).toBe('intercept'))
      expect(sender.sentText.value).toBe(original)
      expect(network.packets.some((packet) => packet.text.includes(original))).toBe(false)
      expect(interceptor.view.value?.originalText).toBeUndefined()
      expect(interceptor.view.value?.envelope?.ciphertext).toBeTruthy()
      interceptor.forward(null, round === 2)
      await vi.waitFor(() =>
        expect(receiver.receiptStatus.value).toBe(round === 2 ? 'invalid' : 'verified'),
      )
      expect(receiver.receivedText.value).toBe(round === 2 ? null : original)
      // An invalid receipt ends the round automatically; valid receipts must
      // still keep plaintext local until the subsequent decision.
      expect(round === 2 || !network.packets.some((packet) => packet.text.includes(original))).toBe(
        true,
      )
      if (round !== 2) receiver.decide(target)
      await vi.waitFor(() => expect(host.view.value?.phase).toBe('reveal'))
      expect(host.view.value?.result?.reasonCode).toBe(
        round === 2 ? 'authentication-failed' : 'decision',
      )
      expect(host.view.value?.result?.winner).toBe(round === 2 ? 'none' : 'team')
      await vi.waitFor(() => expect(host.view.value?.result?.originalText).toBe(original))
      expect(host.view.value?.result?.receivedText).toBe(round === 2 ? null : original)
      expect(network.packets.some((packet) => packet.text.includes(original))).toBe(true)
      host.next()
    }
    await vi.waitFor(() => expect(host.view.value?.phase).toBe('finished'))
    expect(host.view.value?.results).toHaveLength(3)
    expect(host.view.value?.players.map((player) => player.score)).toEqual([2, 1, 1])
    host.restart('caesar')
    await vi.waitFor(() => expect(host.view.value?.phase).toBe('lobby'))
    expect(host.view.value?.mode).toBe('caesar')
    expect(host.view.value?.players.every((player) => !player.ready)).toBe(true)
  })
})
