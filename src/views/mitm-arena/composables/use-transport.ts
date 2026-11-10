import { useEventListener, useTimeoutFn } from '@vueuse/core'
import { onScopeDispose, ref } from 'vue'

export type GuestSlot = 'p1' | 'p2'
export type LinkStatus = 'gathering' | 'waiting-answer' | 'connecting' | 'connected' | 'error'

interface SignalCode {
  v: 1
  kind: 'offer' | 'answer'
  roomId: string
  slot: GuestSlot
  offerId: string
  description: { type: 'offer' | 'answer'; sdp: string }
}

interface TransportCallbacks {
  onOpen: (peerId: string) => void
  onMessage: (peerId: string, text: string) => void
  onClose: (peerId: string, reason: string) => void
}

interface Link {
  peerId: string
  slot: GuestSlot
  roomId: string
  offerId: string
  pc: RTCPeerConnection
  channel: RTCDataChannel | null
  opened: boolean
  closed: boolean
  answerAccepted: boolean
  stopConnectDeadline?: () => void
  cleanups: Array<() => void>
}

const MAX_SIGNAL_LENGTH = 100_000
const MAX_MESSAGE_LENGTH = 64_000
const CHANNEL_LABEL = 'mitm-arena-v1'
const ID_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/

/** Connection codes contain only public WebRTC signaling data, never game state or keys. */
export function encodeSignal(code: SignalCode): string {
  const bytes = new TextEncoder().encode(JSON.stringify(code))
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}

export function decodeSignal(input: string, expectedKind: 'offer' | 'answer'): SignalCode {
  try {
    const compact = input.replace(/\s/g, '')
    if (!compact || compact.length > MAX_SIGNAL_LENGTH) throw new Error()
    const bytes = Uint8Array.from(atob(compact), (character) => character.charCodeAt(0))
    const parsed = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    ) as Partial<SignalCode> | null
    if (
      !parsed ||
      parsed.v !== 1 ||
      parsed.kind !== expectedKind ||
      typeof parsed.roomId !== 'string' ||
      !ID_PATTERN.test(parsed.roomId) ||
      (parsed.slot !== 'p1' && parsed.slot !== 'p2') ||
      typeof parsed.offerId !== 'string' ||
      !ID_PATTERN.test(parsed.offerId) ||
      !parsed.description ||
      parsed.description.type !== expectedKind ||
      typeof parsed.description.sdp !== 'string' ||
      parsed.description.sdp.length > 65_000 ||
      !parsed.description.sdp.startsWith('v=0')
    ) {
      throw new Error()
    }
    return parsed as SignalCode
  } catch {
    throw new Error(
      expectedKind === 'offer'
        ? 'Mã mời không hợp lệ. Hãy sao chép đầy đủ mã mời của MITM Arena.'
        : 'Mã trả lời không hợp lệ. Hãy sao chép đầy đủ mã trả lời của MITM Arena.',
    )
  }
}

