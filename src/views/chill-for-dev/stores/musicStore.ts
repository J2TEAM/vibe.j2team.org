import { defineStore } from 'pinia'

export interface Track {
  id: string
  title: string
  artist: string
  duration?: string
  durationSec?: number
  source?: string
  /** URL to play (preview mp3 or embed) */
  preview?: string
  /** Album/track cover image */
  cover?: string
  url?: string
}

export interface SavedPlaylist {
  id: number
  url: string
  embedUrl?: string
  platform: string
  name: string
}

export const useMusicStore = defineStore('music', {
  state: () => ({
    searchQuery: '',
    trackList: [] as Track[],
    playlists: [] as SavedPlaylist[],
    /** Track đang phát (click từ search hoặc từ list) */
    currentTrack: null as Track | null,
    isPlaying: false,
  }),

  getters: {
    currentPreviewUrl(state): string {
      return state.currentTrack?.preview ?? ''
    },
  },

  actions: {
    setSearchQuery(q: string) {
      this.searchQuery = q
    },

    addTrack(track: Track) {
      if (!this.trackList.some((t) => t.id === track.id)) {
        this.trackList.push({ ...track })
      }
    },

    addTracks(tracks: Track[]) {
      for (const t of tracks) {
        if (!this.trackList.some((x) => x.id === t.id)) this.trackList.push({ ...t })
      }
    },

    removeTrack(id: string) {
      this.trackList = this.trackList.filter((t) => t.id !== id)
      if (this.currentTrack?.id === id) {
        this.currentTrack = null
        this.isPlaying = false
      }
    },

    addPlaylist(pl: Omit<SavedPlaylist, 'id'>) {
      this.playlists.push({ ...pl, id: Date.now() })
    },

    removePlaylist(id: number) {
      this.playlists = this.playlists.filter((p) => p.id !== id)
    },

    /** Chọn bài để phát; tự thêm vào list nếu chưa có. Player sẽ hiện và phát. */
    playTrack(track: Track) {
      this.addTrack(track)
      this.currentTrack = track
      this.isPlaying = true
    },

    /** Chỉ phát bài, không thêm vào danh sách (dùng cho Chill music popup). */
    playTrackOnly(track: Track) {
      this.currentTrack = track
      this.isPlaying = true
    },

    setPlaying(playing: boolean) {
      this.isPlaying = playing
    },

    stop() {
      this.currentTrack = null
      this.isPlaying = false
    },
  },
})
