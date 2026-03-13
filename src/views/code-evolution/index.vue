<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { LANGUAGES, RECIPES } from './data'

interface WorkspaceItem {
  id: string
  x: number
  y: number
  instanceId: number
  isHighlight: boolean
}

const router = useRouter()
const unlockedIds = ref<string[]>(['binary', 'logic', 'math', 'internet'])
const workspaceItems = ref<WorkspaceItem[]>([])
let instanceCounter = 0
const draggingItem = ref<WorkspaceItem | null>(null)
const offset = { x: 0, y: 0 }

// LOGIC CHIẾN THẮNG
const isVictory = computed(() => unlockedIds.value.length === Object.keys(LANGUAGES).length)

const goHome = () => {
  router.push('/')
}

const addItem = (id: string, x: number, y: number) => {
  const newItem = { id, x, y, instanceId: instanceCounter++, isHighlight: false }
  workspaceItems.value.push(newItem)
  checkMerge(newItem)
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  const id = e.dataTransfer?.getData('langId')
  if (!id || !LANGUAGES[id]) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  addItem(id, e.clientX - rect.left, e.clientY - rect.top)
}

const onSidebarDragStart = (e: DragEvent, id: string) => {
  e.dataTransfer?.setData('langId', id)
}

const checkMerge = (item: WorkspaceItem) => {
  const target = workspaceItems.value.find((other) => {
    if (other.instanceId === item.instanceId) return false
    const d = Math.sqrt((other.x - item.x) ** 2 + (other.y - item.y) ** 2)
    return d < 65
  })

  if (target) {
    const pair = [item.id, target.id].sort().join('+')
    const resultId = RECIPES[pair]
    if (resultId && LANGUAGES[resultId]) {
      workspaceItems.value = workspaceItems.value.filter(
        (i) => i.instanceId !== item.instanceId && i.instanceId !== target.instanceId,
      )
      addItem(resultId, target.x, target.y)
      if (!unlockedIds.value.includes(resultId)) unlockedIds.value.push(resultId)
    }
  }
}

const getPointerPos = (e: MouseEvent | TouchEvent) => {
  if ('touches' in e) {
    const t = e.touches[0]
    if (t) return { x: t.clientX, y: t.clientY }
  } else {
    const m = e as MouseEvent
    return { x: m.clientX, y: m.clientY }
  }
  return { x: 0, y: 0 }
}

const startMove = (e: MouseEvent | TouchEvent, item: WorkspaceItem) => {
  draggingItem.value = item
  const pos = getPointerPos(e)
  offset.x = pos.x - item.x
  offset.y = pos.y - item.y
}

const onMove = (e: MouseEvent | TouchEvent) => {
  if (!draggingItem.value) return
  const pos = getPointerPos(e)

  draggingItem.value.x = pos.x - offset.x
  draggingItem.value.y = pos.y - offset.y

  workspaceItems.value.forEach((other) => {
    if (other.instanceId === draggingItem.value?.instanceId) return
    const d = Math.sqrt(
      (other.x - draggingItem.value!.x) ** 2 + (other.y - draggingItem.value!.y) ** 2,
    )
    const pair = [draggingItem.value!.id, other.id].sort().join('+')
    other.isHighlight = d < 80 && !!RECIPES[pair]
  })
}

const endMove = () => {
  if (draggingItem.value) checkMerge(draggingItem.value)
  draggingItem.value = null
  workspaceItems.value.forEach((i) => (i.isHighlight = false))
}

const resetGame = () => {
  unlockedIds.value = ['binary', 'logic', 'math', 'internet']
  workspaceItems.value = []
}

onUnmounted(() => {
  workspaceItems.value = []
})
</script>

