import { ref, reactive, computed, watch } from 'vue'
import type {
  League,
  Match,
  MatchEvent,
  MatchDetail,
  TeamDetail,
  TeamStats,
  LeagueMatches,
  DayMatches,
  ViewMode,
  UpcomingPeriod,
} from '../types'

// --- Hot leagues: default selected ---
const HOT_SLUGS = new Set([
  // Top 5 national
  'eng.1',
  'esp.1',
  'ger.1',
  'fra.1',
  'ita.1',
  // Big international
  'uefa.champions',
  'uefa.europa',
  'uefa.europa.conf',
  'fifa.world',
])

// Slugs to exclude entirely (women's, friendly, too niche)
const EXCLUDE_SLUGS = new Set([
  'fifa.friendly',
  'fifa.shebelieves',
  'fifa.w.champions_cup',
  'fifa.wwc',
  'uefa.wchampions',
  'eng.w.1',
  'usa.nwsl',
  'usa.nwsl.cup',
  'campeones.cup',
  'concacaf.leagues.cup',
])

// Vietnamese name mapping
const VI_NAMES: Record<string, string> = {
  'eng.1': 'Ngoại Hạng Anh',
  'esp.1': 'La Liga',
  'ger.1': 'Bundesliga',
  'fra.1': 'Ligue 1',
  'ita.1': 'Serie A',
  'eng.2': 'Hạng Nhất Anh',
  'eng.fa': 'FA Cup',
  'eng.league_cup': 'Carabao Cup',
  'eng.charity': 'Community Shield',
  'esp.copa_del_rey': 'Cúp Nhà Vua',
  'esp.super_cup': 'Siêu Cúp TBN',
  'ger.dfb_pokal': 'Cúp Quốc Gia Đức',
  'ger.super_cup': 'Siêu Cúp Đức',
  'fra.coupe_de_france': 'Cúp Quốc Gia Pháp',
  'fra.super_cup': 'Siêu Cúp Pháp',
  'ita.coppa_italia': 'Coppa Italia',
  'ita.super_cup': 'Siêu Cúp Ý',
  'ned.1': 'Eredivisie',
  'por.1': 'Primeira Liga',
  'ksa.1': 'Saudi Pro League',
  'mex.1': 'Liga MX',
  'usa.1': 'MLS',
  'uefa.champions': 'Champions League (C1)',
  'uefa.europa': 'Europa League (C2)',
  'uefa.europa.conf': 'Conference League (C3)',
  'fifa.world': 'World Cup',
  'uefa.nations': 'UEFA Nations League',
  'conmebol.libertadores': 'Copa Libertadores',
  'concacaf.champions': 'Concacaf Champions Cup',
  'fifa.wcq.ply': 'VL World Cup - Playoff',
  'fifa.worldq.uefa': 'VL World Cup - UEFA',
  'fifa.worldq.concacaf': 'VL World Cup - Concacaf',
  'fifa.worldq.afc': 'VL World Cup - AFC',
  'fifa.worldq.caf': 'VL World Cup - CAF',
  'fifa.worldq.conmebol': 'VL World Cup - CONMEBOL',
  'fifa.worldq.ofc': 'VL World Cup - OFC',
  'fifa.worldq.afc.conmebol': 'VL World Cup - AFC/CONMEBOL',
  'fifa.worldq.concacaf.ofc': 'VL World Cup - Concacaf/OFC',
}

// Country mapping for national leagues
const COUNTRY_MAP: Record<string, string> = {
  'eng.1': 'Anh',
  'eng.2': 'Anh',
  'eng.fa': 'Anh',
  'eng.league_cup': 'Anh',
  'eng.charity': 'Anh',
  'esp.1': 'TBN',
  'esp.copa_del_rey': 'TBN',
  'esp.super_cup': 'TBN',
  'ger.1': 'Đức',
  'ger.dfb_pokal': 'Đức',
  'ger.super_cup': 'Đức',
  'fra.1': 'Pháp',
  'fra.coupe_de_france': 'Pháp',
  'fra.super_cup': 'Pháp',
  'ita.1': 'Ý',
  'ita.coppa_italia': 'Ý',
  'ita.super_cup': 'Ý',
  'ned.1': 'Hà Lan',
  'por.1': 'BĐN',
  'ksa.1': 'Ả Rập',
  'mex.1': 'Mexico',
  'usa.1': 'Mỹ',
}

