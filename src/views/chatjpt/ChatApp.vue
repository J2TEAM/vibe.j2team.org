<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: number
  role: ChatRole
  content: string
  time: string
}

type JsonChatResponse = {
  response?: string
  result?: {
    response?: string
  }
}

type ModelOption = {
  id: string
  label: string
  provider: string
  contextWindow: string
  contextWindowTokens: number
  featured: boolean
}

type ChatSession = {
  id: string
  title: string
  model: string
  messages: ChatMessage[]
  updatedAt: number
}

const CHAT_API_ENDPOINT =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined)?.trim() ||
  'https://chatjpt.rina.work/api/chat'
const CHAT_STORAGE_KEY = 'chatjpt:chat-sessions:v1'
const MODELS_SOURCE_URL =
  (import.meta.env.VITE_MODELS_API_URL as string | undefined)?.trim() ||
  'https://chatjpt.rina.work/api/models'
const API_AUTH_TOKEN = (import.meta.env.VITE_API_AUTH_TOKEN as string | undefined)?.trim() || ''

const fallbackModelOptions: ModelOption[] = [
  {
    id: '@cf/openai/gpt-oss-120b',
    label: 'GPT-OSS 120B',
    provider: 'openai',
    contextWindow: '128K tokens',
    contextWindowTokens: 128000,
    featured: true,
  },
  {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    label: 'Llama 3.3 70B FP8 Fast',
    provider: 'meta',
    contextWindow: '128K tokens',
    contextWindowTokens: 128000,
    featured: true,
  },
  {
    id: '@cf/meta/llama-4-scout-17b-16e-instruct',
    label: 'Llama 4 Scout 17B 16E',
    provider: 'meta',
    contextWindow: '128K tokens',
    contextWindowTokens: 128000,
    featured: true,
  },
  {
    id: '@cf/google/gemma-3-12b-it',
    label: 'Gemma 3 12B IT',
    provider: 'google',
    contextWindow: '128K tokens',
    contextWindowTokens: 128000,
    featured: false,
  },
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    label: 'DeepSeek R1 Distill Qwen 32B',
    provider: 'deepseek-ai',
    contextWindow: '128K tokens',
    contextWindowTokens: 128000,
    featured: false,
  },
  {
    id: '@cf/qwen/qwen3-30b-a3b-fp8',
    label: 'Qwen3 30B A3B FP8',
    provider: 'qwen',
    contextWindow: '128K tokens',
    contextWindowTokens: 128000,
    featured: false,
  },
  {
    id: '@cf/qwen/qwq-32b',
    label: 'QwQ 32B',
    provider: 'qwen',
    contextWindow: '128K tokens',
    contextWindowTokens: 128000,
    featured: false,
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.1',
    label: 'Mistral 7B Instruct v0.1',
    provider: 'mistral',
    contextWindow: '32K tokens',
    contextWindowTokens: 32000,
    featured: true,
  },
]

const modelOptions = ref<ModelOption[]>([...fallbackModelOptions])
const modelsLoadError = ref<string>('')
const defaultModel = computed<string>(
  () => modelOptions.value[0]?.id ?? '@cf/meta/llama-3.1-8b-instruct-fast',
)
const availableModelIds = computed<Set<string>>(
  () => new Set(modelOptions.value.map((item) => item.id)),
)

const sessions = ref<ChatSession[]>([])
const activeChatId = ref<string>('')
const deleteTargetChatId = ref<string>('')
const showDeleteModal = ref<boolean>(false)
const showModelModal = ref<boolean>(false)
const prompt = ref<string>('')
const sending = ref<boolean>(false)
const errorText = ref<string>('')
const messagesContainerRef = ref<HTMLElement | null>(null)

const sortedSessions = computed<ChatSession[]>(() =>
  [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt),
)
const activeSession = computed<ChatSession | null>(
  () => sessions.value.find((item) => item.id === activeChatId.value) ?? null,
)
const deleteTargetSession = computed<ChatSession | null>(
  () => sessions.value.find((item) => item.id === deleteTargetChatId.value) ?? null,
)
const canSend = computed<boolean>(() => prompt.value.trim().length > 0 && !sending.value)
const allModelsSorted = computed<ModelOption[]>(() => [...modelOptions.value])

