<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4">
    <!-- Header -->
    <header class="w-full max-w-7xl mx-auto flex items-center justify-between py-6">
      <RouterLink
        to="/"
        class="flex items-center gap-2 text-text-dim hover:text-accent-coral transition-colors font-display text-xs tracking-wider"
      >
        <Icon icon="ph:arrow-left-bold" width="16" />
        <span>J2TEAM</span>
      </RouterLink>
      <div class="font-display text-3xl font-bold text-text-primary">
        <span class="text-text-dim">/</span>db<span class="text-accent-coral">diagram</span>
        <span class="text-accent-coral animate-pulse">_</span>
      </div>
      <div class="flex items-center gap-2 text-xs font-display tracking-wide text-text-dim">
        <span class="rx-dot" :class="parseStatus"></span>
        <span class="uppercase">{{ parseStatusText }}</span>
      </div>
    </header>

    <main class="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-16">
      <!-- AI Panel -->
      <section
        class="border border-border-default bg-bg-surface transition-all duration-300 animate-fade-up"
        :class="aiPanelOpen ? 'border-accent-amber/50' : 'hover:border-accent-amber/30'"
      >
        <button
          @click="aiPanelOpen = !aiPanelOpen"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-elevated transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <span
              class="font-display text-sm font-semibold text-text-primary tracking-widest uppercase"
            >
              AI Schema Generator
            </span>
            <span class="text-xs text-text-dim font-display tracking-wide">
              Gemini · OpenAI · Claude
            </span>
          </div>
          <Icon
            :icon="aiPanelOpen ? 'ph:caret-up-bold' : 'ph:caret-down-bold'"
            width="14"
            class="text-text-dim"
          />
        </button>

        <div v-if="aiPanelOpen" class="border-t border-border-default p-5 flex flex-col gap-4">
          <!-- Provider + Key -->
          <div class="flex items-center gap-3 flex-wrap">
            <div class="flex gap-1 shrink-0">
              <button
                v-for="p in aiProviders"
                :key="p.id"
                @click="aiProvider = p.id"
                class="px-3 py-1.5 border text-xs font-display font-semibold tracking-wide transition-all"
                :class="
                  aiProvider === p.id
                    ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                    : 'border-border-default text-text-dim hover:border-accent-amber/40 hover:text-text-secondary'
                "
              >
                {{ p.label }}
              </button>
            </div>
            <!-- Standard API Key -->
            <div
              class="flex-1 min-w-[220px] flex items-center border border-border-default bg-bg-deep focus-within:border-accent-amber transition-colors"
            >
              <Icon icon="ph:key-bold" width="13" class="ml-3 text-text-dim shrink-0" />
              <input
                v-model="aiApiKey"
                :type="showApiKey ? 'text' : 'password'"
                class="flex-1 bg-transparent border-none outline-none text-xs font-mono text-text-primary px-3 py-2.5 placeholder:text-text-dim/40"
                :placeholder="`${aiProviders.find((p) => p.id === aiProvider)?.label} API Key`"
              />
              <button
                @click="showApiKey = !showApiKey"
                class="px-2.5 text-text-dim hover:text-text-primary transition-colors"
              >
                <Icon :icon="showApiKey ? 'ph:eye-slash-bold' : 'ph:eye-bold'" width="13" />
              </button>
            </div>
          </div>

          <!-- Prompt + Button -->
          <div class="flex gap-3">
            <div
              class="flex-1 border border-border-default bg-bg-deep focus-within:border-accent-amber transition-colors"
            >
              <textarea
                v-model="aiPrompt"
                rows="2"
                class="w-full bg-transparent border-none outline-none text-sm text-text-primary px-4 py-3 placeholder:text-text-dim/40 resize-none font-body"
                placeholder="Mô tả schema... VD: Hệ thống thương mại điện tử với user, sản phẩm, đơn hàng, thanh toán"
              />
            </div>
            <button
              @click="generateWithAI"
              :disabled="aiLoading || !aiApiKey || !aiPrompt"
              class="px-5 border font-display text-sm font-semibold tracking-wide transition-all flex items-center gap-2 shrink-0 self-stretch disabled:opacity-40 disabled:cursor-not-allowed"
              :class="
                aiLoading
                  ? 'border-accent-amber/40 text-accent-amber/40'
                  : 'border-accent-amber text-accent-amber hover:bg-accent-amber/10'
              "
            >
              <Icon
                :icon="aiLoading ? 'ph:circle-notch-bold' : 'ph:sparkle-bold'"
                width="16"
                :class="aiLoading ? 'animate-spin' : ''"
              />
              {{ aiLoading ? 'Đang tạo...' : 'Tạo Schema' }}
            </button>
          </div>

          <p v-if="aiError" class="text-xs text-accent-coral flex items-center gap-2 font-body">
            <Icon icon="ph:warning-circle-bold" width="14" />
            {{ aiError }}
          </p>
          <p
            v-if="aiProvider === 'claude'"
            class="text-xs text-text-dim flex items-center gap-2 font-body"
          >
            <Icon icon="ph:info-bold" width="14" class="text-accent-sky shrink-0" />
            Claude API bị giới hạn CORS từ browser. Nếu gặp lỗi, hãy dùng proxy hoặc chuyển sang
            Gemini/OpenAI.
          </p>
        </div>
      </section>

      <!-- SQL Import Panel -->
      <section
        class="border border-border-default bg-bg-surface transition-all duration-300 animate-fade-up"
        :class="sqlImportOpen ? 'border-accent-sky/50' : 'hover:border-accent-sky/30'"
      >
        <button
          @click="sqlImportOpen = !sqlImportOpen"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-elevated transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
            <span
              class="font-display text-sm font-semibold text-text-primary tracking-widest uppercase"
            >
              SQL Import
            </span>
            <span class="text-xs text-text-dim font-display tracking-wide">
              MySQL · PostgreSQL · SQL Server · SQLite
            </span>
          </div>
          <Icon
            :icon="sqlImportOpen ? 'ph:caret-up-bold' : 'ph:caret-down-bold'"
            width="14"
            class="text-text-dim"
          />
        </button>

        <div v-if="sqlImportOpen" class="border-t border-border-default p-5 flex flex-col gap-4">
          <div class="flex flex-col gap-3">
            <div
              class="flex-1 border border-border-default bg-bg-deep focus-within:border-accent-sky transition-colors relative"
            >
              <textarea
                v-model="sqlImportInput"
                rows="6"
                class="w-full h-full bg-transparent border-none outline-none text-sm font-mono text-text-primary px-4 py-3 placeholder:text-text-dim/40 resize-y min-h-[120px] custom-scrollbar"
                placeholder="-- Dán lệnh CREATE TABLE, ALTER TABLE từ SQL Server, MySQL, Postgres... vào đây&#10;&#10;CREATE TABLE [dbo].[Users] (&#10;    [ID] INT IDENTITY(1,1) PRIMARY KEY,&#10;    [Username] VARCHAR(50) NOT NULL UNIQUE&#10;);"
                spellcheck="false"
              />
            </div>
            <div class="flex justify-between items-center flex-wrap gap-3">
              <span class="text-xs font-display text-text-dim flex items-center gap-2">
                <Icon icon="ph:info-bold" width="14" />
                Duyệt tự động theo cấu trúc CREATE TABLE
              </span>
              <button
                @click="parseSQLToDBML"
                :disabled="!sqlImportInput.trim()"
                class="px-5 py-2 border font-display text-sm font-semibold tracking-wide transition-all flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed border-accent-sky text-accent-sky hover:bg-accent-sky/10"
              >
                <Icon icon="ph:magic-wand-bold" width="16" />
                Chuyển thành DBML
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Grid: Editor (5) | Diagram (7) -->
      <div class="grid grid-cols-12 gap-6 items-stretch animate-fade-up">
        <!-- DBML Editor -->
        <section
          class="col-span-12 lg:col-span-5 border border-border-default bg-bg-surface flex flex-col transition-all duration-300 hover:border-accent-coral hover:shadow-lg hover:shadow-accent-coral/5"
        >
          <div
            class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-default shrink-0"
          >
            <h2
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              SCHEMA
            </h2>
            <div class="flex items-center gap-3">
              <span
                v-if="parseError"
                class="flex items-center gap-1.5 text-xs text-accent-coral font-display tracking-wide"
              >
                <Icon icon="ph:warning-circle-bold" width="13" />
                Lỗi cú pháp
              </span>
              <span v-else class="text-xs text-text-dim font-display tracking-wide">
                {{ parsedSchema.tables.length }} tables · {{ parsedSchema.refs.length }} refs
              </span>
              <button
                @click="resetToDefault"
                class="text-text-dim hover:text-accent-coral transition-colors"
                title="Reset về mặc định"
              >
                <Icon icon="ph:arrow-counter-clockwise-bold" width="15" />
              </button>
            </div>
          </div>
          <div class="flex-1 relative" style="min-height: 520px">
            <textarea
              v-model="dbmlInput"
              class="absolute inset-0 w-full h-full font-mono text-sm text-text-primary bg-transparent border-none outline-none p-5 resize-none caret-accent-coral placeholder:text-text-dim/40 custom-scrollbar leading-relaxed"
              spellcheck="false"
              autocomplete="off"
            />
          </div>
        </section>

        <!-- ER Diagram -->
        <section
          ref="diagramSection"
          class="col-span-12 lg:col-span-7 border border-border-default bg-bg-surface flex flex-col transition-all duration-300 hover:border-accent-sky overflow-hidden"
          :class="{ 'fixed inset-0 z-[100] border-none': isFullscreen }"
        >
          <div
            class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-default shrink-0"
          >
            <h2
              class="font-display text-lg font-semibold text-text-primary flex items-center gap-3"
            >
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              DIAGRAM
            </h2>
            <div class="flex items-center gap-3">
              <span class="text-xs text-text-dim font-display tracking-wide hidden sm:block">
                Kéo bảng để sắp xếp
              </span>
              <button
                @click="autoLayout"
                class="text-text-dim hover:text-accent-sky transition-colors"
                title="Tự động sắp xếp lại"
              >
                <Icon icon="ph:layout-bold" width="15" />
              </button>
              <button
                @click="toggleFullscreen"
                class="text-text-dim hover:text-accent-sky transition-colors"
                :title="isFullscreen ? 'Thoát toàn màn hình' : 'Phóng to toàn màn hình'"
              >
                <Icon
                  :icon="isFullscreen ? 'ph:corners-in-bold' : 'ph:corners-out-bold'"
                  width="15"
                />
              </button>
            </div>
          </div>

          <div
            class="flex-1 relative overflow-auto custom-scrollbar"
            :style="isFullscreen ? 'height: calc(100vh - 64px);' : 'min-height: 520px;'"
          >
            <!-- Grid background -->
            <div
              class="absolute inset-0 pointer-events-none"
              style="
                background-image:
                  linear-gradient(rgba(42, 53, 73, 0.25) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(42, 53, 73, 0.25) 1px, transparent 1px);
                background-size: 24px 24px;
              "
            ></div>

            <!-- Empty state -->
            <div
              v-if="parsedSchema.tables.length === 0"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-dim font-display text-sm"
            >
              <Icon icon="ph:graph-bold" width="36" class="opacity-30" />
              <p class="tracking-wide uppercase opacity-50">Nhập DBML để vẽ sơ đồ</p>
            </div>

            <svg
              v-else
              :width="svgSize.w"
              :height="svgSize.h"
              class="block"
              style="cursor: default"
              @mousemove="onMouseMove"
              @mouseup="onMouseUp"
              @mouseleave="onMouseUp"
            >
              <defs>
                <marker
                  id="db-arrow"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#4A6180" />
                </marker>
                <marker
                  id="db-arrow-many"
                  markerWidth="12"
                  markerHeight="8"
                  refX="11"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,1 L9,4 L0,7 M0,4" stroke="#4A6180" stroke-width="1.5" fill="none" />
                </marker>
              </defs>

              <!-- Relationship lines (rendered under tables) -->
              <g>
                <path
                  v-for="(rel, ri) in diagramRefs"
                  :key="'rel-' + ri"
                  :d="rel.path"
                  fill="none"
                  :stroke="rel.color"
                  stroke-width="1.5"
                  stroke-opacity="0.55"
                  :marker-end="`url(#${rel.marker})`"
                />
              </g>

              <!-- Tables -->
              <g
                v-for="(table, ti) in parsedSchema.tables"
                :key="'t-' + table.name"
                :transform="`translate(${tablePositions[table.name]?.x ?? 0}, ${tablePositions[table.name]?.y ?? 0})`"
                class="diagram-table"
                @mousedown="(e) => startDrag(e, table.name)"
              >
                <!-- Drop shadow -->
                <rect
                  :width="TABLE_W"
                  :height="calcTableH(table)"
                  x="3"
                  y="3"
                  fill="rgba(0,0,0,0.35)"
                />
                <!-- Table body -->
                <rect
                  :width="TABLE_W"
                  :height="calcTableH(table)"
                  fill="#162232"
                  :stroke="ACCENT_CYCLE[ti % ACCENT_CYCLE.length]"
                  stroke-width="1.5"
                />
                <!-- Header bg -->
                <rect
                  :width="TABLE_W"
                  :height="TABLE_HEADER_H"
                  :fill="ACCENT_CYCLE[ti % ACCENT_CYCLE.length]"
                  fill-opacity="0.15"
                />
                <!-- Header left bar -->
                <rect
                  width="3"
                  :height="TABLE_HEADER_H"
                  :fill="ACCENT_CYCLE[ti % ACCENT_CYCLE.length]"
                />
                <!-- Table name -->
                <text
                  x="14"
                  :y="TABLE_HEADER_H / 2 + 5"
                  font-family="'Courier New', monospace"
                  font-weight="700"
                  font-size="13"
                  :fill="ACCENT_CYCLE[ti % ACCENT_CYCLE.length]"
                >
                  {{ table.name }}
                </text>
                <!-- Row count badge -->
                <text
                  :x="TABLE_W - 10"
                  :y="TABLE_HEADER_H / 2 + 5"
                  font-family="'Courier New', monospace"
                  font-size="9"
                  fill="#4A6180"
                  text-anchor="end"
                >
                  {{ table.columns.length }} cols
                </text>

                <!-- Columns -->
                <g v-for="(col, ci) in table.columns" :key="'c-' + col.name">
                  <rect
                    :y="TABLE_HEADER_H + ci * COL_ROW_H"
                    :width="TABLE_W"
                    :height="COL_ROW_H"
                    :fill="ci % 2 === 0 ? '#0F1923' : '#162232'"
                    fill-opacity="0.85"
                  />
                  <!-- PK icon -->
                  <text
                    v-if="col.pk"
                    x="9"
                    :y="TABLE_HEADER_H + ci * COL_ROW_H + COL_ROW_H / 2 + 4"
                    font-size="9"
                    fill="#FFB830"
                  >
                    PK
                  </text>
                  <!-- FK indicator -->
                  <text
                    v-else-if="isFK(table.name, col.name)"
                    x="9"
                    :y="TABLE_HEADER_H + ci * COL_ROW_H + COL_ROW_H / 2 + 4"
                    font-size="9"
                    fill="#38BDF8"
                  >
                    FK
                  </text>
                  <!-- Column name -->
                  <text
                    :x="col.pk || isFK(table.name, col.name) ? 30 : 12"
                    :y="TABLE_HEADER_H + ci * COL_ROW_H + COL_ROW_H / 2 + 4"
                    font-family="'Courier New', monospace"
                    font-size="11"
                    :fill="col.pk ? '#FFB830' : col.unique ? '#38BDF8' : '#F0EDE6'"
                  >
                    {{ col.name }}
                  </text>
                  <!-- Type -->
                  <text
                    :x="TABLE_W - 8"
                    :y="TABLE_HEADER_H + ci * COL_ROW_H + COL_ROW_H / 2 + 4"
                    font-family="'Courier New', monospace"
                    font-size="10"
                    fill="#4A6180"
                    text-anchor="end"
                  >
                    {{ truncType(col.type) }}
                  </text>
                  <!-- Not null dot -->
                  <circle
                    v-if="col.notNull && !col.pk"
                    :cx="TABLE_W - 4"
                    :cy="TABLE_HEADER_H + ci * COL_ROW_H + COL_ROW_H / 2"
                    r="2"
                    fill="#FF6B4A"
                    fill-opacity="0.6"
                  />
                </g>
              </g>
            </svg>
          </div>
        </section>
      </div>

      <!-- SQL Export (full width) -->
      <section
        class="border border-border-default bg-bg-surface transition-all duration-300 hover:border-accent-amber hover:shadow-lg hover:shadow-accent-amber/5 animate-fade-up"
      >
        <div
          class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-default flex-wrap gap-3"
        >
          <h2 class="font-display text-lg font-semibold text-text-primary flex items-center gap-3">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            SQL EXPORT
          </h2>
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Dialect tabs -->
            <div class="flex gap-1 border border-border-default p-1 bg-bg-deep">
              <button
                v-for="d in sqlDialects"
                :key="d.id"
                @click="activeDialect = d.id"
                class="px-3 py-1 text-[11px] font-display font-semibold transition-colors"
                :class="
                  activeDialect === d.id
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-dim hover:text-text-secondary'
                "
              >
                {{ d.label }}
              </button>
            </div>
            <!-- Copy -->
            <button
              @click="copySql"
              class="flex items-center gap-1.5 px-3 py-1.5 border text-xs font-display font-semibold transition-all"
              :class="
                sqlCopied
                  ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                  : 'border-border-default text-text-dim hover:border-text-primary hover:text-text-primary'
              "
            >
              <Icon :icon="sqlCopied ? 'ph:check-bold' : 'ph:copy'" width="13" />
              {{ sqlCopied ? 'Copied!' : 'Copy' }}
            </button>
            <!-- Download -->
            <button
              @click="downloadSql"
              class="flex items-center gap-1.5 px-3 py-1.5 border border-border-default text-xs font-display font-semibold text-text-dim hover:border-text-primary hover:text-text-primary transition-all"
            >
              <Icon icon="ph:download-simple-bold" width="13" />
              .sql
            </button>
          </div>
        </div>
        <pre
          class="font-mono text-xs text-text-primary p-5 overflow-x-auto custom-scrollbar leading-relaxed max-h-[340px]"
        ><code>{{ generatedSQL }}</code></pre>
      </section>
    </main>

    <!-- Footer -->
    <footer
      class="w-full max-w-7xl mx-auto text-center py-6 text-xs text-text-dim font-display tracking-widest border-t border-border-default mt-auto"
    >
      <span>vibe.j2team.org</span>
      <span class="mx-2">·</span>
      <span
        >by
        <a
          href="https://nguyenquocanh.io.vn/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent-coral transition-colors underline decoration-border-default hover:decoration-accent-coral underline-offset-4"
          >Nguyễn Quốc Anh</a
        >
      </span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useAiSettingsStore } from './stores/aiSettings'

