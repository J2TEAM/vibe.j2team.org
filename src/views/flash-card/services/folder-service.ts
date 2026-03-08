import type { Folder } from '../types'
import { getAll, getById, put, deleteById, getAllByIndex, deleteByIndex } from './db'

export async function getAllFolders(): Promise<Folder[]> {
  const folders = await getAll<Folder>('folders')
  return folders.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getFolderById(id: string): Promise<Folder | undefined> {
  return getById<Folder>('folders', id)
}

export async function createFolder(
  data: Pick<Folder, 'name' | 'description' | 'color' | 'icon'>,
): Promise<Folder> {
  const now = Date.now()
  const folder: Folder = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await put('folders', folder)
  return folder
}

export async function updateFolder(
  id: string,
  data: Partial<Pick<Folder, 'name' | 'description' | 'color' | 'icon'>>,
): Promise<Folder | undefined> {
  const folder = await getFolderById(id)
  if (!folder) return undefined
  const updated: Folder = { ...folder, ...data, updatedAt: Date.now() }
  await put('folders', updated)
  return updated
}

export async function removeFolder(id: string): Promise<void> {
  // Cascade: delete all sets in folder, and all cards in those sets
  const sets = await getAllByIndex<{ id: string }>('sets', 'folderId', id)
  for (const set of sets) {
    await deleteByIndex('cards', 'setId', set.id)
    await deleteByIndex('sessions', 'setId', set.id)
  }
  await deleteByIndex('sets', 'folderId', id)
  await deleteById('folders', id)
}

export async function getFolderSetCount(folderId: string): Promise<number> {
  const sets = await getAllByIndex('sets', 'folderId', folderId)
  return sets.length
}
