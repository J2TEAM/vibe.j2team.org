/* ========================================
   GAME ENGINE — Logic game chính
   ======================================== */
import {
  ACHIEVEMENTS,
  getCareerLevel,
  loadGameData,
  type Achievement,
  type ActiveSkill,
  type Choice,
  type GameDataJson,
  type GameEvent,
  type GameState,
  type PassiveItem,
  type Stats,
} from './data'

export class GameEngine {
  state: GameState | null
  usedEvents: Set<string>
  MAX_AGE: number
  START_AGE: number
  previousSnapshot: { state: GameState; usedEvents: Set<string> } | null
  previewedEvent: GameEvent | null
  _data: GameDataJson | null

  constructor() {
    this.state = null
    this.usedEvents = new Set()
    this.MAX_AGE = 60
    this.START_AGE = 22
    this.previousSnapshot = null
    this.previewedEvent = null
    this._data = null
  }

  async ensureData(): Promise<GameDataJson> {
    if (!this._data) this._data = await loadGameData()
    return this._data
  }

  async newGame(name: string, careerId: string) {
    const data = await this.ensureData()
    const career = data.careers[careerId]
    if (!career) return
    this.usedEvents = new Set()
    this.state = {
      name: name,
      careerId: careerId,
      careerName: career.name,
      careerEmoji: career.emoji,
      age: this.START_AGE,
      year: 1,
      stats: { ...career.startStats },
      history: [],
      currentLevel: career.levels[0]?.title || '',
      salary: career.levels[0]?.salary || 0,
      achievements: [],
      unlockedAchievements: [],
      inventory: [],
      activeSkills: [],
      skillCooldowns: {},
      activeBuffs: [],
      gameOver: false,
    }
    this._addHistory(`🎓 Tốt nghiệp đại học, bắt đầu làm ${career.name}`)
    this._updateCareerLevel()
    return this.state
  }

  getNextEvent(): GameEvent | null {
    if (!this.state || this.state.gameOver || !this._data) return null

    if (this.previewedEvent) {
      const event = this.previewedEvent
      this.previewedEvent = null
      return event
    }

    let event = null

    const milestone = this._data.milestoneEvents.find(
      (e) => e.triggerAge === this.state?.age && !this.usedEvents.has(e.id),
    )
    if (milestone) {
      event = { ...milestone }
    } else {
      const pool = []

      for (const evt of this._data.commonEvents) {
        if (this._isEventValid(evt)) {
          pool.push({ ...evt, source: 'common' })
        }
      }

      const careerEvts = this._data.careerEvents[this.state.careerId] || []
      for (const evt of careerEvts) {
        if (this._isEventValid(evt)) {
          pool.push({ ...evt, source: 'career' })
        }
      }

      if (this._data.dangerousEvents && Math.random() < 0.1) {
        for (const evt of this._data.dangerousEvents) {
          if (this._isEventValid(evt)) {
            pool.push({ ...evt, source: 'dangerous' })
          }
        }
      }

      if (pool.length === 0) {
        event = this._getFallbackEvent()
      } else {
        const totalWeight = pool.reduce((sum, e) => sum + (e.weight || 5), 0)
        let rand = Math.random() * totalWeight
        for (const evt of pool) {
          rand -= evt.weight || 5
          if (rand <= 0) {
            event = evt
            break
          }
        }
        if (!event) event = pool[pool.length - 1]
      }
    }

    if (event) {
      if (event.oneTime || (event.id && event.id.startsWith('ms_'))) {
        this.usedEvents.add(event.id)
      }
    }
    return event ?? null
  }

  applyChoice(choice: Choice) {
    if (!this.state) return {}

    this.previousSnapshot = {
      state: JSON.parse(JSON.stringify(this.state)),
      usedEvents: new Set(this.usedEvents),
    }

    const resolvedEffects: Partial<Record<keyof Stats, number>> = {}
    let hasDoublePositive = false
    if (
      this.state?.activeBuffs &&
      this.state.activeBuffs.find((b: { type: string }) => b.type === 'double_positive')
    ) {
      hasDoublePositive = true
    }

    for (const [key, value] of Object.entries(choice.effects || {})) {
      let val = value as number
      if (Array.isArray(value)) {
        val = Math.round(value[0] + Math.random() * (value[1] - value[0]))
      }

      if (hasDoublePositive) {
        if ((key === 'stress' && val < 0) || (key !== 'stress' && val > 0)) {
          val *= 2
        }
      }

      resolvedEffects[key] = val
    }

    for (const [key, value] of Object.entries(resolvedEffects)) {
      if (this.state.stats[key] !== undefined) {
        this.state.stats[key] = Math.max(
          0,
          Math.min(100, this.state.stats[key] + (value as number)),
        )
      }
    }

    let resultText = choice.result
    if (!resultText) {
      const moneyChange = resolvedEffects.money || 0
      if (moneyChange > 10) resultText = 'Kết quả tốt hơn mong đợi!'
      else if (moneyChange < -10) resultText = 'Kết quả không như mong muốn...'
      else resultText = 'Mọi thứ diễn ra bình thường.'
    }

    this._addHistory(`${choice.icon || '📌'} ${choice.text}`)
    this._updateCareerLevel()
    this._applyItemPassiveEffects()
    this._updateSkillCooldowns()
    this._applyPassiveEffects()

    const gameOverCheck = this._checkGameOver()
    const newAchievements = this._checkAchievements()

    if (choice.isGameOver && choice.gameOverReason) {
      this.state.gameOver = true
      this.state.gameOverInfo = choice.gameOverReason
      return {
        effects: resolvedEffects,
        resultText: resultText,
        gameOver: choice.gameOverReason,
        newAchievements: newAchievements,
      }
    }

    this.state.age++
    this.state.year++

    return {
      effects: resolvedEffects,
      resultText: resultText,
      gameOver: gameOverCheck,
      newAchievements: newAchievements,
    }
  }

