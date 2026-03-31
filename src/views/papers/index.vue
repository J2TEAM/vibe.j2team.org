<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// --- TYPES ---
interface Article {
  title: string
  authors: string
  year: string
  publication: string
  citations: number
  abstract: string
  link: string
  doi: string
  openAccess: boolean
}

// --- STATE ---
const query = ref('')
const yearFrom = ref('')
const yearTo = ref('')
const sortBy = ref<'cited_by_count' | 'publication_date' | 'relevance_score'>('relevance_score')
const openAccessOnly = ref(false)
const surveyFilter = ref<'all' | 'exclude' | 'only'>('all')
const numResults = ref('20')
const showAdvanced = ref(false)

const isLoading = ref(false)
const errorMsg = ref('')
const articles = ref<Article[]>([])
const searchDone = ref(false)
const lastQuery = ref('')
const totalResults = ref(0)

// --- SELECTION & EXPAND ---
const selectedIds = ref<Set<number>>(new Set())
const expandedIds = ref<Set<number>>(new Set())

const allSelected = computed(
  () => articles.value.length > 0 && selectedIds.value.size === articles.value.length,
)
const someSelected = computed(
  () => selectedIds.value.size > 0 && selectedIds.value.size < articles.value.length,
)

function toggleSelect(i: number) {
  const s = new Set(selectedIds.value)
  if (s.has(i)) {
    s.delete(i)
  } else {
    s.add(i)
  }
  selectedIds.value = s
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(articles.value.map((_, i) => i))
  }
}

function toggleExpand(i: number) {
  const s = new Set(expandedIds.value)
  if (s.has(i)) {
    s.delete(i)
  } else {
    s.add(i)
  }
  expandedIds.value = s
}

// --- OPENALEX API ---
// Docs: https://docs.openalex.org/api-entities/works/search-works
async function doSearch() {
  if (!query.value.trim()) {
    errorMsg.value = 'Vui lòng nhập từ khóa tìm kiếm.'
    return
  }

  isLoading.value = true
  errorMsg.value = ''
  articles.value = []
  searchDone.value = false
  lastQuery.value = query.value.trim()
  selectedIds.value = new Set()
  expandedIds.value = new Set()

  try {
    const params = new URLSearchParams({
      search: query.value.trim(),
      per_page: numResults.value,
      mailto: 'vibe@j2team.org', // polite pool — faster response
    })

    // Filters
    const filters: string[] = ['type:article']
    if (yearFrom.value && yearTo.value) {
      filters.push(`publication_year:${yearFrom.value}-${yearTo.value}`)
    } else if (yearFrom.value) {
      filters.push(`publication_year:>${Number(yearFrom.value) - 1}`)
    } else if (yearTo.value) {
      filters.push(`publication_year:<${Number(yearTo.value) + 1}`)
    }
    if (openAccessOnly.value) filters.push('open_access.is_oa:true')
    params.set('filter', filters.join(','))

    // Sort
    if (sortBy.value !== 'relevance_score') {
      params.set('sort', `${sortBy.value}:desc`)
    }

    // Select only needed fields to reduce payload
    params.set(
      'select',
      'title,authorships,publication_year,primary_location,cited_by_count,abstract_inverted_index,doi,open_access',
    )

    const resp = await fetch(`https://api.openalex.org/works?${params.toString()}`)
    if (!resp.ok) throw new Error(`Lỗi API: ${resp.status}`)

    const data = await resp.json()
    totalResults.value = data.meta?.count ?? 0

    const SURVEY_RE =
      /\b(survey|review|systematic review|literature review|meta.analysis|overview|state of the art)\b/i

    const mapped: Article[] = (data.results ?? []).map(
      (w: OpenAlexWork): Article => ({
        title: w.title ?? '(Không có tiêu đề)',
        authors: formatAuthors(w.authorships),
        year: String(w.publication_year ?? ''),
        publication: w.primary_location?.source?.display_name ?? '',
        citations: w.cited_by_count ?? 0,
        abstract: decodeAbstract(w.abstract_inverted_index),
        link: w.doi ? `https://doi.org/${w.doi.replace('https://doi.org/', '')}` : '',
        doi: w.doi ?? '',
        openAccess: w.open_access?.is_oa ?? false,
      }),
    )

    articles.value = mapped.filter((a) => {
      const isSurvey = SURVEY_RE.test(a.title)
      if (surveyFilter.value === 'exclude') return !isSurvey
      if (surveyFilter.value === 'only') return isSurvey
      return true
    })

    searchDone.value = true
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.'
  } finally {
    isLoading.value = false
  }
}

