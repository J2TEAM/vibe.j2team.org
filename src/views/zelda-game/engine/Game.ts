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
  DEBUG_OVERLAY,
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
import { StartScreenRenderer } from './StartScreenRenderer'
import { CanvasOverlayRenderer } from './canvas-overlay-renderer'
import { CanvasMenuRenderer } from './canvas-menu-renderer'
import type { MenuButton } from './canvas-menu-renderer'
import { CanvasTouchControlsRenderer } from './canvas-touch-controls-renderer'
import { toCanvasCoords } from './canvas-utils'

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId = 0
  private lastTime = 0
  private fps = 0
  private running = false
  private frameCount = 0
  state: GameState = 'loading'

  private stats: VictoryStats = { totalTime: 0, enemiesDefeated: 0, damageTaken: 0 }
  private transitionLock = false

  private camera = new Camera()
  private renderer = new Renderer()
  private startScreenRenderer = new StartScreenRenderer()
  private overlayRenderer = new CanvasOverlayRenderer()
  private overlayButtons: MenuButton[] = []
  private overlaySelectedIdx = 0
  private prevOverlayUp = false
  private prevOverlayDown = false
  private overlayClickListener: ((e: PointerEvent) => void) | null = null
  private missionGuideShown = false
  private readonly MISSION_GUIDE_LINES: DialogLine[] = [
    { speaker: 'Link', text: 'Khu rừng này đầy rẫy Bokoblin tuần tra...' },
    { speaker: 'Link', text: 'Phải lẻn qua chúng. Nếu bị phát hiện, chiến đấu là khó tránh.' },
    { speaker: 'Link', text: 'Tìm chìa khóa từ tên Bokoblin chỉ huy, mở rương để lấy vũ khí.' },
    { speaker: 'Link', text: 'Sau đó mở cổng phía Bắc để thoát khỏi khu rừng.' },
  ]
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

  // Touch controls (only on coarse-pointer / touch devices)
  private touchControls: CanvasTouchControlsRenderer | null = null

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
    canvas.addEventListener('pointerdown', this.onStartScreenClick)
    this.setupOverlayClickListener()

    // Instantiate touch controls on touch devices (coarse pointer = touchscreen)
    if (window.matchMedia('(pointer: coarse)').matches) {
      this.touchControls = new CanvasTouchControlsRenderer(this.input)
      this.setupTouchControlsListeners()
    }

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
    this.state = 'start_screen'
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
    this.canvas.removeEventListener('pointerdown', this.onStartScreenClick)
    if (this.overlayClickListener) {
      this.canvas.removeEventListener('pointerdown', this.overlayClickListener)
    }
    if (this.touchControls) {
      this.canvas.removeEventListener('touchstart', this.onTouchStart)
      this.canvas.removeEventListener('touchmove', this.onTouchMove)
      this.canvas.removeEventListener('touchend', this.onTouchEnd)
      this.canvas.removeEventListener('touchcancel', this.onTouchEnd)
      this.touchControls.reset()
    }
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

    // Start screen: any directional/action input transitions to gameplay
    if (this.state === 'start_screen') {
      if (
        inputState.attackJustPressed ||
        inputState.interactJustPressed ||
        inputState.pauseJustPressed ||
        inputState.up ||
        inputState.down ||
        inputState.left ||
        inputState.right
      ) {
        this.startGame()
      }
      return
    }

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

    // Overlay keyboard navigation (paused / victory)
    if (this.state === 'paused' || this.state === 'victory') {
      if (inputState.up && !this.prevOverlayUp) {
        this.overlaySelectedIdx = Math.max(0, this.overlaySelectedIdx - 1)
      }
      if (inputState.down && !this.prevOverlayDown) {
        this.overlaySelectedIdx = Math.min(
          this.overlayButtons.length - 1,
          this.overlaySelectedIdx + 1,
        )
      }
      this.prevOverlayUp = inputState.up
      this.prevOverlayDown = inputState.down

      if (inputState.attackJustPressed || inputState.interactJustPressed) {
        const btn = this.overlayButtons[this.overlaySelectedIdx]
        if (btn) this.handleOverlayAction(btn.action)
      }
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

    // Spawn archer projectiles (all stages with archers)
    if (
      this.currentStage instanceof Stage1 ||
      this.currentStage instanceof Stage2 ||
      this.currentStage instanceof Stage3
    ) {
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

        // Victory sequence: white flash → camera shake → fade to black → show overlay
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
            // midpoint: fully black — show victory overlay (canvas or Vue)
            // Accumulate Stage 3 kills on top of kills from previous stages
            const stageStats = stage3.getStats()
            this.stats.enemiesDefeated += stageStats.enemiesDefeated
            this.stats.damageTaken += stageStats.damageTaken
            this.setState('victory')
            this.victoryPhase = 'done'
            this.transitionLock = true
          })
        }
        return
      }
      this.startTransition()
      return
    }
  }

  /** Transition from start screen to gameplay; shows one-time mission briefing. */
  private startGame(): void {
    this.state = 'playing'
    if (!audio.isInitialized) {
      audio.init()
      audio.playOverworldMusic()
    }
    if (!this.missionGuideShown) {
      this.missionGuideShown = true
      this.dialog.show(this.MISSION_GUIDE_LINES)
    }
  }

  /** Canvas click handler: start game when on start screen. */
  private onStartScreenClick = (): void => {
    if (this.state === 'start_screen') {
      this.startGame()
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

    // Start screen: draw title canvas and skip all game world rendering
    if (this.state === 'start_screen') {
      this.startScreenRenderer.draw(ctx, performance.now() / 1000)
      return
    }

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
    if (DEBUG_OVERLAY) {
      this.renderer.drawFPS(ctx, this.fps)
    }

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

    if (DEBUG_OVERLAY) {
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
    }

    // Touch controls overlay (only on touch devices, only while playing)
    if (this.state === 'playing' && this.touchControls) {
      this.touchControls.draw(ctx, this.player.hasWeapon('sword'))
    }

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

    // Canvas overlays: pause, game-over, victory
    const t = performance.now() / 1000
    if (this.state === 'paused') {
      this.overlayRenderer.drawPause(ctx, this.overlayButtons, this.overlaySelectedIdx, t)
    }
    if (this.state === 'game_over' && this.gameOverPhase === 'done') {
      this.overlayRenderer.drawGameOver(ctx, this.overlayButtons, this.overlaySelectedIdx, t)
    }
    if (this.state === 'victory') {
      this.overlayRenderer.drawVictory(
        ctx,
        this.stats,
        this.overlayButtons,
        this.overlaySelectedIdx,
        t,
      )
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

  private setupOverlayClickListener(): void {
    this.overlayClickListener = (e: PointerEvent) => {
      if (this.state !== 'paused' && this.state !== 'game_over' && this.state !== 'victory') return
      const coords = toCanvasCoords(e.clientX, e.clientY, this.canvas)
      const idx = CanvasMenuRenderer.hitTest(this.overlayButtons, coords.x, coords.y)
      if (idx >= 0) {
        const btn = this.overlayButtons[idx]
        if (btn) this.handleOverlayAction(btn.action)
      }
    }
    this.canvas.addEventListener('pointerdown', this.overlayClickListener)
  }

  private setupTouchControlsListeners(): void {
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.onTouchEnd)
    this.canvas.addEventListener('touchcancel', this.onTouchEnd)
  }

  private onTouchStart = (e: TouchEvent): void => {
    if (!this.touchControls || this.state !== 'playing') return
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (!touch) continue
      const coords = toCanvasCoords(touch.clientX, touch.clientY, this.canvas)
      this.touchControls.handleTouchStart(touch.identifier, coords.x, coords.y)
    }
  }

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.touchControls || this.state !== 'playing') return
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (!touch) continue
      const coords = toCanvasCoords(touch.clientX, touch.clientY, this.canvas)
      this.touchControls.handleTouchMove(touch.identifier, coords.x, coords.y)
    }
  }

  private onTouchEnd = (e: TouchEvent): void => {
    if (!this.touchControls) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (!touch) continue
      this.touchControls.handleTouchEnd(touch.identifier)
    }
  }

  private handleOverlayAction(action: string): void {
    switch (action) {
      case 'resume':
        this.resume()
        break
      case 'restart':
        this.restart()
        break
      case 'full_restart':
        this.fullRestart()
        break
      case 'home':
        this.homeRequested = true
        break
    }
    // Reset selection and nav edge-detect state after any action
    this.overlaySelectedIdx = 0
    this.prevOverlayUp = false
    this.prevOverlayDown = false
  }

  private buildPauseButtons(): MenuButton[] {
    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2
    const w = 220
    const h = 36
    const gap = 10
    const startY = cy - 30
    return [
      { x: cx - w / 2, y: startY, w, h, label: 'TI\u1EECP T\u1EE4C', action: 'resume' },
      {
        x: cx - w / 2,
        y: startY + h + gap,
        w,
        h,
        label: 'CH\u01A0I L\u1EA0I M\u00C0N N\u00C0Y',
        action: 'restart',
      },
      {
        x: cx - w / 2,
        y: startY + (h + gap) * 2,
        w,
        h,
        label: 'V\u1EC0 TRANG CH\u1EE6',
        action: 'home',
      },
    ]
  }

  private buildGameOverButtons(): MenuButton[] {
    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2
    const w = 200
    const h = 36
    const gap = 10
    const startY = cy + 30
    return [
      { x: cx - w / 2, y: startY, w, h, label: 'TH\u1EEC L\u1EA0I', action: 'restart' },
      { x: cx - w / 2, y: startY + h + gap, w, h, label: 'V\u1EC0 TRANG CH\u1EE6', action: 'home' },
    ]
  }

  private buildVictoryButtons(): MenuButton[] {
    const cx = CANVAS_WIDTH / 2
    const cy = CANVAS_HEIGHT / 2
    const w = 200
    const h = 36
    const gap = 10
    const startY = cy + 80
    return [
      { x: cx - w / 2, y: startY, w, h, label: 'CH\u01A0I L\u1EA0I', action: 'full_restart' },
      { x: cx - w / 2, y: startY + h + gap, w, h, label: 'V\u1EC0 TRANG CH\u1EE6', action: 'home' },
    ]
  }

  private loadStage2(): void {
    // Accumulate Stage 1 kills into the running total before switching stages
    const stage1Stats = this.currentStage.getStats?.()
    if (stage1Stats) {
      this.stats.enemiesDefeated += stage1Stats.enemiesDefeated
      this.stats.damageTaken += stage1Stats.damageTaken
    }
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
    // Accumulate Stage 2 kills into the running total before switching stages
    const stage2Stats = this.currentStage.getStats?.()
    if (stage2Stats) {
      this.stats.enemiesDefeated += stage2Stats.enemiesDefeated
      this.stats.damageTaken += stage2Stats.damageTaken
    }
    this.currentStageNumber = 3
    this.currentMap = createCastleMap()
    const stage3 = new Stage3()
    stage3.setDialogCallback((lines, onComplete) => this.showDialog(lines, onComplete))
    stage3.setVictoryScreenEnabled(false) // canvas-overlay-renderer handles victory display
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
      stage3.setVictoryScreenEnabled(false) // canvas-overlay-renderer handles victory display
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
    this.overlaySelectedIdx = 0
    // Pre-build button layout for overlay states so render() just reads cached data
    if (state === 'paused') this.overlayButtons = this.buildPauseButtons()
    else if (state === 'game_over') this.overlayButtons = this.buildGameOverButtons()
    else if (state === 'victory') this.overlayButtons = this.buildVictoryButtons()
    else this.overlayButtons = []
    // Reset touch controls when leaving playing state so no stuck inputs
    if (state !== 'playing' && this.touchControls) {
      this.touchControls.reset()
    }
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
