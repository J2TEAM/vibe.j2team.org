import { ref, onMounted } from 'vue'
import { getDB } from '../services/db'

export function useDb() {
  const isReady = ref(false)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      await getDB()
      isReady.value = true
    } catch {
      error.value = 'Không thể kết nối IndexedDB'
    }
  })

  return { isReady, error }
}
