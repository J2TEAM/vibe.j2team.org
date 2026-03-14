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

// --- 1. TRẠNG THÁI BỔ SUNG ---
const showIntro = ref(true)
const hintMessage = ref('')

// --- 2. LOGIC GỢI Ý (HINT SYSTEM) ---
const giveHint = () => {
  // Tìm công thức hợp lệ
  const possibleRecipes = Object.entries(RECIPES).find(([pair, result]) => {
    const parts = pair.split('+')
    if (parts.length < 2) return false

    const a = parts[0]
    const b = parts[1]

    // Kiểm tra an toàn để TS biết a, b, result không phải undefined
    return (
      a &&
      b &&
      result &&
      unlockedIds.value.includes(a) &&
      unlockedIds.value.includes(b) &&
      !unlockedIds.value.includes(result)
    )
  })

  if (possibleRecipes) {
    const [pair, result] = possibleRecipes
    const parts = pair.split('+')
    const a = parts[0]
    const b = parts[1]

    // Sử dụng optional chaining ?. và kiểm tra nullish để fix lỗi index type
    const langA = a ? LANGUAGES[a] : null
    const langB = b ? LANGUAGES[b] : null
    const langResult = result ? LANGUAGES[result] : null

    if (langA && langB && langResult) {
      const nameA = langA.name
      const nameB = langB.name
      const nameResult = langResult.name

      let logic = `Vì ${nameResult} được xây dựng dựa trên ${nameA} và ${nameB}.`
      if (result === 'assembly')
        logic = 'Assembly là cầu nối giữa mã máy (Binary) và các cổng logic.'
      if (result === 'cpp')
        logic = 'C++ là sự kết hợp giữa ngôn ngữ C và tư duy hướng đối tượng (Logic).'
      if (result === 'javascript')
        logic =
          'Sự kết hợp giữa Internet và PHP (Backend) đã tạo nên ngôn ngữ trình duyệt JavaScript.'

      hintMessage.value = `Thử ghép: ${nameA} + ${nameB} ➜ ${logic}`
    }
  } else {
    hintMessage.value = 'Bạn đã tìm ra hết các tổ hợp từ số nguyên liệu đang có rồi!'
  }

  setTimeout(() => {
    hintMessage.value = ''
  }, 6000)
}

// --- LOGIC GỐC CỦA BẠN (GIỮ NGUYÊN) ---
const isVictory = computed(() => unlockedIds.value.length === Object.keys(LANGUAGES).length)
const goHome = () => router.push('/')

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
  const target = workspaceItems.value.find(
    (o) =>
      o.instanceId !== item.instanceId && Math.sqrt((o.x - item.x) ** 2 + (o.y - item.y) ** 2) < 65,
  )
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
  const t = 'touches' in e ? e.touches[0] : (e as MouseEvent)
  return { x: t?.clientX || 0, y: t?.clientY || 0 }
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
  workspaceItems.value.forEach((o) => {
    if (o.instanceId === draggingItem.value?.instanceId) return
    const pair = [draggingItem.value!.id, o.id].sort().join('+')
    o.isHighlight =
      Math.sqrt((o.x - draggingItem.value!.x) ** 2 + (o.y - draggingItem.value!.y) ** 2) < 80 &&
      !!RECIPES[pair]
  })
}

const endMove = () => {
  if (draggingItem.value) checkMerge(draggingItem.value)
  draggingItem.value = null
  workspaceItems.value.forEach((i) => (i.isHighlight = false))
}

onUnmounted(() => {
  workspaceItems.value = []
})
</script>

