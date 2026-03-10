<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as DATA from './data'
import { GameEngine } from './engine'

const router = useRouter()
const engine = new GameEngine()
const currentScreen = ref('intro')
const gameState = ref<DATA.GameState | null>(null)
const currentEvent = ref<DATA.GameEvent | null>(null)
const charNameInput = ref('')
const selectedCareerId = ref('')
const isShopOpen = ref(false)
const isInventoryOpen = ref(false)
const isMenuOpen = ref(false)
const toasts = ref<Array<{ id: number; message: string; type: string }>>([])
const statChanges = ref<Record<string, number> | null>(null)
const previewModalEvent = ref<DATA.GameEvent | null>(null)
const shopTab = ref('items')
const inventoryTab = ref('inventory')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const hasSavedGame = ref(false)
let animationId = 0

const careerPreview = computed(() => {
  if (!selectedCareerId.value) return null
  return DATA.CAREERS[selectedCareerId.value]
})

function showToast(message: string, type = 'info') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
}

function startNewGame() {
  if (!charNameInput.value.trim()) { showToast('Vui lòng nhập tên!', 'toast-negative'); return }
  if (!selectedCareerId.value) { showToast('Vui lòng chọn nghề!', 'toast-negative'); return }
  gameState.value = engine.newGame(charNameInput.value, selectedCareerId.value)
    ? JSON.parse(JSON.stringify(engine.state))
    : null
  currentEvent.value = engine.getNextEvent()
  currentScreen.value = 'game'
}

function loadGame() {
  const state = engine.loadGame()
  if (state) {
    gameState.value = JSON.parse(JSON.stringify(engine.state))
    currentEvent.value = engine.getNextEvent()
    currentScreen.value = 'game'
    showToast('Đã tải game!', 'toast-info')
  }
}

function handleChoice(choice: DATA.Choice) {
  const result = engine.applyChoice(choice)
  gameState.value = JSON.parse(JSON.stringify(engine.state))
  
  if (result.effects && Object.keys(result.effects).length > 0) {
    statChanges.value = result.effects as Record<string, number>
    setTimeout(() => { statChanges.value = null }, 2000)
  }

  if (result.gameOver) {
    showToast((result.gameOver as { message: string }).message, 'toast-negative')
    currentScreen.value = 'end'
  } else {
    currentEvent.value = engine.getNextEvent()
  }
}

function saveGame() {
  if (engine.saveGame()) {
    showToast('Đã lưu game!', 'toast-info')
    hasSavedGame.value = engine.hasSave()
  }
  isMenuOpen.value = false
}

function deleteSaveGame() {
  if (confirm('Bạn có chắc chắn muốn xóa dữ liệu game đã lưu? Hành động này không thể hoàn tác.')) {
    engine.clearSave()
    hasSavedGame.value = false
    showToast('Đã xóa dữ liệu lưu!', 'toast-info')
  }
}

function restartGame() {
  if (confirm('Bạn có chắc muốn chơi lại từ đầu?')) {
    currentScreen.value = 'intro'
    gameState.value = null; currentEvent.value = null
    charNameInput.value = ''; selectedCareerId.value = ''
    isMenuOpen.value = false
  }
}

function buyItemFn(item: DATA.PassiveItem) {
  const result = engine.buyItem(item.id)
  gameState.value = JSON.parse(JSON.stringify(engine.state))
  showToast(result.message, result.success ? 'toast-info' : 'toast-negative')
}

function buySkillFn(skill: DATA.ActiveSkill) {
  const result = engine.buySkill(skill.id)
  gameState.value = JSON.parse(JSON.stringify(engine.state))
  showToast(result.message, result.success ? 'toast-info' : 'toast-negative')
}

function useSkillFn(skillId: string) {
  const result = engine.useSkill(skillId)
  if (result.success) {
    showToast(`⚡ ${result.message}`, 'toast-info')
    const r = result as { isPreview?: boolean; previewEvent?: DATA.GameEvent }
    if (r.isPreview && r.previewEvent) {
      previewModalEvent.value = r.previewEvent
    } else {
      gameState.value = JSON.parse(JSON.stringify(engine.state))
      currentEvent.value = engine.getNextEvent()
    }
  } else {
    showToast(`❌ ${result.message}`, 'toast-negative')
  }
}

function getStatIcon(stat: string) {
  const icons: Record<string, string> = { money: '💰', skill: '🧠', happiness: '😊', stress: '😰', health: '❤️', relationships: '🤝' }
  return icons[stat] || '📊'
}

function getStatName(stat: string) {
  const names: Record<string, string> = { money: 'Tài chính', skill: 'Kỹ năng', happiness: 'Hạnh phúc', stress: 'Căng thẳng', health: 'Sức khỏe', relationships: 'Quan hệ' }
  return names[stat] || stat
}

