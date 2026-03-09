import { ref } from 'vue'

export function useGemini() {
  const apiKey = ref(localStorage.getItem('gemini_api_key') || '')
  const isLoading = ref(false)
  const error = ref('')

  const saveApiKey = (key: string) => {
    apiKey.value = key
    localStorage.setItem('gemini_api_key', key)
  }

  const generate = async (prompt: string, stylePrompt: string) => {
    if (!apiKey.value) {
      error.value = 'Vui lòng nhập Gemini API Key trong phần cài đặt.'
      return null
    }

    isLoading.value = true
    error.value = ''

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.value}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${stylePrompt}\n\nTask description: ${prompt}`,
                  },
                ],
              },
            ],
          }),
        },
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Lỗi API từ Google')
      }

      return data.candidates[0].content.parts[0].text.trim()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    apiKey,
    isLoading,
    error,
    saveApiKey,
    generate,
  }
}
