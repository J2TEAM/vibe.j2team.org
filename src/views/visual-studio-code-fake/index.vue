<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'

// ── Types ───────────────────────────────────────────────────────────────────
type TabId = 'html' | 'css' | 'js'

interface FileTab {
  id: TabId
  label: string
  ext: string
  colorClass: string
  bgClass: string
}

const tabs: FileTab[] = [
  {
    id: 'html',
    label: 'index.html',
    ext: 'HTML',
    colorClass: 'text-accent-coral',
    bgClass: 'bg-accent-coral',
  },
  {
    id: 'css',
    label: 'style.css',
    ext: 'CSS',
    colorClass: 'text-accent-sky',
    bgClass: 'bg-accent-sky',
  },
  {
    id: 'js',
    label: 'script.js',
    ext: 'JS',
    colorClass: 'text-accent-amber',
    bgClass: 'bg-accent-amber',
  },
]

// ── State ───────────────────────────────────────────────────────────────────
const activeTab = ref<TabId>('html')
const showPreview = ref(false)
const sidebarOpen = ref(true)

const htmlCode = ref(`<div class="container">
  <h1>Hello J2TEAM 👋</h1>
  <p>Chào mừng đến với Visual Studio Code Fake!</p>
  <button id="btn">Bấm vào đây</button>
  <p id="counter">Số lần bấm: 0</p>
</div>`)

const cssCode = ref(`* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #f0ede6;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #ff6b4a, #ffb830);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #8b9db5;
  margin-bottom: 1rem;
}

button {
  padding: 0.75rem 2rem;
  border: 2px solid #ff6b4a;
  background: transparent;
  color: #ff6b4a;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover {
  background: #ff6b4a;
  color: #0f172a;
}

#counter {
  margin-top: 1rem;
  font-size: 1.25rem;
  color: #ffb830;
}`)

const jsCode = ref(`let count = 0;
const btn = document.getElementById('btn');
const counter = document.getElementById('counter');

btn.addEventListener('click', () => {
  count++;
  counter.textContent = 'Số lần bấm: ' + count;
});`)

// ── Refs ────────────────────────────────────────────────────────────────────
const gutterRef = ref<HTMLElement>()
const htmlRef = ref<HTMLTextAreaElement>()
const cssRef = ref<HTMLTextAreaElement>()
const jsRef = ref<HTMLTextAreaElement>()

// ── Cursor Position ─────────────────────────────────────────────────────────
const cursorLine = ref(1)
const cursorCol = ref(1)

function updateCursor(event: Event) {
  const ta = event.target as HTMLTextAreaElement
  const text = ta.value.substring(0, ta.selectionStart)
  const lines = text.split('\n')
  cursorLine.value = lines.length
  cursorCol.value = (lines[lines.length - 1]?.length ?? 0) + 1
}

// ── Line Numbers ────────────────────────────────────────────────────────────
const lineCount = computed(() => {
  const code =
    activeTab.value === 'html'
      ? htmlCode.value
      : activeTab.value === 'css'
        ? cssCode.value
        : jsCode.value
  return code.split('\n').length
})

function syncScroll(event: Event) {
  if (gutterRef.value) {
    gutterRef.value.scrollTop = (event.target as HTMLTextAreaElement).scrollTop
  }
}

// Sync gutter when switching tabs
watch(activeTab, () => {
  nextTick(() => {
    const ta =
      activeTab.value === 'html'
        ? htmlRef.value
        : activeTab.value === 'css'
          ? cssRef.value
          : jsRef.value
    if (gutterRef.value && ta) {
      gutterRef.value.scrollTop = ta.scrollTop
      // Update cursor for new tab
      const text = ta.value.substring(0, ta.selectionStart)
      const lines = text.split('\n')
      cursorLine.value = lines.length
      cursorCol.value = (lines[lines.length - 1]?.length ?? 0) + 1
    }
  })
})