function calculateEnding() {
  if (!gameState.value) return { icon: '🏁', title: 'Game Over', subtitle: '' }
  const s = gameState.value.stats
  const total = s.money + s.skill + s.happiness + s.health + s.relationships - s.stress
  if (total >= 350) return { icon: '🏆', title: 'Cuộc Đời Viên Mãn', subtitle: 'Bạn đã sống một cuộc đời trọn vẹn, cân bằng và hạnh phúc!' }
  if (total >= 280) return { icon: '⭐', title: 'Cuộc Đời Thành Công', subtitle: 'Bạn đạt được nhiều thành tựu đáng tự hào!' }
  if (total >= 200) return { icon: '🌿', title: 'Cuộc Đời Bình Dị', subtitle: 'Cuộc sống bình thường nhưng ý nghĩa theo cách riêng.' }
  if (total >= 120) return { icon: '🌧️', title: 'Cuộc Đời Gập Ghềnh', subtitle: 'Nhiều khó khăn nhưng bạn vẫn vượt qua.' }
  return { icon: '💔', title: 'Cuộc Đời Đầy Thử Thách', subtitle: 'Cuộc sống không dễ dàng, nhưng bạn đã cố gắng.' }
}

function canBuyItem(item: DATA.PassiveItem): boolean {
  return (gameState.value?.stats?.money ?? 0) >= item.cost && !(gameState.value?.inventory ?? []).includes(item.id)
}

function canBuySkill(skill: DATA.ActiveSkill): boolean {
  return (gameState.value?.stats?.money ?? 0) >= skill.cost && !(gameState.value?.activeSkills ?? []).includes(skill.id)
}

function initParticles() {
  const canvas = canvasRef.value; if (!canvas) return
  const ctx = canvas.getContext('2d'); if (!ctx) return
  const particles: Array<{ x: number; y: number; r: number; dx: number; dy: number; alpha: number }> = []
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
  resize(); window.addEventListener('resize', resize)
  for (let i = 0; i < 60; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 0.5, dx: (Math.random() - 0.5) * 0.4, dy: (Math.random() - 0.5) * 0.4, alpha: Math.random() * 0.4 + 0.1 })
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(99,102,241,${p.alpha})`; ctx.fill()
    })
    for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i]; const p2 = particles[j]; if (!p1 || !p2) continue;
      const dx = p1.x - p2.x, dy = p1.y - p2.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 120) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`; ctx.stroke() }
    }
    animationId = requestAnimationFrame(animate)
  }
  animate()
  onUnmounted(() => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId) })
}

onMounted(() => { 
  initParticles() 
  hasSavedGame.value = engine.hasSave()
})
</script>

