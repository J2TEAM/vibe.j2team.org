import { ref, onMounted } from 'vue'
import type { GachBongModule } from './types'

// Load asm.js engine từ public/ (không bundle qua Rollup, tránh 2.4MB chunk)
const gachBongJsUrl = '/gach-bong/gach_bong.js'

declare global {
  interface Window {
    GachBongEngine: (moduleArg?: Record<string, unknown>) => Promise<GachBongModule>
  }
}

export function useWasmEngine() {
  const engine = ref<GachBongModule | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      if (!window.GachBongEngine) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = gachBongJsUrl
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Không thể tải engine script'))
          document.head.appendChild(script)
        })
      }

      // Nạp engine (asm.js - tất cả đều nằm trong file .js, không cần locateFile)
      engine.value = await window.GachBongEngine()
      loading.value = false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Không thể tải engine'
      loading.value = false
    }
  })

  return { engine, loading, error }
}
