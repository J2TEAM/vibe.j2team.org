<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import CustomSelectList from './components/CustomSelectList.vue'
import HistoryList from './components/HistoryList.vue'
import ScoreGauge from './components/ScoreGauge.vue'
import HourlyTimeline from './components/HourlyTimeline.vue'
import TopWindowsCard from './components/TopWindowsCard.vue'
import { useDeployAdvisor } from './composables/useDeployAdvisor'
import { useDeployHistory } from './composables/useDeployHistory'

const advisor = useDeployAdvisor()
const historyState = useDeployHistory()

const {
  currentHour,
  nowText,
  deployers,
  riskLevel,
  releaseType,
  testPassRate,
  filesChanged,
  hasRollbackPlan,
  currentBreakdown,
  verdict,
  hourlyScores,
  topThreeWindows,
  copied,
  exportBrief,
  addDeployer,
  removeDeployer,
  toHistoryItem,
} = advisor

const { history, clearHistory, addHistory } = historyState

const riskOptions = [
  { value: 'low', label: 'Low', description: 'Deployment nhẹ, ít vùng ảnh hưởng' },
  { value: 'medium', label: 'Medium', description: 'Mức cân bằng, cần giám sát chuẩn' },
  { value: 'high', label: 'High', description: 'Nhiều rủi ro, cần kiểm soát chặt' },
] as const

const releaseTypeOptions = [
  { value: 'hotfix', label: 'Hotfix', description: 'Vá lỗi khẩn cấp, ưu tiên tốc độ' },
  { value: 'minor', label: 'Minor', description: 'Nâng cấp nhỏ, an toàn tương đối' },
  { value: 'major', label: 'Major', description: 'Thay đổi lớn, cần chuẩn bị kỹ' },
] as const

function updateRiskLevel(value: string): void {
  if (value === 'low' || value === 'medium' || value === 'high') {
    riskLevel.value = value
  }
}

function updateReleaseType(value: string): void {
  if (value === 'hotfix' || value === 'minor' || value === 'major') {
    releaseType.value = value
  }
}

function saveCurrentEvaluation(): void {
  addHistory(toHistoryItem())
}

