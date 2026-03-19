import { onMounted, onUnmounted } from 'vue'
import { SHIP_SPEED, GAME_WIDTH, GAME_HEIGHT, WEAPON_TYPES } from '../utils/config'
import {
  checkCollision,
  getWeaponStats,
  arrangeFormation,
  getRotationForWave,
} from '../utils/utils'
import { sfx } from '../utils/audio'
import type { GameState } from './useGameState'
import type { useControls } from './useControls'
import type { GameActions } from './useGameActions'
import type { Enemy, Boss } from '../utils/types'

export function useGameLoop(
  state: GameState,
  controls: ReturnType<typeof useControls>,
  actions: GameActions,
) {
  const {
    gameState,
    gamePhase,
    currentWave,
    weaponType,
    weaponLevel,
    boardRotation,
    isRotating,
    activeWidth,
    activeHeight,
    hiddenEventWavesLeft,
    player,
    bullets,
    enemyBullets,
    enemies,
    powerUps,
    bosses,
    waveAnnouncement,
    activeDots,
    engine,
  } = state

  const {
    w,
    a,
    s,
    d,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    space,
    mousePressed,
    mobileKeys,
    pointerState,
  } = controls
  const { fireBullets, handleEnemyDeath, takeDamage, addScore, startWave } = actions

  let animationFrameId: number
  const EGG_SPEED = 2.0

  const gameLoop = () => {
    if (gameState.value !== 'playing' && gameState.value !== 'starting') {
      animationFrameId = requestAnimationFrame(gameLoop)
      return
    }

    if (player.value.invulnerable > 0) player.value.invulnerable--

    let vvx = 0,
      vvy = 0
    if (a?.value || ArrowLeft?.value || mobileKeys.value.left) vvx -= SHIP_SPEED
    if (d?.value || ArrowRight?.value || mobileKeys.value.right) vvx += SHIP_SPEED
    if (w?.value || ArrowUp?.value) vvy -= SHIP_SPEED
    if (s?.value || ArrowDown?.value) vvy += SHIP_SPEED

    const theta = (boardRotation.value * Math.PI) / 180
    const local_vx = vvx * Math.cos(-theta) - vvy * Math.sin(-theta)
    const local_vy = vvx * Math.sin(-theta) + vvy * Math.cos(-theta)

    player.value.x = Math.max(
      0,
      Math.min(player.value.x + local_vx, activeWidth.value - player.value.width),
    )
    player.value.y = Math.max(
      0,
      Math.min(player.value.y + local_vy, activeHeight.value - player.value.height),
    )

    const isFiring =
      space?.value === true ||
      mobileKeys.value.fire ||
      pointerState.value.isDown ||
      mousePressed.value
    const ptMult = hiddenEventWavesLeft.value > 0 ? 2 : 1

    if (isFiring && (weaponType.value === 6 || weaponType.value === 5)) {
      sfx.init()
      if (!engine.wasSpaceDown) sfx.shoot()
      const wp = WEAPON_TYPES[weaponType.value]
      if (wp) {
        const { rays, damage } = getWeaponStats(weaponType.value, weaponLevel.value)
        const currentAttached = bullets.value.filter((b) => b.isAttached)
        if (
          currentAttached.length > 0 &&
          (currentAttached.length !== rays || currentAttached[0]?.shape !== wp.shape)
        ) {
          bullets.value = bullets.value.filter((b) => !b.isAttached)
        }

        for (let i = 0; i < rays; i++) {
          const offsetIndex = i - (rays - 1) / 2
          const bw =
            (wp.size || 10) + Math.min(weaponLevel.value, 20) * (wp.type === 'pink' ? 2 : 1)
          const offsetX = offsetIndex * (wp.type === 'lightning' ? 30 : 0)
          const rotation = offsetIndex * (wp.type === 'lightning' ? 8 : 0)

          const beamX = player.value.x + player.value.width / 2 + offsetX - bw / 2
          let targetY = -100

          if (wp.type === 'lightning') {
            const hitBoxX = beamX - Math.abs(rotation) * 2
            const hitBoxW = bw + Math.abs(rotation) * 4
            const checkBlock = (target: Enemy | Boss) => {
              if (
                target.hp > 0 &&
                target.y + target.height < player.value.y &&
                target.x + target.width > hitBoxX &&
                target.x < hitBoxX + hitBoxW
              ) {
                if (target.y + target.height / 2 > targetY) targetY = target.y + target.height / 2
              }
            }
            enemies.value.forEach(checkBlock)
            if (gamePhase.value === 'boss') bosses.value.forEach(checkBlock)
          } else {
            targetY = player.value.y - activeHeight.value + 20
          }

          const beamHeight = player.value.y - targetY + 20
          const beamY = targetY

          const existingBeam = bullets.value.find((b) => b.isAttached && b.attachedId === i)
          if (!existingBeam) {
            bullets.value.push({
              id: `b-${engine.objCounter++}-${Math.random()}`,
              attachedId: i,
              x: beamX,
              y: beamY,
              width: bw,
              height: beamHeight,
              dx: 0,
              dy: 0,
              color: wp.color || '',
              shape: wp.shape || '',
              damage,
              rotation,
              hitTargets: new Set(),
              isAttached: true,
              lastTick: Date.now(),
            })
          } else {
            existingBeam.x = beamX
            existingBeam.y = beamY
            existingBeam.width = bw
            existingBeam.height = beamHeight
            existingBeam.rotation = rotation
            if (Date.now() - (existingBeam.lastTick ?? 0) > 100) {
              existingBeam.hitTargets.clear()
              existingBeam.lastTick = Date.now()
            }
          }
        }
      }
    } else {
      for (let i = bullets.value.length - 1; i >= 0; i--) {
        const b = bullets.value[i]
        if (b && b.isAttached) {
          if (b.shape === 'bolt') bullets.value.splice(i, 1)
          else {
            b.isAttached = false
            b.dy = -(WEAPON_TYPES[6]?.speed || 40)
          }
        }
      }
    }

    fireBullets()
    engine.wasSpaceDown = isFiring

    const now = Date.now()
    for (let i = activeDots.value.length - 1; i >= 0; i--) {
      const dot = activeDots.value[i]
      if (!dot) continue
      if (now > dot.endTime) {
        activeDots.value.splice(i, 1)
        continue
      }
      if (now - dot.lastTick > 150) {
        let target: Enemy | Boss | undefined | null = enemies.value.find(
          (e) => e.id === dot.targetId,
        )
        if (!target && gamePhase.value === 'boss')
          target = bosses.value.find((b) => b.id === dot.targetId)

        if (target && target.hp > 0) {
          target.hp -= dot.damagePerTick
          dot.lastTick = now
          if (target.hp <= 0 && !bosses.value.some((b) => b.id === target?.id))
            handleEnemyDeath(target as Enemy, ptMult)
        } else {
          activeDots.value.splice(i, 1)
        }
      }
    }

    for (let i = bullets.value.length - 1; i >= 0; i--) {
      const b = bullets.value[i]
      if (!b) continue
      b.y += b.dy
      b.x += b.dx
      if (
        b.y + b.height < -500 ||
        b.y > activeHeight.value + 100 ||
        b.x < -100 ||
        b.x > activeWidth.value + 100
      )
        bullets.value.splice(i, 1)
    }

    for (let i = powerUps.value.length - 1; i >= 0; i--) {
      const pu = powerUps.value[i]
      if (!pu) continue
      pu.y += 2.5
      if (checkCollision(pu, player.value)) {
        sfx.powerup()
        if (pu.wType === -1) weaponLevel.value++
        else {
          if (weaponType.value === pu.wType) weaponLevel.value++
          else weaponType.value = pu.wType
        }
        addScore(50)
        powerUps.value.splice(i, 1)
      } else if (pu.y > activeHeight.value) {
        powerUps.value.splice(i, 1)
      }
    }

    for (let i = enemyBullets.value.length - 1; i >= 0; i--) {
      const egg = enemyBullets.value[i]
      if (!egg) continue
      egg.y += egg.dy !== undefined ? egg.dy : EGG_SPEED
      egg.x += egg.dx || 0
      if (checkCollision(egg, player.value)) {
        enemyBullets.value.splice(i, 1)
        takeDamage()
      } else if (
        egg.y > activeHeight.value ||
        egg.y < -100 || // Fix Memory Leak khi Boss nổ Nova 360 độ (Trứng bay ngược lên trên)
        egg.x < -100 ||
        egg.x > activeWidth.value + 100
      ) {
        enemyBullets.value.splice(i, 1)
      }
    }

    if (gamePhase.value === 'minions' || gamePhase.value === 'meteors') {
      if (engine.pendingSpawns.length > 0 && gameState.value !== 'starting') {
        if (gamePhase.value === 'minions') {
          const chunk = engine.pendingSpawns.splice(0, 10)
          enemies.value.push(...chunk)
        } else {
          if (engine.hazardSpawnCooldown <= 0) {
            const isMeteorZ = currentWave.value % 100 >= 71 && currentWave.value % 100 <= 79
            const spawns = isMeteorZ && Math.random() < 0.4 ? 2 : 1
            for (let s = 0; s < spawns; s++) {
              const nextHazard = engine.pendingSpawns.pop()
              if (nextHazard) enemies.value.push(nextHazard)
            }
            if (isMeteorZ) {
              engine.hazardSpawnCooldown = 15 + Math.random() * 10
            } else if (currentWave.value % 10 === 8) {
              engine.hazardSpawnCooldown = 35 + Math.random() * 25
            } else {
              engine.hazardSpawnCooldown = 25 + Math.random() * 20
            }
          } else {
            engine.hazardSpawnCooldown--
          }
        }
      }

      if (gamePhase.value === 'minions') {
        const isDynamicWave = currentWave.value % 10 === 6
        if (isDynamicWave) {
          engine.formationCenter.x += engine.formationCenter.dx * engine.waveEnemySpeed
          if (engine.formationCenter.x < 150 || engine.formationCenter.x > activeWidth.value - 150)
            engine.formationCenter.dx *= -1
          engine.formationTimer--
          if (engine.formationTimer <= 0) {
            engine.formationTimer = 250
            engine.formationType = (engine.formationType + 1) % 3
            arrangeFormation(enemies.value, engine.formationType)
            arrangeFormation(engine.pendingSpawns, engine.formationType)
          }

          enemies.value.forEach((enemy) => {
            if (
              !enemy.isHazard &&
              enemy.targetOffsetX !== undefined &&
              enemy.targetOffsetY !== undefined
            ) {
              const tx = engine.formationCenter.x + enemy.targetOffsetX
              const ty = engine.formationCenter.y + enemy.targetOffsetY
              enemy.x += (tx - enemy.x) * 0.05
              enemy.y += (ty - enemy.y) * 0.05
            } else if (enemy.isHazard) {
              enemy.y += enemy.dy || 5
              if (enemy.dx) enemy.x += enemy.dx
            }
          })

          if (
            Math.random() < engine.waveEggFireRate &&
            enemies.value.length > 0 &&
            gameState.value === 'playing'
          ) {
            const shootingEnemies = enemies.value.filter(
              (e) => !e.isStash && !e.isHazard && e.y >= 0,
            )
            if (shootingEnemies.length > 0) {
              const randomEnemy =
                shootingEnemies[Math.floor(Math.random() * shootingEnemies.length)]
              if (randomEnemy)
                enemyBullets.value.push({
                  id: engine.objCounter++,
                  x: randomEnemy.x + randomEnemy.width / 2 - 8,
                  y: randomEnemy.y + randomEnemy.height,
                  width: 20,
                  height: 25,
                  isBossEgg: false,
                })
            }
          }
        } else {
          let isSpawning = false
          enemies.value.forEach((enemy) => {
            if (enemy.isHazard) {
              enemy.y += enemy.dy || 5
              if (enemy.dx) enemy.x += enemy.dx
            } else {
              if (enemy.targetY !== undefined && enemy.y < enemy.targetY) {
                enemy.y += 4
                isSpawning = true
                if (enemy.y > enemy.targetY) enemy.y = enemy.targetY
              }
            }
          })
          if (!isSpawning) {
            let hitWall = false
            enemies.value.forEach((enemy) => {
              if (!enemy.isHazard) {
                enemy.x += engine.waveEnemySpeed * engine.enemyDirection
                if (enemy.x <= 0 || enemy.x + enemy.width >= activeWidth.value) hitWall = true
              }
            })
            if (hitWall) {
              engine.enemyDirection *= -1
              enemies.value.forEach((enemy) => {
                if (!enemy.isHazard) {
                  enemy.y += 10
                  if (enemy.targetY !== undefined) enemy.targetY += 10
                }
              })
            }
            if (
              Math.random() < engine.waveEggFireRate &&
              enemies.value.length > 0 &&
              gameState.value === 'playing'
            ) {
              const shootingEnemies = enemies.value.filter(
                (e) => !e.isStash && !e.isHazard && e.y >= 0,
              )
              if (shootingEnemies.length > 0) {
                const randomEnemy =
                  shootingEnemies[Math.floor(Math.random() * shootingEnemies.length)]
                if (randomEnemy)
                  enemyBullets.value.push({
                    id: engine.objCounter++,
                    x: randomEnemy.x + randomEnemy.width / 2 - 8,
                    y: randomEnemy.y + randomEnemy.height,
                    width: 20,
                    height: 25,
                    isBossEgg: false,
                  })
              }
            }
          }
        }

        if (
          hiddenEventWavesLeft.value > 0 &&
          Math.random() < 0.02 &&
          gameState.value === 'playing'
        ) {
          const size = 30 + Math.random() * 30
          enemies.value.push({
            id: `hazard-${engine.objCounter++}`,
            x: Math.random() * activeWidth.value,
            y: -100,
            width: size,
            height: size,
            hp: 20 + currentWave.value * 2,
            maxHp: 20 + currentWave.value * 2,
            isMeteor: true,
            isHazard: true,
            dy: engine.waveEnemySpeed * 2,
            dx: (Math.random() - 0.5) * 2,
          })
        }
      } else {
        enemies.value.forEach((meteor) => {
          meteor.y += meteor.dy || engine.waveEnemySpeed * 1.5
          if (meteor.dx) meteor.x += meteor.dx
        })
        if (
          Math.random() < engine.waveEggFireRate * 1.5 &&
          enemies.value.length > 0 &&
          gameState.value === 'playing'
        ) {
          const fallingChickens = enemies.value.filter(
            (e) => e.isFallingChicken && e.y >= 0 && e.y < activeHeight.value - 100,
          )
          if (fallingChickens.length > 0) {
            const randomChicken =
              fallingChickens[Math.floor(Math.random() * fallingChickens.length)]
            if (randomChicken) {
              enemyBullets.value.push({
                id: `falling-egg-${engine.objCounter++}`,
                x: randomChicken.x + randomChicken.width / 2 - 8,
                y: randomChicken.y + randomChicken.height,
                width: 20,
                height: 25,
                isBossEgg: false,
                dy: EGG_SPEED,
              })
            }
          }
        }
      }

      for (let bIndex = bullets.value.length - 1; bIndex >= 0; bIndex--) {
        let bulletHit = false
        const bullet = bullets.value[bIndex]
        if (!bullet) continue
        for (let eIndex = enemies.value.length - 1; eIndex >= 0; eIndex--) {
          const enemy = enemies.value[eIndex]
          if (!enemy) continue
          if (checkCollision(bullet, enemy)) {
            if (bullet.hitTargets.has(enemy.id)) continue
            enemy.hp -= bullet.damage
            sfx.hit()

            if (bullet.shape === 'blob') {
              const existingDot = activeDots.value.find((d) => d.targetId === enemy.id)
              const dotDamage = bullet.damage * 0.4
              if (existingDot) {
                existingDot.endTime = Date.now() + 2000
                existingDot.damagePerTick = dotDamage
              } else {
                activeDots.value.push({
                  targetId: enemy.id,
                  damagePerTick: dotDamage,
                  endTime: Date.now() + 2000,
                  lastTick: Date.now(),
                })
              }
            }

            if (['beam', 'wavy-beam', 'shard', 'bolt'].includes(bullet.shape)) {
              bullet.hitTargets.add(enemy.id)
            } else {
              bulletHit = true
            }

            if (enemy.hp <= 0) {
              handleEnemyDeath(enemy, ptMult)
            }
            if (bulletHit) break
          }
        }
        if (bulletHit) bullets.value.splice(bIndex, 1)
      }

      for (let i = enemies.value.length - 1; i >= 0; i--) {
        const enemy = enemies.value[i]
        if (!enemy) continue
        if (checkCollision(enemy, player.value)) {
          takeDamage()
          enemies.value.splice(i, 1)
        } else if (
          enemy.y > activeHeight.value ||
          enemy.x < -200 ||
          enemy.x > activeWidth.value + 200
        ) {
          if (gamePhase.value === 'minions' && !enemy.isHazard) {
            takeDamage()
            enemies.value.splice(i, 1)
          } else enemies.value.splice(i, 1)
        }
      }

      const activeEnemies = enemies.value.filter((e) => !e.isHazard)

      if (
        activeEnemies.length === 0 &&
        engine.pendingSpawns.length === 0 &&
        !engine.isTransitioningWave
      ) {
        engine.isTransitioningWave = true
        addScore(1000 * ptMult)
        const nextW = currentWave.value + 1
        const nextRot = getRotationForWave(nextW)
        const willRotate = boardRotation.value !== nextRot
        waveAnnouncement.value = `WAVE ${nextW}${hiddenEventWavesLeft.value > 0 ? '\n☄️ x2 ĐIỂM ☄️' : ''}`

        if (willRotate) {
          bullets.value = []
          enemyBullets.value = []
          powerUps.value = []
          activeDots.value = []
          enemies.value = []
          isRotating.value = true
          boardRotation.value = nextRot
          if (Math.abs(nextRot % 180) === 90) {
            activeWidth.value = GAME_HEIGHT
            activeHeight.value = GAME_WIDTH
          } else {
            activeWidth.value = GAME_WIDTH
            activeHeight.value = GAME_HEIGHT
          }
          player.value.x = activeWidth.value / 2 - player.value.width / 2
          player.value.y = activeHeight.value - 90

          setTimeout(() => {
            isRotating.value = false
            setTimeout(() => {
              currentWave.value++
              startWave(currentWave.value)
              waveAnnouncement.value = ''
              engine.isTransitioningWave = false
            }, 1000)
          }, 1000)
        } else {
          setTimeout(() => {
            currentWave.value++
            startWave(currentWave.value)
            waveAnnouncement.value = ''
            engine.isTransitioningWave = false
          }, 2000)
        }
      }
    } else if (gamePhase.value === 'boss') {
      bosses.value.forEach((b) => {
        if (b.hp <= 0) return
        if (checkCollision(b, player.value)) {
          takeDamage()
        }

        if (b.targetY !== undefined && b.y < b.targetY) {
          b.y += 4
        } else if (gameState.value === 'playing') {
          if (b.bossType === 1) {
            // GÀ TRỐNG THƯỜNG
            b.x += (engine.waveEnemySpeed + 2) * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1
            b.y = b.targetY! + Math.sin(Date.now() / 300) * 30
            if (Math.random() < engine.waveEggFireRate * 1.5) {
              // 30% tung chưởng xả 3 trứng tủa ra
              if (Math.random() < 0.3) {
                ;[-4, 0, 4].forEach((dx) => {
                  enemyBullets.value.push({
                    id: `boss-egg-${engine.objCounter++}`,
                    x: b.x + b.width / 2 - 12,
                    y: b.y + b.height,
                    width: 30,
                    height: 35,
                    isBossEgg: true,
                    dx,
                    dy: EGG_SPEED,
                  })
                })
              } else {
                enemyBullets.value.push({
                  id: `boss-egg-${engine.objCounter++}`,
                  x: b.x + b.width / 2 - 12,
                  y: b.y + b.height,
                  width: 30,
                  height: 35,
                  isBossEgg: true,
                })
              }
            }
          } else if (b.bossType === 2) {
            // UFO
            b.x += engine.waveEnemySpeed * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1
            if (b.laserTimer !== undefined && b.laserTimer > 0) {
              b.laserTimer--
            } else {
              if (b.state === 'idle') {
                b.state = 'laser_warning'
                b.laserTimer = 50
                // 35% tỷ lệ bắn 3 cột Laser kín map
                if (Math.random() < 0.35) {
                  const cx = b.x + b.width / 2 - 40
                  b.laserXs = [cx - 150, cx, cx + 150]
                  b.laserX = undefined
                } else {
                  b.laserX = b.x + b.width / 2 - 40
                  b.laserXs = undefined
                }
              } else if (b.state === 'laser_warning') {
                b.state = 'laser_firing'
                b.laserTimer = 15
              } else {
                b.state = 'idle'
                b.laserTimer = 100 // Tăng tốc độ xả Laser (giảm delay từ 200 -> 100)
                b.laserXs = undefined
              }
            }
            if (b.state === 'laser_firing') {
              const lxs = b.laserXs || (b.laserX !== undefined ? [b.laserX] : [])
              lxs.forEach((lx) => {
                const laserHitbox = {
                  x: lx,
                  y: b.y + b.height,
                  width: 80,
                  height: activeHeight.value,
                }
                if (checkCollision(player.value, laserHitbox)) takeDamage()
              })
            }
          } else if (b.bossType === 3) {
            // MECHA SHIP
            if (b.stateTimer !== undefined) b.stateTimer -= 1
            if (b.stateTimer !== undefined && b.stateTimer <= 0) {
              const r = Math.random()
              if (r < 0.3) {
                b.state = 'dash'
                b.stateTimer = 80
                b.direction *= -1
              } else if (r < 0.6) {
                b.state = 'burst'
                b.stateTimer = 120
                b.burstCount = 4
              } else {
                b.state = 'idle'
                b.stateTimer = 100
              }
            }
            let bSpeed = engine.waveEnemySpeed * 0.8
            if (b.state === 'dash') bSpeed = engine.waveEnemySpeed + 3
            if (b.state === 'burst') bSpeed = engine.waveEnemySpeed * 0.2
            b.x += bSpeed * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) {
              b.direction *= -1
              b.x = Math.max(0, Math.min(b.x, activeWidth.value - b.width))
            }

            if (
              b.state === 'burst' &&
              b.burstCount !== undefined &&
              b.burstCount > 0 &&
              b.stateTimer !== undefined &&
              b.stateTimer % 40 === 0
            ) {
              ;[-4, 0, 4].forEach((eggDx) => {
                enemyBullets.value.push({
                  id: `boss-egg-${engine.objCounter++}`,
                  x: b.x + b.width / 2 - 12,
                  y: b.y + b.height - 20,
                  width: 30,
                  height: 35,
                  isBossEgg: true,
                  dx: eggDx,
                  dy: 6,
                })
              })
              b.burstCount--
            }
            if (Math.random() < engine.waveEggFireRate * 1.0 && b.state !== 'burst') {
              enemyBullets.value.push({
                id: `boss-egg-${engine.objCounter++}`,
                x: b.x + b.width / 2 - 12,
                y: b.y + b.height - 20,
                width: 30,
                height: 35,
                isBossEgg: true,
              })
            }
            if (b.laserTimer !== undefined && b.laserTimer > 0) {
              b.laserTimer--
            } else {
              if (b.state === 'idle' || b.state === 'dash') {
                b.state = 'laser_warning'
                b.laserTimer = 60
                b.laserX = b.x + b.width / 2 - 40
              } else if (b.state === 'laser_warning') {
                b.state = 'laser_firing'
                b.laserTimer = 15
              } else {
                b.state = 'idle'
                b.laserTimer = 300
              }
            }
            if (b.state === 'laser_firing' && b.laserX !== undefined) {
              const laserHitbox = {
                x: b.laserX,
                y: b.y + b.height,
                width: 80,
                height: activeHeight.value,
              }
              if (checkCollision(player.value, laserHitbox)) takeDamage()
            }
          } else if (b.bossType === 4) {
            // GÀ TRỐNG ĐEN (HARD ROOSTER)
            b.x += (engine.waveEnemySpeed + 1) * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1
            if (Math.random() < engine.waveEggFireRate * 1.5) {
              // 30% tung chưởng xả 3 thiên thạch nảy tủa ra
              if (Math.random() < 0.3) {
                ;[-4, 0, 4].forEach((dx) => {
                  enemyBullets.value.push({
                    id: `boss-meteor-${engine.objCounter++}`,
                    x: b.x + b.width / 2 - 20,
                    y: b.y + b.height - 10,
                    width: 40,
                    height: 40,
                    isBossEgg: true,
                    isMeteor: true,
                    dy: EGG_SPEED + 1,
                    dx: dx + (Math.random() - 0.5) * 2,
                  })
                })
              } else {
                enemyBullets.value.push({
                  id: `boss-meteor-${engine.objCounter++}`,
                  x: b.x + b.width / 2 - 20,
                  y: b.y + b.height - 10,
                  width: 40,
                  height: 40,
                  isBossEgg: true,
                  isMeteor: true,
                  dy: EGG_SPEED + 1,
                  dx: (Math.random() - 0.5) * 2,
                })
              }
            }
          } else if (b.bossType === 5) {
            b.x += (engine.waveEnemySpeed + 1) * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1

            // Nếu không đang tụ lực thì thi thoảng mới rớt trứng nhẹ
            if (Math.random() < engine.waveEggFireRate * 1.0 && b.state !== 'circle_burst') {
              enemyBullets.value.push({
                id: `boss-egg-${engine.objCounter++}`,
                x: b.x + b.width / 2 - 12,
                y: b.y + b.height - 20,
                width: 30,
                height: 35,
                isBossEgg: true,
              })
            }

            if (b.laserTimer !== undefined && b.laserTimer > 0) {
              b.laserTimer--
            } else {
              if (b.state === 'idle') {
                if (Math.random() < 0.5) {
                  b.state = 'laser_warning'
                  b.laserTimer = 60
                  b.laserX = b.x + b.width / 2 - 40
                } else {
                  b.state = 'circle_burst' // Gồng năng lượng nổ Nova 360
                  b.laserTimer = 40
                }
              } else if (b.state === 'laser_warning') {
                b.state = 'laser_firing'
                b.laserTimer = 15
              } else if (b.state === 'circle_burst') {
                // TUNG CHƯỞNG MƯA TRỨNG 360 ĐỘ (Nova)
                const cx = b.x + b.width / 2 - 15
                const cy = b.y + b.height - 20
                for (let i = 0; i < 12; i++) {
                  const angle = (Math.PI * 2 * i) / 12
                  enemyBullets.value.push({
                    id: `boss-egg-${engine.objCounter++}`,
                    x: cx,
                    y: cy,
                    width: 30,
                    height: 35,
                    isBossEgg: true,
                    dx: Math.cos(angle) * 5,
                    dy: Math.sin(angle) * 5,
                  })
                }
                b.state = 'idle'
                b.laserTimer = 180
              } else {
                b.state = 'idle'
                b.laserTimer = 200
              }
            }
            if (b.state === 'laser_firing' && b.laserX !== undefined) {
              const laserHitbox = {
                x: b.laserX,
                y: b.y + b.height,
                width: 80,
                height: activeHeight.value,
              }
              if (checkCollision(player.value, laserHitbox)) takeDamage()
            }
          } else {
            // GÀ CHÚA (GIANT CHICKEN)
            b.x += (engine.waveEnemySpeed + 1) * b.direction
            if (b.x <= 0 || b.x + b.width >= activeWidth.value) b.direction *= -1

            // Nếu không đang tụ lực thì thi thoảng mới rớt trứng nhẹ
            if (Math.random() < engine.waveEggFireRate * 1.0 && b.state !== 'circle_burst') {
              enemyBullets.value.push({
                id: `boss-egg-${engine.objCounter++}`,
                x: b.x + b.width / 2 - 12,
                y: b.y + b.height - 20,
                width: 30,
                height: 35,
                isBossEgg: true,
              })
            }

            if (b.laserTimer !== undefined && b.laserTimer > 0) {
              b.laserTimer--
            } else {
              if (b.state === 'idle') {
                b.state = 'laser_warning'
                b.laserTimer = 60
                b.laserX = b.x + b.width / 2 - 40
              } else if (b.state === 'laser_warning') {
                b.state = 'laser_firing'
                b.laserTimer = 15
              } else {
                b.state = 'idle'
                b.laserTimer = 200
              }
            }
            if (b.state === 'laser_firing' && b.laserX !== undefined) {
              const laserHitbox = {
                x: b.laserX,
                y: b.y + b.height,
                width: 80,
                height: activeHeight.value,
              }
              if (checkCollision(player.value, laserHitbox)) takeDamage()
            }
          }
        }
      })

      for (let bIndex = bullets.value.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets.value[bIndex]
        if (!bullet) continue
        for (let i = 0; i < bosses.value.length; i++) {
          const b = bosses.value[i]
          if ((b && b.hp <= 0) || !b) continue
          if (checkCollision(bullet, b)) {
            if (bullet.hitTargets.has(b.id)) continue
            b.hp -= bullet.damage
            sfx.hit()

            if (bullet.shape === 'blob') {
              const existingDot = activeDots.value.find((d) => d.targetId === b.id)
              const dotDamage = bullet.damage * 0.4
              if (existingDot) {
                existingDot.endTime = Date.now() + 2000
                existingDot.damagePerTick = dotDamage
              } else {
                activeDots.value.push({
                  targetId: b.id,
                  damagePerTick: dotDamage,
                  endTime: Date.now() + 2000,
                  lastTick: Date.now(),
                })
              }
            }

            if (['beam', 'wavy-beam', 'shard', 'bolt'].includes(bullet.shape)) {
              bullet.hitTargets.add(b.id)
            } else {
              bullets.value.splice(bIndex, 1)
              break
            }
          }
        }
      }

      const allBossesDead = bosses.value.length > 0 && bosses.value.every((b) => b.hp <= 0)

      if (allBossesDead && !engine.isTransitioningWave) {
        sfx.explode()
        engine.isTransitioningWave = true
        addScore(1000 * ptMult)
        const nextW = currentWave.value + 1
        const nextRot = getRotationForWave(nextW)
        const willRotate = boardRotation.value !== nextRot
        waveAnnouncement.value = `WAVE ${nextW}${hiddenEventWavesLeft.value > 0 ? '\n☄️ x2 ĐIỂM ☄️' : ''}`

        if (willRotate) {
          bullets.value = []
          enemyBullets.value = []
          powerUps.value = []
          activeDots.value = []
          enemies.value = []
          isRotating.value = true
          boardRotation.value = nextRot
          if (Math.abs(nextRot % 180) === 90) {
            activeWidth.value = GAME_HEIGHT
            activeHeight.value = GAME_WIDTH
          } else {
            activeWidth.value = GAME_WIDTH
            activeHeight.value = GAME_HEIGHT
          }
          player.value.x = activeWidth.value / 2 - player.value.width / 2
          player.value.y = activeHeight.value - 90

          setTimeout(() => {
            isRotating.value = false
            setTimeout(() => {
              currentWave.value++
              startWave(currentWave.value)
              waveAnnouncement.value = ''
              engine.isTransitioningWave = false
            }, 1000)
          }, 1000)
        } else {
          setTimeout(() => {
            currentWave.value++
            startWave(currentWave.value)
            waveAnnouncement.value = ''
            engine.isTransitioningWave = false
          }, 2000)
        }
      }
    }
    animationFrameId = requestAnimationFrame(gameLoop)
  }

  onMounted(() => {
    gameLoop()
  })
  onUnmounted(() => {
    if (state.resumeInterval.value) clearInterval(state.resumeInterval.value)
    cancelAnimationFrame(animationFrameId)
  })
}
