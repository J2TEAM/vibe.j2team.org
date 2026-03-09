import { TILE_SIZE, overlaps } from './Physics'
import { Input } from './Input'
import { Camera } from './Camera'
import { Renderer } from '../rendering/Renderer'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { Boss } from '../entities/Boss'
import { Item } from '../entities/Item'
import { Level } from '../world/Level'
import { levels } from '../world/levels'
import { SoundFX } from '../audio/SoundFX'
import { HUD } from '../ui/HUD'
import { FLAG } from '../world/Tile'

export type GameState = 'title' | 'playing' | 'level_transition' | 'game_over' | 'victory'

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private renderer: Renderer
  private input: Input
  private camera: Camera
  private hud: HUD
  private sfx: SoundFX

  private player!: Player
  private enemies: Enemy[] = []
  private items: Item[] = []
  private boss: Boss
  private level!: Level
  private currentLevel = 0

  state: GameState = 'title'
  private transitionTimer = 0
  private gameOverTimer = 0
  private rafId = 0
  private running = false
  private handleMuteKey: (e: KeyboardEvent) => void

  width: number
  height: number

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height

    this.renderer = new Renderer(this.ctx, this.width, this.height)
    this.input = new Input()
    this.camera = new Camera(this.width, this.height)
    this.hud = new HUD(this.ctx, this.width)
    this.sfx = new SoundFX()
    this.boss = new Boss()

    // Mute toggle
    this.handleMuteKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        this.sfx.toggleMute()
      }
    }
    window.addEventListener('keydown', this.handleMuteKey)
  }

  start() {
    this.running = true
    this.state = 'title'
    this.loop()
  }

  stop() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.sfx.stopBGM()
    this.input.destroy()
    window.removeEventListener('keydown', this.handleMuteKey)
  }

  resize(w: number, h: number) {
    this.width = w
    this.height = h
    this.canvas.width = w
    this.canvas.height = h
    this.renderer = new Renderer(this.ctx, w, h)
    this.camera = new Camera(w, h)
    this.hud = new HUD(this.ctx, w)
  }

  // Touch control helpers
  setTouchLeft(v: boolean) {
    this.input.touchLeft = v
  }
  setTouchRight(v: boolean) {
    this.input.touchRight = v
  }
  setTouchJump(v: boolean) {
    this.input.setTouchJump(v)
  }
  handleTap() {
    if (this.state === 'title' || this.state === 'game_over' || this.state === 'victory') {
      this.input.keys['Enter'] = true
      this.input.keys['Enter'] = true
      // Simulate just pressed
      setTimeout(() => {
        this.input.keys['Enter'] = false
      }, 100)
    }
  }

  toggleMute(): boolean {
    return this.sfx.toggleMute()
  }

  get isMuted(): boolean {
    return this.sfx.isMuted
  }

  private loadLevel(index: number) {
    const data = levels[index]!
    this.level = new Level(data)
    this.enemies = data.enemies.map((e) => new Enemy(e.type, e.x, e.y))
    this.items = data.items.map((i) => new Item(i.type, i.x, i.y))
    this.hud.levelName = data.name
    this.hud.resetTimer()

    if (!this.player) {
      this.player = new Player(data.playerStart.x, data.playerStart.y)
    } else {
      this.player.reset(data.playerStart.x, data.playerStart.y)
    }

    this.boss = new Boss()
    if (data.hasBoss) {
      this.boss.spawn(22, 11) // Boss position in arena
      this.sfx.bossRoar()
    }
  }

  private startGame() {
    this.currentLevel = 0
    this.player = undefined!
    this.loadLevel(0)
    this.player.lives = 3
    this.player.score = 0
    this.player.coins = 0
    this.state = 'level_transition'
    this.transitionTimer = 120
    this.sfx.startBGM()
  }

  private nextLevel() {
    this.currentLevel++
    if (this.currentLevel >= levels.length) {
      this.state = 'victory'
      this.sfx.stopBGM()
      this.sfx.victory()
      return
    }
    const score = this.player.score
    const coins = this.player.coins
    const lives = this.player.lives
    this.loadLevel(this.currentLevel)
    this.player.score = score
    this.player.coins = coins
    this.player.lives = lives
    this.state = 'level_transition'
    this.transitionTimer = 120
    this.sfx.levelClear()
  }

  private loop = () => {
    if (!this.running) return
    this.update()
    this.render()
    this.input.update()
    this.rafId = requestAnimationFrame(this.loop)
  }

  private update() {
    switch (this.state) {
      case 'title':
        if (this.input.enter) {
          this.startGame()
        }
        break

      case 'level_transition':
        this.transitionTimer--
        if (this.transitionTimer <= 0) {
          this.state = 'playing'
        }
        break

      case 'playing':
        this.updatePlaying()
        break

      case 'game_over':
        this.gameOverTimer--
        if (this.gameOverTimer <= 0 && this.input.enter) {
          this.startGame()
        }
        break

      case 'victory':
        if (this.input.enter) {
          this.startGame()
        }
        break
    }
  }

  private updatePlaying() {
    // Update player
    this.player.update(this.input, this.level, this.sfx)

    // Player dead
    if (this.player.dead) {
      if (this.player.deathTimer <= -30) {
        if (this.player.lives <= 0) {
          this.state = 'game_over'
          this.gameOverTimer = 60
          this.sfx.stopBGM()
          this.sfx.gameOver()
        } else {
          // Respawn
          this.loadLevel(this.currentLevel)
          const lives = this.player.lives
          const score = this.player.score
          const coins = this.player.coins
          this.player.reset(this.level.data.playerStart.x, this.level.data.playerStart.y)
          this.player.lives = lives
          this.player.score = score
          this.player.coins = coins
        }
      }
      this.camera.follow(
        this.player.x,
        this.player.y,
        this.level.pixelWidth,
        this.level.pixelHeight,
      )
      return
    }

    // Update HUD timer
    this.hud.update()
    if (this.hud.timer <= 0) {
      this.player.die(this.sfx)
      return
    }

    // Update enemies
    for (const e of this.enemies) {
      e.update(this.level)
    }
    Enemy.checkShellCollisions(this.enemies)

    // Update items
    for (const item of this.items) {
      item.update()
    }

    // Update boss
    if (this.boss.active) {
      this.boss.update(this.level, this.player.x, this.player.y, this.sfx)

      // Boss defeated check
      if (this.boss.defeated && this.boss.defeatTimer <= 0) {
        this.nextLevel() // Victory since boss level is last
        return
      }
    }

    // Player-Enemy collisions
    for (const e of this.enemies) {
      if (!e.active || !e.isDangerous()) continue
      if (!overlaps(this.player.aabb, e.aabb)) continue

      // Check if stomping (player falling, landing on top)
      const playerBottom = this.player.y + this.player.height
      const enemyTop = e.y
      if (this.player.vy > 0 && playerBottom - enemyTop < 15) {
        const points = e.stomp()
        this.player.addScore(points)
        this.player.vy = -7
        this.sfx.stomp()
      } else if (this.player.starPower > 0) {
        e.kill()
        this.player.addScore(200)
        this.sfx.stomp()
      } else {
        this.player.takeDamage(this.sfx)
      }
    }

    // Player-Shell interaction (kick stationary shells)
    for (const e of this.enemies) {
      if (!e.active || e.state !== 'shell') continue
      if (!overlaps(this.player.aabb, e.aabb)) continue
      e.kickShell(this.player.x < e.x)
      this.sfx.stomp()
    }

    // Player-Item collisions
    for (const item of this.items) {
      if (!item.active) continue
      if (overlaps(this.player.aabb, item.aabb)) {
        item.collect()
        this.player.addCoin(this.sfx)
      }
    }

    // Player-Boss collision
    if (this.boss.active && !this.boss.defeated) {
      if (overlaps(this.player.aabb, this.boss.aabb)) {
        const playerBottom = this.player.y + this.player.height
        const bossTop = this.boss.y
        const stompingFromAbove = this.player.vy > 0 && playerBottom - bossTop < 24

        if (stompingFromAbove && this.boss.isVulnerable) {
          // Stomp the boss from above
          this.boss.hit(this.sfx)
          this.player.vy = -10
          this.player.addScore(1000)
        } else if (stompingFromAbove && !this.boss.isVulnerable) {
          // Bounce off boss head but don't take damage
          this.player.vy = -8
        } else if (!this.boss.isStunned) {
          // Side/below contact with non-stunned boss hurts player
          if (this.player.starPower <= 0) {
            this.player.takeDamage(this.sfx)
          }
        }
      }

      // Fireball collision
      if (this.boss.fireballHitsPlayer(this.player.aabb)) {
        this.player.takeDamage(this.sfx)
      }
    }

    // Check flag (level clear)
    const playerCol = Math.floor((this.player.x + this.player.width / 2) / TILE_SIZE)
    const playerRow = Math.floor(this.player.y / TILE_SIZE)
    for (let r = playerRow - 1; r <= playerRow + 1; r++) {
      if (this.level.getTile(playerCol, r) === FLAG) {
        this.player.addScore(5000)
        this.nextLevel()
        return
      }
    }

    // Camera follow
    this.camera.follow(this.player.x, this.player.y, this.level.pixelWidth, this.level.pixelHeight)
  }

  private render() {
    switch (this.state) {
      case 'title':
        this.hud.drawTitleScreen(this.sfx.isMuted)
        break

      case 'level_transition':
        this.hud.drawLevelTransition(this.hud.levelName)
        break

      case 'playing':
        this.renderPlaying()
        break

      case 'game_over':
        this.renderPlaying()
        this.hud.drawGameOver(this.player.score)
        break

      case 'victory':
        this.hud.drawVictory(this.player.score)
        break
    }
  }

  private renderPlaying() {
    // Background color based on level
    const bgColor =
      this.currentLevel === 1 ? '#1a1a2e' : this.currentLevel === 2 ? '#2d1b00' : '#5C94FC'

    // Screen shake
    const shakeIntensity = this.boss.active ? this.boss.shakeIntensity : 0
    let shaking = false
    if (shakeIntensity > 0) {
      this.renderer.drawScreenShake(shakeIntensity)
      shaking = true
    }

    this.renderer.clear(bgColor)
    this.renderer.drawLevel(this.level, this.camera)
    this.renderer.drawItems(this.items, this.camera)
    this.renderer.drawEnemies(this.enemies, this.camera)

    if (this.boss.active) {
      this.renderer.drawBoss(this.boss, this.camera)
    }

    this.renderer.drawPlayer(this.player, this.camera)

    if (shaking) {
      this.renderer.restoreShake()
    }

    // HUD on top
    this.hud.drawGameHUD(this.player, this.boss.active ? this.boss : null)
  }
}
