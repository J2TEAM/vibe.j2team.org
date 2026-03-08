<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { useDevPocketTools } from './composables/useDevPocketTools'

const {
  base64Text,
  base64Value,
  caseInput,
  caseVariants,
  colorInput,
  colorResult,
  copyText,
  cronInput,
  cronResult,
  csvInput,
  csvResult,
  currentPage,
  currentToolPage,
  dateTimeInput,
  dateTimeToTimestamp,
  decodeBase64,
  diffLeft,
  diffResult,
  diffRight,
  encodeBase64,
  formatJson,
  generateHash,
  generateUuids,
  hashAlgorithm,
  hashInput,
  hashOutput,
  hashStatus,
  htmlEscapeResult,
  htmlInput,
  jsonInput,
  jsonResult,
  jsonTypeInput,
  jsonTypeResult,
  jwtInput,
  jwtResult,
  numberBase,
  numberBaseInput,
  numberBaseResult,
  parsedHeaders,
  queryBuilderInput,
  queryBuilderResult,
  rawHeadersInput,
  regexFlags,
  regexPattern,
  regexResult,
  regexSample,
  relativeTimeResult,
  relativeTimestampInput,
  setTimestampNow,
  slugInput,
  slugResult,
  timestampInput,
  timestampResult,
  toolPages,
  urlInput,
  urlResult,
  useConvertedTimestamp,
  useDecodedUrl,
  uuidCount,
  uuidList,
} = useDevPocketTools()
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary">
    <div class="mx-auto flex w-full max-w-none flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header class="animate-fade-up overflow-hidden border border-border-default bg-bg-surface">
        <div class="border-b border-border-default px-5 py-4 sm:px-8">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div class="flex flex-wrap items-center gap-3">
              <RouterLink
                to="/"
                class="inline-flex items-center gap-2 border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
              >
                &larr; Về trang chủ
              </RouterLink>
              <span
                class="border border-border-default bg-bg-deep px-3 py-2 font-display text-xs tracking-[0.25em] text-accent-sky"
              >
                WORKSPACE / DEV POCKET
              </span>
            </div>

            <div
              class="flex flex-wrap items-center gap-3 text-xs font-medium tracking-wide text-text-secondary"
            >
              <span class="border border-border-default px-3 py-2">20 pocket tools</span>
              <span class="border border-border-default px-3 py-2">4 nhóm tác vụ</span>
              <span class="border border-border-default px-3 py-2">100% client-side</span>
              <div
                class="bg-accent-coral px-4 py-2 font-display font-bold tracking-[0.25em] text-bg-deep"
              >
                VOL.01 / 2026
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-0 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
          <div class="px-5 py-8 sm:px-8 sm:py-10">
            <p class="font-display text-sm tracking-[0.3em] text-accent-coral">// DEV TOOLKIT</p>
            <h1
              class="mt-4 max-w-4xl font-display text-4xl font-bold leading-none tracking-tight text-text-primary sm:text-6xl xl:text-7xl"
            >
              Dev Pocket Tools
            </h1>
            <p class="mt-5 max-w-3xl text-base leading-8 text-text-secondary sm:text-lg">
              Một workspace utility cho những thao tác lặp đi lặp lại của dev. Thay vì một trang dài
              và loãng, mỗi nhóm tool giờ được tổ chức như các module riêng để bạn vào đúng việc
              nhanh hơn.
            </p>

            <div class="mt-8 grid gap-3 sm:grid-cols-3">
              <div class="border border-border-default bg-bg-deep px-4 py-4">
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">ACTIVE GROUP</p>
                <p class="mt-2 font-display text-lg font-semibold text-text-primary">
                  {{ currentToolPage.label }}
                </p>
                <p class="mt-1 text-sm text-text-secondary">{{ currentToolPage.description }}</p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-4">
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">FOCUS MODE</p>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Chỉ hiện 5 tool đúng nhóm để giảm nhiễu khi thao tác.
                </p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-4">
                <p class="font-display text-xs tracking-[0.25em] text-accent-sky">TRUST</p>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Không gửi dữ liệu đi đâu, không backend, không dependency mới.
                </p>
              </div>
            </div>
          </div>

          <div
            class="border-t border-border-default bg-bg-deep/70 px-5 py-8 sm:px-8 xl:border-t-0 xl:border-l"
          >
            <p class="font-display text-sm tracking-[0.3em] text-accent-amber">// QUICK START</p>
            <div class="mt-5 space-y-4">
              <div class="border border-border-default bg-bg-surface px-4 py-4">
                <p class="font-display text-xs tracking-[0.25em] text-text-dim">STEP 01</p>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Chọn nhóm tool ở ngay bên dưới theo mục đích: build, xử lý data, làm việc với
                  time, hoặc inspect dữ liệu.
                </p>
              </div>
              <div class="border border-border-default bg-bg-surface px-4 py-4">
                <p class="font-display text-xs tracking-[0.25em] text-text-dim">STEP 02</p>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Chỉnh input trực tiếp trong card, copy output khi cần, và chỉ thấy phần cần dùng ở
                  thời điểm đó.
                </p>
              </div>
              <div class="border border-border-default bg-bg-surface px-4 py-4">
                <p class="font-display text-xs tracking-[0.25em] text-text-dim">STEP 03</p>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Nếu đang ở sai nhóm, dùng thanh navigation như tab app để đổi ngữ cảnh mà không
                  mất dữ liệu đã nhập.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section class="animate-fade-up animate-delay-2 mt-8">
        <div class="mb-8 border border-border-default bg-bg-surface p-5">
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p class="font-display text-sm tracking-[0.25em] text-accent-amber">
                  // TOOL PAGES
                </p>
                <h2 class="mt-2 font-display text-2xl font-semibold text-text-primary">
                  Điều hướng theo nhóm
                </h2>
                <p class="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Mỗi nhóm là một ngữ cảnh làm việc. Chọn một tab để giữ màn hình gọn, đúng việc và
                  dễ quét hơn.
                </p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="font-display text-xs tracking-[0.25em] text-text-dim">NOW OPEN</p>
                <p class="mt-1 font-display text-lg font-semibold text-text-primary">
                  {{ currentToolPage.label }}
                </p>
              </div>
            </div>

            <div class="grid gap-3 xl:grid-cols-4">
              <button
                v-for="page in toolPages"
                :key="page.id"
                type="button"
                class="group relative overflow-hidden border px-4 py-4 text-left transition-all duration-300"
                :class="
                  page.id === currentPage
                    ? 'border-accent-coral bg-bg-elevated text-text-primary shadow-lg shadow-accent-coral/10'
                    : 'border-border-default bg-bg-deep text-text-secondary hover:-translate-y-1 hover:border-accent-coral hover:text-text-primary'
                "
                @click="currentPage = page.id"
              >
                <div
                  class="absolute inset-y-0 left-0 w-1 transition-all"
                  :class="
                    page.id === currentPage
                      ? 'bg-accent-coral'
                      : 'bg-transparent group-hover:bg-accent-coral/40'
                  "
                />
                <div class="pl-2">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-display text-base font-semibold">{{ page.label }}</p>
                    <span
                      class="border px-2 py-1 text-[10px] tracking-[0.25em]"
                      :class="
                        page.id === currentPage
                          ? 'border-accent-coral text-accent-coral'
                          : 'border-border-default text-text-dim'
                      "
                    >
                      05
                    </span>
                  </div>
                  <p class="mt-2 text-sm leading-6">{{ page.description }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div
          class="mb-6 flex flex-col gap-3 border-l-4 border-l-accent-coral pl-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p class="font-display text-sm tracking-widest text-accent-coral">// TOOL GRID</p>
            <h2 class="mt-1 font-display text-2xl font-semibold text-text-primary">
              {{ currentToolPage.label }}
            </h2>
          </div>
          <p class="max-w-2xl text-sm leading-6 text-text-secondary">
            {{ currentToolPage.description }}. Mỗi card vẫn giữ logic cũ, nhưng phần khung đã được
            tối ưu để đọc nhanh và chuyển ngữ cảnh mượt hơn.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-if="currentPage === 'builders'"
            class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">07</p>
                <h3 class="mt-2 font-display text-xl font-semibold">JWT Decoder</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Decode header và payload của JWT để đọc claim nhanh ngay trên client.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('jwt', jwtResult.payload)"
              >
                Copy Payload
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >JWT</label
            >
            <textarea
              v-model="jwtInput"
              rows="5"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': jwtResult.tone === 'default',
                'text-accent-sky': jwtResult.tone === 'success',
                'text-accent-amber': jwtResult.tone === 'error',
              }"
            >
              {{ jwtResult.message }}
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">HEADER</p>
                <pre
                  class="mt-2 overflow-x-auto text-sm whitespace-pre-wrap"
                ><code>{{ jwtResult.header || 'Phần header sẽ hiện ở đây.' }}</code></pre>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">PAYLOAD</p>
                <pre
                  class="mt-2 overflow-x-auto text-sm whitespace-pre-wrap"
                ><code>{{ jwtResult.payload || 'Phần payload sẽ hiện ở đây.' }}</code></pre>
              </div>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">TIME CLAIMS</p>
              <div v-if="jwtResult.timeFields.length" class="mt-3 space-y-2">
                <div
                  v-for="field in jwtResult.timeFields"
                  :key="field.key"
                  class="border border-border-default px-3 py-2 text-sm"
                >
                  <p>
                    <span class="text-accent-amber">{{ field.key }}</span
                    >: {{ field.raw }}
                  </p>
                  <p class="mt-1 text-text-secondary">{{ field.formatted }}</p>
                </div>
              </div>
              <p v-else class="mt-2 text-sm text-text-secondary">
                Không có `iat`, `exp` hoặc `nbf` để hiển thị.
              </p>
            </div>
          </article>

          <article
            v-if="currentPage === 'builders'"
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">08</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Hash Generator</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Sinh hash từ text bằng Web Crypto API với các thuật toán phổ biến cho dev.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('hash', hashOutput)"
              >
                Copy Hash
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >TEXT</label
            >
            <textarea
              v-model="hashInput"
              rows="4"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <div class="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                v-model="hashAlgorithm"
                class="border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
              >
                <option value="SHA-1">SHA-1</option>
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-384">SHA-384</option>
                <option value="SHA-512">SHA-512</option>
              </select>
              <button
                type="button"
                class="border border-accent-coral bg-accent-coral px-4 py-3 text-sm font-medium text-bg-deep transition hover:opacity-90"
                @click="generateHash"
              >
                Sinh hash
              </button>
            </div>

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': hashStatus.tone === 'default',
                'text-accent-sky': hashStatus.tone === 'success',
                'text-accent-amber': hashStatus.tone === 'error',
              }"
            >
              {{ hashStatus.message }}
            </p>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">HASH OUTPUT</p>
              <p class="mt-2 break-all font-mono text-sm">
                {{ hashOutput || 'Kết quả hash sẽ hiện ở đây.' }}
              </p>
            </div>
          </article>

          <article
            v-if="currentPage === 'builders'"
            class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-sky">09</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Case Converter</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Đổi nhanh giữa các naming convention phổ biến khi viết code hoặc API payload.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('case', caseVariants[0]?.value ?? '')"
              >
                Copy camelCase
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >SOURCE TEXT</label
            >
            <textarea
              v-model="caseInput"
              rows="4"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div
                v-for="variant in caseVariants"
                :key="variant.label"
                class="border border-border-default bg-bg-deep px-4 py-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs font-display tracking-[0.2em] text-text-dim">
                    {{ variant.label }}
                  </p>
                  <button
                    type="button"
                    class="text-xs text-text-secondary transition hover:text-accent-coral"
                    @click="copyText(`case-${variant.label}`, variant.value)"
                  >
                    Copy
                  </button>
                </div>
                <p class="mt-2 break-all font-mono text-sm">{{ variant.value || '...' }}</p>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'builders'"
            class="animate-fade-up animate-delay-5 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">10</p>
                <h3 class="mt-2 font-display text-xl font-semibold">JSON to TypeScript</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Sinh nhanh type hoặc interface TypeScript từ JSON mẫu để giảm thao tác lặp.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('json-type', jsonTypeResult.output)"
              >
                Copy Type
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >JSON SAMPLE</label
            >
            <textarea
              v-model="jsonTypeInput"
              rows="8"
              spellcheck="false"
              class="mt-2 min-h-40 w-full border border-border-default bg-bg-deep px-4 py-3 font-mono text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': jsonTypeResult.tone === 'default',
                'text-accent-sky': jsonTypeResult.tone === 'success',
                'text-accent-amber': jsonTypeResult.tone === 'error',
              }"
            >
              {{ jsonTypeResult.message }}
            </p>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">TYPESCRIPT</p>
              <pre
                class="mt-2 overflow-x-auto text-sm whitespace-pre-wrap"
              ><code>{{ jsonTypeResult.output || 'Kết quả TypeScript sẽ hiện ở đây.' }}</code></pre>
            </div>
          </article>

          <article
            v-if="currentPage === 'builders'"
            class="animate-fade-up animate-delay-6 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">11</p>
                <h3 class="mt-2 font-display text-xl font-semibold">UUID Generator</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Tạo UUID v4 ngay trên trình duyệt để dùng cho mock data, seed hoặc test.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('uuid-list', uuidList.join('\n'))"
              >
                Copy All
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >SỐ LƯỢNG</label
            >
            <div class="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                v-model.number="uuidCount"
                type="number"
                min="1"
                max="20"
                class="min-w-0 flex-1 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
              />
              <button
                type="button"
                class="border border-accent-coral bg-accent-coral px-4 py-3 text-sm font-medium text-bg-deep transition hover:opacity-90"
                @click="generateUuids"
              >
                Tạo UUID
              </button>
            </div>

            <div class="mt-4 space-y-2">
              <div
                v-for="uuid in uuidList"
                :key="uuid"
                class="flex flex-col gap-2 border border-border-default bg-bg-deep px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p class="break-all font-mono text-sm">{{ uuid }}</p>
                <button
                  type="button"
                  class="text-xs text-text-secondary transition hover:text-accent-coral"
                  @click="copyText(`uuid-${uuid}`, uuid)"
                >
                  Copy
                </button>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'data'"
            class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">01</p>
                <h3 class="mt-2 font-display text-xl font-semibold">JSON Formatter / Validator</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Dán JSON thô để kiểm tra cú pháp, format lại cho dễ đọc và copy nhanh kết quả.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('json', jsonResult.output)"
              >
                Copy
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >INPUT</label
            >
            <textarea
              v-model="jsonInput"
              rows="10"
              spellcheck="false"
              class="mt-2 min-h-44 w-full border border-border-default bg-bg-deep px-4 py-3 font-mono text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <div class="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                class="border border-accent-coral bg-accent-coral px-4 py-2 text-sm font-medium text-bg-deep transition hover:opacity-90"
                @click="formatJson"
              >
                Format JSON
              </button>
            </div>

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': jsonResult.tone === 'default',
                'text-accent-sky': jsonResult.tone === 'success',
                'text-accent-amber': jsonResult.tone === 'error',
              }"
            >
              {{ jsonResult.message }}
            </p>

            <label class="mt-4 block text-xs font-display tracking-[0.2em] text-text-dim"
              >OUTPUT</label
            >
            <pre
              class="mt-2 min-h-32 overflow-x-auto border border-border-default bg-bg-deep px-4 py-3 text-sm leading-6 whitespace-pre-wrap"
            ><code>{{ jsonResult.output || 'Kết quả formatted JSON sẽ hiện ở đây.' }}</code></pre>
          </article>

          <article
            v-if="currentPage === 'data'"
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">02</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Base64 Encode / Decode</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Mã hóa hoặc giải mã chuỗi text có Unicode mà không cần rời khỏi trình duyệt.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('base64', base64Value)"
              >
                Copy Base64
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >TEXT</label
            >
            <textarea
              v-model="base64Text"
              rows="4"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <div class="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                class="border border-accent-coral bg-accent-coral px-4 py-2 text-sm font-medium text-bg-deep transition hover:opacity-90"
                @click="encodeBase64"
              >
                Encode
              </button>
              <button
                type="button"
                class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                @click="decodeBase64"
              >
                Decode
              </button>
            </div>

            <label class="mt-4 block text-xs font-display tracking-[0.2em] text-text-dim"
              >BASE64</label
            >
            <textarea
              v-model="base64Value"
              rows="4"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
          </article>

          <article
            v-if="currentPage === 'data'"
            class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-sky">03</p>
                <h3 class="mt-2 font-display text-xl font-semibold">
                  URL Encode / Decode + Parser
                </h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Encode, decode và bóc tách query params để nhìn rõ dữ liệu đang được truyền trên
                  URL.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('url', urlResult.encoded)"
              >
                Copy Encoded
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >URL OR QUERY</label
            >
            <textarea
              v-model="urlInput"
              rows="5"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <div class="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                class="border border-border-default px-4 py-2 text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
                @click="useDecodedUrl"
              >
                Dùng bản decoded
              </button>
            </div>

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': urlResult.tone === 'default',
                'text-accent-sky': urlResult.tone === 'success',
                'text-accent-amber': urlResult.tone === 'error',
              }"
            >
              {{ urlResult.message }}
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">ENCODED</p>
                <p class="mt-2 break-all text-sm">{{ urlResult.encoded || '...' }}</p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">DECODED</p>
                <p class="mt-2 break-all text-sm">{{ urlResult.decoded || '...' }}</p>
              </div>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">PATH</p>
              <p class="mt-2 text-sm text-text-secondary">
                {{ urlResult.origin || 'N/A' }}{{ urlResult.pathname }}
              </p>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">QUERY PARAMS</p>
              <div v-if="urlResult.queryParams.length" class="mt-3 space-y-2">
                <div
                  v-for="param in urlResult.queryParams"
                  :key="`${param.key}-${param.value}`"
                  class="flex flex-col gap-1 border border-border-default px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span class="text-accent-amber">{{ param.key }}</span>
                  <span class="break-all text-text-secondary">{{ param.value }}</span>
                </div>
              </div>
              <p v-else class="mt-2 text-sm text-text-secondary">
                Chưa có query param để hiển thị.
              </p>
            </div>
          </article>

          <article
            v-if="currentPage === 'time'"
            class="animate-fade-up animate-delay-5 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">04</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Timestamp Converter</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Đổi qua lại giữa Unix timestamp và ngày giờ đọc được ngay trên máy của bạn.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('timestamp', timestampResult.iso)"
              >
                Copy ISO
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >TIMESTAMP</label
            >
            <div class="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                v-model="timestampInput"
                type="text"
                class="min-w-0 flex-1 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
              />
              <button
                type="button"
                class="border border-border-default px-4 py-3 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="setTimestampNow"
              >
                Dùng thời gian hiện tại
              </button>
            </div>

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': timestampResult.tone === 'default',
                'text-accent-sky': timestampResult.tone === 'success',
                'text-accent-amber': timestampResult.tone === 'error',
              }"
            >
              {{ timestampResult.message }}
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">ISO</p>
                <p class="mt-2 break-all text-sm">{{ timestampResult.iso || '...' }}</p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">LOCAL</p>
                <p class="mt-2 text-sm">{{ timestampResult.local || '...' }}</p>
              </div>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >DATETIME LOCAL</label
            >
            <div class="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                v-model="dateTimeInput"
                type="datetime-local"
                class="min-w-0 flex-1 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
              />
              <button
                type="button"
                class="border border-border-default px-4 py-3 text-sm text-text-secondary transition hover:border-accent-amber hover:text-text-primary"
                @click="useConvertedTimestamp"
              >
                Dùng timestamp này
              </button>
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">SECONDS</p>
                <p class="mt-2 text-sm">{{ dateTimeToTimestamp.seconds || '...' }}</p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">MILLISECONDS</p>
                <p class="mt-2 text-sm">{{ dateTimeToTimestamp.milliseconds || '...' }}</p>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'time'"
            class="animate-fade-up animate-delay-6 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">05</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Regex Tester</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Nhập pattern, flags và sample text để kiểm tra match hoặc lỗi cú pháp ngay lập
                  tức.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('regex', regexPattern)"
              >
                Copy Pattern
              </button>
            </div>

            <div class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
              <div>
                <label class="block text-xs font-display tracking-[0.2em] text-text-dim"
                  >PATTERN</label
                >
                <input
                  v-model="regexPattern"
                  type="text"
                  spellcheck="false"
                  class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
                />
              </div>
              <div>
                <label class="block text-xs font-display tracking-[0.2em] text-text-dim"
                  >FLAGS</label
                >
                <input
                  v-model="regexFlags"
                  type="text"
                  spellcheck="false"
                  class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
                />
              </div>
            </div>

            <label class="mt-4 block text-xs font-display tracking-[0.2em] text-text-dim"
              >SAMPLE TEXT</label
            >
            <textarea
              v-model="regexSample"
              rows="6"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': regexResult.tone === 'default',
                'text-accent-sky': regexResult.tone === 'success',
                'text-accent-amber': regexResult.tone === 'error',
              }"
            >
              {{ regexResult.message }}
            </p>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">MATCHES</p>
              <div v-if="regexResult.matches.length" class="mt-3 space-y-2">
                <div
                  v-for="match in regexResult.matches"
                  :key="`${match.index}-${match.text}`"
                  class="border border-border-default px-3 py-2 text-sm"
                >
                  <p><span class="text-accent-coral">Match:</span> {{ match.text }}</p>
                  <p class="mt-1 text-text-secondary">Vị trí: {{ match.index }}</p>
                  <p class="mt-1 text-text-secondary">
                    Groups:
                    {{ match.groups.length ? match.groups.join(', ') : 'Không có capture group.' }}
                  </p>
                </div>
              </div>
              <p v-else class="mt-2 text-sm text-text-secondary">Chưa có match để hiển thị.</p>
            </div>
          </article>

          <article
            v-if="currentPage === 'time'"
            class="animate-fade-up animate-delay-7 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-sky">06</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Slug Generator</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Chuyển tiêu đề có dấu sang slug ASCII ổn định, sạch và thân thiện với URL.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('slug', slugResult.slug)"
              >
                Copy Slug
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >TEXT</label
            >
            <textarea
              v-model="slugInput"
              rows="5"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': slugResult.tone === 'default',
                'text-accent-sky': slugResult.tone === 'success',
                'text-accent-amber': slugResult.tone === 'error',
              }"
            >
              {{ slugResult.message }}
            </p>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">SLUG</p>
              <p class="mt-2 break-all font-mono text-sm">
                {{ slugResult.slug || 'slug-se-hien-o-day' }}
              </p>
            </div>
          </article>

          <article
            v-if="currentPage === 'data'"
            class="animate-fade-up animate-delay-7 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">12</p>
                <h3 class="mt-2 font-display text-xl font-semibold">HTML Escape / Unescape</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Chuyển ký tự đặc biệt sang entity HTML và ngược lại để debug nhanh markup.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('html-escaped', htmlEscapeResult.escaped)"
              >
                Copy Escaped
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >INPUT</label
            >
            <textarea
              v-model="htmlInput"
              rows="4"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
            <p class="mt-4 text-sm text-accent-sky">{{ htmlEscapeResult.message }}</p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">ESCAPED</p>
                <p class="mt-2 break-all text-sm">{{ htmlEscapeResult.escaped || '...' }}</p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">UNESCAPED</p>
                <p class="mt-2 break-all text-sm">{{ htmlEscapeResult.unescaped || '...' }}</p>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'inspect'"
            class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">13</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Text Diff Lite</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  So sánh hai khối text theo từng dòng để nhìn nhanh phần thay đổi.
                </p>
              </div>
            </div>

            <div class="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <label class="block text-xs font-display tracking-[0.2em] text-text-dim"
                  >LEFT</label
                >
                <textarea
                  v-model="diffLeft"
                  rows="5"
                  spellcheck="false"
                  class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
                />
              </div>
              <div>
                <label class="block text-xs font-display tracking-[0.2em] text-text-dim"
                  >RIGHT</label
                >
                <textarea
                  v-model="diffRight"
                  rows="5"
                  spellcheck="false"
                  class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
                />
              </div>
            </div>

            <p class="mt-4 text-sm text-text-secondary">{{ diffResult.summary }}</p>

            <div class="mt-4 space-y-2">
              <div
                v-for="(line, index) in diffResult.lines"
                :key="index"
                class="grid gap-3 border px-4 py-3 text-sm lg:grid-cols-2"
                :class="{
                  'border-border-default bg-bg-deep': line.type === 'same',
                  'border-accent-sky bg-accent-sky/10': line.type === 'added',
                  'border-accent-amber bg-accent-amber/10': line.type === 'removed',
                  'border-accent-coral bg-accent-coral/10': line.type === 'changed',
                }"
              >
                <p class="break-all">{{ line.left || '∅' }}</p>
                <p class="break-all">{{ line.right || '∅' }}</p>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'time'"
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-sky">14</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Cron Parser</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Đọc nhanh cron expression 5 field ở mức mô tả thân thiện với con người.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('cron', cronResult.output)"
              >
                Copy Output
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >CRON</label
            >
            <input
              v-model="cronInput"
              type="text"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': cronResult.tone === 'default',
                'text-accent-sky': cronResult.tone === 'success',
                'text-accent-amber': cronResult.tone === 'error',
              }"
            >
              {{ cronResult.message }}
            </p>
            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="break-words text-sm">
                {{ cronResult.output || 'Phần diễn giải cron sẽ hiện ở đây.' }}
              </p>
            </div>
          </article>

          <article
            v-if="currentPage === 'data'"
            class="animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">15</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Query String Builder</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Nhập nhiều cặp key=value để ráp query string và preview phần URL tương ứng.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('query-builder', queryBuilderResult.query)"
              >
                Copy Query
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >KEY=VALUE PER LINE</label
            >
            <textarea
              v-model="queryBuilderInput"
              rows="5"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">QUERY STRING</p>
                <p class="mt-2 break-all text-sm">{{ queryBuilderResult.query || '...' }}</p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">URL PREVIEW</p>
                <p class="mt-2 break-all text-sm">{{ queryBuilderResult.preview || '...' }}</p>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'inspect'"
            class="animate-fade-up animate-delay-5 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">16</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Number Base Converter</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Chuyển đổi qua lại giữa decimal, binary, octal và hex từ một đầu vào duy nhất.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('number-base', numberBaseResult.hex)"
              >
                Copy Hex
              </button>
            </div>

            <div class="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                v-model="numberBaseInput"
                type="text"
                spellcheck="false"
                class="min-w-0 flex-1 border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
              />
              <select
                v-model="numberBase"
                class="border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
              >
                <option value="10">Decimal</option>
                <option value="2">Binary</option>
                <option value="8">Octal</option>
                <option value="16">Hex</option>
              </select>
            </div>

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': numberBaseResult.tone === 'default',
                'text-accent-sky': numberBaseResult.tone === 'success',
                'text-accent-amber': numberBaseResult.tone === 'error',
              }"
            >
              {{ numberBaseResult.message }}
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">DEC</p>
                <p class="mt-2 break-all font-mono text-sm">
                  {{ numberBaseResult.decimal || '...' }}
                </p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">BIN</p>
                <p class="mt-2 break-all font-mono text-sm">
                  {{ numberBaseResult.binary || '...' }}
                </p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">OCT</p>
                <p class="mt-2 break-all font-mono text-sm">
                  {{ numberBaseResult.octal || '...' }}
                </p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">HEX</p>
                <p class="mt-2 break-all font-mono text-sm">{{ numberBaseResult.hex || '...' }}</p>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'time'"
            class="animate-fade-up animate-delay-6 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-sky">17</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Unix Time Relative</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Xem một timestamp là bao lâu trước hoặc bao lâu nữa so với hiện tại.
                </p>
              </div>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >TIMESTAMP</label
            >
            <input
              v-model="relativeTimestampInput"
              type="text"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': relativeTimeResult.tone === 'default',
                'text-accent-sky': relativeTimeResult.tone === 'success',
                'text-accent-amber': relativeTimeResult.tone === 'error',
              }"
            >
              {{ relativeTimeResult.message }}
            </p>

            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">ABSOLUTE</p>
                <p class="mt-2 text-sm">{{ relativeTimeResult.absolute || '...' }}</p>
              </div>
              <div class="border border-border-default bg-bg-deep px-4 py-3">
                <p class="text-xs font-display tracking-[0.2em] text-text-dim">RELATIVE</p>
                <p class="mt-2 text-sm">{{ relativeTimeResult.relative || '...' }}</p>
              </div>
            </div>
          </article>

          <article
            v-if="currentPage === 'inspect'"
            class="animate-fade-up animate-delay-7 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-coral">18</p>
                <h3 class="mt-2 font-display text-xl font-semibold">HTTP Header Parser</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Parse raw headers thành danh sách key/value và JSON object dễ đọc.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('headers-json', parsedHeaders.json)"
              >
                Copy JSON
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >RAW HEADERS</label
            >
            <textarea
              v-model="rawHeadersInput"
              rows="5"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />

            <div class="mt-4 space-y-2">
              <div
                v-for="header in parsedHeaders.headers"
                :key="header.key"
                class="border border-border-default bg-bg-deep px-4 py-3 text-sm"
              >
                <p>
                  <span class="text-accent-amber">{{ header.key }}</span
                  >: {{ header.value }}
                </p>
              </div>
            </div>

            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">JSON</p>
              <pre
                class="mt-2 overflow-x-auto text-sm whitespace-pre-wrap"
              ><code>{{ parsedHeaders.json || 'JSON object sẽ hiện ở đây.' }}</code></pre>
            </div>
          </article>

          <article
            v-if="currentPage === 'inspect'"
            class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-amber">19</p>
                <h3 class="mt-2 font-display text-xl font-semibold">CSV to JSON</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Convert CSV có header sang JSON array ngay trên client, hỗ trợ quote cơ bản.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('csv-json', csvResult.output)"
              >
                Copy JSON
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >CSV INPUT</label
            >
            <textarea
              v-model="csvInput"
              rows="6"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 font-mono text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
            <p
              class="mt-4 text-sm"
              :class="{
                'text-text-secondary': csvResult.tone === 'default',
                'text-accent-sky': csvResult.tone === 'success',
                'text-accent-amber': csvResult.tone === 'error',
              }"
            >
              {{ csvResult.message }}
            </p>
            <div class="mt-4 border border-border-default bg-bg-deep px-4 py-3">
              <p class="text-xs font-display tracking-[0.2em] text-text-dim">JSON OUTPUT</p>
              <pre
                class="mt-2 overflow-x-auto text-sm whitespace-pre-wrap"
              ><code>{{ csvResult.output || 'Kết quả JSON sẽ hiện ở đây.' }}</code></pre>
            </div>
          </article>

          <article
            v-if="currentPage === 'inspect'"
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-display text-xs tracking-[0.25em] text-accent-sky">20</p>
                <h3 class="mt-2 font-display text-xl font-semibold">Color Converter</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">
                  Nhập màu HEX để xem preview và convert nhanh sang RGB, HSL.
                </p>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
                @click="copyText('color-hex', colorResult.hex)"
              >
                Copy HEX
              </button>
            </div>

            <label class="mt-5 block text-xs font-display tracking-[0.2em] text-text-dim"
              >HEX COLOR</label
            >
            <input
              v-model="colorInput"
              type="text"
              spellcheck="false"
              class="mt-2 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-coral"
            />
            <p
              class="mt-4 text-sm"
              :class="{
                'text-accent-sky': colorResult.tone === 'success',
                'text-accent-amber': colorResult.tone === 'error',
              }"
            >
              {{ colorResult.message }}
            </p>

            <div class="mt-4 flex items-center gap-4">
              <div
                class="h-16 w-16 border border-border-default"
                :style="{ backgroundColor: colorResult.hex || 'transparent' }"
              />
              <div class="grid flex-1 gap-3">
                <div class="border border-border-default bg-bg-deep px-4 py-3">
                  <p class="text-xs font-display tracking-[0.2em] text-text-dim">HEX</p>
                  <p class="mt-2 break-all text-sm">{{ colorResult.hex || '...' }}</p>
                </div>
                <div class="border border-border-default bg-bg-deep px-4 py-3">
                  <p class="text-xs font-display tracking-[0.2em] text-text-dim">RGB</p>
                  <p class="mt-2 break-all text-sm">{{ colorResult.rgb || '...' }}</p>
                </div>
                <div class="border border-border-default bg-bg-deep px-4 py-3">
                  <p class="text-xs font-display tracking-[0.2em] text-text-dim">HSL</p>
                  <p class="mt-2 break-all text-sm">{{ colorResult.hsl || '...' }}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
