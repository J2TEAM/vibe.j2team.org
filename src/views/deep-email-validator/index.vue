<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { watchDebounced } from '@vueuse/core'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { analyzeEmail, type CheckStatus } from './utils/email-analyzer'

const emailInput = ref('')
const debouncedEmail = ref('')
const hasBlurred = ref(false)
const showTechnicalDetails = ref(false)

const normalizedInput = computed(() => emailInput.value.trim())
const hasInput = computed(() => normalizedInput.value.length > 0)

watchDebounced(
  emailInput,
  (value) => {
    debouncedEmail.value = value.trim()
  },
  { debounce: 300, maxWait: 600 },
)

const validationResult = computed(() => analyzeEmail(debouncedEmail.value))

const hasFail = computed(() => validationResult.value.checks.some((check) => check.status === 'fail'))
const hasWarning = computed(() =>
  validationResult.value.checks.some((check) => check.status === 'warning'),
)

// Fail-level issues are hidden while users are still typing.
const shouldShowFailures = computed(() => hasBlurred.value)

const visibleChecks = computed(() => {
  if (!hasInput.value) {
    return []
  }

  if (shouldShowFailures.value) {
    return validationResult.value.checks
  }

  return validationResult.value.checks.filter((check) => check.status !== 'fail')
})

const displayStatus = computed<CheckStatus>(() => {
  if (!hasInput.value) {
    return 'pass'
  }

  if (shouldShowFailures.value) {
    return validationResult.value.status
  }

  if (visibleChecks.value.some((check) => check.status === 'warning')) {
    return 'warning'
  }

  return 'pass'
})

const summaryText = computed(() => {
  if (!hasInput.value) {
    return 'Nhập email để bắt đầu phân tích.'
  }

  if (!shouldShowFailures.value && hasFail.value) {
    return 'Bạn đang nhập email. Các lỗi bắt buộc sẽ hiển thị sau khi rời ô nhập liệu.'
  }

  if (displayStatus.value === 'fail') {
    return 'Email chưa đạt các điều kiện bắt buộc.'
  }

  if (displayStatus.value === 'warning') {
    return 'Email hợp lệ cơ bản nhưng có cảnh báo cần xem lại.'
  }

  return 'Email đạt kiểm tra cú pháp và không có cảnh báo đáng chú ý.'
})

const statusLabel = computed(() => {
  if (displayStatus.value === 'fail') {
    return 'Fail'
  }

  if (displayStatus.value === 'warning') {
    return 'Warning'
  }

  return 'Pass'
})

const statusIcon = computed(() => {
  if (displayStatus.value === 'fail') {
    return 'lucide:x-circle'
  }

  if (displayStatus.value === 'warning') {
    return 'lucide:triangle-alert'
  }

  return 'lucide:badge-check'
})

const statusClass = computed(() => {
  if (displayStatus.value === 'fail') {
    return 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral'
  }

  if (displayStatus.value === 'warning') {
    return 'border-accent-amber/50 bg-accent-amber/12 text-accent-amber'
  }

  return 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky'
})

function markBlurred() {
  hasBlurred.value = true
}

function applySuggestion(value: string) {
  emailInput.value = value
  hasBlurred.value = true
}

function getCheckIcon(status: CheckStatus) {
  if (status === 'fail') {
    return 'lucide:x-circle'
  }

  if (status === 'warning') {
    return 'lucide:triangle-alert'
  }

  return 'lucide:check-circle-2'
}

