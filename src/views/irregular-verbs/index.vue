<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { refDebounced, useClipboard, useEventListener, useLocalStorage } from '@vueuse/core'
import { irregularVerbs } from './data/verbs'
import type { IrregularVerb, VerbPattern } from './types'

type PatternFilter = 'ALL' | VerbPattern
type AccentMode = 'US' | 'UK'

interface VerbView extends IrregularVerb {
  pattern: VerbPattern
}

interface PatternMeta {
  label: string
  description: string
  badgeClass: string
}

interface IpaData {
  uk?: string
  us?: string
  generic?: string
}

interface DictionaryPhonetic {
  text?: string
  audio?: string
}

interface DictionaryEntry {
  phonetics?: DictionaryPhonetic[]
}

const patternMeta: Record<VerbPattern, PatternMeta> = {
  AAA: {
    label: 'AAA',
    description: 'V1 = V2 = V3',
    badgeClass: 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky',
  },
  ABA: {
    label: 'ABA',
    description: 'V1 = V3',
    badgeClass: 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber',
  },
  ABB: {
    label: 'ABB',
    description: 'V2 = V3',
    badgeClass: 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral',
  },
  ABC: {
    label: 'ABC',
    description: 'Mỗi dạng khác nhau',
    badgeClass: 'border-border-default bg-bg-elevated text-text-secondary',
  },
}

const searchInputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const debouncedQuery = refDebounced(query, 120)

const selectedPattern = useLocalStorage<PatternFilter>('irregular-verbs-pattern', 'ALL')
const favoriteBases = useLocalStorage<string[]>('irregular-verbs-favorites', [])
const favoriteOnly = useLocalStorage<boolean>('irregular-verbs-favorite-only', false)
const recentQueries = useLocalStorage<string[]>('irregular-verbs-recent-queries', [])
const accentMode = useLocalStorage<AccentMode>('irregular-verbs-accent-mode', 'US')
const ipaCache = useLocalStorage<Record<string, IpaData | null>>('irregular-verbs-ipa-cache', {})

const selectedLetter = ref('ALL')
const practiceVerb = ref<VerbView | null>(null)
const showPracticeAnswer = ref(false)
const isPracticeModalOpen = ref(false)
const ipaLoading = ref<Record<string, boolean>>({})

const copiedBase = ref('')
const { copy, copied } = useClipboard()

const manualIpaFallback: Record<string, IpaData> = {
  be: { uk: '/biː/', us: '/biː/' },
  read: { uk: '/riːd/', us: '/riːd/' },
}

function setAccentMode(mode: AccentMode): void {
  accentMode.value = mode
}

function parseIpaResponse(data: unknown): IpaData | null {
  if (!Array.isArray(data)) return null

  const entries = data as DictionaryEntry[]
  const texts = new Set<string>()

  let uk: string | undefined
  let us: string | undefined
  let generic: string | undefined

  for (const entry of entries) {
    const phonetics = entry.phonetics ?? []

    for (const phonetic of phonetics) {
      const text = phonetic.text?.trim()
      if (!text || !text.includes('/')) continue

      texts.add(text)
      const audio = phonetic.audio?.toLowerCase() ?? ''

      if (!uk && (audio.includes('uk') || audio.includes('en-gb'))) {
        uk = text
        continue
      }

      if (!us && (audio.includes('us') || audio.includes('en-us'))) {
        us = text
        continue
      }

      if (!generic) {
        generic = text
      }
    }
  }

  const uniqueTexts = [...texts]
  if (!uk && uniqueTexts[0]) uk = uniqueTexts[0]
  if (!us && uniqueTexts[1]) us = uniqueTexts[1]
  if (!generic && uniqueTexts[0]) generic = uniqueTexts[0]

  if (!uk && !us && !generic) return null

  return { uk, us, generic }
}

