<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useCognitoAuth } from './composables/useCognitoAuth'
import { useAwsCost } from './composables/useAwsCost'
import AwsAuth from './components/AwsAuth.vue'
import CostDashboard from './components/CostDashboard.vue'
import type { CognitoConfig, Granularity } from './types'

useHead({
  title: 'My AWS Dashboards — Cost & Billing Monitor',
  meta: [
    {
      name: 'description',
      content:
        'Monitor AWS resource costs with interactive charts, service breakdowns, and exportable reports.',
    },
  ],
})

const showAuth = ref(false)

const {
  config: cognitoConfig,
  session,
  isAuthenticated,
  hasConfig,
  isAuthLoading,
  authError,
  remainingSeconds,
  login,
  clearConfig,
  initSession,
} = useCognitoAuth()

const {
  errorMessage,
  report,
  isDemoMode,
  isLoading,
  hasReport,
  loadDemoData,
  loadRealData,
  loadFromCliOutput,
} = useAwsCost()

const DEFAULT_START = '2026-01-01'
const DEFAULT_END = new Date().toISOString().slice(0, 10)

// ─── Session countdown display ────────────────────────────────────────────────

const sessionCountdown = computed(() => {
  if (!isAuthenticated.value) return ''
  const total = remainingSeconds.value
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const countdownUrgent = computed(() => remainingSeconds.value > 0 && remainingSeconds.value <= 60)

// ─── Data fetching ────────────────────────────────────────────────────────────

function fetchData(
  start: string,
  end: string,
  granularity: Granularity,
  services: string[],
  useRealData: boolean,
): void {
  if (useRealData && isAuthenticated.value && session.value) {
    loadRealData(
      session.value.accessKeyId,
      session.value.secretAccessKey,
      session.value.sessionToken,
      session.value.region,
      start,
      end,
      granularity,
      services,
    )
  } else {
    loadDemoData(start, end, granularity, services)
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleConnect(cfg: CognitoConfig): Promise<void> {
  try {
    await login(cfg)
    showAuth.value = false
    fetchData(DEFAULT_START, DEFAULT_END, 'MONTHLY', [], true)
  } catch {
    // authError reactive ref is already set by useCognitoAuth — shown in AwsAuth
  }
}

function handleDemo(): void {
  showAuth.value = false
  loadDemoData(DEFAULT_START, DEFAULT_END, 'MONTHLY', [])
}

function handleRefresh(
  start: string,
  end: string,
  granularity: Granularity,
  services: string[],
  useRealData: boolean,
): void {
  fetchData(start, end, granularity, services, useRealData)
}

function handleDisconnect(): void {
  clearConfig()
  window.location.reload()
}

function handleCliOutput(json: string, granularity: Granularity, services: string[]): void {
  loadFromCliOutput(json, granularity, services)
}

onMounted(() => {
  if (!hasReport.value && isAuthenticated.value && session.value) {
    // Active in-memory session (same-tab navigation) — reload data
    loadRealData(
      session.value.accessKeyId,
      session.value.secretAccessKey,
      session.value.sessionToken,
      session.value.region,
      DEFAULT_START,
      DEFAULT_END,
      'MONTHLY',
      [],
    )
    return
  }

  // Page refresh — restore session from sessionStorage (no Cognito round-trip).
  // If the 5-minute window has not elapsed, resume the existing session and
  // reload the dashboard data automatically.
  const restored = initSession()
  if (restored && session.value) {
    loadRealData(
      session.value.accessKeyId,
      session.value.secretAccessKey,
      session.value.sessionToken,
      session.value.region,
      DEFAULT_START,
      DEFAULT_END,
      'MONTHLY',
      [],
    )
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep">
    <!-- Header -->
    <header class="border-b border-border-default bg-bg-surface">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <!-- Logo + title -->
          <div class="flex items-center gap-3">
            <div
              class="flex size-9 items-center justify-center border border-accent-coral bg-bg-elevated"
            >
              <Icon icon="lucide:cloud" class="size-5 text-accent-coral" />
            </div>
            <div>
              <h1 class="font-display text-lg font-bold text-text-primary leading-none">
                My <span class="text-accent-amber">AWS</span> Dashboard
              </h1>
              <p class="mt-0.5 font-display text-xs text-text-dim">Cost & Billing Monitor</p>
            </div>
          </div>

          <!-- Nav -->
          <nav class="flex items-center gap-3">
            <!-- Active tab indicator -->
            <div class="hidden items-center gap-1 sm:flex">
              <button
                type="button"
                class="flex items-center gap-1.5 border border-accent-coral bg-accent-coral/10 px-3 py-1.5 font-display text-xs font-semibold text-accent-coral"
              >
                <Icon icon="lucide:dollar-sign" class="size-3.5" />
                Cost & Billing
              </button>
              <!-- Placeholder for future dashboards -->
              <button
                type="button"
                disabled
                title="Coming soon"
                class="flex cursor-not-allowed items-center gap-1.5 border border-border-default px-3 py-1.5 font-display text-xs text-text-dim opacity-50"
              >
                <Icon icon="lucide:server" class="size-3.5" />
                Resources
              </button>
            </div>

            <!-- Session countdown — shown when authenticated -->
            <div
              v-if="isAuthenticated"
              class="flex items-center gap-1.5 border px-2.5 py-1.5 font-display text-xs"
              :class="
                countdownUrgent
                  ? 'border-red-500/40 bg-red-500/5 text-red-400 animate-pulse'
                  : 'border-accent-amber/30 bg-accent-amber/5 text-accent-amber'
              "
              :title="`Session expires in ${sessionCountdown}`"
            >
              <Icon icon="lucide:timer" class="size-3.5" />
              <span>{{ sessionCountdown }}</span>
            </div>

            <!-- Connection status badge -->
            <div
              class="flex items-center gap-1.5 border px-2.5 py-1.5 font-display text-xs"
              :class="
                isAuthenticated
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                  : isDemoMode
                    ? 'border-accent-sky/30 bg-accent-sky/5 text-accent-sky'
                    : 'border-border-default text-text-dim'
              "
            >
              <Icon
                :icon="isAuthenticated ? 'lucide:shield-check' : 'lucide:database'"
                class="size-3.5"
              />
              <span>{{ isAuthenticated ? 'Cognito Connected' : 'Demo Mode' }}</span>
            </div>

            <!-- Logout button — only shown when Cognito session is active -->
            <button
              v-if="isAuthenticated"
              type="button"
              class="flex items-center gap-1.5 border border-red-500/40 bg-red-500/5 px-2.5 py-1.5 font-display text-xs text-red-400 transition-colors hover:border-red-500/70 hover:bg-red-500/10"
              title="Logout — clears in-memory session credentials"
              @click="handleDisconnect"
            >
              <Icon icon="lucide:log-out" class="size-3.5" />
              <span class="hidden sm:inline">Logout</span>
            </button>

            <!-- Connect button — shown when no active session -->
            <button
              v-if="!isAuthenticated"
              type="button"
              class="flex items-center gap-1.5 border border-accent-coral bg-accent-coral/10 px-2.5 py-1.5 font-display text-xs font-semibold text-accent-coral transition-colors hover:bg-accent-coral/20"
              @click="showAuth = true"
            >
              <Icon icon="lucide:plug" class="size-3.5" />
              <span class="hidden sm:inline">{{ hasConfig ? 'Reconnect' : 'Connect AWS' }}</span>
            </button>

            <!-- Demo mode button — shown when not authenticated and not in demo -->
            <button
              v-if="!isAuthenticated && !isDemoMode"
              type="button"
              class="flex items-center gap-1.5 border border-accent-sky/50 bg-accent-sky/10 px-2.5 py-1.5 font-display text-xs text-accent-sky transition-colors hover:bg-accent-sky/20"
              @click="handleDemo"
            >
              <Icon icon="lucide:layout-dashboard" class="size-3.5" />
              <span class="hidden sm:inline">Demo</span>
            </button>

            <RouterLink
              to="/"
              class="flex items-center gap-1.5 border border-border-default bg-bg-elevated px-2.5 py-1.5 font-display text-xs text-text-secondary transition-colors hover:border-accent-coral/50 hover:text-accent-coral"
            >
              <Icon icon="lucide:home" class="size-3.5" />
              <span class="hidden sm:inline">Home</span>
            </RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <!-- Auth screen — shown when no report yet -->
      <div v-if="!hasReport && !isLoading">
        <AwsAuth
          :saved-config="cognitoConfig"
          :is-loading="isAuthLoading"
          :error-message="authError"
          @connect="handleConnect"
          @demo="handleDemo"
        />
      </div>

      <!-- Initial loading (no report yet) -->
      <div
        v-else-if="!hasReport && isLoading"
        class="flex min-h-[50vh] items-center justify-center"
      >
        <div class="flex flex-col items-center gap-4 animate-fade-up">
          <div
            class="flex size-16 items-center justify-center border border-accent-coral bg-bg-surface"
          >
            <Icon icon="lucide:loader-circle" class="size-8 animate-spin text-accent-coral" />
          </div>
          <p class="font-display text-sm text-text-secondary">Fetching cost data…</p>
        </div>
      </div>

      <!-- Dashboard — stays mounted across refreshes so filter state is preserved -->
      <div v-else class="animate-fade-up">
        <!-- Dashboard header -->
        <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="font-display text-xl font-bold text-text-primary">
              <span class="text-accent-coral">//</span> Cost Explorer
            </h2>
            <p class="mt-1 text-sm text-text-secondary">
              {{ report?.dateRange.start }} — {{ report?.dateRange.end }} ·
              <span class="text-text-dim"
                >{{
                  report?.granularity.charAt(0) + (report?.granularity.slice(1).toLowerCase() ?? '')
                }}
                view</span
              >
            </p>
          </div>
        </div>

        <!-- Refresh loading indicator — inline banner, keeps CostDashboard mounted -->
        <div
          v-if="isLoading"
          class="mb-4 flex items-center gap-3 border border-accent-coral/30 bg-accent-coral/5 px-4 py-3"
        >
          <Icon
            icon="lucide:loader-circle"
            class="size-4 shrink-0 animate-spin text-accent-coral"
          />
          <p class="font-display text-sm text-text-secondary">Fetching cost data…</p>
        </div>

        <CostDashboard
          v-if="report"
          :report="report"
          :is-demo-mode="isDemoMode"
          :has-credentials="isAuthenticated"
          :error-message="errorMessage"
          @refresh="handleRefresh"
          @disconnect="handleDisconnect"
          @cli-output="handleCliOutput"
        />
      </div>
    </main>

    <!-- Auth modal overlay -->
    <Teleport to="body">
      <div
        v-if="showAuth"
        class="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 backdrop-blur-sm"
        @click.self="showAuth = false"
      >
        <div class="relative w-full max-w-lg mx-4">
          <button
            type="button"
            class="absolute -top-3 -right-3 z-10 flex size-7 items-center justify-center border border-border-default bg-bg-surface text-text-dim hover:text-text-primary"
            aria-label="Close"
            @click="showAuth = false"
          >
            <Icon icon="lucide:x" class="size-4" />
          </button>
          <AwsAuth
            :saved-config="cognitoConfig"
            :is-loading="isAuthLoading"
            :error-message="authError"
            @connect="handleConnect"
            @demo="handleDemo"
          />
        </div>
      </div>
    </Teleport>

    <!-- Footer -->
    <footer class="mt-12 border-t border-border-default py-6 text-center">
      <p class="font-display text-xs text-text-dim">
        <span class="text-accent-coral">//</span> My AWS Dashboards · Part of
        <RouterLink to="/" class="text-accent-sky hover:underline">vibe.j2team.org</RouterLink> ·
        Cognito-authenticated · Credentials kept in memory only · Session expires in 5 min.
      </p>
    </footer>
  </div>
</template>
