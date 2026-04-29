<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import type { JsonValue } from '../types'

import JsonPayloadBuilder from './JsonPayloadBuilder.vue'
import { useMockStudioContext } from '../composables/useMockStudioContext'
import { createPair, normalizeEndpoint, safeParseJson } from '../utils/mock-engine'

const {
  REQUEST_METHODS,
  requestDraft,
  engineError,
  activeRule,
  addRequestPair,
  removeRequestPair,
  resetRequestDraft,
  runSimulation,
} = useMockStudioContext()

type QuickHintTone = 'neutral' | 'success' | 'warning' | 'error'

interface BodyTemplate {
  id: string
  label: string
  value: string
}

const BODY_TEMPLATES: BodyTemplate[] = [
  {
    id: 'status-key',
    label: 'Status Key',
    value: '{\n  "statusKey": "ok"\n}',
  },
  {
    id: 'login-demo',
    label: 'Login Demo',
    value: '{\n  "email": "dev@company.com",\n  "password": "123456",\n  "statusKey": "ok"\n}',
  },
  {
    id: 'pagination-demo',
    label: 'Pagination',
    value: '{\n  "page": 1,\n  "limit": 20,\n  "statusKey": "ok"\n}',
  },
]

const quickHint = ref('Mẹo: chọn status key rồi Apply qua Query/Header/Body để ép response.')
const quickHintTone = ref<QuickHintTone>('neutral')
const quickStatusKey = ref('')
const simulateFeedback = ref<'idle' | 'done'>('idle')

const { start: clearSimulateFeedback } = useTimeoutFn(
  () => {
    simulateFeedback.value = 'idle'
  },
  1400,
  { immediate: false },
)

const availableStatusKeys = computed(() => activeRule.value?.statusMap.map((entry) => entry.key.trim()).filter(Boolean) ?? [])

const quickHintClass = computed(() => {
  if (quickHintTone.value === 'success') {
    return 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky'
  }
  if (quickHintTone.value === 'warning') {
    return 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber'
  }
  if (quickHintTone.value === 'error') {
    return 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral'
  }
  return 'border-border-default bg-bg-deep text-text-secondary'
})

function setQuickHint(message: string, tone: QuickHintTone): void {
  quickHint.value = message
  quickHintTone.value = tone
}

function exampleValueFromExpected(expected: string): string {
  const value = expected.trim()
  if (!value) {
    return 'sample'
  }
  if (value === '*') {
    return 'sample'
  }
  if (value.startsWith('re:')) {
    return 'sample'
  }
  if (value.includes('*')) {
    return value.replace(/\*/g, 'sample')
  }
  return value
}

function suggestEndpointFromPattern(pattern: string): string {
  const normalized = normalizeEndpoint(pattern || '/api/demo')
  if (!normalized.includes('*')) {
    return normalized
  }

  const replaced = normalized.replace(/\*/g, 'demo')
  return replaced.replace(/\/{2,}/g, '/')
}

function upsertRequestPair(section: 'query' | 'headers', key: string, value: string): void {
  const normalizedKey = key.trim().toLowerCase()
  if (!normalizedKey) {
    return
  }

  const list = section === 'query' ? requestDraft.value.query : requestDraft.value.headers
  const matchedIndex = list.findIndex((pair) => pair.key.trim().toLowerCase() === normalizedKey)

  if (matchedIndex >= 0) {
    const matchedPair = list[matchedIndex]
    if (matchedPair) {
      matchedPair.value = value
      return
    }
  }

  list.push(createPair(key, value))
}

function applyJsonPathValue(root: Record<string, JsonValue>, path: string, value: string): boolean {
  const segments = path.split('.').map((segment) => segment.trim()).filter(Boolean)
  if (segments.length === 0) {
    return false
  }

  let cursor: Record<string, JsonValue> = root
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    if (!segment) {
      continue
    }

    const nextValue = cursor[segment]
    if (typeof nextValue !== 'object' || nextValue === null || Array.isArray(nextValue)) {
      cursor[segment] = {}
    }

    cursor = cursor[segment] as Record<string, JsonValue>
  }

  const leaf = segments[segments.length - 1]
  if (!leaf) {
    return false
  }

  cursor[leaf] = value
  return true
}

