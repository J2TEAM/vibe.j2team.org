<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatResult } from '../engine'

const mode = ref<'2' | '3'>('2') // A:B = C:X  or  A:B:C = D:E:X
const vals2 = ref<[number, number, number]>([1, 2, 3]) // A:B = C:?
const vals3 = ref<[number, number, number, number, number]>([1, 2, 3, 4, 5]) // A:B:C = D:E:?

const result2 = computed(() => {
  const [a, b, c] = vals2.value
  if (Math.abs(a) < 1e-12) return null
  return (b * c) / a // A:B = C:X  → X = B*C/A
})

const result3 = computed(() => {
  const [a, , c, d] = vals3.value
  // A:B:C = D:E:X
  // Means A/B = D/E and A/C = D/X  → X = C*D/A
  // Also check B/C = E/X → X = C*E/B
  if (Math.abs(a) < 1e-12) return null
  return (c * d) / a
})

const checkConsistent = computed(() => {
  if (mode.value === '2') return true
  const [a, b, , d, e] = vals3.value
  if (Math.abs(a) < 1e-12 || Math.abs(b) < 1e-12) return false
  return Math.abs(a / b - d / e) < 1e-8
})
</script>

<template>
  <div class="mode-panel">
    <div class="mode-header">
      <h3>Tỷ lệ (Ratio)</h3>
      <div class="mode-switch">
        <button :class="{ active: mode === '2' }" @click="mode = '2'">A:B = C:X</button>
        <button :class="{ active: mode === '3' }" @click="mode = '3'">A:B:C = D:E:X</button>
      </div>
    </div>

    <!-- 2-term ratio -->
    <template v-if="mode === '2'">
      <div class="ratio-row">
        <div class="ratio-field">
          <label>A</label>
          <input v-model.number="vals2[0]" type="number" step="any" />
        </div>
        <span class="colon">:</span>
        <div class="ratio-field">
          <label>B</label>
          <input v-model.number="vals2[1]" type="number" step="any" />
        </div>
        <span class="equals">=</span>
        <div class="ratio-field">
          <label>C</label>
          <input v-model.number="vals2[2]" type="number" step="any" />
        </div>
        <span class="colon">:</span>
        <div class="ratio-field result-field">
          <label>X</label>
          <div class="result-val">{{ result2 != null ? formatResult(result2) : '—' }}</div>
        </div>
      </div>

      <div v-if="result2 != null" class="display-box">
        <div class="ratio-display">
          {{ formatResult(vals2[0]) }} : {{ formatResult(vals2[1]) }} =
          {{ formatResult(vals2[2]) }} : <span class="highlight">{{ formatResult(result2) }}</span>
        </div>
      </div>
    </template>

    <!-- 3-term ratio -->
    <template v-else>
      <div class="ratio-row">
        <div class="ratio-field">
          <label>A</label>
          <input v-model.number="vals3[0]" type="number" step="any" />
        </div>
        <span class="colon">:</span>
        <div class="ratio-field">
          <label>B</label>
          <input v-model.number="vals3[1]" type="number" step="any" />
        </div>
        <span class="colon">:</span>
        <div class="ratio-field">
          <label>C</label>
          <input v-model.number="vals3[2]" type="number" step="any" />
        </div>
      </div>
      <div class="ratio-row">
        <div class="ratio-field">
          <label>D</label>
          <input v-model.number="vals3[3]" type="number" step="any" />
        </div>
        <span class="colon">:</span>
        <div class="ratio-field">
          <label>E</label>
          <input v-model.number="vals3[4]" type="number" step="any" />
        </div>
        <span class="colon">:</span>
        <div class="ratio-field result-field">
          <label>X</label>
          <div class="result-val">{{ result3 != null ? formatResult(result3) : '—' }}</div>
        </div>
      </div>

      <div v-if="!checkConsistent" class="warn-box">⚠ Tỷ lệ A:B ≠ D:E — không nhất quán</div>

      <div v-if="result3 != null" class="display-box">
        <div class="ratio-display">
          {{ formatResult(vals3[0]) }}:{{ formatResult(vals3[1]) }}:{{ formatResult(vals3[2]) }} =
          {{ formatResult(vals3[3]) }}:{{ formatResult(vals3[4]) }}:<span class="highlight">{{
            formatResult(result3)
          }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mode-panel {
  padding: 12px;
}
.mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 6px;
}
.mode-header h3 {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 14px;
  color: #c8d6e5;
  margin: 0;
}
.mode-switch {
  display: flex;
  gap: 4px;
}
.mode-switch button {
  padding: 4px 8px;
  font-size: 10px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
}
.mode-switch button.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.ratio-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-bottom: 10px;
}
.ratio-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ratio-field label {
  font-size: 10px;
  color: var(--color-text-dim);
  font-weight: 600;
}
.ratio-field input {
  width: 100%;
  background: #0a1218;
  border: 1px solid #1e2d42;
  color: #c8d6e5;
  text-align: center;
  padding: 10px 4px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  border-radius: 4px;
}
.ratio-field input:focus {
  border-color: var(--color-accent-sky);
  outline: none;
}
.result-field .result-val {
  width: 100%;
  background: #162232;
  border: 2px solid var(--color-accent-sky);
  color: var(--color-accent-sky);
  text-align: center;
  padding: 9px 4px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  border-radius: 4px;
  font-weight: 700;
}
.colon {
  font-size: 18px;
  color: var(--color-text-dim);
  font-weight: 700;
  padding-bottom: 8px;
}
.equals {
  font-size: 18px;
  color: var(--color-accent-sky);
  font-weight: 700;
  padding-bottom: 8px;
}
.display-box {
  background: #0a1218;
  border: 2px solid #1a2d42;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
}
.ratio-display {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: #c8d6e5;
  text-align: center;
}
.highlight {
  color: var(--color-accent-sky);
  font-weight: 700;
}
.warn-box {
  background: #2a1a00;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  padding: 8px;
  font-size: 11px;
  color: #fbbf24;
  text-align: center;
  margin-bottom: 8px;
}
</style>
