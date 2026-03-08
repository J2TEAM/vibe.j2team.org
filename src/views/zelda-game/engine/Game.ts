import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  TILE_SIZE,
  PLAYER_SIZE,
  PLAYER_MAX_HEALTH,
  STAGE2_PLAYER_MAX_HEALTH,
  BLOCK_SPARK_COUNT,
  BLOCK_SPARK_SPEED,
  BLOCK_SPARK_LIFE,
  BLOCK_SPARK_SIZE,
  PLAYER_DAMAGE_SHAKE_INTENSITY,
  PLAYER_DAMAGE_SHAKE_DURATION,
  SCREEN_FLASH_DURATION,
  STAGE_FADE_HALF,
  GAME_OVER_DESATURATE_TIME,
  GAME_OVER_FADE_TIME,
  VICTORY_FLASH_DURATION,
  SWORD_TRAIL_LIFE,
  SWORD_TRAIL_SIZE,
  ARROW_TRAIL_LIFE,
  ARROW_TRAIL_SIZE,
  POOL_HIGH_WATERMARK,
  LOW_HEALTH_PULSE_FREQ,
  LOW_HEALTH_VIGNETTE_MAX,
  HAPTIC_STAGE_CLEAR,
  HAPTIC_GAME_OVER,
  EFFECTS_DEBUG,
} from '../utils/constants'
import type { GameState, Vec2, HUDState, DialogLine, VictoryStats } from '../utils/types'
import type { IStage } from '../stages/IStage'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { Effects } from './Effects'
import { Input } from './Input'
import { Physics } from './Physics'
import { audio } from './Audio'
import { createForestMap } from '../maps/forest'
import { createBridgeMap } from '../maps/bridge'
import { createCastleMap } from '../maps/castle'
import { Player } from '../entities/Player'
import { Stage1 } from '../stages/Stage1'
import { Stage2 } from '../stages/Stage2'
import { Stage3 } from '../stages/Stage3'
import { ProjectileManager } from '../systems/ProjectileManager'
import { Dialog } from '../systems/Dialog'

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId = 0
  private lastTime = 0
  private fps = 0
  private running = false
  private frameCount = 0
  state: GameState = 'loading'

  // Phase 3: Vue Overlays
  public readonly USE_VUE_OVERLAYS = true
  private stats: VictoryStats = { totalTime: 0, enemiesDefeated: 0, damageTaken: 0 }
  private transitionLock = false

  private camera = new Camera()
  private renderer = new Renderer()
  private currentMap = createForestMap()
  readonly input: Input
  private player: Player
  private currentStage: IStage
  private currentStageNumber = 1
  private projectileManager = new ProjectileManager()
  private effects = new Effects()
  private dialog = new Dialog()

  // Stage Transition State
  private transitionPhase: 'banner' | 'dialog' | 'coming_soon' = 'banner'
  private transitionTimer = 0
  private readonly BANNER_DURATION = 2.0

  // Game-over transition phases (Red Team #7: state set immediately, visuals follow)
  private gameOverPhase: 'none' | 'desaturate' | 'fade' | 'done' = 'none'
  private gameOverTimer = 0

  // Victory sequence phases (Red Team #12: timer-based, no setTimeout)
  private victoryPhase: 'none' | 'flash' | 'fade' | 'done' = 'none'

  // Victory / navigation
  private homeRequested = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not available')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.input = new Input()
    this.currentStage = new Stage1()
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player = new Player(spawnPos)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    window.addEventListener('keydown', this.onAudioGesture)
    canvas.addEventListener('pointerdown', this.onAudioGesture)

    this.projectileManager.onPlayerHit = (damage: number) => {
      this.effects.screenFlash('rgba(255, 0, 0, 0.3)', SCREEN_FLASH_DURATION)
      this.camera.addShake(PLAYER_DAMAGE_SHAKE_INTENSITY, PLAYER_DAMAGE_SHAKE_DURATION)
      this.effects.spawnPopup(
        this.player.pos.x + this.player.size.x / 2,
        this.player.pos.y,
        `-${damage}`,
        '#FF4444',
      )
    }

    this.projectileManager.onBlock = (x: number, y: number) => {
      this.effects.emit({
        x,
        y,
        count: BLOCK_SPARK_COUNT,
        speed: BLOCK_SPARK_SPEED,
        life: BLOCK_SPARK_LIFE,
        size: BLOCK_SPARK_SIZE,
        colors: ['#FFD700', '#FFE066'],
      })
    }
  }

  /** Called on first user gesture: initialises AudioContext and starts overworld music. */
  private onAudioGesture = (e: Event): void => {
    if (!audio.isInitialized) {
      audio.init()
      if (this.currentStageNumber === 1) audio.playOverworldMusic()
    }
    if (e instanceof KeyboardEvent && (e.key === 'm' || e.key === 'M')) {
      audio.toggleMute()
    }
  }

  private findWalkableSpawn(preferred: Vec2): Vec2 {
    if (
      Physics.canMoveTo(this.currentMap, {
        x: preferred.x,
        y: preferred.y,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
      })
    ) {
      return preferred
    }
    for (let row = 1; row < this.currentMap.height - 1; row++) {
      for (let col = 1; col < this.currentMap.width - 1; col++) {
        const pos = { x: col * TILE_SIZE, y: row * TILE_SIZE }
        if (
          Physics.canMoveTo(this.currentMap, {
            x: pos.x,
            y: pos.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          })
        ) {
          return pos
        }
      }
    }
    return preferred
  }

  private onVisibilityChange = (): void => {
    if (document.hidden && this.state === 'playing' && !this.transitionLock) {
      this.setState('paused')
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.setState('playing')
      this.transitionLock = false
    }
  }

  playerHasWeapons(): boolean {
    return this.player.hasWeapon('sword')
  }

  getCurrentStageNumber(): number {
    return this.currentStageNumber
  }

  getVictoryStats(): VictoryStats {
    return { ...this.stats }
  }

  resetStats(): void {
    this.stats = { totalTime: 0, enemiesDefeated: 0, damageTaken: 0 }
  }

  incrementEnemiesDefeated(): void {
    this.stats.enemiesDefeated++
  }

  recordDamage(amount: number): void {
    this.stats.damageTaken += amount
  }

  fullRestart(): void {
    this.resetStats()
    this.restartFromStage1()
  }

  start(): void {
    this.running = true
    this.state = 'playing'
    this.transitionLock = false
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.input.destroy()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    window.removeEventListener('keydown', this.onAudioGesture)
    this.canvas.removeEventListener('pointerdown', this.onAudioGesture)
    audio.reset()
  }

  private loop = (time: number): void => {
    if (!this.running) return

    // Cap delta at 50ms to prevent spiral-of-death on tab switch
    const dt = Math.min((time - this.lastTime) / 1000, 0.05)
    this.fps = dt > 0 ? 1 / dt : 0
    this.lastTime = time

    this.update(dt)
    this.render()
    // Clear just-pressed state at end of frame
    this.input.update()

    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    // Always update effects (particles, popups, screen overlays decay even during freeze)
    this.effects.update(dt)
    this.frameCount++

    const stage3VictoryReady =
      this.currentStageNumber === 3 &&
      this.currentStage instanceof Stage3 &&
      this.currentStage.isComplete()

    if (this.state === 'playing' && !stage3VictoryReady) {
      this.stats.totalTime += dt
    }

    const inputState = this.input.getState()

    // Dialog system takes priority — pause all game logic while dialog is active
    if (this.dialog.isActive()) {
      if (this.state === 'playing') {
        this.player.updateTimersOnly(dt)
      }
      this.dialog.update(dt, inputState)
      return
    }

    // Handle game over — game_over state set immediately on death, visual transition follows
    if (this.state === 'game_over') {
      if (this.gameOverPhase === 'desaturate') {
        this.gameOverTimer += dt
        if (this.gameOverTimer >= GAME_OVER_DESATURATE_TIME && !this.effects.isFading()) {
          this.gameOverPhase = 'fade'
          this.effects.screenFade('#000000', GAME_OVER_FADE_TIME, () => {
            // midpoint: screen fully black — switch to done so overlay appears
            this.gameOverPhase = 'done'
          })
        }
        return // no input during desaturate
      }
      if (this.gameOverPhase === 'fade') {
        return // no input during fade
      }
      // gameOverPhase === 'done' — accept restart input (Red Team #7)
      if (
        inputState.attackJustPressed ||
        inputState.interactJustPressed ||
        inputState.pauseJustPressed ||
        inputState.blockJustPressed ||
        inputState.rangedJustPressed
      ) {
        this.gameOverPhase = 'none'
        this.gameOverTimer = 0
        this.restart()
      }
      return
    }

    // Stage Transition Handling
    if (this.state === 'stage_transition') {
      if (this.transitionPhase === 'banner') {
        this.transitionTimer -= dt
        if (this.transitionTimer <= 0) {
          this.transitionPhase = 'dialog'
          this.dialog.show(this.getTransitionDialogLines(), () => {
            if (this.currentStageNumber === 1) {
              this.loadStage2()
            } else if (this.currentStageNumber === 2) {
              this.loadStage3()
            }
          })
        }
      }
      // 'dialog' phase is handled by dialog.isActive() check above
      return
    }

    if (this.state !== 'playing') return

    // [RED TEAM #13] Block pause during item-get sequence to prevent softlock
    if (
      inputState.pauseJustPressed &&
      !this.currentStage.isItemGetActive() &&
      !this.transitionLock
    ) {
      this.setState('paused')
      return
    }

    // Hit freeze — skip entity/AI updates but state checks already ran
    if (this.effects.consumeFreeze()) return

    // [RED TEAM #8] Stage updates FIRST — enemies check collisions using previous frame's invulnerability state
    this.currentStage.update(
      dt,
      this.player,
      this.currentMap,
      inputState,
      this.effects,
      this.camera,
    )
    // THEN player updates — decrements invulnerability timer
    this.player.update(dt, inputState, this.currentMap)
    this.camera.follow(this.player.getCenter(), this.currentMap, dt)
    const combatResult = this.player.getCombatResult()
    if (combatResult?.projectileRequest) {
      const spawned = this.projectileManager.spawn(combatResult.projectileRequest)
      if (!spawned) {
        this.player.refundBowCooldown()
      } else {
        audio.playArrowFire()
      }
    }

    // Spawn archer projectiles (Stage 2 only)
    if (this.currentStage instanceof Stage2) {
      const archerRequests = this.currentStage.getArcherProjectileRequests()
      for (const req of archerRequests) {
        this.projectileManager.spawn(req)
      }
    }

    this.camera.updateShake(dt)

    // Update all active projectiles (pass player for enemy→player collision)
    this.projectileManager.update(dt, this.currentMap, this.currentStage.getEnemies(), this.player)

    // Sword trail: 1 particle per frame during attack swing
    const swingResult = this.player.getCombatResult()
    if (swingResult?.state === 'attacking' && swingResult.hitCenter) {
      this.effects.emit({
        x: swingResult.hitCenter.x + (Math.random() - 0.5) * 20,
        y: swingResult.hitCenter.y + (Math.random() - 0.5) * 20,
        count: 1,
        speed: 10,
        life: SWORD_TRAIL_LIFE,
        size: SWORD_TRAIL_SIZE,
        colors: ['#FFFFFF', '#EEEEEE'],
        shrink: SWORD_TRAIL_SIZE / SWORD_TRAIL_LIFE,
      })
    }

    // Arrow trail: 1 particle every 2nd frame for player projectiles, with pool watermark guard
    if (this.frameCount % 2 === 0) {
      const poolStats = this.effects.getPoolStats()
      if (poolStats.active / poolStats.total < POOL_HIGH_WATERMARK) {
        for (const proj of this.projectileManager.getActivePool()) {
          if (!proj.active || proj.source !== 'player') continue
          this.effects.emit({
            x: proj.x,
            y: proj.y,
            count: 1,
            speed: 5,
            life: ARROW_TRAIL_LIFE,
            size: ARROW_TRAIL_SIZE,
            colors: ['#FFFACD', '#FFFFFF'],
            shrink: ARROW_TRAIL_SIZE / ARROW_TRAIL_LIFE,
          })
        }
      }
    }

    if (!this.player.isAlive() && this.gameOverPhase === 'none') {
      // Red Team #7: set state immediately so enemies stop attacking
      this.setState('game_over')
      this.gameOverPhase = 'desaturate'
      this.gameOverTimer = 0
      Input.vibrate(HAPTIC_GAME_OVER)
      return
    }

    // Phase 3: Check Stage Completion
    // [RED TEAM #1] Death check MUST run before completion check
    if (this.currentStage.isComplete()) {
      if (this.currentStageNumber === 3) {
        // Stage 3 is the final stage — handle victory actions
        const stage3 = this.currentStage as Stage3

        if (this.USE_VUE_OVERLAYS) {
          // Victory sequence: white flash → camera shake → fade to black → victory screen
          // (Red Team #12: timer-based, no setTimeout)
          if (this.victoryPhase === 'none') {
            this.victoryPhase = 'flash'
            this.effects.screenFlash('#ffffff', VICTORY_FLASH_DURATION)
            this.camera.addShake(8, 0.5)
            audio.stopMusic()
            audio.playVictoryFanfare()
            Input.vibrate(HAPTIC_STAGE_CLEAR)
          }
          if (this.victoryPhase === 'flash' && !this.effects.isFading()) {
            this.victoryPhase = 'fade'
            this.effects.screenFade('#000000', 0.8, () => {
              // midpoint: fully black — show victory screen under fade-out
              const stageStats = stage3.getStats()
              this.stats.enemiesDefeated = stageStats.enemiesDefeated
              this.stats.damageTaken = stageStats.damageTaken
              this.setState('victory')
              this.victoryPhase = 'done'
              this.transitionLock = true
            })
          }
          return
        } else {
          // Fallback to canvas
          stage3.setVictoryScreenEnabled(true)

          const action = stage3.getVictoryAction()
          if (action === 'play_again') {
            this.restartFromStage1()
          } else if (action === 'home') {
            this.homeRequested = true
          }
          return
        }
      }
      this.startTransition()
      return
    }
  }

  private startTransition(): void {
    if (this.effects.isFading()) return
    this.transitionLock = true
    // Immediately block gameplay — no more player/enemy updates during fade
    this.setState('stage_transition')
    this.transitionPhase = 'banner'
    this.transitionTimer = this.BANNER_DURATION
    // Fade to black while banner appears, then fade back out
    this.effects.screenFade('#000000', STAGE_FADE_HALF)
    audio.stopMusic()
    audio.playTransition()
    Input.vibrate(HAPTIC_STAGE_CLEAR)
  }

  private render(): void {
    const { ctx } = this

    // Game-over desaturation: apply grayscale filter to entire scene
    if (this.gameOverPhase !== 'none') {
      const progress =
        this.gameOverPhase === 'desaturate'
          ? Math.min(1, this.gameOverTimer / GAME_OVER_DESATURATE_TIME)
          : 1 // 'fade' and 'done' = full grayscale
      ctx.filter = `grayscale(${progress})`
    }

    ctx.fillStyle = COLORS.bgDeep
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.save()
    this.camera.apply(ctx)

    this.renderer.drawTileMap(ctx, this.currentMap, this.camera)

    // Draw stage: vision cones, enemies, alert indicators
    this.currentStage.draw(ctx, this.renderer, this.currentMap, this.effects, this.camera)

    // Player renders OVER enemies
    this.player.draw(ctx)

    // Sword swing arc drawn on top of player when attacking
    const combatResult = this.player.getCombatResult()
    if (combatResult?.state === 'attacking') {
      this.renderer.drawSwordSwing(ctx, this.player.getCenter(), this.player.direction)
    }

    // Projectiles render over player
    this.projectileManager.draw(ctx)

    // Interact prompts (in world space, over everything)
    this.currentStage.drawPrompts(ctx, this.renderer, this.player.getCenter())

    // Particles in world space (before camera restore)
    this.effects.drawWorld(ctx)

    ctx.restore()

    // HUD / debug drawn in screen space
    if (this.state === 'playing') {
      const cooldowns = this.player.getCooldownRatios()
      const hudState: HUDState = {
        health: this.player.health,
        maxHealth: this.player.maxHealth,
        weapons: {
          sword: this.player.hasWeapon('sword'),
          shield: this.player.hasWeapon('shield'),
          bow: this.player.hasWeapon('bow'),
        },
        combatState: this.player.getCombatResult()?.state ?? 'idle',
        stageNumber: this.currentStageNumber,
        swordCooldownRatio: cooldowns.sword,
        bowCooldownRatio: cooldowns.bow,
      }
      this.renderer.drawHUD(ctx, hudState)
    }
    this.renderer.drawFPS(ctx, this.fps)

    if (EFFECTS_DEBUG) {
      const stats = this.effects.getPoolStats()
      ctx.fillStyle = '#00ff00'
      ctx.font = '10px monospace'
      ctx.fillText(
        `FX: ${stats.active}/${stats.total} pop:${stats.popups} sfx:${stats.screenFx}`,
        10,
        this.canvas.height - 10,
      )
    }

    const stageStatus = this.currentStage.getStatus()
    this.renderer.drawDebugInfo(ctx, {
      entityCount: ((stageStatus['enemyCount'] as number) ?? 0) + 1,
      playerPos: this.player.pos,
      playerHealth: this.player.health,
      playerMaxHealth: this.player.maxHealth,
      state: this.state,
      stageStatus:
        this.currentStageNumber === 1
          ? (stageStatus as {
              keyCollected: boolean
              chestOpened: boolean
              gateOpen: boolean
              alertCount: number
            })
          : undefined,
    })

    // Screen effects (popups, flash, fade) — after HUD, before dialog
    this.effects.drawScreen(
      ctx,
      this.canvas.width,
      this.canvas.height,
      this.camera.viewport.x,
      this.camera.viewport.y,
    )

    // Low-health warning: pulsing red vignette when player has 1 HP
    if (this.state === 'playing' && this.player.health === 1 && this.player.isAlive()) {
      const pulse =
        (Math.sin((performance.now() / 1000) * Math.PI * 2 * LOW_HEALTH_PULSE_FREQ) + 1) / 2
      this.renderer.drawRedVignette(ctx, pulse * LOW_HEALTH_VIGNETTE_MAX)
    }

    if (this.state === 'game_over' && !this.USE_VUE_OVERLAYS) {
      this.drawGameOver(ctx)
    }

    if (this.state === 'stage_transition' && this.transitionPhase === 'banner') {
      if (this.currentStageNumber === 1) {
        this.renderer.drawVictoryBanner(ctx)
      } else {
        this.renderer.drawStage2VictoryBanner(ctx)
      }
    }

    // Dialog overlay — drawn last, on top of everything (active in any state)
    if (this.dialog.isActive()) {
      this.dialog.draw(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Reset grayscale filter applied for game-over desaturation
    ctx.filter = 'none'
  }

  private drawGameOver(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = '#EF4444'
    ctx.font = 'bold 32px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Trò chơi kết thúc', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)

    ctx.fillStyle = '#F0EDE6'
    ctx.font = '14px monospace'
    ctx.fillText('Nhấn phím bất kỳ để chơi lại', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
    ctx.textAlign = 'start'
  }

  private loadStage2(): void {
    this.currentStageNumber = 2
    this.currentMap = createBridgeMap()
    this.currentStage = new Stage2()
    this.player.setMaxHealth(STAGE2_PLAYER_MAX_HEALTH)
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player.reset(spawnPos)
    this.player.unlockWeapons() // restore weapons cleared by reset() — player earned these in Stage 1
    this.projectileManager.reset()
    this.effects.reset()
    this.camera.snapNext()
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.state = 'playing'
    this.transitionLock = false
    this.gameOverPhase = 'none'
    this.gameOverTimer = 0
    this.victoryPhase = 'none'
    audio.playBossMusic()
  }

  private loadStage3(): void {
    this.currentStageNumber = 3
    this.currentMap = createCastleMap()
    const stage3 = new Stage3()
    stage3.setDialogCallback((lines, onComplete) => this.showDialog(lines, onComplete))
    stage3.setVictoryScreenEnabled(!this.USE_VUE_OVERLAYS)
    this.currentStage = stage3
    this.player.setMaxHealth(STAGE2_PLAYER_MAX_HEALTH) // 5 hearts
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player.reset(spawnPos)
    this.player.unlockWeapons() // sword + bow + shield
    this.projectileManager.reset()
    this.effects.reset()
    this.camera.snapNext()
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.state = 'playing'
    this.transitionLock = false
    this.gameOverPhase = 'none'
    this.gameOverTimer = 0
    this.victoryPhase = 'none'
    audio.playBossMusic()
  }

  /** Full game restart from Stage 1 (used by "Play Again" on victory screen) */
  private restartFromStage1(): void {
    this.homeRequested = false
    this.currentStageNumber = 1
    this.transitionPhase = 'banner'
    this.transitionTimer = 0
    this.gameOverPhase = 'none'
    this.gameOverTimer = 0
    this.victoryPhase = 'none'
    this.currentMap = createForestMap()
    this.currentStage = new Stage1()
    this.player.setMaxHealth(PLAYER_MAX_HEALTH)
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player.reset(spawnPos)
    this.projectileManager.reset()
    this.effects.reset()
    this.camera.snapNext()
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.setState('playing')
    this.transitionLock = false
    audio.stopMusic()
    audio.playOverworldMusic()
  }

  restart(): void {
    this.transitionPhase = 'banner'
    this.transitionTimer = 0
    this.gameOverPhase = 'none'
    this.gameOverTimer = 0
    this.victoryPhase = 'none'
    if (this.currentStageNumber === 1) {
      this.currentMap = createForestMap()
      this.currentStage = new Stage1()
      this.player.setMaxHealth(PLAYER_MAX_HEALTH)
    } else if (this.currentStageNumber === 2) {
      this.currentMap = createBridgeMap()
      this.currentStage = new Stage2()
      this.player.setMaxHealth(STAGE2_PLAYER_MAX_HEALTH)
    } else {
      // Stage 3 death → restart Stage 3 (not full game restart)
      this.currentMap = createCastleMap()
      const stage3 = new Stage3()
      stage3.setDialogCallback((lines, onComplete) => this.showDialog(lines, onComplete))
      stage3.setVictoryScreenEnabled(!this.USE_VUE_OVERLAYS)
      this.currentStage = stage3
      this.player.setMaxHealth(STAGE2_PLAYER_MAX_HEALTH)
    }
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player.reset(spawnPos)
    // Stages 2 and 3 restarts must re-grant weapons since reset() clears inventory
    if (this.currentStageNumber >= 2) {
      this.player.unlockWeapons()
    }
    this.projectileManager.reset()
    this.effects.reset()
    // [RED TEAM #12] Snap camera immediately to new spawn position
    this.camera.snapNext()
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.setState('playing')
    this.transitionLock = false
  }

  setState(state: GameState): void {
    this.state = state
  }

  /** Show a dialog overlay. Stages call this via the callback injected at construction. */
  showDialog(lines: DialogLine[], onComplete?: () => void): void {
    this.dialog.show(lines, onComplete)
  }

  /** Returns the narrative lines for the current stage transition (story text between stages). */
  private getTransitionDialogLines(): DialogLine[] {
    if (this.currentStageNumber === 1) {
      return [
        { text: 'Khu rừng đã an toàn.' },
        { text: 'Nhưng nhà tù của Zelda nằm bên kia Cầu Hyrule...' },
      ]
    }
    return [
      { text: 'Cầu Hyrule đã vượt qua!' },
      { text: 'Lâu đài Ganon ở phía trước...' },
      { text: 'Zelda đang chờ.' },
    ]
  }

  /** Returns true when Stage 3 victory "Trang chủ" was chosen — index.vue should navigate to '/' */
  isHomeRequested(): boolean {
    return this.homeRequested
  }

  /** Clear the home navigation request (call after navigating) */
  clearHomeRequest(): void {
    this.homeRequested = false
  }

  get context(): CanvasRenderingContext2D {
    return this.ctx
  }

  get canvasElement(): HTMLCanvasElement {
    return this.canvas
  }
}