// ─── Diagram constants ────────────────────────────────────────────────────────
const TABLE_W = 230
const TABLE_HEADER_H = 40
const COL_ROW_H = 28
const TABLE_GAP_X = 80
const TABLE_GAP_Y = 64
const DIAGRAM_COLS = 3
const DIAGRAM_PAD = 40

const ACCENT_CYCLE = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6', '#FF6B4A', '#FFB830']

// ─── Types ────────────────────────────────────────────────────────────────────
interface Column {
  name: string
  type: string
  pk: boolean
  notNull: boolean
  unique: boolean
  increment: boolean
  default?: string
}

interface Table {
  name: string
  columns: Column[]
}

interface Ref {
  from: string // table.col
  to: string // table.col
  type: '>' | '<' | '-' | '<>'
}

interface ParsedSchema {
  tables: Table[]
  refs: Ref[]
}

// ─── State ────────────────────────────────────────────────────────────────────
const DEFAULT_DBML = `Table users {
  id integer [pk, increment]
  username varchar(50) [not null, unique]
  email varchar(255) [not null, unique]
  avatar_url varchar(500)
  created_at timestamp
}

Table posts {
  id integer [pk, increment]
  title varchar(200) [not null]
  content text
  user_id integer [not null]
  published boolean [default: false]
  created_at timestamp
}

Table comments {
  id integer [pk, increment]
  post_id integer [not null]
  user_id integer [not null]
  body text [not null]
  created_at timestamp
}

Table tags {
  id integer [pk, increment]
  name varchar(50) [not null, unique]
  slug varchar(50) [unique]
}

Table post_tags {
  post_id integer [pk]
  tag_id integer [pk]
}

Ref: posts.user_id > users.id
Ref: comments.post_id > posts.id
Ref: comments.user_id > users.id
Ref: post_tags.post_id > posts.id
Ref: post_tags.tag_id > tags.id`

