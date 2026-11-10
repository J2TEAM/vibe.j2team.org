import type {
  Door,
  EngineState,
  Envelope,
  GameEvent,
  Mode,
  PlayerId,
  Role,
  RoomView,
  RoundResult,
} from '../types'
import { caesar } from './crypto'

export const PLAYER_IDS: readonly PlayerId[] = ['p0', 'p1', 'p2']
export const MAX_MESSAGE_LENGTH = 180
export const PHASE_DURATION = { compose: 60_000, intercept: 45_000, decide: 45_000 } as const

function secureRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! / 4_294_967_296
}

export function rolesForRound(round: number): Record<Role, PlayerId> {
  const offset = Math.max(0, round - 1) % 3
  return {
    A: PLAYER_IDS[offset]!,
    B: PLAYER_IDS[(offset + 1) % 3]!,
    C: PLAYER_IDS[(offset + 2) % 3]!,
  }
}

function roleOf(room: EngineState, id: PlayerId): Role {
  return room.roles.A === id ? 'A' : room.roles.B === id ? 'B' : 'C'
}

function validMode(mode: string | undefined): mode is Mode {
  return mode === 'plain' || mode === 'caesar' || mode === 'authenticated'
}

export function createRoom(roomId: string, hostName: string, mode: Mode = 'plain'): EngineState {
  return {
    roomId,
    mode,
    phase: 'lobby',
    round: 0,
    deadline: null,
    serverNow: Date.now(),
    revision: 0,
    players: {
      p0: {
        id: 'p0',
        name: hostName.trim().slice(0, 24) || 'Chủ phòng',
        connected: true,
        ready: false,
        score: 0,
      },
      p1: { id: 'p1', name: 'Đang chờ', connected: false, ready: false, score: 0 },
      p2: { id: 'p2', name: 'Đang chờ', connected: false, ready: false, score: 0 },
    },
    roles: rolesForRound(1),
    targetDoor: 1,
    caesarKey: 1,
    originalText: '',
    deliveredText: null,
    originalEnvelope: null,
    deliveredEnvelope: null,
    publicKeys: {},
    unlocked: false,
    receipt: 'pending',
    modified: false,
    timeline: [],
    results: [],
    seenEvents: new Set(),
    notice: 'Cần đúng 3 người kết nối và cùng sẵn sàng.',
  }
}

export function connectPlayer(room: EngineState, id: PlayerId, name: string): boolean {
  if (room.phase !== 'lobby' || id === 'p0' || room.players[id].connected) return false
  room.players[id] = {
    id,
    name: name.trim().slice(0, 24) || 'Người chơi',
    connected: true,
    ready: false,
    score: 0,
  }
  room.revision++
  return true
}

export function disconnectPlayer(room: EngineState, id: PlayerId): void {
  if (!room.players[id].connected) return
  room.players[id].connected = false
  room.players[id].ready = false
  if (room.phase !== 'lobby' && room.phase !== 'finished' && room.phase !== 'aborted') {
    room.phase = 'aborted'
    room.deadline = null
    room.notice = `${room.players[id].name} mất kết nối. Ván đã hủy; không hỗ trợ khôi phục phiên hoặc đổi chủ phòng. Hãy tạo phòng mới.`
  }
  room.revision++
}

function beginRound(room: EngineState, now: number, random: () => number): void {
  room.round++
  room.roles = rolesForRound(room.round)
  room.targetDoor = (1 + Math.floor(Math.min(0.999999, Math.max(0, random())) * 3)) as Door
  room.caesarKey = 1 + Math.floor(Math.min(0.999999, Math.max(0, random())) * 25)
  room.originalText = ''
  room.deliveredText = null
  room.originalEnvelope = null
  room.deliveredEnvelope = null
  room.publicKeys = {}
  room.unlocked = room.mode === 'plain'
  room.receipt = 'pending'
  room.modified = false
  room.timeline = ['Host giao nhiệm vụ riêng cho A.']
  room.phase = 'compose'
  room.deadline = now + PHASE_DURATION.compose
  room.notice = 'A đang soạn tin. Nhiệm vụ chỉ được gửi cho A.'
}

