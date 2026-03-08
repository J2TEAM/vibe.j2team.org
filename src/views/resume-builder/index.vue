<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuickAction {
  label: string
  prompt: string
  icon: string
  accent: string
}

interface ToolbarItem {
  label: string
  icon: string
  insert: string
  title: string
}

// ─── State ────────────────────────────────────────────────────────────────────
const markdown = ref(`# Nguyễn Văn An
**Frontend Developer** · Hồ Chí Minh, Việt Nam

📧 an.nguyen@email.com · 📱 +84 909 123 456 · 🔗 github.com/annguyen · 💼 linkedin.com/in/annguyen

---

## Tóm tắt

Frontend Developer với 3+ năm kinh nghiệm xây dựng web application hiệu suất cao. Thành thạo Vue.js, TypeScript và có niềm đam mê với UX/UI tinh tế.

---

## Kinh nghiệm làm việc

### Senior Frontend Developer — J2Team JSC
*01/2023 – Hiện tại · Hồ Chí Minh*

- Dẫn dắt team 4 developer xây dựng dashboard quản lý 50k+ người dùng
- Tối ưu performance từ LCP 4.2s → 1.8s, tăng conversion 23%
- Triển khai design system với 80+ component tái sử dụng

### Frontend Developer — StartupXYZ
*06/2021 – 12/2022 · Remote*

- Phát triển SPA với Vue 3 + TypeScript + Pinia
- Tích hợp CI/CD pipeline, giảm deploy time từ 30 phút xuống 5 phút

---

## Học vấn

### Đại học Bách Khoa TP.HCM
**Kỹ sư Công nghệ Thông tin** · 2017 – 2021 · GPA: 3.6/4.0

---

## Kỹ năng

**Frontend:** Vue 3, React, TypeScript, Tailwind CSS, Vite
**Backend:** Node.js, Express, REST API
**Tools:** Git, Docker, Figma, Jira
**Soft skills:** Team lead, Agile/Scrum, Technical writing

---

## Dự án nổi bật

### 🚀 Open Source UI Kit
*Vue 3 component library · 1.2k GitHub stars*
Thư viện 60+ component với dark mode, accessibility và i18n support.

### 📊 Analytics Dashboard
*Vue 3 + D3.js · Cá nhân*
Real-time dashboard visualize dữ liệu từ 10+ nguồn khác nhau.
`)

const aiPrompt = ref('')
const aiLoading = ref(false)
const aiSuggestion = ref('')
const aiError = ref('')
const showAiPanel = ref(false)
const showApiKeyModal = ref(false)
const groqApiKey = ref('')
const apiKeyInput = ref('')
const apiKeySaved = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const STORAGE_KEY = 'rb_groq_api_key'

// ─── Groq Models ──────────────────────────────────────────────────────────────
interface GroqModel {
  id: string
  label: string
  note: string
}

const groqModels: GroqModel[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', note: 'Mạnh nhất · Khuyên dùng' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', note: 'Nhanh · Nhẹ' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B', note: 'Google · Cân bằng' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', note: 'Context dài' },
]

const selectedModel = ref(groqModels[0]!.id)

// ─── Toolbar ──────────────────────────────────────────────────────────────────
const toolbarItems: ToolbarItem[] = [
  { label: 'H1', icon: 'H1', insert: '\n# Tiêu đề lớn', title: 'Heading 1' },
  { label: 'H2', icon: 'H2', insert: '\n## Tiêu đề mục', title: 'Heading 2' },
  { label: 'H3', icon: 'H3', insert: '\n### Tiêu đề nhỏ', title: 'Heading 3' },
  { label: 'B', icon: 'B', insert: '**chữ đậm**', title: 'Bold' },
  { label: 'I', icon: 'I', insert: '*in nghiêng*', title: 'Italic' },
  { label: '—', icon: '—', insert: '\n\n---\n', title: 'Divider' },
  { label: '•', icon: '•', insert: '\n- Item', title: 'List item' },
]