const selectedModel = computed<string>({
  get() {
    return activeSession.value?.model ?? defaultModel.value
  },
  set(value: string) {
    const current = activeSession.value
    if (!current) return
    current.model = value
    touchSession(current)
  },
})

const selectedModelInfo = computed<ModelOption | null>(() => {
  return modelOptions.value.find((item) => item.id === selectedModel.value) ?? null
})

function toChatApiUrl(endpoint: string): string {
  const trimmed = endpoint.trim()
  if (!trimmed) return '/api/chat'
  try {
    const url = new URL(trimmed, window.location.origin)
    if (url.pathname === '/' || url.pathname.length === 0) url.pathname = '/api/chat'
    return url.toString()
  } catch {
    if (trimmed === '/' || trimmed.length === 0) return '/api/chat'
    return trimmed.endsWith('/api/chat') ? trimmed : `${trimmed.replace(/\/+$/, '')}/api/chat`
  }
}

function authHeaders(): Record<string, string> {
  if (!API_AUTH_TOKEN) return {}
  return {
    Authorization: `Bearer ${API_AUTH_TOKEN}`,
    'x-api-key': API_AUTH_TOKEN,
  }
}

function parseTokenCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.floor(value)
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase()
    const match = lower.match(/^(\d+(?:\.\d+)?)(k|m)?$/)
    const numberPart = match?.[1]
    if (numberPart) {
      const num = Number.parseFloat(numberPart)
      const unit = match?.[2]
      if (Number.isFinite(num)) {
        if (unit === 'k') return Math.round(num * 1000)
        if (unit === 'm') return Math.round(num * 1000000)
        return Math.round(num)
      }
    }
    const digits = lower.replace(/[^\d]/g, '')
    if (digits.length > 0) return Number.parseInt(digits, 10)
  }
  return 0
}

function formatTokenCount(tokens: number): string {
  if (!Number.isFinite(tokens) || tokens <= 0) return 'N/A'
  if (tokens >= 1000000) {
    const value = tokens / 1000000
    return `${Number.isInteger(value) ? value : value.toFixed(1)}M tokens`
  }
  if (tokens >= 1000) {
    const value = tokens / 1000
    return `${Number.isInteger(value) ? value : value.toFixed(1)}K tokens`
  }
  return `${tokens} tokens`
}

function parseStatus(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

function pickModelArray(input: unknown): unknown[] {
  if (Array.isArray(input)) return input
  if (typeof input !== 'object' || input === null) return []
  const source = input as Record<string, unknown>
  const directCandidates = ['models', 'items', 'data']
  for (const key of directCandidates) {
    const value = source[key]
    if (Array.isArray(value)) return value
    if (typeof value === 'object' && value !== null) {
      const nested = (value as Record<string, unknown>).models
      if (Array.isArray(nested)) return nested
    }
  }
  return []
}

function parseRemoteCatalog(input: unknown): ModelOption[] {
  const rows = pickModelArray(input)
  return rows
    .map((row): ModelOption | null => {
      if (typeof row !== 'object' || row === null) return null
      const item = row as Record<string, unknown>
      const idRaw = item.id ?? item.model ?? item.model_id ?? item.slug
      if (typeof idRaw !== 'string' || idRaw.trim().length === 0) return null
      const labelRaw = item.label ?? item.name ?? idRaw
      const providerRaw = item.provider ?? item.developer ?? item.vendor ?? 'Unknown'
      const contextTokens = parseTokenCount(
        item.contextWindowTokens ??
          item.context_window_tokens ??
          item.contextWindow ??
          item.context_window ??
          item.cw,
      )
      const featuredRaw = item.featured ?? item.hot ?? item.recommended
      const status = parseStatus(item.status ?? item.tab ?? item.group)

      return {
        id: idRaw.trim(),
        label: String(labelRaw).trim() || idRaw.trim(),
        provider: String(providerRaw).trim() || 'Unknown',
        contextWindow: formatTokenCount(contextTokens),
        contextWindowTokens: contextTokens,
        featured: Boolean(featuredRaw) || status === 'hot',
      }
    })
    .filter((item): item is ModelOption => item !== null)
}

async function loadRemoteModels(): Promise<void> {
  modelsLoadError.value = ''
  try {
    const res = await fetch(MODELS_SOURCE_URL, {
      cache: 'no-store',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const parsed = parseRemoteCatalog((await res.json()) as unknown)
    if (parsed.length > 0) {
      modelOptions.value = parsed
      normalizeAllSessionModels()
      return
    }
    modelsLoadError.value = 'models.json chưa có dữ liệu hợp lệ, đang dùng danh sách fallback.'
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải models.json'
    modelsLoadError.value = `Không tải được models.json: ${message}`
  }
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function makeSessionTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (clean.length === 0) return 'Chat mới'
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean
}

function createAssistantMessage(content: string): ChatMessage {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    role: 'assistant',
    content,
    time: nowTime(),
  }
}

function createSession(model: string): ChatSession {
  const now = Date.now()
  return {
    id: `${now}-${Math.floor(Math.random() * 10000)}`,
    title: 'Chat mới',
    model,
    updatedAt: now,
    messages: [createAssistantMessage('Bắt đầu cuộc trò chuyện mới.')],
  }
}

function loadSessionsFromStorage(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is ChatSession => {
        if (typeof item !== 'object' || item === null) return false
        const candidate = item as Partial<ChatSession>
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.title === 'string' &&
          typeof candidate.model === 'string' &&
          Array.isArray(candidate.messages) &&
          typeof candidate.updatedAt === 'number'
        )
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        model: item.model,
        updatedAt: item.updatedAt,
        messages: item.messages
          .filter((msg): msg is ChatMessage => {
            if (typeof msg !== 'object' || msg === null) return false
            const m = msg as Partial<ChatMessage>
            return (
              typeof m.id === 'number' &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              typeof m.time === 'string'
            )
          })
          .slice(-100),
      }))
      .filter((item) => item.messages.length > 0)
  } catch {
    return []
  }
}

