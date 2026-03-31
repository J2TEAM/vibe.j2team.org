<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { getValidRules } from './rules'
import type { RuleWithStatus } from './types'
const logoUrl = '/shared/web-logo.svg'

const password = ref('')
const gameStarted = ref(false)
const gameWon = ref(false)
const showConfetti = ref(false)
const showPassedRules = ref(false)
const { copy, copied } = useClipboard()
const copiedRuleId = ref<number | null>(null)
const passwordInput = ref<HTMLTextAreaElement | null>(null)

function makeSeed() {
  return Math.floor((Date.now() + Math.random() * 999999) % 100000)
}

const seed = ref(makeSeed())
const allRules = ref(getValidRules(seed.value))

function initRules() {
  return allRules.value.map((rule, index) => ({
    ...rule,
    status: (index === 0 ? 'active' : 'hidden') as RuleWithStatus['status'],
  }))
}

const rulesWithStatus = ref<RuleWithStatus[]>(initRules())

// Rules chưa pass (active/failed) — luôn ở trên cùng
const pendingRules = computed(() =>
  rulesWithStatus.value.filter((r) => r.status === 'active' || r.status === 'failed'),
)

// Rules đã pass — thu gọn ở dưới
const passedRules = computed(() => rulesWithStatus.value.filter((r) => r.status === 'passed'))

const passedCount = computed(() => passedRules.value.length)

const totalVisibleRules = computed(
  () => rulesWithStatus.value.filter((r) => r.status !== 'hidden').length,
)

const totalRules = computed(() => allRules.value.length)

const progressPercent = computed(() =>
  totalRules.value === 0 ? 0 : Math.round((passedCount.value / totalRules.value) * 100),
)

function validateVisibleRules(value: string): boolean {
  const visibleRules = rulesWithStatus.value.filter((rule) => rule.status !== 'hidden')
  let allVisiblePassed = visibleRules.length > 0

  visibleRules.forEach((rule) => {
    const passed = rule.validate(value)
    rule.status = passed ? 'passed' : 'failed'
    if (!passed) allVisiblePassed = false
  })

  return allVisiblePassed
}

function evaluatePassword(value: string) {
  if (value.length === 0) {
    rulesWithStatus.value.forEach((rule, index) => {
      rule.status = index === 0 ? 'active' : 'hidden'
    })
    gameWon.value = false
    return
  }

  while (validateVisibleRules(value) && !gameWon.value) {
    const nextHidden = rulesWithStatus.value.find((r) => r.status === 'hidden')

    if (nextHidden) {
      nextHidden.status = 'active'
    } else {
      if (passedCount.value === totalRules.value) {
        gameWon.value = true
        showConfetti.value = true
        setTimeout(() => (showConfetti.value = false), 6000)
      }
      break
    }
  }
}

watch(password, (val) => {
  if (!gameStarted.value && val.length > 0) gameStarted.value = true
  evaluatePassword(val)
  nextTick(resizePasswordInput)
})

function restartGame() {
  seed.value = makeSeed()
  allRules.value = getValidRules(seed.value)
  password.value = ''
  gameStarted.value = false
  gameWon.value = false
  showPassedRules.value = false
  rulesWithStatus.value = initRules()
}

function handleCopyPassword() {
  copy(password.value)
}

function resizePasswordInput() {
  if (!passwordInput.value) return
  passwordInput.value.style.height = '0px'
  passwordInput.value.style.height = `${Math.min(passwordInput.value.scrollHeight, 240)}px`
  passwordInput.value.style.overflowY = passwordInput.value.scrollHeight > 240 ? 'auto' : 'hidden'
}

async function handleCopyRuleTarget(rule: RuleWithStatus) {
  if (!rule.targetCopy) return
  await copy(rule.targetCopy)
  copiedRuleId.value = rule.id
  setTimeout(() => {
    if (copiedRuleId.value === rule.id) copiedRuleId.value = null
  }, 1400)
}

// Hint động — hàm hoặc chuỗi
function getRuleHint(rule: RuleWithStatus): string {
  if (typeof rule.hint === 'function') return rule.hint(password.value)
  return rule.hint ?? ''
}