const dbmlInput = ref(DEFAULT_DBML)
const parseError = ref('')
const activeDialect = ref<'mysql' | 'postgresql' | 'sqlite' | 'sqlserver' | 'json' | 'mongodb'>(
  'mysql',
)
const sqlCopied = ref(false)

// AI Store
const aiStore = useAiSettingsStore()
const aiPanelOpen = ref(false)
const aiProvider = ref<'gemini' | 'openai' | 'claude'>('gemini')
const showApiKey = ref(false)
const aiPrompt = ref('')
const aiLoading = ref(false)
const aiError = ref('')

const aiApiKey = computed({
  get: () => aiStore.getApiKey(aiProvider.value),
  set: (val) => aiStore.setApiKey(aiProvider.value, val),
})

const aiProviders = [
  { id: 'gemini' as const, label: 'Gemini' },
  { id: 'openai' as const, label: 'OpenAI' },
  { id: 'claude' as const, label: 'Claude' },
]

const isFullscreen = ref(false)
const diagramSection = ref<HTMLElement | null>(null)

function toggleFullscreen() {
  if (!diagramSection.value) return
  if (!document.fullscreenElement) {
    diagramSection.value.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable full-screen mode: ${err.message}`)
    })
  } else {
    document.exitFullscreen()
  }
}

onMounted(() => {
  autoLayout()

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

const sqlDialects = [
  { id: 'mysql' as const, label: 'MySQL' },
  { id: 'postgresql' as const, label: 'PostgreSQL' },
  { id: 'sqlite' as const, label: 'SQLite' },
  { id: 'sqlserver' as const, label: 'SQL Server' },
  { id: 'mongodb' as const, label: 'MongoDB' },
  { id: 'json' as const, label: 'JSON (Firebase)' },
]

// SQL Import
const sqlImportOpen = ref(false)
const sqlImportInput = ref('')

// Diagram drag state
const tablePositions = reactive<Record<string, { x: number; y: number }>>({})
const dragging = ref<{ name: string; ox: number; oy: number } | null>(null)

// ─── DBML Parser ──────────────────────────────────────────────────────────────
function parseDBML(input: string): ParsedSchema {
  const tables: Table[] = []
  const refs: Ref[] = []
  parseError.value = ''

  try {
    const clean = input.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

    // Tables supporting quotes
    const tableRx = /Table\s+("[^"]+"|\w+)(?:\s+(?:as\s+("[^"]+"|\w+)|\[.*?\]))?\s*\{([^}]*)\}/gi
    let m: RegExpExecArray | null
    while ((m = tableRx.exec(clean)) !== null) {
      const name = (m[1] || '').replace(/^"|"$/g, '')
      const body = m[3] || ''
      const columns: Column[] = []

      for (const raw of body.split('\n')) {
        const line = raw.trim()
        if (!line || /^(indexes|Note|})/.test(line)) continue

        // Column syntax matching supporting quotes
        const cm = line.match(/^("[^"]+"|\w+)\s+([\w().,\s]+?)(?:\s+\[([^\]]*)\])?\s*$/)
        if (!cm) continue

        const colName = (cm[1] || '').replace(/^"|"$/g, '')
        const opts = cm[3] || ''
        const col: Column = {
          name: colName,
          type: (cm[2] || '').trim(),
          pk: /\bpk\b|\bprimary key\b/i.test(opts),
          notNull: /\bnot null\b/i.test(opts),
          unique: /\bunique\b/i.test(opts),
          increment: /\bincrement\b|auto_increment/i.test(opts),
        }

        const dm = opts.match(/default:\s*`?([^,`\]]+)`?/)
        if (dm) col.default = (dm[1] || '').trim()

        // Inline ref: [ref: > table.col]
        const rm = opts.match(/ref:\s*([<>-]|<>)\s*([\w.]+)/i)
        if (rm) {
          refs.push({
            from: `${name}.${col.name}`,
            to: rm[2] || '',
            type: (rm[1] || '') as Ref['type'],
          })
        }

        columns.push(col)
      }
      tables.push({ name, columns })
    }

    // Standalone Refs
    const refRx = /Ref(?:\s+\w+)?:\s*([\w.]+)\s*([<>-]|<>)\s*([\w.]+)/gi
    while ((m = refRx.exec(clean)) !== null) {
      refs.push({ from: m[1] || '', to: m[3] || '', type: (m[2] || '') as Ref['type'] })
    }
  } catch (e) {
    parseError.value = (e as Error).message
  }

  return { tables, refs }
}

