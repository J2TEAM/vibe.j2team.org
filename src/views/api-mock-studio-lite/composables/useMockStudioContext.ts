import { useClipboard, useLocalStorage, useTimeoutFn } from '@vueuse/core'
import { computed, inject, provide, ref, watch, type ComputedRef, type InjectionKey, type Ref } from 'vue'

import type { CopyTarget, MockRule, RequestDraft, SimulationResult } from '../types'
import {
  DEFAULT_BROWSER_BASE_PATH,
  normalizeHostBasePath,
} from '../utils/host-runtime'
import {
  RULE_METHODS,
  REQUEST_METHODS,
  buildCurlPreview,
  cloneRule,
  createPair,
  createStatusEntry,
  ensureRuleConsistency,
  runMockSimulation,
} from '../utils/mock-engine'
import { createBlankRule, createDefaultRequestDraft, createDefaultRules } from '../utils/mock-presets'

interface MockStudioContext {
  REQUEST_METHODS: typeof REQUEST_METHODS
  RULE_METHODS: typeof RULE_METHODS
  rules: Ref<MockRule[]>
  requestDraft: Ref<RequestDraft>
  activeRuleId: Ref<string>
  simulationResult: Ref<SimulationResult | null>
  engineError: Ref<string>
  copiedTarget: Ref<CopyTarget>
  activeRule: ComputedRef<MockRule | null>
  activeRuleIndex: ComputedRef<number>
  statusToneClass: ComputedRef<string>
  responseBodyPreview: ComputedRef<string>
  responseHeadersPreview: ComputedRef<string>
  curlPreview: ComputedRef<string>
  browserHostEnabled: Ref<boolean>
  browserHostBasePath: Ref<string>
  browserHostBaseUrl: ComputedRef<string>
  addRequestPair: (section: 'query' | 'headers') => void
  removeRequestPair: (section: 'query' | 'headers', id: string) => void
  resetRequestDraft: () => void
  addRule: () => void
  cloneActiveRule: () => void
  removeActiveRule: () => void
  moveActiveRule: (direction: 'up' | 'down') => void
  addRuleMatcher: (type: 'query' | 'header' | 'body') => void
  removeRuleMatcher: (type: 'query' | 'header' | 'body', id: string) => void
  addStatusMapEntry: () => void
  removeStatusMapEntry: (id: string) => void
  runSimulation: () => void
  copyCurlPreview: () => Promise<void>
  copyResponsePreview: () => Promise<void>
}

const mockStudioContextKey: InjectionKey<MockStudioContext> = Symbol('api-mock-studio-lite-context')

