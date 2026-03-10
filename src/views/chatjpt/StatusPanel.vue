<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type EndpointCatalog = {
  apiEndpoints?: Array<{
    id?: string
    name?: string
    url?: string
  }>
}

type EndpointStatus = 'online' | 'offline'

type EndpointNode = {
  id: string
  name: string
  url: string
}

type EndpointRuntime = EndpointNode & {
  status: EndpointStatus
  latencyMs: number | null
  error: string | null
}

const ENDPOINTS_SOURCE_URL =
  (import.meta.env.VITE_ENDPOINTS_API_URL as string | undefined)?.trim() ||
  'https://chatjpt.rina.work/api/endpoints'
const CHAT_API_ENDPOINT =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined)?.trim() ||
  'https://chatjpt.rina.work/api/chat'
const API_AUTH_TOKEN = (import.meta.env.VITE_API_AUTH_TOKEN as string | undefined)?.trim() || ''

const loadingNodes = ref<boolean>(false)
const errorText = ref<string>('')
const lastUpdated = ref<string>('')
const nodes = ref<EndpointRuntime[]>([])
let refreshTimer: number | null = null
const HEALTH_CHECK_INTERVAL_MS = 300000

const onlineCount = computed<number>(
  () => nodes.value.filter((node) => node.status === 'online').length,
)
const offlineCount = computed<number>(
  () => nodes.value.filter((node) => node.status === 'offline').length,
)

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatLatency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  return `${value} ms`
}

function toAbsoluteUrl(inputUrl: string): string {
  try {
    return new URL(inputUrl, window.location.origin).toString()
  } catch {
    return inputUrl
  }
}

function toHealthUrl(endpointUrl: string): string {
  try {
    const url = new URL(endpointUrl, window.location.origin)
    if (url.pathname.endsWith('/api/chat')) {
      url.pathname = url.pathname.replace(/\/api\/chat$/, '/health')
    } else if (url.pathname.endsWith('/')) {
      url.pathname = `${url.pathname}health`
    } else {
      url.pathname = `${url.pathname}/health`
    }
    return url.toString()
  } catch {
    return endpointUrl
  }
}

function authHeaders(): Record<string, string> {
  if (!API_AUTH_TOKEN) return {}
  return {
    Authorization: `Bearer ${API_AUTH_TOKEN}`,
    'x-api-key': API_AUTH_TOKEN,
  }
}

function parseApiEndpoints(input: unknown): EndpointNode[] {
  if (typeof input !== 'object' || input === null) return []
  const payload = input as EndpointCatalog
  const rows = Array.isArray(payload.apiEndpoints) ? payload.apiEndpoints : []
  return rows
    .map((row, index): EndpointNode | null => {
      const url = typeof row.url === 'string' ? row.url.trim() : ''
      if (!url) return null
      const id =
        typeof row.id === 'string' && row.id.trim().length > 0
          ? row.id.trim()
          : `endpoint-${index + 1}`
      const name =
        typeof row.name === 'string' && row.name.trim().length > 0
          ? row.name.trim()
          : `API Endpoint ${index + 1}`
      return { id, name, url: toAbsoluteUrl(url) }
    })
    .filter((item): item is EndpointNode => item !== null)
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: authHeaders(),
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timer)
  }
}

async function fetchCatalogEndpoints(): Promise<EndpointNode[]> {
  try {
    const res = await fetchJsonWithTimeout(ENDPOINTS_SOURCE_URL, 6000)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const payload = (await res.json()) as unknown
    const parsed = parseApiEndpoints(payload)
    if (parsed.length > 0) return parsed
  } catch {
    // Fallback below
  }
  return [
    { id: 'active-gateway', name: 'Active API Gateway', url: toAbsoluteUrl(CHAT_API_ENDPOINT) },
  ]
}

