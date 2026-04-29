<script setup lang="ts">
import { ref, defineAsyncComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import type { CalculatorMode } from './types'

const router = useRouter()

// Default mode — eagerly loaded so it appears instantly on page open
import CalculateMode from './components/CalculateMode.vue'

// Loading placeholder shown while a mode chunk is being fetched
const ModeLoader = { render: () => h('div', { class: 'mode-loader' }, '...') }

// All other modes — lazy-loaded on first use
const ComplexMode = defineAsyncComponent({
  loader: () => import('./components/ComplexMode.vue'),
  loadingComponent: ModeLoader,
})
const BaseNMode = defineAsyncComponent({
  loader: () => import('./components/BaseNMode.vue'),
  loadingComponent: ModeLoader,
})
const MatrixMode = defineAsyncComponent({
  loader: () => import('./components/MatrixMode.vue'),
  loadingComponent: ModeLoader,
})
const VectorMode = defineAsyncComponent({
  loader: () => import('./components/VectorMode.vue'),
  loadingComponent: ModeLoader,
})
const StatisticsMode = defineAsyncComponent({
  loader: () => import('./components/StatisticsMode.vue'),
  loadingComponent: ModeLoader,
})
const DistributionMode = defineAsyncComponent({
  loader: () => import('./components/DistributionMode.vue'),
  loadingComponent: ModeLoader,
})
const TableMode = defineAsyncComponent({
  loader: () => import('./components/TableMode.vue'),
  loadingComponent: ModeLoader,
})
const EquationMode = defineAsyncComponent({
  loader: () => import('./components/EquationMode.vue'),
  loadingComponent: ModeLoader,
})
const InequalityMode = defineAsyncComponent({
  loader: () => import('./components/InequalityMode.vue'),
  loadingComponent: ModeLoader,
})
const VerifyMode = defineAsyncComponent({
  loader: () => import('./components/VerifyMode.vue'),
  loadingComponent: ModeLoader,
})
const RatioMode = defineAsyncComponent({
  loader: () => import('./components/RatioMode.vue'),
  loadingComponent: ModeLoader,
})
const SpreadsheetMode = defineAsyncComponent({
  loader: () => import('./components/SpreadsheetMode.vue'),
  loadingComponent: ModeLoader,
})

const mode = ref<CalculatorMode>('calculate')
const showMenu = ref(false)

const tabs: { id: CalculatorMode; num: number; label: string; icon: string }[] = [
  { id: 'calculate', num: 1, label: 'Tính toán', icon: '🔢' },
  { id: 'complex', num: 2, label: 'Số phức', icon: '𝑖' },
  { id: 'base_n', num: 3, label: 'Cơ số N', icon: '⟨₂⟩' },
  { id: 'matrix', num: 4, label: 'Ma trận', icon: '▦' },
  { id: 'vector', num: 5, label: 'Véc-tơ', icon: '→' },
  { id: 'statistics', num: 6, label: 'Thống kê', icon: '📊' },
  { id: 'distribution', num: 7, label: 'Phân phối', icon: '📈' },
  { id: 'table', num: 8, label: 'Bảng GT', icon: '⊞' },
  { id: 'equation', num: 9, label: 'PT/Hàm', icon: '𝑓' },
  { id: 'inequality', num: 10, label: 'Bất PT', icon: '≤' },
  { id: 'verify', num: 11, label: 'Kiểm tra', icon: '✓' },
  { id: 'ratio', num: 12, label: 'Tỷ lệ', icon: '⅔' },
  { id: 'spreadsheet', num: 13, label: 'Bảng tính', icon: '⊞⊞' },
]

const currentLabel = ref('')
function selectMode(t: (typeof tabs)[number]) {
  mode.value = t.id
  currentLabel.value = t.label
  showMenu.value = false
}

// initialise label
currentLabel.value = tabs[0]!.label
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep font-body flex flex-col items-center justify-center px-3 py-6 math-bg"
  >
    <button class="back-btn" @click="router.push('/')">
      <Icon icon="lucide:arrow-left" class="back-icon" /> Quay lại
    </button>
    <div class="w-full max-w-[400px] calc-shell">
      <!-- Brand header -->
      <div class="brand-header">
        <div class="brand-left">
          <span class="brand-name">// A.S.C EX-5000</span>
          <span class="brand-sub">MÁY TÍNH KHOA HỌC</span>
        </div>
        <div class="solar-panel">
          <span class="solar-cell"></span>
          <span class="solar-cell"></span>
          <span class="solar-cell"></span>
          <span class="solar-cell"></span>
        </div>
      </div>

      <!-- Compact mode bar -->
      <div class="mode-bar">
        <button class="menu-btn" @click="showMenu = !showMenu">MENU</button>
        <span class="mode-name">{{ currentLabel }}</span>
      </div>

      <!-- Mode grid popup -->
      <div v-if="showMenu" class="menu-overlay" @click.self="showMenu = false">
        <div class="menu-grid-box">
          <div class="menu-title">Chọn chế độ</div>
          <div class="menu-grid">
            <button
              v-for="t in tabs"
              :key="t.id"
              class="menu-cell"
              :class="{ active: mode === t.id }"
              @click="selectMode(t)"
            >
              <span class="cell-icon">{{ t.icon }}</span>
              <span class="cell-num">{{ t.num }}</span>
              <span class="cell-label">{{ t.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Active mode -->
      <CalculateMode v-if="mode === 'calculate'" />
      <ComplexMode v-else-if="mode === 'complex'" />
      <BaseNMode v-else-if="mode === 'base_n'" />
      <MatrixMode v-else-if="mode === 'matrix'" />
      <VectorMode v-else-if="mode === 'vector'" />
      <StatisticsMode v-else-if="mode === 'statistics'" />
      <DistributionMode v-else-if="mode === 'distribution'" />
      <TableMode v-else-if="mode === 'table'" />
      <EquationMode v-else-if="mode === 'equation'" />
      <InequalityMode v-else-if="mode === 'inequality'" />
      <VerifyMode v-else-if="mode === 'verify'" />
      <RatioMode v-else-if="mode === 'ratio'" />
      <SpreadsheetMode v-else-if="mode === 'spreadsheet'" />
      <div v-else class="p-8 text-center">
        <p class="text-text-dim text-sm">Sắp ra mắt</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Math symbol mosaic background ── */
.math-bg {
  position: relative;
}
.math-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cstyle%3Etext%7Bfont-family:Courier New,monospace;fill:%2338bdf8;opacity:0.2%7D%3C/style%3E%3Ctext x='12' y='18' font-size='14' transform='rotate(-10,12,18)'%3Eπ%3C/text%3E%3Ctext x='52' y='30' font-size='12' transform='rotate(7,52,30)'%3E∑%3C/text%3E%3Ctext x='95' y='14' font-size='15' transform='rotate(-18,95,14)'%3E∫%3C/text%3E%3Ctext x='140' y='26' font-size='11' transform='rotate(12,140,26)'%3E√%3C/text%3E%3Ctext x='178' y='18' font-size='13' transform='rotate(-5,178,18)'%3E∞%3C/text%3E%3Ctext x='220' y='32' font-size='14' transform='rotate(16,220,32)'%3E±%3C/text%3E%3Ctext x='265' y='20' font-size='10' transform='rotate(-14,265,20)'%3Esin%3C/text%3E%3Ctext x='312' y='28' font-size='13' transform='rotate(9,312,28)'%3E÷%3C/text%3E%3Ctext x='352' y='16' font-size='15' transform='rotate(-7,352,16)'%3E×%3C/text%3E%3Ctext x='390' y='34' font-size='12' transform='rotate(20,390,34)'%3E≠%3C/text%3E%3Ctext x='28' y='58' font-size='13' transform='rotate(14,28,58)'%3Eθ%3C/text%3E%3Ctext x='72' y='66' font-size='11' transform='rotate(-20,72,66)'%3EΔ%3C/text%3E%3Ctext x='118' y='54' font-size='14' transform='rotate(4,118,54)'%3Eφ%3C/text%3E%3Ctext x='162' y='62' font-size='10' transform='rotate(-12,162,62)'%3Ecos%3C/text%3E%3Ctext x='208' y='52' font-size='15' transform='rotate(18,208,52)'%3Eλ%3C/text%3E%3Ctext x='248' y='68' font-size='12' transform='rotate(-8,248,68)'%3Eσ%3C/text%3E%3Ctext x='290' y='56' font-size='13' transform='rotate(11,290,56)'%3Eα%3C/text%3E%3Ctext x='335' y='64' font-size='11' transform='rotate(-16,335,64)'%3Etan%3C/text%3E%3Ctext x='378' y='52' font-size='14' transform='rotate(6,378,52)'%3Eβ%3C/text%3E%3Ctext x='15' y='95' font-size='12' transform='rotate(-9,15,95)'%3Eγ%3C/text%3E%3Ctext x='58' y='102' font-size='15' transform='rotate(22,58,102)'%3Eε%3C/text%3E%3Ctext x='105' y='90' font-size='11' transform='rotate(-15,105,90)'%3Eω%3C/text%3E%3Ctext x='148' y='98' font-size='13' transform='rotate(8,148,98)'%3E∂%3C/text%3E%3Ctext x='192' y='88' font-size='10' transform='rotate(-20,192,88)'%3Elog%3C/text%3E%3Ctext x='238' y='96' font-size='14' transform='rotate(13,238,96)'%3E∏%3C/text%3E%3Ctext x='280' y='104' font-size='12' transform='rotate(-6,280,104)'%3E∮%3C/text%3E%3Ctext x='322' y='92' font-size='15' transform='rotate(17,322,92)'%3E∇%3C/text%3E%3Ctext x='368' y='100' font-size='11' transform='rotate(-11,368,100)'%3E⊕%3C/text%3E%3Ctext x='35' y='135' font-size='14' transform='rotate(5,35,135)'%3E⊗%3C/text%3E%3Ctext x='78' y='142' font-size='10' transform='rotate(-18,78,142)'%3Eln%3C/text%3E%3Ctext x='120' y='130' font-size='13' transform='rotate(10,120,130)'%3E∈%3C/text%3E%3Ctext x='165' y='138' font-size='15' transform='rotate(-4,165,138)'%3E⊂%3C/text%3E%3Ctext x='210' y='128' font-size='12' transform='rotate(19,210,128)'%3E⊃%3C/text%3E%3Ctext x='255' y='140' font-size='11' transform='rotate(-14,255,140)'%3E∪%3C/text%3E%3Ctext x='298' y='132' font-size='14' transform='rotate(7,298,132)'%3E∩%3C/text%3E%3Ctext x='342' y='144' font-size='13' transform='rotate(-22,342,144)'%3E⊥%3C/text%3E%3Ctext x='385' y='130' font-size='10' transform='rotate(15,385,130)'%3Elim%3C/text%3E%3Ctext x='22' y='172' font-size='15' transform='rotate(-7,22,172)'%3E∠%3C/text%3E%3Ctext x='65' y='180' font-size='12' transform='rotate(12,65,180)'%3E°%3C/text%3E%3Ctext x='108' y='168' font-size='14' transform='rotate(-16,108,168)'%3Eℝ%3C/text%3E%3Ctext x='155' y='176' font-size='10' transform='rotate(20,155,176)'%3Emod%3C/text%3E%3Ctext x='200' y='170' font-size='13' transform='rotate(-3,200,170)'%3Eℂ%3C/text%3E%3Ctext x='242' y='182' font-size='15' transform='rotate(9,242,182)'%3Eℤ%3C/text%3E%3Ctext x='288' y='172' font-size='11' transform='rotate(-19,288,172)'%3Eℕ%3C/text%3E%3Ctext x='330' y='178' font-size='14' transform='rotate(6,330,178)'%3E∀%3C/text%3E%3Ctext x='375' y='168' font-size='12' transform='rotate(-10,375,168)'%3E∃%3C/text%3E%3Ctext x='42' y='210' font-size='13' transform='rotate(18,42,210)'%3E→%3C/text%3E%3Ctext x='85' y='218' font-size='10' transform='rotate(-13,85,218)'%3Eexp%3C/text%3E%3Ctext x='132' y='206' font-size='15' transform='rotate(4,132,206)'%3E⇒%3C/text%3E%3Ctext x='175' y='214' font-size='12' transform='rotate(-21,175,214)'%3E⇔%3C/text%3E%3Ctext x='218' y='208' font-size='14' transform='rotate(11,218,208)'%3E¬%3C/text%3E%3Ctext x='262' y='220' font-size='11' transform='rotate(-8,262,220)'%3E∧%3C/text%3E%3Ctext x='305' y='210' font-size='10' transform='rotate(16,305,210)'%3EnPr%3C/text%3E%3Ctext x='350' y='218' font-size='15' transform='rotate(-5,350,218)'%3E∨%3C/text%3E%3Ctext x='392' y='206' font-size='13' transform='rotate(14,392,206)'%3E←%3C/text%3E%3Ctext x='18' y='248' font-size='11' transform='rotate(-17,18,248)'%3E↔%3C/text%3E%3Ctext x='62' y='256' font-size='10' transform='rotate(22,62,256)'%3EnCr%3C/text%3E%3Ctext x='110' y='244' font-size='14' transform='rotate(-6,110,244)'%3Eμ%3C/text%3E%3Ctext x='152' y='252' font-size='15' transform='rotate(10,152,252)'%3Eπ%3C/text%3E%3Ctext x='198' y='242' font-size='10' transform='rotate(-15,198,242)'%3Edet%3C/text%3E%3Ctext x='240' y='258' font-size='13' transform='rotate(8,240,258)'%3E∑%3C/text%3E%3Ctext x='285' y='248' font-size='12' transform='rotate(-12,285,248)'%3E∫%3C/text%3E%3Ctext x='328' y='254' font-size='14' transform='rotate(19,328,254)'%3En!%3C/text%3E%3Ctext x='370' y='244' font-size='11' transform='rotate(-9,370,244)'%3E≤%3C/text%3E%3Ctext x='30' y='288' font-size='15' transform='rotate(7,30,288)'%3E≥%3C/text%3E%3Ctext x='75' y='294' font-size='10' transform='rotate(-20,75,294)'%3Edim%3C/text%3E%3Ctext x='118' y='282' font-size='12' transform='rotate(14,118,282)'%3E‰%3C/text%3E%3Ctext x='162' y='290' font-size='14' transform='rotate(-4,162,290)'%3E½%3C/text%3E%3Ctext x='205' y='280' font-size='13' transform='rotate(17,205,280)'%3E∞%3C/text%3E%3Ctext x='250' y='292' font-size='10' transform='rotate(-11,250,292)'%3Esup%3C/text%3E%3Ctext x='295' y='284' font-size='15' transform='rotate(6,295,284)'%3EΔ%3C/text%3E%3Ctext x='338' y='296' font-size='11' transform='rotate(-18,338,296)'%3Eθ%3C/text%3E%3Ctext x='382' y='282' font-size='14' transform='rotate(13,382,282)'%3E¼%3C/text%3E%3Ctext x='48' y='325' font-size='12' transform='rotate(-8,48,325)'%3E²%3C/text%3E%3Ctext x='90' y='332' font-size='15' transform='rotate(20,90,332)'%3E³%3C/text%3E%3Ctext x='135' y='320' font-size='11' transform='rotate(-14,135,320)'%3E≈%3C/text%3E%3Ctext x='178' y='328' font-size='13' transform='rotate(5,178,328)'%3E≠%3C/text%3E%3Ctext x='222' y='318' font-size='14' transform='rotate(-22,222,318)'%3E±%3C/text%3E%3Ctext x='268' y='330' font-size='10' transform='rotate(11,268,330)'%3Esin%3C/text%3E%3Ctext x='310' y='322' font-size='12' transform='rotate(-7,310,322)'%3E÷%3C/text%3E%3Ctext x='355' y='334' font-size='15' transform='rotate(16,355,334)'%3E×%3C/text%3E%3Ctext x='395' y='320' font-size='13' transform='rotate(-3,395,320)'%3E√%3C/text%3E%3Ctext x='20' y='365' font-size='14' transform='rotate(9,20,365)'%3Eφ%3C/text%3E%3Ctext x='65' y='372' font-size='10' transform='rotate(-16,65,372)'%3Ecos%3C/text%3E%3Ctext x='112' y='358' font-size='13' transform='rotate(21,112,358)'%3Eλ%3C/text%3E%3Ctext x='155' y='370' font-size='15' transform='rotate(-10,155,370)'%3Eσ%3C/text%3E%3Ctext x='198' y='362' font-size='11' transform='rotate(7,198,362)'%3Eα%3C/text%3E%3Ctext x='242' y='374' font-size='14' transform='rotate(-19,242,374)'%3Eβ%3C/text%3E%3Ctext x='288' y='360' font-size='10' transform='rotate(13,288,360)'%3Etan%3C/text%3E%3Ctext x='332' y='368' font-size='12' transform='rotate(-5,332,368)'%3Eγ%3C/text%3E%3Ctext x='375' y='378' font-size='15' transform='rotate(18,375,378)'%3Eε%3C/text%3E%3Ctext x='38' y='398' font-size='11' transform='rotate(-13,38,398)'%3E⊢%3C/text%3E%3Ctext x='82' y='392' font-size='14' transform='rotate(8,82,392)'%3E⊨%3C/text%3E%3Ctext x='128' y='396' font-size='12' transform='rotate(-6,128,396)'%3Eω%3C/text%3E%3Ctext x='172' y='390' font-size='13' transform='rotate(15,172,390)'%3E∂%3C/text%3E%3Ctext x='215' y='398' font-size='10' transform='rotate(-20,215,398)'%3Elog%3C/text%3E%3Ctext x='260' y='392' font-size='15' transform='rotate(4,260,392)'%3E∏%3C/text%3E%3Ctext x='305' y='396' font-size='11' transform='rotate(-11,305,396)'%3E⇐%3C/text%3E%3Ctext x='348' y='390' font-size='14' transform='rotate(22,348,390)'%3E∮%3C/text%3E%3Ctext x='392' y='396' font-size='13' transform='rotate(-9,392,396)'%3E∇%3C/text%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 400px 400px;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
.math-bg > * {
  position: relative;
  z-index: 1;
}

.calc-shell {
  background: #0d1520;
  border: 2px solid #1a2d42;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 10px;
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.back-btn:hover {
  color: var(--color-accent-sky);
}
.back-icon {
  width: 14px;
  height: 14px;
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 6px;
}
.brand-left {
  display: flex;
  flex-direction: column;
}
.brand-name {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 18px;
  font-weight: 800;
  font-style: italic;
  color: #f97316;
  letter-spacing: 1px;
}
.brand-sub {
  font-size: 8px;
  font-weight: 600;
  color: var(--color-text-dim);
  letter-spacing: 1px;
  margin-top: 2px;
}
.solar-panel {
  display: flex;
  gap: 2px;
  padding: 4px 6px;
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 3px;
}
.solar-cell {
  width: 12px;
  height: 20px;
  background: linear-gradient(180deg, #1a1a3e 0%, #0d0d2a 50%, #1a1a3e 100%);
  border: 1px solid #2a2a4a;
  border-radius: 1px;
}

.mode-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #0a1218;
  border-bottom: 1px solid #1a2d42;
}
.menu-btn {
  padding: 4px 10px;
  font-size: 10px;
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 700;
  color: var(--color-accent-sky);
  background: #131f2e;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.5px;
}
.menu-btn:hover {
  background: #1e3a55;
}
.mode-name {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* ── Menu Grid Popup ── */
.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.menu-grid-box {
  width: 100%;
  max-width: 340px;
  background: #0d1520;
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  padding: 16px;
}
.menu-title {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-weight: 700;
  font-size: 13px;
  color: #c8d6e5;
  text-align: center;
  margin-bottom: 12px;
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.menu-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px 8px;
  background: #131f2e;
  border: 1px solid #1e2d42;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;
  position: relative;
}
.menu-cell:hover {
  background: #1a2d42;
  border-color: var(--color-accent-sky);
}
.menu-cell.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
}
.cell-icon {
  font-size: 18px;
  line-height: 1;
}
.cell-num {
  position: absolute;
  top: 3px;
  left: 5px;
  font-size: 8px;
  color: var(--color-text-dim);
  font-weight: 600;
}
.cell-label {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 9px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.2;
}
.menu-cell.active .cell-label {
  color: var(--color-accent-sky);
}
.menu-cell:hover .cell-label {
  color: #c8d6e5;
}

/* ── Mode loading placeholder ── */
.mode-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: var(--color-text-dim);
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 11px;
  letter-spacing: 2px;
  opacity: 0.5;
}
</style>
