import { defineStore } from 'pinia'
import { rules } from './rules'
import type { FormState } from './rules'

export const useGameStore = defineStore('theFormGame', {
  state: () => ({
    form: {
      username: '',
      password: '',
      email: '',
      bio: '',
    } as FormState,
    visibleRuleCount: 1,
    gameWon: false,
    captchaRequested: false,

    // Verification Mode
    verificationSeed: 0,
    activeChallenges: [] as string[],
    currentChallengeIndex: 0,
    hasBeenTrolled: false,
    fullyVerified: false,
  }),
  getters: {
    activeRules(state) {
      return rules.slice(0, state.visibleRuleCount)
    },
    failedRules(state): number[] {
      const failed: number[] = []
      this.activeRules.forEach((r) => {
        if (!r.validator(state.form)) {
          failed.push(r.id)
        }
      })
      return failed
    },
    allRulesPassed(_state): boolean {
      return this.failedRules.length === 0
    },
  },
  actions: {
    checkRules() {
      // Nếu tất cả rule đang hiển thị hiện tại đã thoả mãn, mở khoá rule tiếp theo
      while (this.failedRules.length === 0 && this.visibleRuleCount < rules.length) {
        this.visibleRuleCount++
      }
      if (this.failedRules.length === 0 && this.visibleRuleCount === rules.length) {
        this.gameWon = true
      }
    },
    triggerCaptcha() {
      this.captchaRequested = true
      this.verificationSeed = Date.now() + navigator.userAgent.length + window.innerWidth
      this.generateChallenges()
    },
    generateChallenges() {
      const allChallenges = ['reaction', 'typing', 'timing', 'mouse']
      const newChallenges: string[] = []

      // Seeded random
      const seededRandom = (s: number) => {
        const x = Math.sin(s) * 10000
        return x - Math.floor(x)
      }

      for (let i = 0; i < 3; i++) {
        const index = Math.floor(seededRandom(this.verificationSeed + i) * allChallenges.length)
        newChallenges.push(allChallenges[index] as string)
      }

      this.activeChallenges = newChallenges
      this.currentChallengeIndex = 0
    },
    passCurrentChallenge() {
      if (this.currentChallengeIndex < this.activeChallenges.length - 1) {
        this.currentChallengeIndex++
      } else {
        // Passed all 3
        if (!this.hasBeenTrolled) {
          this.hasBeenTrolled = true
          // Regenerate new seed and challenges
          this.verificationSeed += 1000
          this.generateChallenges()
        } else {
          this.fullyVerified = true
        }
      }
    },
  },
})