function createMockStudioContext(): MockStudioContext {
  const rules = useLocalStorage<MockRule[]>('api-mock-studio-lite.rules.v1', createDefaultRules())
  const requestDraft = useLocalStorage<RequestDraft>('api-mock-studio-lite.request.v1', createDefaultRequestDraft())
  const browserHostEnabled = ref(false)
  const browserHostBasePath = useLocalStorage<string>('api-mock-studio-lite.host.base-path.v1', DEFAULT_BROWSER_BASE_PATH)

  if (rules.value.length === 0) {
    rules.value = createDefaultRules()
  }

  for (const rule of rules.value) {
    ensureRuleConsistency(rule)
  }

  const activeRuleId = ref(rules.value[0]?.id ?? '')
  const simulationResult = ref<SimulationResult | null>(null)
  const engineError = ref('')

  const { copy } = useClipboard()
  const copiedTarget = ref<CopyTarget>('')
  const { start: clearCopiedTarget } = useTimeoutFn(
    () => {
      copiedTarget.value = ''
    },
    1400,
    { immediate: false },
  )

  const activeRule = computed(() => rules.value.find((rule) => rule.id === activeRuleId.value) ?? null)
  const activeRuleIndex = computed(() => rules.value.findIndex((rule) => rule.id === activeRuleId.value))
  const statusToneClass = computed(() => {
    const status = simulationResult.value?.status ?? 0
    if (status >= 200 && status < 300) {
      return 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky'
    }
    if (status >= 400 && status < 500) {
      return 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber'
    }
    return 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral'
  })

  const responseBodyPreview = computed(() => {
    if (!simulationResult.value) {
      return ''
    }
    return simulationResult.value.responseBody
  })

  const responseHeadersPreview = computed(() => {
    if (!simulationResult.value) {
      return ''
    }
    return JSON.stringify(simulationResult.value.responseHeaders, null, 2)
  })

  const pageOrigin = computed(() => (typeof window === 'undefined' ? 'https://mock.local' : window.location.origin))

  const curlPreview = computed(() => {
    if (browserHostEnabled.value) {
      return buildCurlPreview(requestDraft.value, {
        baseOrigin: pageOrigin.value,
        basePath: normalizeHostBasePath(browserHostBasePath.value, DEFAULT_BROWSER_BASE_PATH),
      })
    }

    return buildCurlPreview(requestDraft.value)
  })
  const browserHostBaseUrl = computed(() => {
    const basePath = normalizeHostBasePath(browserHostBasePath.value, DEFAULT_BROWSER_BASE_PATH)
    if (typeof window === 'undefined') {
      return basePath
    }
    return `${window.location.origin}${basePath}`
  })

  watch(
    () => rules.value.map((rule) => rule.id),
    (ids) => {
      if (ids.length === 0) {
        const fallbackRule = createBlankRule()
        rules.value = [fallbackRule]
        activeRuleId.value = fallbackRule.id
        return
      }

      if (!ids.includes(activeRuleId.value)) {
        activeRuleId.value = ids[0] ?? ''
      }
    },
    { immediate: true },
  )

  watch(
    rules,
    (nextRules) => {
      for (const rule of nextRules) {
        ensureRuleConsistency(rule)
      }
    },
    { deep: true },
  )

  function addRequestPair(section: 'query' | 'headers'): void {
    if (section === 'query') {
      requestDraft.value.query.push(createPair())
      return
    }
    requestDraft.value.headers.push(createPair())
  }

  function removeRequestPair(section: 'query' | 'headers', id: string): void {
    if (section === 'query') {
      requestDraft.value.query = requestDraft.value.query.filter((pair) => pair.id !== id)
      return
    }
    requestDraft.value.headers = requestDraft.value.headers.filter((pair) => pair.id !== id)
  }

  function resetRequestDraft(): void {
    requestDraft.value = createDefaultRequestDraft()
    engineError.value = ''
  }

  function addRule(): void {
    const rule = createBlankRule()
    rules.value.unshift(rule)
    activeRuleId.value = rule.id
  }

  function cloneActiveRule(): void {
    const rule = activeRule.value
    if (!rule) {
      return
    }

    const cloned = cloneRule(rule)
    rules.value.unshift(cloned)
    activeRuleId.value = cloned.id
  }

  function removeActiveRule(): void {
    const id = activeRuleId.value
    if (!id) {
      return
    }

    if (rules.value.length <= 1) {
      const fallbackRule = createBlankRule()
      rules.value = [fallbackRule]
      activeRuleId.value = fallbackRule.id
      return
    }

    const index = rules.value.findIndex((rule) => rule.id === id)
    rules.value = rules.value.filter((rule) => rule.id !== id)
    const nextRule = rules.value[Math.max(index - 1, 0)]
    activeRuleId.value = nextRule?.id ?? rules.value[0]?.id ?? ''
  }

  function moveActiveRule(direction: 'up' | 'down'): void {
    const index = activeRuleIndex.value
    if (index < 0) {
      return
    }

    if (direction === 'up' && index > 0) {
      const previous = rules.value[index - 1]
      const current = rules.value[index]
      if (previous && current) {
        rules.value[index - 1] = current
        rules.value[index] = previous
      }
    }

    if (direction === 'down' && index < rules.value.length - 1) {
      const next = rules.value[index + 1]
      const current = rules.value[index]
      if (next && current) {
        rules.value[index + 1] = current
        rules.value[index] = next
      }
    }
  }

  function addRuleMatcher(type: 'query' | 'header' | 'body'): void {
    const rule = activeRule.value
    if (!rule) {
      return
    }

    if (type === 'query') {
      rule.queryMatchers.push({ id: createPair().id, key: '', expected: '' })
      return
    }
    if (type === 'header') {
      rule.headerMatchers.push({ id: createPair().id, key: '', expected: '' })
      return
    }
    rule.bodyMatchers.push({ id: createPair().id, path: '', expected: '' })
  }

  function removeRuleMatcher(type: 'query' | 'header' | 'body', id: string): void {
    const rule = activeRule.value
    if (!rule) {
      return
    }

    if (type === 'query') {
      rule.queryMatchers = rule.queryMatchers.filter((matcher) => matcher.id !== id)
      return
    }
    if (type === 'header') {
      rule.headerMatchers = rule.headerMatchers.filter((matcher) => matcher.id !== id)
      return
    }
    rule.bodyMatchers = rule.bodyMatchers.filter((matcher) => matcher.id !== id)
  }

  function addStatusMapEntry(): void {
    const rule = activeRule.value
    if (!rule) {
      return
    }

    const key = `custom-${rule.statusMap.length + 1}`
    rule.statusMap.push(createStatusEntry(key, 200, 'Custom response', '{\n  "ok": true\n}'))
    ensureRuleConsistency(rule)
  }

  function removeStatusMapEntry(id: string): void {
    const rule = activeRule.value
    if (!rule) {
      return
    }

    rule.statusMap = rule.statusMap.filter((entry) => entry.id !== id)
    ensureRuleConsistency(rule)
  }

  function runSimulation(): void {
    const output = runMockSimulation(rules.value, requestDraft.value)
    engineError.value = output.error
    simulationResult.value = output.result
  }

  async function copyCurlPreview(): Promise<void> {
    await copy(curlPreview.value)
    copiedTarget.value = 'curl'
    clearCopiedTarget()
  }

  async function copyResponsePreview(): Promise<void> {
    if (!simulationResult.value) {
      return
    }
    await copy(responseBodyPreview.value)
    copiedTarget.value = 'response'
    clearCopiedTarget()
  }

  runSimulation()

  return {
    REQUEST_METHODS,
    RULE_METHODS,
    rules,
    requestDraft,
    activeRuleId,
    simulationResult,
    engineError,
    copiedTarget,
    activeRule,
    activeRuleIndex,
    statusToneClass,
    responseBodyPreview,
    responseHeadersPreview,
    curlPreview,
    browserHostEnabled,
    browserHostBasePath,
    browserHostBaseUrl,
    addRequestPair,
    removeRequestPair,
    resetRequestDraft,
    addRule,
    cloneActiveRule,
    removeActiveRule,
    moveActiveRule,
    addRuleMatcher,
    removeRuleMatcher,
    addStatusMapEntry,
    removeStatusMapEntry,
    runSimulation,
    copyCurlPreview,
    copyResponsePreview,
  }
}

export function provideMockStudioContext(): MockStudioContext {
  const context = createMockStudioContext()
  provide(mockStudioContextKey, context)
  return context
}

export function useMockStudioContext(): MockStudioContext {
  const context = inject(mockStudioContextKey)
  if (!context) {
    throw new Error('Mock studio context is missing. Make sure provideMockStudioContext() is called in parent.')
  }
  return context
}
