import type { CardSet } from '../types'
import { getById, put, deleteById, getAllByIndex, deleteByIndex } from './db'

export async function getSetsByFolder(folderId: string): Promise<CardSet[]> {
  const sets = await getAllByIndex<CardSet>('sets', 'folderId', folderId)
  return sets.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getSetById(id: string): Promise<CardSet | undefined> {
  return getById<CardSet>('sets', id)
}

export async function createSet(
  data: Pick<CardSet, 'folderId' | 'name' | 'description'>,
): Promise<CardSet> {
  const now = Date.now()
  const set: CardSet = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await put('sets', set)
  return set
}

export async function updateSet(
  id: string,
  data: Partial<Pick<CardSet, 'name' | 'description'>>,
): Promise<CardSet | undefined> {
  const set = await getSetById(id)
  if (!set) return undefined
  const updated: CardSet = { ...set, ...data, updatedAt: Date.now() }
  await put('sets', updated)
  return updated
}

export async function removeSet(id: string): Promise<void> {
  await deleteByIndex('cards', 'setId', id)
  await deleteByIndex('sessions', 'setId', id)
  await deleteById('sets', id)
}

export async function getSetCardCount(setId: string): Promise<number> {
  const cards = await getAllByIndex('cards', 'setId', setId)
  return cards.length
}

export async function getSetLastStudied(setId: string): Promise<number | null> {
  const sessions = await getAllByIndex<{ startedAt: number }>('sessions', 'setId', setId)
  if (sessions.length === 0) return null
  return Math.max(...sessions.map((s) => s.startedAt))
}