function getStatusIcon(status: string): string {
  if (status === 'passed') return 'lucide:check-circle-2'
  if (status === 'failed') return 'lucide:x-circle'
  return 'lucide:circle-dashed'
}

function getCategoryColor(category?: string): string {
  const map: Record<string, string> = {
    core: 'text-text-dim',
    math: 'text-accent-amber',
    viet: 'text-accent-coral',
    it: 'text-accent-sky',
    subject: 'text-green-400',
    folk: 'text-orange-400',
    time: 'text-purple-400',
    language: 'text-pink-400',
    logic: 'text-cyan-400',
    culture: 'text-yellow-400',
    science: 'text-teal-400',
    history: 'text-red-400',
  }
  return map[category ?? ''] ?? 'text-text-dim'
}

onMounted(() => {
  passwordInput.value?.focus()
  resizePasswordInput()
})
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden bg-bg-deep text-text-primary font-body">
    <img
      :src="logoUrl"
      alt="Logo"
      class="pointer-events-none absolute right-3 top-3 z-0 w-28 rotate-12 opacity-70 mix-blend-screen drop-shadow-[0_0_18px_rgba(255,107,74,0.18)] sm:right-5 sm:top-4 sm:w-36 md:w-44"
      style="filter: brightness(0) invert(1)"
    />
    <!-- Confetti khi thắng -->
    <transition name="fade">
      <div v-if="showConfetti" class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <div
          v-for="i in 80"
          :key="i"
          class="absolute w-2 h-2 rounded-full animate-bounce"
          :class="[
            i % 4 === 0
              ? 'bg-accent-coral'
              : i % 4 === 1
                ? 'bg-accent-amber'
                : i % 4 === 2
                  ? 'bg-accent-sky'
                  : 'bg-green-400',
          ]"
          :style="{
            left: `${(i * 1.25) % 100}%`,
            top: `${(i * 2.3) % 100}%`,
            animationDelay: `${(i % 8) * 0.25}s`,
            animationDuration: `${0.6 + (i % 5) * 0.3}s`,
          }"
        />
      </div>
    </transition>

    <div class="relative z-10 mx-auto max-w-4xl px-4 py-5 sm:px-5 sm:py-6">
      <!-- Header -->
      <div class="mb-5 animate-fade-up">
        <RouterLink
          to="/"
          class="mb-4 inline-flex items-center gap-2 text-xs text-text-secondary transition-colors hover:text-accent-coral sm:text-sm"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>

        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="mb-2 flex items-center gap-2">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              <span class="text-text-dim font-display text-xs tracking-widest uppercase"
                >Game mật khẩu</span
              >
            </div>
            <h1
              class="font-display text-2xl font-bold leading-tight text-text-primary sm:text-3xl md:text-4xl"
            >
              Mật Khẩu <span class="text-accent-coral">Địa Ngục</span>
            </h1>
            <p class="mt-2 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm">
              Tạo một mật khẩu vượt qua
              <strong class="text-text-primary">{{ totalRules }} quy tắc</strong>. Càng lên cao, các
              quy tắc càng bắt đầu phụ thuộc vào nhau.
            </p>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mb-5 animate-fade-up animate-delay-1">
        <div
          class="mb-2 flex items-center justify-between text-[11px] font-display tracking-wide text-text-dim sm:text-xs"
        >
          <span>TIẾN ĐỘ</span>
          <span class="text-accent-amber">{{ passedCount }} / {{ totalRules }} QUY TẮC</span>
        </div>
        <div class="h-1 overflow-hidden border border-border-default bg-bg-surface">
          <div
            class="h-full bg-accent-coral transition-all duration-500"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- Win screen -->
      <transition name="scale-up">
        <div
          v-if="gameWon"
          class="mb-6 border border-accent-amber bg-bg-surface p-5 text-center sm:p-6"
        >
          <div class="mb-3 text-5xl">🏆</div>
          <h2 class="mb-2 font-display text-2xl font-bold text-accent-amber sm:text-3xl">
            Bạn đã thoát khỏi Địa Ngục!
          </h2>
          <p class="mb-5 text-sm text-text-secondary">
            Vượt qua tất cả <strong class="text-text-primary">{{ totalRules }} quy tắc</strong> điên
            rồ. Bạn xứng đáng được gọi là
            <span class="text-accent-coral font-bold">Mật Khẩu Thánh</span>!
          </p>
          <div class="flex gap-3 justify-center flex-wrap">
            <button
              class="inline-flex items-center gap-2 bg-accent-coral text-bg-deep font-display font-bold px-6 py-3 tracking-wide hover:opacity-80 transition-opacity"
              @click="handleCopyPassword"
            >
              <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
              {{ copied ? 'Đã copy!' : 'Copy mật khẩu' }}
            </button>
            <button
              class="inline-flex items-center gap-2 border border-border-default text-text-secondary px-6 py-3 font-display tracking-wide hover:border-accent-coral hover:text-text-primary transition-colors"
              @click="restartGame"
            >
              <Icon icon="lucide:rotate-ccw" class="size-4" />
              Chơi lại (bộ mới)
            </button>
          </div>
        </div>
      </transition>

      <div class="animate-fade-up animate-delay-2">
        <!-- Password input -->
        <div class="mb-6">
          <label
            for="password-input"
            class="mb-2 block text-[11px] font-display tracking-widest text-text-dim uppercase sm:text-xs"
          >
            Nhập mật khẩu của bạn
          </label>
          <div class="relative">
            <textarea
              ref="passwordInput"
              id="password-input"
              v-model="password"
              placeholder="Gõ gì đó vào đây..."
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              rows="1"
              class="w-full min-h-[52px] max-h-[220px] resize-none overflow-hidden border border-border-default bg-bg-surface px-3 py-3 pr-16 text-sm leading-relaxed text-text-primary placeholder-text-dim transition-colors focus:outline-none focus:border-accent-coral sm:min-h-[58px] sm:pr-18"
            />
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <span class="text-[11px] text-text-dim font-display tabular-nums sm:text-xs">{{
                password.length
              }}</span>
              <button
                v-if="password.length > 0"
                class="text-text-dim hover:text-accent-coral transition-colors"
                @click="password = ''"
              >
                <Icon icon="lucide:x" class="size-4" />
              </button>
            </div>
          </div>
          <div
            v-if="password.length > 0"
            class="mt-2 border border-border-default bg-bg-surface p-3"
          >
            <p class="mb-1 text-xs font-display tracking-wide text-text-dim">XEM TRƯỚC</p>
            <p class="font-mono text-xs leading-relaxed break-all text-text-secondary sm:text-sm">
              {{ password }}
            </p>
          </div>
        </div>

        <!-- Rules section -->
        <div>
          <!-- Header -->
          <div class="mb-3 flex items-center gap-2">
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
            <h2 class="font-display text-base font-semibold text-text-primary sm:text-lg">
              Quy tắc cần vượt qua
            </h2>
            <span class="ml-auto text-[11px] font-display text-text-dim sm:text-xs"
              >{{ totalVisibleRules }} / {{ totalRules }} đã hiện</span
            >
          </div>

          <!-- Pending rules (active/failed) — luôn ở trên -->
          <transition-group name="rule-appear" tag="div" class="space-y-2">
            <div
              v-for="rule in pendingRules"
              :key="rule.id"
              class="border bg-bg-surface px-3 py-3 transition-all duration-300 sm:px-4"
              :class="rule.status === 'failed' ? 'border-accent-coral/60' : 'border-border-default'"
            >
              <div class="flex items-start gap-3">
                <div class="shrink-0 mt-0.5">
                  <Icon
                    :icon="getStatusIcon(rule.status)"
                    class="size-5 transition-colors"
                    :class="rule.status === 'failed' ? 'text-accent-coral' : 'text-text-dim'"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="mb-1 flex items-center gap-2 flex-wrap">
                    <span class="text-[11px] font-display tracking-widest text-text-dim sm:text-xs"
                      >RULE {{ rule.id }}</span
                    >
                    <span
                      v-if="rule.category"
                      class="text-[11px] font-display tracking-wide uppercase sm:text-xs"
                      :class="getCategoryColor(rule.category)"
                      >{{ rule.category }}</span
                    >
                    <span v-if="rule.emoji" class="ml-auto text-sm">{{ rule.emoji }}</span>
                  </div>
                  <p class="font-display text-sm font-semibold leading-snug text-text-primary">
                    {{ rule.title }}
                  </p>
                  <div v-if="rule.targetCopy" class="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      class="border border-border-default bg-bg-deep/40 px-2 py-1 text-[11px] font-mono break-all text-text-secondary sm:text-xs"
                    >
                      {{ rule.targetCopy }}
                    </span>
                    <button
                      class="inline-flex items-center gap-1 border border-border-default px-2 py-1 text-[11px] font-display tracking-wide text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
                      @click="handleCopyRuleTarget(rule)"
                    >
                      <Icon
                        :icon="copiedRuleId === rule.id ? 'lucide:check' : 'lucide:copy'"
                        class="size-3"
                      />
                      {{ copiedRuleId === rule.id ? 'Đã copy' : 'Copy' }}
                    </button>
                  </div>
                  <!-- Hint khi failed -->
                  <div v-if="rule.status === 'failed'" class="mt-2 space-y-1">
                    <p class="text-xs text-text-secondary">{{ rule.description }}</p>
                    <div v-if="getRuleHint(rule)" class="flex items-start gap-1.5">
                      <Icon
                        icon="lucide:lightbulb"
                        class="size-3 text-accent-amber shrink-0 mt-0.5"
                      />
                      <p class="text-accent-amber text-xs">{{ getRuleHint(rule) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>

          <!-- Rules ẩn placeholder -->
          <div
            v-if="totalVisibleRules < totalRules"
            class="mt-3 flex items-center gap-3 border border-dashed border-border-default px-3 py-2.5 text-sm opacity-50"
          >
            <Icon icon="lucide:lock" class="size-4 text-text-dim" />
            <p class="font-display tracking-wide text-text-dim">
              {{ totalRules - totalVisibleRules }} cấp nữa đang ẩn...
            </p>
          </div>

          <!-- Passed rules — thu gọn ở dưới -->
          <div v-if="passedCount > 0" class="mt-6">
            <button
              class="group flex w-full items-center gap-2 py-1.5 text-left"
              @click="showPassedRules = !showPassedRules"
            >
              <span class="text-green-400 font-display text-sm tracking-widest">//</span>
              <span
                class="font-display text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors"
              >
                Đã hoàn thành
              </span>
              <span
                class="ml-1 bg-green-500/15 text-green-400 text-xs font-display px-2 py-0.5 tabular-nums"
              >
                {{ passedCount }}
              </span>
              <Icon
                icon="lucide:chevron-down"
                class="size-4 text-text-dim ml-auto transition-transform duration-300"
                :class="showPassedRules ? 'rotate-180' : ''"
              />
            </button>

            <transition name="collapse">
              <div v-if="showPassedRules" class="mt-2 space-y-1.5">
                <div
                  v-for="rule in passedRules"
                  :key="rule.id"
                  class="flex items-center gap-3 border border-border-default bg-bg-surface px-3 py-2 opacity-60"
                >
                  <Icon icon="lucide:check-circle-2" class="size-4 text-green-400 shrink-0" />
                  <span class="shrink-0 text-xs font-display tracking-widest text-text-dim">{{
                    String(rule.id).padStart(2, '0')
                  }}</span>
                  <p class="text-text-secondary text-xs line-through truncate">{{ rule.title }}</p>
                  <span v-if="rule.emoji" class="ml-auto shrink-0 text-sm">{{ rule.emoji }}</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border-default pt-4 text-sm"
      >
        <p class="text-text-dim text-xs font-display tracking-wide">
          INSPIRED BY <span class="text-accent-coral">neal.fun/password-game</span>
        </p>
        <button
          class="text-xs text-text-dim hover:text-accent-coral transition-colors font-display tracking-wide flex items-center gap-1.5"
          @click="restartGame"
        >
          <Icon icon="lucide:rotate-ccw" class="size-3" />
          CHƠI LẠI
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-appear-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.rule-appear-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
}
.rule-appear-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}
.rule-appear-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}
.rule-appear-move {
  transition: transform 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-up-enter-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.scale-up-enter-from {
  opacity: 0;
  transform: scale(0.92);
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 3000px;
}
</style>
