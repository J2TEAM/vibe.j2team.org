import { defineStore } from 'pinia'

export const useYouStore = defineStore('you', {
  state: () => ({
    uid: '',
    name: '',
    maxGateLeftDistance: 0,
    maxGateRightDistance: 0,
    maxTankSpeed: 0,
  }),

  actions: {
    setUid(uid: string) {
      this.uid = uid
    },
    setName(name: string) {
      this.name = name
    },
    setMaxGateLeftDistance(maxGateLeftDistance: number) {
      this.maxGateLeftDistance = maxGateLeftDistance
    },
    setMaxGateRightDistance(maxGateRightDistance: number) {
      this.maxGateRightDistance = maxGateRightDistance
    },
    setMaxTankSpeed(maxTankSpeed: number) {
      this.maxTankSpeed = maxTankSpeed
    },
  },
})