async function ensureIpa(base: string): Promise<void> {
  if (Object.prototype.hasOwnProperty.call(ipaCache.value, base)) return
  if (ipaLoading.value[base]) return

  const manual = manualIpaFallback[base]
  if (manual) {
    ipaCache.value = { ...ipaCache.value, [base]: manual }
    return
  }

  ipaLoading.value = { ...ipaLoading.value, [base]: true }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(base)}`,
    )
    if (!response.ok) {
      ipaCache.value = { ...ipaCache.value, [base]: null }
      return
    }

    const data = (await response.json()) as unknown
    const parsed = parseIpaResponse(data)
    ipaCache.value = { ...ipaCache.value, [base]: parsed }
  } catch {
    ipaCache.value = { ...ipaCache.value, [base]: null }
  } finally {
    ipaLoading.value = { ...ipaLoading.value, [base]: false }
  }
}

function getIpaForBase(base: string): string {
  const entry = ipaCache.value[base]

  if (entry === null) return 'N/A'
  if (!entry) return ipaLoading.value[base] ? 'Đang tải IPA...' : '...'

  if (accentMode.value === 'UK') {
    return entry.uk ?? entry.generic ?? entry.us ?? 'N/A'
  }

  return entry.us ?? entry.generic ?? entry.uk ?? 'N/A'
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function detectPattern(verb: IrregularVerb): VerbPattern {
  if (verb.base === verb.past && verb.past === verb.participle) return 'AAA'
  if (verb.base === verb.participle && verb.base !== verb.past) return 'ABA'
  if (verb.past === verb.participle && verb.base !== verb.past) return 'ABB'
  return 'ABC'
}

const allVerbs = computed<VerbView[]>(() => {
  return irregularVerbs
    .map((verb) => ({ ...verb, pattern: detectPattern(verb) }))
    .sort((a, b) => a.base.localeCompare(b.base))
})

const alphabet = computed<string[]>(() => {
  const letters = new Set(allVerbs.value.map((verb) => verb.base[0]?.toUpperCase() ?? ''))
  return ['ALL', ...[...letters].filter(Boolean).sort()]
})

const filteredVerbs = computed<VerbView[]>(() => {
  const keyword = normalizeText(debouncedQuery.value)

  return allVerbs.value.filter((verb) => {
    if (selectedPattern.value !== 'ALL' && verb.pattern !== selectedPattern.value) {
      return false
    }

    if (favoriteOnly.value && !favoriteBases.value.includes(verb.base)) {
      return false
    }

    if (
      selectedLetter.value !== 'ALL' &&
      !verb.base.startsWith(selectedLetter.value.toLowerCase())
    ) {
      return false
    }

    if (!keyword) return true

    return normalizeText(`${verb.base} ${verb.past} ${verb.participle} ${verb.meaning}`).includes(
      keyword,
    )
  })
})

const filteredCount = computed(() => filteredVerbs.value.length)

const patternCounts = computed<Record<VerbPattern, number>>(() => {
  const counts: Record<VerbPattern, number> = { AAA: 0, ABA: 0, ABB: 0, ABC: 0 }
  for (const verb of filteredVerbs.value) {
    counts[verb.pattern] = (counts[verb.pattern] ?? 0) + 1
  }
  return counts
})

const practicePool = computed<VerbView[]>(() => {
  if (filteredVerbs.value.length >= 12) return filteredVerbs.value
  return allVerbs.value
})

function focusSearchInput(): void {
  searchInputRef.value?.focus()
  searchInputRef.value?.select()
}

function clearSearch(): void {
  query.value = ''
}

function setPattern(pattern: PatternFilter): void {
  selectedPattern.value = pattern
}

function setLetter(letter: string): void {
  selectedLetter.value = letter
}

function toggleFavoriteOnly(): void {
  favoriteOnly.value = !favoriteOnly.value
}

function isFavorite(base: string): boolean {
  return favoriteBases.value.includes(base)
}

function toggleFavorite(base: string): void {
  if (isFavorite(base)) {
    favoriteBases.value = favoriteBases.value.filter((item) => item !== base)
    return
  }
  favoriteBases.value = [...favoriteBases.value, base]
}

function copyVerb(verb: VerbView): void {
  const payload = `${verb.base} - ${verb.past} - ${verb.participle}: ${verb.meaning}`
  copy(payload)
  copiedBase.value = verb.base
}

function buildOxfordSearchUrl(base: string): string {
  const keyword = encodeURIComponent(base)
  return `https://www.oxfordlearnersdictionaries.com/search/english/?q=${keyword}`
}

