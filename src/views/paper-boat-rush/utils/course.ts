import type { Obstacle, Whirlpool } from '../types'
import type { DifficultyConfig } from './difficulty'

function createSeededRandom(inputSeed: number) {
  let state = inputSeed % 2147483647
  if (state <= 0) {
    state += 2147483646
  }

  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

export function buildCourse(seed: number, width: number, height: number, config: DifficultyConfig) {
  const random = createSeededRandom(seed)

  const generatedObstacles: Obstacle[] = []
  for (let index = 0; index < config.obstacleCount; index++) {
    let x = width / 2
    let y = height / 2

    for (let retry = 0; retry < 24; retry++) {
      x = 28 + random() * (width - 56)
      y = 88 + random() * (height - 188)
      const farFromStart = Math.abs(y - (height - 48)) > 86
      const farFromFinish = y > 72
      const farFromCenter = Math.abs(x - width / 2) > 26 || retry > 10
      if (farFromStart && farFromFinish) {
        if (farFromCenter) {
          break
        }
      }
    }

    generatedObstacles.push({
      id: index,
      baseX: x,
      x,
      y,
      radius:
        config.obstacleRadiusMin + random() * (config.obstacleRadiusMax - config.obstacleRadiusMin),
      speed:
        config.obstacleSpeedMin + random() * (config.obstacleSpeedMax - config.obstacleSpeedMin),
      sway: config.obstacleSwayMin + random() * (config.obstacleSwayMax - config.obstacleSwayMin),
      phase: random() * Math.PI * 2,
    })
  }

  const generatedWhirlpools: Whirlpool[] = []
  for (let index = 0; index < config.whirlpoolCount; index++) {
    const x = 55 + random() * (width - 110)
    const y = 120 + random() * (height - 270)
    generatedWhirlpools.push({
      id: index,
      x,
      y,
      radius:
        config.whirlpoolRadiusMin +
        random() * (config.whirlpoolRadiusMax - config.whirlpoolRadiusMin),
      strength:
        config.whirlpoolStrengthMin +
        random() * (config.whirlpoolStrengthMax - config.whirlpoolStrengthMin),
      spinOffset: random() * 360,
    })
  }

  return {
    obstacles: generatedObstacles,
    whirlpools: generatedWhirlpools,
  }
}
