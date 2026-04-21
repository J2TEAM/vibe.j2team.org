<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { TrackedIpLocation } from '../types'

const props = defineProps<{
  activeTrackedIpLocation: TrackedIpLocation | null
  trackedIpLocations: TrackedIpLocation[]
  selfIpLocation: TrackedIpLocation | null
  isSelfIpResolving: boolean
  lookupError: string
  formatIpLabel: (ip: string) => string
}>()

const emit = defineEmits<{
  selectIp: [location: TrackedIpLocation, shouldFocus: boolean]
  focusSelfIp: []
}>()

function handleIpClick(location: TrackedIpLocation) {
  emit('selectIp', location, true)
}

function handleIpHover(location: TrackedIpLocation) {
  emit('selectIp', location, false)
}

function handleFocusSelfIp() {
  emit('focusSelfIp')
}

function getLookupLabel(location: TrackedIpLocation) {
  return location.query ?? location.ip
}

function getLookupKey(location: TrackedIpLocation) {
  return `${getLookupLabel(location)}-${location.ip}`
}

function isLocationActive(location: TrackedIpLocation) {
  if (!props.activeTrackedIpLocation) {
    return false
  }

  return getLookupLabel(location) === getLookupLabel(props.activeTrackedIpLocation)
}

function getResolvedIpLabel(location: TrackedIpLocation) {
  return location.query ? `IP thật: ${location.ip}` : 'IP thật: --'
}
</script>

