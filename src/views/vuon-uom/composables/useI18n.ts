import { ref } from 'vue'
import type { Locale, L10n } from '../types'

// Module-level singleton — shared across all components without Pinia
const locale = ref<Locale>('vi')

export function useI18n() {
  function t(text: L10n): string {
    return text[locale.value]
  }

  function toggleLocale(): void {
    locale.value = locale.value === 'vi' ? 'en' : 'vi'
  }

  return { locale, t, toggleLocale }
}
