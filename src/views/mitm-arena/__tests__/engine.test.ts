// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { EngineState, Envelope, GameEvent, Mode, PlayerId } from '../types'
import {
  applyEvent,
  connectPlayer,
  createRoom,
  disconnectPlayer,
  PHASE_DURATION,
  projectRoom,
  rolesForRound,
  tickRoom,
} from '../utils/engine'

let eventSequence = 0
const envelope: Envelope = { iv: 'AAAAAAAAAAAAAAAA', ciphertext: 'AAAAAAAAAAAAAAAAAAAAAA==' }
const publicKey = 'A'.repeat(88)

function event(
  room: EngineState,
  type: GameEvent['type'],
  payload: Partial<GameEvent> = {},
): GameEvent {
  return {
    id: `test-${++eventSequence}`,
    roomId: room.roomId,
    round: room.round,
    phase: room.phase,
    type,
    ...payload,
  }
}

function send(
  room: EngineState,
  sender: PlayerId,
  type: GameEvent['type'],
  payload: Partial<GameEvent> = {},
  now = 1000,
) {
  return applyEvent(room, sender, event(room, type, payload), now, () => 0.99)
}

function readyRoom(mode: Mode = 'plain'): EngineState {
  const room = createRoom('TEST', 'An', mode)
  connectPlayer(room, 'p1', 'Bình')
  connectPlayer(room, 'p2', 'Chi')
  for (const id of ['p0', 'p1', 'p2'] as const) send(room, id, 'ready', { ready: true })
  return room
}

function playingRoom(mode: Mode = 'plain'): EngineState {
  const room = readyRoom(mode)
  send(room, 'p0', 'start')
  return room
}

function exchange(room: EngineState) {
  send(room, room.roles.A, 'public-key', { publicKey })
  send(room, room.roles.B, 'public-key', { publicKey })
}

function compose(room: EngineState) {
  if (room.mode === 'authenticated') exchange(room)
  return send(
    room,
    room.roles.A,
    'compose',
    room.mode === 'authenticated' ? { envelope } : { text: 'Chọn cửa 3.' },
  )
}