// Determine if a slug is a national/domestic league
function isNationalSlug(slug: string): boolean {
  const parts = slug.split('.')
  const prefix = parts[0] ?? ''
  // Country codes followed by number or cup name = national
  return ['eng', 'esp', 'ger', 'fra', 'ita', 'ned', 'por', 'ksa', 'mex', 'usa'].includes(prefix)
}

const DROPDOWN_API = 'https://site.api.espn.com/apis/site/v2/leagues/dropdown?lang=en&sport=soccer'

async function fetchAllLeagues(): Promise<League[]> {
  try {
    const res = await fetch(DROPDOWN_API)
    if (!res.ok) return fallbackLeagues()

    const data = (await res.json()) as Record<string, unknown>
    const items = (data['leagues'] as Record<string, unknown>[]) ?? []
    const result: League[] = []

    for (const item of items) {
      const slug = (item['slug'] as string) ?? ''
      if (!slug || EXCLUDE_SLUGS.has(slug)) continue

      const name = (item['name'] as string) ?? slug
      const nameVi = VI_NAMES[slug] ?? name
      const group = isNationalSlug(slug) ? 'national' : 'international'
      const tag = HOT_SLUGS.has(slug) ? 'hot' : 'other'

      result.push({
        id: slug,
        slug,
        name,
        nameVi,
        logo: '',
        country: COUNTRY_MAP[slug],
        group,
        tag,
      })
    }

    return result.length > 0 ? result : fallbackLeagues()
  } catch {
    return fallbackLeagues()
  }
}

function fallbackLeagues(): League[] {
  return [
    {
      id: 'eng.1',
      slug: 'eng.1',
      name: 'Premier League',
      nameVi: 'Ngoại Hạng Anh',
      logo: '',
      country: 'Anh',
      group: 'national',
      tag: 'hot',
    },
    {
      id: 'esp.1',
      slug: 'esp.1',
      name: 'La Liga',
      nameVi: 'La Liga',
      logo: '',
      country: 'TBN',
      group: 'national',
      tag: 'hot',
    },
    {
      id: 'ger.1',
      slug: 'ger.1',
      name: 'Bundesliga',
      nameVi: 'Bundesliga',
      logo: '',
      country: 'Đức',
      group: 'national',
      tag: 'hot',
    },
    {
      id: 'fra.1',
      slug: 'fra.1',
      name: 'Ligue 1',
      nameVi: 'Ligue 1',
      logo: '',
      country: 'Pháp',
      group: 'national',
      tag: 'hot',
    },
    {
      id: 'ita.1',
      slug: 'ita.1',
      name: 'Serie A',
      nameVi: 'Serie A',
      logo: '',
      country: 'Ý',
      group: 'national',
      tag: 'hot',
    },
    {
      id: 'uefa.champions',
      slug: 'uefa.champions',
      name: 'Champions League',
      nameVi: 'Champions League (C1)',
      logo: '',
      group: 'international',
      tag: 'hot',
    },
    {
      id: 'uefa.europa',
      slug: 'uefa.europa',
      name: 'Europa League',
      nameVi: 'Europa League (C2)',
      logo: '',
      group: 'international',
      tag: 'hot',
    },
    {
      id: 'fifa.world',
      slug: 'fifa.world',
      name: 'FIFA World Cup',
      nameVi: 'World Cup',
      logo: '',
      group: 'international',
      tag: 'hot',
    },
  ]
}

// --- Date helpers ---

function formatDateParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function formatDateLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

  let prefix = ''
  if (diff === 0) prefix = 'Hôm nay'
  else if (diff === 1) prefix = 'Ngày mai'
  else if (diff === -1) prefix = 'Hôm qua'

  const dateStr = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })

  return prefix ? `${prefix} — ${dateStr}` : dateStr
}

function getDateRange(period: UpcomingPeriod): { from: Date; to: Date } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'week') {
    const to = new Date(from)
    to.setDate(from.getDate() + 7)
    return { from, to }
  }

  if (period === 'month') {
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 0)
    return { from, to }
  }

  const to = new Date(from.getFullYear(), 11, 31)
  return { from, to }
}

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// --- Parsers ---

function parseStatus(statusData: Record<string, unknown>): {
  name: string
  description: string
  displayClock: string
  isCompleted: boolean
  isInProgress: boolean
  isScheduled: boolean
} {
  const type = statusData['type'] as Record<string, unknown> | undefined
  return {
    name: (type?.['name'] as string) ?? '',
    description: (type?.['description'] as string) ?? '',
    displayClock: (statusData['displayClock'] as string) ?? '',
    isCompleted: (type?.['completed'] as boolean) ?? false,
    isInProgress: (type?.['state'] as string) === 'in',
    isScheduled: (type?.['state'] as string) === 'pre',
  }
}

function parseTeamStats(statistics: Record<string, unknown>[]): TeamStats | null {
  if (statistics.length === 0) return null
  function findStat(name: string): string {
    const stat = statistics.find((s) => s['name'] === name)
    return (stat?.['displayValue'] as string) ?? '0'
  }
  return {
    possession: findStat('possessionPct'),
    shots: findStat('totalShots'),
    shotsOnTarget: findStat('shotsOnTarget'),
    corners: findStat('wonCorners'),
    fouls: findStat('foulsCommitted'),
    assists: findStat('goalAssists'),
  }
}

function parseCompetitorDetail(comp: Record<string, unknown>): TeamDetail {
  const team = comp['team'] as Record<string, unknown> | undefined
  const statistics = (comp['statistics'] as Record<string, unknown>[]) ?? []
  const records = (comp['records'] as Record<string, unknown>[]) ?? []
  const firstRecord = records[0]
  return {
    team: {
      id: (team?.['id'] as string) ?? '',
      name: (team?.['name'] as string) ?? '',
      shortName: (team?.['shortDisplayName'] as string) ?? (team?.['name'] as string) ?? '',
      abbreviation: (team?.['abbreviation'] as string) ?? '',
      logo: (team?.['logo'] as string) ?? '',
    },
    score: (comp['score'] as string) ?? '-',
    form: (comp['form'] as string) ?? '',
    record: (firstRecord?.['summary'] as string) ?? '',
    stats: parseTeamStats(statistics),
  }
}

function parseMatchEvents(details: Record<string, unknown>[]): MatchEvent[] {
  return details.map((d) => {
    const type = d['type'] as Record<string, unknown> | undefined
    const clock = d['clock'] as Record<string, unknown> | undefined
    const team = d['team'] as Record<string, unknown> | undefined
    const athletes = (d['athletesInvolved'] as Record<string, unknown>[]) ?? []
    const firstAthlete = athletes[0]
    return {
      type: (type?.['text'] as string) ?? '',
      minute: (clock?.['displayValue'] as string) ?? '',
      playerName: (firstAthlete?.['displayName'] as string) ?? '',
      teamId: (team?.['id'] as string) ?? '',
      isGoal: (d['scoringPlay'] as boolean) ?? false,
      isOwnGoal: (d['ownGoal'] as boolean) ?? false,
      isRedCard: (d['redCard'] as boolean) ?? false,
      isYellowCard: (d['yellowCard'] as boolean) ?? false,
      isPenalty: (d['penaltyKick'] as boolean) ?? false,
    }
  })
}

