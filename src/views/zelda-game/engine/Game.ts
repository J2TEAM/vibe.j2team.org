import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, TILE_SIZE, PLAYER_SIZE, PLAYER_MAX_HEALTH, STAGE2_PLAYER_MAX_HEALTH } from '../utils/constants'
import type { GameState, Vec2 } from '../utils/types'
import type { IStage } from '../stages/IStage'
import { Camera } from './Camera'
import { Renderer } from './Renderer'
import { Input } from './Input'
import { Physics } from './Physics'
import { createForestMap } from '../maps/forest'
import { createBridgeMap } from '../maps/bridge'
import { createCastleMap } from '../maps/castle'
import { Player } from '../entities/Player'
import { Stage1 } from '../stages/Stage1'
import { Stage2 } from '../stages/Stage2'
import { Stage3 } from '../stages/Stage3'
import { ProjectileManager } from '../systems/ProjectileManager'

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId = 0
  private lastTime = 0
  private fps = 0
  private running = false
  state: GameState = 'loading'

  private camera = new Camera()
  private renderer = new Renderer()
  private currentMap = createForestMap()
  readonly input: Input
  private player: Player
  private currentStage: IStage
  private currentStageNumber = 1
  private projectileManager = new ProjectileManager()

  // Phase 3: Stage Transition State
  private transitionPhase: 'banner' | 'dialog' | 'coming_soon' = 'banner'
  private transitionTimer = 0
  private dialogInputDelay = 0
  private readonly BANNER_DURATION = 2.0

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
  }

  private findWalkableSpawn(preferred: Vec2): Vec2 {
    if (Physics.canMoveTo(this.currentMap, { x: preferred.x, y: preferred.y, width: PLAYER_SIZE, height: PLAYER_SIZE })) {
      return preferred
    }
    for (let row = 1; row < this.currentMap.height - 1; row++) {
      for (let col = 1; col < this.currentMap.width - 1; col++) {
        const pos = { x: col * TILE_SIZE, y: row * TILE_SIZE }
        if (Physics.canMoveTo(this.currentMap, { x: pos.x, y: pos.y, width: PLAYER_SIZE, height: PLAYER_SIZE })) {
          return pos
        }
      }
    }
    return preferred
  }

  private onVisibilityChange = (): void => {
    if (document.hidden && this.state === 'playing') {
      this.setState('paused')
    }
  }

  start(): void {
    this.running = true
    this.state = 'playing'
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.input.destroy()
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
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
    // Handle game over restart before the playing guard
    if (this.state === 'game_over') {
      const inputState = this.input.getState()
      if (
        inputState.attackJustPressed ||
        inputState.interactJustPressed ||
        inputState.pauseJustPressed ||
        inputState.blockJustPressed ||
        inputState.rangedJustPressed
      ) {
        this.restart()
      }
      return
    }

    // Phase 3: Stage Transition Handling
    if (this.state === 'stage_transition') {
      const inputState = this.input.getState()

      if (this.transitionPhase === 'banner') {
        this.transitionTimer -= dt
        if (this.transitionTimer <= 0) {
          this.transitionPhase = 'dialog'
          // [RED TEAM #3] Prevent attack spam from instantly dismissing dialog
          this.dialogInputDelay = 0.3
        }
      } else if (this.transitionPhase === 'dialog') {
        if (this.dialogInputDelay > 0) {
          this.dialogInputDelay -= dt
        } else if (
          inputState.attackJustPressed ||
          inputState.interactJustPressed ||
          inputState.pauseJustPressed ||
          inputState.blockJustPressed ||
          inputState.rangedJustPressed ||
          inputState.up ||
          inputState.down ||
          inputState.left ||
          inputState.right
        ) {
          if (this.currentStageNumber === 1) {
            this.loadStage2()
          } else if (this.currentStageNumber === 2) {
            this.loadStage3()
          }
          // Stage 3 is the final stage — no further transition
        }
      } else if (this.transitionPhase === 'coming_soon') {
        if (inputState.attackJustPressed || inputState.interactJustPressed) {
          this.restart()
        }
      }
      return
    }

    if (this.state !== 'playing') return

    const inputState = this.input.getState()

    // [RED TEAM #13] Block pause during item-get sequence to prevent softlock
    if (inputState.pauseJustPressed && !this.currentStage.isItemGetActive()) {
      this.setState('paused')
      return
    }

    // [RED TEAM #8] Stage updates FIRST — enemies check collisions using previous frame's invulnerability state
    this.currentStage.update(dt, this.player, this.currentMap, inputState)
    // THEN player updates — decrements invulnerability timer
    this.player.update(dt, inputState, this.currentMap)
    this.camera.follow(this.player.getCenter(), this.currentMap)

    // Handle projectile spawn requests from player combat
    const combatResult = this.player.getCombatResult()
    if (combatResult?.projectileRequest) {
      const spawned = this.projectileManager.spawn(combatResult.projectileRequest)
      if (!spawned) {
        this.player.refundBowCooldown()
      }
    }

    // Spawn archer projectiles (Stage 2 only)
    if (this.currentStage instanceof Stage2) {
      const archerRequests = this.currentStage.getArcherProjectileRequests()
      for (const req of archerRequests) {
        this.projectileManager.spawn(req)
      }
    }

    // Consume camera shake requests from Stage 3
    if (this.currentStage instanceof Stage3) {
      const shakeReq = this.currentStage.consumeCameraShakeRequest()
      if (shakeReq) {
        this.camera.addShake(shakeReq.intensity, shakeReq.duration)
      }
    }
    this.camera.updateShake(dt)

    // Update all active projectiles (pass player for enemy→player collision)
    this.projectileManager.update(dt, this.currentMap, this.currentStage.getEnemies(), this.player)

    if (!this.player.isAlive()) {
      this.setState('game_over')
      return
    }

    // Phase 3: Check Stage Completion
    // [RED TEAM #1] Death check MUST run before completion check
    if (this.currentStage.isComplete()) {
      if (this.currentStageNumber === 3) {
        // Stage 3 is the final stage — handle victory actions
        const stage3 = this.currentStage as Stage3
        const action = stage3.getVictoryAction()
        if (action === 'play_again') {
          this.restartFromStage1()
        } else if (action === 'home') {
          this.homeRequested = true
        }
        return
      }
      this.startTransition()
      return
    }
  }

  private startTransition(): void {
    this.setState('stage_transition')
    this.transitionPhase = 'banner'
    this.transitionTimer = this.BANNER_DURATION
  }

  private render(): void {
    const { ctx } = this

    ctx.fillStyle = COLORS.bgDeep
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.save()
    this.camera.apply(ctx)

    this.renderer.drawTileMap(ctx, this.currentMap, this.camera)

    // Draw stage: vision cones, enemies, alert indicators
    this.currentStage.draw(ctx, this.renderer, this.currentMap)

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

    ctx.restore()

    // HUD / debug drawn in screen space
    this.renderer.drawFPS(ctx, this.fps)

    const stageStatus = this.currentStage.getStatus()
    this.renderer.drawDebugInfo(ctx, {
      entityCount: (stageStatus['enemyCount'] as number ?? 0) + 1,
      playerPos: this.player.pos,
      playerHealth: this.player.health,
      playerMaxHealth: this.player.maxHealth,
      state: this.state,
      stageStatus: this.currentStageNumber === 1
        ? stageStatus as { keyCollected: boolean; chestOpened: boolean; gateOpen: boolean; alertCount: number }
        : undefined,
    })

    if (this.state === 'game_over') {
      this.drawGameOver(ctx)
    }

    if (this.state === 'stage_transition') {
      if (this.transitionPhase === 'banner') {
        if (this.currentStageNumber === 1) {
          this.renderer.drawVictoryBanner(ctx)
        } else {
          this.renderer.drawStage2VictoryBanner(ctx)
        }
      } else if (this.transitionPhase === 'dialog') {
        this.renderer.drawStageTransition(ctx, this.currentStageNumber)
      } else if (this.transitionPhase === 'coming_soon') {
        this.renderer.drawComingSoon(ctx)
      }
    }
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
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.state = 'playing'
  }

  private loadStage3(): void {
    this.currentStageNumber = 3
    this.currentMap = createCastleMap()
    this.currentStage = new Stage3()
    this.player.setMaxHealth(STAGE2_PLAYER_MAX_HEALTH)  // 5 hearts
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player.reset(spawnPos)
    this.player.unlockWeapons()  // sword + bow + shield
    this.projectileManager.reset()
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.state = 'playing'
  }

  /** Full game restart from Stage 1 (used by "Play Again" on victory screen) */
  private restartFromStage1(): void {
    this.homeRequested = false
    this.currentStageNumber = 1
    this.transitionPhase = 'banner'
    this.transitionTimer = 0
    this.dialogInputDelay = 0
    this.currentMap = createForestMap()
    this.currentStage = new Stage1()
    this.player.setMaxHealth(PLAYER_MAX_HEALTH)
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player.reset(spawnPos)
    this.projectileManager.reset()
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.setState('playing')
  }

  private restart(): void {
    this.transitionPhase = 'banner'
    this.transitionTimer = 0
    this.dialogInputDelay = 0
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
      this.currentStage = new Stage3()
      this.player.setMaxHealth(STAGE2_PLAYER_MAX_HEALTH)
    }
    const spawnPos = this.findWalkableSpawn(this.currentStage.playerSpawn)
    this.player.reset(spawnPos)
    // Stages 2 and 3 restarts must re-grant weapons since reset() clears inventory
    if (this.currentStageNumber >= 2) {
      this.player.unlockWeapons()
    }
    this.projectileManager.reset()
    // [RED TEAM #12] Snap camera immediately to new spawn position
    this.camera.follow(this.player.getCenter(), this.currentMap)
    this.setState('playing')
  }

  setState(state: GameState): void {
    this.state = state
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