function getCheckClass(status: CheckStatus) {
  if (status === 'fail') {
    return 'text-accent-coral'
  }

  if (status === 'warning') {
    return 'text-accent-amber'
  }

  return 'text-accent-sky'
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep px-4 py-8 text-text-primary">
    <div class="mx-auto max-w-5xl">
      <div class="mb-4 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Quay về trang chủ
        </RouterLink>
      </div>

      <header class="animate-fade-up border border-border-default bg-bg-surface p-6">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <h1 class="font-display text-4xl font-bold text-accent-coral sm:text-5xl">
            Deep Email Validator
          </h1>
          <span
            class="inline-flex items-center gap-1 border border-accent-sky/40 bg-accent-sky/10 px-2 py-1 font-display text-xs tracking-wide text-accent-sky"
          >
            <Icon icon="lucide:shield-check" class="size-3.5" />
            Client-side analysis only
          </span>
        </div>

        <p class="text-text-secondary">
          Phân tích email theo nhiều lớp: cú pháp, domain, cảnh báo rủi ro và gợi ý sửa typo.
          Công cụ này không gửi email và không kiểm tra mailbox tồn tại thật (MX/SMTP).
        </p>

        <div
          class="mt-4 border border-accent-amber/35 bg-accent-amber/10 p-3 text-sm text-text-secondary"
        >
          <div class="flex items-start gap-2">
            <Icon icon="lucide:info" class="mt-0.5 size-4 text-accent-amber" />
            <p>
              Kết quả thể hiện <strong class="text-text-primary">khả năng hợp lệ</strong> trên phía
              trình duyệt, không phải xác thực tuyệt đối hộp thư.
            </p>
          </div>
        </div>

      </header>

      <section class="mt-6 animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-6">
        <label for="email-input" class="mb-2 block font-display text-sm tracking-wide text-text-primary">
          // Email cần kiểm tra
        </label>
        <input
          id="email-input"
          v-model="emailInput"
          type="email"
          autocomplete="off"
          spellcheck="false"
          placeholder="ví dụ: hello@gmial.com"
          class="w-full border border-border-default bg-bg-deep px-4 py-3 text-base text-text-primary placeholder-text-dim focus:border-accent-coral focus:outline-none"
          @blur="markBlurred"
        />
      </section>

      <section class="mt-6 animate-fade-up animate-delay-2 min-h-40 border border-border-default bg-bg-surface p-6">
        <h2 class="mb-4 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary">
          <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
          Kết luận
        </h2>

        <div
          :class="statusClass"
          class="inline-flex items-center gap-2 border px-3 py-2 font-display text-sm tracking-wide"
        >
          <Icon :icon="statusIcon" class="size-4" />
          {{ statusLabel }}
        </div>

        <div aria-live="polite" class="mt-3 space-y-2 text-sm">
          <p class="text-text-primary">{{ summaryText }}</p>
          <p v-if="hasInput" class="text-text-secondary">
            Điểm heuristic: <strong class="text-text-primary">{{ validationResult.score }}/100</strong>
            <span class="text-text-dim">• Normalized: {{ validationResult.normalizedEmail }}</span>
          </p>
        </div>
      </section>

      <section class="mt-6 animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-6">
        <h2 class="mb-4 flex items-center gap-3 font-display text-2xl font-semibold text-text-primary">
          <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
          Cảnh báo
        </h2>

        <div v-if="!hasInput" class="text-sm text-text-dim">Chưa có dữ liệu để hiển thị cảnh báo.</div>

        <div v-else-if="!hasWarning" class="text-sm text-text-secondary">
          Không có cảnh báo đáng chú ý.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="warning in validationResult.warnings"
            :key="warning.id"
            class="border border-accent-amber/30 bg-accent-amber/10 p-3"
          >
            <div class="flex items-start gap-2">
              <Icon icon="lucide:triangle-alert" class="mt-0.5 size-4 text-accent-amber" />
              <div>
                <p class="text-sm font-medium text-text-primary">{{ warning.label }}</p>
                <p class="text-sm text-text-secondary">{{ warning.message }}</p>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="validationResult.suggestions.length > 0" class="mt-4 space-y-3">
          <h3 class="font-display text-sm tracking-wide text-accent-sky">Gợi ý sửa nhanh</h3>
          <div
            v-for="suggestion in validationResult.suggestions"
            :key="suggestion.value"
            class="border border-accent-sky/35 bg-accent-sky/10 p-3"
          >
            <p class="text-sm text-text-secondary">{{ suggestion.reason }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <code class="border border-border-default bg-bg-deep px-2 py-1 text-xs text-text-primary">
                {{ suggestion.value }}
              </code>
              <button
                type="button"
                class="inline-flex items-center gap-2 border border-accent-coral/50 bg-accent-coral/15 px-3 py-1.5 text-xs font-medium text-accent-coral transition hover:bg-accent-coral/25"
                @click="applySuggestion(suggestion.value)"
              >
                <Icon icon="lucide:wand-sparkles" class="size-3.5" />
                Dùng gợi ý này
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-6 animate-fade-up animate-delay-4 border border-border-default bg-bg-surface p-6">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary">
            <span class="font-display text-sm tracking-widest text-accent-sky">//</span>
            Chi tiết kỹ thuật
          </h2>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
            @click="showTechnicalDetails = !showTechnicalDetails"
          >
            <Icon :icon="showTechnicalDetails ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="size-4" />
            {{ showTechnicalDetails ? 'Thu gọn' : 'Mở chi tiết kỹ thuật' }}
          </button>
        </div>

        <div v-if="!hasInput" class="text-sm text-text-dim">Nhập email để xem chi tiết từng rule.</div>

        <ul v-else class="space-y-3">
          <li
            v-for="check in visibleChecks"
            :key="check.id"
            class="border border-border-default bg-bg-deep p-3"
          >
            <div class="flex items-start gap-3">
              <Icon :icon="getCheckIcon(check.status)" :class="getCheckClass(check.status)" class="mt-0.5 size-4" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-text-primary">{{ check.label }}</p>
                <p class="text-sm text-text-secondary">{{ check.message }}</p>
                <p v-if="showTechnicalDetails" class="mt-1 text-xs text-text-dim">
                  {{ check.technical }}
                </p>
              </div>
            </div>
          </li>
        </ul>

        <p v-if="hasFail && !shouldShowFailures" class="mt-4 text-xs text-text-dim">
          Một số lỗi nặng sẽ hiển thị sau khi bạn blur khỏi input để giảm nhiễu lúc đang gõ.
        </p>
      </section>

      <footer
        class="mt-6 animate-fade-up animate-delay-5 border border-border-default bg-bg-surface px-6 py-4 text-sm text-text-secondary"
      >
        <p class="text-center">
          Khám phá nhiều hơn tại
          <a
            href="https://nudgen.net"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-1 text-accent-sky transition hover:text-text-primary"
          >
            nudgen/net
          </a>
        </p>
      </footer>
    </div>
  </div>
</template>
