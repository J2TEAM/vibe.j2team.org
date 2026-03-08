import type { Player } from '../entities/Player'
import type { Boss } from '../entities/Boss'

export class HUD {
  private ctx: CanvasRenderingContext2D
  private width: number
  timer = 300
  private timerAccum = 0
  levelName = ''

  constructor(ctx: CanvasRenderingContext2D, width: number) {
    this.ctx = ctx
    this.width = width
  }

  update() {
    this.timerAccum++
    if (this.timerAccum >= 60) {
      this.timerAccum = 0
      if (this.timer > 0) this.timer--
    }
  }

  resetTimer() {
    this.timer = 300
    this.timerAccum = 0
  }

  drawGameHUD(player: Player, boss: Boss | null) {
    const ctx = this.ctx
    ctx.save()

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, this.width, 40)

    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = '#FFF'

    // Score
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE`, 10, 15)
    ctx.fillText(`${player.score.toString().padStart(6, '0')}`, 10, 32)

    // Coins
    ctx.fillStyle = '#FFD700'
    ctx.fillText(`x${player.coins.toString().padStart(2, '0')}`, 120, 32)
    ctx.fillStyle = '#FFF'
    ctx.fillText('COINS', 120, 15)

    // Level name
    ctx.textAlign = 'center'
    ctx.fillText(this.levelName, this.width / 2, 15)

    // Timer
    ctx.textAlign = 'right'
    ctx.fillText('TIME', this.width - 80, 15)
    ctx.fillStyle = this.timer < 60 ? '#FF4444' : '#FFF'
    ctx.fillText(`${this.timer}`, this.width - 80, 32)

    // Lives
    ctx.fillStyle = '#FFF'
    ctx.fillText(`LIVES x${player.lives}`, this.width - 10, 32)

    // Boss HP bar
    if (boss && boss.active && !boss.defeated) {
      const barW = 200
      const barH = 12
      const barX = (this.width - barW) / 2
      const barY = 26

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4)

      ctx.fillStyle = '#333'
      ctx.fillRect(barX, barY, barW, barH)

      const hpRatio = boss.hp / boss.maxHp
      const hpColor = hpRatio > 0.5 ? '#00CC00' : hpRatio > 0.25 ? '#FFAA00' : '#FF0000'
      ctx.fillStyle = hpColor
      ctx.fillRect(barX, barY, barW * hpRatio, barH)

      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('BOWSER', this.width / 2, barY - 4)
    }

    ctx.restore()
  }

  drawTitleScreen(muted: boolean) {
    const ctx = this.ctx
    const h = ctx.canvas.height

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, this.width, h)

    // Sky gradient effect
    ctx.fillStyle = '#1a0a3e'
    ctx.fillRect(0, 0, this.width, h * 0.6)

    // Title
    ctx.save()
    ctx.font = 'bold 48px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#E52521'
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 10
    ctx.fillText('SUPER MARIO', this.width / 2, h * 0.25)

    ctx.font = 'bold 24px monospace'
    ctx.fillStyle = '#FFD700'
    ctx.fillText('BOSS BATTLE EDITION', this.width / 2, h * 0.33)

    // Blinking "Press Enter"
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = '18px monospace'
      ctx.fillStyle = '#FFF'
      ctx.fillText('Press ENTER or tap to start', this.width / 2, h * 0.55)
    }

    ctx.font = '14px monospace'
    ctx.fillStyle = '#AAA'
    ctx.fillText('Controls: Arrow Keys / WASD + Space', this.width / 2, h * 0.68)
    ctx.fillText('Mobile: Touch controls', this.width / 2, h * 0.73)

    ctx.font = '12px monospace'
    ctx.fillStyle = '#888'
    ctx.fillText(`Sound: ${muted ? 'OFF' : 'ON'} (press M to toggle)`, this.width / 2, h * 0.82)

    ctx.font = '12px monospace'
    ctx.fillStyle = '#666'
    ctx.fillText('Made by uydev | vibe.j2team.org', this.width / 2, h * 0.92)

    ctx.restore()
  }

  drawGameOver(score: number) {
    const ctx = this.ctx
    const h = ctx.canvas.height

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, this.width, h)

    ctx.save()
    ctx.textAlign = 'center'

    ctx.font = 'bold 48px monospace'
    ctx.fillStyle = '#E52521'
    ctx.fillText('GAME OVER', this.width / 2, h * 0.35)

    ctx.font = '20px monospace'
    ctx.fillStyle = '#FFF'
    ctx.fillText(`Final Score: ${score}`, this.width / 2, h * 0.48)

    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = '16px monospace'
      ctx.fillStyle = '#AAA'
      ctx.fillText('Press ENTER to retry', this.width / 2, h * 0.62)
    }

    ctx.restore()
  }

  drawVictory(score: number) {
    const ctx = this.ctx
    const h = ctx.canvas.height

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, this.width, h)

    ctx.save()
    ctx.textAlign = 'center'

    ctx.font = 'bold 40px monospace'
    ctx.fillStyle = '#FFD700'
    ctx.fillText('YOU WIN!', this.width / 2, h * 0.25)

    ctx.font = '24px monospace'
    ctx.fillStyle = '#FFF'
    ctx.fillText('Bowser has been defeated!', this.width / 2, h * 0.38)

    ctx.font = '20px monospace'
    ctx.fillStyle = '#FFD700'
    ctx.fillText(`Final Score: ${score}`, this.width / 2, h * 0.5)

    // Stars animation
    const time = Date.now() / 1000
    for (let i = 0; i < 5; i++) {
      const sx = this.width / 2 + Math.cos(time * 2 + i * 1.2) * 120
      const sy = h * 0.15 + Math.sin(time * 3 + i * 0.8) * 30
      ctx.font = '20px monospace'
      ctx.fillStyle = '#FFD700'
      ctx.fillText('*', sx, sy)
    }

    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = '16px monospace'
      ctx.fillStyle = '#AAA'
      ctx.fillText('Press ENTER to play again', this.width / 2, h * 0.65)
    }

    ctx.font = '14px monospace'
    ctx.fillStyle = '#888'
    ctx.fillText('Thank you for playing!', this.width / 2, h * 0.78)
    ctx.fillText('Made by uydev', this.width / 2, h * 0.85)

    ctx.restore()
  }

  drawLevelTransition(levelName: string) {
    const ctx = this.ctx
    const h = ctx.canvas.height

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, this.width, h)

    ctx.save()
    ctx.textAlign = 'center'

    ctx.font = 'bold 32px monospace'
    ctx.fillStyle = '#FFF'
    ctx.fillText(levelName, this.width / 2, h * 0.45)

    ctx.font = '16px monospace'
    ctx.fillStyle = '#AAA'
    ctx.fillText('Get Ready!', this.width / 2, h * 0.55)

    ctx.restore()
  }
}
