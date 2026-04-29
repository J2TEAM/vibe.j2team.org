import { useClipboard, useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { KIND_ORDER, LANE_META, LANE_ORDER, SAMPLE_LOG } from '../constants'
import type {
  CommitKind,
  ExportFormat,
  ParsedCommit,
  ReleaseRisk,
  StoryChapter,
  StoryLane,
  TypeBreakdownItem,
} from '../types'
import { laneForKind, parseCommitLog, toDraftBullet } from '../utils/commit-parser'
import { createCsvExport, createJsonExport } from '../utils/export-format'

export function useCommitStoryboard() {
  const storagePrefix = 'commit-storyboard'

  const logInput = useLocalStorage(`${storagePrefix}.log-input`, SAMPLE_LOG)
  const versionTag = useLocalStorage(`${storagePrefix}.version-tag`, 'v0.1.0')
  const releaseDate = useLocalStorage(`${storagePrefix}.release-date`, new Date().toISOString().slice(0, 10))
  const includeHash = useLocalStorage(`${storagePrefix}.include-hash`, true)

  const { copy, copied, isSupported } = useClipboard()
  const lastCopiedTarget = ref<'draft' | ExportFormat | ''>('')

  const parsedCommits = computed<ParsedCommit[]>(() => parseCommitLog(logInput.value))

  const storyChapters = computed<StoryChapter[]>(() => {
    const grouped: Record<StoryLane, ParsedCommit[]> = {
      value: [],
      stability: [],
      quality: [],
      maintenance: [],
      knowledge: [],
      other: [],
    }

    for (const commit of parsedCommits.value) {
      const lane = laneForKind(commit.kind)
      grouped[lane].push(commit)
    }

    return LANE_ORDER
      .map((lane) => ({
        id: lane,
        title: LANE_META[lane].title,
        note: LANE_META[lane].note,
        icon: LANE_META[lane].icon,
        commits: grouped[lane],
      }))
      .filter((chapter) => chapter.commits.length > 0)
  })

  const typeBreakdown = computed<TypeBreakdownItem[]>(() => {
    return KIND_ORDER
      .map((kind: CommitKind) => ({
        kind,
        count: parsedCommits.value.filter((commit) => commit.kind === kind).length,
      }))
      .filter((item) => item.count > 0)
  })

  const breakingCount = computed(() => parsedCommits.value.filter((commit) => commit.breaking).length)

  const releaseRisk = computed<ReleaseRisk>(() => {
    if (breakingCount.value > 0) {
      return {
        label: 'High',
        hint: 'Có commit breaking change, cần xem kỹ changelog trước khi release.',
      }
    }

    if (parsedCommits.value.length >= 14) {
      return {
        label: 'Medium',
        hint: 'Phạm vi release lớn, nên tách rollout theo nhiều bước.',
      }
    }

    return {
      label: 'Low',
      hint: 'Release gọn, khá an toàn cho phát hành nhanh.',
    }
  })

  const draftReleaseNotes = computed(() => {
    if (parsedCommits.value.length === 0) {
      return ''
    }

    const sections = storyChapters.value
      .map((chapter) => {
        const bullets = chapter.commits.map((commit) => toDraftBullet(commit, includeHash.value)).join('\n')
        return `### ${chapter.title}\n${bullets}`
      })
      .join('\n\n')

    return `## ${versionTag.value} (${releaseDate.value})\n\n${sections}`
  })

  const markdownExport = computed(() => draftReleaseNotes.value)

  const jsonExport = computed(() => {
    return createJsonExport({
      includeHash: includeHash.value,
      parsedCommits: parsedCommits.value,
      releaseDate: releaseDate.value,
      releaseRisk: releaseRisk.value,
      storyChapters: storyChapters.value,
      versionTag: versionTag.value,
    })
  })

  const csvExport = computed(() => createCsvExport(parsedCommits.value))

  const hasExportData = computed(() => parsedCommits.value.length > 0)

  const isDraftCopied = computed(() => copied.value && lastCopiedTarget.value === 'draft')
  const isMarkdownCopied = computed(() => copied.value && lastCopiedTarget.value === 'markdown')
  const isJsonCopied = computed(() => copied.value && lastCopiedTarget.value === 'json')
  const isCsvCopied = computed(() => copied.value && lastCopiedTarget.value === 'csv')

  function getExportContent(format: ExportFormat): string {
    if (format === 'markdown') {
      return markdownExport.value
    }

    if (format === 'json') {
      return jsonExport.value
    }

    return csvExport.value
  }

  function getExportExtension(format: ExportFormat): string {
    if (format === 'markdown') {
      return 'md'
    }

    return format
  }

  function getExportMimeType(format: ExportFormat): string {
    if (format === 'markdown') {
      return 'text/markdown;charset=utf-8'
    }

    if (format === 'json') {
      return 'application/json;charset=utf-8'
    }

    return 'text/csv;charset=utf-8'
  }

  function buildExportFileName(format: ExportFormat): string {
    const rawVersion = versionTag.value.trim().length > 0 ? versionTag.value.trim() : 'release'
    const safeVersion = rawVersion.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
    const rawDate = releaseDate.value.trim().length > 0 ? releaseDate.value.trim() : new Date().toISOString().slice(0, 10)
    const safeDate = rawDate.replace(/[^0-9-]/g, '')

    return `commit-storyboard-${safeVersion || 'release'}-${safeDate || 'today'}.${getExportExtension(format)}`
  }

  function restoreSample() {
    logInput.value = SAMPLE_LOG
  }

  function clearLog() {
    logInput.value = ''
  }

  async function copyDraft() {
    if (draftReleaseNotes.value.length === 0) {
      return
    }

    await copy(draftReleaseNotes.value)
    lastCopiedTarget.value = 'draft'
  }

  async function copyExport(format: ExportFormat) {
    const content = getExportContent(format)

    if (!isSupported.value || content.length === 0) {
      return
    }

    await copy(content)
    lastCopiedTarget.value = format
  }

  function downloadExport(format: ExportFormat) {
    if (typeof window === 'undefined' || !hasExportData.value) {
      return
    }

    const content = getExportContent(format)

    if (content.length === 0) {
      return
    }

    const blob = new Blob([content], { type: getExportMimeType(format) })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = buildExportFileName(format)
    anchor.click()

    window.URL.revokeObjectURL(url)
  }

  return {
    draftReleaseNotes,
    hasExportData,
    includeHash,
    isCsvCopied,
    isClipboardSupported: isSupported,
    isDraftCopied,
    isJsonCopied,
    isMarkdownCopied,
    logInput,
    parsedCommits,
    releaseDate,
    releaseRisk,
    storyChapters,
    typeBreakdown,
    versionTag,
    breakingCount,
    clearLog,
    copyExport,
    copyDraft,
    downloadExport,
    restoreSample,
  }
}
