import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'openrouter-gemini'

export const MODELS = {
  GEMINI_FLASH_1_5: 'google/gemini-flash-1.5-8b-exp:free',
  GEMINI_PRO_1_5: 'google/gemini-pro-1.5-exp:free',
  LLAMA_3_1_8B: 'meta-llama/llama-3.1-8b-instruct:free',
  LLAMA_3_3_70B: 'meta-llama/llama-3.3-70b-instruct:free',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct:free',
  GLM_4_9B: 'z-ai/glm-4-9b-chat:free',
  GEMINI_FLASH_2_0: 'google/gemini-2.0-flash-001',
  CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
} as const

export const DEFAULT_MODEL = MODELS.LLAMA_3_1_8B

export const useAiSettingsStore = defineStore('db-diagram-ai-settings', () => {
  const apiKeys = ref<Record<string, string>>({})

  // Load initially
  const providers: AIProvider[] = ['gemini', 'openai', 'claude', 'openrouter-gemini']
  providers.forEach((p) => {
    const saved = localStorage.getItem(`db_diagram_key_${p}`)
    if (saved) apiKeys.value[p] = saved
  })

  // Persistence for API Keys
  watch(
    apiKeys,
    (newKeys) => {
      Object.entries(newKeys).forEach(([p, key]) => {
        if (key) {
          localStorage.setItem(`db_diagram_key_${p}`, key)
        } else {
          localStorage.removeItem(`db_diagram_key_${p}`)
        }
      })
    },
    { deep: true },
  )

  const getApiKey = (provider: AIProvider) => {
    return apiKeys.value[provider] || ''
  }

  const setApiKey = (provider: AIProvider, key: string) => {
    apiKeys.value[provider] = key
  }

  return {
    apiKeys,
    getApiKey,
    setApiKey,
    DEFAULT_MODEL,
  }
})
