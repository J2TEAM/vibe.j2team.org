import { defineStore } from 'pinia'

export type BackgroundType = 'image' | 'gif' | 'video'

const BG_STORAGE = 'chill-for-dev-bg'
const BG_TYPE_STORAGE = 'chill-for-dev-bg-type'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    backgroundType: (typeof localStorage !== 'undefined'
      ? (localStorage.getItem(BG_TYPE_STORAGE) as BackgroundType | null) || null
      : null) as BackgroundType | null,
    background:
      (typeof localStorage !== 'undefined' ? localStorage.getItem(BG_STORAGE) : null) || '',
  }),

  actions: {
    setBackground(url: string, type: BackgroundType) {
      this.background = url
      this.backgroundType = type
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BG_STORAGE, url)
        localStorage.setItem(BG_TYPE_STORAGE, type)
      }
    },

    clearBackground() {
      this.background = ''
      this.backgroundType = null
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(BG_STORAGE)
        localStorage.removeItem(BG_TYPE_STORAGE)
      }
    },
  },
})