// ─── Quick Actions ────────────────────────────────────────────────────────────
const quickActions: QuickAction[] = [
  {
    label: 'Tóm tắt ấn tượng hơn',
    prompt:
      'Viết lại phần "Tóm tắt" trong CV sau đây để nghe ấn tượng, chuyên nghiệp và thu hút nhà tuyển dụng hơn. Chỉ trả về nội dung phần tóm tắt mới bằng tiếng Việt, không giải thích thêm.',
    icon: '✨',
    accent: '#f59e0b',
  },
  {
    label: 'Bullet points mạnh hơn',
    prompt:
      'Viết lại các bullet points trong phần kinh nghiệm làm việc của CV sau đây. Dùng động từ mạnh, thêm số liệu cụ thể, theo format STAR. Chỉ trả về các bullet points mới, không giải thích.',
    icon: '💪',
    accent: '#10b981',
  },
  {
    label: 'Thêm từ khóa ATS',
    prompt:
      'Phân tích CV sau và gợi ý thêm các từ khóa kỹ thuật quan trọng vào phần Kỹ năng để vượt qua hệ thống ATS. Trả về danh sách từ khóa nên thêm kèm lý do ngắn gọn.',
    icon: '🎯',
    accent: '#6366f1',
  },
  {
    label: 'Elevator pitch 1 dòng',
    prompt:
      'Từ CV sau, viết 1 câu elevator pitch mạnh mẽ (dưới 20 từ tiếng Việt) mô tả ứng viên. Chỉ trả về câu đó, không thêm gì khác.',
    icon: '🚀',
    accent: '#ef4444',
  },
  {
    label: 'Kiểm tra điểm yếu CV',
    prompt:
      'Đánh giá CV sau và liệt kê 3-5 điểm yếu cần cải thiện. Trả về dạng danh sách ngắn gọn bằng tiếng Việt.',
    icon: '🔍',
    accent: '#0ea5e9',
  },
  {
    label: 'Viết cover letter mini',
    prompt:
      'Từ CV sau, viết đoạn cover letter ngắn (3-4 câu) giới thiệu ứng viên. Văn phong chuyên nghiệp, tiếng Việt.',
    icon: '📝',
    accent: '#8b5cf6',
  },
]

// ─── Markdown Parser ──────────────────────────────────────────────────────────
function parseMarkdown(md: string): string {
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')
  html = html.replace(/^---$/gm, '<hr />')
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  const lines = html.split('\n')
  const result: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      result.push('')
    } else if (/^<(h[1-6]|ul|li|hr|p)/.test(t)) {
      result.push(t)
    } else {
      result.push(`<p>${t}</p>`)
    }
  }
  return result.join('\n')
}

const previewHtml = computed(() => parseMarkdown(markdown.value))

const wordCount = computed(() => markdown.value.trim().split(/\s+/).filter(Boolean).length)

// ─── Toolbar insert ───────────────────────────────────────────────────────────
function insertText(text: string): void {
  if (!textareaRef.value) {
    markdown.value += text
    return
  }
  const ta = textareaRef.value
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const before = markdown.value.slice(0, start)
  const after = markdown.value.slice(end)
  markdown.value = before + text + after
}

// ─── API Key Modal ────────────────────────────────────────────────────────────
function openApiKeyModal(): void {
  apiKeyInput.value = groqApiKey.value
  apiKeySaved.value = false
  showApiKeyModal.value = true
}

function saveApiKey(): void {
  const key = apiKeyInput.value.trim()
  if (!key) return
  groqApiKey.value = key
  localStorage.setItem(STORAGE_KEY, key)
  apiKeySaved.value = true
  setTimeout(() => {
    showApiKeyModal.value = false
    apiKeySaved.value = false
  }, 800)
}

function clearApiKey(): void {
  groqApiKey.value = ''
  apiKeyInput.value = ''
  localStorage.removeItem(STORAGE_KEY)
}

