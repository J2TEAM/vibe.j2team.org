import type { BuaDrawingPayloadV2, DrawingStats } from '../types/drawing'
import type { BuaDrawingPayloadV1, BuaStylePayloadV1 } from '../types/payloads'

export type VeBuaCollectionRecord = {
  id: string
  name: string
  createdAt: string
  stylePayload: BuaStylePayloadV1
  drawingPayload: BuaDrawingPayloadV2 | BuaDrawingPayloadV1
  previewBlob: Blob | null
  stats: DrawingStats | null
}

const DB_NAME = 've-bua-db-v1'
const DB_VERSION = 1
const STORE = 'collection'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IDB open failed'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const request = run(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IDB request failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
  })
}

export async function getAllCollectionRecords(): Promise<VeBuaCollectionRecord[]> {
  return withStore('readonly', (store) => store.getAll())
}

export async function putCollectionRecord(record: VeBuaCollectionRecord): Promise<void> {
  await withStore('readwrite', (store) => store.put(record))
}

export async function deleteCollectionRecord(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id))
}

export async function clearCollectionRecords(): Promise<void> {
  await withStore('readwrite', (store) => store.clear())
}