function saveSessionsToStorage(value: ChatSession[]): void {
  try {
    const persisted = value.filter((session) => hasUserQuestion(session))
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // Ignore storage errors
  }
}

function touchSession(session: ChatSession): void {
  session.updatedAt = Date.now()
}

function ensureSessionModelIsSupported(session: ChatSession): void {
  if (availableModelIds.value.has(session.model)) return
  session.model = defaultModel.value
  touchSession(session)
}

function normalizeAllSessionModels(): void {
  for (const session of sessions.value) ensureSessionModelIsSupported(session)
}

function hasUserQuestion(session: ChatSession): boolean {
  return session.messages.some(
    (message) => message.role === 'user' && message.content.trim().length > 0,
  )
}

function pruneEmptySessions(): void {
  sessions.value = sessions.value.filter((session) => hasUserQuestion(session))
}

function ensureSession(): ChatSession {
  const current = activeSession.value
  if (current) return current
  const created = createSession(defaultModel.value)
  sessions.value.push(created)
  activeChatId.value = created.id
  return created
}

function createNewChat(): void {
  pruneEmptySessions()
  const session = createSession(defaultModel.value)
  sessions.value.push(session)
  activeChatId.value = session.id
  prompt.value = ''
  errorText.value = ''
}

function selectChat(chatId: string): void {
  activeChatId.value = chatId
  prompt.value = ''
  errorText.value = ''
}

function requestDeleteChat(chatId: string): void {
  if (!chatId) return
  deleteTargetChatId.value = chatId
  showDeleteModal.value = true
}

function cancelDeleteChat(): void {
  showDeleteModal.value = false
  deleteTargetChatId.value = ''
}

function confirmDeleteChat(): void {
  const targetId = deleteTargetChatId.value
  if (!targetId) {
    cancelDeleteChat()
    return
  }

  sessions.value = sessions.value.filter((session) => session.id !== targetId)

  if (activeChatId.value === targetId) {
    if (sessions.value.length === 0) {
      createNewChat()
    } else {
      activeChatId.value =
        [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? ''
    }
  }

  prompt.value = ''
  errorText.value = ''
  cancelDeleteChat()
}

function openModelModal(): void {
  showModelModal.value = true
}

function closeModelModal(): void {
  showModelModal.value = false
}

function selectModelFromModal(modelId: string): void {
  selectedModel.value = modelId
  closeModelModal()
}

function addMessage(session: ChatSession, role: ChatRole, content: string): ChatMessage {
  const message: ChatMessage = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    role,
    content,
    time: nowTime(),
  }
  session.messages.push(message)
  return message
}