<template>
  <div class="ngare-wrapper">
    <canvas ref="canvasRef" class="particles-canvas"></canvas>

    <!-- INTRO -->
    <div v-if="currentScreen === 'intro'" class="screen active">
      <div class="intro-container">
        <div class="intro-logo">
          <span class="logo-icon">🔀</span>
          <h1 class="intro-title">Ngã Rẽ<br><span class="highlight">Cuộc Đời</span></h1>
        </div>
        <p class="intro-subtitle">Mỗi lựa chọn, một hành trình. Mỗi ngã rẽ, một cuộc đời.</p>
        <div class="intro-features">
          <div class="feature-tag">🎓 Tốt nghiệp đại học</div>
          <div class="feature-tag">💼 Chọn sự nghiệp</div>
          <div class="feature-tag">🔀 Đối mặt ngã rẽ</div>
          <div class="feature-tag">🏆 Viết nên cuộc đời</div>
        </div>
        <div class="intro-actions">
          <button class="btn-base btn-primary btn-glow" @click="currentScreen = 'create'">
            <span>Bắt Đầu Hành Trình</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button v-if="hasSavedGame" class="btn-base btn-secondary" @click="loadGame">
            <span>📂 Tiếp Tục Game Đã Lưu</span>
          </button>
          <button v-if="hasSavedGame" class="btn-base btn-danger" @click="deleteSaveGame" style="margin-top:0.5rem">
            <span>🗑️ Xóa Dữ Liệu Lưu</span>
          </button>
        </div>
      </div>
    </div>

    <!-- CREATE -->
    <div v-if="currentScreen === 'create'" class="screen active">
      <div class="create-container">
        <h2 class="screen-title">Tạo Nhân Vật</h2>
        <p class="screen-desc">Bạn vừa tốt nghiệp đại học. Hành trình cuộc đời bắt đầu từ đây.</p>
        <div class="form-group">
          <label>Tên của bạn</label>
          <input v-model="charNameInput" type="text" placeholder="Nhập tên nhân vật..." maxlength="20" autocomplete="off">
        </div>
        <div class="form-group">
          <label>Chọn ngành nghề khởi điểm</label>
          <div class="career-grid">
            <div v-for="(career, id) in DATA.CAREERS" :key="String(id)"
              class="career-card" :class="{ selected: selectedCareerId === String(id) }"
              @click="selectedCareerId = String(id)">
              <span class="career-emoji">{{ career.emoji }}</span>
              <span class="career-label">{{ career.name }}</span>
            </div>
          </div>
        </div>
        <div v-if="careerPreview" class="career-preview">
          <div class="preview-header">
            <span class="preview-icon">{{ careerPreview.emoji }}</span>
            <div>
              <h3>{{ careerPreview.name }}</h3>
              <p>{{ careerPreview.description }}</p>
            </div>
          </div>
          <div class="preview-stats">
            <div v-for="(val, key) in careerPreview.startStats" :key="String(key)" class="preview-stat">
              <span class="ps-label">{{ getStatName(String(key)) }}</span>
              <span class="ps-value">{{ val }}</span>
            </div>
          </div>
        </div>
        <button class="btn-base btn-primary btn-glow" :disabled="!charNameInput || !selectedCareerId" @click="startNewGame">
          <span>Bắt Đầu Cuộc Đời</span>
        </button>
      </div>
    </div>

    <!-- GAME -->
    <div v-if="currentScreen === 'game' && gameState" id="screen-game" class="screen active">
      <div class="game-layout">
        <header class="game-header">
          <div class="header-left">
            <span class="player-name">{{ gameState.name }}</span>
            <span class="player-career">{{ gameState.careerEmoji }} {{ gameState.currentLevel }}</span>
          </div>
          <div class="header-center">
            <div class="age-display">
              <span class="age-label">Tuổi</span>
              <span class="age-value">{{ gameState.age }}</span>
            </div>
            <div class="year-display">
              <span class="year-label">Năm</span>
              <span class="year-value">{{ gameState.year }}</span>
            </div>
          </div>
          <div class="header-right">
            <button class="btn-icon" @click="isShopOpen = true" title="Cửa hàng">🛒</button>
            <button class="btn-icon" @click="isInventoryOpen = true" title="Túi đồ">🎒</button>
            <button class="btn-icon" @click="saveGame" title="Lưu game">💾</button>
            <button class="btn-icon" @click="isMenuOpen = true" title="Menu">☰</button>
          </div>
        </header>

        <div class="stats-panel">
          <div v-for="(val, stat) in gameState.stats" :key="String(stat)"
               class="stat-item" :data-stat="String(stat)">
            <div class="stat-header">
              <span class="stat-icon">{{ getStatIcon(String(stat)) }}</span>
              <span class="stat-name">{{ getStatName(String(stat)) }}</span>
              <span class="stat-value">{{ val }}</span>
            </div>
            <div class="stat-bar"><div class="stat-fill" :style="{ width: val + '%' }"></div></div>
          </div>
        </div>

        <div class="event-area">
          <div v-if="currentEvent" class="event-card">
            <div class="event-type">{{ currentEvent.type }}</div>
            <h3 class="event-title">{{ currentEvent.title }}</h3>
            <p class="event-desc">{{ currentEvent.description }}</p>
            <div class="event-choices">
              <button v-for="(choice, idx) in currentEvent.choices"
                :key="idx" class="choice-btn" @click="handleChoice(choice)">
                <span class="choice-icon">{{ choice.icon }}</span>
                <div class="choice-text">
                  {{ choice.text }}
                  <span class="choice-hint">{{ choice.hint }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="timeline-panel">
          <h3 class="timeline-title">📜 Nhật ký cuộc đời</h3>
          <div class="timeline-list">
            <div v-for="(entry, idx) in [...gameState.history].reverse()" :key="idx" class="timeline-entry">
              <span class="timeline-year">{{ entry.age }} tuổi</span>
              <span class="timeline-dot"></span>
              <span class="timeline-text">{{ entry.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- END -->
    <div v-if="currentScreen === 'end'" class="screen active">
      <div class="end-container">
        <div class="end-header">
          <span class="end-icon">{{ calculateEnding().icon }}</span>
          <h2 class="end-title">{{ calculateEnding().title }}</h2>
          <p class="end-subtitle">{{ calculateEnding().subtitle }}</p>
        </div>
        <div v-if="gameState" class="end-stats">
          <div v-for="(val, stat) in gameState.stats" :key="String(stat)" class="end-stat-card">
            <span class="es-icon">{{ getStatIcon(String(stat)) }}</span>
            <span class="es-value">{{ val }}</span>
            <span class="es-label">{{ getStatName(String(stat)) }}</span>
          </div>
        </div>
        <div class="end-actions">
          <button class="btn-base btn-primary btn-glow" @click="restartGame"><span>🔄 Chơi Lại</span></button>
          <button class="btn-base btn-secondary" @click="router.push('/')"><span>🏠 Về Trang Chủ</span></button>
        </div>
      </div>
    </div>

    <!-- SHOP MODAL -->
    <div v-if="isShopOpen" class="modal-overlay" @click.self="isShopOpen = false">
      <div class="modal-content modal-large">
        <h3>🛒 Cửa Hàng</h3>
        <div class="shop-tabs">
          <button class="shop-tab" :class="{ active: shopTab === 'items' }" @click="shopTab = 'items'">📦 Vật Phẩm</button>
          <button class="shop-tab" :class="{ active: shopTab === 'skills' }" @click="shopTab = 'skills'">✨ Kỹ Năng</button>
        </div>
        <div class="shop-content">
          <div v-show="shopTab === 'items'">
            <div v-for="item in DATA.PASSIVE_ITEMS" :key="item.id" class="shop-item">
              <div class="shop-item-icon">{{ item.name.split(' ')[0] }}</div>
              <div class="shop-item-info">
                <div class="shop-item-header">
                  <span class="shop-item-name">{{ item.name.substring(item.name.indexOf(' ') + 1) }}</span>
                  <span class="shop-item-price">💰 {{ item.cost }}</span>
                </div>
                <div class="shop-item-desc">{{ item.description }}</div>
                <div class="shop-item-actions">
                  <button class="btn-buy"
                    :disabled="!canBuyItem(item)"
                    @click="buyItemFn(item)">
                    {{ (gameState?.inventory ?? []).includes(item.id) ? '✓ Đã có' : '🛒 Mua' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-show="shopTab === 'skills'">
            <div v-for="skill in DATA.ACTIVE_SKILLS" :key="skill.id" class="shop-item">
              <div class="shop-item-icon">{{ skill.name.split(' ')[0] }}</div>
              <div class="shop-item-info">
                <div class="shop-item-header">
                  <span class="shop-item-name">{{ skill.name.substring(skill.name.indexOf(' ') + 1) }}</span>
                  <span class="shop-item-price">💰 {{ skill.cost }}</span>
                </div>
                <div class="shop-item-desc">{{ skill.description }}</div>
                <div class="shop-item-actions">
                  <button class="btn-buy"
                    :disabled="!canBuySkill(skill)"
                    @click="buySkillFn(skill)">
                    {{ (gameState?.activeSkills ?? []).includes(skill.id) ? '✓ Đã học' : '✨ Mở khóa' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="modal-btn modal-close" @click="isShopOpen = false">✕ Đóng</button>
      </div>
    </div>

    <!-- INVENTORY MODAL -->
    <div v-if="isInventoryOpen" class="modal-overlay" @click.self="isInventoryOpen = false">
      <div class="modal-content modal-large">
        <h3>🎒 Túi Đồ</h3>
        <div class="shop-tabs">
          <button class="shop-tab" :class="{ active: inventoryTab === 'inventory' }" @click="inventoryTab = 'inventory'">📦 Vật Phẩm</button>
          <button class="shop-tab" :class="{ active: inventoryTab === 'skills' }" @click="inventoryTab = 'skills'">⚡ Kỹ Năng</button>
        </div>
        <div>
          <div v-show="inventoryTab === 'inventory'">
            <div v-if="!gameState?.inventory?.length" class="empty-state">
              <div class="empty-state-icon">📦</div>
              <div class="empty-state-text">Chưa có vật phẩm nào</div>
            </div>
            <div v-for="id in gameState?.inventory" :key="id" class="inventory-item inventory-item-owned">
              <div class="shop-item-icon">{{ DATA.PASSIVE_ITEMS.find(i => i.id === id)?.name?.split(' ')[0] }}</div>
              <div class="shop-item-info">
                <div class="shop-item-name">{{ (n => n ? n.substring(n.indexOf(' ') + 1) : '')(DATA.PASSIVE_ITEMS.find(i => i.id === id)?.name ?? '') }}</div>
                <div class="shop-item-desc">{{ DATA.PASSIVE_ITEMS.find(i => i.id === id)?.description }}</div>
              </div>
            </div>
          </div>
          <div v-show="inventoryTab === 'skills'">
            <div v-if="!gameState?.activeSkills?.length" class="empty-state">
              <div class="empty-state-icon">✨</div>
              <div class="empty-state-text">Chưa có kỹ năng nào</div>
            </div>
            <div v-for="id in gameState?.activeSkills" :key="id" class="inventory-item">
              <div class="shop-item-icon">{{ DATA.ACTIVE_SKILLS.find(s => s.id === id)?.name?.split(' ')[0] }}</div>
              <div class="shop-item-info">
                <div class="shop-item-name">{{ (n => n ? n.substring(n.indexOf(' ') + 1) : '')(DATA.ACTIVE_SKILLS.find(s => s.id === id)?.name ?? '') }}</div>
                <span class="skill-cooldown" :class="{ 'skill-ready': !gameState?.skillCooldowns?.[id] }">
                  {{ !gameState?.skillCooldowns?.[id] ? '✅ Sẵn sàng' : `⏱️ Còn ${gameState?.skillCooldowns?.[id]} năm` }}
                </span>
              </div>
              <div class="shop-item-actions">
                <button class="btn-use" :disabled="!!gameState?.skillCooldowns?.[id]" @click="useSkillFn(id)">
                  {{ !gameState?.skillCooldowns?.[id] ? '⚡ Sử dụng' : '❌ Chưa sẵn sàng' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <button class="modal-btn modal-close" @click="isInventoryOpen = false">✕ Đóng</button>
      </div>
    </div>

    <!-- MENU MODAL -->
    <div v-if="isMenuOpen" class="modal-overlay" @click.self="isMenuOpen = false">
      <div class="modal-content">
        <h3>⚙️ Menu</h3>
        <button class="modal-btn" @click="saveGame">💾 Lưu Game</button>
        <button class="modal-btn" @click="restartGame">🔄 Chơi Lại</button>
        <button class="modal-btn" @click="router.push('/')">🚪 Thoát</button>
        <button class="modal-btn modal-close" @click="isMenuOpen = false">✕ Đóng</button>
      </div>
    </div>

    <!-- TOASTS -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">{{ toast.message }}</div>
    </div>

    <!-- PREVIEW MODAL -->
    <div v-if="previewModalEvent" class="modal-overlay" @click.self="previewModalEvent = null">
      <div class="modal-content modal-large">
        <h3>🔮 Nhìn Trước Tương Lai</h3>
        <div class="preview-timeline-info">
          <span class="preview-age">📅 Năm {{ (gameState?.year ?? 0) + 1 }} | Tuổi {{ (gameState?.age ?? 0) + 1 }}</span>
        </div>
        <div class="preview-event-card">
          <div class="event-type">{{ previewModalEvent.type }}</div>
          <h4 class="event-title">{{ previewModalEvent.title }}</h4>
          <p class="event-desc">{{ previewModalEvent.description }}</p>
          <div class="preview-choices">
            <div v-for="(choice, idx) in previewModalEvent.choices" :key="idx" class="preview-choice-item">
              <div class="preview-choice-header">
                <span class="choice-icon">{{ choice.icon || '📍' }}</span>
                <span class="choice-text">{{ choice.text }}</span>
              </div>
              <div class="preview-choice-hint">{{ choice.hint || '' }}</div>
            </div>
          </div>
        </div>
        <button class="modal-btn modal-close" @click="previewModalEvent = null">✓ Đã hiểu</button>
      </div>
    </div>

    <!-- STAT CHANGE POPUP -->
    <div v-if="statChanges" class="stat-change-popup">
      <div v-for="(val, key) in statChanges" :key="String(key)"
           class="stat-diff"
           :class="[
             (String(key) === 'stress' ? val < 0 : val > 0) ? 'positive' : 'negative',
           ]">
        <span class="diff-icon">{{ getStatIcon(String(key)) }}</span>
        <span class="diff-val">{{ val > 0 ? '+' : '' }}{{ val }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ======================================
   CSS VARIABLES — từ ngare.txt style.css
   ====================================== */
.ngare-wrapper {
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;
  --bg-card: rgba(17,24,39,0.7);
  --bg-glass: rgba(255,255,255,0.05);
  --text-primary: #f0f4ff;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
  --accent-glow: rgba(99,102,241,0.4);
  --accent-gradient: linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa);
  --border-subtle: rgba(255,255,255,0.08);
  --shadow-glow: 0 0 30px rgba(99,102,241,0.3);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --transition: 0.3s cubic-bezier(0.4,0,0.2,1);
  --primary-color: #6366f1;

  font-family: 'Be Vietnam Pro','Inter',sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
  line-height: 1.6;
  position: relative;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.particles-canvas {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 0; pointer-events: none;
}

/* SCREENS */
.screen {
  display: none; position: relative; z-index: 1; min-height: 100vh;
}
.screen.active {
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.6s ease;
}
#screen-game.active { display: block; align-items: unset; justify-content: unset; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* BUTTONS */
.btn-base {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border-radius: var(--radius-xl); padding: 1rem 2.5rem;
  font-size: 1.1rem; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: var(--transition);
}

.btn-primary {
  background: var(--accent-gradient); color: white; border: none;
  position: relative; overflow: hidden;
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-glow); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  background: var(--bg-glass); color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(8px);
}
.btn-secondary:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

.btn-glow::before {
  content: ''; position: absolute; top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 70%);
  animation: pulseGlow 3s ease-in-out infinite;
}
@keyframes pulseGlow {
  0%,100% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1); opacity: 1; }
}

.btn-icon {
  background: var(--bg-glass); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); color: var(--text-secondary);
  font-size: 1.2rem; padding: 0.5rem; cursor: pointer;
  transition: var(--transition); width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
}
.btn-icon:hover { background: rgba(255,255,255,0.12); color: var(--text-primary); }

/* INTRO */
.intro-container { text-align: center; padding: 2rem; max-width: 600px; }
.intro-logo { margin-bottom: 1.5rem; }
.logo-icon {
  font-size: 4rem; display: block; margin-bottom: 0.5rem;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
.intro-title {
  font-family: 'Inter',sans-serif; font-size: 3.5rem; font-weight: 900;
  line-height: 1.1; letter-spacing: -1px;
  background: var(--accent-gradient);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.intro-title .highlight { font-size: 4rem; display: block; }
.intro-subtitle {
  font-size: 1.15rem; color: var(--text-secondary);
  margin: 1rem 0 2rem; font-style: italic;
}
.intro-features {
  display: grid; grid-template-columns: repeat(2, max-content); gap: 1rem;
  justify-content: center; margin: 0 auto 2.5rem auto;
}
.feature-tag {
  background: var(--bg-glass); border: 1px solid var(--border-subtle);
  padding: 0.8rem 1.5rem; border-radius: 999px; font-size: 0.95rem;
  color: var(--text-primary); backdrop-filter: blur(8px);
  text-align: left; font-weight: 500; min-width: 220px;
}
.intro-actions {
  display: flex; flex-direction: column; gap: 1rem; align-items: center;
}
.btn-danger {
  background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);
  backdrop-filter: blur(8px);
}
.btn-danger:hover { background: rgba(239, 68, 68, 0.2); color: #fecaca; }

/* CREATE */
.create-container { padding: 2rem; max-width: 700px; width: 100%; }
.screen-title {
  font-family: 'Inter',sans-serif; font-size: 2rem; font-weight: 700;
  margin-bottom: 0.5rem; text-align: center;
}
.screen-desc { color: var(--text-secondary); text-align: center; margin-bottom: 2rem; }
.form-group { margin-bottom: 1.5rem; }
.form-group label {
  display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);
}
.form-group input {
  width: 100%; padding: 0.9rem 1.2rem;
  background: var(--bg-glass); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); color: var(--text-primary);
  font-size: 1rem; font-family: inherit; outline: none;
  transition: var(--transition); backdrop-filter: blur(8px);
}
.form-group input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-glow); }

.career-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.8rem; }
.career-card {
  background: var(--bg-glass); border: 2px solid var(--border-subtle);
  border-radius: var(--radius-md); padding: 1.2rem; text-align: center;
  cursor: pointer; transition: var(--transition); backdrop-filter: blur(8px);
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
}
.career-card:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-3px); background: rgba(99,102,241,0.08); }
.career-card.selected { border-color: var(--accent-primary); background: rgba(99,102,241,0.15); box-shadow: 0 0 20px var(--accent-glow); }
.career-emoji { font-size: 2.2rem; }
.career-label { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }

.career-preview {
  background: var(--bg-glass); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); padding: 1.2rem; margin: 1.5rem 0;
  backdrop-filter: blur(10px); animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.preview-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.preview-icon { font-size: 2.5rem; }
.preview-header h3 { font-family: 'Inter',sans-serif; font-size: 1.2rem; margin-bottom: 0.2rem; }
.preview-header p { color: var(--text-secondary); font-size: 0.85rem; }
.preview-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.5rem; }
.preview-stat { background: rgba(0,0,0,0.3); border-radius: var(--radius-sm); padding: 0.5rem; text-align: center; font-size: 0.8rem; }
.ps-label { color: var(--text-muted); display: block; margin-bottom: 0.2rem; }
.ps-value { font-weight: 700; font-size: 1rem; }

/* GAME */
.game-layout {
  display: grid; grid-template-columns: 1fr; grid-template-rows: auto auto 1fr auto;
  min-height: 100vh; gap: 0; max-width: 900px; margin: 0 auto; padding: 0 1rem;
}
.game-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 0; border-bottom: 1px solid var(--border-subtle);
}
.header-left { display: flex; flex-direction: column; }
.player-name { font-family: 'Inter',sans-serif; font-weight: 700; font-size: 1.1rem; }
.player-career { font-size: 0.8rem; color: var(--text-secondary); }
.header-center { display: flex; gap: 1.5rem; text-align: center; }
.age-display, .year-display { display: flex; flex-direction: column; }
.age-label, .year-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
.age-value, .year-value {
  font-family: 'Inter',sans-serif; font-size: 1.5rem; font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.header-right { display: flex; gap: 0.5rem; }

/* STATS */
.stats-panel { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.6rem; padding: 1rem 0; }
.stat-item {
  background: var(--bg-glass); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm); padding: 0.7rem; backdrop-filter: blur(6px);
}
.stat-header { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; }
.stat-icon { font-size: 1rem; }
.stat-name { font-size: 0.75rem; color: var(--text-secondary); flex: 1; }
.stat-value { font-weight: 700; font-size: 0.85rem; font-family: 'Inter',sans-serif; }
.stat-bar { height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
.stat-fill { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); background: linear-gradient(90deg,#6366f1,#8b5cf6); }
[data-stat="money"] .stat-fill { background: linear-gradient(90deg,#f59e0b,#fbbf24); }
[data-stat="skill"] .stat-fill { background: linear-gradient(90deg,#3b82f6,#60a5fa); }
[data-stat="happiness"] .stat-fill { background: linear-gradient(90deg,#10b981,#34d399); }
[data-stat="stress"] .stat-fill { background: linear-gradient(90deg,#ef4444,#f87171); }
[data-stat="health"] .stat-fill { background: linear-gradient(90deg,#ec4899,#f472b6); }
[data-stat="relationships"] .stat-fill { background: linear-gradient(90deg,#8b5cf6,#a78bfa); }

/* EVENT */
.event-area { display: flex; align-items: center; justify-content: center; padding: 1.5rem 0; min-height: 350px; }
.event-card {
  background: var(--bg-card); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg); padding: 2rem; width: 100%; max-width: 650px;
  backdrop-filter: blur(12px); animation: cardEnter 0.5s ease;
  position: relative; overflow: hidden;
}
.event-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 3px; background: var(--accent-gradient);
}
@keyframes cardEnter {
  from { opacity: 0; transform: scale(0.95) translateY(15px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.event-type {
  display: inline-block; font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent-primary);
  background: rgba(99,102,241,0.12); padding: 0.3rem 0.8rem;
  border-radius: 999px; margin-bottom: 1rem;
}
.event-title { font-family: 'Inter',sans-serif; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.8rem; line-height: 1.3; }
.event-desc { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.5rem; }
.event-choices { display: flex; flex-direction: column; gap: 0.6rem; }
.choice-btn {
  display: flex; align-items: center; gap: 0.8rem;
  background: var(--bg-glass); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); padding: 1rem 1.2rem;
  color: var(--text-primary); font-size: 0.95rem; font-family: inherit;
  cursor: pointer; transition: var(--transition); text-align: left; line-height: 1.4; width: 100%;
}
.choice-btn:hover { border-color: var(--accent-primary); background: rgba(99,102,241,0.1); transform: translateX(5px); }
.choice-icon { font-size: 1.3rem; flex-shrink: 0; }
.choice-text { flex: 1; font-weight: 500; }
.choice-hint { font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.2rem; font-weight: 400; }

/* TIMELINE */
.timeline-panel { border-top: 1px solid var(--border-subtle); padding: 1rem 0 2rem; max-height: 250px; overflow-y: auto; }
.timeline-title { font-family: 'Inter',sans-serif; font-size: 1rem; margin-bottom: 0.8rem; color: var(--text-secondary); }
.timeline-list { display: flex; flex-direction: column; gap: 0.5rem; }
.timeline-entry { display: flex; gap: 0.8rem; align-items: flex-start; font-size: 0.85rem; animation: slideUp 0.3s ease; }
.timeline-year { font-weight: 700; color: var(--accent-primary); min-width: 60px; font-family: 'Inter',sans-serif; }
.timeline-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-primary); margin-top: 6px; flex-shrink: 0; }
.timeline-text { color: var(--text-secondary); flex: 1; }
.timeline-panel::-webkit-scrollbar { width: 4px; }
.timeline-panel::-webkit-scrollbar-track { background: transparent; }
.timeline-panel::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 999px; }

/* END SCREEN */
.end-container { padding: 2rem; max-width: 700px; width: 100%; text-align: center; }
.end-header { margin-bottom: 2rem; }
.end-icon { font-size: 4rem; display: block; margin-bottom: 0.5rem; animation: float 3s ease-in-out infinite; }
.end-title { font-family: 'Inter',sans-serif; font-size: 2.2rem; font-weight: 800; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 0.5rem; }
.end-subtitle { color: var(--text-secondary); font-size: 1.1rem; font-style: italic; }
.end-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.8rem; margin-bottom: 2rem; }
.end-stat-card { background: var(--bg-glass); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; backdrop-filter: blur(8px); }
.es-icon { font-size: 1.5rem; display: block; margin-bottom: 0.3rem; }
.es-value { font-family: 'Inter',sans-serif; font-size: 1.5rem; font-weight: 800; display: block; }
.es-label { font-size: 0.75rem; color: var(--text-muted); }
.end-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

/* MODAL — từ ngare.txt shop.css */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
  padding: 1rem; animation: fadeIn 0.3s ease;
}
.modal-content {
  background: linear-gradient(135deg,rgba(17,24,39,0.95),rgba(31,41,55,0.95));
  border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 2rem;
  position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modalSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  max-width: 500px; width: 100%;
}
@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.9) translateY(-20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-content h3 {
  font-family: 'Inter',sans-serif; font-size: 1.5rem; font-weight: 700;
  margin-bottom: 1.5rem; text-align: center;
  background: linear-gradient(135deg,#8b5cf6,#a78bfa);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.modal-btn {
  display: block; width: 100%; padding: 0.75rem; margin-bottom: 0.5rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; color: #fff; font-size: 1rem; font-family: 'Inter',sans-serif;
  cursor: pointer; transition: all 0.3s ease;
}
.modal-btn:hover { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.5); transform: translateX(5px); }
.modal-close { margin-top: 1rem; color: rgba(255,255,255,0.6); }
.modal-close:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); color: #fff; }
.modal-large { max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; }

/* SHOP */
.shop-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid rgba(255,255,255,0.1); }
.shop-tab {
  flex: 1; padding: 0.75rem 1rem; background: transparent; border: none;
  color: rgba(255,255,255,0.6); font-family: 'Inter',sans-serif; font-size: 0.95rem;
  cursor: pointer; transition: all 0.3s ease; border-bottom: 3px solid transparent;
}
.shop-tab:hover { color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.05); }
.shop-tab.active { color: #fff; border-bottom-color: var(--primary-color); background: rgba(139,92,246,0.1); }

.shop-item {
  background: linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
  padding: 1rem; margin-bottom: 1rem; display: flex; gap: 1rem; transition: all 0.3s ease;
}
.shop-item:hover { border-color: rgba(139,92,246,0.5); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(139,92,246,0.2); }
.shop-item-icon { font-size: 2.5rem; flex-shrink: 0; }
.shop-item-info { flex: 1; }
.shop-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.shop-item-name { font-size: 1.1rem; font-weight: 600; color: #fff; }
.shop-item-price { font-size: 1rem; font-weight: 700; color: #fbbf24; }
.shop-item-desc { font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-bottom: 0.75rem; line-height: 1.4; }
.shop-item-actions { display: flex; gap: 0.5rem; }
.btn-buy {
  flex: 1; padding: 0.5rem 1rem;
  background: linear-gradient(135deg,#8b5cf6,#7c3aed); border: none;
  border-radius: 8px; color: #fff; font-family: 'Inter',sans-serif;
  font-weight: 600; cursor: pointer; transition: all 0.3s ease;
}
.btn-buy:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 15px rgba(139,92,246,0.4); }
.btn-buy:disabled { opacity: 0.5; cursor: not-allowed; }

.inventory-item {
  background: linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05));
  border: 1px solid rgba(16,185,129,0.3); border-radius: 12px;
  padding: 1rem; margin-bottom: 1rem; display: flex; gap: 1rem;
}
.inventory-item-owned { background: linear-gradient(135deg,rgba(59,130,246,0.1),rgba(37,99,235,0.05)); border-color: rgba(59,130,246,0.3); }
.skill-cooldown { display: inline-block; padding: 0.25rem 0.6rem; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 20px; font-size: 0.75rem; color: #fca5a5; margin-top: 0.5rem; }
.skill-ready { background: rgba(34,197,94,0.2); border-color: rgba(34,197,94,0.4); color: #86efac; }

.empty-state { text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,0.5); }
.empty-state-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-state-text { font-size: 1.1rem; }

/* TOASTS */
.toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 1000; display: flex; flex-direction: column; gap: 0.5rem; }
.toast {
  background: var(--bg-card); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md); padding: 0.8rem 1.2rem; font-size: 0.9rem;
  backdrop-filter: blur(12px); display: flex; align-items: center;
  animation: toastIn 0.4s ease; max-width: 350px;
}
.toast-positive { border-left: 3px solid #10b981; }
.toast-negative { border-left: 3px solid #ef4444; }
.toast-info { border-left: 3px solid #3b82f6; }
@keyframes toastIn {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

/* STAT CHANGE POPUP */
.stat-change-popup {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  z-index: 500; background: var(--bg-card); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg); padding: 1.5rem 2rem;
  backdrop-filter: blur(15px); animation: popIn 0.4s ease; text-align: center; min-width: 280px;
  display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
}
.stat-diff { display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; font-weight: bold; }
.stat-diff.positive { color: #10b981; }
.stat-diff.negative { color: #ef4444; }

@keyframes popIn {
  0% { opacity: 0; transform: translate(-50%, -40%) scale(0.8); }
  20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  40% { transform: translate(-50%, -50%) scale(1); }
  80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -60%) scale(0.9); }
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .game-layout { grid-template-columns: 250px 1fr 250px; gap: 1rem; padding: 1rem; }
}
@media (max-width: 900px) {
  .game-layout { grid-template-columns: 1fr; gap: 1.5rem; padding: 1rem; }
  .game-left-panel { order: 1; }
  .game-middle-panel { order: 2; }
  .game-right-panel { order: 3; }
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .time-info { display: grid; grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .game-title { font-size: 2.8rem; }
  .career-grid { grid-template-columns: repeat(2,1fr); }
  .stats-grid { grid-template-columns: repeat(2,1fr); }
  .preview-stats { grid-template-columns: repeat(2,1fr); }
  .end-stats-grid { grid-template-columns: repeat(2,1fr); gap: 1rem; }
  .screen-title { font-size: 2rem; }
  .modal-content.modal-large { width: 95%; padding: 1.5rem; }
  .shop-items > div { display: flex; flex-direction: column; }
  .shop-item { flex-direction: column; text-align: center; }
  .shop-item-actions { width: 100%; display: flex; }
}
@media (max-width: 480px) {
  .game-title { font-size: 2.2rem; }
  .logo-icon { font-size: 3rem; }
  .logo-container { width: 90px; height: 90px; }
  .career-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .end-stats-grid { grid-template-columns: 1fr; }
  .end-actions { flex-direction: column; }
  .modal-content { width: 95%; padding: 1.5rem; margin: 10px; }
  .shop-tabs { flex-direction: column; }
  .intro-features { grid-template-columns: 1fr; }
  .feature-tag { justify-content: center; text-align: center; }
}
</style>