// ─── SQL type helpers ─────────────────────────────────────────────────────────
function toMySQLType(t: string): string {
  const l = t.toLowerCase()
  if (l === 'integer' || l === 'int') return 'INT'
  if (l === 'bigint') return 'BIGINT'
  if (l === 'smallint') return 'SMALLINT'
  if (l === 'boolean' || l === 'bool') return 'TINYINT(1)'
  if (l === 'text') return 'TEXT'
  if (l === 'timestamp') return 'TIMESTAMP'
  if (l === 'datetime') return 'DATETIME'
  if (l === 'date') return 'DATE'
  if (l === 'float') return 'FLOAT'
  if (l === 'uuid') return 'CHAR(36)'
  if (l === 'json') return 'JSON'
  return t.toUpperCase()
}

function toPGType(t: string): string {
  const l = t.toLowerCase()
  if (l === 'integer' || l === 'int') return 'INTEGER'
  if (l === 'bigint') return 'BIGINT'
  if (l === 'boolean' || l === 'bool') return 'BOOLEAN'
  if (l === 'timestamp') return 'TIMESTAMP'
  if (l === 'uuid') return 'UUID'
  if (l === 'json') return 'JSONB'
  return t.toUpperCase()
}

function toSQLiteType(t: string): string {
  const l = t.toLowerCase()
  if (l === 'integer' || l === 'int' || l === 'bigint' || l === 'smallint') return 'INTEGER'
  if (l === 'boolean' || l === 'bool') return 'INTEGER'
  if (l.startsWith('varchar')) return 'TEXT'
  if (l === 'text') return 'TEXT'
  if (l === 'timestamp' || l === 'datetime' || l === 'date') return 'TEXT'
  if (l === 'float' || l.startsWith('decimal')) return 'REAL'
  if (l === 'uuid') return 'TEXT'
  if (l === 'json') return 'TEXT'
  return 'TEXT'
}

