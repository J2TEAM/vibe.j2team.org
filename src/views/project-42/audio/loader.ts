export async function loadTone(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof (window as unknown as { Tone: unknown }).Tone !== 'undefined') {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}