// ── Tab Indentation ─────────────────────────────────────────────────────────
function handleTab(event: KeyboardEvent) {
  const textarea = event.target as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const spaces = '  '

  const codeRef =
    activeTab.value === 'html' ? htmlCode : activeTab.value === 'css' ? cssCode : jsCode
  codeRef.value = value.substring(0, start) + spaces + value.substring(end)

  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = start + spaces.length
  })
}

// ── Combined textarea event handler ─────────────────────────────────────────
function handleTextareaEvent(event: Event) {
  syncScroll(event)
  updateCursor(event)
}

// ── Live Preview ────────────────────────────────────────────────────────────
const srcDoc = computed(() => {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${cssCode.value}</style>
</head>
<body>
${htmlCode.value}
<script>${jsCode.value}<${'/'}script>
</body>
</html>`
})

// ── Active tab info helpers ─────────────────────────────────────────────────
const activeTabInfo = computed(() => tabs.find((t) => t.id === activeTab.value))

const languageLabel = computed(() => {
  switch (activeTab.value) {
    case 'html':
      return 'HTML'
    case 'css':
      return 'CSS'
    case 'js':
      return 'JavaScript'
    default:
      return 'Unknown'
  }
})
</script>

<template>
  <div class="flex h-dvh flex-col bg-bg-deep text-text-primary font-body overflow-hidden">
    <!-- ══════════════════════════════════════════════════════════════════════
         TITLE BAR — VS Code window chrome
         ══════════════════════════════════════════════════════════════════════ -->
    <header
      class="titlebar flex items-center border-b border-border-default bg-bg-surface shrink-0 select-none"
    >
      <!-- Left: VS Code icon + menus -->
      <div class="flex items-center gap-0.5 pl-2">
        <!-- VS Code-style logo -->
        <div class="flex items-center justify-center size-7">
          <svg class="size-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M17.58 2L8.77 10.28 4.15 6.77 2 7.87v8.26l2.15 1.1 4.62-3.51L17.58 22 22 20.17V3.83L17.58 2zM4 14.55V9.45L6.6 12 4 14.55zm13.58 4.58l-7.24-5.58L17.58 8v11.13z"
              fill="#38BDF8"
            />
          </svg>
        </div>
        <!-- Menu items — decorative -->
        <div class="hidden lg:flex items-center">
          <span class="titlebar-menu">File</span>
          <span class="titlebar-menu">Edit</span>
          <span class="titlebar-menu">Selection</span>
          <span class="titlebar-menu">View</span>
          <span class="titlebar-menu hidden xl:block">Terminal</span>
          <span class="titlebar-menu hidden xl:block">Help</span>
        </div>
      </div>

      <!-- Center: Window title -->
      <div class="flex-1 text-center">
        <span class="text-[11px] text-text-secondary truncate">
          {{ activeTabInfo?.label }} — mini-editor — Visual Studio Code Fake
        </span>
      </div>

      <!-- Right: Actions + window buttons -->
      <div class="flex items-center gap-1 pr-1">
        <!-- Mobile preview toggle -->
        <button
          class="flex items-center gap-1 px-2 py-1 text-[11px] transition lg:hidden"
          :class="
            showPreview
              ? 'text-accent-coral bg-accent-coral/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
          "
          @click="showPreview = !showPreview"
        >
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ showPreview ? 'Code' : 'Preview' }}
        </button>
        <!-- Home link -->
        <RouterLink
          to="/"
          class="flex items-center gap-1 px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition"
          title="Về trang chủ"
        >
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span class="hidden sm:inline">Trang chủ</span>
        </RouterLink>
        <!-- Window control dots (decorative) -->
        <div class="hidden lg:flex items-center ml-2 gap-2">
          <button class="titlebar-btn hover:bg-bg-elevated">
            <svg class="size-3.5" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button class="titlebar-btn hover:bg-bg-elevated">
            <svg
              class="size-3.5"
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
              stroke-width="2"
            >
              <rect x="5" y="5" width="14" height="14" rx="0" />
            </svg>
          </button>
          <button class="titlebar-btn hover:bg-[#c42b1c]">
            <svg class="size-3.5" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════════════════════════════
         MAIN AREA
         ══════════════════════════════════════════════════════════════════════ -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- ── Activity Bar (Desktop) ─────────────────────────────────────── -->
      <nav
        class="hidden lg:flex flex-col items-center shrink-0 w-12 bg-bg-surface border-r border-border-default"
      >
        <div class="flex flex-col items-center w-full pt-0.5 gap-0.5 flex-1">
          <!-- Explorer (active) -->
          <button class="activity-icon active" title="Explorer" @click="sidebarOpen = !sidebarOpen">
            <svg
              class="size-[22px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </button>
          <!-- Search -->
          <button class="activity-icon" title="Search">
            <svg
              class="size-[22px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <!-- Source Control -->
          <button class="activity-icon" title="Source Control">
            <svg
              class="size-[22px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 01-9 9" />
            </svg>
          </button>
          <!-- Extensions -->
          <button class="activity-icon" title="Extensions">
            <svg
              class="size-[22px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>
        <!-- Bottom: Settings -->
        <div class="flex flex-col items-center w-full pb-1">
          <button class="activity-icon" title="Settings">
            <svg
              class="size-[22px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </button>
        </div>
      </nav>

      <!-- ── Explorer Sidebar (Desktop) ─────────────────────────────────── -->
      <aside
        v-show="sidebarOpen"
        class="hidden lg:flex flex-col shrink-0 w-52 bg-bg-surface border-r border-border-default overflow-hidden"
      >
        <!-- Sidebar Title -->
        <div class="flex items-center justify-between px-4 h-9 shrink-0">
          <span class="text-[11px] font-medium tracking-wider text-text-secondary uppercase"
            >Explorer</span
          >
          <button class="text-text-dim hover:text-text-primary transition p-0.5">
            <svg
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        <!-- Open Editors Section -->
        <div class="border-t border-border-default">
          <button
            class="flex items-center gap-1 w-full px-2 py-1 text-[11px] font-semibold tracking-wide text-text-secondary uppercase hover:text-text-primary"
          >
            <svg class="size-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4 2l4 4-4 4V2z" />
            </svg>
            Open Editors
          </button>
          <div class="pl-4">
            <button
              v-for="tab in tabs"
              :key="'oe-' + tab.id"
              class="flex items-center gap-2 w-full px-2 py-0.5 text-[12px] hover:bg-bg-elevated transition-colors"
              :class="
                activeTab === tab.id ? 'text-text-primary bg-bg-elevated' : 'text-text-secondary'
              "
              @click="activeTab = tab.id"
            >
              <span class="size-1.5 rounded-full shrink-0" :class="tab.bgClass" />
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Project Tree Section -->
        <div class="border-t border-border-default mt-1">
          <button
            class="flex items-center gap-1 w-full px-2 py-1 text-[11px] font-semibold tracking-wide text-text-secondary uppercase hover:text-text-primary"
          >
            <svg class="size-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 3l4 4-4 4V3z" transform="rotate(90 6 6)" />
            </svg>
            Mini-Editor
          </button>
          <div class="pl-2">
            <!-- src folder -->
            <div class="flex items-center gap-1.5 px-2 py-0.5 text-[12px] text-text-secondary">
              <svg
                class="size-3.5 text-accent-amber/70 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M3 7V5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                />
              </svg>
              <span>src</span>
            </div>
            <!-- Files inside src -->
            <div class="pl-4">
              <button
                v-for="tab in tabs"
                :key="'tree-' + tab.id"
                class="flex items-center gap-1.5 w-full px-2 py-0.5 text-[12px] hover:bg-bg-elevated transition-colors"
                :class="
                  activeTab === tab.id
                    ? 'text-text-primary bg-bg-elevated/50'
                    : 'text-text-secondary'
                "
                @click="activeTab = tab.id"
              >
                <span class="size-1.5 rounded-full shrink-0" :class="tab.bgClass" />
                {{ tab.label }}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- ── Editor + Preview Area ──────────────────────────────────────── -->
      <div class="flex flex-1 min-h-0 min-w-0 flex-col lg:flex-row">
        <!-- ─── Editor Panel ─────────────────────────────────────────────── -->
        <div
          class="flex flex-1 min-h-0 min-w-0 flex-col"
          :class="showPreview ? 'hidden lg:flex' : 'flex'"
        >
          <!-- Editor Tab Bar -->
          <div class="tab-bar flex items-end shrink-0 bg-bg-surface overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="'tab-' + tab.id"
              class="editor-tab group"
              :class="activeTab === tab.id ? 'active' : 'inactive'"
              @click="activeTab = tab.id"
            >
              <span class="size-1.5 rounded-full shrink-0" :class="tab.bgClass" />
              <span class="truncate">{{ tab.label }}</span>
              <!-- Close icon (decorative) -->
              <span class="editor-tab-close">
                <svg class="size-3.5" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="8" x2="16" y2="16" />
                  <line x1="16" y1="8" x2="8" y2="16" />
                </svg>
              </span>
            </button>
          </div>

          <!-- Mobile Tab Bar (phones only — replaces sidebar) -->
          <div class="flex lg:hidden border-b border-border-default bg-bg-surface overflow-x-auto">
            <button
              v-for="tab in tabs"
              :key="'mtab-' + tab.id"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap transition-colors relative shrink-0"
              :class="activeTab === tab.id ? 'text-text-primary' : 'text-text-secondary'"
              @click="activeTab = tab.id"
            >
              <span class="size-1.5 rounded-full shrink-0" :class="tab.bgClass" />
              {{ tab.label }}
              <span
                v-if="activeTab === tab.id"
                class="absolute bottom-0 inset-x-0 h-px bg-accent-coral"
              />
            </button>
          </div>

          <!-- Breadcrumbs -->
          <div
            class="hidden lg:flex items-center gap-1 px-3 h-[22px] shrink-0 bg-bg-deep border-b border-border-default text-[11px] text-text-dim"
          >
            <span>src</span>
            <svg class="size-3 text-text-dim/50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 4l8 8-8 8" />
            </svg>
            <span :class="activeTabInfo?.colorClass">{{ activeTabInfo?.label }}</span>
          </div>

          <!-- Editor Body: Gutter + Textarea -->
          <div class="flex flex-1 min-h-0 overflow-hidden">
            <!-- Line Numbers Gutter -->
            <div
              ref="gutterRef"
              class="gutter shrink-0 select-none overflow-hidden hidden sm:block"
            >
              <div
                v-for="n in lineCount"
                :key="n"
                class="gutter-line"
                :class="n === cursorLine ? 'text-text-secondary' : 'text-text-dim'"
              >
                {{ n }}
              </div>
            </div>

            <!-- Textareas -->
            <div class="relative flex-1 min-w-0 overflow-hidden">
              <textarea
                v-show="activeTab === 'html'"
                ref="htmlRef"
                v-model="htmlCode"
                class="editor-textarea"
                spellcheck="false"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                placeholder="Viết HTML tại đây..."
                @keydown.tab.prevent="handleTab"
                @scroll="handleTextareaEvent"
                @click="updateCursor"
                @keyup="updateCursor"
                @input="handleTextareaEvent"
              />
              <textarea
                v-show="activeTab === 'css'"
                ref="cssRef"
                v-model="cssCode"
                class="editor-textarea"
                spellcheck="false"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                placeholder="Viết CSS tại đây..."
                @keydown.tab.prevent="handleTab"
                @scroll="handleTextareaEvent"
                @click="updateCursor"
                @keyup="updateCursor"
                @input="handleTextareaEvent"
              />
              <textarea
                v-show="activeTab === 'js'"
                ref="jsRef"
                v-model="jsCode"
                class="editor-textarea"
                spellcheck="false"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                placeholder="Viết JavaScript tại đây..."
                @keydown.tab.prevent="handleTab"
                @scroll="handleTextareaEvent"
                @click="updateCursor"
                @keyup="updateCursor"
                @input="handleTextareaEvent"
              />
            </div>

            <!-- Minimap placeholder (decorative) -->
            <div
              class="hidden xl:block w-[60px] shrink-0 bg-bg-deep border-l border-border-default/30 overflow-hidden"
            >
              <div class="mt-4 mx-1.5 space-y-0.5 opacity-20">
                <div
                  v-for="n in 25"
                  :key="'mm-' + n"
                  class="h-[2px] rounded-full"
                  :class="
                    n % 3 === 0
                      ? 'bg-accent-coral/40 w-3/4'
                      : n % 5 === 0
                        ? 'bg-accent-sky/30 w-1/2'
                        : 'bg-text-dim/40'
                  "
                  :style="{ width: 20 + Math.sin(n) * 40 + 30 + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Resize Handle (Desktop) ──────────────────────────────────── -->
        <div
          class="hidden lg:block w-px bg-border-default shrink-0 cursor-col-resize hover:bg-accent-sky/50 transition-colors"
        />

        <!-- ─── Preview Panel ─────────────────────────────────────────────── -->
        <div
          class="flex flex-1 min-h-0 min-w-0 flex-col"
          :class="showPreview ? 'flex' : 'hidden lg:flex'"
        >
          <!-- Preview Tab Bar -->
          <div
            class="flex items-center justify-between border-b border-border-default bg-bg-surface shrink-0"
          >
            <div class="flex items-center">
              <div
                class="flex items-center gap-2 px-3 h-[35px] text-xs text-text-secondary border-b border-text-secondary"
              >
                <svg
                  class="size-3.5 text-accent-sky"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path
                    d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                  />
                </svg>
                Preview
              </div>
            </div>
            <!-- Browser dots -->
            <div class="flex items-center gap-1.5 pr-3">
              <span
                class="size-2.5 rounded-full bg-accent-coral/30 border border-accent-coral/20"
              />
              <span
                class="size-2.5 rounded-full bg-accent-amber/30 border border-accent-amber/20"
              />
              <span class="size-2.5 rounded-full bg-green-400/30 border border-green-400/20" />
            </div>
          </div>

          <!-- URL Bar (decorative) -->
          <div
            class="hidden lg:flex items-center gap-2 px-3 py-1 bg-bg-deep border-b border-border-default shrink-0"
          >
            <div class="flex items-center gap-1 text-text-dim">
              <svg
                class="size-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <svg
                class="size-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <svg
                class="size-3 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M1 20V14a4 4 0 014-4h14l4-4" />
              </svg>
            </div>
            <div
              class="flex-1 flex items-center gap-1.5 bg-bg-surface/50 border border-border-default px-2 py-0.5 text-[11px] text-text-dim"
            >
              <svg
                class="size-2.5 text-green-400/60 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              localhost:5173/preview
            </div>
          </div>

          <!-- iframe -->
          <div class="flex-1 min-h-0 bg-white">
            <iframe
              :srcdoc="srcDoc"
              class="size-full border-0"
              sandbox="allow-scripts"
              title="Preview"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         STATUS BAR — VS Code footer
         ══════════════════════════════════════════════════════════════════════ -->
    <footer
      class="statusbar flex items-center justify-between border-t border-border-default shrink-0 select-none"
    >
      <!-- Left cluster -->
      <div class="flex items-center h-full">
        <!-- Remote indicator -->
        <div
          class="flex items-center gap-1 h-full px-2 bg-accent-sky/15 text-accent-sky text-[11px]"
        >
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <!-- Branch -->
        <button class="statusbar-item">
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 01-9 9" />
          </svg>
          main
        </button>
        <!-- Errors / Warnings -->
        <button class="statusbar-item">
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          0
          <svg
            class="size-3.5 ml-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          0
        </button>
      </div>

      <!-- Right cluster -->
      <div class="flex items-center h-full">
        <button class="statusbar-item">Ln {{ cursorLine }}, Col {{ cursorCol }}</button>
        <button class="statusbar-item">Spaces: 2</button>
        <button class="statusbar-item">UTF-8</button>
        <button class="statusbar-item" :class="activeTabInfo?.colorClass">
          {{ languageLabel }}
        </button>
        <!-- Notifications -->
        <button class="statusbar-item pr-3">
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Title Bar ─────────────────────────────────────────────────────────────── */
.titlebar {
  height: 30px;
  min-height: 30px;
}

.titlebar-menu {
  font-size: 12px;
  padding: 2px 8px;
  color: #8b9db5;
  cursor: default;
  transition:
    color 0.15s,
    background-color 0.15s;
}
.titlebar-menu:hover {
  color: #f0ede6;
  background-color: #1e2f42;
}

.titlebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 22px;
  color: #8b9db5;
  transition:
    color 0.15s,
    background-color 0.15s;
}
.titlebar-btn:hover {
  color: #f0ede6;
}

/* ── Activity Bar ──────────────────────────────────────────────────────────── */
.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: #4a6180;
  transition: color 0.15s;
  position: relative;
}
.activity-icon:hover {
  color: #f0ede6;
}
.activity-icon.active {
  color: #f0ede6;
}
.activity-icon.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 25%;
  bottom: 25%;
  width: 2px;
  background-color: #f0ede6;
  border-radius: 0 1px 1px 0;
}

/* ── Editor Tabs ───────────────────────────────────────────────────────────── */
.tab-bar {
  height: 35px;
  min-height: 35px;
  border-bottom: 1px solid #253549;
}

.editor-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 35px;
  font-size: 12px;
  white-space: nowrap;
  transition: background-color 0.15s;
  position: relative;
  border-right: 1px solid #253549;
}
.editor-tab.active {
  color: #f0ede6;
  background-color: #0f1923;
}
.editor-tab.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #ff6b4a;
}
.editor-tab.inactive {
  color: #8b9db5;
  background-color: #162232;
}
.editor-tab.inactive:hover {
  background-color: #1e2f42;
}

.editor-tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  color: transparent;
  transition:
    color 0.15s,
    background-color 0.15s;
}
.editor-tab:hover .editor-tab-close,
.editor-tab.active .editor-tab-close {
  color: #8b9db5;
}
.editor-tab-close:hover {
  color: #f0ede6 !important;
  background-color: #1e2f42;
}

/* ── Line Numbers Gutter ───────────────────────────────────────────────────── */
.gutter {
  width: 60px;
  background-color: #0f1923;
  border-right: 1px solid #253549;
  padding-top: 10px;
  padding-bottom: 10px;
}

.gutter-line {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 20px;
  height: 20px;
  text-align: right;
  padding-right: 16px;
  padding-left: 8px;
}

/* ── Editor Textarea ───────────────────────────────────────────────────────── */
.editor-textarea {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  outline: none;
  padding: 10px 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 20px;
  tab-size: 2;
  color: #f0ede6;
  background-color: #0f1923;
  caret-color: #ff6b4a;
  white-space: pre;
  overflow: auto;
}

.editor-textarea::placeholder {
  color: #4a6180;
}

.editor-textarea::selection {
  background-color: rgba(56, 189, 248, 0.18);
}

/* ── Status Bar ────────────────────────────────────────────────────────────── */
.statusbar {
  height: 22px;
  min-height: 22px;
  background-color: #162232;
}

.statusbar-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  height: 100%;
  font-size: 11px;
  color: #8b9db5;
  white-space: nowrap;
  transition: background-color 0.15s;
}
.statusbar-item:hover {
  background-color: #1e2f42;
}

/* ── Scrollbars (VS Code style) ────────────────────────────────────────────── */
.editor-textarea::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.editor-textarea::-webkit-scrollbar-track {
  background: transparent;
}
.editor-textarea::-webkit-scrollbar-thumb {
  background: rgba(37, 53, 73, 0.6);
  border-radius: 0;
}
.editor-textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 97, 128, 0.6);
}
.editor-textarea::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