<template>
  <div
    class="alchemy-container prevent-select"
    @mousemove="onMove"
    @mouseup="endMove"
    @touchmove="onMove"
    @touchend="endMove"
  >
    <div v-if="isVictory" class="victory-overlay">
      <div class="victory-card">
        <div class="victory-icon">🏆</div>
        <h2>THÀNH TỰU TỐI THƯỢNG!</h2>
        <p>Bạn đã khám phá ra toàn bộ bí mật của lịch sử lập trình.</p>
        <div class="victory-buttons">
          <button @click="resetGame" class="btn-replay">CHƠI LẠI</button>
          <button @click="goHome" class="btn-home">VỀ SẢNH</button>
        </div>
      </div>
    </div>

    <div class="workspace" @dragover.prevent @drop="onDrop">
      <div class="top-nav">
        <button @click="goHome" class="back-btn">← SẢNH</button>
        <div class="status-badge" :class="{ 'victory-glow': isVictory }">
          KHÁM PHÁ: {{ unlockedIds.length }} / {{ Object.keys(LANGUAGES).length }}
        </div>
      </div>

      <div
        v-for="item in workspaceItems"
        :key="item.instanceId"
        class="element"
        :class="{
          dragging: draggingItem?.instanceId === item.instanceId,
          'merge-ready': item.isHighlight,
        }"
        :style="{
          left: item.x + 'px',
          top: item.y + 'px',
          borderTopColor: LANGUAGES[item.id]?.color,
        }"
        @mousedown="startMove($event, item)"
        @touchstart="startMove($event, item)"
      >
        <div class="element-content">
          <img
            v-if="LANGUAGES[item.id]?.icon.startsWith('http')"
            :src="LANGUAGES[item.id]?.icon"
            class="icon-img"
            draggable="false"
          />
          <span v-else class="icon-text">{{ LANGUAGES[item.id]?.icon }}</span>
          <span class="label">{{ LANGUAGES[item.id]?.name }}</span>
        </div>
      </div>

      <button @click="workspaceItems = []" class="clear-btn">DỌN DẸP</button>
    </div>

    <aside class="sidebar">
      <div class="sidebar-title">KHO LƯU TRỮ</div>
      <div class="inventory scrollbar-hidden">
        <div
          v-for="id in unlockedIds"
          :key="id"
          class="inv-card"
          draggable="true"
          @dragstart="onSidebarDragStart($event, id)"
        >
          <div class="card-box" :style="{ borderColor: LANGUAGES[id]?.color + '40' }">
            <img
              v-if="LANGUAGES[id]?.icon.startsWith('http')"
              :src="LANGUAGES[id]?.icon"
              class="inv-img"
            />
            <span v-else class="inv-text">{{ LANGUAGES[id]?.icon }}</span>
          </div>
          <span class="inv-name">{{ LANGUAGES[id]?.name }}</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.alchemy-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #020617;
  color: #f1f5f9;
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  position: relative;
}

/* CSS VICTORY */
.victory-overlay {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.5s ease;
}

.victory-card {
  background: #0f172a;
  padding: 40px;
  border-radius: 30px;
  border: 2px solid #22d3ee;
  text-align: center;
  box-shadow: 0 0 50px rgba(34, 211, 238, 0.3);
  max-width: 400px;
}

.victory-icon {
  font-size: 60px;
  margin-bottom: 20px;
}
.victory-card h2 {
  color: #22d3ee;
  margin-bottom: 10px;
  font-size: 1.5rem;
}
.victory-card p {
  opacity: 0.7;
  margin-bottom: 30px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.victory-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}
.btn-replay,
.btn-home {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  border: none;
}
.btn-replay {
  background: #22d3ee;
  color: #020617;
}
.btn-home {
  background: #1e293b;
  color: white;
}

.victory-glow {
  box-shadow: 0 0 20px #22d3ee;
  border-color: #22d3ee !important;
  color: #020617 !important;
  background: #22d3ee !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* PHẦN CÒN LẠI */
.prevent-select {
  -webkit-user-select: none;
  user-select: none;
}
.workspace {
  flex: 1;
  position: relative;
  background-image: radial-gradient(circle at 2px 2px, #1e293b 1px, transparent 0);
  background-size: 40px 40px;
}
.top-nav {
  position: absolute;
  top: 25px;
  left: 25px;
  right: 25px;
  display: flex;
  justify-content: space-between;
  z-index: 50;
  pointer-events: none;
}
.back-btn,
.status-badge {
  pointer-events: auto;
  background: #1e293b;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 800;
  transition: all 0.3s;
}
.status-badge {
  color: #22d3ee;
  border: 1px solid #22d3ee30;
}

.element {
  position: absolute;
  transform: translate(-50%, -50%);
  background: #0f172a;
  padding: 15px;
  border-radius: 20px;
  border-top: 4px solid #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
  cursor: grab;
  transition:
    transform 0.1s ease,
    opacity 0.2s ease;
  z-index: 10;
}
.element.dragging {
  scale: 1.1;
  opacity: 0.8;
  z-index: 100;
}
.element.merge-ready {
  opacity: 0.4 !important;
  transform: translate(-50%, -50%) scale(0.95);
}

.icon-img {
  width: 45px;
  height: 45px;
  pointer-events: none;
  object-fit: contain;
}
.icon-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: #22d3ee;
  line-height: 45px;
}
.label {
  font-size: 9px;
  font-weight: 800;
  margin-top: 8px;
  color: #94a3b8;
  text-transform: uppercase;
}

.sidebar {
  width: 320px;
  background: #0f172a;
  border-left: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
}
.sidebar-title {
  padding: 30px;
  text-align: center;
  font-weight: 900;
  font-size: 12px;
  color: #475569;
  border-bottom: 1px solid #1e293b;
}
.inventory {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-content: start;
}
.inv-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: grab;
}
.card-box {
  width: 100px;
  height: 100px;
  background: #1e293b;
  border-radius: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid transparent;
}
.inv-img {
  width: 40px;
  height: 40px;
}
.inv-name {
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  text-align: center;
}
.clear-btn {
  position: absolute;
  bottom: 30px;
  left: 30px;
  padding: 12px 24px;
  background: #450a0a;
  color: #fca5a5;
  border-radius: 14px;
  font-size: 10px;
  font-weight: 800;
}
</style>