// --- OPENALEX TYPES ---
interface OpenAlexWork {
  title: string | null
  authorships: { author: { display_name: string } }[]
  publication_year: number | null
  primary_location: { source: { display_name: string } | null } | null
  cited_by_count: number | null
  abstract_inverted_index: Record<string, number[]> | null
  doi: string | null
  open_access: { is_oa: boolean } | null
}

// OpenAlex stores abstract as inverted index: { word: [pos1, pos2, ...] }
function decodeAbstract(inverted: Record<string, number[]> | null): string {
  if (!inverted) return ''
  const entries = Object.entries(inverted)
  if (!entries.length) return ''
  const max = Math.max(...entries.flatMap(([, positions]) => positions))
  const words = Array.from<string>({ length: max + 1 })
  for (const [word, positions] of entries) {
    for (const pos of positions) words[pos] = word
  }
  return words.filter(Boolean).join(' ')
}

function formatAuthors(authorships: { author: { display_name: string } }[]): string {
  if (!authorships?.length) return ''
  const names = authorships.slice(0, 4).map((a) => a.author?.display_name ?? '')
  return names.join(', ') + (authorships.length > 4 ? ` +${authorships.length - 4}` : '')
}

// --- EXPORT ---
function getExportTarget(): Article[] {
  return selectedIds.value.size > 0
    ? articles.value.filter((_, i) => selectedIds.value.has(i))
    : articles.value
}