function parseMatchDetail(
  competition: Record<string, unknown>,
  home: Record<string, unknown>,
  away: Record<string, unknown>,
): MatchDetail {
  const venue = competition['venue'] as Record<string, unknown> | undefined
  const address = venue?.['address'] as Record<string, unknown> | undefined
  const details = (competition['details'] as Record<string, unknown>[]) ?? []
  const headlines = (competition['headlines'] as Record<string, unknown>[]) ?? []
  const firstHeadline = headlines[0]
  return {
    headline: (firstHeadline?.['shortLinkText'] as string) ?? '',
    headlineDescription: (firstHeadline?.['description'] as string) ?? '',
    venue: (venue?.['fullName'] as string) ?? '',
    venueCity: (address?.['city'] as string) ?? '',
    attendance: (competition['attendance'] as number) ?? 0,
    homeDetail: parseCompetitorDetail(home),
    awayDetail: parseCompetitorDetail(away),
    events: parseMatchEvents(details),
  }
}

function parseApiEvents(events: Record<string, unknown>[], leagueId: string): Match[] {
  return events.map((event) => {
    const competitions = (event['competitions'] as Record<string, unknown>[]) ?? []
    const competition = competitions[0]
    const competitors = (competition?.['competitors'] as Record<string, unknown>[]) ?? []
    const venue = competition?.['venue'] as Record<string, unknown> | undefined
    const status = (competition?.['status'] as Record<string, unknown>) ?? {}
    const home = competitors.find((c) => c['homeAway'] === 'home')
    const away = competitors.find((c) => c['homeAway'] === 'away')
    const homeDetail = home ? parseCompetitorDetail(home) : null
    const awayDetail = away ? parseCompetitorDetail(away) : null
    const matchStatus = parseStatus(status)
    const detail = home && away && competition ? parseMatchDetail(competition, home, away) : null
    return {
      id: (event['id'] as string) ?? '',
      date: (event['date'] as string) ?? '',
      name: (event['name'] as string) ?? '',
      shortName: (event['shortName'] as string) ?? '',
      homeTeam: homeDetail?.team ?? {
        id: '',
        name: 'TBD',
        shortName: 'TBD',
        abbreviation: '?',
        logo: '',
      },
      awayTeam: awayDetail?.team ?? {
        id: '',
        name: 'TBD',
        shortName: 'TBD',
        abbreviation: '?',
        logo: '',
      },
      homeScore: homeDetail?.score ?? '-',
      awayScore: awayDetail?.score ?? '-',
      status: matchStatus,
      venue: (venue?.['fullName'] as string) ?? '',
      leagueId,
      detail,
    }
  })
}

// --- Fetch helpers ---

function updateLeagueLogo(league: League, data: Record<string, unknown>) {
  const leagues = (data['leagues'] as Record<string, unknown>[]) ?? []
  const firstLeague = leagues[0]
  if (firstLeague) {
    const logos = (firstLeague['logos'] as Record<string, unknown>[]) ?? []
    const firstLogo = logos[0]
    if (firstLogo) {
      league.logo = (firstLogo['href'] as string) ?? ''
    }
  }
}

async function fetchLeagueByDateRange(league: League, from: string, to: string): Promise<Match[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard?dates=${from}-${to}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as Record<string, unknown>
    const events = (data['events'] as Record<string, unknown>[]) ?? []
    updateLeagueLogo(league, data)
    return parseApiEvents(events, league.id)
  } catch {
    return []
  }
}

async function fetchLeagueSingleDay(league: League, dateStr: string): Promise<Match[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard?dates=${dateStr}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as Record<string, unknown>
    const events = (data['events'] as Record<string, unknown>[]) ?? []
    updateLeagueLogo(league, data)
    return parseApiEvents(events, league.id)
  } catch {
    return []
  }
}

// --- Group matches by day ---

