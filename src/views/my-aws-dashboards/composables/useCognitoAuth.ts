/**
 * Cognito Identity Pool authentication composable.
 *
 * Security model:
 *  - Only the non-secret Identity Pool ID is persisted to localStorage.
 *  - Temporary STS credentials are stored in sessionStorage (tab-scoped —
 *    cleared automatically when the tab closes, exactly like in-memory storage
 *    across a page refresh). This allows an intentional F5 refresh to resume
 *    the session without a round-trip to Cognito.
 *  - On explicit logout or session expiry the sessionStorage entry is removed.
 *  - The app enforces a 5-minute session limit client-side and auto-logs out.
 */

import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { CognitoConfig, CognitoSession } from '../types'
import { getCognitoCredentials } from '../utils/cognitoClient'

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_DURATION_MS = 5 * 60 * 1000 // 5 minutes
const CONFIG_STORAGE_KEY = 'my-aws-dashboard:cognito-config'
/**
 * Stores the full session object in sessionStorage so a page refresh can
 * restore it without a Cognito round-trip.
 * sessionStorage is tab-scoped: the browser clears it when the tab is closed,
 * giving the same isolation guarantee as an in-memory ref.
 */
const SESSION_STORAGE_KEY = 'my-aws-dashboard:session'

// ─── Module-level singletons (shared across all composable instances) ─────────

/** Temporary credentials — kept in memory after restore from sessionStorage */
const session = ref<CognitoSession | null>(null)
const isAuthLoading = ref(false)
const authError = ref('')
/** Seconds remaining in the current session (0 when not authenticated) */
const remainingSeconds = ref(0)

let logoutTimer: ReturnType<typeof setTimeout> | null = null
let tickInterval: ReturnType<typeof setInterval> | null = null

function stopTimers(): void {
  if (logoutTimer !== null) {
    clearTimeout(logoutTimer)
    logoutTimer = null
  }
  if (tickInterval !== null) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

function startTimers(expiresAt: number): void {
  stopTimers()

  remainingSeconds.value = Math.ceil((expiresAt - Date.now()) / 1000)

  // Update countdown every second
  tickInterval = setInterval(() => {
    if (session.value === null) {
      if (tickInterval !== null) {
        clearInterval(tickInterval)
        tickInterval = null
      }
      return
    }
    const secs = Math.max(0, Math.ceil((session.value.expiresAt - Date.now()) / 1000))
    remainingSeconds.value = secs
    if (secs === 0) {
      if (tickInterval !== null) {
        clearInterval(tickInterval)
        tickInterval = null
      }
    }
  }, 1000)

  // Auto-logout when the 5-minute session window expires
  const msUntilExpiry = Math.max(0, expiresAt - Date.now())
  logoutTimer = setTimeout(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    session.value = null
    remainingSeconds.value = 0
    stopTimers()
    window.location.reload()
  }, msUntilExpiry)
}

function persistSession(s: CognitoSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s))
  } catch {
    // sessionStorage quota exceeded — non-fatal, session still lives in memory
  }
}

function clearPersistedSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useCognitoAuth() {
  /** Non-secret Identity Pool configuration — safe to persist */
  const config = useLocalStorage<CognitoConfig | null>(CONFIG_STORAGE_KEY, null)

  const isAuthenticated = computed(
    () => session.value !== null && Date.now() < session.value.expiresAt,
  )

  const hasConfig = computed(
    () =>
      config.value !== null &&
      typeof config.value.identityPoolId === 'string' &&
      config.value.identityPoolId.trim().length > 0,
  )

  /**
   * Authenticate via Cognito Identity Pool.
   * Fetches temporary STS credentials and starts the 5-minute session timer.
   * Throws on failure so the caller can surface the error to the user.
   */
  async function login(cfg: CognitoConfig): Promise<void> {
    isAuthLoading.value = true
    authError.value = ''

    try {
      const creds = await getCognitoCredentials(
        cfg.identityPoolId.trim(),
        cfg.region,
        cfg.roleArn.trim(),
      )

      // Persist only the non-secret config for reconnect UX
      config.value = {
        identityPoolId: cfg.identityPoolId.trim(),
        region: cfg.region,
        roleArn: cfg.roleArn.trim(),
      }

      const expiresAt = Date.now() + SESSION_DURATION_MS

      const newSession: CognitoSession = {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
        identityId: creds.identityId,
        region: cfg.region,
        expiresAt,
      }

      // Store session in sessionStorage so a page refresh can restore it.
      // sessionStorage is tab-scoped and cleared when the tab closes.
      persistSession(newSession)
      session.value = newSession

      startTimers(expiresAt)
    } catch (err) {
      authError.value = err instanceof Error ? err.message : 'Cognito authentication failed.'
      throw err
    } finally {
      isAuthLoading.value = false
    }
  }

  /** End the current session (credentials wiped from memory and sessionStorage). */
  function logout(): void {
    clearPersistedSession()
    stopTimers()
    session.value = null
    remainingSeconds.value = 0
    authError.value = ''
  }

  /** Logout and clear saved Identity Pool config from localStorage. */
  function clearConfig(): void {
    logout()
    config.value = null
  }

  /**
   * Called on page load to restore an active session after an intentional
   * page refresh. Reads the session directly from sessionStorage — no Cognito
   * round-trip required. Returns true if a valid (non-expired) session was
   * found and restored.
   */
  function initSession(): boolean {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return false

    let storedSession: CognitoSession
    try {
      storedSession = JSON.parse(stored) as CognitoSession
    } catch {
      clearPersistedSession()
      return false
    }

    // Validate required fields and expiry
    if (
      !storedSession.accessKeyId ||
      !storedSession.secretAccessKey ||
      !storedSession.sessionToken ||
      !storedSession.expiresAt ||
      Date.now() >= storedSession.expiresAt
    ) {
      clearPersistedSession()
      return false
    }

    // Session is still valid — restore it and resume the countdown
    session.value = storedSession
    startTimers(storedSession.expiresAt)
    return true
  }

  return {
    config,
    session,
    isAuthenticated,
    hasConfig,
    isAuthLoading,
    authError,
    remainingSeconds,
    login,
    logout,
    clearConfig,
    initSession,
  }
}
