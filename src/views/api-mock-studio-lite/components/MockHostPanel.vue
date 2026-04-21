<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useClipboard, useEventListener, useTimeoutFn, watchDebounced } from '@vueuse/core'
import { computed, onMounted, ref, toRaw } from 'vue'

import { useMockStudioContext } from '../composables/useMockStudioContext'
import type { MockRule } from '../types'
import {
  DEFAULT_BROWSER_BASE_PATH,
  normalizeHostBasePath,
} from '../utils/host-runtime'
import { normalizeEndpoint } from '../utils/mock-engine'

type HostHintTone = 'neutral' | 'success' | 'warning' | 'error'

interface ConfigureReply {
  type?: string
}

interface ConfigureResult {
  synced: boolean
  errorMessage: string
}

interface HealthReply {
  enabled: boolean
  basePath: string
  rulesCount: number
}

const HOST_SW_URL = '/api-mock-studio-lite/mock-host-sw.js'
const HOST_SW_SCOPE = '/api-mock-studio-lite/'
const HOST_SW_FILE_NAME = 'mock-host-sw.js'
const WORKER_BOOT_TIMEOUT_MS = 1400

const {
  rules,
  requestDraft,
  browserHostEnabled,
  browserHostBasePath,
  browserHostBaseUrl,
} = useMockStudioContext()

const { copy } = useClipboard()

const copiedTarget = ref<'base-url' | 'fetch' | ''>('')
const isSyncing = ref(false)
const isResetting = ref(false)
const syncFeedback = ref<'idle' | 'success' | 'error'>('idle')
const hintText = ref('Bật Host để tạo endpoint mock thật trên trình duyệt.')
const hintTone = ref<HostHintTone>('neutral')
const swControllerReady = ref(false)

const { start: clearCopiedState } = useTimeoutFn(
  () => {
    copiedTarget.value = ''
  },
  1200,
  { immediate: false },
)

const { start: clearSyncFeedback } = useTimeoutFn(
  () => {
    syncFeedback.value = 'idle'
  },
  1400,
  { immediate: false },
)

const serviceWorkerSupported = computed(() => typeof window !== 'undefined' && 'serviceWorker' in navigator)
const isBusy = computed(() => isSyncing.value || isResetting.value)

const syncButtonLabel = computed(() => {
  if (isSyncing.value) {
    return 'Syncing...'
  }
  if (syncFeedback.value === 'success') {
    return 'Synced'
  }
  if (syncFeedback.value === 'error') {
    return 'Sync failed'
  }
  return 'Sync rules'
})

const syncButtonIcon = computed(() => {
  if (isSyncing.value) {
    return 'lucide:loader-circle'
  }
  if (syncFeedback.value === 'success') {
    return 'lucide:check'
  }
  if (syncFeedback.value === 'error') {
    return 'lucide:triangle-alert'
  }
  return 'lucide:refresh-cw'
})

const syncButtonClass = computed(() => {
  if (syncFeedback.value === 'success') {
    return 'self-end border border-accent-sky/60 bg-accent-sky/10 px-3 py-2 text-xs text-accent-sky hover:border-accent-sky disabled:opacity-60'
  }
  if (syncFeedback.value === 'error') {
    return 'self-end border border-accent-coral/60 bg-accent-coral/10 px-3 py-2 text-xs text-accent-coral hover:border-accent-coral disabled:opacity-60'
  }
  return 'self-end border border-border-default px-3 py-2 text-xs text-text-secondary hover:border-accent-amber hover:text-text-primary disabled:opacity-60'
})

const hintClass = computed(() => {
  if (hintTone.value === 'success') {
    return 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky'
  }
  if (hintTone.value === 'warning') {
    return 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber'
  }
  if (hintTone.value === 'error') {
    return 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral'
  }
  return 'border-border-default bg-bg-deep text-text-secondary'
})