function extractResponseFromRawStream(raw: string): string {
  const normalized = raw.replace(/\r/g, '')
  const matches = [...normalized.matchAll(/"response"\s*:\s*"((?:\\.|[^"\\])*)"/g)]
  if (matches.length === 0) return ''

  let out = ''
  for (const match of matches) {
    const piece = match[1]
    if (!piece) continue
    try {
      out += JSON.parse(`"${piece}"`) as string
    } catch {
      out += piece
    }
  }

  return out.trim()
}

function extractJsonResponseText(payload: unknown): string {
  if (typeof payload === 'string') return payload.trim()
  if (typeof payload !== 'object' || payload === null) return ''

  const typed = payload as JsonChatResponse & Record<string, unknown>
  if (typeof typed.response === 'string' && typed.response.trim().length > 0)
    return typed.response.trim()
  if (typed.result && typeof typed.result === 'object') {
    const resultRecord = typed.result as Record<string, unknown>
    if (typeof resultRecord.response === 'string' && resultRecord.response.trim().length > 0) {
      return resultRecord.response.trim()
    }
    if (
      typeof resultRecord.output_text === 'string' &&
      resultRecord.output_text.trim().length > 0
    ) {
      return resultRecord.output_text.trim()
    }
  }

  const deepText = findFirstTextField(payload)
  return deepText.trim()
}

function extractResponseFromRawPayload(raw: string): string {
  const text = raw.trim()
  if (!text) return ''
  try {
    const parsed = JSON.parse(text) as unknown
    const extracted = extractJsonResponseText(parsed)
    if (extracted) return extracted
    // Last resort: show compact JSON so UI is never blank.
    return JSON.stringify(parsed)
  } catch {
    return extractResponseFromRawStream(text) || text
  }
}

function findFirstTextField(input: unknown): string {
  if (typeof input === 'string') return input
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findFirstTextField(item)
      if (found.trim().length > 0) return found
    }
    return ''
  }
  if (typeof input !== 'object' || input === null) return ''

  const record = input as Record<string, unknown>
  const directKeys = ['content', 'text', 'output_text', 'answer', 'message', 'response']
  for (const key of directKeys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim().length > 0) return value
  }

  const priorityKeys = ['result', 'output', 'data', 'choices', 'messages', 'message', 'delta']
  for (const key of priorityKeys) {
    if (!(key in record)) continue
    const found = findFirstTextField(record[key])
    if (found.trim().length > 0) return found
  }

  for (const value of Object.values(record)) {
    const found = findFirstTextField(value)
    if (found.trim().length > 0) return found
  }
  return ''
}

async function buildHttpErrorMessage(response: Response): Promise<string> {
  const statusText = `HTTP ${response.status}`
  const contentType = (response.headers.get('content-type') || '').toLowerCase()

  try {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as Record<string, unknown>
      const apiError = typeof payload.error === 'string' ? payload.error.trim() : ''
      if (apiError) return `${statusText}: ${apiError}`
      return statusText
    }

    const text = (await response.text()).trim()
    if (text) return `${statusText}: ${text.slice(0, 200)}`
    return statusText
  } catch {
    return statusText
  }
}

async function sendMessage(): Promise<void> {
  const text = prompt.value.trim()
  if (!text || sending.value) return

  const session = ensureSession()
  ensureSessionModelIsSupported(session)
  errorText.value = ''
  sending.value = true
  prompt.value = ''

  addMessage(session, 'user', text)
  if (session.title === 'Chat mới') session.title = makeSessionTitle(text)
  touchSession(session)

  const assistant = addMessage(session, 'assistant', '')

  try {
    const response = await fetch(toChatApiUrl(CHAT_API_ENDPOINT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({
        model: session.model,
        messages: session.messages
          .filter((item) => item.content.trim().length > 0)
          .map((item) => ({ role: item.role, content: item.content })),
      }),
    })

    if (!response.ok) throw new Error(await buildHttpErrorMessage(response))
    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    const raw = await response.text()
    let parsedText = ''

    if (contentType.includes('application/json')) {
      try {
        parsedText = extractJsonResponseText(JSON.parse(raw) as unknown)
      } catch {
        parsedText = ''
      }
    }

    if (!parsedText && contentType.includes('text/event-stream')) {
      parsedText = extractResponseFromRawStream(raw)
    }

    if (!parsedText) {
      parsedText = extractResponseFromRawPayload(raw)
    }

    await typeOutMessage(assistant, parsedText || 'No response content.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gọi API thất bại'
    assistant.content = `Lỗi: ${message}`
    errorText.value = `Không gọi được API (${CHAT_API_ENDPOINT}): ${message}`
  } finally {
    touchSession(session)
    sending.value = false
  }
}

function onInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendMessage()
  }
}

