import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useQrStore = defineStore('qr-generator', () => {
  // Config state
  const content = ref('')
  const contentType = ref<'link' | 'text' | 'email' | 'phone' | 'sms' | 'wifi'>('link')

  // Specific fields for types
  const linkUrl = ref('')
  const emailData = ref({ address: '', subject: '', body: '' })
  const phoneNum = ref('')
  const smsData = ref({ phone: '', message: '' })
  const wifiData = ref({ ssid: '', password: '', encryption: 'WPA' as 'WPA' | 'WEP' | 'nopass' })

  const color = ref('#FF6B4A') // accent-coral
  const background = ref('#0F1923') // bg-bg-deep
  const size = ref(256)
  const ecl = ref<'L' | 'M' | 'Q' | 'H'>('M')
  const logo = ref<string | null>(null)

  // Advanced Styling (from qrcdr)
  const markerOut = ref('default')
  const markerIn = ref('default')
  const pattern = ref('default')

  // Frame state
  const frameType = ref<
    'none' | 'bottom' | 'top' | 'box' | 'banner-top' | 'banner-bottom' | 'border'
  >('none')
  const frameText = ref('SCAN ME')
  const frameTextSize = ref(100)
  const frameColor = ref('#FF6B4A') // accent-coral

  return {
    content,
    contentType,
    linkUrl,
    emailData,
    phoneNum,
    smsData,
    wifiData,
    color,
    background,
    size,
    ecl,
    logo,
    markerOut,
    markerIn,
    pattern,
    frameType,
    frameText,
    frameTextSize,
    frameColor,
  }
})