function buildHostFetchExample(): string {
  const endpoint = normalizeEndpoint(requestDraft.value.endpoint)
  const queryEntries = requestDraft.value.query
    .map((pair) => ({ key: pair.key.trim(), value: pair.value.trim() }))
    .filter((pair) => pair.key)
  const queryString = queryEntries
    .map((pair) => `${encodeURIComponent(pair.key)}=${encodeURIComponent(pair.value)}`)
    .join('&')

  const url = `${browserHostBaseUrl.value}${endpoint}${queryString ? `?${queryString}` : ''}`

  const headerEntries = requestDraft.value.headers
    .map((pair) => ({ key: pair.key.trim(), value: pair.value.trim() }))
    .filter((pair) => pair.key)

  const headerBlock =
    headerEntries.length === 0
      ? '  headers: {},'
      : [
          '  headers: {',
          ...headerEntries.map((header) => `    ${JSON.stringify(header.key)}: ${JSON.stringify(header.value)},`),
          '  },',
        ].join('\n')

  const lines = [`const response = await fetch('${url}', {`, `  method: '${requestDraft.value.method}',`, headerBlock]

  const requestBody = requestDraft.value.body.trim()
  if (requestBody && requestDraft.value.method !== 'GET') {
    lines.push(`  body: ${JSON.stringify(requestBody)},`)
  }

  lines.push('})')
  lines.push("console.log('status', response.status)")
  lines.push("console.log('x-mock-host', response.headers.get('x-mock-host'))")
  lines.push('const bodyText = await response.text()')
  lines.push("console.log('body', bodyText)")

  return lines.join('\n')
}

const hostFetchExample = computed(() => buildHostFetchExample())

const hostToggleLabel = computed(() => (browserHostEnabled.value ? 'Stop Host' : 'Start Host'))
const hostToggleIcon = computed(() => (browserHostEnabled.value ? 'lucide:square' : 'lucide:play'))
const hostToggleClass = computed(() => {
  if (browserHostEnabled.value) {
    return 'self-end border border-accent-coral/60 bg-accent-coral/10 px-3 py-2 text-xs text-accent-coral hover:border-accent-coral disabled:opacity-60'
  }
  return 'self-end border border-accent-sky/60 bg-accent-sky/10 px-3 py-2 text-xs text-accent-sky hover:border-accent-sky disabled:opacity-60'
})

function setHint(message: string, tone: HostHintTone): void {
  hintText.value = message
  hintTone.value = tone
}

function getErrorMessage(error: Error | string | null | undefined): string {
  if (!error) {
    return 'Unknown error'
  }
  if (typeof error === 'string') {
    return error
  }
  return error.message || 'Unknown error'
}

async function registerHostWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!serviceWorkerSupported.value) {
    setHint('Trình duyệt không hỗ trợ Service Worker, không thể host mock endpoint.', 'error')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(HOST_SW_URL, {
      scope: HOST_SW_SCOPE,
    })
    await waitForWorkerBoot(registration)
    swControllerReady.value = Boolean(navigator.serviceWorker.controller)
    return registration
  } catch (error) {
    const message = getErrorMessage(error instanceof Error ? error : String(error))
    setHint(`Đăng ký host worker thất bại: ${message}`, 'error')
    return null
  }
}

function getRegistrationWorker(registration: ServiceWorkerRegistration): ServiceWorker | null {
  return registration.active ?? registration.waiting ?? null
}

function getWorkerScriptUrl(worker: ServiceWorker | null | undefined): string {
  return worker?.scriptURL || ''
}

function isMockHostRegistration(registration: ServiceWorkerRegistration): boolean {
  const scope = registration.scope || ''
  if (scope.includes(HOST_SW_SCOPE)) {
    return true
  }

  return [
    getWorkerScriptUrl(registration.active),
    getWorkerScriptUrl(registration.waiting),
    getWorkerScriptUrl(registration.installing),
  ].some((scriptUrl) => scriptUrl.includes(`/${HOST_SW_FILE_NAME}`))
}