describe('MITM room authority and lifecycle', () => {
  it('requires exactly three connected and ready participants and only the host may start', () => {
    const room = createRoom('TEST', 'An')
    send(room, 'p0', 'ready', { ready: true })
    expect(send(room, 'p0', 'start').accepted).toBe(false)
    expect(connectPlayer(room, 'p1', 'Bình')).toBe(true)
    expect(connectPlayer(room, 'p1', 'Người thứ tư')).toBe(false)
    connectPlayer(room, 'p2', 'Chi')
    send(room, 'p1', 'ready', { ready: true })
    expect(send(room, 'p0', 'start').accepted).toBe(false)
    send(room, 'p2', 'ready', { ready: true })
    expect(send(room, 'p1', 'start').accepted).toBe(false)
    expect(send(room, 'p0', 'start').accepted).toBe(true)
    expect(room.phase).toBe('compose')
  })

  it('rotates every player through all three roles, then finishes and returns to a fresh lobby', () => {
    const room = playingRoom()
    const played = { p0: new Set(), p1: new Set(), p2: new Set() }
    for (let round = 1; round <= 3; round++) {
      expect(room.round).toBe(round)
      for (const role of ['A', 'B', 'C'] as const) played[room.roles[role]].add(role)
      expect(compose(room).accepted).toBe(true)
      expect(send(room, room.roles.C, 'forward').accepted).toBe(true)
      expect(send(room, room.roles.B, 'decide', { door: 3 }).accepted).toBe(true)
      expect(room.phase).toBe('reveal')
      expect(send(room, 'p0', 'next').accepted).toBe(true)
    }
    expect(room.phase).toBe('finished')
    for (const id of ['p0', 'p1', 'p2'] as const) {
      expect([...played[id]].sort()).toEqual(['A', 'B', 'C'])
      expect(room.players[id].score).toBe(2)
    }
    expect(room.results).toHaveLength(3)
    expect(send(room, 'p0', 'restart').accepted).toBe(true)
    expect(room.phase).toBe('lobby')
    expect(room.round).toBe(0)
    expect(room.results).toHaveLength(0)
    expect(room.players.p0.ready).toBe(false)
    expect(room.players.p0.score).toBe(0)
  })

  it('binds actions to the authenticated transport identity rather than a claimed role', () => {
    const room = playingRoom()
    expect(send(room, room.roles.B, 'compose', { text: 'Giả danh A' }).accepted).toBe(false)
    compose(room)
    expect(send(room, room.roles.A, 'forward', { text: 'Giả danh C' }).accepted).toBe(false)
    send(room, room.roles.C, 'forward')
    expect(send(room, room.roles.C, 'decide', { door: 1 }).accepted).toBe(false)
    expect(send(room, room.roles.A, 'next').accepted).toBe(false)
  })

  it('rejects duplicated IDs, other rooms, old rounds and actions arriving at the deadline', () => {
    const room = playingRoom()
    const command = event(room, 'compose', { text: 'Chọn cửa 3.' })
    expect(applyEvent(room, room.roles.A, command, 1100).accepted).toBe(true)
    expect(applyEvent(room, room.roles.A, command, 1100).accepted).toBe(false)
    expect(send(room, room.roles.C, 'forward', { roomId: 'OTHER' }).accepted).toBe(false)
    expect(send(room, room.roles.C, 'forward', { round: 0 }).accepted).toBe(false)
    const lateForward = event(room, 'forward', { text: 'Chọn cửa 1.' })
    expect(applyEvent(room, room.roles.C, lateForward, room.deadline!).accepted).toBe(false)
    expect(room.phase).toBe('decide')
    expect(room.deliveredText).toBe('Chọn cửa 3.')
  })

  it('rejects empty/long messages and invalid door decisions', () => {
    const room = playingRoom()
    expect(send(room, room.roles.A, 'compose', { text: ' ' }).accepted).toBe(false)
    expect(send(room, room.roles.A, 'compose', { text: 'x'.repeat(181) }).accepted).toBe(false)
    compose(room)
    expect(send(room, room.roles.C, 'forward', { text: 'x'.repeat(181) }).accepted).toBe(false)
    send(room, room.roles.C, 'forward')
    const invalid = event(room, 'decide', { door: 4 as 1 })
    expect(applyEvent(room, room.roles.B, invalid, 1000).accepted).toBe(false)
  })

  it('requires everyone to acknowledge a changed mode again', () => {
    const room = readyRoom()
    expect(send(room, 'p1', 'mode', { mode: 'caesar' }).accepted).toBe(false)
    expect(send(room, 'p0', 'mode', { mode: 'caesar' }).accepted).toBe(true)
    expect(room.mode).toBe('caesar')
    expect(Object.values(room.players).every((player) => !player.ready)).toBe(true)
    expect(send(room, 'p0', 'start').accepted).toBe(false)
  })

  it('cancels an active game on disconnection and refuses session resumption', () => {
    const room = playingRoom()
    disconnectPlayer(room, 'p1')
    expect(room.phase).toBe('aborted')
    expect(room.deadline).toBeNull()
    expect(room.notice).toContain('không hỗ trợ khôi phục')
    expect(connectPlayer(room, 'p1', 'Bình')).toBe(false)
    expect(send(room, 'p0', 'next').accepted).toBe(false)
  })
})

describe('outcome-based scoring and host deadlines', () => {
  it('does not award C merely for editing if B still chooses the mission door', () => {
    const room = playingRoom()
    compose(room)
    send(room, room.roles.C, 'forward', { text: 'Hãy chọn cửa 1.' })
    expect(room.players[room.roles.C].score).toBe(0)
    send(room, room.roles.B, 'decide', { door: 3 })
    expect(room.players[room.roles.C].score).toBe(0)
    expect(room.players[room.roles.A].score).toBe(1)
    expect(room.players[room.roles.B].score).toBe(1)
    expect(room.results[0]?.modified).toBe(true)
  })

  it('awards C only when B actually chooses a different door', () => {
    const room = playingRoom()
    compose(room)
    send(room, room.roles.C, 'forward', { text: 'Hãy chọn cửa 1.' })
    send(room, room.roles.B, 'decide', { door: 1 })
    expect(room.players[room.roles.C].score).toBe(1)
    expect(room.players[room.roles.A].score).toBe(0)
    expect(room.results[0]?.chosenDoor).toBe(1)
    expect(room.results[0]?.targetDoor).toBe(3)
  })

  it('ends A timeout without points and explains the reason', () => {
    const room = playingRoom()
    expect(room.deadline).toBe(1000 + PHASE_DURATION.compose)
    expect(tickRoom(room, room.deadline! - 1)).toBe(false)
    expect(tickRoom(room, room.deadline!)).toBe(true)
    expect(room.phase).toBe('reveal')
    expect(room.results[0]?.reason).toContain('A hết')
    expect(room.results[0]?.winner).toBe('none')
  })

  it('forwards the original when C times out and ends B timeout without points', () => {
    const room = playingRoom()
    compose(room)
    const deadline = room.deadline!
    tickRoom(room, deadline)
    expect(room.phase).toBe('decide')
    expect(room.deliveredText).toBe('Chọn cửa 3.')
    expect(room.deadline).toBe(deadline + PHASE_DURATION.decide)
    tickRoom(room, room.deadline!)
    expect(room.phase).toBe('reveal')
    expect(room.results[0]?.reason).toContain('B hết')
    expect(room.results[0]?.chosenDoor).toBeNull()
    expect(Object.values(room.players).every((player) => player.score === 0)).toBe(true)
  })
})