function scrollMessagesToBottom(): void {
  const el = messagesContainerRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function typeOutMessage(target: ChatMessage, fullText: string): Promise<void> {
  const text = fullText || ''
  if (!text) {
    target.content = ''
    return
  }

  const charsPerStep = 3
  const stepDelayMs = 14
  target.content = ''

  for (let i = 0; i < text.length; i += charsPerStep) {
    target.content = text.slice(0, i + charsPerStep)
    await sleep(stepDelayMs)
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatInlineMarkdown(escaped: string): string {
  const withInlineCode = escaped.replace(
    /`([^`]+)`/g,
    '<code class="message-inline-code">$1</code>',
  )
  const withBold = withInlineCode.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return withBold.replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
}

function formatPlainTextBlock(raw: string): string {
  const escaped = escapeHtml(raw)
  return formatInlineMarkdown(escaped).replace(/\n/g, '<br>')
}

function isMarkdownTableRow(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line)
}

function isMarkdownTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function parseMarkdownTableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function renderMarkdownTable(headerCells: string[], bodyRows: string[][]): string {
  const headerHtml = headerCells
    .map((cell) => `<th>${formatInlineMarkdown(escapeHtml(cell))}</th>`)
    .join('')
  const bodyHtml = bodyRows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${formatInlineMarkdown(escapeHtml(cell))}</td>`).join('')}</tr>`,
    )
    .join('')
  return `<div class="message-table-wrap"><table class="message-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`
}

function formatTextSegment(raw: string): string {
  const lines = raw.split('\n')
  const output: string[] = []
  const plainBuffer: string[] = []

  const flushPlain = (): void => {
    if (plainBuffer.length === 0) return
    output.push(formatPlainTextBlock(plainBuffer.join('\n')))
    plainBuffer.length = 0
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? ''
    const nextLine = lines[i + 1] ?? ''

    if (isMarkdownTableRow(line) && isMarkdownTableDivider(nextLine)) {
      flushPlain()
      const headerCells = parseMarkdownTableCells(line)
      const bodyRows: string[][] = []
      i += 1

      while (i + 1 < lines.length) {
        const rowLine = lines[i + 1]
        if (!rowLine || !isMarkdownTableRow(rowLine)) break
        i += 1
        bodyRows.push(parseMarkdownTableCells(rowLine))
      }

      output.push(renderMarkdownTable(headerCells, bodyRows))
      continue
    }

    plainBuffer.push(line)
  }

  flushPlain()
  return output.join('')
}