function groupMatchesByDay(
  allMatches: { league: League; matches: Match[] }[],
  allLeagues: League[],
): DayMatches[] {
  const dayMap = new Map<
    string,
    { date: Date; leagueMap: Map<string, { league: League; matches: Match[] }> }
  >()

  for (const { league, matches } of allMatches) {
    for (const match of matches) {
      const key = getDateKey(match.date)
      if (!dayMap.has(key)) {
        dayMap.set(key, { date: new Date(match.date), leagueMap: new Map() })
      }
      const day = dayMap.get(key)!
      if (!day.leagueMap.has(league.id)) {
        day.leagueMap.set(league.id, { league, matches: [] })
      }
      day.leagueMap.get(league.id)!.matches.push(match)
    }
  }

  const sortedKeys = [...dayMap.keys()].sort()
  return sortedKeys.map((key) => {
    const day = dayMap.get(key)!
    const leagueMatches = allLeagues
      .map((l) => day.leagueMap.get(l.id))
      .filter((lm): lm is { league: League; matches: Match[] } => !!lm && lm.matches.length > 0)
    const dateOnly = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate())
    return {
      date: dateOnly,
      dateLabel: formatDateLabel(dateOnly),
      leagueMatches,
      totalMatches: leagueMatches.reduce((sum, lm) => sum + lm.matches.length, 0),
    }
  })
}

// --- Main composable ---

