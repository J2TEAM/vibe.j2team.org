import { computed, ref, watch } from 'vue'
import { i18n, getStoredLang, setStoredLang, type Lang, type ChillI18n } from '../i18n'

const lang = ref<Lang>(getStoredLang())

watch(
  lang,
  (l) => {
    setStoredLang(l)
  },
  { immediate: false },
)

export function useChillI18n() {
  const t = computed<ChillI18n>(() => i18n[lang.value])

  function setLang(l: Lang) {
    lang.value = l
  }

  return { t, lang, setLang }
}