describe('recipient-specific secrecy and mode constraints', () => {
  it('projects the mission only to A and omits C operations and received edits from A/B until reveal', () => {
    const room = playingRoom()
    expect(projectRoom(room, room.roles.A).targetDoor).toBe(3)
    expect(projectRoom(room, room.roles.B)).not.toHaveProperty('targetDoor')
    expect(projectRoom(room, room.roles.C)).not.toHaveProperty('targetDoor')
    compose(room)
    expect(projectRoom(room, room.roles.A).originalText).toBe('Chọn cửa 3.')
    expect(projectRoom(room, room.roles.B)).not.toHaveProperty('originalText')
    expect(projectRoom(room, room.roles.B)).not.toHaveProperty('interceptedText')
    expect(projectRoom(room, room.roles.C).interceptedText).toBe('Chọn cửa 3.')
    send(room, room.roles.C, 'forward', { text: 'Chọn cửa 1.' })
    expect(projectRoom(room, room.roles.A)).not.toHaveProperty('receivedText')
    expect(projectRoom(room, room.roles.B).receivedText).toBe('Chọn cửa 1.')
    send(room, room.roles.B, 'decide', { door: 1 })
    expect(projectRoom(room, room.roles.A).result?.receivedText).toBe('Chọn cửa 1.')
    expect(projectRoom(room, room.roles.C).result?.targetDoor).toBe(3)
  })

  it('provides a real Caesar hint and requires the correct cipher key before reading or editing', () => {
    const room = playingRoom('caesar')
    compose(room)
    const before = projectRoom(room, room.roles.C)
    expect(before.caesarHint).toBe('GDKKN')
    expect(before).not.toHaveProperty('caesarKey')
    expect(before).not.toHaveProperty('interceptedText')
    expect(send(room, room.roles.C, 'forward', { text: 'Đổi tin' }).accepted).toBe(false)
    expect(send(room, room.roles.C, 'unlock', { key: 3 }).accepted).toBe(false)
    expect(send(room, room.roles.A, 'unlock', { key: room.caesarKey }).accepted).toBe(false)
    expect(send(room, room.roles.C, 'unlock', { key: room.caesarKey }).accepted).toBe(true)
    expect(projectRoom(room, room.roles.C).interceptedText).toBe('Chọn cửa 3.')
    expect(send(room, room.roles.C, 'forward', { text: 'Đổi tin' }).accepted).toBe(true)
  })

  it('allows C to forward Caesar unchanged without solving the challenge', () => {
    const room = playingRoom('caesar')
    compose(room)
    expect(send(room, room.roles.C, 'forward').accepted).toBe(true)
    expect(projectRoom(room, room.roles.B).receivedText).toBe('Chọn cửa 3.')
  })

  it('sends AES envelopes only to C, exchanges public keys only between A/B and prevents overwriting keys', () => {
    const room = playingRoom('authenticated')
    expect(send(room, room.roles.C, 'public-key', { publicKey }).accepted).toBe(false)
    expect(send(room, room.roles.A, 'compose', { envelope }).accepted).toBe(false)
    exchange(room)
    expect(send(room, room.roles.A, 'public-key', { publicKey }).accepted).toBe(false)
    expect(projectRoom(room, room.roles.B).otherPublicKey).toBe(publicKey)
    expect(projectRoom(room, room.roles.C)).not.toHaveProperty('otherPublicKey')
    send(room, room.roles.A, 'compose', { envelope })
    const interceptor = projectRoom(room, room.roles.C)
    expect(interceptor.envelope).toEqual(envelope)
    expect(interceptor).not.toHaveProperty('originalText')
    expect(interceptor).not.toHaveProperty('interceptedText')
    expect(interceptor).not.toHaveProperty('targetDoor')
    expect(interceptor).not.toHaveProperty('caesarKey')
    expect(send(room, room.roles.C, 'forward', { text: 'Không được gửi bản rõ' }).accepted).toBe(
      false,
    )
  })

  it('requires B to report successful real decryption before choosing and gives no points on authentication failure', () => {
    const room = playingRoom('authenticated')
    compose(room)
    send(room, room.roles.C, 'forward', {
      envelope: { ...envelope, ciphertext: 'BAAAAAAAAAAAAAAAAAAAAA==' },
    })
    expect(send(room, room.roles.B, 'decide', { door: 1 }).accepted).toBe(false)
    expect(send(room, room.roles.C, 'receipt', { status: 'invalid' }).accepted).toBe(false)
    expect(send(room, room.roles.B, 'receipt', { status: 'invalid' }).accepted).toBe(true)
    expect(room.phase).toBe('reveal')
    expect(room.results[0]?.authenticated).toBe(false)
    expect(room.results[0]?.reasonCode).toBe('authentication-failed')
    expect(room.results[0]?.modified).toBe(true)
    expect(room.results[0]?.receivedText).toBeNull()
    expect(room.results[0]?.winner).toBe('none')
    expect(Object.values(room.players).every((player) => player.score === 0)).toBe(true)
  })

  it('distinguishes AES receipt timeout from authentication failure and permits a valid authenticated decision', () => {
    const timeoutRoom = playingRoom('authenticated')
    compose(timeoutRoom)
    send(timeoutRoom, timeoutRoom.roles.C, 'forward')
    tickRoom(timeoutRoom, timeoutRoom.deadline!)
    expect(timeoutRoom.results[0]?.authenticated).toBeNull()
    expect(timeoutRoom.results[0]?.reasonCode).toBe('receipt-timeout')
    expect(timeoutRoom.results[0]?.reason).toContain('Không kết luận bản tin bị sửa')
    const room = playingRoom('authenticated')
    compose(room)
    send(room, room.roles.C, 'forward')
    expect(send(room, room.roles.B, 'receipt', { status: 'valid' }).accepted).toBe(true)
    expect(send(room, room.roles.B, 'decide', { door: 3 }).accepted).toBe(true)
    expect(room.results[0]?.authenticated).toBe(true)
    expect(room.results[0]?.winner).toBe('team')
  })

  it('keeps AES plaintext out of commands and host state until the outcome is public', () => {
    const room = playingRoom('authenticated')
    exchange(room)
    expect(send(room, room.roles.A, 'compose', { text: 'Chọn cửa 3.', envelope }).accepted).toBe(
      false,
    )
    expect(send(room, room.roles.A, 'compose', { envelope }).accepted).toBe(true)
    expect(room.originalText).toBe('')
    expect(send(room, room.roles.A, 'reveal-original', { text: 'Chọn cửa 3.' }).accepted).toBe(
      false,
    )
    send(room, room.roles.C, 'forward')
    expect(
      send(room, room.roles.B, 'receipt', { status: 'valid', text: 'Chọn cửa 3.' }).accepted,
    ).toBe(false)
    expect(send(room, room.roles.B, 'receipt', { status: 'valid' }).accepted).toBe(true)
    expect(room.deliveredText).toBeNull()
    send(room, room.roles.B, 'decide', { door: 3 })
    expect(room.results[0]?.originalText).toBe('')
    expect(send(room, 'p0', 'next').accepted).toBe(false)
    expect(send(room, room.roles.C, 'reveal-original', { text: 'Giả bản gốc' }).accepted).toBe(
      false,
    )
    expect(send(room, room.roles.A, 'reveal-original', { text: 'Chọn cửa 3.' }).accepted).toBe(true)
    expect(room.results[0]?.originalText).toBe('Chọn cửa 3.')
    expect(room.results[0]?.receivedText).toBe('Chọn cửa 3.')
    expect(
      send(room, room.roles.A, 'reveal-original', { text: 'Không được thay thế' }).accepted,
    ).toBe(false)
  })

  it('does not share references from a projected result back into trusted host state', () => {
    const room = playingRoom()
    compose(room)
    send(room, room.roles.C, 'forward')
    send(room, room.roles.B, 'decide', { door: 3 })
    const view = projectRoom(room, 'p1')
    view.players[0]!.score = 900
    view.result!.timeline.push('forged')
    view.results[0]!.roles.A = 'p2'
    expect(room.players.p0.score).toBe(1)
    expect(room.results[0]?.timeline).not.toContain('forged')
    expect(room.results[0]?.roles).toEqual(rolesForRound(1))
  })
})
