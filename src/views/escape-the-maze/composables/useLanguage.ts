import { ref, computed } from 'vue'
import { translations, type Language } from '../i18n'
import { STORAGE_KEY } from '../config'

const currentLanguage = ref<Language>('vi')

// Load saved language preference
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_KEY.LANGUAGE)
  if (saved === 'vi' || saved === 'en') {
    currentLanguage.value = saved
  }
}

export function useLanguage() {
  const t = computed(() => translations[currentLanguage.value])

  function toggleLanguage() {
    currentLanguage.value = currentLanguage.value === 'vi' ? 'en' : 'vi'
    localStorage.setItem(STORAGE_KEY.LANGUAGE, currentLanguage.value)
  }

  function setLanguage(lang: Language) {
    currentLanguage.value = lang
    localStorage.setItem(STORAGE_KEY.LANGUAGE, lang)
  }

  return {
    language: computed(() => currentLanguage.value),
    t,
    toggleLanguage,
    setLanguage,
  }
}
