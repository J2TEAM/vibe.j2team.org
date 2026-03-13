import { defineStore } from 'pinia'

export type GameStage = 'ready' | 'playing'

export const useGameStore = defineStore('game', {
  state: () => ({
    tankSpeed: 0,
    gateLeftDistance: 0,
    gateRightDistance: 0,
    isTankHit: false,
    stage: 'ready' as GameStage,
    isAnimationDone: false,
    isGateLeftDone: false,
    isGateRightDone: false,
    isTankDone: false,
  }),

  actions: {
    setIsTankHit(isHit: boolean) {
      this.isTankHit = isHit
    },
    setGateLeftDistance(distance: number) {
      this.gateLeftDistance = distance
    },
    setGateRightDistance(distance: number) {
      this.gateRightDistance = distance
    },
    setTankSpeed(speed: number) {
      this.tankSpeed = speed
    },
    setStage(stage: GameStage) {
      this.stage = stage
    },
    setIsAnimationDone(isDone: boolean) {
      this.isAnimationDone = isDone
    },
    setIsGateLeftDone(isDone: boolean) {
      this.isGateLeftDone = isDone
    },
    setIsGateRightDone(isDone: boolean) {
      this.isGateRightDone = isDone
    },
    setIsTankDone(isDone: boolean) {
      this.isTankDone = isDone
    },
  },
})
