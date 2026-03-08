import type { GameMode, RecordItem } from '../../types'

function isGameMode(value: unknown): value is GameMode {
  return value === 'classic' || value === 'timed' || value === 'story' || value === 'gravity'
}

function sanitizeRecordList(raw: unknown): RecordItem[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const next: RecordItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue
    }
    const candidate = item as Partial<RecordItem>
    if (
      typeof candidate.name !== 'string' ||
      typeof candidate.score !== 'number' ||
      typeof candidate.difficulty !== 'number' ||
      !isGameMode(candidate.mode) ||
      typeof candidate.timeSpent !== 'number' ||
      typeof candidate.createdAt !== 'string'
    ) {
      continue
    }
    next.push({
      name: candidate.name.trim().slice(0, 24) || 'Anonymous',
      score: Math.max(0, Math.floor(candidate.score)),
      difficulty: Math.max(0, Math.floor(candidate.difficulty)),
      mode: candidate.mode,
      timeSpent: Math.max(0, Math.floor(candidate.timeSpent)),
      createdAt: candidate.createdAt,
    })
  }
  return next
}

function mergeRecordSeeds(existing: RecordItem[], defaults: ReadonlyArray<RecordItem>): RecordItem[] {
  const merged = [...existing]
  const existingKeys = new Set(
    existing.map(
      (item) => `${item.name}|${item.mode}|${item.difficulty}|${item.score}|${item.timeSpent}|${item.createdAt}`,
    ),
  )

  for (const seed of defaults) {
    const key = `${seed.name}|${seed.mode}|${seed.difficulty}|${seed.score}|${seed.timeSpent}|${seed.createdAt}`
    if (!existingKeys.has(key)) {
      merged.push({ ...seed })
    }
  }

  return merged
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-400)
}

export function loadRecordsFromStorage(
  storageKey: string,
  defaultRecords: ReadonlyArray<RecordItem>,
): RecordItem[] {
  let cachedRecords: RecordItem[] = []
  try {
    const cached = localStorage.getItem(storageKey)
    if (cached) {
      cachedRecords = sanitizeRecordList(JSON.parse(cached))
    }
  } catch {
    // fallback to defaults
  }
  return mergeRecordSeeds(cachedRecords, defaultRecords)
}

export function persistRecordsToStorage(storageKey: string, records: ReadonlyArray<RecordItem>): void {
  localStorage.setItem(storageKey, JSON.stringify(records))
}
