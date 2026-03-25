<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'

type JikanGenre = { mal_id: number; type?: string; name?: string }

type JikanAnime = {
  mal_id: number
  url: string
  title: string
  title_japanese?: string | null
  type?: string | null
  status?: string | null
  episodes?: number | null
  premiered?: string | null
  aired?: { from?: string | null; to?: string | null } | null
  duration?: string | null
  rating?: string | null
  score?: number | null
  popularity?: number | null
  rank?: number | null
  ranked?: number | null
  rating_count?: number | null
  images?: {
    jpg?: { image_url?: string | null }
    webp?: { image_url?: string | null } | null
  } | null
  synopsis?: string | null
  genres?: JikanGenre[] | null
}

type JikanManga = {
  url: string
  title: string
  title_japanese?: string | null
  synopsis?: string | null
  status?: string | null
  published?: { string?: string | null } | null
  chapters?: number | null
  volumes?: number | null
  score?: number | null
}

type JikanCharacter = {
  name: string
  name_kanji?: string | null
  about?: string | null
  favorites?: number | null
  url?: string
  images?: { jpg?: { image_url?: string | null } | null } | null
}

type JikanAnimeResponse<T> = { data?: T[] | null } | { data?: null }

type TranslateResponse = unknown

type AnimeInfoState = {
  title: string
  titleJapanese: string | null
  type: string | null
  status: string | null
  episodes: number | null
  premiered: string | null
  score: number | null
  rating: string | null
  genres: string[]
  synopsisVi: string
  synopsisEn: string
  imageUrl: string | null
  url: string
}

type AnimeCharState = {
  name: string
  nameKanji: string | null
  favorites: number
  aboutVi: string
  aboutEn: string
  imageUrl: string | null
  url: string | undefined
}

type AnimeRecState =
  | {
      mode: 'random'
      item: {
        title: string
        score: number | null
        episodes: number | null
        year: string | null
        url: string
        imageUrl: string | null
        reasonVi: string
      }
    }
  | {
      mode: 'genre' | 'similar'
      items: Array<{
        title: string
        score: number | null
        episodes: number | null
        year: string | null
        url: string
      }>
    }

type SeasonState = {
  total: number
  page: number
  lastPage: number
  items: JikanAnime[]
}

type MangaState = {
  title: string
  titleJapanese: string | null
  status: string | null
  published: string | null
  chapters: number | null
  volumes: number | null
  score: number | null
  synopsisVi: string
  synopsisEn: string
  url: string
}

type TabId = 'info' | 'char' | 'pic' | 'rec' | 'season' | 'manga'

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'info', label: 'Thông tin', icon: 'lucide:book-open' },
  { id: 'char', label: 'Nhân vật', icon: 'lucide:user-round' },
  { id: 'pic', label: 'Ảnh / Wallpaper', icon: 'lucide:image' },
  { id: 'rec', label: 'Gợi ý', icon: 'lucide:sparkles' },
  { id: 'season', label: 'Mùa hiện tại', icon: 'lucide:sun' },
  { id: 'manga', label: 'Manga', icon: 'lucide:scroll' },
]

const activeTab = ref<TabId>('info')

const infoQuery = ref('')
const charQuery = ref('')
const recQuery = ref('')
const mangaQuery = ref('')