function toMSSQLType(t: string): string {
  const l = t.toLowerCase()
  if (l === 'integer' || l === 'int') return 'INT'
  if (l === 'bigint') return 'BIGINT'
  if (l === 'smallint') return 'SMALLINT'
  if (l === 'boolean' || l === 'bool') return 'BIT'
  if (l === 'text') return 'NVARCHAR(MAX)'
  if (l === 'timestamp' || l === 'datetime') return 'DATETIME2'
  if (l === 'date') return 'DATE'
  if (l === 'float') return 'FLOAT'
  if (l === 'uuid') return 'UNIQUEIDENTIFIER'
  if (l === 'json') return 'NVARCHAR(MAX)'
  if (l.startsWith('varchar')) return t.toUpperCase()
  return t.toUpperCase()
}

// ─── SQL Generators ───────────────────────────────────────────────────────────
function generateMySQL(s: ParsedSchema): string {
  if (!s.tables.length) return '-- Chưa có schema để xuất'
  const ts = new Date().toISOString()
  const out: string[] = [
    `-- Generated by vibe.j2team.org/dbdiagram`,
    `-- Dialect  : MySQL 8.x`,
    `-- Generated: ${ts}`,
    '',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ]

  for (const table of s.tables) {
    out.push(`CREATE TABLE \`${table.name}\` (`)
    const defs: string[] = []
    const pks: string[] = []

    for (const col of table.columns) {
      let d = `  \`${col.name}\` ${toMySQLType(col.type)}`
      if (col.increment) d += ' AUTO_INCREMENT'
      if (col.notNull || col.pk) d += ' NOT NULL'
      if (col.unique && !col.pk) d += ' UNIQUE'
      if (col.default !== undefined) d += ` DEFAULT ${col.default}`
      if (col.pk) pks.push(`\`${col.name}\``)
      defs.push(d)
    }

    if (pks.length) defs.push(`  PRIMARY KEY (${pks.join(', ')})`)
    out.push(defs.join(',\n'))
    out.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n')
  }

  // Foreign keys
  for (const ref of s.refs) {
    let [ft, fc] = ref.from.split('.')
    let [tt, tc] = ref.to.split('.')
    if (ref.type === '<') {
      ;[ft, fc, tt, tc] = [tt, tc, ft, fc]
    }
    if (ft && fc && tt && tc) {
      out.push(`ALTER TABLE \`${ft}\``)
      out.push(`  ADD CONSTRAINT \`fk_${ft}_${fc}\``)
      out.push(
        `  FOREIGN KEY (\`${fc}\`) REFERENCES \`${tt}\` (\`${tc}\`) ON DELETE CASCADE ON UPDATE CASCADE;\n`,
      )
    }
  }

  out.push('\nSET FOREIGN_KEY_CHECKS = 1;')
  return out.join('\n')
}

function generatePostgreSQL(s: ParsedSchema): string {
  if (!s.tables.length) return '-- Chưa có schema để xuất'
  const out: string[] = [
    `-- Generated by vibe.j2team.org/dbdiagram`,
    `-- Dialect  : PostgreSQL 15+`,
    `-- Generated: ${new Date().toISOString()}`,
    '',
  ]

  for (const table of s.tables) {
    out.push(`CREATE TABLE "${table.name}" (`)
    const defs: string[] = []

    for (const col of table.columns) {
      let type = toPGType(col.type)
      if (col.increment) {
        type = col.type.toLowerCase() === 'bigint' ? 'BIGSERIAL' : 'SERIAL'
      }
      let d = `  "${col.name}" ${type}`
      if (col.pk) d += ' PRIMARY KEY'
      else if (col.notNull) d += ' NOT NULL'
      if (col.unique && !col.pk) d += ' UNIQUE'
      if (col.default !== undefined) d += ` DEFAULT ${col.default}`
      defs.push(d)
    }

    out.push(defs.join(',\n'))
    out.push(');\n')
  }

  for (const ref of s.refs) {
    let [ft, fc] = ref.from.split('.')
    let [tt, tc] = ref.to.split('.')
    if (ref.type === '<') {
      ;[ft, fc, tt, tc] = [tt, tc, ft, fc]
    }
    if (ft && fc && tt && tc) {
      out.push(`ALTER TABLE "${ft}"`)
      out.push(`  ADD CONSTRAINT "fk_${ft}_${fc}"`)
      out.push(`  FOREIGN KEY ("${fc}") REFERENCES "${tt}" ("${tc}") ON DELETE CASCADE;\n`)
    }
  }

  return out.join('\n')
}

function generateSQLite(s: ParsedSchema): string {
  if (!s.tables.length) return '-- Chưa có schema để xuất'
  const out: string[] = [
    `-- Generated by vibe.j2team.org/dbdiagram`,
    `-- Dialect  : SQLite 3`,
    `-- Generated: ${new Date().toISOString()}`,
    '',
    'PRAGMA foreign_keys = ON;',
    '',
  ]

  for (const table of s.tables) {
    out.push(`CREATE TABLE "${table.name}" (`)
    const defs: string[] = []

    for (const col of table.columns) {
      let d = `  "${col.name}" ${toSQLiteType(col.type)}`
      if (col.pk) {
        d += ' PRIMARY KEY'
        if (col.increment) d += ' AUTOINCREMENT'
      } else if (col.notNull) {
        d += ' NOT NULL'
      }
      if (col.unique && !col.pk) d += ' UNIQUE'
      if (col.default !== undefined) d += ` DEFAULT ${col.default}`
      defs.push(d)
    }

    // Inline FK in CREATE TABLE (SQLite style)
    for (const ref of s.refs) {
      let [ft, fc] = ref.from.split('.')
      let [tt, tc] = ref.to.split('.')
      if (ref.type === '<') {
        ;[ft, fc, tt, tc] = [tt, tc, ft, fc]
      }
      if (ft === table.name && fc && tt && tc) {
        defs.push(`  FOREIGN KEY ("${fc}") REFERENCES "${tt}" ("${tc}")`)
      }
    }

    out.push(defs.join(',\n'))
    out.push(');\n')
  }

  return out.join('\n')
}