// ─── AI Call — Groq (OpenAI-compatible, hỗ trợ CORS từ browser) ──────────────
async function callAI(systemPrompt: string): Promise<void> {
  if (!groqApiKey.value) {
    openApiKeyModal()
    return
  }

  aiLoading.value = true
  aiSuggestion.value = ''
  aiError.value = ''
  showAiPanel.value = true

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey.value}`,
      },
      body: JSON.stringify({
        model: selectedModel.value,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n--- CV ---\n${markdown.value}`,
          },
        ],
      }),
    })

    const data = (await response.json()) as {
      error?: { message: string }
      choices?: { message?: { content?: string } }[]
    }

    if (data.error) throw new Error(data.error.message)

    aiSuggestion.value = data.choices?.[0]?.message?.content ?? 'Không có gợi ý từ AI.'
  } catch (err) {
    aiError.value = err instanceof Error ? err.message : 'Lỗi không xác định khi gọi Groq API.'
  } finally {
    aiLoading.value = false
  }
}

function runQuickAction(action: QuickAction): void {
  void callAI(action.prompt)
}

function runCustomPrompt(): void {
  if (!aiPrompt.value.trim()) return
  void callAI(aiPrompt.value)
  aiPrompt.value = ''
}

function applySuggestion(): void {
  markdown.value += `\n\n---\n*💡 AI Gợi ý:*\n\n${aiSuggestion.value}`
  aiSuggestion.value = ''
  showAiPanel.value = false
}

function copyToClipboard(text: string): void {
  void navigator.clipboard.writeText(text).catch(() => {})
}

function printResume(): void {
  window.print()
}

// ─── Auto-resize textarea ─────────────────────────────────────────────────────
watch(markdown, () => {
  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
})

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) groqApiKey.value = saved

  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
})
</script>

