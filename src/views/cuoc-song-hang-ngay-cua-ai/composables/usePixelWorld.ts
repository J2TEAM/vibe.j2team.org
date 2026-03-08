import { ref } from 'vue'
import type { SmartAgent, Point, AgentState, ActionZone, Rect } from '../types'
import { GRID_W, GRID_H, WALKABLE_AREA, ACTION_ZONES } from '../constants'

export function usePixelWorld(agents: SmartAgent[]) {
  const collisionGrid = ref<boolean[][]>([])

  const isFootPosAllowed = (x: number, y: number) => {
    const gx = Math.floor(x)
    const gy = Math.floor(y)
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false
    return !collisionGrid.value[gy]?.[gx]
  }

  const getRandomValidPos = () => {
    let rx,
      ry,
      attempts = 0
    do {
      rx = WALKABLE_AREA.minX + Math.random() * (WALKABLE_AREA.maxX - WALKABLE_AREA.minX)
      ry = WALKABLE_AREA.minY + Math.random() * (WALKABLE_AREA.maxY - WALKABLE_AREA.minY)
      attempts++
      // Kiểm tra trực tiếp tại rx, ry vì đây đã là tâm chân
    } while (!isFootPosAllowed(rx, ry) && attempts < 100)
    return { x: rx, y: ry }
  }

  function getPath(start: Point, end: Point): Point[] {
    const startX = Math.floor(start.x)
    const startY = Math.floor(start.y)
    const endX = Math.floor(end.x)
    const endY = Math.floor(end.y)
    if (startX === endX && startY === endY) return [end]
    const queue: { x: number; y: number; path: Point[] }[] = [{ x: startX, y: startY, path: [] }]
    const visited = new Set<string>()
    visited.add(`${startX},${startY}`)
    while (queue.length > 0) {
      const { x, y, path } = queue.shift()!
      if (x === endX && y === endY) return [...path, end]
      const neighbors = [
        { nx: x + 1, ny: y },
        { nx: x - 1, ny: y },
        { nx: x, ny: y + 1 },
        { nx: x, ny: y - 1 },
      ]
      for (const { nx, ny } of neighbors) {
        // Sử dụng nx, ny trực tiếp
        if (
          nx >= 0 &&
          nx < GRID_W &&
          ny >= 0 &&
          ny < GRID_H &&
          isFootPosAllowed(nx, ny) &&
          !visited.has(`${nx},${ny}`)
        ) {
          visited.add(`${nx},${ny}`)
          queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] })
        }
      }
    }
    return [end]
  }

  const setAgentTarget = (agent: SmartAgent, target: Point, state: AgentState) => {
    if (agent.isResponding || isFootPosAllowed(target.x, target.y)) {
      agent.target = target
      // Cho phép tìm đường khi đang tập kết (gathering) kể cả khi đang trả lời
      agent.path = agent.isResponding && state !== 'gathering' ? [] : getPath(agent.pos, target)
      agent.targetNodeIdx = 0
      agent.state = state
    }
  }

  const checkZones = (agent: SmartAgent) => {
    const now = Date.now()
    if (now < agent.delayUntil || agent.isResponding) return
    const fx = agent.pos.x
    const fy = agent.pos.y

    for (const zone of ACTION_ZONES as ActionZone[]) {
      // Kiểm tra xem vị trí hiện tại có nằm trong vùng nào của zone không
      const rects = zone.rects ? zone.rects : [zone.rect]
      const isInZone = rects.some(
        (r: Rect | undefined) => r && fx >= r.x1 && fx <= r.x2 && fy >= r.y1 && fy <= r.y2,
      )

      if (isInZone) {
        // Nếu AI vừa kết thúc hành động tại đây (statusText trùng với tên vùng và đã hết delay)
        if (agent.statusText === zone.name) {
          agent.statusText = 'THONG THẢ'
          agent.statusIcon = null
          agent.state = 'idle'
          setAgentTarget(agent, getRandomValidPos(), 'idle')
          return
        }

        // Nếu vùng có tọa độ đích cụ thể (như giường ngủ) và AI chưa đứng đúng điểm đó
        if (
          zone.targetPos &&
          (Math.abs(agent.pos.x - zone.targetPos.x) > 0.1 ||
            Math.abs(agent.pos.y - zone.targetPos.y) > 0.1)
        ) {
          setAgentTarget(agent, zone.targetPos, 'walking')
          return
        }

        // Bắt đầu hành động mới
        agent.statusText = zone.name
        agent.statusIcon = zone.icon
        agent.delayUntil = now + zone.delay
        agent.state = zone.name === 'Ngủ' ? 'sleeping' : 'working'
        return
      }
    }
    agent.statusText = 'THONG THẢ'
    agent.statusIcon = null
    agent.state = 'idle'
  }

  const updateAgents = (dt: number) => {
    agents.forEach((agent) => {
      const now = Date.now()
      if (now < agent.delayUntil && !agent.isResponding) return

      // Tốc độ mặc định
      let speed = 0.005 * dt

      // Nếu đang tập kết để trả lời, tăng tốc độ lên cực cao (nhanh gấp 10 lần)
      if (agent.state === 'gathering') {
        speed = 0.05 * dt
      }

      const dx = agent.target.x - agent.pos.x
      const dy = agent.target.y - agent.pos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 0.05) {
        const moveX = (dx / dist) * speed
        const moveY = (dy / dist) * speed
        const nextX = agent.pos.x + moveX
        const nextY = agent.pos.y + moveY

        // Đi xuyên tường nếu đang tập kết (gathering)
        if (agent.state === 'gathering' || isFootPosAllowed(nextX, nextY)) {
          agent.pos.x = nextX
          agent.pos.y = nextY
          agent.state = agent.state === 'gathering' ? 'gathering' : 'walking'
        } else {
          const newTarget = getRandomValidPos()
          agent.target = newTarget
          agent.path = []
          agent.state = 'walking'
        }
      } else {
        agent.pos.x = agent.target.x
        agent.pos.y = agent.target.y
        if (agent.state === 'walking') agent.state = 'idle'
        checkZones(agent)
      }
    })
  }

  return {
    collisionGrid,
    isFootPosAllowed,
    getRandomValidPos,
    setAgentTarget,
    updateAgents,
  }
}
