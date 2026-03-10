/**
 * Composable: useMovieDetail
 * Manages movie detail, episodes, actors and video playback
 */

import { ref, computed } from 'vue'
import type { Movie, Actor, Episode, EpisodeData } from '../types'
import type { ApiResponse } from '../utils/api'
import { getMovieDetailWithEpisodes, getMovieActors } from '../utils/api'

export interface MovieDetailResponse {
  item: Movie
  episodes: Episode[]
}

export function useMovieDetail() {
  // ==================== State ====================
  const movieDetail = ref<Movie | null>(null)
  const episodes = ref<Episode[]>([])
  const actors = ref<Actor[] | null>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Video player state
  const selectedEpisodeGroup = ref<Record<number, number>>({}) // {groupIndex: selectedServerIndex}
  const currentM3u8Url = ref<string>('')

  // ==================== Methods: Fetch Movie Detail ====================
  const fetchMovieDetail = async (slug: string) => {
    loading.value = true
    error.value = null

    try {
      const response = (await getMovieDetailWithEpisodes(slug)) as ApiResponse<MovieDetailResponse>

      if (response.status && response.data) {
        const { item } = response.data
        movieDetail.value = item || null

        if (item && item.episodes && Array.isArray(item.episodes)) {
          episodes.value = item.episodes
          // Initialize selected server for each episode group
          item.episodes.forEach((_, idx) => {
            selectedEpisodeGroup.value[idx] = 0 // Default to first server
          })
        }
      } else {
        error.value = response.msg || 'Không thể tải chi tiết phim'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối API'
      error.value = errorMessage
      console.error('Error fetching movie detail:', err)
    } finally {
      loading.value = false
    }
  }

  // ==================== Methods: Fetch Actors ====================
  const fetchMovieActors = async (slug: string) => {
    try {
      const response = (await getMovieActors(slug)) as ApiResponse<{ peoples: Actor[] }>

      if (response.status && response.data?.peoples) {
        actors.value = response.data.peoples
      } else {
        actors.value = []
      }
    } catch (err) {
      console.error('Error fetching movie actors:', err)
      actors.value = []
    }
  }

  // ==================== Methods: Video Player ====================
  /**
   * Select an episode and get its streaming URL
   * @param groupIndex - Episode group index
   * @param episodeIndex - Episode index within the group
   */
  const selectEpisode = (groupIndex: number, episodeIndex: number = 0) => {
    if (!episodes.value[groupIndex]) return

    const episodeGroup = episodes.value[groupIndex]

    if (episodeGroup.server_data && episodeGroup.server_data[episodeIndex]) {
      const episodeData = episodeGroup.server_data[episodeIndex]
      // Use M3U8 link for HLS streaming
      currentM3u8Url.value = episodeData.link_embed || episodeData.link_m3u8 || ''
    }
  }

  /**
   * Change server for current episode group
   * @param groupIndex - Episode group index
   * @param serverIndex - Server index
   */
  const changeServer = (groupIndex: number, serverIndex: number) => {
    selectedEpisodeGroup.value[groupIndex] = serverIndex
    // Refresh current episode if in same group
    if (episodes.value[groupIndex]?.server_data?.[0]) {
      selectEpisode(groupIndex, 0)
    }
  }

  // ==================== Computed ====================
  const hasEpisodes = computed(() => episodes.value.length > 0)
  const hasActors = computed(() => actors.value && actors.value.length > 0)
  const totalEpisodes = computed(() => {
    return episodes.value.reduce((sum, group) => {
      return sum + (group.server_data?.length || 0)
    }, 0)
  })

  /**
   * Get all episodes from current selected servers (flat list)
   */
  const allEpisodesFlat = computed(() => {
    const result: Array<
      EpisodeData & { serverName: string; groupIndex: number; episodeIndex: number }
    > = []

    episodes.value.forEach((episodeGroup, groupIdx) => {
      if (episodeGroup.server_data) {
        episodeGroup.server_data.forEach((episode, epIdx) => {
          result.push({
            ...episode,
            serverName: episodeGroup.server_name,
            groupIndex: groupIdx,
            episodeIndex: epIdx,
          })
        })
      }
    })

    return result
  })

  return {
    // State
    movieDetail,
    episodes,
    actors,
    loading,
    error,
    currentM3u8Url,
    selectedEpisodeGroup,

    // Methods
    fetchMovieDetail,
    fetchMovieActors,
    selectEpisode,
    changeServer,

    // Computed
    hasEpisodes,
    hasActors,
    totalEpisodes,
    allEpisodesFlat,
  }
}