<template>
  <div class="rb-app">
    <!-- ── Top Bar ──────────────────────────────────────────────────────── -->
    <header class="rb-topbar no-print">
      <div class="rb-topbar-left">
        <!-- Logo -->
        <RouterLink to="/" class="rb-back" title="Về trang chủ">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Trang chủ
        </RouterLink>

        <span class="rb-divider" aria-hidden="true">|</span>

        <span class="rb-logo">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Resume Builder
        </span>

        <span class="rb-badge">Markdown · Live Preview</span>
      </div>

      <div class="rb-topbar-right">
        <span class="rb-wordcount">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="12" x2="3" y2="12" />
            <line x1="21" y1="18" x2="15" y2="18" />
          </svg>
          {{ wordCount }} từ
        </span>

        <button class="rb-btn-ai" @click="showAiPanel = !showAiPanel">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            />
          </svg>
          AI Assist
        </button>

        <button class="rb-btn-print" @click="printResume">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Export PDF
        </button>

        <button
          class="rb-btn-key"
          :class="{ 'rb-btn-key--active': groqApiKey }"
          title="Cài đặt Groq API key"
          @click="openApiKeyModal"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
            />
          </svg>
          <span class="rb-key-dot" :class="groqApiKey ? 'rb-key-dot--on' : 'rb-key-dot--off'" />
        </button>
      </div>
    </header>

    <!-- ── Main Layout ──────────────────────────────────────────────────── -->
    <div class="rb-layout">
      <!-- Editor Panel -->
      <aside class="rb-editor no-print">
        <!-- Toolbar -->
        <div class="rb-toolbar">
          <span class="rb-panel-label">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Editor
          </span>
          <div class="rb-toolbar-btns">
            <button
              v-for="item in toolbarItems"
              :key="item.label"
              class="rb-tool"
              :class="{ 'rb-tool-italic': item.label === 'I' }"
              :title="item.title"
              type="button"
              @click="insertText(item.insert)"
            >
              {{ item.icon }}
            </button>
          </div>
        </div>

        <textarea
          ref="textareaRef"
          v-model="markdown"
          class="rb-textarea"
          placeholder="Nhập Markdown CV của bạn..."
          spellcheck="false"
        />
      </aside>

      <!-- Preview Panel -->
      <main class="rb-preview">
        <div class="rb-sheet">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="rb-resume-content" v-html="previewHtml" />
        </div>
      </main>

      <!-- AI Panel -->
      <Transition name="rb-slide">
        <aside v-if="showAiPanel" class="rb-ai-panel no-print">
          <div class="rb-ai-header">
            <span class="rb-ai-title">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                />
              </svg>
              AI Gợi ý CV
            </span>
            <button class="rb-ai-close" type="button" @click="showAiPanel = false">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- API Key status -->
          <div class="rb-ai-key-bar">
            <div v-if="groqApiKey" class="rb-key-active">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Groq API đã kết nối
            </div>
            <div v-else class="rb-key-missing">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Chưa có API key
            </div>
            <button class="rb-key-btn" type="button" @click="openApiKeyModal">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                />
              </svg>
              {{ groqApiKey ? 'Đổi key' : 'Thêm key' }}
            </button>
          </div>

          <!-- Model selector -->
          <div class="rb-model-bar">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <select v-model="selectedModel" class="rb-model-select">
              <option v-for="m in groqModels" :key="m.id" :value="m.id">
                {{ m.label }} — {{ m.note }}
              </option>
            </select>
          </div>

          <!-- Quick Actions -->
          <div class="rb-quick-section">
            <p class="rb-section-label">Thao tác nhanh</p>
            <button
              v-for="action in quickActions"
              :key="action.label"
              class="rb-quick-btn"
              type="button"
              :disabled="aiLoading"
              @click="runQuickAction(action)"
            >
              <span class="rb-quick-icon">{{ action.icon }}</span>
              {{ action.label }}
              <svg
                class="rb-quick-arrow"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <!-- Custom Prompt -->
          <div class="rb-custom-section">
            <p class="rb-section-label">Câu hỏi tùy chỉnh</p>
            <div class="rb-prompt-row">
              <input
                v-model="aiPrompt"
                class="rb-prompt-input"
                placeholder="Hỏi AI về CV của bạn..."
                :disabled="aiLoading"
                type="text"
                @keydown.enter="runCustomPrompt"
              />
              <button
                class="rb-prompt-send"
                type="button"
                :disabled="aiLoading || !aiPrompt.trim()"
                @click="runCustomPrompt"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

          <!-- AI Result -->
          <div class="rb-ai-result">
            <!-- Loading -->
            <div v-if="aiLoading" class="rb-ai-loading">
              <div class="rb-dots"><span /><span /><span /></div>
              <p>AI đang phân tích CV...</p>
            </div>

            <!-- Error -->
            <div v-else-if="aiError" class="rb-ai-error">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {{ aiError }}
            </div>

            <!-- Suggestion -->
            <div v-else-if="aiSuggestion" class="rb-ai-suggestion">
              <div class="rb-suggestion-text">{{ aiSuggestion }}</div>
              <div class="rb-suggestion-actions">
                <button class="rb-sug-btn rb-sug-apply" type="button" @click="applySuggestion">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Thêm vào CV
                </button>
                <button
                  class="rb-sug-btn rb-sug-copy"
                  type="button"
                  @click="copyToClipboard(aiSuggestion)"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            <!-- Empty -->
            <div v-else class="rb-ai-empty">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#cbd5e1"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                />
              </svg>
              <p>Chọn thao tác nhanh hoặc hỏi AI bất kỳ điều gì về CV của bạn.</p>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
    <!-- ── API Key Modal ───────────────────────────────────────────────── -->
    <Transition name="rb-fade">
      <div v-if="showApiKeyModal" class="rb-modal-overlay" @click.self="showApiKeyModal = false">
        <div class="rb-modal">
          <div class="rb-modal-header">
            <span class="rb-modal-title">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
                />
              </svg>
              Cài đặt Groq API Key
            </span>
            <button class="rb-ai-close" type="button" @click="showApiKeyModal = false">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="rb-modal-body">
            <p class="rb-modal-desc">
              Tính năng AI dùng <strong>Groq</strong> — chạy LLM cực nhanh trên phần cứng LPU. Miễn
              phí <strong>500,000 tokens/ngày</strong>. Key lưu vào <code>localStorage</code> trình
              duyệt, không gửi lên server.
            </p>

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="rb-modal-link"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Lấy API key miễn phí tại console.groq.com →
            </a>

            <label class="rb-modal-label" for="api-key-input">API Key</label>
            <div class="rb-modal-input-row">
              <input
                id="api-key-input"
                v-model="apiKeyInput"
                class="rb-modal-input"
                type="password"
                placeholder="gsk_..."
                autocomplete="off"
                spellcheck="false"
                @keydown.enter="saveApiKey"
              />
            </div>

            <div v-if="groqApiKey" class="rb-modal-current">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Key đang dùng: {{ groqApiKey.slice(0, 8) }}••••••••{{ groqApiKey.slice(-4) }}
            </div>
          </div>

          <div class="rb-modal-footer">
            <button
              v-if="groqApiKey"
              class="rb-modal-btn rb-modal-btn--danger"
              type="button"
              @click="clearApiKey"
            >
              Xóa key
            </button>
            <div style="flex: 1" />
            <button
              class="rb-modal-btn rb-modal-btn--ghost"
              type="button"
              @click="showApiKeyModal = false"
            >
              Hủy
            </button>
            <button
              class="rb-modal-btn rb-modal-btn--primary"
              type="button"
              :disabled="!apiKeyInput.trim()"
              @click="saveApiKey"
            >
              <svg
                v-if="apiKeySaved"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ apiKeySaved ? 'Đã lưu!' : 'Lưu key' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

