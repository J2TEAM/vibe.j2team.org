import { defineStore } from 'pinia'

export const useAmbienceStore = defineStore('ambience', {
  state: () => ({
    rain: 0,
    birds: 0,
    keyboard: 0,
  }),

  actions: {
    setRain(v: number) {
      this.rain = v
    },
    setBirds(v: number) {
      this.birds = v
    },
    setKeyboard(v: number) {
      this.keyboard = v
    },
  },
})