function exportCSV() {
  const target = getExportTarget()
  if (!target.length) return
  const headers = [
    'Tiêu đề',
    'Tác giả',
    'Năm',
    'Xuất bản',
    'Trích dẫn',
    'Tóm tắt',
    'DOI/Link',
    'Open Access',
  ]
  const rows = target.map((a) => [
    a.title,
    a.authors,
    a.year,
    a.publication,
    a.citations,
    a.abstract,
    a.link,
    a.openAccess ? 'Có' : 'Không',
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  triggerDownload(
    '\uFEFF' + csv,
    `scholar_${lastQuery.value.slice(0, 30)}.csv`,
    'text/csv;charset=utf-8;',
  )
}

function exportXLSX() {
  const target = getExportTarget()
  if (!target.length) return
  const headers = [
    'Tiêu đề',
    'Tác giả',
    'Năm',
    'Xuất bản',
    'Trích dẫn',
    'Tóm tắt',
    'DOI/Link',
    'Open Access',
  ]
  const rows = target.map((a) => [
    a.title,
    a.authors,
    a.year,
    a.publication,
    String(a.citations ?? ''),
    a.abstract,
    a.link,
    a.openAccess ? 'Có' : 'Không',
  ])
  const tsv = [headers, ...rows]
    .map((r) => r.map((c) => String(c ?? '').replace(/\t/g, ' ')).join('\t'))
    .join('\n')
  triggerDownload(
    '\uFEFF' + tsv,
    `scholar_${lastQuery.value.slice(0, 30)}.xls`,
    'application/vnd.ms-excel',
  )
}

function triggerDownload(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const resultCount = computed(() => articles.value.length)
const selectedCount = computed(() => selectedIds.value.size)
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body overflow-x-hidden">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <!-- Back link -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary mb-10"
      >
        &larr; Back to home
      </RouterLink>

      <!-- Header -->
      <div class="mb-8">
        <p class="font-display text-sm tracking-widest text-accent-amber/60 mb-2">✦ ✦ ✦</p>
        <h1 class="font-display text-3xl sm:text-4xl font-bold text-accent-coral tracking-tight">
          Scholar Scraper
        </h1>
        <p class="text-xs text-text-dim tracking-[3px] uppercase mt-2 font-display">
          Tìm kiếm bài báo khoa học — Powered by OpenAlex · Miễn phí · Không cần API key
        </p>
        <div class="flex gap-1.5 mt-5">
          <span v-for="n in 24" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
        </div>
      </div>

      <!-- Search form -->
      <div class="border border-border-default bg-bg-surface px-5 py-5 mb-6 space-y-4">
        <p class="font-display text-[10px] tracking-widest text-accent-amber uppercase">
          // Tìm kiếm
        </p>

        <!-- Main query -->
        <div class="flex gap-2">
          <input
            v-model="query"
            type="text"
            placeholder="vd: deep learning image classification, transformer attention..."
            class="flex-1 bg-bg-deep border border-border-default px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-coral transition"
            @keydown.enter="doSearch"
          />
          <button
            :disabled="isLoading"
            class="flex items-center gap-2 bg-accent-coral text-bg-deep font-display font-bold px-6 py-2.5 text-sm uppercase tracking-widest transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            @click="doSearch"
          >
            <Icon v-if="isLoading" icon="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <Icon v-else icon="lucide:search" class="w-4 h-4" />
            <span class="hidden sm:inline">{{ isLoading ? 'Đang tìm...' : 'Tìm kiếm' }}</span>
          </button>
        </div>

        <!-- Search tips -->
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-dim leading-relaxed">
          <span
            ><span class="text-text-secondary">Nhiều từ:</span> nhập tự do —
            <span class="font-mono text-accent-amber/80">federated learning energy</span></span
          >
          <span class="text-border-default">·</span>
          <span
            ><span class="text-text-secondary">Cụm chính xác:</span> dùng nháy kép —
            <span class="font-mono text-accent-amber/80">"federated learning"</span></span
          >
          <span class="text-border-default">·</span>
          <span class="text-text-dim/60">Không hỗ trợ AND / OR / NOT</span>
        </div>

        <!-- Filters row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="space-y-1.5">
            <label class="font-display text-[9px] tracking-widest text-text-dim uppercase"
              >Từ năm</label
            >
            <input
              v-model="yearFrom"
              type="number"
              placeholder="2018"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-coral transition"
            />
          </div>
          <div class="space-y-1.5">
            <label class="font-display text-[9px] tracking-widest text-text-dim uppercase"
              >Đến năm</label
            >
            <input
              v-model="yearTo"
              type="number"
              placeholder="2026"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-coral transition"
            />
          </div>
          <div class="space-y-1.5">
            <label class="font-display text-[9px] tracking-widest text-text-dim uppercase"
              >Số kết quả</label
            >
            <select
              v-model="numResults"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-coral transition"
            >
              <option value="10">10 bài</option>
              <option value="20">20 bài</option>
              <option value="50">50 bài</option>
              <option value="100">100 bài</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="font-display text-[9px] tracking-widest text-text-dim uppercase"
              >Sắp xếp theo</label
            >
            <select
              v-model="sortBy"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-coral transition"
            >
              <option value="relevance_score">Liên quan nhất</option>
              <option value="cited_by_count">Trích dẫn nhiều nhất</option>
              <option value="publication_date">Mới nhất</option>
            </select>
          </div>
        </div>

        <!-- Advanced toggle -->
        <button
          class="flex items-center gap-1.5 font-display text-[10px] tracking-widest text-text-dim uppercase hover:text-accent-coral transition"
          @click="showAdvanced = !showAdvanced"
        >
          <Icon
            :icon="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="w-3.5 h-3.5"
          />
          {{ showAdvanced ? 'Ẩn nâng cao' : 'Tùy chọn nâng cao' }}
        </button>

        <div v-if="showAdvanced" class="pt-3 border-t border-border-default">
          <div class="space-y-3">
            <!-- Open Access toggle -->
            <label class="flex items-center gap-3 cursor-pointer group">
              <div
                class="w-9 h-5 rounded-full border border-border-default transition relative"
                :class="openAccessOnly ? 'bg-accent-coral border-accent-coral' : 'bg-bg-deep'"
                @click="openAccessOnly = !openAccessOnly"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full bg-bg-deep transition-all"
                  :class="openAccessOnly ? 'left-4' : 'left-0.5'"
                />
              </div>
              <span class="text-sm text-text-secondary group-hover:text-text-primary transition">
                Chỉ hiển thị bài Open Access (đọc miễn phí)
              </span>
            </label>

            <!-- Survey / Review filter -->
            <div class="space-y-1.5">
              <p class="font-display text-[9px] tracking-widest text-text-dim uppercase">
                Bài Survey & Review
              </p>
              <div class="flex gap-2">
                <button
                  v-for="opt in [
                    { value: 'all', label: 'Tất cả' },
                    { value: 'exclude', label: 'Loại trừ' },
                    { value: 'only', label: 'Chỉ lấy' },
                  ] as const"
                  :key="opt.value"
                  class="flex-1 py-1.5 text-xs font-display tracking-wide border transition"
                  :class="
                    surveyFilter === opt.value
                      ? 'bg-accent-coral text-bg-deep border-accent-coral font-bold'
                      : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary bg-bg-deep'
                  "
                  @click="surveyFilter = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
              <p class="text-[10px] text-text-dim">
                Lọc theo từ khóa trong tiêu đề: survey, review, meta-analysis, overview...
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="errorMsg"
        class="flex items-start gap-3 border border-red-500/30 bg-red-500/5 px-4 py-3 mb-6"
      >
        <Icon icon="lucide:alert-circle" class="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <p class="text-sm text-red-400">{{ errorMsg }}</p>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="border border-border-default bg-bg-surface px-5 py-12 text-center"
      >
        <Icon icon="lucide:loader-2" class="w-8 h-8 text-accent-coral animate-spin mx-auto mb-4" />
        <p class="font-display text-sm text-text-secondary">Đang tìm kiếm bài báo...</p>
        <p class="text-xs text-text-dim mt-1">
          Đang truy vấn OpenAlex — kho dữ liệu học thuật mở lớn nhất thế giới
        </p>
      </div>

      <!-- Results -->
      <div v-if="searchDone && !isLoading">
        <!-- Toolbar -->
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 class="font-display text-xl font-semibold text-text-primary flex items-center gap-3">
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Kết quả
            <span class="font-display text-sm text-text-dim font-normal">
              {{ resultCount }} / {{ totalResults.toLocaleString() }} bài — "{{ lastQuery }}"
            </span>
          </h2>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              v-if="selectedCount > 0"
              class="text-xs text-accent-coral font-display font-bold tracking-wide"
            >
              {{ selectedCount }} bài đã chọn
            </span>
            <span v-else class="text-xs text-text-dim font-display"> Chưa chọn — xuất tất cả </span>
            <button
              :disabled="!articles.length"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-4 py-2 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              @click="exportCSV"
            >
              <Icon icon="lucide:download" class="w-3.5 h-3.5" />
              {{ selectedCount > 0 ? `CSV (${selectedCount})` : 'CSV' }}
            </button>
            <button
              :disabled="!articles.length"
              class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-4 py-2 text-xs font-display tracking-wide text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              @click="exportXLSX"
            >
              <Icon icon="lucide:table" class="w-3.5 h-3.5" />
              {{ selectedCount > 0 ? `Excel (${selectedCount})` : 'Excel' }}
            </button>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-if="!articles.length"
          class="border border-border-default bg-bg-surface px-5 py-12 text-center"
        >
          <Icon icon="lucide:file-x" class="w-10 h-10 text-text-dim mx-auto mb-3" />
          <p class="text-sm text-text-secondary">
            Không tìm thấy bài báo nào. Thử thay đổi từ khóa hoặc bộ lọc.
          </p>
        </div>

        <!-- Table — desktop -->
        <div class="hidden sm:block border border-border-default bg-bg-surface overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm table-fixed">
              <thead>
                <tr class="border-b border-border-default bg-bg-elevated">
                  <th class="px-3 py-3 w-[4%]">
                    <input
                      type="checkbox"
                      :checked="allSelected"
                      :indeterminate="someSelected"
                      class="w-3.5 h-3.5 cursor-pointer accent-accent-coral"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th
                    class="text-left px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[33%]"
                  >
                    Tiêu đề
                  </th>
                  <th
                    class="text-left px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[17%]"
                  >
                    Tác giả
                  </th>
                  <th
                    class="text-left px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[6%]"
                  >
                    Năm
                  </th>
                  <th
                    class="text-left px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[20%]"
                  >
                    Xuất bản
                  </th>
                  <th
                    class="text-right px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[7%]"
                  >
                    Cite
                  </th>
                  <th
                    class="text-center px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[5%]"
                  >
                    OA
                  </th>
                  <th
                    class="text-center px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[8%]"
                  >
                    Abstract
                  </th>
                  <th
                    class="text-center px-3 py-3 font-display text-[9px] tracking-widest text-text-dim uppercase w-[6%]"
                  >
                    Link
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-default">
                <template v-for="(article, i) in articles" :key="i">
                  <tr
                    class="transition-all hover:bg-bg-elevated"
                    :class="selectedIds.has(i) ? 'bg-bg-elevated' : ''"
                  >
                    <td class="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        :checked="selectedIds.has(i)"
                        class="w-3.5 h-3.5 cursor-pointer accent-accent-coral"
                        @change="toggleSelect(i)"
                      />
                    </td>
                    <td class="px-3 py-3 align-top">
                      <p class="font-medium text-text-primary leading-snug line-clamp-2">
                        {{ article.title }}
                      </p>
                    </td>
                    <td class="px-3 py-3 align-top text-xs text-text-secondary leading-relaxed">
                      {{ article.authors }}
                    </td>
                    <td class="px-3 py-3 align-top">
                      <span
                        class="bg-accent-amber/10 text-accent-amber font-display text-xs px-2 py-0.5 font-bold tracking-wide"
                      >
                        {{ article.year }}
                      </span>
                    </td>
                    <td class="px-3 py-3 align-top text-xs text-text-secondary leading-relaxed">
                      {{ article.publication }}
                    </td>
                    <td class="px-3 py-3 align-top text-right">
                      <span
                        v-if="article.citations"
                        class="text-xs font-display font-bold text-text-secondary"
                      >
                        {{ article.citations.toLocaleString() }}
                      </span>
                      <span v-else class="text-xs text-text-dim">—</span>
                    </td>
                    <td class="px-3 py-3 align-top text-center">
                      <Icon
                        v-if="article.openAccess"
                        icon="lucide:lock-open"
                        class="w-3.5 h-3.5 text-green-500 mx-auto"
                        title="Open Access"
                      />
                      <span v-else class="text-text-dim text-xs">—</span>
                    </td>
                    <td class="px-3 py-3 align-top text-center">
                      <button
                        v-if="article.abstract"
                        class="inline-flex items-center justify-center w-7 h-7 text-text-dim hover:text-accent-coral transition"
                        :title="expandedIds.has(i) ? 'Ẩn abstract' : 'Xem abstract'"
                        @click="toggleExpand(i)"
                      >
                        <Icon
                          :icon="expandedIds.has(i) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                          class="w-3.5 h-3.5"
                        />
                      </button>
                      <span v-else class="text-text-dim text-xs">—</span>
                    </td>
                    <td class="px-3 py-3 align-top text-center">
                      <a
                        v-if="article.link"
                        :href="article.link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center justify-center w-7 h-7 text-text-dim hover:text-accent-coral transition"
                      >
                        <Icon icon="lucide:external-link" class="w-3.5 h-3.5" />
                      </a>
                      <span v-else class="text-text-dim text-xs">—</span>
                    </td>
                  </tr>
                  <!-- Abstract expand row -->
                  <tr v-if="expandedIds.has(i) && article.abstract" class="border-t-0">
                    <td colspan="9" class="px-3 pb-3 pt-0">
                      <div class="border-l-2 border-accent-coral/40 pl-3 ml-3">
                        <p
                          class="text-xs text-text-secondary leading-relaxed"
                          v-html="article.abstract"
                        />
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cards — mobile -->
        <div class="sm:hidden space-y-3">
          <div
            v-for="(article, i) in articles"
            :key="i"
            class="border transition"
            :class="
              selectedIds.has(i)
                ? 'border-accent-coral bg-bg-elevated'
                : 'border-border-default bg-bg-surface hover:border-accent-coral'
            "
          >
            <!-- Checkbox header -->
            <div
              class="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border-default cursor-pointer"
              @click="toggleSelect(i)"
            >
              <input
                type="checkbox"
                :checked="selectedIds.has(i)"
                class="w-3.5 h-3.5 accent-accent-coral shrink-0"
                @click.stop
                @change="toggleSelect(i)"
              />
              <p class="font-medium text-sm leading-snug flex-1 text-text-primary">
                {{ article.title }}
              </p>
              <a
                v-if="article.link"
                :href="article.link"
                target="_blank"
                rel="noopener noreferrer"
                class="shrink-0 text-text-dim hover:text-accent-coral transition"
                @click.stop
              >
                <Icon icon="lucide:external-link" class="w-4 h-4" />
              </a>
            </div>
            <!-- body -->
            <div class="px-4 py-3 space-y-2">
              <div v-if="article.abstract" class="space-y-1">
                <button
                  class="flex items-center gap-1 text-[10px] font-display tracking-widest text-text-dim uppercase hover:text-accent-coral transition"
                  @click="toggleExpand(i)"
                >
                  <Icon
                    :icon="expandedIds.has(i) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                    class="w-3 h-3"
                  />
                  Abstract
                </button>
                <p
                  v-if="expandedIds.has(i)"
                  class="text-xs text-text-secondary leading-relaxed border-l-2 border-accent-coral/40 pl-2"
                  v-html="article.abstract"
                />
              </div>
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-border-default">
                <span
                  class="bg-accent-amber/10 text-accent-amber font-display text-xs px-2 py-0.5 font-bold tracking-wide"
                >
                  {{ article.year }}
                </span>
                <span
                  v-if="article.openAccess"
                  class="flex items-center gap-1 text-xs text-green-500"
                >
                  <Icon icon="lucide:lock-open" class="w-3 h-3" />
                  Open Access
                </span>
                <span class="text-xs text-text-secondary">{{ article.authors }}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-text-dim">
                <span>{{ article.publication }}</span>
                <span v-if="article.citations" class="flex items-center gap-1">
                  <Icon icon="lucide:quote" class="w-3 h-3" />
                  {{ article.citations.toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center font-display text-xs text-text-dim tracking-wide mt-14">
        Dữ liệu từ
        <a
          href="https://openalex.org"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accent-coral hover:underline"
          >OpenAlex</a
        >
        — kho học thuật mở với hơn 250 triệu bài báo<br />
        <span class="mt-1 block">Miễn phí · Không cần đăng ký · Không cần API key</span>
      </p>
    </div>
  </div>
</template>