function beginDecision(room: EngineState, now: number, timedOut = false): void {
  room.phase = 'decide'
  room.deadline = now + PHASE_DURATION.decide
  if (timedOut) {
    room.deliveredText = room.mode === 'authenticated' ? null : room.originalText
    room.deliveredEnvelope = room.originalEnvelope ? { ...room.originalEnvelope } : null
    room.modified = false
    room.timeline.push('C hết giờ; host tự chuyển tiếp bản gốc.')
  } else {
    room.timeline.push('C chuyển tiếp bản tin; nội dung can thiệp sẽ được công bố cuối vòng.')
  }
  room.receipt = room.mode === 'authenticated' ? 'pending' : 'valid'
  room.notice = 'B đang nhận và đưa ra quyết định.'
}

function finishRound(
  room: EngineState,
  reason: string,
  chosenDoor: Door | null = null,
  reasonCode: RoundResult['reasonCode'] = 'decision',
): void {
  const winner =
    chosenDoor === null ? 'none' : chosenDoor === room.targetDoor ? 'team' : 'interceptor'
  if (winner === 'team') {
    room.players[room.roles.A].score++
    room.players[room.roles.B].score++
  } else if (winner === 'interceptor') {
    room.players[room.roles.C].score++
  }
  const result: RoundResult = {
    round: room.round,
    mode: room.mode,
    roles: { ...room.roles },
    targetDoor: room.targetDoor,
    chosenDoor,
    originalText: room.originalText,
    receivedText: room.deliveredText,
    modified: room.modified,
    authenticated:
      room.mode === 'authenticated' && room.receipt !== 'pending' ? room.receipt === 'valid' : null,
    reason,
    reasonCode,
    winner,
    timeline: [...room.timeline, reason],
  }
  room.results.push(result)
  room.phase = 'reveal'
  room.deadline = null
  room.notice = reason
}

export function tickRoom(room: EngineState, now = Date.now()): boolean {
  room.serverNow = now
  if (room.deadline === null || now < room.deadline) return false
  if (room.phase === 'compose')
    finishRound(
      room,
      'A hết thời gian gửi tin. Không ai nhận điểm vòng này.',
      null,
      'sender-timeout',
    )
  else if (room.phase === 'intercept') beginDecision(room, now, true)
  else if (room.phase === 'decide')
    finishRound(
      room,
      room.mode === 'authenticated' && room.receipt === 'pending'
        ? 'B chưa xác nhận nhận được bản tin trước hạn. Không kết luận bản tin bị sửa; không ai nhận điểm.'
        : 'B hết thời gian chọn cửa. Không ai nhận điểm vòng này.',
      null,
      room.mode === 'authenticated' && room.receipt === 'pending'
        ? 'receipt-timeout'
        : 'receiver-timeout',
    )
  else return false
  room.revision++
  return true
}

function validEnvelope(envelope: Envelope | undefined): envelope is Envelope {
  return (
    !!envelope &&
    typeof envelope.iv === 'string' &&
    typeof envelope.ciphertext === 'string' &&
    /^[A-Za-z0-9+/]{16}$/.test(envelope.iv) &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(envelope.ciphertext) &&
    envelope.ciphertext.length >= 24 &&
    envelope.ciphertext.length <= 2048
  )
}

function validText(text: string | undefined): text is string {
  return typeof text === 'string' && text.trim().length > 0 && text.length <= MAX_MESSAGE_LENGTH
}