  _checkAchievements() {
    const newlyUnlocked: Achievement[] = []
    if (!this.state || this.state.gameOver) return newlyUnlocked

    for (const ach of ACHIEVEMENTS) {
      if (!this.state.unlockedAchievements.includes(ach.id)) {
        if (ach.condition(this.state.stats, this)) {
          this.state.unlockedAchievements.push(ach.id)
          this.state.achievements.push({
            age: this.state.age,
            text: `🏆 Thành tựu: ${ach.title}`,
          })
          newlyUnlocked.push(ach)
        }
      }
    }
    return newlyUnlocked
  }

  _isEventValid(evt: GameEvent) {
    if (this._isEventImmune(evt.id)) return false
    if (evt.oneTime && this.usedEvents.has(evt.id)) return false
    if (evt.minAge && this.state && this.state.age < evt.minAge) return false
    if (evt.maxAge && this.state && this.state.age > evt.maxAge) return false
    if (evt.condition && this.state && !evt.condition(this.state.stats)) return false
    return true
  }

  _getFallbackEvent(): GameEvent {
    return {
      id: 'fallback_' + (this.state?.age || 0),
      type: '☀️ Ngày thường',
      title: 'Một năm bình yên',
      description: 'Năm nay không có gì đặc biệt. Cuộc sống trôi qua nhẹ nhàng.',
      choices: [
        {
          text: 'Làm việc chăm chỉ',
          icon: '💪',
          hint: 'Tích lũy kỹ năng',
          effects: { skill: 5, money: 3, stress: 3 },
          result: 'Một năm làm việc hiệu quả!',
        },
        {
          text: 'Tận hưởng cuộc sống',
          icon: '🎶',
          hint: 'Vui vẻ, thư giãn',
          effects: { happiness: 8, stress: -5, relationships: 5 },
          result: 'Năm nay bạn sống rất vui!',
        },
      ],
    }
  }

  _updateCareerLevel() {
    if (!this.state || !this._data) return
    const level = getCareerLevel(this.state.careerId, this.state.stats.skill, this._data.careers)
    if (level && level.title !== this.state.currentLevel) {
      const oldLevel = this.state.currentLevel
      this.state.currentLevel = level.title
      this.state.salary = level.salary
      this._addHistory(`⬆️ Thăng tiến: ${oldLevel} → ${level.title}`)
      this.state.achievements.push({ age: this.state.age, text: `Đạt ${level.title}` })
    }
  }

  _applyPassiveEffects() {
    if (!this.state) return
    const salaryBonus = Math.round(this.state.salary / 10)
    this.state.stats.money = Math.min(100, this.state.stats.money + salaryBonus)
    if (this.state.stats.stress > 70)
      this.state.stats.health = Math.max(0, this.state.stats.health - 3)
    if (this.state.stats.health < 30)
      this.state.stats.happiness = Math.max(0, this.state.stats.happiness - 3)
    if (this.state.age > 45) this.state.stats.health = Math.max(0, this.state.stats.health - 1)
  }

  _checkGameOver() {
    if (!this.state) return null
    if (this.state.age >= this.MAX_AGE) {
      this.state.gameOver = true
      const res = { reason: 'age', message: 'Bạn đã đến tuổi nghỉ hưu!' }
      this.state.gameOverInfo = res
      return res
    }
    if (this.state.stats.health <= 0) {
      this.state.gameOver = true
      const res = { reason: 'health', message: 'Sức khỏe của bạn kiệt quệ...' }
      this.state.gameOverInfo = res
      return res
    }
    if (this.state.stats.happiness <= 0 && this.state.stats.stress >= 100) {
      this.state.gameOver = true
      const res = { reason: 'burnout', message: 'Bạn hoàn toàn kiệt sức và mất niềm vui sống...' }
      this.state.gameOverInfo = res
      return res
    }
    return null
  }

