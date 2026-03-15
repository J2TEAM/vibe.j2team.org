<script setup lang="ts">
import { ref, computed } from 'vue'
import { calc } from '../engine'
import type { AngleMode } from '../types'

const angleMode = ref<AngleMode>('DEG')
const lhs = ref('')
const operator = ref<'=' | '≠' | '<' | '>' | '≤' | '≥'>('=')
const rhs = ref('')
const verdict = ref<'TRUE' | 'FALSE' | null>(null)
const isError = ref(false)
const errorText = ref('')
const history = ref<{ expr: string; result: 'TRUE' | 'FALSE' }[]>([])

const operators: { label: string; value: '=' | '≠' | '<' | '>' | '≤' | '≥' }[] = [
  { label: '=', value: '=' },
  { label: '≠', value: '≠' },
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: '≤', value: '≤' },
  { label: '≥', value: '≥' },
]

function verify() {
  if (!lhs.value.trim() || !rhs.value.trim()) return
  try {
    isError.value = false
    const left = calc(lhs.value)
    const right = calc(rhs.value)
    if (!left.ok || !right.ok) {
      throw new Error(
        (!left.ok ? left.error : '') || (!right.ok ? (right as { error: string }).error : ''),
      )
    }
    const lv = left.raw
    const rv = right.raw
    const EPS = 1e-10

    let result = false
    switch (operator.value) {
      case '=':
        result = Math.abs(lv - rv) < EPS
        break
      case '≠':
        result = Math.abs(lv - rv) >= EPS
        break
      case '<':
        result = lv < rv - EPS
        break
      case '>':
        result = lv > rv + EPS
        break
      case '≤':
        result = lv <= rv + EPS
        break
      case '≥':
        result = lv >= rv - EPS
        break
    }
    verdict.value = result ? 'TRUE' : 'FALSE'
    const exprStr = `${lhs.value} ${operator.value} ${rhs.value}`
    history.value.unshift({ expr: exprStr, result: verdict.value })
    if (history.value.length > 20) history.value.pop()
  } catch (err) {
    isError.value = true
    errorText.value = err instanceof Error ? err.message : 'Error'
    verdict.value = null
  }
}

function clear() {
  lhs.value = ''
  rhs.value = ''
  verdict.value = null
  isError.value = false
}

const displayExpr = computed(() => `${lhs.value || '?'} ${operator.value} ${rhs.value || '?'}`)
</script>

<template>
  <div class="mode-panel">
    <div class="mode-header">
      <h3>Kiểm tra (Verify)</h3>
      <div class="angle-switch">
        <button
          v-for="m in ['DEG', 'RAD', 'GRA'] as const"
          :key="m"
          :class="{ active: angleMode === m }"
          @click="angleMode = m"
        >
          {{ m }}
        </button>
      </div>
    </div>

    <!-- Operator selector -->
    <div class="op-row">
      <button
        v-for="op in operators"
        :key="op.value"
        :class="{ active: operator === op.value }"
        @click="operator = op.value"
        class="op-btn"
      >
        {{ op.label }}
      </button>
    </div>

    <!-- Inputs -->
    <div class="verify-inputs">
      <div class="expr-field">
        <label>Vế trái</label>
        <input v-model="lhs" placeholder="Vd: sin(30)" @keydown.enter="verify" />
      </div>
      <div class="op-display">{{ operator }}</div>
      <div class="expr-field">
        <label>Vế phải</label>
        <input v-model="rhs" placeholder="Vd: 1/2" @keydown.enter="verify" />
      </div>
    </div>

    <!-- Display -->
    <div
      class="display-box"
      :class="{ 'is-true': verdict === 'TRUE', 'is-false': verdict === 'FALSE' }"
    >
      <div class="expr-display">{{ displayExpr }}</div>
      <div v-if="isError" class="verdict error">{{ errorText }}</div>
      <div v-else-if="verdict" class="verdict" :class="verdict.toLowerCase()">{{ verdict }}</div>
    </div>

    <div class="action-row">
      <button class="btn-verify" @click="verify">=</button>
      <button class="btn-clear" @click="clear">AC</button>
    </div>

    <!-- History -->
    <div v-if="history.length > 0" class="history">
      <div v-for="(h, i) in history" :key="i" class="hist-item" :class="h.result.toLowerCase()">
        <span class="hist-expr">{{ h.expr }}</span>
        <span class="hist-result">{{ h.result }}</span>
      </div>
    </div>
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
  margin-bottom: 10px;
}
.mode-header h3 {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 14px;
  color: #c8d6e5;
  margin: 0;
}
.angle-switch {
  display: flex;
  gap: 2px;
}
.angle-switch button {
  padding: 3px 6px;
  font-size: 9px;
  border: 1px solid var(--color-border-default);
  background: #131f2e;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 3px;
}
.angle-switch button.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.op-row {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}
.op-btn {
  flex: 1;
  padding: 8px;
  font-size: 14px;
  background: #131f2e;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
}
.op-btn.active {
  background: #1e3a55;
  border-color: var(--color-accent-sky);
  color: var(--color-accent-sky);
}
.verify-inputs {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 10px;
}
.expr-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.expr-field label {
  font-size: 10px;
  color: var(--color-text-dim);
}
.expr-field input {
  background: #0a1218;
  border: 1px solid #1e2d42;
  color: #c8d6e5;
  padding: 10px 8px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  border-radius: 4px;
  width: 100%;
}
.expr-field input:focus {
  border-color: var(--color-accent-sky);
  outline: none;
}
.op-display {
  font-size: 20px;
  color: var(--color-accent-sky);
  font-weight: 700;
  padding-bottom: 8px;
  font-family: var(--font-display, 'Anybody', sans-serif);
}
.display-box {
  background: #0a1218;
  border: 2px solid #1a2d42;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  transition: border-color 0.3s;
}
.display-box.is-true {
  border-color: #22c55e;
}
.display-box.is-false {
  border-color: #ef4444;
}
.expr-display {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
}
.verdict {
  font-family: var(--font-display, 'Anybody', sans-serif);
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-top: 8px;
}
.verdict.true {
  color: #22c55e;
}
.verdict.false {
  color: #ef4444;
}
.verdict.error {
  color: var(--color-accent-coral);
  font-size: 14px;
}
.action-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.btn-verify {
  flex: 1;
  padding: 12px;
  background: var(--color-accent-sky);
  color: #0a1520;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}
.btn-clear {
  padding: 12px 20px;
  background: #131f2e;
  color: #60a5fa;
  font-size: 14px;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}
.history {
  max-height: 180px;
  overflow-y: auto;
}
.hist-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid #131f2e;
  font-size: 11px;
}
.hist-item.true {
  color: #22c55e;
}
.hist-item.false {
  color: #ef4444;
}
.hist-expr {
  font-family: 'Courier New', monospace;
  color: var(--color-text-secondary);
}
.hist-result {
  font-weight: 700;
}
</style>