/* ── Reset & Root ───────────────────────────────────────────────────────── */
.rb-app {
  --c-bg: #f7f7f5;
  --c-surface: #ffffff;
  --c-border: #e8e8e6;
  --c-text: #1a1a1a;
  --c-soft: #6b7280;
  --c-ai: #2563eb;
  --c-ai-h: #1d4ed8;
  --c-print-bg: #f0efed;
  --radius: 6px;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.07), 0 8px 32px rgba(0, 0, 0, 0.06);

  font-family: 'DM Sans', sans-serif;
  background: var(--c-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--c-text);
}

/* ── Top Bar ────────────────────────────────────────────────────────────── */
.rb-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 50px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 8px;
}

.rb-topbar-left,
.rb-topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rb-back {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--c-soft);
  text-decoration: none;
  transition: color 0.15s;
}
.rb-back:hover {
  color: var(--c-text);
}

.rb-divider {
  color: var(--c-border);
  font-size: 14px;
  user-select: none;
}

.rb-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14.5px;
  letter-spacing: -0.2px;
}

.rb-badge {
  font-size: 10.5px;
  color: var(--c-soft);
  background: #f0f0ee;
  padding: 2px 8px;
  border-radius: 100px;
}

.rb-wordcount {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--c-soft);
  font-family: 'DM Mono', monospace;
}

.rb-btn-ai,
.rb-btn-print {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: var(--radius);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  font-family: 'DM Sans', sans-serif;
}

.rb-btn-ai {
  background: var(--c-ai);
  color: white;
}
.rb-btn-ai:hover {
  background: var(--c-ai-h);
}

.rb-btn-print {
  background: var(--c-surface);
  color: var(--c-text);
  border: 1px solid var(--c-border);
}
.rb-btn-print:hover {
  background: var(--c-bg);
}

/* ── Layout ─────────────────────────────────────────────────────────────── */
.rb-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 50px);
}

