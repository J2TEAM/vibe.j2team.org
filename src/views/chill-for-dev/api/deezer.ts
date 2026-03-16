/** Deezer API (public, no key) - search qua JSONP để tránh CORS, không cần proxy */

export interface DeezerTrack {
  id: number
  title: string
  link: string
  duration: number
  preview: string
  artist: { name: string }
  album: { cover_small: string; cover_medium: string; cover_big: string }
}

export interface DeezerSearchResponse {
  data: DeezerTrack[]
  total: number
}

export interface DeezerPlaylist {
  id: number
  title: string
  tracks: {
    data: DeezerTrack[]
  }
}

const JSONP_CALLBACK = '__deezerSearchJsonp'

function searchDeezerJsonp(query: string): Promise<DeezerTrack[]> {
  return new Promise((resolve) => {
    const q = query.trim()
    if (!q) {
      resolve([])
      return
    }

    const cb = (resp: DeezerSearchResponse | undefined) => {
      delete (window as unknown as Record<string, unknown>)[JSONP_CALLBACK]
      document.body.removeChild(script)
      if (resp && Array.isArray(resp.data)) resolve(resp.data)
      else resolve([])
    }
    ;(window as unknown as Record<string, (r: DeezerSearchResponse) => void>)[JSONP_CALLBACK] = cb

    const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=20&output=jsonp&callback=${JSONP_CALLBACK}`
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[JSONP_CALLBACK]
      if (script.parentNode) document.body.removeChild(script)
      resolve([])
    }
    document.body.appendChild(script)
  })
}

export async function searchDeezer(query: string): Promise<DeezerTrack[]> {
  try {
    return await searchDeezerJsonp(query)
  } catch {
    return []
  }
}

function getTrackJsonp(id: number): Promise<DeezerTrack | null> {
  const callbackName = `__deezerTrack_${id}_${Date.now()}`
  return new Promise((resolve) => {
    const cb = (resp: DeezerTrack & { error?: unknown }) => {
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (script.parentNode) document.body.removeChild(script)
      if (resp && !resp.error && resp.preview) resolve(resp)
      else resolve(null)
    }
    ;(window as unknown as Record<string, (r: DeezerTrack) => void>)[callbackName] = cb
    const url = `https://api.deezer.com/track/${id}?output=jsonp&callback=${encodeURIComponent(callbackName)}`
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (script.parentNode) document.body.removeChild(script)
      resolve(null)
    }
    document.body.appendChild(script)
  })
}

/** Lấy 1 track theo Deezer ID (để dùng cho chill list có sẵn) */
export async function getDeezerTrack(id: number): Promise<DeezerTrack | null> {
  try {
    return await getTrackJsonp(id)
  } catch {
    return null
  }
}

export function parseDeezerPlaylistId(url: string): string | null {
  try {
    const u = new URL(url)
    const m = u.pathname.match(/playlist\/(\d+)/)
    return m?.[1] ?? null
  } catch {
    const m = url.match(/playlist\/(\d+)/)
    return m?.[1] ?? null
  }
}

function getPlaylistJsonp(playlistId: string): Promise<DeezerPlaylist | null> {
  const callbackName = `__deezerPlaylist_${playlistId}_${Date.now()}`
  return new Promise((resolve) => {
    const cb = (resp: DeezerPlaylist & { error?: unknown }) => {
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (script.parentNode) document.body.removeChild(script)
      if (resp && !resp.error && resp.tracks && Array.isArray(resp.tracks.data)) resolve(resp)
      else resolve(null)
    }
    ;(window as unknown as Record<string, (r: DeezerPlaylist) => void>)[callbackName] = cb

    const url = `https://api.deezer.com/playlist/${playlistId}?output=jsonp&callback=${encodeURIComponent(
      callbackName,
    )}`
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (script.parentNode) document.body.removeChild(script)
      resolve(null)
    }
    document.body.appendChild(script)
  })
}

export async function getDeezerPlaylistTracks(playlistId: string): Promise<DeezerTrack[]> {
  try {
    const pl = await getPlaylistJsonp(playlistId)
    if (!pl || !pl.tracks || !Array.isArray(pl.tracks.data)) return []
    return pl.tracks.data
  } catch {
    return []
  }
}