  async changeCareer(newCareerId: string) {
    const data = await this.ensureData()
    const career = data.careers[newCareerId]
    if (!career || !this.state) return
    this.state.careerId = newCareerId
    this.state.careerName = career.name
    this.state.careerEmoji = career.emoji
    this.state.stats.skill = Math.max(20, this.state.stats.skill - 15)
    this._updateCareerLevel()
    this._addHistory(`🔄 Chuyển sang ngành ${career.name}`)
  }

  clearSave() {
    localStorage.removeItem('ngare_save')
  }

  calculateEnding() {
    if (!this.state) return null
    const s = this.state.stats
    const total = s.money + s.skill + s.happiness + s.health + s.relationships - s.stress
    let title: string, icon: string, subtitle: string
    if (total >= 350) {
      title = 'Cuộc Đời Viên Mãn'
      icon = '🏆'
      subtitle = 'Bạn đã sống một cuộc đời trọn vẹn, cân bằng và hạnh phúc!'
    } else if (total >= 280) {
      title = 'Cuộc Đời Thành Công'
      icon = '⭐'
      subtitle = 'Bạn đạt được nhiều thành tựu đáng tự hào!'
    } else if (total >= 200) {
      title = 'Cuộc Đời Bình Dị'
      icon = '🌿'
      subtitle = 'Cuộc sống bình thường nhưng ý nghĩa theo cách riêng.'
    } else if (total >= 120) {
      title = 'Cuộc Đời Gập Ghềnh'
      icon = '🌧️'
      subtitle = 'Nhiều khó khăn nhưng bạn vẫn vượt qua.'
    } else {
      title = 'Cuộc Đời Đầy Thử Thách'
      icon = '💔'
      subtitle = 'Cuộc sống không dễ dàng, nhưng bạn đã cố gắng.'
    }
    return { title, icon, subtitle, total, stats: { ...s } }
  }

  _addHistory(text: string) {
    if (!this.state) return
    this.state.history.push({
      age: this.state.age,
      year: this.state.year,
      text: text,
    })
  }

  _applyItemPassiveEffects() {
    if (!this.state || !this.state.inventory || !this._data) return
    for (const itemId of this.state.inventory) {
      const item = this._data.passiveItems.find((i) => i.id === itemId)
      if (item && item.effect) {
        for (const [key, value] of Object.entries(item.effect)) {
          if (this.state.stats[key] !== undefined) {
            this.state.stats[key] = Math.max(
              0,
              Math.min(100, this.state.stats[key] + (value as number)),
            )
          }
        }
      }
    }
  }

  _updateSkillCooldowns() {
    if (!this.state || !this.state.skillCooldowns) return
    for (const skillId in this.state.skillCooldowns) {
      const cooldown = this.state.skillCooldowns[skillId]
      if (cooldown !== undefined && cooldown > 0) this.state.skillCooldowns[skillId] = cooldown - 1
    }
    if (this.state?.activeBuffs) {
      this.state.activeBuffs = this.state.activeBuffs.filter(
        (buff: { type: string; duration: number }) => {
          buff.duration--
          return buff.duration > 0
        },
      )
    }
  }

  _isEventImmune(eventId: string) {
    if (!this.state || !this._data) return false
    for (const itemId of this.state.inventory || []) {
      const item = this._data.passiveItems.find((i) => i.id === itemId)
      if (item && item.immunity && item.immunity.includes(eventId)) return true
    }
    if (this.state.activeBuffs) {
      const immunityBuff = this.state.activeBuffs.find(
        (b: { type: string }) => b.type === 'immunity_danger',
      )
      if (immunityBuff && eventId.startsWith('danger_')) {
        return true
      }
    }
    return false
  }

  hasSave() {
    return !!localStorage.getItem('ngare_save')
  }

  saveGame() {
    if (!this.state) return false
    localStorage.setItem(
      'ngare_save',
      JSON.stringify({ state: this.state, used: [...this.usedEvents] }),
    )
    return true
  }

  async buyItem(itemId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const item = data.passiveItems.find((i: PassiveItem) => i.id === itemId)
    if (!item) return { success: false, message: 'Vật phẩm không tồn tại' }
    if (this.state.stats.money < item.cost) return { success: false, message: 'Không đủ tiền!' }
    if (this.state.inventory.includes(itemId))
      return { success: false, message: 'Bạn đã sở hữu vật phẩm này' }

    this.state.stats.money -= item.cost
    this.state.inventory.push(itemId)
    this._addHistory(`🛒 Đã mua: ${item.name}`)
    return { success: true, message: `Bạn đã mua ${item.name}!` }
  }