/* ── Editor ─────────────────────────────────────────────────────────────── */
.rb-editor {
  width: 340px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border-right: 1px solid var(--c-border);
  flex-shrink: 0;
}

.rb-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--c-border);
  gap: 8px;
}

.rb-panel-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: var(--c-soft);
}

.rb-toolbar-btns {
  display: flex;
  gap: 2px;
}

.rb-tool {
  width: 26px;
  height: 26px;
  border: 1px solid var(--c-border);
  background: transparent;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  color: var(--c-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.12s,
    border-color 0.12s;
  font-family: 'DM Mono', monospace;
}
.rb-tool:hover {
  background: var(--c-bg);
  border-color: #ccc;
}
.rb-tool-italic {
  font-style: italic;
  font-weight: 400;
}

.rb-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  border: none;
  outline: none;
  padding: 14px 14px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  line-height: 1.75;
  color: var(--c-text);
  background: transparent;
  overflow-y: auto;
  min-height: 120px;
}

/* ── Preview ─────────────────────────────────────────────────────────────── */
.rb-preview {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  background: var(--c-print-bg);
  display: flex;
  justify-content: center;
}

.rb-sheet {
  background: white;
  width: 794px;
  max-width: 100%;
  min-height: 1123px;
  padding: 60px 68px;
  box-shadow: var(--shadow);
  border-radius: 2px;
}

/* ── Resume Typography ────────────────────────────────────────────────────── */
.rb-resume-content :deep(h1) {
  font-family: 'Instrument Serif', serif;
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -0.4px;
  margin: 0 0 4px;
  line-height: 1.2;
  color: #0f0f0f;
}

.rb-resume-content :deep(h2) {
  font-family: 'DM Sans', sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: var(--c-soft);
  margin: 24px 0 8px;
  padding-bottom: 5px;
  border-bottom: 1.5px solid var(--c-border);
}

.rb-resume-content :deep(h3) {
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  margin: 14px 0 2px;
  color: #0f0f0f;
}

.rb-resume-content :deep(p) {
  font-size: 12.5px;
  line-height: 1.7;
  color: #2d2d2d;
  margin: 3px 0;
}

.rb-resume-content :deep(strong) {
  font-weight: 600;
  color: #111;
}

.rb-resume-content :deep(em) {
  font-style: italic;
  color: var(--c-soft);
  font-size: 12px;
}

.rb-resume-content :deep(ul) {
  margin: 4px 0 6px;
  padding-left: 0;
  list-style: none;
}

.rb-resume-content :deep(li) {
  font-size: 12.5px;
  line-height: 1.65;
  color: #2d2d2d;
  padding-left: 14px;
  position: relative;
  margin-bottom: 3px;
}

.rb-resume-content :deep(li)::before {
  content: '–';
  position: absolute;
  left: 0;
  color: #bbb;
  font-weight: 300;
}

.rb-resume-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--c-border);
  margin: 16px 0;
}

.rb-resume-content :deep(code) {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  background: #f4f4f2;
  padding: 1px 5px;
  border-radius: 3px;
  color: #444;
}

.rb-resume-content :deep(a) {
  color: var(--c-ai);
  text-decoration: none;
}

/* ── AI Panel ───────────────────────────────────────────────────────────── */
.rb-ai-panel {
  width: 290px;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border-left: 1px solid var(--c-border);
  flex-shrink: 0;
  overflow-y: auto;
}

.rb-ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px 10px;
  border-bottom: 1px solid var(--c-border);
}

.rb-ai-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-ai);
}

.rb-ai-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-radius: 4px;
  transition: background 0.12s;
}
.rb-ai-close:hover {
  background: var(--c-bg);
}

.rb-ai-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 10px 14px 0;
  padding: 8px 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius);
  font-size: 11px;
  color: #92400e;
  line-height: 1.5;
}

.rb-section-label {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--c-soft);
  margin: 0 0 7px;
}