function rtcConfiguration(stunUrl: string): RTCConfiguration {
  const url = stunUrl.trim()
  if (!url) return { iceServers: [] }
  // A STUN address is public configuration. TURN credentials are deliberately unsupported.
  if (!/^stuns?:[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(url)) {
    throw new Error('Địa chỉ STUN phải có dạng stun:tên-miền:cổng, không chứa mật khẩu.')
  }
  return { iceServers: [{ urls: url }] }
}

/**
 * Reliable star topology: one trusted host and at most two guests.
 * Identity comes from the negotiated link, never from a field in a game message.
 * Signaling is manual copy/paste; STUN is optional and no relay is provisioned.
 */
export function useTransport(callbacks: TransportCallbacks) {
  const links = new Map<string, Link>()
  const status = ref<Record<string, LinkStatus>>({})
  let hostRoomId = ''
  let generation = 0

  function disposeLink(link: Link, reason: string, notify: boolean) {
    if (link.closed) return
    link.closed = true
    for (const cleanup of link.cleanups) cleanup()
    link.cleanups.length = 0
    if (link.channel) {
      link.channel.onopen = null
      link.channel.onmessage = null
      link.channel.onclose = null
      link.channel.onerror = null
      link.channel.close()
    }
    link.pc.ondatachannel = null
    link.pc.onconnectionstatechange = null
    link.pc.onicegatheringstatechange = null
    link.pc.close()
    if (links.get(link.peerId) === link) links.delete(link.peerId)
    delete status.value[link.peerId]
    if (notify) callbacks.onClose(link.peerId, reason)
  }

  function close() {
    generation += 1
    for (const link of links.values()) disposeLink(link, '', false)
    links.clear()
    hostRoomId = ''
    status.value = {}
  }

  function fail(link: Link, reason: string) {
    if (link.closed) return
    disposeLink(link, reason, false)
    status.value[link.peerId] = 'error'
    callbacks.onClose(link.peerId, reason)
  }

  function makeLink(
    peerId: string,
    slot: GuestSlot,
    roomId: string,
    offerId: string,
    stunUrl: string,
  ): Link {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error(
        'Trình duyệt này chưa hỗ trợ WebRTC. Hãy dùng Chrome, Edge, Firefox hoặc Safari mới.',
      )
    }
    const pc = new RTCPeerConnection(rtcConfiguration(stunUrl))
    const link: Link = {
      peerId,
      slot,
      roomId,
      offerId,
      pc,
      channel: null,
      opened: false,
      closed: false,
      answerAccepted: false,
      cleanups: [],
    }
    const disconnectGrace = useTimeoutFn(
      () =>
        fail(
          link,
          'Mất kết nối với người chơi. Phiên này không hỗ trợ khôi phục; hãy tạo ván mới.',
        ),
      8_000,
      { immediate: false },
    )
    const connectDeadline = useTimeoutFn(
      () =>
        fail(
          link,
          'Kết nối quá hạn. Hãy kiểm tra mã trả lời, STUN và mạng; sau đó tạo mã mời mới.',
        ),
      180_000,
    )
    link.cleanups.push(disconnectGrace.stop, connectDeadline.stop)
    link.stopConnectDeadline = connectDeadline.stop
    pc.onconnectionstatechange = () => {
      if (link.closed) return
      if (pc.connectionState === 'connected') disconnectGrace.stop()
      if (pc.connectionState === 'disconnected') disconnectGrace.start()
      if (pc.connectionState === 'failed') {
        fail(link, 'WebRTC không kết nối được. Mạng có thể cần TURN; bản này không cung cấp TURN.')
      }
      if (pc.connectionState === 'closed') {
        fail(link, 'Kết nối đã đóng. Hãy tạo ván mới để tiếp tục.')
      }
    }
    links.set(peerId, link)
    status.value[peerId] = 'gathering'
    return link
  }

  function setupChannel(link: Link, channel: RTCDataChannel) {
    if (link.closed || link.channel || channel.label !== CHANNEL_LABEL) {
      channel.close()
      return
    }
    link.channel = channel
    channel.onopen = () => {
      if (link.closed || link.opened) return
      link.opened = true
      status.value[link.peerId] = 'connected'
      // The connection deadline is no longer needed after the data channel opens.
      link.stopConnectDeadline?.()
      callbacks.onOpen(link.peerId)
    }
    channel.onmessage = (event: MessageEvent<string>) => {
      if (link.closed || !link.opened) return
      if (typeof event.data !== 'string' || event.data.length > MAX_MESSAGE_LENGTH) {
        fail(link, 'Đã đóng kết nối vì nhận bản tin sai định dạng hoặc quá lớn.')
        return
      }
      callbacks.onMessage(link.peerId, event.data)
    }
    channel.onclose = () =>
      fail(link, 'Người chơi đã rời phòng hoặc tải lại trang. Hãy tạo ván mới.')
    channel.onerror = () => fail(link, 'Kênh dữ liệu gặp lỗi. Hãy tạo ván mới.')
  }

  function gatherIce(link: Link): Promise<RTCSessionDescriptionInit> {
    return new Promise((resolve, reject) => {
      if (link.closed) {
        reject(new Error('Đã hủy kết nối.'))
        return
      }
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        timeout.stop()
        link.pc.onicegatheringstatechange = null
        const description = link.pc.localDescription
        if (link.closed || !description) {
          reject(new Error('Đã hủy kết nối.'))
          return
        }
        if (!/(?:^|\r?\n)a=candidate:/.test(description.sdp)) {
          reject(
            new Error(
              'Trình duyệt hoặc chính sách mạng không cung cấp địa chỉ ICE cho WebRTC. Hãy dùng trình duyệt/mạng cho phép WebRTC hoặc cấu hình STUN phù hợp.',
            ),
          )
          return
        }
        resolve({ type: description.type, sdp: description.sdp })
      }
      const cancel = () => {
        if (settled) return
        settled = true
        timeout.stop()
        link.pc.onicegatheringstatechange = null
        reject(new Error('Đã hủy kết nối.'))
      }
      const timeout = useTimeoutFn(finish, 8_000, { immediate: false })
      link.cleanups.push(cancel)
      link.pc.onicegatheringstatechange = () => {
        if (link.pc.iceGatheringState === 'complete') finish()
      }
      if (link.pc.iceGatheringState === 'complete') finish()
      else timeout.start()
    })
  }

  function createHost(roomId: string) {
    if (!ID_PATTERN.test(roomId)) throw new Error('Mã phòng không hợp lệ.')
    close()
    hostRoomId = roomId
  }

  async function createOffer(slot: GuestSlot, stunUrl: string): Promise<string> {
    if (!hostRoomId) throw new Error('Hãy tạo phòng trước khi tạo mã mời.')
    if (slot !== 'p1' && slot !== 'p2') throw new Error('Phòng chỉ có hai chỗ khách.')
    if (links.has(slot)) throw new Error('Chỗ này đã có kết nối hoặc mã mời. Hãy hủy mã cũ trước.')
    const link = makeLink(slot, slot, hostRoomId, crypto.randomUUID(), stunUrl)
    const currentGeneration = generation
    try {
      setupChannel(link, link.pc.createDataChannel(CHANNEL_LABEL, { ordered: true }))
      await link.pc.setLocalDescription(await link.pc.createOffer())
      const description = await gatherIce(link)
      if (link.closed || currentGeneration !== generation || !description.sdp) {
        throw new Error('Đã hủy kết nối.')
      }
      status.value[slot] = 'waiting-answer'
      return encodeSignal({
        v: 1,
        kind: 'offer',
        roomId: link.roomId,
        slot,
        offerId: link.offerId,
        description: { type: 'offer', sdp: description.sdp },
      })
    } catch (error) {
      disposeLink(link, '', false)
      throw error
    }
  }

  async function join(
    offer: string,
    stunUrl: string,
  ): Promise<{ answer: string; roomId: string; peerId: string }> {
    if (hostRoomId || links.size)
      throw new Error('Hãy rời hoặc hủy phòng hiện tại trước khi tham gia.')
    const code = decodeSignal(offer, 'offer')
    const link = makeLink('host', code.slot, code.roomId, code.offerId, stunUrl)
    const currentGeneration = generation
    try {
      link.pc.ondatachannel = (event) => setupChannel(link, event.channel)
      await link.pc.setRemoteDescription(code.description)
      await link.pc.setLocalDescription(await link.pc.createAnswer())
      const description = await gatherIce(link)
      if (link.closed || currentGeneration !== generation || !description.sdp) {
        throw new Error('Đã hủy kết nối.')
      }
      status.value.host = 'connecting'
      return {
        roomId: code.roomId,
        peerId: code.slot,
        answer: encodeSignal({
          ...code,
          kind: 'answer',
          description: { type: 'answer', sdp: description.sdp },
        }),
      }
    } catch (error) {
      disposeLink(link, '', false)
      throw error
    }
  }

  async function acceptAnswer(answer: string): Promise<void> {
    if (!hostRoomId) throw new Error('Chỉ chủ phòng mới nhận mã trả lời.')
    const code = decodeSignal(answer, 'answer')
    const link = links.get(code.slot)
    if (
      !link ||
      link.closed ||
      code.roomId !== hostRoomId ||
      code.roomId !== link.roomId ||
      code.offerId !== link.offerId
    ) {
      throw new Error('Mã trả lời không thuộc phòng/chỗ đang chờ, hoặc mã mời đã bị hủy.')
    }
    if (link.answerAccepted || link.pc.signalingState !== 'have-local-offer') {
      throw new Error('Chỗ này đã nhận mã trả lời. Không thể dùng một mã mời cho hai người.')
    }
    link.answerAccepted = true
    status.value[code.slot] = 'connecting'
    try {
      await link.pc.setRemoteDescription(code.description)
    } catch {
      link.answerAccepted = false
      status.value[code.slot] = 'waiting-answer'
      throw new Error('Không nhận được mã trả lời. Hãy kiểm tra mã hoặc hủy chỗ để tạo mã mời mới.')
    }
  }

  function send(peerId: string, text: string): boolean {
    const link = links.get(peerId)
    const channel = link?.channel
    if (
      !link ||
      link.closed ||
      !channel ||
      channel.readyState !== 'open' ||
      text.length > MAX_MESSAGE_LENGTH ||
      channel.bufferedAmount > 1_000_000
    ) {
      return false
    }
    try {
      channel.send(text)
      return true
    } catch {
      fail(link, 'Không gửi được dữ liệu. Hãy tạo ván mới.')
      return false
    }
  }

  function cancel(slot: string) {
    const link = links.get(slot)
    if (link) disposeLink(link, 'Chủ phòng đã hủy kết nối này.', link.opened)
  }

  onScopeDispose(close)
  useEventListener(window, 'pagehide', close)

  return { status, createHost, createOffer, join, acceptAnswer, send, close, cancel }
}
