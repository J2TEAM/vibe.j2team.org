<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  connectionCount: number
  trackedIpCount: number
  ipInput: string
  isLookupLoading: boolean
  canClear: boolean
}>()

const emit = defineEmits<{
  'update:ipInput': [value: string]
  submit: []
  clear: []
}>()

const ipInputModel = computed({
  get: () => props.ipInput,
  set: (value: string) => emit('update:ipInput', value),
})

function handleSubmit() {
  emit('submit')
}

function handleClear() {
  emit('clear')
}
</script>

<template>
  <header class="world-map-topbar">
    <div>
      <h2>IP Location Map</h2>
      <p>Bản đồ vector realtime cho vị trí IP của bạn và các IP đã tra cứu.</p>
    </div>

    <div class="world-map-controls">
      <div class="world-map-kpis" aria-label="Map metrics">
        <span>{{ connectionCount }} links</span>
        <span>{{ trackedIpCount }} ips</span>
      </div>

      <form class="world-map-lookup-form" @submit.prevent="handleSubmit">
        <input
          v-model="ipInputModel"
          type="text"
          placeholder="Nhập IP/domain (vd: 8.8.8.8, google.com, cloudflare.com)"
          aria-label="IP hoặc domain lookup"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="submit" :disabled="isLookupLoading">
          {{ isLookupLoading ? 'Đang tra...' : 'Tra cứu' }}
        </button>
        <button v-if="canClear" type="button" class="is-ghost" @click="handleClear">Xóa</button>
      </form>
    </div>
  </header>
</template>

<style scoped>
.world-map-topbar {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border-default);
  background: linear-gradient(90deg, rgb(15 25 35 / 92%), rgb(15 25 35 / 68%));
}

.world-map-topbar h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-primary);
}

.world-map-topbar p {
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
  letter-spacing: 0.03em;
}

.world-map-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.world-map-kpis {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.world-map-kpis span {
  border: 1px solid var(--color-border-default);
  background: rgb(15 25 35 / 66%);
  padding: 4px 8px;
  color: var(--color-text-secondary);
  font-size: 10px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.world-map-lookup-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.world-map-lookup-form input {
  min-width: 260px;
  border: 1px solid var(--color-border-default);
  background: rgb(15 25 35 / 80%);
  color: var(--color-text-primary);
  padding: 7px 10px;
  font-size: 12px;
  letter-spacing: 0.03em;
  outline: none;
  transition: border-color 0.18s;
}

.world-map-lookup-form input::placeholder {
  color: var(--color-text-dim);
}

.world-map-lookup-form input:focus {
  border-color: var(--color-accent-coral);
}

.world-map-lookup-form button {
  border: 1px solid var(--color-border-default);
  background: rgb(15 25 35 / 82%);
  color: var(--color-text-secondary);
  padding: 7px 9px;
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    border-color 0.18s,
    color 0.18s,
    background-color 0.18s;
}

.world-map-lookup-form button:hover {
  border-color: var(--color-accent-coral);
  color: var(--color-text-primary);
  background: rgb(255 107 74 / 12%);
}

.world-map-lookup-form button:disabled {
  opacity: 0.58;
  cursor: default;
}

.world-map-lookup-form button.is-ghost {
  color: var(--color-text-dim);
}

@media (max-width: 1100px) {
  .world-map-controls {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .world-map-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .world-map-lookup-form {
    width: 100%;
  }

  .world-map-lookup-form input {
    width: 100%;
    min-width: 0;
  }
}
</style>