function generateSQLServer(s: ParsedSchema): string {
  if (!s.tables.length) return '-- Chưa có schema để xuất'
  const out: string[] = [
    `-- Generated by vibe.j2team.org/dbdiagram`,
    `-- Dialect  : SQL Server (T-SQL)`,
    `-- Generated: ${new Date().toISOString()}`,
    '',
  ]

  for (const table of s.tables) {
    out.push(`CREATE TABLE [${table.name}] (`)
    const defs: string[] = []
    const pks: string[] = []

    for (const col of table.columns) {
      let d = `  [${col.name}] ${toMSSQLType(col.type)}`
      if (col.increment) d += ' IDENTITY(1,1)'
      if (col.pk) pks.push(`[${col.name}]`)
      else if (col.notNull) d += ' NOT NULL'
      if (col.unique && !col.pk) d += ' UNIQUE'
      if (col.default !== undefined) d += ` DEFAULT ${col.default}`
      defs.push(d)
    }

    if (pks.length) defs.push(`  PRIMARY KEY (${pks.join(', ')})`)
    out.push(defs.join(',\n'))
    out.push(');\nGO\n')
  }

  for (const ref of s.refs) {
    let [ft, fc] = ref.from.split('.')
    let [tt, tc] = ref.to.split('.')
    if (ref.type === '<') {
      ;[ft, fc, tt, tc] = [tt, tc, ft, fc]
    }
    if (ft && fc && tt && tc) {
      out.push(`ALTER TABLE [${ft}]`)
      out.push(
        `  ADD CONSTRAINT [FK_${ft}_${fc}] FOREIGN KEY ([${fc}]) REFERENCES [${tt}] ([${tc}]) ON DELETE CASCADE;`,
      )
      out.push('GO\n')
    }
  }

  return out.join('\n')
}

function generateJSON(s: ParsedSchema): string {
  if (!s.tables.length) return '// Chưa có schema để xuất'
  const schema = {
    tables: s.tables.map((t) => ({
      name: t.name,
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.type,
        pk: c.pk || undefined,
        notNull: c.notNull || undefined,
        unique: c.unique || undefined,
        increment: c.increment || undefined,
        default: c.default,
      })),
    })),
    relationships: s.refs.map((r) => ({
      from: r.from,
      to: r.to,
      type: r.type,
    })),
  }
  return JSON.stringify(schema, null, 2)
}

function generateMongoDB(s: ParsedSchema): string {
  if (!s.tables.length) return '// Chưa có schema để xuất'
  const out: string[] = [
    `// Generated by vibe.j2team.org/dbdiagram`,
    `// Format    : MongoDB Shell (mongosh) Validation Schema`,
    `// Generated : ${new Date().toISOString()}`,
    '',
  ]

  for (const table of s.tables) {
    out.push(`db.createCollection("${table.name}", {`)
    out.push('  validator: {')
    out.push('    $jsonSchema: {')
    out.push('      bsonType: "object",')
    if (table.columns.some((c) => c.notNull || c.pk)) {
      const required = table.columns.filter((c) => c.notNull || c.pk).map((c) => `"${c.name}"`)
      out.push(`      required: [${required.join(', ')}],`)
    }
    out.push('      properties: {')

    const props: string[] = []
    for (const col of table.columns) {
      let type = 'string'
      const l = col.type.toLowerCase()
      if (l === 'integer' || l === 'int' || l === 'bigint') type = 'int'
      else if (l === 'boolean' || l === 'bool') type = 'bool'
      else if (l === 'timestamp' || l === 'date' || l === 'datetime') type = 'date'
      else if (l === 'float' || l.startsWith('decimal')) type = 'double'

      let p = `        "${col.name}": {`
      p += `\n          bsonType: "${type}"`
      if (col.name === 'id' || col.pk) p += `,\n          description: "Primary Key"`
      p += '\n        }'
      props.push(p)
    }
    out.push(props.join(',\n'))
    out.push('      }')
    out.push('    }')
    out.push('  }')
    out.push('});\n')
  }

  return out.join('\n')
}

// ─── Diagram helpers ──────────────────────────────────────────────────────────
const calcTableH = (t: Table) => TABLE_HEADER_H + t.columns.length * COL_ROW_H
const truncType = (t: string) => (t.length > 13 ? t.substring(0, 11) + '..' : t)

function isFK(tableName: string, colName: string): boolean {
  const key = `${tableName}.${colName}`
  return parsedSchema.value.refs.some((r) => r.from === key || (r.type === '<' && r.to === key))
}

function autoLayout() {
  const tables = parsedSchema.value.tables
  tables.forEach((t, i) => {
    const col = i % DIAGRAM_COLS
    const row = Math.floor(i / DIAGRAM_COLS)
    const prevRowH =
      row === 0
        ? 0
        : (() => {
            let acc = 0
            for (let r = 0; r < row; r++) {
              const rt = tables.slice(r * DIAGRAM_COLS, (r + 1) * DIAGRAM_COLS)
              acc += Math.max(...rt.map(calcTableH)) + TABLE_GAP_Y
            }
            return acc
          })()
    tablePositions[t.name] = {
      x: col * (TABLE_W + TABLE_GAP_X) + DIAGRAM_PAD,
      y: prevRowH + DIAGRAM_PAD,
    }
  })
}

const svgSize = computed(() => {
  let w = 800
  let h = 500
  for (const t of parsedSchema.value.tables) {
    const pos = tablePositions[t.name]
    if (!pos) continue
    w = Math.max(w, pos.x + TABLE_W + DIAGRAM_PAD)
    h = Math.max(h, pos.y + calcTableH(t) + DIAGRAM_PAD)
  }
  return { w, h }
})

function getColPoint(tableName: string, colName: string, side: 'l' | 'r') {
  const pos = tablePositions[tableName] ?? { x: 0, y: 0 }
  const table = parsedSchema.value.tables.find((t) => t.name === tableName)
  const ci = table ? table.columns.findIndex((c) => c.name === colName) : 0
  const y = pos.y + TABLE_HEADER_H + Math.max(0, ci) * COL_ROW_H + COL_ROW_H / 2
  return { x: side === 'r' ? pos.x + TABLE_W : pos.x, y }
}

const diagramRefs = computed(() => {
  return parsedSchema.value.refs.map((ref, i) => {
    let [ft, fc] = ref.from.split('.')
    let [tt, tc] = ref.to.split('.')
    ft = ft || ''
    fc = fc || ''
    tt = tt || ''
    tc = tc || ''
    const posFrom = tablePositions[ft] ?? { x: 0, y: 0 }
    const posTo = tablePositions[tt] ?? { x: 0, y: 0 }

    const fromSide: 'l' | 'r' = posFrom.x <= posTo.x ? 'r' : 'l'
    const toSide: 'l' | 'r' = fromSide === 'r' ? 'l' : 'r'

    const p1 = getColPoint(ft, fc, fromSide)
    const p2 = getColPoint(tt, tc, toSide)
    const cp = Math.min(Math.abs(p2.x - p1.x) * 0.45, 110)
    const cx1 = p1.x + (fromSide === 'r' ? cp : -cp)
    const cx2 = p2.x + (toSide === 'l' ? -cp : cp)
    const path = `M ${p1.x} ${p1.y} C ${cx1} ${p1.y}, ${cx2} ${p2.y}, ${p2.x} ${p2.y}`

    const colors = ['#FF6B4A', '#FFB830', '#38BDF8', '#F0EDE6']
    const marker = ref.type === '<>' || ref.type === '<' ? 'db-arrow-many' : 'db-arrow'

    return { path, color: colors[i % colors.length], marker }
  })
})