function applyQuickStatusKey(target: 'query' | 'header' | 'body'): void {
  const rule = activeRule.value
  const selectedKey = quickStatusKey.value.trim()

  if (!rule || !selectedKey) {
    setQuickHint('Chọn rule và status key trước khi áp dụng.', 'warning')
    return
  }

  if (target === 'query') {
    const queryKey = rule.statusSelectorQuery.trim()
    if (!queryKey) {
      setQuickHint('Rule này chưa cấu hình Query key để chọn status.', 'warning')
      return
    }

    upsertRequestPair('query', queryKey, selectedKey)
    setQuickHint(`Đã set query ${queryKey}=${selectedKey}.`, 'success')
    runSimulation()
    return
  }

  if (target === 'header') {
    const headerKey = rule.statusSelectorHeader.trim()
    if (!headerKey) {
      setQuickHint('Rule này chưa cấu hình Header key để chọn status.', 'warning')
      return
    }

    upsertRequestPair('headers', headerKey, selectedKey)
    setQuickHint(`Đã set header ${headerKey}: ${selectedKey}.`, 'success')
    runSimulation()
    return
  }

  const bodyPath = rule.statusSelectorBodyPath.trim()
  if (!bodyPath) {
    setQuickHint('Rule này chưa cấu hình Body path để chọn status.', 'warning')
    return
  }

  const parsed = safeParseJson(requestDraft.value.body)
  let payload: Record<string, JsonValue> = {}

  if (parsed.ok && typeof parsed.value === 'object' && parsed.value !== null && !Array.isArray(parsed.value)) {
    payload = { ...(parsed.value as Record<string, JsonValue>) }
  }

  const hasApplied = applyJsonPathValue(payload, bodyPath, selectedKey)
  if (!hasApplied) {
    setQuickHint('Body path không hợp lệ để set status key.', 'error')
    return
  }

  requestDraft.value.body = JSON.stringify(payload, null, 2)
  setQuickHint(`Đã set body path ${bodyPath}=${selectedKey}.`, 'success')
  runSimulation()
}

function applyActiveRulePreset(): void {
  const rule = activeRule.value
  if (!rule) {
    setQuickHint('Chưa có rule đang chọn.', 'warning')
    return
  }

  if (rule.method !== 'ANY') {
    requestDraft.value.method = rule.method
  }

  requestDraft.value.endpoint = suggestEndpointFromPattern(rule.endpointPattern)

  for (const matcher of rule.queryMatchers) {
    const key = matcher.key.trim()
    if (!key) {
      continue
    }
    upsertRequestPair('query', key, exampleValueFromExpected(matcher.expected))
  }

  for (const matcher of rule.headerMatchers) {
    const key = matcher.key.trim()
    if (!key) {
      continue
    }
    upsertRequestPair('headers', key, exampleValueFromExpected(matcher.expected))
  }

  const parsed = safeParseJson(requestDraft.value.body)
  let payload: Record<string, JsonValue> = {}
  if (parsed.ok && typeof parsed.value === 'object' && parsed.value !== null && !Array.isArray(parsed.value)) {
    payload = { ...(parsed.value as Record<string, JsonValue>) }
  }

  for (const matcher of rule.bodyMatchers) {
    const path = matcher.path.trim()
    if (!path) {
      continue
    }
    applyJsonPathValue(payload, path, exampleValueFromExpected(matcher.expected))
  }

  if (rule.statusSelectorQuery.trim()) {
    upsertRequestPair('query', rule.statusSelectorQuery.trim(), rule.defaultStatusKey)
  }

  if (rule.statusSelectorHeader.trim()) {
    upsertRequestPair('headers', rule.statusSelectorHeader.trim(), rule.defaultStatusKey)
  }

  if (rule.statusSelectorBodyPath.trim()) {
    applyJsonPathValue(payload, rule.statusSelectorBodyPath.trim(), rule.defaultStatusKey)
  }

  requestDraft.value.body = JSON.stringify(payload, null, 2)
  quickStatusKey.value = rule.defaultStatusKey
  setQuickHint('Đã nạp request mẫu theo rule đang chọn. Có thể bấm Simulate ngay.', 'success')
  runSimulation()
}

function handleSimulateResponse(): void {
  runSimulation()
  simulateFeedback.value = 'done'
  clearSimulateFeedback()
}