.rb-quick-section {
  padding: 13px 14px 10px;
  border-bottom: 1px solid var(--c-border);
}

.rb-quick-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  padding: 7px 9px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  color: var(--c-text);
  margin-bottom: 5px;
  transition: all 0.12s;
}
.rb-quick-btn:hover:not(:disabled) {
  background: var(--c-bg);
  border-color: #bbb;
}
.rb-quick-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.rb-quick-icon {
  font-size: 14px;
}

.rb-quick-arrow {
  margin-left: auto;
  color: #bbb;
  flex-shrink: 0;
}

.rb-custom-section {
  padding: 11px 14px;
  border-bottom: 1px solid var(--c-border);
}

.rb-prompt-row {
  display: flex;
  gap: 6px;
}

.rb-prompt-input {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  font-size: 12px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border 0.15s;
  background: var(--c-surface);
  color: var(--c-text);
}
.rb-prompt-input:focus {
  border-color: var(--c-ai);
}

.rb-prompt-send {
  width: 32px;
  height: 32px;
  background: var(--c-ai);
  color: white;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s;
}
.rb-prompt-send:hover:not(:disabled) {
  background: var(--c-ai-h);
}
.rb-prompt-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rb-ai-result {
  padding: 13px 14px;
  flex: 1;
}

.rb-ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 11px;
  padding: 24px 0;
  color: var(--c-soft);
  font-size: 12.5px;
}

.rb-dots {
  display: flex;
  gap: 5px;
}

.rb-dots span {
  width: 6px;
  height: 6px;
  background: var(--c-ai);
  border-radius: 50%;
  animation: rb-bounce 1.2s infinite ease-in-out;
}
.rb-dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.rb-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes rb-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.65);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.rb-ai-error {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 10px 11px;
  border-radius: var(--radius);
  line-height: 1.55;
}

.rb-ai-suggestion {
  background: #f8faff;
  border: 1px solid #c7d9fc;
  border-radius: 8px;
  overflow: hidden;
}

.rb-suggestion-text {
  padding: 11px 13px;
  font-size: 12px;
  line-height: 1.7;
  color: #2d2d2d;
  white-space: pre-wrap;
  max-height: 260px;
  overflow-y: auto;
}

.rb-suggestion-actions {
  display: flex;
  gap: 6px;
  padding: 9px 11px;
  border-top: 1px solid #dbeafe;
  background: #eff6ff;
}

.rb-sug-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px;
  font-size: 11.5px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.12s;
}

.rb-sug-apply {
  background: var(--c-ai);
  color: white;
}
.rb-sug-apply:hover {
  background: var(--c-ai-h);
}
.rb-sug-copy {
  background: white;
  color: var(--c-text);
  border: 1px solid #d1d5db;
}
.rb-sug-copy:hover {
  background: #f9fafb;
}

.rb-ai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 30px 0;
  color: #aaa;
  font-size: 12px;
  text-align: center;
  line-height: 1.6;
}

/* ── Transition ─────────────────────────────────────────────────────────── */
.rb-slide-enter-active,
.rb-slide-leave-active {
  transition: all 0.2s ease;
}
.rb-slide-enter-from,
.rb-slide-leave-to {
  transform: translateX(16px);
  opacity: 0;
}

/* ── Print ──────────────────────────────────────────────────────────────── */
@media print {
  .no-print {
    display: none !important;
  }

  .rb-app,
  .rb-layout,
  .rb-preview {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
    background: white !important;
    padding: 0 !important;
  }

  .rb-sheet {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-height: auto !important;
  }
}

/* ── Scrollbar ──────────────────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

/* ── Responsive mobile ──────────────────────────────────────────────────── */
@media (max-width: 700px) {
  .rb-layout {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }
  .rb-editor {
    width: 100%;
    min-width: 0;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--c-border);
  }
  .rb-preview {
    padding: 16px 8px;
  }
  .rb-sheet {
    padding: 28px 20px;
  }
  .rb-ai-panel {
    width: 100%;
    min-width: 0;
    border-left: none;
    border-top: 1px solid var(--c-border);
  }
  .rb-logo {
    display: none;
  }
}