  async buySkill(skillId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const skill = data.activeSkills.find((s: ActiveSkill) => s.id === skillId)
    if (!skill) return { success: false, message: 'Kỹ năng không tồn tại' }
    if (this.state.stats.money < skill.cost) return { success: false, message: 'Không đủ tiền!' }
    if (this.state.activeSkills.includes(skillId))
      return { success: false, message: 'Bạn đã mở khóa kỹ năng này' }

    this.state.stats.money -= skill.cost
    this.state.activeSkills.push(skillId)
    this.state.skillCooldowns[skillId] = 0
    this._addHistory(`🔮 Đã học kỹ năng: ${skill.name}`)
    return { success: true, message: `Đã mở khóa ${skill.name}!` }
  }

  async useSkill(skillId: string) {
    if (!this.state) return { success: false, message: 'Game chưa bắt đầu' }
    const data = await this.ensureData()
    const skill = data.activeSkills.find((s) => s.id === skillId)
    if (!skill) return { success: false, message: 'Kỹ năng không tồn tại' }
    if (!this.state.activeSkills.includes(skillId))
      return { success: false, message: 'Bạn chưa mở khóa kỹ năng này' }

    const cooldown: number = this.state.skillCooldowns[skillId] ?? 0
    if (cooldown > 0) return { success: false, message: `Còn ${cooldown} năm nữa mới dùng được` }

    const result: {
      message?: string
      previewEvent?: GameEvent | null
      skill?: ActiveSkill
      isPreview?: boolean
    } = {}
    switch (skill.effect) {
      case 'reset_stress':
        this.state.stats.stress = 0
        result.message = 'Stress đã được đặt về 0!'
        break
      case 'double_positive_effects':
        this.state.activeBuffs.push({ type: 'double_positive', duration: 1 })
        result.message = 'Lựa chọn tiếp theo sẽ nhận gấp đôi hiệu ứng tích cực!'
        break
      case 'immunity_next_danger':
        this.state.activeBuffs.push({ type: 'immunity_danger', duration: 1 })
        result.message = 'Bạn sẽ miễn nhiễm sự kiện nguy hiểm tiếp theo!'
        break
      case 'preview_choices': {
        const previewEvent = this.getNextEvent()
        if (previewEvent) {
          result.message = 'Bạn nhìn thấy tương lai...'
          result.previewEvent = previewEvent
          this.previewedEvent = previewEvent
          this.state.skillCooldowns[skillId] = 0
          this._addHistory(`🔮 Sử dụng ${skill.name}`)
          return { success: true, ...result, skill, isPreview: true }
        } else {
          result.message = 'Không thể nhìn thấy tương lai lúc này!'
        }
        break
      }
      case 'undo_last_choice':
        if (this.previousSnapshot) {
          this.state = JSON.parse(JSON.stringify(this.previousSnapshot.state))
          this.usedEvents = new Set(this.previousSnapshot.usedEvents)
          result.message = 'Bạn đã quay về quá khứ! Lựa chọn trước đó đã bị hoàn tác.'
        } else {
          result.message = 'Không có gì để hoàn tác!'
          this.state.skillCooldowns[skillId] = 0
          return { success: false, message: result.message }
        }
        break
      case 'boost_relationships':
        this.state.stats.relationships = Math.min(100, this.state.stats.relationships + 25)
        result.message = 'Quan hệ xã hội tăng 25 điểm!'
        break
      case 'risk_money':
        this.state.stats.money = Math.min(100, this.state.stats.money + 30)
        this.state.stats.stress = Math.min(100, this.state.stats.stress + 15)
        result.message = 'Tài chính +30 nhưng Căng thẳng +15!'
        break
      case 'boost_skill':
        this.state.stats.skill = Math.min(100, this.state.stats.skill + 20)
        this.state.stats.stress = Math.max(0, this.state.stats.stress - 10)
        result.message = 'Kỹ năng +20 và Căng thẳng -10!'
        break
      case 'boost_health':
        this.state.stats.health = Math.min(100, this.state.stats.health + 20)
        this.state.stats.happiness = Math.min(100, this.state.stats.happiness + 15)
        result.message = 'Sức khỏe +20 và Hạnh phúc +15!'
        break
      default:
        result.message = 'Kỹ năng đã được kích hoạt!'
    }

    if (this.state) {
      this.state.skillCooldowns[skillId] = skill.cooldown
      this._addHistory(`⚡ Sử dụng ${skill.name}`)
    }
    return { success: true, ...result, skill }
  }

  loadGame() {
    const raw = localStorage.getItem('ngare_save')
    if (!raw) return null
    const data = JSON.parse(raw)
    this.state = data.state
    this.usedEvents = new Set(data.used || [])
    return this.state
  }
}
