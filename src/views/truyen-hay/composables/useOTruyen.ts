import { ref } from 'vue'
import type { OTruyenResponse, ComicDetail } from '../types'

export function useOTruyen() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // otruyen uses sv1.otruyencdn.com usually for images
  const IMAGE_URL_BASE = ref('https://img.otruyenapi.com/uploads/comics/')

  const buildUrl = (path: string) => `https://otruyenapi.com/v1/api/${path}`

  const fetchAPI = async <T>(url: string): Promise<T | null> => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      const resData = await response.json()

      // Update image CDN domain if provided by api
      if (resData.data && resData.data.APP_DOMAIN_CDN_IMAGE) {
        IMAGE_URL_BASE.value = resData.data.APP_DOMAIN_CDN_IMAGE + '/uploads/comics/'
      }
      return resData
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Lỗi kết nối Server OTruyen'
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  const getRecentComics = (page = 1) => {
    return fetchAPI<OTruyenResponse>(buildUrl(`danh-sach/truyen-moi?page=${page}`))
  }

  const getComingSoonComics = (page = 1) => {
    return fetchAPI<OTruyenResponse>(buildUrl(`danh-sach/sap-ra-mat?page=${page}`))
  }

  const getComicsByCategory = (categorySlug: string, page = 1) => {
    return fetchAPI<OTruyenResponse>(buildUrl(`the-loai/${categorySlug}?page=${page}`))
  }

  const getComicDetail = (slug: string) => {
    return fetchAPI<{ status: string; data: ComicDetail }>(buildUrl(`truyen-tranh/${slug}`))
  }

  // otruyen api search often looks like: https://otruyenapi.com/v1/api/tim-kiem?keyword=abc
  const searchComics = (keyword: string, page = 1) => {
    return fetchAPI<OTruyenResponse>(
      buildUrl(`tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`),
    )
  }

  const getChapterData = async (chapterApiData: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(chapterApiData)
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
      const resData = await response.json()
      return resData
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Lỗi kết nối lấy hình ảnh truyện'
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    IMAGE_URL_BASE,
    getRecentComics,
    getComingSoonComics,
    getComicsByCategory,
    getComicDetail,
    searchComics,
    getChapterData,
  }
}