/* ── API Key button (topbar) ────────────────────────────────────────────── */
.rb-btn-key {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-surface);
  cursor: pointer;
  color: var(--c-soft);
  transition: all 0.15s;
}
.rb-btn-key:hover {
  background: var(--c-bg);
  color: var(--c-text);
  border-color: #bbb;
}
.rb-btn-key--active {
  border-color: #10b981;
  color: #10b981;
}

.rb-key-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.rb-key-dot--on {
  background: #10b981;
}
.rb-key-dot--off {
  background: #f59e0b;
}

/* ── API Key bar (ai panel) ─────────────────────────────────────────────── */
.rb-ai-key-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 10px 14px 0;
  padding: 8px 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-bg);
  font-size: 11.5px;
}

.rb-key-active {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #10b981;
  font-weight: 500;
}

.rb-key-missing {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f59e0b;
  font-weight: 500;
}

.rb-key-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border: 1px solid var(--c-border);
  border-radius: 4px;
  background: var(--c-surface);
  font-size: 11px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  color: var(--c-text);
  transition: all 0.12s;
  white-space: nowrap;
}
.rb-key-btn:hover {
  background: var(--c-ai);
  color: white;
  border-color: var(--c-ai);
}

/* ── Model selector bar ─────────────────────────────────────────────────── */
.rb-model-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 6px 14px 0;
  padding: 6px 10px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  background: var(--c-bg);
  font-size: 11.5px;
  color: var(--c-text-soft);
}

.rb-model-select {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11.5px;
  font-family: 'DM Sans', sans-serif;
  color: var(--c-text);
  cursor: pointer;
}

/* ── Modal ──────────────────────────────────────────────────────────────── */
.rb-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.rb-modal {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.rb-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--c-border);
}

.rb-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
}

.rb-modal-body {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rb-modal-desc {
  font-size: 12.5px;
  color: var(--c-soft);
  line-height: 1.6;
  margin: 0;
}

.rb-modal-desc strong {
  color: var(--c-text);
}

.rb-modal-desc code {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  background: #f4f4f2;
  padding: 1px 5px;
  border-radius: 3px;
}

.rb-modal-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--c-ai);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.15s;
}
.rb-modal-link:hover {
  opacity: 0.75;
}

.rb-modal-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--c-soft);
}

.rb-modal-input-row {
  display: flex;
  gap: 8px;
}

.rb-modal-input {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  font-size: 13px;
  font-family: 'DM Mono', monospace;
  outline: none;
  transition: border 0.15s;
  background: var(--c-surface);
  color: var(--c-text);
}
.rb-modal-input:focus {
  border-color: var(--c-ai);
}

.rb-modal-current {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #10b981;
  font-family: 'DM Mono', monospace;
}

.rb-modal-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px solid var(--c-border);
}

.rb-modal-btn {
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.12s;
}

.rb-modal-btn--primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--c-ai);
  color: white;
}
.rb-modal-btn--primary:hover:not(:disabled) {
  background: var(--c-ai-h);
}
.rb-modal-btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.rb-modal-btn--ghost {
  background: transparent;
  color: var(--c-soft);
  border: 1px solid var(--c-border);
}
.rb-modal-btn--ghost:hover {
  background: var(--c-bg);
}

.rb-modal-btn--danger {
  background: transparent;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.rb-modal-btn--danger:hover {
  background: #fef2f2;
}

/* ── Fade transition ────────────────────────────────────────────────────── */
.rb-fade-enter-active,
.rb-fade-leave-active {
  transition: opacity 0.18s ease;
}
.rb-fade-enter-from,
.rb-fade-leave-to {
  opacity: 0;
}
</style>