// ─── Drag ─────────────────────────────────────────────────────────────────────
function startDrag(e: MouseEvent, name: string) {
  e.preventDefault()
  const svg = (e.currentTarget as SVGElement).closest('svg') as SVGSVGElement | null
  if (!svg) return
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const sp = pt.matrixTransform(svg.getScreenCTM()!.inverse())
  const pos = tablePositions[name] ?? { x: 0, y: 0 }
  dragging.value = { name, ox: sp.x - pos.x, oy: sp.y - pos.y }
}

function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return
  const svg = e.currentTarget as SVGSVGElement
  if (!svg.createSVGPoint) return
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const sp = pt.matrixTransform(svg.getScreenCTM()!.inverse())
  tablePositions[dragging.value.name] = {
    x: Math.max(0, sp.x - dragging.value.ox),
    y: Math.max(0, sp.y - dragging.value.oy),
  }
}

function onMouseUp() {
  dragging.value = null
}

// ─── Computed ─────────────────────────────────────────────────────────────────
const parsedSchema = computed(() => parseDBML(dbmlInput.value))

const generatedSQL = computed(() => {
  const s = parsedSchema.value
  if (activeDialect.value === 'mysql') return generateMySQL(s)
  if (activeDialect.value === 'postgresql') return generatePostgreSQL(s)
  if (activeDialect.value === 'sqlite') return generateSQLite(s)
  if (activeDialect.value === 'sqlserver') return generateSQLServer(s)
  if (activeDialect.value === 'mongodb') return generateMongoDB(s)
  if (activeDialect.value === 'json') return generateJSON(s)
  return ''
})

const parseStatus = computed(() => {
  if (parseError.value) return 'error'
  return parsedSchema.value.tables.length > 0 ? 'match' : 'idle'
})

const parseStatusText = computed(() => {
  if (parseError.value) return 'Lỗi parse'
  const { tables, refs } = parsedSchema.value
  if (tables.length > 0) return `${tables.length} tables · ${refs.length} refs`
  return 'Sẵn sàng'
})

// ─── Watch schema → update positions for new tables ──────────────────────────
watch(
  () => parsedSchema.value.tables.map((t) => t.name),
  (names) => {
    nextTick(() => {
      const tables = parsedSchema.value.tables
      // Add missing positions
      tables.forEach((t, i) => {
        if (!tablePositions[t.name]) {
          const col = i % DIAGRAM_COLS
          const row = Math.floor(i / DIAGRAM_COLS)
          tablePositions[t.name] = {
            x: col * (TABLE_W + TABLE_GAP_X) + DIAGRAM_PAD,
            y: row * (calcTableH(t) + TABLE_GAP_Y) + DIAGRAM_PAD,
          }
        }
      })
      // Remove stale positions
      for (const n of Object.keys(tablePositions)) {
        if (!names.includes(n)) delete tablePositions[n]
      }
    })
  },
  { immediate: true },
)

// ─── AI Generator ─────────────────────────────────────────────────────────────
const AI_SYSTEM = `You are a database schema expert. Generate DBML (Database Markup Language) based on the description.
Output ONLY valid DBML, no explanation, no markdown code fences.

Format:
Table table_name {
  id integer [pk, increment]
  col_name type [options]
}
Ref: table1.col > table2.col  // many-to-one
Ref: table1.col < table2.col  // one-to-many
Ref: table1.col - table2.col  // one-to-one

Options available: pk, increment, not null, unique, default: value
Common types: integer, varchar(n), text, boolean, timestamp, decimal(p,s), float, uuid, json, date`

async function generateWithAI() {
  if (!aiApiKey.value || !aiPrompt.value || aiLoading.value) return
  aiLoading.value = true
  aiError.value = ''

  const msg = `Generate DBML schema for: ${aiPrompt.value}`

  try {
    let result = ''

    if (aiProvider.value === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiApiKey.value}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${AI_SYSTEM}\n\n${msg}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
        },
      )
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      result = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } else if (aiProvider.value === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiApiKey.value}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            { role: 'system', content: AI_SYSTEM },
            { role: 'user', content: msg },
          ],
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      result = data.choices?.[0]?.message?.content ?? ''
    } else {
      // Claude - requires backend proxy for CORS
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiApiKey.value,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: AI_SYSTEM,
          messages: [{ role: 'user', content: msg }],
        }),
      })
      const data = await res.json()
      if (data.error)
        throw new Error(data.error.message ?? 'CORS error — dùng proxy hoặc chuyển sang Gemini')
      result = data.content?.[0]?.text ?? ''
    }

    // Strip markdown fences if AI wraps in ```
    result = result
      .replace(/```(?:dbml|sql|)?\n?/gi, '')
      .replace(/```/g, '')
      .trim()

    if (result) {
      dbmlInput.value = result
    } else {
      aiError.value = 'AI không trả về kết quả. Kiểm tra API key và thử lại.'
    }
  } catch (e: unknown) {
    aiError.value = (e as Error).message || 'Lỗi không xác định'
  } finally {
    aiLoading.value = false
  }
}