function formatMessageContent(raw: string): string {
  const codeBlockPattern = /```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g
  const chunks: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockPattern.exec(raw)) !== null) {
    const [fullBlock, languageRaw, codeRaw] = match
    const blockStart = match.index
    if (blockStart > lastIndex) {
      chunks.push(formatTextSegment(raw.slice(lastIndex, blockStart)))
    }

    const language = (languageRaw ?? '').trim()
    const escapedCode = escapeHtml(codeRaw ?? '')
    chunks.push(
      `<pre class="message-code"><code>${escapedCode}</code>${language ? `<span class="message-code-lang">${escapeHtml(language)}</span>` : ''}</pre>`,
    )
    lastIndex = blockStart + fullBlock.length
  }

  if (lastIndex < raw.length) {
    chunks.push(formatTextSegment(raw.slice(lastIndex)))
  }

  if (chunks.length === 0) {
    return formatTextSegment(raw)
  }

  return chunks.join('')
}

onMounted(() => {
  void loadRemoteModels()
  const loaded = loadSessionsFromStorage()
  sessions.value = loaded
  normalizeAllSessionModels()

  if (loaded.length === 0) {
    createNewChat()
    return
  }

  activeChatId.value = [...loaded].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? ''
  void nextTick(scrollMessagesToBottom)
})

watch(
  sessions,
  (value) => {
    saveSessionsToStorage(value)
  },
  { deep: true },
)

watch(
  () =>
    activeSession.value?.messages
      .map((message) => `${message.id}:${message.content.length}`)
      .join('|') ?? '',
  async () => {
    await nextTick()
    scrollMessagesToBottom()
  },
)

watch(
  () => activeChatId.value,
  async () => {
    await nextTick()
    scrollMessagesToBottom()
  },
)
</script>

<template>
  <div>
    <section class="mt-5 animate-fade-up animate-delay-2 grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside class="border border-border-default bg-bg-surface p-5">
        <button
          type="button"
          class="mb-3 w-full border border-border-default bg-bg-deep px-3 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click="createNewChat"
        >
          + Chat mới
        </button>

        <div class="chat-scroll max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          <button
            v-for="chat in sortedSessions"
            :key="chat.id"
            type="button"
            class="w-full border px-3 py-2.5 text-left text-sm transition"
            :class="
              chat.id === activeChatId
                ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
                : 'border-border-default bg-bg-deep text-text-secondary hover:border-accent-amber hover:text-text-primary'
            "
            @click="selectChat(chat.id)"
          >
            <p class="truncate">{{ chat.title }}</p>
            <p class="mt-1 font-display text-xs tracking-widest text-text-dim">
              {{ new Date(chat.updatedAt).toLocaleString() }}
            </p>
          </button>
        </div>

        <button
          type="button"
          class="mt-4 w-full border border-accent-coral/40 bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral transition hover:border-accent-coral hover:bg-accent-coral/20"
          :disabled="!activeSession"
          @click="requestDeleteChat(activeChatId)"
        >
          Xóa siêu tốc
        </button>
      </aside>

      <div class="border border-border-default bg-bg-surface p-5 sm:p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="flex items-center gap-3 font-display text-2xl font-semibold">
            <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
            Chat
          </h2>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="border border-border-default bg-bg-deep px-3 py-1 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              @click="openModelModal"
            >
              {{ selectedModelInfo?.label ?? 'Chọn model AI' }}
            </button>
            <button
              type="button"
              class="border border-border-default bg-bg-deep px-3 py-1 text-xs text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
              :disabled="!activeSession"
              @click="requestDeleteChat(activeChatId)"
            >
              Xóa hội thoại
            </button>
          </div>
        </div>

        <div
          ref="messagesContainerRef"
          class="chat-scroll h-[46vh] min-h-[320px] overflow-y-auto space-y-3 border border-border-default bg-bg-deep p-4 sm:p-5"
        >
          <article
            v-for="message in activeSession?.messages ?? []"
            :key="message.id"
            class="max-w-[90%] border p-3.5 text-[15px]"
            :class="
              message.role === 'assistant'
                ? 'border-border-default bg-bg-surface text-text-primary'
                : 'ml-auto border-accent-coral bg-accent-coral/10 text-text-primary'
            "
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="message-body" v-html="formatMessageContent(message.content)" />
            <p class="mt-2 font-display text-xs tracking-widest text-text-dim">
              {{ message.time }}
            </p>
          </article>
        </div>

        <div class="mt-4 border border-border-default bg-bg-deep p-4">
          <textarea
            v-model="prompt"
            rows="3"
            placeholder="Nhập tin nhắn..."
            class="w-full resize-none bg-transparent text-base text-text-primary outline-none placeholder:text-text-dim"
            @keydown="onInputKeydown"
          />
          <div class="mt-3 flex items-center justify-between gap-3">
            <p class="font-display text-xs tracking-widest text-text-dim">
              {{ sending ? 'Đang gọi API...' : 'Nhấn Enter để gửi' }}
            </p>
            <button
              type="button"
              :disabled="!canSend"
              class="border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition disabled:cursor-not-allowed disabled:opacity-60 hover:border-accent-coral hover:text-text-primary"
              @click="sendMessage"
            >
              Gửi
            </button>
          </div>
          <p v-if="errorText" class="mt-3 text-xs text-accent-coral">{{ errorText }}</p>
        </div>
      </div>
    </section>

    <div
      v-if="showModelModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4"
    >
      <div class="w-full max-w-5xl border border-border-default bg-bg-surface p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="font-display text-sm tracking-widest text-accent-sky">// MODEL AI</p>
            <h3 class="mt-1 font-display text-2xl font-semibold text-text-primary">
              Danh sách model khả dụng
            </h3>
          </div>
          <button
            type="button"
            class="border border-border-default bg-bg-deep px-3 py-1.5 text-xs text-text-secondary transition hover:text-text-primary"
            @click="closeModelModal"
          >
            Đóng
          </button>
        </div>

        <div class="mt-4">
          <div
            class="chat-scroll max-h-[48vh] overflow-y-auto border border-border-default bg-bg-deep p-3"
          >
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="model in allModelsSorted"
                :key="`all-${model.id}`"
                type="button"
                class="w-full border p-3 text-left transition-all duration-300"
                :class="
                  selectedModel === model.id
                    ? 'border-accent-coral bg-accent-coral/10'
                    : 'border-border-default bg-bg-surface hover:border-accent-amber hover:bg-bg-elevated'
                "
                @click="selectModelFromModal(model.id)"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="font-display text-sm text-text-primary">{{ model.label }}</p>
                  <p class="text-xs text-text-secondary">{{ model.contextWindow }}</p>
                </div>
                <p class="mt-1 text-xs text-text-dim">{{ model.provider }}</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 px-4"
    >
      <div class="w-full max-w-md border border-border-default bg-bg-surface p-5">
        <p class="font-display text-sm tracking-widest text-accent-coral">// XÁC NHẬN XÓA</p>
        <h3 class="mt-2 font-display text-xl font-semibold text-text-primary">
          Xóa vĩnh viễn hội thoại?
        </h3>
        <p class="mt-3 text-sm text-text-secondary">
          Bạn sắp xóa:
          <span class="text-text-primary">{{
            deleteTargetSession?.title ?? 'Hội thoại hiện tại'
          }}</span>
        </p>
        <p class="mt-1 text-sm text-accent-coral">Hành động này không thể khôi phục.</p>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="border border-border-default bg-bg-deep px-4 py-2 text-sm text-text-secondary transition hover:text-text-primary"
            @click="cancelDeleteChat"
          >
            Hủy
          </button>
          <button
            type="button"
            class="border border-accent-coral bg-accent-coral/20 px-4 py-2 text-sm text-accent-coral transition hover:bg-accent-coral/30"
            @click="confirmDeleteChat"
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-scroll {
  scrollbar-width: thin;
  scrollbar-color: #f47f6b #1a2338;
}

.chat-scroll::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.chat-scroll::-webkit-scrollbar-track {
  background: #1a2338;
  border-left: 1px solid #2e3a57;
}

.chat-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #f47f6b 0%, #f2b54a 100%);
  border: 2px solid #1a2338;
  border-radius: 999px;
}

.chat-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #ff8e7b 0%, #ffd37a 100%);
}

.message-body {
  overflow-wrap: anywhere;
  line-height: 1.6;
}

.message-body :deep(pre.message-code) {
  position: relative;
  margin: 0.6rem 0;
  border: 1px solid #2e3a57;
  background: #121a2b;
  padding: 0.75rem 0.9rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.85rem;
}

.message-body :deep(span.message-code-lang) {
  position: absolute;
  top: 0.35rem;
  right: 0.5rem;
  color: #8aa1c3;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.message-body :deep(code.message-inline-code) {
  border: 1px solid #2e3a57;
  background: #151e31;
  padding: 0.05rem 0.3rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.88em;
}

.message-body :deep(strong) {
  font-weight: 700;
}

.message-body :deep(em) {
  font-style: italic;
}

.message-body :deep(div.message-table-wrap) {
  margin: 0.7rem 0;
  overflow-x: auto;
}

.message-body :deep(table.message-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.message-body :deep(table.message-table th),
.message-body :deep(table.message-table td) {
  border: 1px solid #2e3a57;
  padding: 0.45rem 0.55rem;
  text-align: left;
  vertical-align: top;
}

.message-body :deep(table.message-table thead th) {
  background: #151e31;
  color: #dfe8ff;
}
</style>
