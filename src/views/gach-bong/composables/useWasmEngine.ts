import { ref, onMounted } from 'vue'
import type { GachBongModule } from './types'

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        GachBongEngine: (moduleArg?: any) => Promise<GachBongModule>
    }
}

// Load WASM files từ server gachbong.yellowstudio.vn
const gachBongJsUrl = 'https://gachbong.yellowstudio.vn/gach_bong.js'
const wasmUrl = 'https://gachbong.yellowstudio.vn/gach_bong.wasm'

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
                    script.onerror = () => reject(new Error('Không thể tải WASM script'))
                    document.head.appendChild(script)
                })
            }

            // Nạp WebAssembly với locateFile trỏ đến url được Vite resolve
            engine.value = await window.GachBongEngine({
                locateFile: (path: string) => {
                    if (path.endsWith('.wasm')) {
                        return wasmUrl
                    }
                    return path
                }
            })
            loading.value = false
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Không thể tải engine'
            loading.value = false
        }
    })

    return { engine, loading, error }
}