<template>
  <aside class="world-map-sidebar" aria-live="polite">
    <div class="world-map-ip-card">
      <div class="world-map-ip-card-head">
        <p class="world-map-focus-label">IP Lookup</p>
        <span class="world-map-ip-count">{{ props.trackedIpLocations.length }} tracked</span>
      </div>

      <button
        v-if="props.selfIpLocation"
        type="button"
        class="world-map-self-ip-trigger"
        @click="handleFocusSelfIp"
      >
        <Icon icon="lucide:map-pin" class="world-map-self-ip-icon" aria-hidden="true" />
        {{
          `Bạn: ${props.selfIpLocation.ip} - ${props.selfIpLocation.city}, ${props.selfIpLocation.country}`
        }}
      </button>

      <p v-else class="world-map-ip-meta">
        {{
          props.isSelfIpResolving
            ? 'Đang phát hiện IP hiện tại của bạn...'
            : 'Không thể phát hiện IP hiện tại.'
        }}
      </p>

      <div class="world-map-focus-panel">
        <template v-if="props.activeTrackedIpLocation">
          <h4 class="world-map-focus-title" :title="getLookupLabel(props.activeTrackedIpLocation)">
            {{ getLookupLabel(props.activeTrackedIpLocation) }}
          </h4>
          <p class="world-map-focus-region">
            {{ `${props.activeTrackedIpLocation.city}, ${props.activeTrackedIpLocation.country}` }}
          </p>
          <p
            class="world-map-ip-meta world-map-focus-meta"
            :class="{ 'is-hidden': !props.activeTrackedIpLocation.query }"
          >
            {{ getResolvedIpLabel(props.activeTrackedIpLocation) }}
          </p>
          <p
            class="world-map-ip-meta world-map-focus-meta"
            :title="props.activeTrackedIpLocation.isp"
          >
            {{ props.activeTrackedIpLocation.isp }}
          </p>
        </template>

        <p v-else-if="!props.lookupError" class="world-map-ip-placeholder">
          Chưa có mục được chọn. Hãy nhập một hoặc nhiều IP/domain ở khung bên trên.
        </p>

        <p v-else class="world-map-ip-error">
          {{ props.lookupError }}
        </p>
      </div>

      <ul v-if="props.trackedIpLocations.length > 0" class="world-map-ip-list">
        <li v-for="location in props.trackedIpLocations" :key="`tracked-${getLookupKey(location)}`">
          <button
            type="button"
            class="world-map-ip-item"
            :class="{ 'is-active': isLocationActive(location) }"
            @click="handleIpClick(location)"
            @mouseenter="handleIpHover(location)"
            @focus="handleIpHover(location)"
          >
            <span>{{ props.formatIpLabel(getLookupLabel(location)) }}</span>
            <strong>{{ location.country }}</strong>
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
.world-map-sidebar {
  border-left: 1px solid var(--color-border-default);
  background: linear-gradient(180deg, rgb(15 25 35 / 82%), rgb(15 25 35 / 64%));
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.world-map-ip-card {
  border: 1px solid var(--color-border-default);
  background: rgb(15 25 35 / 66%);
  padding: 10px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.world-map-focus-label {
  margin-bottom: 6px;
  color: var(--color-text-dim);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.world-map-focus-panel {
  margin-top: 10px;
  min-height: 116px;
  max-height: 116px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.world-map-focus-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.world-map-focus-region {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.35;
  min-height: calc(1.35em * 2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.world-map-ip-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.world-map-ip-count {
  color: var(--color-text-dim);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.world-map-ip-meta {
  margin: 0;
  color: color-mix(in srgb, var(--color-accent-sky) 80%, var(--color-text-primary) 20%);
  font-size: 11px;
  letter-spacing: 0.03em;
  line-height: 1.35;
}

.world-map-focus-meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.world-map-ip-meta.is-hidden {
  visibility: hidden;
}

.world-map-ip-placeholder {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  min-height: 100%;
  display: grid;
  align-content: center;
}

.world-map-ip-error {
  margin: 0;
  color: var(--color-accent-coral);
  font-size: 11px;
  line-height: 1.35;
  min-height: 100%;
  overflow: auto;
}

.world-map-ip-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 6px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-accent-sky) 36%, var(--color-border-default) 64%)
    color-mix(in srgb, var(--color-bg-surface) 84%, black 16%);
}

.world-map-ip-item {
  width: 100%;
  border: 1px solid var(--color-border-default);
  background: rgb(15 25 35 / 60%);
  color: var(--color-text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  text-align: left;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 11px;
  letter-spacing: 0.04em;
  transition:
    border-color 0.18s,
    background-color 0.18s;
}

.world-map-ip-item strong {
  color: var(--color-accent-sky);
  font-size: 10px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.world-map-ip-item:hover,
.world-map-ip-item.is-active {
  border-color: var(--color-accent-sky);
  background: rgb(56 189 248 / 10%);
}

.world-map-self-ip-trigger {
  margin-top: 8px;
  border: 1px solid color-mix(in srgb, var(--color-accent-sky) 58%, var(--color-border-default) 42%);
  background: rgb(56 189 248 / 10%);
  color: color-mix(in srgb, var(--color-accent-sky) 88%, var(--color-text-primary) 12%);
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 6px 8px;
  font-size: 11px;
  letter-spacing: 0.03em;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s,
    color 0.18s,
    background-color 0.18s;
}

.world-map-self-ip-trigger:hover {
  border-color: var(--color-accent-sky);
  color: var(--color-text-primary);
  background: rgb(56 189 248 / 16%);
}

.world-map-self-ip-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.world-map-ip-list::-webkit-scrollbar {
  width: 10px;
}

.world-map-ip-list::-webkit-scrollbar-track {
  background: color-mix(in srgb, var(--color-bg-surface) 84%, black 16%);
  border-left: 1px solid color-mix(in srgb, var(--color-border-default) 78%, black 22%);
}

.world-map-ip-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-accent-sky) 56%, var(--color-border-default) 44%),
    color-mix(in srgb, var(--color-accent-coral) 52%, var(--color-border-default) 48%)
  );
}

.world-map-ip-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-accent-sky) 72%, var(--color-border-default) 28%),
    color-mix(in srgb, var(--color-accent-coral) 68%, var(--color-border-default) 32%)
  );
}

@media (max-width: 1100px) {
  .world-map-sidebar {
    border-left: 0;
    border-top: 1px solid var(--color-border-default);
  }
}
</style>
