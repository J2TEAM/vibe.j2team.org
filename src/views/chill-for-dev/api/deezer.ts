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
