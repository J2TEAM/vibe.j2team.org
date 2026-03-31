import type {
  ClanDetails,
  WarLogEntry,
  CurrentWar,
  PlayerDetails,
  LeagueGroup,
  CWLWar,
} from '../types'

const BASE_URL = 'https://coc-apis.behitek.com'

// Helper to format tag for URL (replace # with %23)
const formatTag = (tag: string): string => {
  if (!tag) return ''
  const cleanTag = tag.toUpperCase().replace('#', '')
  return `%23${cleanTag}`
}

export const getClanDetails = async (clanTag: string): Promise<ClanDetails> => {
  const formattedTag = formatTag(clanTag)
  const response = await fetch(`${BASE_URL}/clans/${formattedTag}`)
  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin clan: ${response.statusText}`)
  }
  return response.json()
}

export const getClanWarLog = async (clanTag: string): Promise<WarLogEntry[]> => {
  const formattedTag = formatTag(clanTag)
  const response = await fetch(`${BASE_URL}/clans/${formattedTag}/warlog`)
  if (!response.ok) {
    // War log might be private
    if (response.status === 403) {
      return []
    }
    throw new Error(`Không thể lấy nhật ký chiến tranh: ${response.statusText}`)
  }
  const data = await response.json()
  return data.items || []
}

export const getClanCurrentWar = async (clanTag: string): Promise<CurrentWar> => {
  const formattedTag = formatTag(clanTag)
  const response = await fetch(`${BASE_URL}/clans/${formattedTag}/currentwar`)
  if (!response.ok) {
    if (response.status === 403) throw new Error('Nhật ký chiến tranh đang bị ẩn')
    if (response.status === 404) throw new Error('Không tìm thấy chiến tranh hiện tại')
    // Sometimes API returns 404 if not in war, but usually it returns state='notInWar'
    // Return a mock empty war object if 404
    return { state: 'notInWar' } as CurrentWar
  }
  return response.json()
}

export const getClanWarLeagueGroup = async (clanTag: string): Promise<LeagueGroup> => {
  const formattedTag = formatTag(clanTag)
  const response = await fetch(`${BASE_URL}/clans/${formattedTag}/currentwar/leaguegroup`)
  if (!response.ok) {
    throw new Error('Không thể lấy thông tin giải đấu')
  }
  return response.json()
}

export const getClanWarLeagueWar = async (warTag: string): Promise<CWLWar> => {
  // War tags come with # already, so format them
  const formattedTag = formatTag(warTag)
  const response = await fetch(`${BASE_URL}/clanwarleagues/wars/${formattedTag}`)
  if (!response.ok) {
    throw new Error('Không thể lấy thông tin vòng đấu CWL')
  }
  return response.json()
}

export const getPlayerDetails = async (playerTag: string): Promise<PlayerDetails> => {
  const formattedTag = formatTag(playerTag)
  const response = await fetch(`${BASE_URL}/players/${formattedTag}`)
  if (!response.ok) {
    throw new Error(`Không thể lấy thông tin người chơi: ${response.statusText}`)
  }
  return response.json()
}