/** `sender` comes from the established DataChannel, never from the event payload. */
export function applyEvent(
  room: EngineState,
  sender: PlayerId,
  event: GameEvent,
  now = Date.now(),
  random = secureRandom,
): { accepted: boolean; error: string } {
  const reject = (error: string) => ({ accepted: false, error })
  if (!PLAYER_IDS.includes(sender) || !room.players[sender].connected)
    return reject('Người gửi chưa kết nối.')
  if (
    !event ||
    typeof event !== 'object' ||
    typeof event.id !== 'string' ||
    event.id.length < 1 ||
    event.id.length > 96
  )
    return reject('Sự kiện không hợp lệ.')
  if (event.roomId !== room.roomId) return reject('Sự kiện thuộc phòng khác.')
  if (room.seenEvents.has(event.id)) return reject('Sự kiện đã được xử lý.')
  // Bound memory while preserving IDs for this three-round session.
  if (room.seenEvents.size >= 4096)
    return reject('Quá nhiều thao tác trong phiên. Hãy tạo phòng mới.')
  room.seenEvents.add(event.id)
  tickRoom(room, now)
  if (event.round !== room.round || event.phase !== room.phase)
    return reject('Sự kiện đã đến muộn hoặc thuộc giai đoạn khác.')
  const role = roleOf(room, sender)
  const isHost = sender === 'p0'
  if (event.type === 'ready') {
    if (room.phase !== 'lobby' || typeof event.ready !== 'boolean')
      return reject('Chỉ sẵn sàng trong sảnh chờ.')
    room.players[sender].ready = event.ready
  } else if (event.type === 'mode') {
    if (!isHost || room.phase !== 'lobby' || !validMode(event.mode))
      return reject('Chỉ chủ phòng chọn chế độ trong sảnh.')
    room.mode = event.mode
    for (const id of PLAYER_IDS) room.players[id].ready = false
  } else if (event.type === 'start') {
    if (
      !isHost ||
      room.phase !== 'lobby' ||
      !PLAYER_IDS.every((id) => room.players[id].connected && room.players[id].ready)
    )
      return reject('Cần 3 người kết nối và sẵn sàng để bắt đầu.')
    beginRound(room, now, random)
  } else if (event.type === 'public-key') {
    if (
      room.mode !== 'authenticated' ||
      room.phase !== 'compose' ||
      role === 'C' ||
      typeof event.publicKey !== 'string' ||
      !/^[A-Za-z0-9+/]{80,180}={0,2}$/.test(event.publicKey) ||
      room.publicKeys[sender]
    )
      return reject('Khóa công khai không hợp lệ cho vai hoặc giai đoạn này.')
    room.publicKeys[sender] = event.publicKey
  } else if (event.type === 'compose') {
    if (room.phase !== 'compose' || role !== 'A')
      return reject('Chỉ A được gửi tin ở giai đoạn soạn tin.')
    if (room.mode === 'authenticated') {
      if (
        event.text !== undefined ||
        !validEnvelope(event.envelope) ||
        !room.publicKeys[room.roles.A] ||
        !room.publicKeys[room.roles.B]
      )
        return reject(
          'A/B chưa trao đổi khóa, bản mã không hợp lệ hoặc đã gửi kèm bản rõ trước khi công bố.',
        )
    } else if (!validText(event.text)) return reject('Tin nhắn phải có từ 1 đến 180 ký tự.')
    room.originalText = room.mode === 'authenticated' ? '' : event.text!
    room.originalEnvelope =
      room.mode === 'authenticated' && event.envelope ? { ...event.envelope } : null
    room.timeline.push('A gửi bản tin gốc.')
    room.phase = 'intercept'
    room.deadline = now + PHASE_DURATION.intercept
    room.notice = 'Bản tin đang chờ chuyển tiếp. Chỉ C có giao diện can thiệp.'
  } else if (event.type === 'unlock') {
    if (
      room.phase !== 'intercept' ||
      role !== 'C' ||
      room.mode !== 'caesar' ||
      event.key !== room.caesarKey
    )
      return reject('Khóa Caesar chưa đúng hoặc hành động không hợp lệ.')
    room.unlocked = true
    room.timeline.push('C tìm đúng khóa Caesar và đọc được bản tin.')
  } else if (event.type === 'forward') {
    if (room.phase !== 'intercept' || role !== 'C')
      return reject('Chỉ C được chuyển tiếp trong giai đoạn can thiệp.')
    if (room.mode === 'authenticated') {
      if (
        event.text !== undefined ||
        (event.envelope !== undefined && !validEnvelope(event.envelope))
      )
        return reject('Chế độ xác thực chỉ cho phép chuyển tiếp hoặc đổi bản mã.')
      room.deliveredEnvelope = event.envelope
        ? { ...event.envelope }
        : room.originalEnvelope
          ? { ...room.originalEnvelope }
          : null
      room.modified =
        !!event.envelope &&
        (event.envelope.iv !== room.originalEnvelope?.iv ||
          event.envelope.ciphertext !== room.originalEnvelope?.ciphertext)
    } else {
      if (
        event.envelope !== undefined ||
        (event.text !== undefined && (!validText(event.text) || !room.unlocked))
      )
        return reject('C chưa mở khóa hoặc bản tin sửa không hợp lệ.')
      room.deliveredText = event.text ?? room.originalText
      room.modified = room.deliveredText !== room.originalText
    }
    beginDecision(room, now)
  } else if (event.type === 'receipt') {
    if (
      room.phase !== 'decide' ||
      role !== 'B' ||
      room.mode !== 'authenticated' ||
      room.receipt !== 'pending' ||
      (event.status !== 'valid' && event.status !== 'invalid')
    )
      return reject('Chỉ B xác nhận kiểm tra xác thực một lần khi nhận tin.')
    if (event.text !== undefined)
      return reject('Không gửi bản rõ đã giải mã trước khi công bố kết quả.')
    room.receipt = event.status
    if (event.status === 'invalid') {
      room.timeline.push('Web Crypto tại B từ chối bản tin khi kiểm tra AES-GCM thất bại.')
      finishRound(
        room,
        'B từ chối bản tin do kiểm tra xác thực thất bại. C không được điểm; chưa có quyết định chọn cửa.',
        null,
        'authentication-failed',
      )
    } else {
      room.timeline.push('B giải mã và kiểm tra AES-GCM thành công.')
    }
  } else if (event.type === 'decide') {
    if (
      room.phase !== 'decide' ||
      role !== 'B' ||
      ![1, 2, 3].includes(event.door ?? 0) ||
      room.receipt !== 'valid'
    )
      return reject('Chỉ B được chọn cửa sau khi nhận bản tin hợp lệ.')
    const door = event.door as Door
    room.timeline.push(`B chọn cửa ${door}.`)
    finishRound(
      room,
      door === room.targetDoor
        ? 'B chọn đúng nhiệm vụ: A và B mỗi người nhận 1 điểm.'
        : 'B chọn khác nhiệm vụ: C nhận 1 điểm từ quyết định thực tế của B.',
      door,
    )
  } else if (event.type === 'reveal-original') {
    const result = room.results[room.results.length - 1]
    if (
      room.mode !== 'authenticated' ||
      (room.phase !== 'reveal' && room.phase !== 'finished') ||
      role !== 'A' ||
      !room.originalEnvelope ||
      !result ||
      result.round !== room.round ||
      result.originalText !== '' ||
      !validText(event.text)
    )
      return reject('Chỉ A được công bố bản gốc một lần sau khi vòng kết thúc.')
    room.originalText = event.text
    result.originalText = event.text
    if (result.authenticated === true) result.receivedText = event.text
    result.timeline.push('A công bố bản rõ gốc sau khi vòng kết thúc.')
  } else if (event.type === 'next') {
    if (!isHost || room.phase !== 'reveal')
      return reject('Chỉ chủ phòng chuyển vòng sau khi công bố kết quả.')
    if (room.mode === 'authenticated' && room.originalEnvelope && room.originalText === '')
      return reject('Đang chờ A công bố bản gốc trước khi chuyển vòng.')
    if (room.round === 3) {
      room.phase = 'finished'
      room.notice = 'Đã hoàn thành 3 vòng; mỗi người đã chơi đủ A, B và C.'
    } else beginRound(room, now, random)
  } else if (event.type === 'restart') {
    if (
      !isHost ||
      room.phase !== 'finished' ||
      !PLAYER_IDS.every((id) => room.players[id].connected)
    )
      return reject('Chỉ chủ phòng tạo ván kế tiếp khi vẫn đủ 3 người.')
    if (event.mode !== undefined && !validMode(event.mode))
      return reject('Chế độ ván mới không hợp lệ.')
    if (event.mode) room.mode = event.mode
    room.phase = 'lobby'
    room.round = 0
    room.deadline = null
    room.results = []
    room.publicKeys = {}
    room.originalText = ''
    room.originalEnvelope = null
    room.deliveredEnvelope = null
    room.deliveredText = null
    room.roles = rolesForRound(1)
    for (const id of PLAYER_IDS) {
      room.players[id].ready = false
      room.players[id].score = 0
    }
    room.notice = 'Chọn chế độ và cùng sẵn sàng cho ván mới.'
  } else return reject('Loại sự kiện không được hỗ trợ.')
  room.serverNow = now
  room.revision++
  return { accepted: true, error: '' }
}

