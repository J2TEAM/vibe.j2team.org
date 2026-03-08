import { ref } from 'vue'

const CLOUDFLARE_AI_ENDPOINT = 'https://vibecode.ngducnhatt.workers.dev/'

export function useAI() {
  const isProcessing = ref(false)

  const askStreaming = async (
    question: string,
    onChunk: (chunk: string) => void,
    personality?: string,
  ): Promise<void> => {
    isProcessing.value = true
    try {
      const response = await fetch(CLOUDFLARE_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          stream: true,
          context: personality, // Gửi kèm mô tả tính cách
        }),
      })

      if (!response.ok) throw new Error()

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error()

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const cleanLine = line.trim()
          if (cleanLine.startsWith('data: ')) {
            try {
              const jsonStr = cleanLine.slice(6)
              if (jsonStr === '[DONE]') continue
              const data = JSON.parse(jsonStr)
              if (data.response) onChunk(data.response)
            } catch {}
          }
        }
      }
    } catch {
      // Nếu Stream lỗi, gọi lại theo cách cũ (Dự phòng)
      const res = await fetch(CLOUDFLARE_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          stream: false,
          context: personality,
        }),
      })
      const data = await res.json()
      if (data.response) onChunk(data.response)
    } finally {
      isProcessing.value = false
    }
  }

  return {
    askStreaming,
    isProcessing,
  }
}