function pickNextPracticeVerb(): void {
  const pool = practicePool.value
  if (!pool.length) {
    practiceVerb.value = null
    return
  }

  const currentBase = practiceVerb.value?.base
  const candidates =
    pool.length > 1 && currentBase ? pool.filter((verb) => verb.base !== currentBase) : pool
  const next = candidates[Math.floor(Math.random() * candidates.length)]

  if (!next) {
    practiceVerb.value = null
    return
  }

  practiceVerb.value = next
  showPracticeAnswer.value = false
}

function revealPracticeAnswer(): void {
  showPracticeAnswer.value = true
}

function openPracticeModal(): void {
  isPracticeModalOpen.value = true
  if (!practiceVerb.value) {
    pickNextPracticeVerb()
  }
}

function closePracticeModal(): void {
  isPracticeModalOpen.value = false
}

function applyRecentQuery(value: string): void {
  query.value = value
  focusSearchInput()
}

watch(debouncedQuery, (value) => {
  const cleaned = value.trim()
  if (cleaned.length < 2) return

  const deduped = recentQueries.value.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())
  recentQueries.value = [cleaned, ...deduped].slice(0, 6)
})

watch(practicePool, () => {
  if (!practiceVerb.value) {
    pickNextPracticeVerb()
  }
})

watch(
  filteredVerbs,
  (verbs) => {
    for (const verb of verbs.slice(0, 12)) {
      void ensureIpa(verb.base)
    }
  },
  { immediate: true },
)

watch(practiceVerb, (verb) => {
  if (!verb) return
  void ensureIpa(verb.base)
})

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const isTypingField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    focusSearchInput()
    return
  }

  if (!isTypingField && event.key === '/') {
    event.preventDefault()
    focusSearchInput()
    return
  }

  if (event.key === 'Escape') {
    if (isPracticeModalOpen.value) {
      closePracticeModal()
      return
    }

    if (query.value.length) {
      clearSearch()
    }
  }
})

