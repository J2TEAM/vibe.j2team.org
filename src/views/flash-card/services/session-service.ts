import type { StudySession } from '../types'
import { getAll, put, getAllByIndex } from './db'

export async function createSession(setId: string): Promise<StudySession> {
  const session: StudySession = {
    id: crypto.randomUUID(),
    setId,
    startedAt: Date.now(),
    completedAt: null,
    cardsReviewed: 0,
    cardsCorrect: 0,
  }
  await put('sessions', session)
  return session
}

export async function completeSession(
  session: StudySession,
  cardsReviewed: number,
  cardsCorrect: number,
): Promise<void> {
  await put('sessions', {
    ...session,
    completedAt: Date.now(),
    cardsReviewed,
    cardsCorrect,
  })
}

export async function getSessionsBySet(setId: string): Promise<StudySession[]> {
  const sessions = await getAllByIndex<StudySession>('sessions', 'setId', setId)
  return sessions.sort((a, b) => b.startedAt - a.startedAt)
}

export async function getAllSessions(): Promise<StudySession[]> {
  return getAll<StudySession>('sessions')
}
