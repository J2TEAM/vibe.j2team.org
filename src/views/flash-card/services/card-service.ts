import type { Card, CardLevel } from '../types'
import { put, deleteById, getAllByIndex } from './db'

export async function getCardsBySet(setId: string): Promise<Card[]> {
  const cards = await getAllByIndex<Card>('cards', 'setId', setId)
  return cards.sort((a, b) => a.order - b.order)
}

export async function createCard(data: Pick<Card, 'setId' | 'front' | 'back'>): Promise<Card> {
  const existing = await getCardsBySet(data.setId)
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((c) => c.order)) : -1
  const now = Date.now()
  const card: Card = {
    id: crypto.randomUUID(),
    ...data,
    level: 0 as CardLevel,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  }
  await put('cards', card)
  return card
}

export async function updateCard(
  id: string,
  cards: Card[],
  data: Partial<Pick<Card, 'front' | 'back' | 'level'>>,
): Promise<Card | undefined> {
  const card = cards.find((c) => c.id === id)
  if (!card) return undefined
  const updated: Card = { ...card, ...data, updatedAt: Date.now() }
  await put('cards', updated)
  return updated
}

export async function updateCardLevel(card: Card, level: CardLevel): Promise<void> {
  await put('cards', { ...card, level, updatedAt: Date.now() })
}

export async function removeCard(id: string): Promise<void> {
  await deleteById('cards', id)
}

export async function reorderCard(
  cards: Card[],
  cardId: string,
  direction: 'up' | 'down',
): Promise<void> {
  const index = cards.findIndex((c) => c.id === cardId)
  if (index === -1) return

  const swapIndex = direction === 'up' ? index - 1 : index + 1
  const current = cards[index]
  const swap = cards[swapIndex]
  if (!current || !swap) return

  const tempOrder = current.order
  await put('cards', { ...current, order: swap.order, updatedAt: Date.now() })
  await put('cards', { ...swap, order: tempOrder, updatedAt: Date.now() })
}

export async function bulkCreateCards(
  setId: string,
  items: { front: string; back: string }[],
): Promise<Card[]> {
  const existing = await getCardsBySet(setId)
  const maxOrder = existing.length > 0 ? Math.max(...existing.map((c) => c.order)) : -1
  const now = Date.now()
  const cards: Card[] = items.map((item, i) => ({
    id: crypto.randomUUID(),
    setId,
    front: item.front,
    back: item.back,
    level: 0 as CardLevel,
    order: maxOrder + 1 + i,
    createdAt: now,
    updatedAt: now,
  }))

  for (const card of cards) {
    await put('cards', card)
  }
  return cards
}

export async function resetCardLevels(setId: string): Promise<void> {
  const cards = await getCardsBySet(setId)
  for (const card of cards) {
    await put('cards', { ...card, level: 0, updatedAt: Date.now() })
  }
}
