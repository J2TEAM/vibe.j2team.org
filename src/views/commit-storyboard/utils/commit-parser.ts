import { KNOWN_KIND_MAP } from '../constants'
import type { CommitKind, ParsedCommit, StoryLane } from '../types'

export function normalizeKind(rawType: string, message: string): CommitKind {
  const type = rawType.toLowerCase().trim()

  if (type.length > 0) {
    const mapped = KNOWN_KIND_MAP[type]
    if (mapped) {
      return mapped
    }
  }

  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
    return 'fix'
  }

  if (lowerMessage.includes('feature') || lowerMessage.includes('add')) {
    return 'feat'
  }

  if (lowerMessage.includes('doc')) {
    return 'docs'
  }

  if (lowerMessage.includes('refactor')) {
    return 'refactor'
  }

  if (lowerMessage.includes('perf') || lowerMessage.includes('optimiz')) {
    return 'perf'
  }

  if (lowerMessage.includes('test')) {
    return 'test'
  }

  return 'other'
}

export function laneForKind(kind: CommitKind): StoryLane {
  if (kind === 'feat') {
    return 'value'
  }

  if (kind === 'fix' || kind === 'perf') {
    return 'stability'
  }

  if (kind === 'refactor' || kind === 'test') {
    return 'quality'
  }

  if (kind === 'build' || kind === 'chore' || kind === 'style' || kind === 'ci' || kind === 'revert') {
    return 'maintenance'
  }

  if (kind === 'docs') {
    return 'knowledge'
  }

  return 'other'
}

export function parseCommitLine(line: string): ParsedCommit {
  const trimmed = line.trim()
  const hashMatch = trimmed.match(/^([0-9a-f]{7,40})\s+(.+)$/i)
  const hash = hashMatch?.[1] ?? ''
  const messagePart = hashMatch?.[2] ?? trimmed

  const conventionalMatch = messagePart.match(/^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<summary>.+)$/i)
  const groups = conventionalMatch?.groups
  const rawType = groups?.type ?? ''
  const summary = (groups?.summary ?? messagePart).trim()
  const scope = (groups?.scope ?? 'general').trim()
  const breaking = Boolean(groups?.breaking) || /breaking\s+change/i.test(messagePart)

  return {
    raw: trimmed,
    hash,
    kind: normalizeKind(rawType, messagePart),
    scope: scope.length > 0 ? scope : 'general',
    summary,
    breaking,
  }
}

export function parseCommitLog(logInput: string): ParsedCommit[] {
  return logInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseCommitLine(line))
}

export function formatCommitLine(commit: ParsedCommit, includeHash: boolean): string {
  if (!includeHash || commit.hash.length === 0) {
    return commit.summary
  }

  return `${commit.summary} [${commit.hash}]`
}

export function toDraftBullet(commit: ParsedCommit, includeHash: boolean): string {
  const scopePrefix = commit.scope === 'general' ? '' : `(${commit.scope}) `
  const breakingPrefix = commit.breaking ? 'BREAKING: ' : ''
  const hashSuffix = includeHash && commit.hash.length > 0 ? ` [${commit.hash}]` : ''

  return `- ${breakingPrefix}${scopePrefix}${commit.summary}${hashSuffix}`
}