const translateToVi = async (text: string): Promise<string> => {
  const input = text.trim()
  if (!input) return ''

  // Google Translate free endpoint: best-effort, truncate to avoid huge payload.
  const maxLen = 1400
  const q = input.length > maxLen ? input.slice(0, maxLen) : input

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Translate HTTP ${res.status}`)

  const json = (await res.json()) as TranslateResponse
  // Expected shape: json[0] is array of segments: [ [ translated, original, ...], ... ]
  if (!Array.isArray(json) || !Array.isArray(json[0])) return input

  const segments = json[0] as Array<unknown>
  const translated = segments
    .map((seg) => {
      if (!Array.isArray(seg)) return ''
      const part = seg[0]
      return typeof part === 'string' ? part : ''
    })
    .filter(Boolean)
    .join('')

  return translated.trim() || input
}

const stripHtml = (input: string): string => {
  if (!input) return ''
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim()
}

const getImageUrl = (images: JikanAnime['images'] | null | undefined): string | null => {
  if (!images) return null
  const jpg = images.jpg?.image_url ?? null
  if (jpg) return jpg
  const webp = images.webp?.image_url ?? null
  return webp ?? null
}

const getImageUrlOrEmpty = (images: JikanAnime['images'] | null | undefined): string =>
  getImageUrl(images) ?? ''

const formatYear = (anime: JikanAnime): string | null => {
  // Prefer `aired.from` if present.
  const from = anime.aired?.from
  if (from) return from.slice(0, 4)
  return null
}

const getCurrentSeason = (): 'winter' | 'spring' | 'summer' | 'fall' => {
  const month = new Date().getMonth() + 1
  if (month >= 1 && month <= 3) return 'winter'
  if (month >= 4 && month <= 6) return 'spring'
  if (month >= 7 && month <= 9) return 'summer'
  return 'fall'
}

const getGenreId = (genre: string): number | null => {
  // Mapping based on MAL genre IDs from cmd you provided.
  const genres: Record<string, number> = {
    action: 1,
    adventure: 2,
    cars: 3,
    comedy: 4,
    dementia: 5,
    demons: 6,
    mystery: 7,
    drama: 8,
    ecchi: 9,
    fantasy: 10,
    game: 11,
    hentai: 12,
    historical: 13,
    horror: 14,
    kids: 15,
    magic: 16,
    martialarts: 17,
    mecha: 18,
    music: 19,
    parody: 20,
    samurai: 21,
    romance: 22,
    school: 23,
    scifi: 24,
    shoujo: 25,
    shoujoai: 26,
    shounen: 27,
    shounenai: 28,
    space: 29,
    sports: 30,
    superpower: 31,
    vampire: 32,
    yaoi: 33,
    yuri: 34,
    harem: 35,
    sliceoflife: 36,
    supernatural: 37,
    military: 38,
    police: 39,
    psychological: 40,
    thriller: 41,
    seinen: 42,
    josei: 43,
  }
  return genres[genre] ?? null
}

const info = ref<AnimeInfoState | null>(null)
const infoLoading = ref(false)
const infoError = ref<string | null>(null)

const chars = ref<AnimeCharState[]>([])
const charsLoading = ref(false)
const charsError = ref<string | null>(null)

const picLoading = ref(false)
const picError = ref<string | null>(null)
const picUrl = ref<string | null>(null)
const picMode = ref<'random' | 'wall' | 'category'>('category')
const picCategory = ref('waifu')
const picKeyword = ref('')

const recLoading = ref(false)
const recError = ref<string | null>(null)
const recData = ref<AnimeRecState | null>(null)

const seasonLoading = ref(false)
const seasonError = ref<string | null>(null)
const seasonPage = ref(1)
const seasonAll = ref<JikanAnime[] | null>(null)
const seasonState = ref<SeasonState | null>(null)
const SEASON_PER_PAGE = 10

const mangaLoading = ref(false)
const mangaError = ref<string | null>(null)
const mangaData = ref<MangaState | null>(null)

const currentSeasonLabel = computed(() => {
  const season = getCurrentSeason()
  const map: Record<string, string> = {
    winter: 'Winter',
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
  }
  const year = new Date().getFullYear()
  return `${map[season]} ${year}`
})

const clearTabState = (tab: TabId) => {
  if (tab === 'info') {
    info.value = null
    infoError.value = null
  }
  if (tab === 'char') {
    chars.value = []
    charsError.value = null
  }
  if (tab === 'pic') {
    picUrl.value = null
    picError.value = null
  }
  if (tab === 'rec') {
    recData.value = null
    recError.value = null
  }
  if (tab === 'season') {
    seasonAll.value = null
    seasonState.value = null
    seasonError.value = null
    seasonPage.value = 1
  }
  if (tab === 'manga') {
    mangaData.value = null
    mangaError.value = null
  }
}

async function translateBestEffort(text: string, fallback = ''): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return fallback
  try {
    return await translateToVi(trimmed)
  } catch {
    return trimmed || fallback
  }
}

const fetchAnimeInfo = async (query: string) => {
  infoLoading.value = true
  infoError.value = null
  info.value = null

  const q = query.trim()
  if (q.length < 2) {
    infoError.value = 'Vui lòng nhập tên anime (ít nhất 2 ký tự).'
    infoLoading.value = false
    return
  }

  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = (await res.json()) as JikanAnimeResponse<JikanAnime>
    const anime = json.data?.[0]
    if (!anime) throw new Error('Không tìm thấy anime này.')

    const synopsisEn = stripHtml(anime.synopsis ?? '')
    const synopsisVi = await translateBestEffort(synopsisEn, synopsisEn || 'Không có mô tả.')

    info.value = {
      title: anime.title ?? q,
      titleJapanese: anime.title_japanese ?? null,
      type: anime.type ?? null,
      status: anime.status ?? null,
      episodes: anime.episodes ?? null,
      premiered: anime.premiered ?? null,
      score: anime.score ?? null,
      rating: anime.rating ?? null,
      genres: anime.genres?.map((g) => g.name ?? '').filter(Boolean) ?? [],
      synopsisVi,
      synopsisEn: synopsisEn || 'Không có mô tả.',
      imageUrl: getImageUrl(anime.images),
      url: anime.url,
    }
  } catch (e) {
    infoError.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra.'
  } finally {
    infoLoading.value = false
  }
}

const fetchAnimeChars = async (query: string) => {
  charsLoading.value = true
  charsError.value = null
  chars.value = []

  const q = query.trim()
  if (!q) {
    charsError.value = 'Vui lòng nhập tên nhân vật cần tìm.'
    charsLoading.value = false
    return
  }

  try {
    const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=5`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = (await res.json()) as JikanAnimeResponse<JikanCharacter>
    const list = json.data ?? []
    if (!list.length) throw new Error('Không tìm thấy nhân vật.')

    const mapped: AnimeCharState[] = []
    for (const item of list) {
      const aboutEn = stripHtml((item.about ?? '') as string)
      const aboutVi = await translateBestEffort(aboutEn, aboutEn || 'Không có thông tin.')
      mapped.push({
        name: item.name,
        nameKanji: item.name_kanji ?? null,
        favorites: item.favorites ?? 0,
        aboutEn: aboutEn || 'Không có thông tin.',
        aboutVi,
        imageUrl: item.images?.jpg?.image_url ?? null,
        url: item.url,
      })
    }

    chars.value = mapped
  } catch (e) {
    charsError.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra.'
  } finally {
    charsLoading.value = false
  }
}

const categories = [
  { key: 'waifu', label: 'Waifu' },
  { key: 'neko', label: 'Neko' },
  { key: 'shinobu', label: 'Shinobu' },
  { key: 'megumin', label: 'Megumin' },
  { key: 'best', label: 'Best' },
  { key: 'random', label: 'Random' },
]

const picModes: Array<{ key: typeof picMode.value; label: string }> = [
  { key: 'category', label: 'SFW category' },
  { key: 'random', label: 'Random SFW' },
  { key: 'wall', label: 'Wallpaper (Zerochan)' },
]

const setPicMode = (mode: typeof picMode.value) => {
  picMode.value = mode
}

