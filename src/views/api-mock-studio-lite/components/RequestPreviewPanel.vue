<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useClipboard, useTimeoutFn } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useMockStudioContext } from '../composables/useMockStudioContext'
import { normalizeHostBasePath } from '../utils/host-runtime'
import { normalizeEndpoint } from '../utils/mock-engine'

const {
  requestDraft,
  browserHostEnabled,
  browserHostBasePath,
  browserHostBaseUrl,
} = useMockStudioContext()

interface FetchPreviewOptions {
  baseOrigin?: string
  basePath?: string
}

const copiedVariant = ref<'request' | 'browser' | ''>('')

const { copy } = useClipboard()
const { start: clearCopiedVariant } = useTimeoutFn(
  () => {
    copiedVariant.value = ''
  },
  1200,
  { immediate: false },
)

const pageOrigin = computed(() => (typeof window === 'undefined' ? 'https://mock.local' : window.location.origin))

function normalizeFetchBasePath(rawPath: string | undefined): string {
  const value = (rawPath ?? '').trim()
  if (!value) {
    return ''
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  const noTrailingSlash = withLeadingSlash.replace(/\/+$/g, '')
  return noTrailingSlash === '/' ? '' : noTrailingSlash
}

function buildFetchPreview(options: FetchPreviewOptions = {}): string {
  const endpoint = normalizeEndpoint(requestDraft.value.endpoint)
  const queryEntries = requestDraft.value.query
    .map((pair) => ({ key: pair.key.trim(), value: pair.value.trim() }))
    .filter((pair) => pair.key)
  const queryString = queryEntries
    .map((pair) => `${encodeURIComponent(pair.key)}=${encodeURIComponent(pair.value)}`)
    .join('&')

  const baseOrigin = options.baseOrigin?.trim() || ''
  const basePath = normalizeFetchBasePath(options.basePath)
  const url = `${baseOrigin}${basePath}${endpoint}${queryString ? `?${queryString}` : ''}`

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

const fetchPreview = computed(() => buildFetchPreview())

const browserHostFetchPreview = computed(() =>
  buildFetchPreview({
    baseOrigin: pageOrigin.value,
    basePath: normalizeHostBasePath(browserHostBasePath.value, '/api-mock-studio-lite/mock'),
  }),
)

const hasDifferentHostPreview = computed(() => browserHostFetchPreview.value !== fetchPreview.value)

async function copyRequestFetch(): Promise<void> {
  await copy(fetchPreview.value)
  copiedVariant.value = 'request'
  clearCopiedVariant()
}

async function copyBrowserFetch(): Promise<void> {
  await copy(browserHostFetchPreview.value)
  copiedVariant.value = 'browser'
  clearCopiedVariant()
}
</script>

<template>
  <article class="space-y-4 border border-border-default bg-bg-surface p-5 animate-fade-up animate-delay-4">
    <h2 class="font-display text-xl font-semibold"><span class="mr-2 text-accent-sky">//</span>Request Preview</h2>

    <div class="border border-border-default bg-bg-deep px-3 py-2 text-[11px] text-text-secondary">
      Đây là lệnh fetch theo request draft gốc (raw endpoint), dùng để kiểm tra payload trước khi đi qua host intercept.
    </div>

    <p class="font-display text-xs tracking-wide text-text-secondary">Draft fetch (raw endpoint)</p>
    <pre class="overflow-x-auto border border-border-default bg-bg-deep p-3 font-mono text-xs text-text-secondary">{{ fetchPreview }}</pre>
    <button
      type="button"
      class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-sky hover:text-text-primary"
      @click="copyRequestFetch"
    >
      <Icon icon="lucide:copy" class="size-3.5" />
      {{ copiedVariant === 'request' ? 'Copied' : 'Copy draft fetch' }}
    </button>

    <div v-if="browserHostEnabled && hasDifferentHostPreview" class="space-y-2 border border-accent-sky/40 bg-accent-sky/10 p-3">
      <p class="font-display text-xs tracking-wide text-text-secondary">Host fetch (intercept path)</p>
      <code class="block overflow-x-auto border border-border-default bg-bg-surface px-2 py-1 font-mono text-xs text-text-primary">{{ browserHostBaseUrl }}</code>
      <pre class="overflow-x-auto border border-border-default bg-bg-surface p-3 font-mono text-xs text-text-secondary">{{ browserHostFetchPreview }}</pre>
      <button
        type="button"
        class="inline-flex items-center gap-2 border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-sky hover:text-text-primary"
        @click="copyBrowserFetch"
      >
        <Icon icon="lucide:copy" class="size-3.5" />
        {{ copiedVariant === 'browser' ? 'Copied' : 'Copy host fetch' }}
      </button>
    </div>

    <div
      v-else-if="browserHostEnabled"
      class="border border-border-default bg-bg-deep px-3 py-2 text-[11px] text-text-dim"
    >
      Request draft hiện tại đã là intercept path nên block Host fetch không cần hiển thị thêm.
    </div>
  </article>
</template>