// ─── SQL to DBML Parser ───────────────────────────────────────────────────────
function parseSQLToDBML() {
  if (!sqlImportInput.value.trim()) return

  // Strip block comments /* ... */ and line comments -- ...
  let sql = sqlImportInput.value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')

  // Normalize layout for easier regex parsing
  sql = sql
    .replace(/\r\n/g, '\n')
    // Remove unsupported stuff
    .replace(/GO\s*$/gm, '')
    .trim()

  const tables: string[] = []
  const refs: string[] = []

  // Extract CREATE TABLE blocks safely ignoring nested parenthesis logic by assuming CREATE TABLE ends before the next CREATE/ALTER or end of file
  const createTableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_"[\]`.]+)\s*\(([\s\S]*?)\)(?:\s*WITHOUT\s+ROWID|\s*ENGINE[=a-zA-Z0-9_]|\s*CHARSET[=a-zA-Z0-9_]|\s*COLLATE[=a-zA-Z0-9_]|\s*;|\s*$|$)/gi

  let m: RegExpExecArray | null
  while ((m = createTableRegex.exec(sql)) !== null) {
    let tableNameRaw = m[1] || ''
    // Strip schema stuff (dbo.users -> users) and brackets
    tableNameRaw = tableNameRaw.replace(/^[a-zA-Z0-9_[\]`"]+\./, '').replace(/[[\]`"]/g, '')
    const tableBody = m[2] || ''

    tables.push(`Table ${tableNameRaw} {`)

    // Split by commas, but ignore commas inside parentheses (like DECIMAL(10,2))
    const lines = tableBody.split(/,(?![^(]*\))/)

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      // Ignore standard index listings
      if (/^(CONSTRAINT|KEY|INDEX|PRIMARY KEY|FOREIGN KEY|UNIQUE)/i.test(line)) {
        // Specifically catch inline constraints at the end of definitions
        const pkMatch = line.match(/^PRIMARY\s+KEY\s*\(\s*([a-zA-Z0-9_"[\]`.]+)\s*\)/i)
        if (pkMatch) {
          // we skip these because our simpler DBML assumes inline [pk]
          // you could enhance this by finding the column and modifying its DBML definition retroactively
        }

        const fkMatch = line.match(
          /^FOREIGN\s+KEY\s*\(\s*([a-zA-Z0-9_"[\]`.]+)\s*\)\s*REFERENCES\s+([a-zA-Z0-9_"[\]`.]+)\s*\(\s*([a-zA-Z0-9_"[\]`.]+)\s*\)/i,
        )
        if (fkMatch) {
          const fc = (fkMatch[1] || '').replace(/[[\]`"]/g, '')
          const tt = (fkMatch[2] || '').replace(/^[a-zA-Z0-9_[\]`"]+\./, '').replace(/[[\]`"]/g, '')
          const tc = (fkMatch[3] || '').replace(/[[\]`"]/g, '')
          refs.push(`Ref: ${tableNameRaw}.${fc} > ${tt}.${tc}`)
        }
        continue
      }

      // Column Definition
      // e.g. [ID] INT IDENTITY(1,1) PRIMARY KEY
      // [1]=ColName, [2]=Rest
      const colMatch = line.match(/^([a-zA-Z0-9_"[\]`.]+)\s+(.*)$/i)
      if (colMatch) {
        const colName = (colMatch[1] || '').replace(/[[\]`"]/g, '')
        let rest = colMatch[2] || ''

        let type = 'varchar'
        const typeMatch = rest.match(/^([a-zA-Z0-9_]+(?:\s*\([^)]+\))?)/)
        if (typeMatch) {
          type = typeMatch[1] || ''
          rest = rest.substring(type.length).trim()
        }

        const dbmlOpts: string[] = []
        if (/PRIMARY\s+KEY/i.test(rest)) dbmlOpts.push('pk')
        if (/AUTO_INCREMENT|IDENTITY|SERIAL/i.test(rest) || /serial/i.test(type))
          dbmlOpts.push('increment')
        if (/NOT\s+NULL/i.test(rest)) dbmlOpts.push('not null')
        if (/UNIQUE/i.test(rest)) dbmlOpts.push('unique')

        const defaultMatch = rest.match(/DEFAULT\s+([^ ]+)/i)
        if (defaultMatch) {
          let defVal = (defaultMatch[1] || '').trim()
          if (defVal.endsWith(',')) defVal = defVal.slice(0, -1)
          // remove surrounding single quotes if present
          defVal = defVal.replace(/^'|'$/g, '`')
          dbmlOpts.push(`default: ${defVal}`)
        }

        const optsStr = dbmlOpts.length > 0 ? ` [${dbmlOpts.join(', ')}]` : ''
        tables.push(`  ${colName} ${type}${optsStr}`)
      }
    }

    tables.push('}\n')
  }

  // Extract ALTER TABLE fk relationships
  const alterRegex =
    /ALTER\s+TABLE\s+([a-zA-Z0-9_"[\]`.]+)\s+ADD\s+(?:CONSTRAINT\s+[a-zA-Z0-9_"[\]`.]+\s+)?FOREIGN\s+KEY\s*\(\s*([a-zA-Z0-9_"[\]`.]+)\s*\)\s*REFERENCES\s+([a-zA-Z0-9_"[\]`.]+)\s*\(\s*([a-zA-Z0-9_"[\]`.]+)\s*\)/gi
  while ((m = alterRegex.exec(sql)) !== null) {
    const fTable = (m[1] || '').replace(/^[a-zA-Z0-9_[\]`"]+\./, '').replace(/[[\]`"]/g, '')
    const fCol = (m[2] || '').replace(/[[\]`"]/g, '')
    const tTable = (m[3] || '').replace(/^[a-zA-Z0-9_[\]`"]+\./, '').replace(/[[\]`"]/g, '')
    const tCol = (m[4] || '').replace(/[[\]`"]/g, '')
    refs.push(`Ref: ${fTable}.${fCol} > ${tTable}.${tCol}`)
  }

  const finalDBML = [...tables, ...refs].join('\n')
  if (finalDBML.trim()) {
    dbmlInput.value = finalDBML.trim()
    // Collapse import panel nicely and show result
    sqlImportOpen.value = false
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function resetToDefault() {
  dbmlInput.value = DEFAULT_DBML
}

async function copySql() {
  try {
    await navigator.clipboard.writeText(generatedSQL.value)
    sqlCopied.value = true
    setTimeout(() => {
      sqlCopied.value = false
    }, 2000)
  } catch {
    //
  }
}

function downloadSql() {
  const blob = new Blob([generatedSQL.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  let ext = 'sql'
  if (activeDialect.value === 'json') ext = 'json'
  if (activeDialect.value === 'mongodb') ext = 'js'
  a.download = `schema_${activeDialect.value}_${Date.now()}.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// onMounted(() => autoLayout())
</script>

<style scoped>
/* ── Status dot ────────────────────────────────────── */
.rx-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition:
    background-color 0.3s,
    box-shadow 0.3s;
}
.rx-dot.idle {
  background-color: #4a6180;
}
.rx-dot.match {
  background-color: #38bdf8;
  box-shadow: 0 0 6px 1px rgba(56, 189, 248, 0.5);
  animation: dot-pulse 1.5s ease-in-out infinite;
}
.rx-dot.error {
  background-color: #ff6b4a;
  box-shadow: 0 0 6px 1px rgba(255, 107, 74, 0.5);
}
@keyframes dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

/* ── Diagram table cursor ──────────────────────────── */
.diagram-table {
  cursor: grab;
}
.diagram-table:active {
  cursor: grabbing;
}

/* ── Scrollbar ─────────────────────────────────────── */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #2a3549 transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #2a3549;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #4a6180;
}

/* ── Fade up ───────────────────────────────────────── */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-up {
  animation: fade-up 0.3s ease-out forwards;
}

/* ── Spin ─────────────────────────────────────────── */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 0.8s linear infinite;
}
</style>