async function probeNode(node: EndpointNode): Promise<EndpointRuntime> {
  const healthUrl = toHealthUrl(node.url)
  const startedAt = performance.now()
  try {
    const res = await fetchJsonWithTimeout(healthUrl, 6000)
    const latencyMs = Math.max(1, Math.round(performance.now() - startedAt))
    return {
      ...node,
      status: res.ok ? 'online' : 'offline',
      latencyMs,
      error: res.ok ? null : `HTTP ${res.status}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return {
      ...node,
      status: 'offline',
      latencyMs: null,
      error: message,
    }
  }
}

async function loadNodesStatus(): Promise<void> {
  loadingNodes.value = true
  errorText.value = ''

  try {
    const endpointList = await fetchCatalogEndpoints()
    const results = await Promise.all(endpointList.map((node) => probeNode(node)))
    nodes.value = results
    lastUpdated.value = new Date().toLocaleString('vi-VN')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải danh sách node'
    errorText.value = message
  } finally {
    loadingNodes.value = false
  }
}

onMounted(() => {
  void loadNodesStatus()
  refreshTimer = window.setInterval(() => {
    void loadNodesStatus()
  }, HEALTH_CHECK_INTERVAL_MS)
})

onBeforeUnmount(() => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer)
  }
})
</script>

<template>
  <section
    class="mt-5 animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 sm:p-6"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-display text-sm tracking-widest text-accent-sky">// NODE STATUS</p>
        <h2 class="mt-2 font-display text-2xl font-semibold sm:text-3xl">Available API Nodes</h2>
      </div>
      <button
        type="button"
        class="inline-flex items-center border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loadingNodes"
        @click="loadNodesStatus"
      >
        {{ loadingNodes ? 'Đang tải...' : 'Làm mới' }}
      </button>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <article class="border border-border-default bg-bg-deep p-4">
        <p class="text-xs tracking-widest text-text-dim">ONLINE</p>
        <p class="mt-2 font-display text-2xl text-accent-sky">{{ formatNumber(onlineCount) }}</p>
      </article>
      <article class="border border-border-default bg-bg-deep p-4">
        <p class="text-xs tracking-widest text-text-dim">OFFLINE</p>
        <p class="mt-2 font-display text-2xl text-accent-coral">{{ formatNumber(offlineCount) }}</p>
      </article>
      <article class="border border-border-default bg-bg-deep p-4">
        <p class="text-xs tracking-widest text-text-dim">NODE COUNT</p>
        <p class="mt-2 font-display text-2xl">{{ formatNumber(nodes.length) }}</p>
      </article>
    </div>

    <div class="mt-5 overflow-hidden border border-border-default">
      <div
        class="grid grid-cols-12 border-b border-border-default bg-bg-deep px-3 py-2 text-xs tracking-widest text-text-dim"
      >
        <p class="col-span-3">NODE</p>
        <p class="col-span-5">URL</p>
        <p class="col-span-2 text-center">STATUS</p>
        <p class="col-span-2 text-right">LATENCY</p>
      </div>

      <div
        v-for="node in nodes"
        :key="node.id"
        class="grid grid-cols-12 items-center border-b border-border-default bg-bg-surface px-3 py-3 text-sm last:border-b-0"
      >
        <div class="col-span-3">
          <p class="font-display text-text-primary">{{ node.name }}</p>
          <p class="mt-1 text-xs text-text-dim">{{ node.id }}</p>
        </div>
        <div class="col-span-5 pr-2">
          <p class="truncate text-text-secondary">{{ node.url }}</p>
          <p v-if="node.error" class="mt-1 truncate text-xs text-accent-coral">{{ node.error }}</p>
        </div>
        <div class="col-span-2 text-center">
          <span
            class="inline-flex items-center rounded border px-2 py-1 text-xs"
            :class="
              node.status === 'online'
                ? 'border-accent-sky/50 bg-accent-sky/10 text-accent-sky'
                : 'border-accent-coral/50 bg-accent-coral/10 text-accent-coral'
            "
          >
            {{ node.status }}
          </span>
        </div>
        <div class="col-span-2 text-right text-text-secondary">
          {{ formatLatency(node.latencyMs) }}
        </div>
      </div>
    </div>

    <div class="mt-4 border border-border-default bg-bg-deep p-4">
      <p class="text-xs tracking-widest text-text-dim">LAST UPDATED</p>
      <p class="mt-2 text-sm text-text-primary">{{ lastUpdated || 'N/A' }}</p>
    </div>

    <p
      v-if="errorText"
      class="mt-4 border border-accent-coral/40 bg-accent-coral/10 p-3 text-sm text-accent-coral"
    >
      Lỗi tải node status: {{ errorText }}
    </p>
  </section>
</template>
