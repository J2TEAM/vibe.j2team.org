import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type AIProvider = 'gemini' | 'openai' | 'claude'

export const useAiSettingsStore = defineStore('db-diagram-ai-settings', () => {
  const apiKeys = ref<Record<string, string>>({})

  // Load initially
  const providers: AIProvider[] = ['gemini', 'openai', 'claude']
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
  }
})
