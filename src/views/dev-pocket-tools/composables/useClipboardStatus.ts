import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'

import type { CopyStatus, OutputTone } from '../types'

export function useClipboardStatus() {
  const { copy } = useClipboard()
  const copyStatus = ref<CopyStatus | null>(null)
  let copyTimer = 0

  function setCopyStatus(key: string, state: OutputTone, message: string) {
    copyStatus.value = { key, state, message }
    window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copyStatus.value = null
    }, 2200)
  }

  async function copyText(key: string, value: string) {
    if (!value) {
      setCopyStatus(key, 'error', 'Chưa có dữ liệu để copy.')
      return
    }

    try {
      await copy(value)
      setCopyStatus(key, 'success', 'Đã copy vào clipboard.')
    } catch {
      setCopyStatus(key, 'error', 'Trình duyệt không cho phép copy tự động.')
    }
  }

  return {
    copyStatus,
    copyText,
    setCopyStatus,
  }
}
