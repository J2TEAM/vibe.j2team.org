import { computed, onScopeDispose, reactive, ref, shallowRef, watch } from 'vue'
import { useEventListener, useIntervalFn } from '@vueuse/core'
import type { Door, EngineState, GameEvent, Mode, PlayerId, RoomView } from '../types'
import {
  applyEvent,
  connectPlayer,
  createRoom,
  disconnectPlayer,
  projectRoom,
  tickRoom,
} from '../utils/engine'
import {
  decryptMessage,
  deriveSessionKey,
  encryptMessage,
  exportExchangePublicKey,
  generateExchangeKey,
  tamperEnvelope,
} from '../utils/crypto'
import type { CryptoContext } from '../utils/crypto'
import { useTransport } from './use-transport'
import type { GuestSlot } from './use-transport'

type WireMessage =
  | { kind: 'hello'; roomId: string; name: string }
  | { kind: 'event'; event: GameEvent }
  | { kind: 'view'; view: RoomView }
  | { kind: 'error'; roomId: string; message: string }
  | { kind: 'ping' }
  | { kind: 'leave' }

const guests: GuestSlot[] = ['p1', 'p2']

/** The host owns the engine; guests only receive a projection for their bound link. */
export function useArena() {
  const view = shallowRef<RoomView | null>(null)
  const localId = ref<PlayerId>('p0')
  const isHost = computed(() => localId.value === 'p0')
  const busy = ref(false)
  const error = ref('')
  const offerCodes = reactive({ p1: '', p2: '' })
  const answerCode = ref('')
  const cryptoReady = ref(false)
  const receiptStatus = ref<'waiting' | 'verified' | 'invalid' | 'plain'>('waiting')
  const decryptedText = ref<string | null>(null)
  const sentText = ref('')
  const clock = ref(Date.now())
  const clockOffset = ref(0)
  const remaining = computed(() =>
    Math.max(0, Math.ceil(((view.value?.deadline ?? 0) - clock.value - clockOffset.value) / 1000)),
  )
  const receivedText = computed(() =>
    view.value?.mode === 'authenticated' ? decryptedText.value : (view.value?.receivedText ?? null),
  )
  let room: EngineState | null = null
  let name = ''
  let roomId = ''
  let stun = ''
  let closing = false
  let lastSnapshot = 0
  let lastPing = 0
  let lastHost = 0
  const lastSeen = new Map<string, number>()
  let cryptoGeneration = 0
  let keyPair: CryptoKeyPair | null = null
  let aesKey: CryptoKey | null = null
  let deriving = false
  let receiptFingerprint = ''
  let originalRevealed = false

  function fail(message: string) {
    error.value = message
  }
  function sendWire(peerId: string, message: WireMessage) {
    return transport.send(peerId, JSON.stringify(message))
  }
  function publish() {
    if (!room) return
    view.value = projectRoom(room, 'p0')
    for (const peerId of guests) sendWire(peerId, { kind: 'view', view: projectRoom(room, peerId) })
    clockOffset.value = 0
  }
  function dispatch(action: Partial<GameEvent> & Pick<GameEvent, 'type'>) {
    const current = view.value
    if (!current) return
    const event = {
      ...action,
      id: crypto.randomUUID(),
      roomId: current.roomId,
      round: current.round,
      phase: current.phase,
    } as GameEvent
    if (room && isHost.value) {
      const result = applyEvent(room, 'p0', event)
      if (!result.accepted) fail(result.error || 'Hành động không còn hợp lệ.')
      publish()
    } else if (!sendWire('host', { kind: 'event', event }))
      fail('Kênh tới chủ phòng chưa sẵn sàng.')
  }
  const transport = useTransport({
    onOpen(peerId) {
      lastSeen.set(peerId, Date.now())
      if (!isHost.value) {
        lastHost = Date.now()
        sendWire('host', { kind: 'hello', roomId, name })
      }
    },
    onMessage(peerId, text) {
      if (text.length > 32_000) return
      let message: WireMessage | null
      try {
        message = JSON.parse(text) as WireMessage | null
      } catch {
        return
      }
      if (!message || typeof message !== 'object' || typeof message.kind !== 'string') return
      lastSeen.set(peerId, Date.now())
      if (room && isHost.value && (peerId === 'p1' || peerId === 'p2')) {
        if (
          message.kind === 'hello' &&
          message.roomId === roomId &&
          typeof message.name === 'string'
        ) {
          connectPlayer(room, peerId, message.name.slice(0, 24))
          publish()
        } else if (message.kind === 'event' && message.event && typeof message.event === 'object') {
          const result = applyEvent(room, peerId, message.event)
          if (!result.accepted) sendWire(peerId, { kind: 'error', roomId, message: result.error })
          publish()
        } else if (message.kind === 'leave') {
          disconnectPlayer(room, peerId)
          lastSeen.delete(peerId)
          transport.cancel(peerId)
          publish()
        }
      } else if (
        !isHost.value &&
        peerId === 'host' &&
        message.kind === 'error' &&
        message.roomId === roomId &&
        typeof message.message === 'string'
      ) {
        fail(message.message.slice(0, 300))
      } else if (!isHost.value && peerId === 'host' && message.kind === 'view') {
        const incoming = message.view
        if (
          !incoming ||
          incoming.roomId !== roomId ||
          incoming.selfId !== localId.value ||
          !Array.isArray(incoming.players)
        )
          return
        if (view.value && incoming.revision < view.value.revision) return
        lastHost = Date.now()
        clockOffset.value = incoming.serverNow - Date.now()
        view.value = incoming
      }
    },
    onClose(peerId, reason) {
      if (closing) return
      lastSeen.delete(peerId)
      if (room && isHost.value && (peerId === 'p1' || peerId === 'p2')) {
        disconnectPlayer(room, peerId)
        offerCodes[peerId] = ''
        publish()
        fail(reason)
      } else if (!isHost.value) {
        fail(`${reason} Không khôi phục phiên: hãy rời phòng và tạo ván mới.`)
        if (view.value)
          view.value = {
            ...view.value,
            phase: 'aborted',
            notice: 'Mất kết nối với chủ phòng. Ván đã dừng.',
          }
      }
    },
  })

  function context(current: RoomView): CryptoContext {
    return {
      roomId: current.roomId,
      round: current.round,
      senderId: current.roles.A,
      recipientId: current.roles.B,
    }
  }

  async function updateCrypto() {
    const current = view.value
    if (
      !current ||
      current.mode !== 'authenticated' ||
      (current.role !== 'A' && current.role !== 'B')
    )
      return
    const generation = cryptoGeneration
    try {
      if (current.phase === 'compose' && !keyPair && !deriving) {
        deriving = true
        const pair = await generateExchangeKey()
        const publicKey = await exportExchangePublicKey(pair.publicKey)
        if (generation !== cryptoGeneration) return
        keyPair = pair
        deriving = false
        if (view.value?.phase !== 'compose') return
        dispatch({ type: 'public-key', publicKey })
      }
      const latest = view.value
      if (latest?.otherPublicKey && keyPair && !aesKey && !deriving) {
        deriving = true
        const key = await deriveSessionKey(
          keyPair.privateKey,
          latest.otherPublicKey,
          context(latest),
        )
        if (generation !== cryptoGeneration) return
        aesKey = key
        deriving = false
        cryptoReady.value = true
      }
      const delivery = view.value
      if (delivery?.phase === 'decide' && delivery.role === 'B' && delivery.envelope && aesKey) {
        const fingerprint = `${delivery.round}:${delivery.envelope.iv}:${delivery.envelope.ciphertext}`
        if (receiptFingerprint === fingerprint) return
        receiptFingerprint = fingerprint
        try {
          const plaintext = await decryptMessage(aesKey, delivery.envelope, context(delivery))
          if (generation !== cryptoGeneration || view.value?.phase !== 'decide') return
          decryptedText.value = plaintext
          receiptStatus.value = 'verified'
          dispatch({ type: 'receipt', status: 'valid' })
        } catch {
          if (generation !== cryptoGeneration || view.value?.phase !== 'decide') return
          receiptStatus.value = 'invalid'
          dispatch({ type: 'receipt', status: 'invalid' })
        }
      }
    } catch {
      if (generation === cryptoGeneration) {
        deriving = false
        fail(
          'Không thể chuẩn bị khóa. Cần trình duyệt hỗ trợ Web Crypto trên HTTPS hoặc localhost; hãy tạo ván mới.',
        )
      }
    }
  }

  function clearCrypto() {
    cryptoGeneration++
    keyPair = null
    aesKey = null
    deriving = false
    cryptoReady.value = false
    decryptedText.value = null
    receiptStatus.value = view.value?.mode === 'authenticated' ? 'waiting' : 'plain'
    receiptFingerprint = ''
    sentText.value = ''
    originalRevealed = false
  }
  watch(
    () =>
      `${view.value?.roomId}:${view.value?.round}:${view.value?.mode}:${view.value?.phase === 'lobby'}`,
    clearCrypto,
    { flush: 'sync' },
  )
  watch(
    view,
    () => {
      void updateCrypto()
      const current = view.value
      if (
        current?.mode === 'authenticated' &&
        current.role === 'A' &&
        (current.phase === 'reveal' || current.phase === 'finished') &&
        sentText.value &&
        !originalRevealed
      ) {
        originalRevealed = true
        dispatch({ type: 'reveal-original', text: sentText.value })
      }
    },
    { flush: 'post' },
  )

  async function run(operation: () => Promise<void>) {
    if (busy.value) return
    error.value = ''
    busy.value = true
    try {
      await operation()
    } catch (cause) {
      fail(cause instanceof Error ? cause.message : 'Thao tác thất bại. Hãy thử tạo kết nối mới.')
    } finally {
      busy.value = false
    }
  }
  function leave() {
    closing = true
    if (isHost.value && room) {
      disconnectPlayer(room, 'p0')
      publish()
    } else sendWire('host', { kind: 'leave' })
    transport.close()
    room = null
    roomId = ''
    view.value = null
    answerCode.value = ''
    offerCodes.p1 = ''
    offerCodes.p2 = ''
    error.value = ''
    lastSeen.clear()
    clearCrypto()
    closing = false
  }
  function create(playerName: string, mode: Mode, stunUrl: string) {
    leave()
    name = playerName.trim().slice(0, 24) || 'Người chơi'
    stun = stunUrl.trim()
    localId.value = 'p0'
    roomId = crypto.randomUUID()
    room = createRoom(roomId, name, mode)
    transport.createHost(roomId)
    publish()
  }
  async function join(playerName: string, offer: string, stunUrl: string) {
    await run(async () => {
      leave()
      name = playerName.trim().slice(0, 24) || 'Người chơi'
      stun = stunUrl.trim()
      const result = await transport.join(offer, stun)
      roomId = result.roomId
      localId.value = result.peerId as PlayerId
      answerCode.value = result.answer
      lastHost = Date.now()
    })
  }
  async function createOffer(slot: GuestSlot) {
    await run(async () => {
      if (!room || room.phase !== 'lobby') throw new Error('Chỉ mời người chơi tại sảnh chờ.')
      offerCodes[slot] = await transport.createOffer(slot, stun)
    })
  }
  async function acceptAnswer(answer: string) {
    await run(async () => {
      await transport.acceptAnswer(answer)
    })
  }
  function cancelOffer(slot: GuestSlot) {
    transport.cancel(slot)
    offerCodes[slot] = ''
  }
  function ready() {
    dispatch({
      type: 'ready',
      ready: !view.value?.players.find((player) => player.id === localId.value)?.ready,
    })
  }
  function start() {
    dispatch({ type: 'start' })
  }
  async function send(text: string) {
    await run(async () => {
      const current = view.value
      if (!current || current.role !== 'A' || current.phase !== 'compose') return
      if (!text.trim() || text.length > 180) throw new Error('Tin nhắn cần từ 1 đến 180 ký tự.')
      if (current.mode === 'authenticated') {
        if (!aesKey) throw new Error('Chờ A và B trao đổi khóa công khai.')
        const generation = cryptoGeneration
        const envelope = await encryptMessage(aesKey, text, context(current))
        if (
          generation !== cryptoGeneration ||
          view.value?.roomId !== current.roomId ||
          view.value.round !== current.round ||
          view.value.phase !== 'compose' ||
          view.value.role !== 'A'
        )
          return
        sentText.value = text
        dispatch({ type: 'compose', envelope })
      } else {
        sentText.value = text
        dispatch({ type: 'compose', text })
      }
    })
  }
  function unlock(key: number) {
    dispatch({ type: 'unlock', key })
  }
  function forward(text: string | null, tamper: boolean) {
    const current = view.value
    if (current?.mode === 'authenticated') {
      if (!current.envelope) return
      dispatch({
        type: 'forward',
        envelope: tamper ? tamperEnvelope(current.envelope) : current.envelope,
      })
    } else dispatch(text === null ? { type: 'forward' } : { type: 'forward', text })
  }
  function decide(door: number) {
    if (door === 1 || door === 2 || door === 3) dispatch({ type: 'decide', door: door as Door })
  }
  function reject() {
    if (receiptStatus.value === 'invalid') dispatch({ type: 'receipt', status: 'invalid' })
  }
  function next() {
    dispatch({ type: 'next' })
  }
  function restart(mode: Mode) {
    dispatch({ type: 'restart', mode })
  }

  useIntervalFn(() => {
    const now = Date.now()
    clock.value = now
    if (room && isHost.value) {
      const changed = tickRoom(room, now)
      for (const slot of guests) {
        const seen = lastSeen.get(slot)
        if (seen && now - seen > 15_000) {
          disconnectPlayer(room, slot)
          lastSeen.delete(slot)
          transport.cancel(slot)
        }
      }
      if (changed || now - lastSnapshot >= 1000) {
        publish()
        lastSnapshot = now
      }
    } else if (!isHost.value && view.value && now - lastPing > 2000) {
      sendWire('host', { kind: 'ping' })
      lastPing = now
      if (lastHost && now - lastHost > 15_000 && view.value.phase !== 'aborted') {
        fail('Chủ phòng không phản hồi hơn 15 giây. Hãy rời phòng và tạo ván mới.')
        view.value = { ...view.value, phase: 'aborted', notice: 'Mất kết nối với chủ phòng.' }
      }
    }
  }, 250)
  useEventListener(window, 'pagehide', leave)
  onScopeDispose(leave)

  return {
    view,
    localId,
    isHost,
    busy,
    error,
    offerCodes,
    answerCode,
    remaining,
    receivedText,
    sentText,
    receiptStatus,
    cryptoReady,
    connectionStatus: transport.status,
    create,
    join,
    createOffer,
    acceptAnswer,
    cancelOffer,
    ready,
    start,
    send,
    unlock,
    forward,
    decide,
    reject,
    next,
    restart,
    leave,
  }
}