<template>
  <div
    class="alchemy-container no-select"
    @mousemove="onMove"
    @mouseup="endMove"
    @touchmove="onMove"
    @touchend="endMove"
  >
    <Transition name="fade">
      <div v-if="showIntro" class="overlay">
        <div class="modal">
          <h2 class="cyan-text">📜 SÁCH HƯỚNG DẪN</h2>
          <div class="modal-body scrollbar-hidden">
            <p>Khám phá lịch sử lập trình bằng cách hòa trộn các yếu tố.</p>
            <div class="guide-section">
              <h4>NGUYÊN TỐ CƠ BẢN</h4>
              <ul>
                <li><b>Binary (01):</b> Ngôn ngữ của máy tính, chỉ gồm 0 và 1.</li>
                <li><b>Logic:</b> Tư duy của các cổng điều kiện (AND, OR, NOT).</li>
                <li><b>Mathematics:</b> Nền tảng tính toán khoa học.</li>
                <li><b>Internet:</b> Sự kết nối toàn cầu của kỷ nguyên số.</li>
              </ul>
            </div>
            <div class="guide-section tutorial">
              <h4>CÁCH CHƠI</h4>
              <p>
                Kéo các icon từ cột phải vào giữa, sau đó chồng chúng lên nhau để xem chúng tạo ra
                ngôn ngữ gì!
              </p>
            </div>
          </div>
          <button @click="showIntro = false" class="btn-cyan">BẮT ĐẦU</button>
        </div>
      </div>
    </Transition>

    <div class="workspace" @dragover.prevent @drop="onDrop">
      <div class="top-nav">
        <button @click="goHome" class="back-btn">← SẢNH</button>
        <div class="status-badge">KHÁM PHÁ: {{ unlockedIds.length }} / 20</div>
      </div>

      <button @click="giveHint" class="hint-btn">💡 GỢI Ý</button>
      <Transition name="slide">
        <div v-if="hintMessage" class="hint-popup">{{ hintMessage }}</div>
      </Transition>

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

      <button @click.stop="workspaceItems = []" class="clear-btn">DỌN DẸP</button>
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

    <div v-if="isVictory" class="overlay victory">
      <div class="modal">
        <h1 class="cyan-text">🏆 CHIẾN THẮNG</h1>
        <p>Bạn đã trở thành Bậc thầy Ngôn ngữ!</p>
        <button @click="goHome" class="btn-cyan">VỀ SẢNH</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alchemy-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #020617;
  color: #f1f5f9;
  position: relative;
  overflow: hidden;
}
.no-select {
  user-select: none;
  -webkit-user-drag: none;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}
.modal {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 20px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}
.modal-body {
  text-align: left;
  max-height: 50vh;
  overflow-y: auto;
  margin: 20px 0;
}
.cyan-text {
  color: #22d3ee;
}
.btn-cyan {
  background: #22d3ee;
  color: #020617;
  padding: 12px 30px;
  border-radius: 10px;
  border: none;
  font-weight: 800;
  cursor: pointer;
  width: 100%;
}

.guide-section {
  margin-bottom: 20px;
}
.guide-section h4 {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}
.guide-section ul {
  list-style: none;
  padding: 0;
  font-size: 13px;
}
.guide-section li {
  margin-bottom: 5px;
}
.guide-section b {
  color: #22d3ee;
}

/* HINT SYSTEM */
.hint-btn {
  position: absolute;
  top: 80px;
  left: 25px;
  padding: 10px 15px;
  background: #1e293b;
  border: 1px solid #22d3ee50;
  color: #22d3ee;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
  z-index: 100;
}
.hint-popup {
  position: absolute;
  top: 130px;
  left: 25px;
  max-width: 250px;
  background: #22d3ee;
  color: #020617;
  padding: 15px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  box-shadow: 0 10px 25px rgba(34, 211, 238, 0.3);
  z-index: 100;
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
  border: 1px solid #1e293b;
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
}
.element.merge-ready {
  opacity: 0.4;
}
.icon-img {
  width: 45px;
  height: 45px;
  pointer-events: none;
}
.label {
  font-size: 9px;
  font-weight: 800;
  margin-top: 8px;
  color: #94a3b8;
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
}
.inventory {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
