/**
 * API Client Utilities for vibe-phim
 * Centralized API calls with proper error handling
 */

const API_BASE_URL = 'https://ophim1.com'

// ==================== Response Types ====================
export interface ApiResponse<T> {
  status: boolean
  msg: string
  data?: T
}

interface ApiRequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, string | number>
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

// ==================== API Client ====================
/**
 * Generic HTTP client for making API requests
 * @param config - API request configuration
 * @returns Promise with API response
 */
export async function httpClient<T = unknown>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
  const { url, method = 'GET', params, body, headers = {} } = config

  // Build URL with query params
  let fullUrl = `${API_BASE_URL}${url}`
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: String(value),
        }),
        {},
      ),
    ).toString()
    fullUrl += `?${queryString}`
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API Request Error [${method} ${url}]:`, error)
    throw error
  }
}

// ==================== Specific API Endpoints ====================

/**
 * Get list of movies by category
 * @param category - Category slug (e.g., 'hot', 'new', 'top')
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getMoviesByCategory(
  category: string = 'hot',
  page: number = 1,
  limit: number = 12,
) {
  return httpClient({
    url: `/v1/api/danh-sach/${category}`,
    params: { page, limit },
  })
}

/**
 * Get carousel/featured movies
 * @param limit - Number of movies to fetch (default: 8)
 */
export async function getCarouselMovies(limit: number = 8) {
  return httpClient({
    url: '/v1/api/danh-sach/hot',
    params: { limit },
  })
}

/**
 * Search movies by keyword
 * @param keyword - Search query
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function searchMovies(keyword: string, page: number = 1, limit: number = 12) {
  return httpClient({
    url: '/v1/api/tim-kiem',
    params: { keyword, page, limit },
  })
}

/**
 * Get movie detail by slug
 * @param slug - Movie slug
 */
export async function getMovieDetail(slug: string) {
  return httpClient({
    url: `/v1/api/phim/${slug}`,
  })
}

/**
 * Get movies by actor
 * @param slug - Actor slug
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getMoviesByActor(slug: string, page: number = 1, limit: number = 12) {
  return httpClient({
    url: `/v1/api/dien-vien/${slug}`,
    params: { page, limit },
  })
}

/**
 * Get movies by country
 * @param slug - Country slug
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getMoviesByCountry(slug: string, page: number = 1, limit: number = 12) {
  return httpClient({
    url: `/v1/api/quoc-gia/${slug}`,
    params: { page, limit },
  })
}

/**
 * Get movies by genre/category
 * @param slug - Genre slug
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getMoviesByGenre(slug: string, page: number = 1, limit: number = 12) {
  return httpClient({
    url: `/v1/api/the-loai/${slug}`,
    params: { page, limit },
  })
}

/**
 * Get list of categories
 */
export async function getCategories() {
  return httpClient({
    url: '/v1/api/the-loai',
  })
}

/**
 * Get list of countries
 */
export async function getCountries() {
  return httpClient({
    url: '/v1/api/quoc-gia',
  })
}

// ==================== Category-Specific Endpoints ====================

/**
 * Get newest movies (phim mới)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getNewMovies(page: number = 1, limit: number = 12) {
  return httpClient({
    url: '/v1/api/danh-sach/moi',
    params: { page, limit },
  })
}

/**
 * Get animation/anime movies (hoạt hình)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getAnimationMovies(page: number = 1, limit: number = 12) {
  return httpClient({
    url: '/v1/api/danh-sach/hoat-hinh',
    params: { page, limit },
  })
}

/**
 * Get single movies (phim lẻ)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getSingleMovies(page: number = 1, limit: number = 12) {
  return httpClient({
    url: '/v1/api/danh-sach/phim-le',
    params: { page, limit },
  })
}

/**
 * Get series/TV shows (phim bộ)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 12)
 */
export async function getSeriesMovies(page: number = 1, limit: number = 12) {
  return httpClient({
    url: '/v1/api/danh-sach/phim-bo',
    params: { page, limit },
  })
}

// ==================== Movie Detail & Player ====================

/**
 * Get movie detail with episodes
 * @param slug - Movie slug
 * @returns Movie detail with episodes and streaming links
 */
export async function getMovieDetailWithEpisodes(slug: string) {
  return httpClient({
    url: `/v1/api/phim/${slug}`,
  })
}

/**
 * Get movie actors/peoples
 * @param slug - Movie slug
 * @returns List of actors/peoples in the movie
 */
export async function getMovieActors(slug: string) {
  return httpClient({
    url: `/v1/api/phim/${slug}/peoples`,
  })
}

// ==================== Video Player ====================

/**
 * Get episode streaming link (HLS/M3U8)
 * Note: The M3U8 link is available in the episode.link_m3u8 from getMovieDetailWithEpisodes
 * This is just a helper to fetch if needed
 * @param episodeSlug - Episode identifier
 */
export async function getEpisodeStreamingLink(episodeSlug: string) {
  try {
    const response = await fetch(`https://ophim1.com/phim/${episodeSlug}`)
    return response
  } catch (error) {
    console.error('Error fetching episode streaming:', error)
    throw error
  }
}

// ==================== Home/Config Data ====================

/**
 * Get home page data including CDN image URL
 * @returns Home data with APP_DOMAIN_CDN_IMAGE and SEO info
 */
export async function getHomeData() {
  return httpClient<{
    APP_DOMAIN_CDN_IMAGE: string
    seoOnPage?: Record<string, unknown>
  }>({
    url: '/v1/api/home',
  })
}