function cloneResult(result: RoundResult): RoundResult {
  return { ...result, roles: { ...result.roles }, timeline: [...result.timeline] }
}

export function projectRoom(room: EngineState, id: PlayerId): RoomView {
  const role = roleOf(room, id)
  const view: RoomView = {
    roomId: room.roomId,
    mode: room.mode,
    phase: room.phase,
    round: room.round,
    deadline: room.deadline,
    serverNow: room.serverNow,
    revision: room.revision,
    players: PLAYER_IDS.map((playerId) => ({
      ...room.players[playerId],
      role: roleOf(room, playerId),
    })),
    selfId: id,
    role,
    roles: { ...room.roles },
    result: room.phase === 'reveal' ? cloneResult(room.results[room.results.length - 1]!) : null,
    results: room.results.map(cloneResult),
    notice: room.notice,
  }
  const active = ['compose', 'intercept', 'decide'].includes(room.phase)
  if (!active) return view
  if (role === 'A') {
    view.targetDoor = room.targetDoor
    view.originalText = room.originalText
  }
  if (room.mode === 'caesar' && role !== 'C') view.caesarKey = room.caesarKey
  if (room.mode === 'authenticated' && role !== 'C') {
    const otherId = role === 'A' ? room.roles.B : room.roles.A
    const key = room.publicKeys[otherId]
    if (key) view.otherPublicKey = key
  }
  if (role === 'C' && room.phase === 'intercept') {
    view.unlocked = room.unlocked
    if (room.mode === 'plain' || (room.mode === 'caesar' && room.unlocked))
      view.interceptedText = room.originalText
    if (room.mode === 'caesar') {
      view.ciphertext = caesar(room.originalText, room.caesarKey)
      view.caesarHint = caesar('HELLO', room.caesarKey)
    }
    if (room.mode === 'authenticated' && room.originalEnvelope)
      view.envelope = { ...room.originalEnvelope }
  }
  if (role === 'B' && room.phase === 'decide') {
    view.receipt = room.receipt
    if (room.mode === 'authenticated') {
      if (room.deliveredEnvelope) view.envelope = { ...room.deliveredEnvelope }
      if (room.receipt === 'valid' && room.deliveredText !== null)
        view.receivedText = room.deliveredText
    } else if (room.deliveredText !== null) view.receivedText = room.deliveredText
  }
  return view
}
