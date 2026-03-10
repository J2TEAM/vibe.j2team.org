/**
 * Composable: useMovieList
 * Manages movie data fetching and state
 */

import { ref, computed } from 'vue'
import type { Movie } from '../types'
import {
  getMoviesByCategory,
  getCarouselMovies,
  searchMovies,
  getNewMovies,
  getAnimationMovies,
  getSingleMovies,
  getSeriesMovies,
  getHomeData,
  type ApiResponse,
} from '../utils/api'

interface MovieListResponse {
  items: Movie[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
}

export type MovieCategory = 'hot' | 'moi' | 'hoat-hinh' | 'phim-le' | 'phim-bo'

interface CategoryInfo {
  id: MovieCategory
  name: string
  label: string
  icon: string
}

export const MOVIE_CATEGORIES: CategoryInfo[] = [
  { id: 'hot', name: 'hot', label: 'Trending', icon: 'lucide:flame' },
  { id: 'moi', name: 'moi', label: 'Phim Mới', icon: 'lucide:sparkles' },
  { id: 'hoat-hinh', name: 'hoat-hinh', label: 'Hoạt Hình', icon: 'lucide:wand2' },
  { id: 'phim-le', name: 'phim-le', label: 'Phim Lẻ', icon: 'lucide:film' },
  { id: 'phim-bo', name: 'phim-bo', label: 'Phim Bộ', icon: 'lucide:tv' },
]

export function useMovieList() {
  // ==================== State ====================
  const listData = ref<Movie[]>([])
  const carouselData = ref<Movie[]>([])
  const loading = ref(true)
  const carouselLoading = ref(true)
  const error = ref<string | null>(null)
  const carouselError = ref<string | null>(null)
  const currentCategory = ref<MovieCategory>('hot')
  const currentPage = ref(1)
  const imageBaseUrl = ref<string>('https://ophim1.com')

  // ==================== Methods: List Data ====================
  const getListData = async (category: string = 'hot', page: number = 1, limit: number = 12) => {
    loading.value = true
    error.value = null
    currentCategory.value = category as MovieCategory
    currentPage.value = page

    try {
      const response = (await getMoviesByCategory(
        category,
        page,
        limit,
      )) as ApiResponse<MovieListResponse>

      if (response.status && response.data) {
        listData.value = response.data.items || []
      } else {
        error.value = response.msg || 'Lỗi khi tải dữ liệu phim'
        listData.value = []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối API'
      error.value = errorMessage
      console.error('Error fetching movie list:', err)
      listData.value = []
    } finally {
      loading.value = false
    }
  }

  // ==================== Methods: Specific Categories ====================

  /**
   * Get newest movies (phim mới)
   */
  const getNewMoviesList = async (page: number = 1, limit: number = 12) => {
    loading.value = true
    error.value = null
    currentCategory.value = 'moi'
    currentPage.value = page

    try {
      const response = (await getNewMovies(page, limit)) as ApiResponse<MovieListResponse>

      if (response.status && response.data) {
        listData.value = response.data.items || []
      } else {
        error.value = response.msg || 'Lỗi khi tải phim mới'
        listData.value = []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối API'
      error.value = errorMessage
      console.error('Error fetching new movies:', err)
      listData.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get animation/anime movies (hoạt hình)
   */
  const getAnimationMoviesList = async (page: number = 1, limit: number = 12) => {
    loading.value = true
    error.value = null
    currentCategory.value = 'hoat-hinh'
    currentPage.value = page

    try {
      const response = (await getAnimationMovies(page, limit)) as ApiResponse<MovieListResponse>

      if (response.status && response.data) {
        listData.value = response.data.items || []
      } else {
        error.value = response.msg || 'Lỗi khi tải hoạt hình'
        listData.value = []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối API'
      error.value = errorMessage
      console.error('Error fetching animation movies:', err)
      listData.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get single movies (phim lẻ)
   */
  const getSingleMoviesList = async (page: number = 1, limit: number = 12) => {
    loading.value = true
    error.value = null
    currentCategory.value = 'phim-le'
    currentPage.value = page

    try {
      const response = (await getSingleMovies(page, limit)) as ApiResponse<MovieListResponse>

      if (response.status && response.data) {
        listData.value = response.data.items || []
      } else {
        error.value = response.msg || 'Lỗi khi tải phim lẻ'
        listData.value = []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối API'
      error.value = errorMessage
      console.error('Error fetching single movies:', err)
      listData.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get series/TV shows (phim bộ)
   */
  const getSeriesMoviesList = async (page: number = 1, limit: number = 12) => {
    loading.value = true
    error.value = null
    currentCategory.value = 'phim-bo'
    currentPage.value = page

    try {
      const response = (await getSeriesMovies(page, limit)) as ApiResponse<MovieListResponse>

      if (response.status && response.data) {
        listData.value = response.data.items || []
      } else {
        error.value = response.msg || 'Lỗi khi tải phim bộ'
        listData.value = []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối API'
      error.value = errorMessage
      console.error('Error fetching series movies:', err)
      listData.value = []
    } finally {
      loading.value = false
    }
  }

  // ==================== Methods: Carousel ====================
  const getCarouselData = async (limit: number = 8) => {
    carouselLoading.value = true
    carouselError.value = null

    try {
      const response = (await getCarouselMovies(limit)) as ApiResponse<MovieListResponse>

      if (response.status && response.data) {
        carouselData.value = response.data.items || []
      } else {
        carouselError.value = response.msg || 'Lỗi khi tải carousel'
        carouselData.value = []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối API'
      carouselError.value = errorMessage
      console.error('Error fetching carousel:', err)
      carouselData.value = []
    } finally {
      carouselLoading.value = false
    }
  }

  // ==================== Methods: Search ====================
  const searchMovieData = async (keyword: string, page: number = 1, limit: number = 12) => {
    if (!keyword.trim()) {
      listData.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = (await searchMovies(keyword, page, limit)) as ApiResponse<MovieListResponse>

      if (response.status && response.data) {
        listData.value = response.data.items || []
      } else {
        error.value = response.msg || 'Không tìm thấy phim'
        listData.value = []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tìm kiếm'
      error.value = errorMessage
      console.error('Error searching movies:', err)
      listData.value = []
    } finally {
      loading.value = false
    }
  }

  // ==================== Methods: Category Switching ====================
  const switchCategory = async (category: MovieCategory, page: number = 1) => {
    switch (category) {
      case 'moi':
        await getNewMoviesList(page)
        break
      case 'hoat-hinh':
        await getAnimationMoviesList(page)
        break
      case 'phim-le':
        await getSingleMoviesList(page)
        break
      case 'phim-bo':
        await getSeriesMoviesList(page)
        break
      default:
        await getListData('hot', page)
    }
  }

  // ==================== Methods: Init Config ====================
  const initializeConfig = async () => {
    try {
      const response = (await getHomeData()) as ApiResponse<{
        APP_DOMAIN_CDN_IMAGE: string
      }>

      if (response.status && response.data?.APP_DOMAIN_CDN_IMAGE) {
        imageBaseUrl.value = response.data.APP_DOMAIN_CDN_IMAGE + '/uploads/movies/'
      }
    } catch (err) {
      console.error('Error initializing config:', err)
      // Fallback to default
      imageBaseUrl.value = 'https://ophim1.com/'
    }
  }

  // ==================== Computed ====================
  const hasListData = computed(() => listData.value.length > 0)
  const hasCarouselData = computed(() => carouselData.value.length > 0)

  return {
    // State
    listData,
    carouselData,
    loading,
    carouselLoading,
    error,
    carouselError,
    currentCategory,
    currentPage,
    imageBaseUrl,

    // Methods
    getListData,
    getNewMoviesList,
    getAnimationMoviesList,
    getSingleMoviesList,
    getSeriesMoviesList,
    getCarouselData,
    searchMovieData,
    switchCategory,
    initializeConfig,

    // Computed
    hasListData,
    hasCarouselData,
  }
}