watch(
  [
    () => activeRule.value?.id,
    () => activeRule.value?.defaultStatusKey,
    () => availableStatusKeys.value.join(','),
  ],
  () => {
    if (availableStatusKeys.value.length === 0) {
      quickStatusKey.value = ''
      return
    }

    if (!availableStatusKeys.value.includes(quickStatusKey.value)) {
      quickStatusKey.value = activeRule.value?.defaultStatusKey || availableStatusKeys.value[0] || ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-5 animate-fade-up animate-delay-2">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="font-display text-xl font-semibold"><span class="mr-2 text-accent-coral">//</span>Request Simulator</h2>
      <button
        type="button"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
        @click="resetRequestDraft"
      >
        <Icon icon="lucide:rotate-ccw" class="size-3.5" />
        Reset
      </button>
    </div>

    <div class="grid gap-3 md:grid-cols-[160px_1fr]">
      <label class="space-y-1">
        <span class="font-display text-xs tracking-wide text-text-secondary">Method</span>
        <select
          v-model="requestDraft.method"
          class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
        >
          <option v-for="method in REQUEST_METHODS" :key="method" :value="method">{{ method }}</option>
        </select>
      </label>
      <label class="space-y-1">
        <span class="font-display text-xs tracking-wide text-text-secondary">Endpoint</span>
        <input
          v-model="requestDraft.endpoint"
          class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
          placeholder="/api/tasks"
        />
      </label>
    </div>

    <div v-if="activeRule && availableStatusKeys.length > 0" class="mt-3 space-y-2 border border-border-default bg-bg-deep p-3">
      <p class="font-display text-xs tracking-wide text-text-secondary">Quick Custom Response</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 border border-accent-sky/60 bg-accent-sky/10 px-2 py-1 text-xs text-accent-sky hover:border-accent-sky"
          @click="applyActiveRulePreset"
        >
          <Icon icon="lucide:wand-sparkles" class="size-3.5" />
          Dùng request mẫu theo rule hiện tại
        </button>
      </div>
      <div class="grid gap-2 lg:grid-cols-[200px_1fr]">
        <select
          v-model="quickStatusKey"
          class="border border-border-default bg-bg-surface px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none"
        >
          <option v-for="statusKey in availableStatusKeys" :key="statusKey" :value="statusKey">
            {{ statusKey }}
          </option>
        </select>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!activeRule.statusSelectorQuery.trim()"
            @click="applyQuickStatusKey('query')"
          >
            Apply qua Query {{ activeRule.statusSelectorQuery ? `(${activeRule.statusSelectorQuery})` : '' }}
          </button>
          <button
            type="button"
            class="border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!activeRule.statusSelectorHeader.trim()"
            @click="applyQuickStatusKey('header')"
          >
            Apply qua Header {{ activeRule.statusSelectorHeader ? `(${activeRule.statusSelectorHeader})` : '' }}
          </button>
          <button
            type="button"
            class="border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!activeRule.statusSelectorBodyPath.trim()"
            @click="applyQuickStatusKey('body')"
          >
            Apply qua Body {{ activeRule.statusSelectorBodyPath ? `(${activeRule.statusSelectorBodyPath})` : '' }}
          </button>
        </div>
      </div>
      <p class="text-[11px] text-text-dim">
        Chọn status key ở đây để ép response theo Status Map, không cần nhập thủ công vào query/header/body.
      </p>
      <p class="border px-3 py-2 text-xs" :class="quickHintClass">
        {{ quickHint }}
      </p>
    </div>

    <div class="mt-4 space-y-4">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="font-display text-xs tracking-wide text-text-secondary">Query Params</p>
          <button
            type="button"
            class="inline-flex items-center gap-1 border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary"
            @click="addRequestPair('query')"
          >
            <Icon icon="lucide:plus" class="size-3" />
            Add
          </button>
        </div>
        <div
          v-for="pair in requestDraft.query"
          :key="pair.id"
          class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input v-model="pair.key" class="border border-border-default bg-bg-deep px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none" placeholder="key" />
          <input v-model="pair.value" class="border border-border-default bg-bg-deep px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none" placeholder="value" />
          <button
            type="button"
            class="border border-border-default px-2 text-text-secondary hover:border-accent-coral hover:text-text-primary"
            @click="removeRequestPair('query', pair.id)"
          >
            <Icon icon="lucide:trash-2" class="size-4" />
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="font-display text-xs tracking-wide text-text-secondary">Headers</p>
          <button
            type="button"
            class="inline-flex items-center gap-1 border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary"
            @click="addRequestPair('headers')"
          >
            <Icon icon="lucide:plus" class="size-3" />
            Add
          </button>
        </div>
        <div
          v-for="pair in requestDraft.headers"
          :key="pair.id"
          class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input v-model="pair.key" class="border border-border-default bg-bg-deep px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none" placeholder="header-name" />
          <input v-model="pair.value" class="border border-border-default bg-bg-deep px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none" placeholder="header-value" />
          <button
            type="button"
            class="border border-border-default px-2 text-text-secondary hover:border-accent-coral hover:text-text-primary"
            @click="removeRequestPair('headers', pair.id)"
          >
            <Icon icon="lucide:trash-2" class="size-4" />
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <JsonPayloadBuilder
          v-model="requestDraft.body"
          title="Body Payload"
          helper-text="Dùng template hoặc form builder nếu bạn không muốn gõ JSON thủ công."
          :editor-rows="8"
          :templates="BODY_TEMPLATES"
          default-field-key="statusKey"
          default-field-value="ok"
        />
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 border px-4 py-2 font-display text-xs tracking-wide text-bg-deep transition"
        :class="
          simulateFeedback === 'done'
            ? 'border-accent-sky bg-accent-sky hover:bg-accent-sky/85'
            : 'border-accent-coral bg-accent-coral hover:bg-accent-coral/85'
        "
        @click="handleSimulateResponse"
      >
        <Icon :icon="simulateFeedback === 'done' ? 'lucide:check' : 'lucide:play'" class="size-3.5" />
        {{ simulateFeedback === 'done' ? 'Simulated' : 'Simulate Response' }}
      </button>
      <p class="text-xs text-text-secondary">Status key ưu tiên: Header → Query → Body path → Default key.</p>
    </div>

    <p
      v-if="engineError"
      class="mt-3 border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-xs text-accent-amber"
    >
      {{ engineError }}
    </p>
  </article>
</template>