pickNextPracticeVerb()
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header class="animate-fade-up border border-border-default bg-bg-surface p-5 sm:p-7">
        <div class="mb-4 flex items-center justify-between gap-3">
          <RouterLink
            to="/"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
            Về trang chủ
          </RouterLink>
          <span
            class="inline-flex items-center border border-accent-coral/40 bg-accent-coral/10 px-2.5 py-1 font-display text-xs tracking-widest text-accent-coral"
          >
            VOL.01 / LEARN
          </span>
        </div>

        <p class="font-display text-xs tracking-widest text-accent-sky">// SEARCH CỰC NHANH</p>
        <h1
          class="mt-2 font-display text-3xl font-bold leading-tight text-text-primary sm:text-5xl"
        >
          Bảng Động Từ Bất Quy Tắc
        </h1>
        <p class="mt-3 max-w-3xl text-sm text-text-secondary sm:text-base">
          Tìm theo V1, V2, V3 hoặc nghĩa tiếng Việt. Có bộ lọc mẫu biến đổi, biến thể BrE/AmE, và
          phiên âm IPA để luyện phản xạ nhanh.
        </p>

        <div class="mt-6 border border-border-default bg-bg-deep p-3 sm:p-4">
          <div class="flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2">
            <Icon icon="lucide:search" class="size-4 text-accent-amber" />
            <input
              ref="searchInputRef"
              v-model="query"
              type="text"
              placeholder="Ví dụ: go / went / đi / build..."
              class="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-dim"
            />
            <button
              v-if="query"
              class="inline-flex items-center gap-1 border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="clearSearch"
            >
              <Icon icon="lucide:x" class="size-3.5" />
              Xóa
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-dim">
            <span class="inline-flex items-center gap-1">
              <Icon icon="lucide:keyboard" class="size-3.5 text-accent-sky" />
              Ctrl/Cmd + K hoặc /
            </span>
            <span class="inline-flex items-center gap-1">
              <Icon icon="lucide:search-check" class="size-3.5 text-accent-amber" />
              {{ filteredCount }} / {{ allVerbs.length }} kết quả
            </span>
            <span class="inline-flex items-center gap-1">
              <Icon icon="lucide:star" class="size-3.5 text-accent-coral" />
              {{ favoriteBases.length }} từ yêu thích
            </span>
            <div
              class="inline-flex items-center gap-1 border border-border-default bg-bg-elevated p-1"
            >
              <button
                class="px-2 py-1 font-display text-[10px] tracking-wider transition"
                :class="
                  accentMode === 'UK'
                    ? 'bg-accent-sky/10 text-accent-sky'
                    : 'text-text-dim hover:text-text-primary'
                "
                @click="setAccentMode('UK')"
              >
                UK
              </button>
              <button
                class="px-2 py-1 font-display text-[10px] tracking-wider transition"
                :class="
                  accentMode === 'US'
                    ? 'bg-accent-amber/10 text-accent-amber'
                    : 'text-text-dim hover:text-text-primary'
                "
                @click="setAccentMode('US')"
              >
                US
              </button>
            </div>
          </div>

          <div v-if="recentQueries.length" class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="item in recentQueries"
              :key="item"
              class="border border-border-default bg-bg-elevated px-2.5 py-1 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              @click="applyRecentQuery(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </header>

      <section class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article
          class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-4"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">TỔNG SỐ ĐỘNG TỪ</p>
          <p class="mt-2 font-display text-3xl font-bold text-accent-coral">
            {{ allVerbs.length }}
          </p>
        </article>
        <article
          class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-4"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">KẾT QUẢ PHÙ HỢP</p>
          <p class="mt-2 font-display text-3xl font-bold text-accent-amber">{{ filteredCount }}</p>
        </article>
        <article
          class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-4"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">MẪU ABB</p>
          <p class="mt-2 font-display text-3xl font-bold text-accent-coral">
            {{ patternCounts.ABB }}
          </p>
          <p class="mt-1 text-xs text-text-dim">V2 = V3 (vd: build-built-built)</p>
        </article>
        <article
          class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-4"
        >
          <p class="font-display text-xs tracking-widest text-text-dim">MẪU ABC</p>
          <p class="mt-2 font-display text-3xl font-bold text-accent-sky">
            {{ patternCounts.ABC }}
          </p>
          <p class="mt-1 text-xs text-text-dim">Mỗi dạng khác nhau (vd: go-went-gone)</p>
        </article>
      </section>

      <section class="mt-6 border border-border-default bg-bg-surface p-4 sm:p-5">
        <h2 class="flex items-center gap-2 font-display text-xl font-semibold">
          <span class="text-accent-coral text-sm tracking-widest">//</span>
          Bộ Lọc Trực Quan
        </h2>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            class="border px-3 py-2 text-xs transition"
            :class="
              selectedPattern === 'ALL'
                ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary'
            "
            @click="setPattern('ALL')"
          >
            Tất cả mẫu
          </button>
          <button
            v-for="(meta, pattern) in patternMeta"
            :key="pattern"
            class="border px-3 py-2 text-xs transition"
            :class="
              selectedPattern === pattern
                ? meta.badgeClass
                : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary'
            "
            @click="setPattern(pattern)"
          >
            {{ meta.label }} · {{ meta.description }}
          </button>
          <button
            class="inline-flex items-center gap-2 border px-3 py-2 text-xs transition"
            :class="
              favoriteOnly
                ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                : 'border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary'
            "
            @click="toggleFavoriteOnly"
          >
            <Icon icon="lucide:star" class="size-3.5" />
            Chỉ xem yêu thích
          </button>
        </div>

        <div class="mt-4 border border-border-default bg-bg-deep p-3">
          <p class="mb-2 font-display text-xs tracking-widest text-text-dim">
            LỌC NHANH THEO CHỮ CÁI
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="letter in alphabet"
              :key="letter"
              class="border px-2.5 py-1.5 text-xs transition"
              :class="
                selectedLetter === letter
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary'
              "
              @click="setLetter(letter)"
            >
              {{ letter }}
            </button>
          </div>
        </div>
      </section>

      <section class="mt-6">
        <article class="border border-border-default bg-bg-surface p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 font-display text-xl font-semibold">
              <span class="text-accent-coral text-sm tracking-widest">//</span>
              Bảng Tra Cứu
            </h2>

            <button
              class="inline-flex items-center gap-2 border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber transition hover:border-accent-amber"
              @click="openPracticeModal"
            >
              <Icon icon="lucide:brain" class="size-3.5" />
              Luyện Nhớ Nhanh
            </button>
          </div>

          <div
            v-if="!filteredVerbs.length"
            class="mt-6 border border-border-default bg-bg-deep p-6 text-center"
          >
            <Icon icon="lucide:search-x" class="mx-auto mb-3 size-9 text-text-dim" />
            <p class="font-display text-lg text-text-primary">Không tìm thấy kết quả phù hợp</p>
            <p class="mt-1 text-sm text-text-secondary">
              Thử từ khóa ngắn hơn hoặc đặt lại bộ lọc.
            </p>
            <button
              class="mt-3 border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="clearSearch"
            >
              Xóa từ khóa
            </button>
          </div>

          <div v-else>
            <div class="mt-4 hidden overflow-x-auto md:block">
              <table class="w-full min-w-220 border-collapse text-sm">
                <thead>
                  <tr
                    class="border-b border-border-default text-left font-display text-xs tracking-widest text-text-dim"
                  >
                    <th class="px-2 py-2">V1</th>
                    <th class="px-2 py-2">V2</th>
                    <th class="px-2 py-2">V3</th>
                    <th class="px-2 py-2">IPA</th>
                    <th class="px-2 py-2">NGHĨA</th>
                    <th class="px-2 py-2">MẪU</th>
                    <th class="px-2 py-2 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="verb in filteredVerbs"
                    :key="verb.base"
                    class="border-b border-border-default/70 text-text-secondary transition hover:bg-bg-elevated/40"
                  >
                    <td class="px-2 py-3 font-display text-sm font-semibold text-text-primary">
                      {{ verb.base }}
                    </td>
                    <td class="px-2 py-3 font-mono text-accent-amber">{{ verb.past }}</td>
                    <td class="px-2 py-3 font-mono text-accent-sky">{{ verb.participle }}</td>
                    <td class="px-2 py-3">
                      <span class="font-mono text-xs text-text-primary">{{
                        getIpaForBase(verb.base)
                      }}</span>
                    </td>
                    <td class="px-2 py-3">{{ verb.meaning }}</td>
                    <td class="px-2 py-3">
                      <span
                        class="inline-flex border px-2 py-1 text-[10px] font-display tracking-wider"
                        :class="patternMeta[verb.pattern].badgeClass"
                      >
                        {{ patternMeta[verb.pattern].label }}
                      </span>
                    </td>
                    <td class="px-2 py-3 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <a
                          :href="buildOxfordSearchUrl(verb.base)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex border border-border-default px-2 py-1 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                          aria-label="Mở Oxford"
                          title="Mở Oxford"
                        >
                          <Icon icon="lucide:external-link" class="size-3.5" />
                        </a>
                        <button
                          class="inline-flex border border-border-default px-2 py-1 text-xs transition hover:border-accent-amber"
                          :class="
                            isFavorite(verb.base)
                              ? 'bg-accent-amber/10 text-accent-amber'
                              : 'text-text-secondary hover:text-text-primary'
                          "
                          @click="toggleFavorite(verb.base)"
                        >
                          <Icon icon="lucide:star" class="size-3.5" />
                        </button>
                        <button
                          class="inline-flex border border-border-default px-2 py-1 text-xs transition hover:border-accent-sky"
                          :class="
                            copied && copiedBase === verb.base
                              ? 'bg-accent-sky/10 text-accent-sky'
                              : 'text-text-secondary hover:text-text-primary'
                          "
                          @click="copyVerb(verb)"
                        >
                          <Icon
                            :icon="
                              copied && copiedBase === verb.base ? 'lucide:check' : 'lucide:copy'
                            "
                            class="size-3.5"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 grid gap-3 md:hidden">
              <article
                v-for="verb in filteredVerbs"
                :key="`mobile-${verb.base}`"
                class="border border-border-default bg-bg-deep p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-display text-base font-semibold text-text-primary">
                      {{ verb.base }}
                    </p>
                    <p class="mt-0.5 text-xs text-text-secondary">{{ verb.meaning }}</p>
                  </div>
                  <span
                    class="inline-flex border px-2 py-1 text-[10px] font-display tracking-wider"
                    :class="patternMeta[verb.pattern].badgeClass"
                  >
                    {{ verb.pattern }}
                  </span>
                </div>

                <div class="mt-3 grid gap-2 text-xs">
                  <div
                    class="flex items-center justify-between border border-border-default bg-bg-surface px-2.5 py-2"
                  >
                    <span class="text-text-dim">V2</span>
                    <span class="font-mono text-accent-amber">{{ verb.past }}</span>
                  </div>
                  <div
                    class="flex items-center justify-between border border-border-default bg-bg-surface px-2.5 py-2"
                  >
                    <span class="text-text-dim">V3</span>
                    <span class="font-mono text-accent-sky">{{ verb.participle }}</span>
                  </div>
                  <div
                    class="flex items-center justify-between border border-border-default bg-bg-surface px-2.5 py-2"
                  >
                    <span class="text-text-dim">IPA</span>
                    <span class="font-mono text-text-primary">{{ getIpaForBase(verb.base) }}</span>
                  </div>
                </div>

                <div class="mt-3 grid grid-cols-3 gap-2">
                  <a
                    :href="buildOxfordSearchUrl(verb.base)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center border border-border-default bg-bg-surface px-2.5 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                  >
                    Oxford
                  </a>
                  <button
                    class="flex-1 border border-border-default bg-bg-surface px-2.5 py-2 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                    @click="toggleFavorite(verb.base)"
                  >
                    Yêu thích
                  </button>
                  <button
                    class="flex-1 border border-border-default bg-bg-surface px-2.5 py-2 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
                    @click="copyVerb(verb)"
                  >
                    Copy
                  </button>
                </div>
              </article>
            </div>
          </div>
        </article>
      </section>

      <div
        v-if="isPracticeModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/85 p-4"
        @click.self="closePracticeModal"
      >
        <div class="w-full max-w-2xl border border-border-default bg-bg-surface p-4 sm:p-5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="flex items-center gap-2 font-display text-lg font-semibold">
              <span class="text-accent-coral text-sm tracking-widest">//</span>
              Luyện Nhớ Nhanh
            </h3>
            <button
              class="inline-flex items-center gap-1 border border-border-default px-2.5 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="closePracticeModal"
            >
              <Icon icon="lucide:x" class="size-3.5" />
              Đóng
            </button>
          </div>

          <p class="mt-2 text-sm text-text-secondary">
            Đoán V2/V3 trước rồi bấm hiện đáp án. Nhấn ESC để đóng modal nhanh.
          </p>

          <div v-if="practiceVerb" class="mt-4">
            <div class="border border-border-default bg-bg-deep p-4">
              <p class="text-xs text-text-dim">Dạng gốc</p>
              <p class="font-display text-3xl font-semibold text-text-primary">
                {{ practiceVerb.base }}
              </p>
              <p class="mt-1 text-sm text-text-secondary">{{ practiceVerb.meaning }}</p>
              <div
                class="mt-3 flex items-center justify-between border border-border-default bg-bg-surface px-3 py-2"
              >
                <span class="text-xs text-text-dim">IPA</span>
                <span class="font-mono text-xs text-text-primary">{{
                  getIpaForBase(practiceVerb.base)
                }}</span>
              </div>
            </div>

            <div v-if="showPracticeAnswer" class="mt-3 space-y-2">
              <div
                class="flex items-center justify-between border border-border-default bg-bg-deep px-3 py-2"
              >
                <span class="text-xs text-text-dim">V2</span>
                <span class="font-mono text-accent-amber">{{ practiceVerb.past }}</span>
              </div>
              <div
                class="flex items-center justify-between border border-border-default bg-bg-deep px-3 py-2"
              >
                <span class="text-xs text-text-dim">V3</span>
                <span class="font-mono text-accent-sky">{{ practiceVerb.participle }}</span>
              </div>
            </div>

            <div class="mt-3 flex gap-2">
              <a
                :href="buildOxfordSearchUrl(practiceVerb.base)"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 border border-border-default bg-bg-deep px-3 py-2 text-center text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              >
                Mở Oxford
              </a>
              <button
                class="flex-1 border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="revealPracticeAnswer"
              >
                Hiện đáp án
              </button>
              <button
                class="flex-1 border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber transition hover:border-accent-amber"
                @click="pickNextPracticeVerb"
              >
                Từ mới
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