function adjustBirthYear(index: number, delta: number): void {
  const deployer = deployers.value[index]
  if (!deployer) return

  const currentValue = deployer.birthYear ?? 2000
  const nextValue = Math.max(1950, Math.min(2100, currentValue + delta))
  deployer.birthYear = nextValue
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-bg-deep px-4 py-8 text-text-primary sm:px-6">
    <div class="pointer-events-none absolute -left-28 top-24 h-64 w-64 rounded-full bg-accent-coral/10 blur-3xl" />
    <div class="pointer-events-none absolute -right-20 top-52 h-56 w-56 rounded-full bg-accent-amber/10 blur-3xl" />

    <section class="relative mx-auto max-w-5xl animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>

      <header
        class="relative mt-6 overflow-hidden border border-border-default bg-bg-surface p-6 animate-fade-up animate-delay-1"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(90deg,rgba(255,107,74,0.16),rgba(255,184,48,0.1),rgba(56,189,248,0.08))]"
        />
        <p class="font-display text-xs tracking-widest text-accent-sky">// DEPLOY COMMAND CENTER</p>
        <h1 class="mt-2 font-display text-3xl font-bold text-accent-coral sm:text-5xl">
          Deploy Hành Thông
        </h1>
        <p class="mt-3 text-sm text-text-secondary sm:text-base">
          Hệ thống hỗ trợ chọn thời điểm release dựa trên tín hiệu thời gian, cấu hình rủi ro và thông
          số kỹ thuật hiện tại.
        </p>
      </header>

      <div class="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <article class="border border-border-default bg-bg-surface p-5 animate-fade-up animate-delay-2">
          <h2 class="flex items-center gap-2 font-display text-lg text-text-primary">
            <span class="text-accent-coral text-sm tracking-widest">//</span>
            Team mode
          </h2>

          <div class="mt-4 space-y-3">
            <div
              v-for="(deployer, index) in deployers"
              :key="`deployer-${index}`"
              class="grid gap-2 border border-border-default bg-bg-deep p-3 sm:grid-cols-[1fr_190px_auto]"
            >
              <input
                v-model="deployer.name"
                type="text"
                placeholder="Tên người deploy"
                class="w-full border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-coral"
              >
              <div class="grid grid-cols-[34px_1fr_34px] border border-border-default bg-bg-surface">
                <button
                  type="button"
                  class="inline-flex items-center justify-center border-r border-border-default text-text-secondary transition hover:bg-bg-elevated hover:text-text-primary"
                  @click="adjustBirthYear(index, -1)"
                >
                  <Icon icon="lucide:minus" class="size-3.5" />
                </button>

                <input
                  v-model.number="deployer.birthYear"
                  type="number"
                  min="1950"
                  max="2100"
                  placeholder="Năm sinh"
                  class="no-spinner w-full bg-transparent px-2 py-2 text-center text-sm text-text-primary outline-none"
                >

                <button
                  type="button"
                  class="inline-flex items-center justify-center border-l border-border-default text-text-secondary transition hover:bg-bg-elevated hover:text-text-primary"
                  @click="adjustBirthYear(index, 1)"
                >
                  <Icon icon="lucide:plus" class="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                class="border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="deployers.length === 1"
                @click="removeDeployer(index)"
              >
                Xóa
              </button>
            </div>
          </div>

          <button
            type="button"
            class="mt-3 inline-flex items-center gap-2 border border-border-default px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click="addDeployer"
          >
            <Icon icon="lucide:user-plus" class="size-4" />
            Thêm thành viên deploy
          </button>

          <h3 class="mt-6 font-display text-base text-text-primary">Scenario simulation</h3>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="text-text-secondary">Risk level</span>
              <CustomSelectList
                :model-value="riskLevel"
                :options="riskOptions"
                left-icon="lucide:shield-alert"
                left-icon-class="text-accent-amber"
                @update:model-value="updateRiskLevel"
              />
            </label>

            <label class="block text-sm">
              <span class="text-text-secondary">Release type</span>
              <CustomSelectList
                :model-value="releaseType"
                :options="releaseTypeOptions"
                left-icon="lucide:rocket"
                left-icon-class="text-accent-sky"
                @update:model-value="updateReleaseType"
              />
            </label>

            <label class="block text-sm">
              <span class="text-text-secondary">Test pass rate: {{ testPassRate }}%</span>
              <input v-model.number="testPassRate" type="range" min="40" max="100" class="mt-2 w-full">
            </label>

            <label class="block text-sm">
              <span class="text-text-secondary">Files changed: {{ filesChanged }}</span>
              <input v-model.number="filesChanged" type="range" min="1" max="300" class="mt-2 w-full">
            </label>

            <label class="inline-flex items-center gap-2 text-sm text-text-secondary sm:col-span-2">
              <input v-model="hasRollbackPlan" type="checkbox" class="size-4 accent-accent-coral">
              Có rollback plan rõ ràng
            </label>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-border-default bg-bg-deep px-3 py-2 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              @click="exportBrief"
            >
              <Icon icon="lucide:clipboard" class="size-4" />
              Export brief
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral px-3 py-2 text-xs font-semibold text-bg-deep transition hover:brightness-110"
              @click="saveCurrentEvaluation"
            >
              <Icon icon="lucide:save" class="size-4" />
              Lưu snapshot
            </button>

            <span
              v-if="copied"
              class="inline-flex items-center gap-1 border border-accent-sky/50 bg-accent-sky/10 px-3 py-2 text-xs text-accent-sky"
            >
              <Icon icon="lucide:check" class="size-3.5" />
              Copied
            </span>
          </div>

          <p class="mt-3 text-xs text-text-dim">Copy brief để dán vào PR hoặc Slack.</p>
        </article>

        <div class="space-y-5">
          <ScoreGauge :score="currentBreakdown.score" :verdict="verdict" />

          <article class="border border-border-default bg-bg-surface p-5">
            <h2 class="flex items-center gap-2 font-display text-lg text-text-primary">
              <span class="text-accent-amber text-sm tracking-widest">//</span>
              Trạng thái hiện tại
            </h2>
            <p class="mt-2 text-sm text-text-secondary">{{ nowText }}</p>
            <ul class="mt-4 space-y-1 text-xs text-text-dim">
              <li v-for="reason in currentBreakdown.reasons" :key="reason">{{ reason }}</li>
            </ul>
          </article>
        </div>
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-2">
        <HourlyTimeline :scores="hourlyScores" :current-hour="currentHour" />
        <TopWindowsCard :windows="topThreeWindows" />
      </div>

      <div class="mt-5">
        <HistoryList :items="history" @clear="clearHistory" />
      </div>

      <p class="mt-5 border border-border-default bg-bg-surface p-4 text-xs text-text-dim animate-fade-up animate-delay-4">
        Lưu ý: Công cụ chỉ mang tính giải trí và tham khảo. Trước khi release, luôn kiểm tra test,
        backup, monitoring và kế hoạch rollback.
      </p>
    </section>
  </main>
</template>

<style scoped>
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spinner[type='number'] {
  -moz-appearance: textfield;
}
</style>