async function waitForWorkerBoot(registration: ServiceWorkerRegistration): Promise<void> {
  const availableWorker = getRegistrationWorker(registration)
  if (!availableWorker) {
    return
  }

  if (availableWorker.state === 'activated') {
    return
  }

  await new Promise<void>((resolve) => {
    const timeoutId = setTimeout(resolve, WORKER_BOOT_TIMEOUT_MS)

    const handleStateChange = () => {
      if (availableWorker.state === 'activated' || availableWorker.state === 'redundant') {
        clearTimeout(timeoutId)
        availableWorker.removeEventListener('statechange', handleStateChange)
        resolve()
      }
    }

    availableWorker.addEventListener('statechange', handleStateChange)
  })
}

function buildRulesSnapshot(): MockRule[] {
  const rawRules = toRaw(rules.value)
  if (typeof structuredClone === 'function') {
    return structuredClone(rawRules) as MockRule[]
  }
  return JSON.parse(JSON.stringify(rawRules)) as MockRule[]
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function sendWorkerConfig(registration: ServiceWorkerRegistration, rulesSnapshot: MockRule[]): Promise<ConfigureResult> {
  const worker = getRegistrationWorker(registration)
  if (!worker) {
    return {
      synced: false,
      errorMessage: '',
    }
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const timeoutId = setTimeout(
      () =>
        resolve({
          synced: false,
          errorMessage: '',
        }),
      1200,
    )

    channel.port1.onmessage = (event: MessageEvent<ConfigureReply>) => {
      clearTimeout(timeoutId)
      resolve({
        synced: event.data?.type === 'configured',
        errorMessage: '',
      })
    }

    try {
      worker.postMessage(
        {
          type: 'configure',
          payload: {
            enabled: browserHostEnabled.value,
            basePath: normalizeHostBasePath(browserHostBasePath.value, DEFAULT_BROWSER_BASE_PATH),
            rules: rulesSnapshot,
          },
        },
        [channel.port2],
      )
    } catch (error) {
      clearTimeout(timeoutId)
      resolve({
        synced: false,
        errorMessage: getErrorMessage(error instanceof Error ? error : String(error)),
      })
    }
  })
}

async function syncHostConfig(showHint = false): Promise<boolean> {
  if (!serviceWorkerSupported.value) {
    return false
  }

  isSyncing.value = true
  browserHostBasePath.value = normalizeHostBasePath(browserHostBasePath.value, DEFAULT_BROWSER_BASE_PATH)

  const registration = await registerHostWorker()
  if (!registration) {
    isSyncing.value = false
    return false
  }

  let rulesSnapshot: MockRule[]
  try {
    rulesSnapshot = buildRulesSnapshot()
  } catch (error) {
    const message = getErrorMessage(error instanceof Error ? error : String(error))
    setHint(`Không thể đồng bộ rules: ${message}`, 'error')
    isSyncing.value = false
    return false
  }

  let syncResult = await sendWorkerConfig(registration, rulesSnapshot)
  if (!syncResult.synced && !syncResult.errorMessage) {
    await waitFor(320)
    syncResult = await sendWorkerConfig(registration, rulesSnapshot)
  }
  swControllerReady.value = Boolean(navigator.serviceWorker.controller)

  if (!syncResult.synced) {
    if (showHint) {
      if (syncResult.errorMessage) {
        setHint(`Sync host thất bại: ${syncResult.errorMessage}`, 'error')
      } else {
        setHint('Host worker đang khởi động, thử Sync lại sau 1 giây.', 'warning')
      }
    }
    isSyncing.value = false
    return false
  }

  if (!browserHostEnabled.value) {
    if (showHint) {
      setHint('Mock Host đã tắt.', 'neutral')
    }
    isSyncing.value = false
    return true
  }

  if (showHint) {
    if (swControllerReady.value) {
      setHint(`Mock Host đang chạy tại ${browserHostBaseUrl.value}`, 'success')
    } else {
      setHint('Mock Host đã bật, nếu chưa intercept request thì reload trang một lần.', 'warning')
    }
  }

  isSyncing.value = false
  return true
}