const fetchAnimePics = async () => {
  picLoading.value = true
  picError.value = null
  picUrl.value = null

  try {
    if (picMode.value === 'wall') {
      const keyword = picKeyword.value.trim()
      const q = keyword || 'anime'
      // best-effort scrape zerochan HTML (may be blocked by CORS).
      const res = await fetch(`https://www.zerochan.net/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()

      const imageUrls = html.match(/https:\/\/static\.zerochan\.net\/[^"]+\.full\.[^"]+/g) ?? []
      if (!imageUrls.length) throw new Error('Không tìm thấy wallpaper phù hợp.')

      const pick = imageUrls[Math.floor(Math.random() * imageUrls.length)]
      picUrl.value = pick
      return
    }

    if (picMode.value === 'random') {
      // Pick a random SFW category from waifu.pics.
      const pick = categories[Math.floor(Math.random() * (categories.length - 1))]?.key ?? 'waifu'
      const url = `https://api.waifu.pics/sfw/${encodeURIComponent(pick)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { url?: string }
      if (!json.url) throw new Error('Không tìm thấy ảnh.')
      picUrl.value = json.url
      return
    }

    const category = picCategory.value
    const url = `https://api.waifu.pics/sfw/${encodeURIComponent(category)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { url?: string }
    if (!json.url) throw new Error('Không tìm thấy ảnh.')
    picUrl.value = json.url
  } catch (e) {
    picError.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra.'
  } finally {
    picLoading.value = false
  }
}

async function fetchJikanAnimeByGenres(genreId: number): Promise<JikanAnime[]> {
  const url = `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=score&sort=desc&limit=5`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as JikanAnimeResponse<JikanAnime>
  return json.data ?? []
}

const fetchAnimeRec = async (query: string) => {
  recLoading.value = true
  recError.value = null
  recData.value = null

  const q = query.trim()
  try {
    if (!q) {
      const url = 'https://api.jikan.moe/v4/recommendations/anime'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = (await res.json()) as unknown as {
        data?: Array<{ content?: string; entry?: JikanAnime[] | null }> | null
      }

      const data = json.data ?? []
      if (!data.length) throw new Error('Không có gợi ý.')

      // Cmd version picks one entry + random anime. Here we keep the same idea.
      const randomRec = data[Math.floor(Math.random() * data.length)]
      const entry = (randomRec.entry ?? []) as unknown as JikanAnime[]
      if (!entry.length) throw new Error('Không có dữ liệu gợi ý.')

      const randomAnime = entry[Math.floor(Math.random() * entry.length)]
      const reasonEn = (randomRec.content ?? '').slice(0, 700) || ''
      const reasonVi = await translateBestEffort(
        stripHtml(reasonEn),
        'Gợi ý dựa trên sở thích tương tự.',
      )

      recData.value = {
        mode: 'random',
        item: {
          title: randomAnime.title,
          score: randomAnime.score ?? null,
          episodes: randomAnime.episodes ?? null,
          year: formatYear(randomAnime),
          url: randomAnime.url,
          imageUrl: getImageUrl(randomAnime.images),
          reasonVi,
        },
      }
      return
    }

    if (q.length < 10) {
      const genreId = getGenreId(q.toLowerCase().replace(/\\s+/g, ''))
      if (!genreId) throw new Error('Thể loại không hợp lệ.')

      const items = await fetchJikanAnimeByGenres(genreId)
      if (!items.length) throw new Error('Không tìm thấy anime nào thuộc thể loại.')

      recData.value = {
        mode: 'genre',
        items: items.map((a) => ({
          title: a.title,
          score: a.score ?? null,
          episodes: a.episodes ?? null,
          year: formatYear(a),
          url: a.url,
        })),
      }
      return
    }

    // Similar anime flow (like your cmd version)
    const searchUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&order_by=score&sort=desc&limit=1`
    const searchRes = await fetch(searchUrl)
    if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`)
    const searchJson = (await searchRes.json()) as JikanAnimeResponse<JikanAnime>
    const selectedAnime = searchJson.data?.[0]
    if (!selectedAnime) throw new Error(`Không tìm thấy anime "${q}".`)

    const genres = (selectedAnime.genres ?? []).map((g) => g.mal_id).join(',')
    if (!genres) throw new Error('Không lấy được thể loại để tìm anime tương tự.')

    const similarUrl = `https://api.jikan.moe/v4/anime?genres=${genres}&order_by=score&sort=desc&limit=10`
    const similarRes = await fetch(similarUrl)
    if (!similarRes.ok) throw new Error(`HTTP ${similarRes.status}`)
    const similarJson = (await similarRes.json()) as JikanAnimeResponse<JikanAnime>

    const recommendations = (similarJson.data ?? [])
      .filter((a) => a.mal_id !== selectedAnime.mal_id)
      .slice(0, 5)

    if (!recommendations.length) throw new Error('Không tìm thấy anime tương tự.')

    recData.value = {
      mode: 'similar',
      items: recommendations.map((a) => ({
        title: a.title,
        score: a.score ?? null,
        episodes: a.episodes ?? null,
        year: formatYear(a),
        url: a.url,
      })),
    }
  } catch (e) {
    recError.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra.'
  } finally {
    recLoading.value = false
  }
}

const fetchSeason = async (page: number) => {
  seasonLoading.value = true
  seasonError.value = null
  seasonState.value = null

  const pageNum = Math.max(1, page)

  try {
    if (!seasonAll.value) {
      const season = getCurrentSeason()
      const year = new Date().getFullYear()
      const url = `https://api.jikan.moe/v4/seasons/${year}/${season}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = (await res.json()) as {
        data?: { data?: JikanAnime[] } | { data?: JikanAnime[] } | JikanAnime[] | null
      }
      // Jikan v4 returns: { data: [anime...] }
      const list = (json as { data?: JikanAnime[] }).data ?? []
      if (!list.length) throw new Error('Không tìm thấy dữ liệu anime.')
      seasonAll.value = list
    }

    const all = seasonAll.value ?? []
    const total = all.length
    const lastPage = Math.max(1, Math.ceil(total / SEASON_PER_PAGE))

    if (pageNum < 1 || pageNum > lastPage) {
      throw new Error(`Trang phải từ 1 đến ${lastPage}.`)
    }

    const start = (pageNum - 1) * SEASON_PER_PAGE
    const items = all.slice(start, start + SEASON_PER_PAGE)

    seasonState.value = {
      total,
      page: pageNum,
      lastPage,
      items,
    }
  } catch (e) {
    seasonError.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra.'
  } finally {
    seasonLoading.value = false
  }
}

const refreshSeason = async () => {
  seasonPage.value = 1
  seasonAll.value = null
  await fetchSeason(1)
}

const prevSeasonPage = async () => {
  if (!seasonState.value) return
  const next = seasonState.value.page - 1
  if (next < 1) return
  seasonPage.value = next
  await fetchSeason(next)
}

const nextSeasonPage = async () => {
  if (!seasonState.value) return
  const next = seasonState.value.page + 1
  if (next > seasonState.value.lastPage) return
  seasonPage.value = next
  await fetchSeason(next)
}

const fetchMangaInfo = async (query: string) => {
  mangaLoading.value = true
  mangaError.value = null
  mangaData.value = null

  const q = query.trim()
  if (!q) {
    mangaError.value = 'Vui lòng nhập tên manga cần tìm!'
    mangaLoading.value = false
    return
  }

  try {
    const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=1`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as JikanAnimeResponse<JikanManga>
    const manga = json.data?.[0]
    if (!manga) throw new Error('Không tìm thấy thông tin manga!')

    const synopsisEn = stripHtml(manga.synopsis ?? '')
    const synopsisVi = await translateBestEffort(synopsisEn, synopsisEn || 'Không có mô tả.')

    mangaData.value = {
      title: manga.title,
      titleJapanese: manga.title_japanese ?? null,
      status: manga.status ?? null,
      published: manga.published?.string ?? null,
      chapters: manga.chapters ?? null,
      volumes: manga.volumes ?? null,
      score: manga.score ?? null,
      synopsisEn: synopsisEn || 'Không có mô tả.',
      synopsisVi,
      url: manga.url,
    }
  } catch (e) {
    mangaError.value = e instanceof Error ? e.message : 'Đã có lỗi xảy ra.'
  } finally {
    mangaLoading.value = false
  }
}

const onTabClick = (tab: TabId) => {
  activeTab.value = tab
  clearTabState(tab)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <header
      class="border-b border-border-default bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-10"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <h1 class="font-display text-lg sm:text-xl font-bold text-text-primary truncate">
            <span class="text-accent-coral">//</span> Anime Wiki
          </h1>
          <span class="hidden sm:inline text-text-dim text-xs font-display tracking-wide">
            Gói tính năng: info, nhân vật, ảnh, gợi ý, mùa, manga
          </span>
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-1.5 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <!-- Tabs -->
      <div class="flex flex-wrap gap-2 mb-6 animate-fade-up">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="border border-border-default bg-bg-surface px-3 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          :class="
            t.id === activeTab ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' : ''
          "
          @click="onTabClick(t.id)"
        >
          <span class="inline-flex items-center gap-2">
            <Icon :icon="t.icon" class="size-4" />
            {{ t.label }}
          </span>
        </button>
      </div>

      <!-- Info -->
      <section v-if="activeTab === 'info'" class="animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-4 sm:p-6">
          <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="fetchAnimeInfo(infoQuery)">
            <input
              v-model="infoQuery"
              type="text"
              placeholder="Tìm anime... (ví dụ: One Piece)"
              class="flex-1 border border-border-default bg-bg-deep/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
            />
            <button
              type="submit"
              class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :disabled="infoLoading"
            >
              <span class="inline-flex items-center gap-2">
                <Icon icon="lucide:search" class="size-4" />
                Tìm
              </span>
            </button>
          </form>

          <div
            v-if="infoLoading"
            class="mt-6 grid gap-4 sm:grid-cols-[220px_1fr] items-start animate-pulse"
          >
            <div>
              <div class="w-full aspect-[2/3] border border-border-default bg-bg-elevated" />
            </div>

            <div class="space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="h-8 w-full bg-bg-deep/20 border border-border-default" />
                  <div class="mt-3 flex flex-wrap gap-2">
                    <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                    <div class="h-4 w-32 bg-bg-deep/20 border border-border-default" />
                    <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                    <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                  </div>
                </div>

                <div class="shrink-0 w-32 h-10 bg-bg-deep/20 border border-border-default" />
              </div>

              <div class="flex flex-wrap gap-2">
                <div class="h-5 w-20 bg-bg-deep/20 border border-border-default" />
                <div class="h-5 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="h-5 w-16 bg-bg-deep/20 border border-border-default" />
              </div>

              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-28 bg-bg-deep/20 border border-border-default" />
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                <div class="border border-border-default bg-bg-elevated p-3">
                  <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
                </div>
                <div class="border border-border-default bg-bg-elevated p-3">
                  <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="infoError"
            class="mt-4 border border-accent-coral/30 bg-accent-coral/10 p-3 text-sm text-accent-coral"
          >
            {{ infoError }}
          </div>

          <div v-else-if="info" class="mt-6 grid gap-4 sm:grid-cols-[220px_1fr] items-start">
            <div>
              <img
                v-if="info.imageUrl"
                :src="info.imageUrl"
                :alt="info.title"
                class="w-full aspect-[2/3] object-cover border border-border-default bg-bg-elevated"
              />
              <div
                v-else
                class="w-full aspect-[2/3] border border-border-default bg-bg-elevated flex items-center justify-center text-text-dim text-xs"
              >
                Không có ảnh
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div class="min-w-0">
                  <h2
                    class="font-display text-2xl font-semibold text-text-primary leading-tight break-words"
                  >
                    {{ info.title }}
                    <span
                      v-if="info.titleJapanese"
                      class="text-text-dim text-xs font-display tracking-wide ml-2"
                    >
                      ({{ info.titleJapanese }})
                    </span>
                  </h2>
                  <div
                    class="mt-2 text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3 gap-y-1"
                  >
                    <span
                      ><span class="text-accent-amber font-display">//</span>
                      {{ info.type || '—' }}</span
                    >
                    <span>Trạng thái: {{ info.status || '—' }}</span>
                    <span>Khởi chiếu: {{ info.premiered || '—' }}</span>
                    <span>Số tập: {{ info.episodes ?? '—' }}</span>
                  </div>
                </div>

                <a
                  :href="info.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary shrink-0"
                >
                  Xem trên Jikan
                  <Icon icon="lucide:external-link" class="size-4" />
                </a>
              </div>

              <div v-if="info.genres.length" class="flex flex-wrap gap-2">
                <span
                  v-for="g in info.genres"
                  :key="g"
                  class="border border-text-primary/20 bg-bg-deep/20 px-2 py-0.5 text-[10px] text-text-secondary"
                >
                  {{ g }}
                </span>
              </div>

              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="text-xs text-text-dim font-display tracking-wide">
                  <span class="text-accent-coral font-display">//</span> Nội dung
                </div>
                <p class="mt-2 text-sm text-text-secondary whitespace-pre-line">
                  {{ info.synopsisVi || info.synopsisEn }}
                </p>
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                <div class="border border-border-default bg-bg-elevated p-3">
                  <div class="text-xs text-text-dim font-display tracking-wide">// Điểm số</div>
                  <div class="mt-1 font-display text-lg text-accent-amber">
                    {{ info.score ?? '—' }}
                  </div>
                </div>
                <div class="border border-border-default bg-bg-elevated p-3">
                  <div class="text-xs text-text-dim font-display tracking-wide">// Độ tuổi</div>
                  <div class="mt-1 font-display text-lg text-accent-coral">
                    {{ info.rating || '—' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="mt-6 grid gap-4 sm:grid-cols-[220px_1fr] items-start animate-pulse">
            <div>
              <div class="w-full aspect-[2/3] border border-border-default bg-bg-elevated" />
            </div>

            <div class="space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="h-8 w-full bg-bg-deep/20 border border-border-default" />
                  <div class="mt-3 flex flex-wrap gap-2">
                    <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                    <div class="h-4 w-32 bg-bg-deep/20 border border-border-default" />
                    <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                    <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                  </div>
                </div>
                <div class="shrink-0 w-32 h-10 bg-bg-deep/20 border border-border-default" />
              </div>

              <div class="flex flex-wrap gap-2">
                <div class="h-5 w-20 bg-bg-deep/20 border border-border-default" />
                <div class="h-5 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="h-5 w-16 bg-bg-deep/20 border border-border-default" />
              </div>

              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-28 bg-bg-deep/20 border border-border-default" />
              </div>

              <div class="grid sm:grid-cols-2 gap-3">
                <div class="border border-border-default bg-bg-elevated p-3">
                  <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
                </div>
                <div class="border border-border-default bg-bg-elevated p-3">
                  <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Characters -->
      <section v-else-if="activeTab === 'char'" class="animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-4 sm:p-6">
          <form
            class="flex flex-col sm:flex-row gap-2"
            @submit.prevent="fetchAnimeChars(charQuery)"
          >
            <input
              v-model="charQuery"
              type="text"
              placeholder="Tìm nhân vật... (ví dụ: Ryuk)"
              class="flex-1 border border-border-default bg-bg-deep/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
            />
            <button
              type="submit"
              class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :disabled="charsLoading"
            >
              <span class="inline-flex items-center gap-2">
                <Icon icon="lucide:search" class="size-4" />
                Tìm
              </span>
            </button>
          </form>

          <div
            v-if="charsLoading"
            class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="border border-border-default bg-bg-elevated p-4 space-y-3"
            >
              <div class="flex items-start gap-3">
                <div class="w-16 h-24 border border-border-default bg-bg-deep/20" />
                <div class="min-w-0 flex-1">
                  <div class="h-4 w-3/4 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-3 w-2/3 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-3 w-1/2 bg-bg-deep/20 border border-border-default" />
                </div>
              </div>
              <div class="h-24 bg-bg-deep/20 border border-border-default" />
            </div>
          </div>

          <div
            v-else-if="charsError"
            class="mt-4 border border-accent-coral/30 bg-accent-coral/10 p-3 text-sm text-accent-coral"
          >
            {{ charsError }}
          </div>

          <div v-else-if="chars.length" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="c in chars"
              :key="c.name"
              class="border border-border-default bg-bg-elevated p-4"
            >
              <div class="flex items-start gap-3">
                <img
                  v-if="c.imageUrl"
                  :src="c.imageUrl"
                  :alt="c.name"
                  class="w-16 h-24 object-cover border border-border-default bg-bg-deep/10"
                />
                <div
                  v-else
                  class="w-16 h-24 border border-border-default bg-bg-deep/10 flex items-center justify-center text-text-dim text-xs"
                >
                  ?
                </div>
                <div class="min-w-0">
                  <div class="font-display text-lg font-semibold text-text-primary truncate">
                    {{ c.name }}
                  </div>
                  <div
                    v-if="c.nameKanji"
                    class="text-xs text-text-dim font-display tracking-wide mt-1"
                  >
                    {{ c.nameKanji }}
                  </div>
                  <div class="text-xs text-text-dim font-display tracking-wide mt-2">
                    <span class="text-accent-amber">//</span> Lượt yêu thích: {{ c.favorites }}
                  </div>
                </div>
              </div>
              <div class="mt-3 text-sm text-text-secondary whitespace-pre-line line-clamp-5">
                {{ c.aboutVi || c.aboutEn }}
              </div>

              <a
                v-if="c.url"
                :href="c.url"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 inline-flex items-center gap-2 text-xs text-accent-sky link-underline"
              >
                Chi tiết
                <Icon icon="lucide:external-link" class="size-4" />
              </a>
            </div>
          </div>

          <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
            <div
              v-for="n in 6"
              :key="n"
              class="border border-border-default bg-bg-elevated p-4 space-y-3"
            >
              <div class="flex items-start gap-3">
                <div class="w-16 h-24 border border-border-default bg-bg-deep/20" />
                <div class="min-w-0 flex-1">
                  <div class="h-4 w-3/4 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-3 w-2/3 bg-bg-deep/20 border border-border-default" />
                  <div class="mt-2 h-3 w-1/2 bg-bg-deep/20 border border-border-default" />
                </div>
              </div>
              <div class="h-24 bg-bg-deep/20 border border-border-default" />
            </div>
          </div>
        </div>
      </section>

      <!-- Pics -->
      <section v-else-if="activeTab === 'pic'" class="animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-4 sm:p-6 space-y-5">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="m in picModes"
              :key="m.key"
              type="button"
              class="border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :class="
                m.key === picMode ? 'border-accent-coral bg-accent-coral/10 text-accent-coral' : ''
              "
              @click="setPicMode(m.key)"
            >
              {{ m.label }}
            </button>
          </div>

          <form
            v-if="picMode === 'category'"
            class="flex flex-col sm:flex-row gap-2"
            @submit.prevent="fetchAnimePics"
          >
            <select
              v-model="picCategory"
              class="border border-border-default bg-bg-deep/10 px-3 py-2 text-sm text-text-secondary outline-none transition focus:border-accent-coral"
            >
              <option v-for="c in categories" :key="c.key" :value="c.key">
                {{ c.label }}
              </option>
            </select>
            <button
              type="submit"
              class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :disabled="picLoading"
            >
              <span class="inline-flex items-center gap-2">
                <Icon icon="lucide:image-search" class="size-4" />
                Lấy ảnh
              </span>
            </button>
          </form>

          <form
            v-else-if="picMode === 'random'"
            class="flex flex-col sm:flex-row gap-2"
            @submit.prevent="fetchAnimePics"
          >
            <button
              type="submit"
              class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :disabled="picLoading"
            >
              <span class="inline-flex items-center gap-2">
                <Icon icon="lucide:shuffle" class="size-4" />
                Random
              </span>
            </button>
          </form>

          <form v-else class="flex flex-col sm:flex-row gap-2" @submit.prevent="fetchAnimePics">
            <input
              v-model="picKeyword"
              type="text"
              placeholder="Từ khóa wallpaper... (ví dụ: waifu, anime, girl)"
              class="flex-1 border border-border-default bg-bg-deep/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
            />
            <button
              type="submit"
              class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :disabled="picLoading"
            >
              <span class="inline-flex items-center gap-2">
                <Icon icon="lucide:search" class="size-4" />
                Lấy wallpaper
              </span>
            </button>
          </form>

          <div v-if="picLoading" class="mt-4 space-y-3 animate-pulse">
            <div class="text-xs text-text-dim font-display tracking-wide">
              <span class="text-accent-coral">//</span> Kết quả
            </div>
            <div
              class="w-full max-h-[70vh] aspect-[16/10] border border-border-default bg-bg-elevated"
            />
            <div class="flex flex-wrap gap-2">
              <div class="h-9 w-28 border border-border-default bg-bg-deep/20" />
              <div class="h-9 w-24 border border-border-default bg-bg-deep/20" />
            </div>
          </div>
          <div
            v-else-if="picError"
            class="border border-accent-coral/30 bg-accent-coral/10 p-3 text-sm text-accent-coral"
          >
            {{ picError }}
          </div>

          <div v-else-if="picUrl" class="space-y-3">
            <div class="text-xs text-text-dim font-display tracking-wide">
              <span class="text-accent-coral">//</span> Kết quả
            </div>
            <img
              :src="picUrl"
              alt="Anime pic"
              class="w-full max-h-[70vh] object-contain border border-border-default bg-bg-elevated"
            />
            <div class="flex flex-wrap gap-2">
              <a
                :href="picUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              >
                Mở ảnh
                <Icon icon="lucide:external-link" class="size-4" />
              </a>
              <button
                type="button"
                class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="window.open(picUrl ?? '_self', '_blank')"
              >
                Tải về
              </button>
            </div>
          </div>

          <div v-else class="mt-4 space-y-3 animate-pulse">
            <div class="text-xs text-text-dim font-display tracking-wide">
              <span class="text-accent-coral">//</span> Kết quả
            </div>
            <div
              class="w-full max-h-[70vh] aspect-[16/10] border border-border-default bg-bg-elevated"
            />
            <div class="flex flex-wrap gap-2">
              <div class="h-9 w-28 border border-border-default bg-bg-deep/20" />
              <div class="h-9 w-24 border border-border-default bg-bg-deep/20" />
            </div>
          </div>
        </div>
      </section>

      <!-- Recommendations -->
      <section v-else-if="activeTab === 'rec'" class="animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-4 sm:p-6">
          <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="fetchAnimeRec(recQuery)">
            <input
              v-model="recQuery"
              type="text"
              placeholder="Gợi ý: nhập thể loại (ngắn) hoặc tên anime (dài). Trống = random."
              class="flex-1 border border-border-default bg-bg-deep/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
            />
            <button
              type="submit"
              class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :disabled="recLoading"
            >
              <span class="inline-flex items-center gap-2">
                <Icon icon="lucide:sparkles" class="size-4" />
                Gợi ý
              </span>
            </button>
          </form>

          <div
            v-if="recLoading"
            class="mt-6 grid gap-4 sm:grid-cols-[220px_1fr] items-start animate-pulse"
          >
            <div>
              <div class="w-full aspect-[2/3] border border-border-default bg-bg-elevated" />
            </div>
            <div class="space-y-3">
              <div class="h-9 w-4/5 bg-bg-deep/20 border border-border-default" />
              <div class="flex flex-wrap gap-x-3 gap-y-2">
                <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
              </div>
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-28 bg-bg-deep/20 border border-border-default" />
              </div>
              <div class="h-9 w-40 border border-border-default bg-bg-deep/20" />
            </div>
          </div>
          <div
            v-else-if="recError"
            class="mt-4 border border-accent-coral/30 bg-accent-coral/10 p-3 text-sm text-accent-coral"
          >
            {{ recError }}
          </div>

          <div v-else-if="recData" class="mt-6">
            <div
              v-if="recData.mode === 'random'"
              class="grid gap-4 sm:grid-cols-[220px_1fr] items-start"
            >
              <div>
                <img
                  v-if="recData.item.imageUrl"
                  :src="recData.item.imageUrl"
                  :alt="recData.item.title"
                  class="w-full aspect-[2/3] object-cover border border-border-default bg-bg-elevated"
                />
              </div>
              <div class="space-y-3">
                <h2 class="font-display text-2xl font-semibold text-accent-coral">
                  {{ recData.item.title }}
                </h2>
                <div
                  class="text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3 gap-y-1"
                >
                  <span>Điểm: {{ recData.item.score ?? '—' }}/10</span>
                  <span>Tập: {{ recData.item.episodes ?? '—' }}</span>
                  <span>Year: {{ recData.item.year ?? '—' }}</span>
                </div>
                <div class="border border-border-default bg-bg-elevated p-3">
                  <div class="text-xs text-text-dim font-display tracking-wide">// Lý do</div>
                  <p class="mt-2 text-sm text-text-secondary whitespace-pre-line">
                    {{ recData.item.reasonVi }}
                  </p>
                </div>
                <a
                  :href="recData.item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                >
                  Xem chi tiết
                  <Icon icon="lucide:external-link" class="size-4" />
                </a>
              </div>
            </div>

            <div v-else>
              <div class="text-xs text-text-dim font-display tracking-wide mb-3">
                <span class="text-accent-coral">//</span> Danh sách gợi ý
              </div>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="it in recData.items"
                  :key="it.url"
                  class="border border-border-default bg-bg-elevated p-4"
                >
                  <a
                    :href="it.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-display text-lg font-semibold text-text-primary hover:text-accent-coral transition"
                  >
                    {{ it.title }}
                  </a>
                  <div
                    class="mt-2 text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3 gap-y-1"
                  >
                    <span>Điểm: {{ it.score ?? '—' }}/10</span>
                    <span>Tập: {{ it.episodes ?? '—' }}</span>
                    <span>Year: {{ it.year ?? '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="mt-6 grid gap-4 sm:grid-cols-[220px_1fr] items-start animate-pulse">
            <div>
              <div class="w-full aspect-[2/3] border border-border-default bg-bg-elevated" />
            </div>
            <div class="space-y-3">
              <div class="h-9 w-4/5 bg-bg-deep/20 border border-border-default" />
              <div class="flex flex-wrap gap-x-3 gap-y-2">
                <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
              </div>
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-28 bg-bg-deep/20 border border-border-default" />
              </div>
              <div class="h-9 w-40 border border-border-default bg-bg-deep/20" />
            </div>
          </div>
        </div>
      </section>

      <!-- Season -->
      <section v-else-if="activeTab === 'season'" class="animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-4 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div class="text-xs text-text-dim font-display tracking-wide">
                <span class="text-accent-coral">//</span> Mùa hiện tại
              </div>
              <div class="font-display text-2xl font-semibold text-text-primary">
                {{ currentSeasonLabel }}
              </div>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                :disabled="seasonLoading"
                @click="refreshSeason"
              >
                Làm mới
              </button>
            </div>
          </div>

          <div v-if="seasonLoading" class="space-y-4 animate-pulse">
            <div class="text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3">
              <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
              <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
            </div>
            <div class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="n in 6"
                :key="n"
                class="group border border-border-default bg-bg-elevated p-4"
              >
                <div class="flex gap-3 items-start">
                  <div class="w-14 h-20 border border-border-default bg-bg-deep/20" />
                  <div class="min-w-0 flex-1">
                    <div class="h-4 w-4/5 bg-bg-deep/20 border border-border-default" />
                    <div class="mt-2 h-4 w-2/3 bg-bg-deep/20 border border-border-default" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="seasonError"
            class="border border-accent-coral/30 bg-accent-coral/10 p-3 text-sm text-accent-coral"
          >
            {{ seasonError }}
          </div>

          <div v-else-if="seasonState" class="space-y-4">
            <div class="text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3">
              <span>{{ seasonState.total }} kết quả</span>
              <span>Trang {{ seasonState.page }} / {{ seasonState.lastPage }}</span>
            </div>

            <div class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                v-for="a in seasonState.items"
                :key="a.mal_id"
                :href="a.url"
                target="_blank"
                rel="noopener noreferrer"
                class="group border border-border-default bg-bg-elevated p-4 transition hover:border-accent-coral hover:-translate-y-1 hover:shadow-accent-coral/10"
              >
                <div class="flex gap-3 items-start">
                  <img
                    v-if="getImageUrlOrEmpty(a.images)"
                    :src="getImageUrlOrEmpty(a.images)"
                    :alt="a.title"
                    class="w-14 h-20 object-cover border border-border-default bg-bg-deep/10"
                    loading="lazy"
                  />
                  <div class="min-w-0">
                    <div
                      class="font-display text-base font-semibold text-text-primary line-clamp-2"
                    >
                      {{ a.title }}
                    </div>
                    <div
                      class="mt-2 text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3 gap-y-1"
                    >
                      <span>Điểm: {{ a.score ?? '—' }}/10</span>
                      <span>Tập: {{ a.episodes ?? '—' }}</span>
                      <span>Year: {{ formatYear(a) ?? '—' }}</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>

            <nav
              v-if="seasonState.lastPage > 1"
              class="flex items-center justify-center gap-2 flex-wrap"
            >
              <button
                type="button"
                class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="seasonState.page <= 1"
                @click="prevSeasonPage"
              >
                &larr; Trước
              </button>
              <button
                type="button"
                class="border border-border-default bg-bg-surface px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="seasonState.page >= seasonState.lastPage"
                @click="nextSeasonPage"
              >
                Sau &rarr;
              </button>
            </nav>
          </div>

          <div v-else class="space-y-4 animate-pulse">
            <div class="text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3">
              <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
              <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
            </div>
            <div class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="n in 6"
                :key="n"
                class="group border border-border-default bg-bg-elevated p-4"
              >
                <div class="flex gap-3 items-start">
                  <div class="w-14 h-20 border border-border-default bg-bg-deep/20" />
                  <div class="min-w-0 flex-1">
                    <div class="h-4 w-4/5 bg-bg-deep/20 border border-border-default" />
                    <div class="mt-2 h-4 w-2/3 bg-bg-deep/20 border border-border-default" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Manga -->
      <section v-else-if="activeTab === 'manga'" class="animate-fade-up animate-delay-1">
        <div class="border border-border-default bg-bg-surface p-4 sm:p-6">
          <form
            class="flex flex-col sm:flex-row gap-2"
            @submit.prevent="fetchMangaInfo(mangaQuery)"
          >
            <input
              v-model="mangaQuery"
              type="text"
              placeholder="Tìm manga... (ví dụ: Berserk)"
              class="flex-1 border border-border-default bg-bg-deep/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none transition focus:border-accent-coral"
            />
            <button
              type="submit"
              class="border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              :disabled="mangaLoading"
            >
              <span class="inline-flex items-center gap-2">
                <Icon icon="lucide:search" class="size-4" />
                Tìm
              </span>
            </button>
          </form>

          <div v-if="mangaLoading" class="mt-6 space-y-4 animate-pulse">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="h-9 w-4/5 bg-bg-deep/20 border border-border-default" />
                <div class="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                  <div class="h-4 w-32 bg-bg-deep/20 border border-border-default" />
                  <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                  <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                  <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                </div>
              </div>
              <div class="shrink-0 w-32 h-10 bg-bg-deep/20 border border-border-default" />
            </div>

            <div class="border border-border-default bg-bg-elevated p-4 sm:p-5">
              <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
              <div class="mt-3 h-28 bg-bg-deep/20 border border-border-default" />
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
              </div>
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
              </div>
            </div>
          </div>
          <div
            v-else-if="mangaError"
            class="mt-4 border border-accent-coral/30 bg-accent-coral/10 p-3 text-sm text-accent-coral"
          >
            {{ mangaError }}
          </div>

          <div v-else-if="mangaData" class="mt-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div class="min-w-0">
                <h2
                  class="font-display text-2xl font-semibold text-text-primary leading-tight break-words"
                >
                  {{ mangaData.title }}
                  <span
                    v-if="mangaData.titleJapanese"
                    class="text-text-dim text-xs font-display tracking-wide ml-2"
                  >
                    ({{ mangaData.titleJapanese }})
                  </span>
                </h2>
                <div
                  class="mt-2 text-xs text-text-dim font-display tracking-wide flex flex-wrap gap-x-3 gap-y-1"
                >
                  <span>Trạng thái: {{ mangaData.status || '—' }}</span>
                  <span>Published: {{ mangaData.published || '—' }}</span>
                  <span>Chapters: {{ mangaData.chapters ?? '—' }}</span>
                  <span>Volumes: {{ mangaData.volumes ?? '—' }}</span>
                </div>
              </div>
              <a
                :href="mangaData.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-2 text-xs sm:text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary shrink-0"
              >
                Xem chi tiết
                <Icon icon="lucide:external-link" class="size-4" />
              </a>
            </div>

            <div class="border border-border-default bg-bg-elevated p-4 sm:p-5">
              <div class="text-xs text-text-dim font-display tracking-wide">
                <span class="text-accent-coral">//</span> Nội dung
              </div>
              <p class="mt-3 text-sm text-text-secondary whitespace-pre-line">
                {{ mangaData.synopsisVi || mangaData.synopsisEn }}
              </p>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="text-xs text-text-dim font-display tracking-wide">// Điểm số</div>
                <div class="mt-1 font-display text-lg text-accent-amber">
                  {{ mangaData.score ?? '—' }}
                </div>
              </div>
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="text-xs text-text-dim font-display tracking-wide">// Điểm /10</div>
                <div class="mt-1 font-display text-lg text-accent-coral">
                  {{ mangaData.score ?? '—' }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="mt-6 space-y-4 animate-pulse">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="h-9 w-4/5 bg-bg-deep/20 border border-border-default" />
                <div class="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                  <div class="h-4 w-32 bg-bg-deep/20 border border-border-default" />
                  <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                  <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                  <div class="h-4 w-20 bg-bg-deep/20 border border-border-default" />
                </div>
              </div>
              <div class="shrink-0 w-32 h-10 bg-bg-deep/20 border border-border-default" />
            </div>

            <div class="border border-border-default bg-bg-elevated p-4 sm:p-5">
              <div class="h-4 w-24 bg-bg-deep/20 border border-border-default" />
              <div class="mt-3 h-28 bg-bg-deep/20 border border-border-default" />
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
              </div>
              <div class="border border-border-default bg-bg-elevated p-3">
                <div class="h-4 w-28 bg-bg-deep/20 border border-border-default" />
                <div class="mt-2 h-7 w-16 bg-bg-deep/20 border border-border-default" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
