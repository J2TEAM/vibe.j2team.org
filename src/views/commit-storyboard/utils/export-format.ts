import { LANE_META } from '../constants'
import type { ParsedCommit, ReleaseRisk, StoryChapter } from '../types'
import { laneForKind } from './commit-parser'

interface JsonExportInput {
  includeHash: boolean
  parsedCommits: ParsedCommit[]
  releaseDate: string
  releaseRisk: ReleaseRisk
  storyChapters: StoryChapter[]
  versionTag: string
}

export function createJsonExport(input: JsonExportInput): string {
  const payload = {
    generatedAt: new Date().toISOString(),
    includeHash: input.includeHash,
    releaseDate: input.releaseDate,
    releaseRisk: input.releaseRisk,
    storyChapters: input.storyChapters,
    totalCommits: input.parsedCommits.length,
    versionTag: input.versionTag,
  }

  return JSON.stringify(payload, null, 2)
}

function escapeCsvValue(value: string): string {
  if (value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  if (value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value}"`
  }

  return value
}

export function createCsvExport(parsedCommits: ParsedCommit[]): string {
  const headers = ['hash', 'type', 'scope', 'breaking', 'lane', 'laneTitle', 'summary']

  const rows = parsedCommits.map((commit) => {
    const lane = laneForKind(commit.kind)

    return [
      commit.hash,
      commit.kind,
      commit.scope,
      commit.breaking ? 'yes' : 'no',
      lane,
      LANE_META[lane].title,
      commit.summary,
    ]
  })

  const csvRows = [headers, ...rows]

  return csvRows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
    .join('\n')
}