async function startHost(): Promise<void> {
  browserHostEnabled.value = true
  await syncHostConfig(true)
}

async function stopHost(): Promise<void> {
  browserHostEnabled.value = false
  await syncHostConfig(true)
}

async function toggleHost(): Promise<void> {
  if (browserHostEnabled.value) {
    await stopHost()
    return
  }
  await startHost()
}

async function handleSyncRulesClick(): Promise<void> {
  syncFeedback.value = 'idle'
  const synced = await syncHostConfig(true)
  syncFeedback.value = synced ? 'success' : 'error'
  clearSyncFeedback()
}

async function resetWorker(): Promise<void> {
  if (!serviceWorkerSupported.value) {
    setHint('Trình duyệt không hỗ trợ Service Worker, không thể reset.', 'error')
    return
  }

  const shouldRestartHost = browserHostEnabled.value
  isResetting.value = true

  try {
    browserHostEnabled.value = false

    const registrations = await navigator.serviceWorker.getRegistrations()
    const targetRegistrations = registrations.filter((registration) => isMockHostRegistration(registration))

    if (targetRegistrations.length > 0) {
      await Promise.all(targetRegistrations.map((registration) => registration.unregister()))
    }

    swControllerReady.value = false
    await waitFor(180)

    browserHostEnabled.value = shouldRestartHost
    await syncHostConfig(true)
  } catch (error) {
    const message = getErrorMessage(error instanceof Error ? error : String(error))
    setHint(`Reset worker thất bại: ${message}`, 'error')
  } finally {
    isResetting.value = false
  }
}

async function copyBaseUrl(): Promise<void> {
  await copy(browserHostBaseUrl.value)
  copiedTarget.value = 'base-url'
  clearCopiedState()
  setHint('Đã copy Base URL.', 'success')
}

async function copyHostFetch(): Promise<void> {
  await copy(hostFetchExample.value)
  copiedTarget.value = 'fetch'
  clearCopiedState()
  setHint('Đã copy fetch local test. Dán vào DevTools Console của tab hiện tại.', 'success')
}

async function healthCheck(): Promise<void> {
  try {
    const response = await fetch(`${browserHostBaseUrl.value}/__health`, {
      method: 'GET',
      headers: {
        'x-mock-health': '1',
      },
    })

    const marker = response.headers.get('x-mock-host')
    if (marker !== 'api-mock-studio-lite') {
      setHint('Request chưa đi qua Mock Host. Hãy bật host hoặc reload trang.', 'warning')
      return
    }

    const payload = (await response.json()) as HealthReply
    setHint(`Health OK: ${payload.rulesCount} rule(s), base path ${payload.basePath}`, 'success')
  } catch (error) {
    const message = getErrorMessage(error instanceof Error ? error : String(error))
    setHint(`Health check thất bại: ${message}`, 'error')
  }
}

watchDebounced(
  () => rules.value,
  () => {
    if (!browserHostEnabled.value) {
      return
    }
    void syncHostConfig(false)
  },
  {
    debounce: 420,
    deep: true,
    maxWait: 1200,
  },
)

watchDebounced(
  () => browserHostBasePath.value,
  () => {
    if (!browserHostEnabled.value) {
      return
    }
    void syncHostConfig(false)
  },
  {
    debounce: 300,
    maxWait: 900,
  },
)

