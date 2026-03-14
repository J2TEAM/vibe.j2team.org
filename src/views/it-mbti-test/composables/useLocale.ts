import { ref } from 'vue'

export type Locale = 'vi' | 'en'

// Module-level singleton so locale persists across composable calls
const locale = ref<Locale>('vi')

export function useLocale() {
  function toggle() {
    locale.value = locale.value === 'vi' ? 'en' : 'vi'
  }

  return { locale, toggle }
}