export function useFootballCalendar() {
  const viewMode = ref<ViewMode>('upcoming')
  const upcomingPeriod = ref<UpcomingPeriod>('week')
  const selectedDate = ref(new Date())
  const leagueMatchesMap = ref<Map<string, Match[]>>(new Map())
  const upcomingDays = ref<DayMatches[]>([])
  const loading = ref(false)
  const loadingUpcoming = ref(false)
  const error = ref('')

  const allLeagues = reactive<League[]>([])
  const selectedLeagues = ref<string[]>([])

  const nationalLeagues = computed(() => allLeagues.filter((l) => l.group === 'national'))
  const internationalLeagues = computed(() => allLeagues.filter((l) => l.group === 'international'))
  const hotSlugsSet = computed(
    () => new Set(allLeagues.filter((l) => l.tag === 'hot').map((l) => l.slug)),
  )

  const dateString = computed(() => formatDateParam(selectedDate.value))
  const filteredLeagueIds = computed(() => new Set(selectedLeagues.value))

  const leagueMatches = computed<LeagueMatches[]>(() => {
    return allLeagues
      .filter((l) => filteredLeagueIds.value.has(l.id))
      .map((league) => ({ league, matches: leagueMatchesMap.value.get(league.id) ?? [] }))
      .filter((lm) => lm.matches.length > 0)
  })

  const totalMatches = computed(() =>
    leagueMatches.value.reduce((sum, lm) => sum + lm.matches.length, 0),
  )

  const filteredUpcomingDays = computed<DayMatches[]>(() => {
    return upcomingDays.value
      .map((day) => {
        const filtered = day.leagueMatches
          .filter((lm) => filteredLeagueIds.value.has(lm.league.id))
          .filter((lm) => lm.matches.length > 0)
        return {
          ...day,
          leagueMatches: filtered,
          totalMatches: filtered.reduce((sum, lm) => sum + lm.matches.length, 0),
        }
      })
      .filter((day) => day.totalMatches > 0)
  })

  const totalUpcomingMatches = computed(() =>
    filteredUpcomingDays.value.reduce((sum, d) => sum + d.totalMatches, 0),
  )

  const periodLabel = computed(() => {
    if (upcomingPeriod.value === 'week') return '7 ngày tới'
    if (upcomingPeriod.value === 'month') return 'trong tháng này'
    return 'trong năm nay'
  })

  async function initLeagues() {
    const fetched = await fetchAllLeagues()
    allLeagues.splice(0, allLeagues.length, ...fetched)
    // Default: select only hot leagues
    selectedLeagues.value = fetched.filter((l) => l.tag === 'hot').map((l) => l.id)
  }

  async function fetchDaily() {
    const activeLeagues = allLeagues.filter((l) => filteredLeagueIds.value.has(l.id))
    if (activeLeagues.length === 0) return

    loading.value = true
    error.value = ''
    try {
      const results = await Promise.allSettled(
        activeLeagues.map((league) => fetchLeagueSingleDay(league, dateString.value)),
      )
      const newMap = new Map<string, Match[]>()
      results.forEach((result, index) => {
        const league = activeLeagues[index]
        if (league && result.status === 'fulfilled') {
          newMap.set(league.id, result.value)
        }
      })
      leagueMatchesMap.value = newMap
    } catch {
      error.value = 'Không thể tải dữ liệu. Vui lòng thử lại.'
    } finally {
      loading.value = false
    }
  }

  async function fetchUpcoming() {
    const activeLeagues = allLeagues.filter((l) => filteredLeagueIds.value.has(l.id))
    if (activeLeagues.length === 0) {
      upcomingDays.value = []
      return
    }

    loadingUpcoming.value = true
    error.value = ''
    try {
      const { from, to } = getDateRange(upcomingPeriod.value)
      const fromStr = formatDateParam(from)
      const toStr = formatDateParam(to)

      const results = await Promise.allSettled(
        activeLeagues.map((league) => fetchLeagueByDateRange(league, fromStr, toStr)),
      )

      const allLeagueMatches: { league: League; matches: Match[] }[] = []
      results.forEach((result, index) => {
        const league = activeLeagues[index]
        if (league && result.status === 'fulfilled' && result.value.length > 0) {
          allLeagueMatches.push({ league, matches: result.value })
        }
      })

      upcomingDays.value = groupMatchesByDay(allLeagueMatches, activeLeagues)
    } catch {
      error.value = 'Không thể tải dữ liệu. Vui lòng thử lại.'
    } finally {
      loadingUpcoming.value = false
    }
  }

  function fetchAll() {
    if (viewMode.value === 'daily') {
      fetchDaily()
    } else {
      fetchUpcoming()
    }
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
    fetchAll()
  }

  function setPeriod(period: UpcomingPeriod) {
    upcomingPeriod.value = period
    fetchUpcoming()
  }

  function goToDate(date: Date) {
    selectedDate.value = date
    viewMode.value = 'daily'
  }

  function goToPrevDay() {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() - 1)
    selectedDate.value = d
  }

  function goToNextDay() {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() + 1)
    selectedDate.value = d
  }

  function goToToday() {
    selectedDate.value = new Date()
  }

  function toggleLeague(leagueId: string) {
    const idx = selectedLeagues.value.indexOf(leagueId)
    if (idx >= 0) {
      selectedLeagues.value.splice(idx, 1)
    } else {
      selectedLeagues.value.push(leagueId)
    }
  }

  function selectAllLeagues() {
    selectedLeagues.value = allLeagues.map((l) => l.id)
  }

  function deselectAllLeagues() {
    selectedLeagues.value = []
  }

  function selectHotOnly() {
    selectedLeagues.value = allLeagues.filter((l) => l.tag === 'hot').map((l) => l.id)
  }

  function selectGroup(ids: string[]) {
    const current = new Set(selectedLeagues.value)
    for (const id of ids) current.add(id)
    selectedLeagues.value = [...current]
  }

  function deselectGroup(ids: string[]) {
    const toRemove = new Set(ids)
    selectedLeagues.value = selectedLeagues.value.filter((id) => !toRemove.has(id))
  }

  watch(dateString, () => {
    if (viewMode.value === 'daily') {
      fetchDaily()
    }
  })

  return {
    viewMode,
    upcomingPeriod,
    selectedDate,
    selectedLeagues,
    allLeagues,
    nationalLeagues,
    internationalLeagues,
    hotSlugsSet,
    leagueMatches,
    totalMatches,
    filteredUpcomingDays,
    totalUpcomingMatches,
    periodLabel,
    loading,
    loadingUpcoming,
    error,
    initLeagues,
    fetchAll,
    setViewMode,
    setPeriod,
    goToDate,
    goToPrevDay,
    goToNextDay,
    goToToday,
    toggleLeague,
    selectGroup,
    deselectGroup,
    selectAllLeagues,
    deselectAllLeagues,
    selectHotOnly,
  }
}