onMounted(() => {
  if (!serviceWorkerSupported.value) {
    setHint('Trình duyệt hiện tại không hỗ trợ Service Worker.', 'error')
    return
  }

  swControllerReady.value = Boolean(navigator.serviceWorker.controller)

  useEventListener(navigator.serviceWorker, 'controllerchange', () => {
    swControllerReady.value = Boolean(navigator.serviceWorker.controller)
  })

  void syncHostConfig(false)
})
</script>

<template>
  <section class="space-y-4 border border-border-default bg-bg-surface p-5 animate-fade-up animate-delay-2">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="mr-auto font-display text-lg font-semibold text-text-primary">
        <span class="mr-2 text-accent-coral">//</span>
        Mock Host
      </h2>
      <span
        class="border px-2.5 py-1 text-[11px] font-display tracking-wide"
        :class="
          browserHostEnabled
            ? 'border-accent-sky/50 bg-accent-sky/10 text-accent-sky'
            : 'border-border-default bg-bg-deep text-text-dim'
        "
      >
        {{ browserHostEnabled ? 'RUNNING' : 'STOPPED' }}
      </span>
      <span
        class="border px-2.5 py-1 text-[11px] font-display tracking-wide"
        :class="
          swControllerReady
            ? 'border-accent-sky/50 bg-accent-sky/10 text-accent-sky'
            : 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber'
        "
      >
        {{ swControllerReady ? 'SW READY' : 'SW WAIT' }}
      </span>
    </div>

    <p class="text-xs text-text-secondary">
      Chế độ local-only: mock endpoint chạy trực tiếp trong browser bằng Service Worker, phù hợp để test nhanh frontend.
    </p>

    <div class="border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-[11px] text-accent-amber">
      Đã tắt toàn bộ luồng public URL. Mock host này chỉ hoạt động trong cùng origin của trang hiện tại.
    </div>

    <div class="grid gap-2 border border-border-default bg-bg-deep p-3 md:grid-cols-3">
      <article class="space-y-1 border border-border-default bg-bg-surface p-2.5">
        <p class="inline-flex items-center gap-1.5 font-display text-[11px] tracking-wide text-accent-coral">
          <Icon icon="lucide:pen-line" class="size-3.5" />
          Bước 1: Tạo request
        </p>
        <p class="text-[11px] text-text-secondary">
          Nhập Method, Endpoint, Query, Header ở khu Request Simulator.
        </p>
      </article>

      <article class="space-y-1 border border-border-default bg-bg-surface p-2.5">
        <p class="inline-flex items-center gap-1.5 font-display text-[11px] tracking-wide text-accent-amber">
          <Icon icon="lucide:filter" class="size-3.5" />
          Bước 2: Chọn rule
        </p>
        <p class="text-[11px] text-text-secondary">
          Rule đầu tiên khớp trong Rulebook sẽ quyết định response trả về.
        </p>
      </article>

      <article class="space-y-1 border border-border-default bg-bg-surface p-2.5">
        <p class="inline-flex items-center gap-1.5 font-display text-[11px] tracking-wide text-accent-sky">
          <Icon icon="lucide:send" class="size-3.5" />
          Bước 3: Simulate / Host
        </p>
        <p class="text-[11px] text-text-secondary">
          Bấm Simulate để xem preview, rồi Start Host để test bằng fetch trong tab browser hiện tại.
        </p>
      </article>
    </div>

    <div class="grid gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
      <label class="space-y-1">
        <span class="font-display text-[11px] tracking-wide text-text-secondary">Base Path</span>
        <input
          v-model="browserHostBasePath"
          class="w-full border border-border-default bg-bg-deep px-3 py-2 text-sm focus:border-accent-coral focus:outline-none"
          placeholder="/api-mock-studio-lite/mock"
        />
      </label>

      <button
        type="button"
        :class="hostToggleClass"
        :disabled="!serviceWorkerSupported || isBusy"
        @click="toggleHost"
      >
        <span class="inline-flex items-center gap-1.5">
          <Icon :icon="hostToggleIcon" class="size-3.5" />
          {{ hostToggleLabel }}
        </span>
      </button>

      <button
        type="button"
        :class="syncButtonClass"
        :disabled="!serviceWorkerSupported || isBusy"
        @click="handleSyncRulesClick"
      >
        <span class="inline-flex items-center gap-1.5">
          <Icon :icon="syncButtonIcon" class="size-3.5" :class="{ 'animate-spin': isSyncing }" />
          {{ syncButtonLabel }}
        </span>
      </button>

      <button
        type="button"
        class="self-end border border-border-default px-3 py-2 text-xs text-text-secondary hover:border-accent-coral hover:text-text-primary disabled:opacity-60"
        :disabled="!serviceWorkerSupported || isBusy"
        @click="resetWorker"
      >
        <span class="inline-flex items-center gap-1.5">
          <Icon icon="lucide:rotate-ccw" class="size-3.5" />
          Reset Worker
        </span>
      </button>

      <button
        type="button"
        class="self-end border border-border-default px-3 py-2 text-xs text-text-secondary hover:border-accent-sky hover:text-text-primary disabled:opacity-60"
        :disabled="isBusy"
        @click="healthCheck"
      >
        <span class="inline-flex items-center gap-1.5">
          <Icon icon="lucide:heart-pulse" class="size-3.5" />
          Health
        </span>
      </button>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <div class="space-y-2 border border-accent-sky/40 bg-accent-sky/10 p-3">
        <div class="flex items-center justify-between gap-2">
          <p class="font-display text-[11px] tracking-wide text-accent-sky">Local Base URL</p>
          <button
            type="button"
            class="inline-flex items-center gap-1 border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-sky hover:text-text-primary"
            @click="copyBaseUrl"
          >
            <Icon icon="lucide:copy" class="size-3.5" />
            {{ copiedTarget === 'base-url' ? 'Copied' : 'Copy URL' }}
          </button>
        </div>
        <code class="block overflow-x-auto border border-border-default bg-bg-surface px-2 py-1 font-mono text-xs text-text-primary">{{ browserHostBaseUrl }}</code>
        <pre class="overflow-x-auto border border-border-default bg-bg-surface p-2 font-mono text-[11px] text-text-secondary">{{ hostFetchExample }}</pre>
        <button
          type="button"
          class="inline-flex items-center gap-1 border border-border-default px-2 py-1 text-xs text-text-secondary hover:border-accent-sky hover:text-text-primary"
          @click="copyHostFetch"
        >
          <Icon icon="lucide:copy-check" class="size-3.5" />
          {{ copiedTarget === 'fetch' ? 'Copied' : 'Copy fetch local test' }}
        </button>
        <div class="border border-accent-amber/40 bg-accent-amber/10 px-2 py-2 text-[11px] text-accent-amber">
          Lưu ý: lệnh <span class="font-mono">curl</span> chạy trong terminal sẽ không đi qua Service Worker nên thường trả về HTML của Vite.
        </div>
      </div>

      <div class="space-y-2 border border-border-default bg-bg-deep p-3">
        <p class="font-display text-[11px] tracking-wide text-text-secondary">Workflow đề xuất (local)</p>
        <ol class="space-y-1 text-[11px] text-text-secondary">
          <li>1. Bấm Start Host để bật interceptor.</li>
          <li>2. Bấm Sync rules sau khi chỉnh Rulebook.</li>
          <li>3. Test bằng fetch trong DevTools Console của tab đang mở app, sau đó dùng Health để xác nhận.</li>
        </ol>
        <div class="border border-border-default bg-bg-surface px-2 py-2 text-[11px] text-text-dim">
          Mẹo: nếu status vẫn là SW WAIT, hãy reload trang một lần để Service Worker lấy quyền intercept.
        </div>
      </div>
    </div>

    <p class="border px-3 py-2 text-xs" :class="hintClass">
      {{ hintText }}
    </p>
  </section>
</template>