import { ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { locations } from '../data/locations'
import type { Location, WeatherData, TeleportState, WeatherInfo, OpenMeteoResponse } from '../types'

const WMO_WEATHER: Record<number, WeatherInfo> = {
  0: { icon: 'lucide:sun', label: 'Quang đãng', iconClass: 'text-accent-amber' },
  1: { icon: 'lucide:sun', label: 'Chủ yếu quang đãng', iconClass: 'text-accent-amber' },
  2: { icon: 'lucide:cloud-sun', label: 'Một phần có mây', iconClass: 'text-accent-amber' },
  3: { icon: 'lucide:cloud', label: 'Nhiều mây', iconClass: 'text-text-secondary' },
  45: { icon: 'lucide:cloud-fog', label: 'Sương mù', iconClass: 'text-text-secondary' },
  48: { icon: 'lucide:cloud-fog', label: 'Sương mù đóng băng', iconClass: 'text-text-secondary' },
  51: { icon: 'lucide:cloud-drizzle', label: 'Mưa phùn nhẹ', iconClass: 'text-accent-sky' },
  53: { icon: 'lucide:cloud-drizzle', label: 'Mưa phùn vừa', iconClass: 'text-accent-sky' },
  55: { icon: 'lucide:cloud-drizzle', label: 'Mưa phùn nặng', iconClass: 'text-accent-sky' },
  61: { icon: 'lucide:cloud-rain', label: 'Mưa nhỏ', iconClass: 'text-accent-sky' },
  63: { icon: 'lucide:cloud-rain', label: 'Mưa vừa', iconClass: 'text-accent-sky' },
  65: { icon: 'lucide:cloud-rain', label: 'Mưa to', iconClass: 'text-accent-sky' },
  71: { icon: 'lucide:cloud-snow', label: 'Tuyết rơi nhẹ', iconClass: 'text-text-primary' },
  73: { icon: 'lucide:cloud-snow', label: 'Tuyết rơi vừa', iconClass: 'text-text-primary' },
  75: { icon: 'lucide:cloud-snow', label: 'Tuyết dày', iconClass: 'text-text-primary' },
  77: { icon: 'lucide:cloud-snow', label: 'Hạt tuyết', iconClass: 'text-text-primary' },
  80: { icon: 'lucide:cloud-rain', label: 'Mưa rào nhẹ', iconClass: 'text-accent-sky' },
  81: { icon: 'lucide:cloud-rain', label: 'Mưa rào vừa', iconClass: 'text-accent-sky' },
  82: { icon: 'lucide:cloud-rain', label: 'Mưa rào to', iconClass: 'text-accent-sky' },
  85: { icon: 'lucide:cloud-snow', label: 'Mưa tuyết nhẹ', iconClass: 'text-text-primary' },
  86: { icon: 'lucide:cloud-snow', label: 'Mưa tuyết dày', iconClass: 'text-text-primary' },
  95: { icon: 'lucide:zap', label: 'Giông bão', iconClass: 'text-accent-amber' },
  96: { icon: 'lucide:zap', label: 'Giông bão kèm mưa đá', iconClass: 'text-accent-amber' },
  99: { icon: 'lucide:zap', label: 'Giông bão kèm mưa đá to', iconClass: 'text-accent-amber' },
}

function getWeatherInfo(code: number): WeatherInfo {
  return (
    WMO_WEATHER[code] ?? {
      icon: 'lucide:cloud',
      label: 'Không xác định',
      iconClass: 'text-text-secondary',
    }
  )
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // resolve anyway — UI handles missing image
    img.src = url
  })
}

async function fetchWeather(location: Location): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.lat}&longitude=${location.lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&timezone=${encodeURIComponent(location.timezone)}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather fetch failed')
  const data: OpenMeteoResponse = await res.json()
  return {
    temperature: Math.round(data.current.temperature_2m),
    humidity: data.current.relative_humidity_2m,
    weatherCode: data.current.weather_code,
    windSpeed: Math.round(data.current.wind_speed_10m),
  }
}

export function useTeleporter() {
  const state = ref<TeleportState>('idle')
  const currentLocation = ref<Location | null>(null)
  const weather = ref<WeatherData | null>(null)
  const imageUrl = ref<string>('')
  const localTime = ref<string>('')
  const localDate = ref<string>('')
  const errorMessage = ref<string>('')

  function updateTime() {
    if (!currentLocation.value) return
    const tz = currentLocation.value.timezone
    localTime.value = new Intl.DateTimeFormat('vi-VN', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date())
    localDate.value = new Intl.DateTimeFormat('vi-VN', {
      timeZone: tz,
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date())
  }

  const { resume, pause } = useIntervalFn(updateTime, 1000, { immediate: false })

  async function teleport() {
    pause()
    state.value = 'loading'
    errorMessage.value = ''

    const available = locations.filter((l) => l.id !== currentLocation.value?.id)
    const location = available[Math.floor(Math.random() * available.length)]!
    const imgUrl = location.imageUrl

    try {
      const [weatherData] = await Promise.all([fetchWeather(location), preloadImage(imgUrl)])

      currentLocation.value = location
      weather.value = weatherData
      imageUrl.value = imgUrl
      updateTime()
      resume()
      state.value = 'ready'
    } catch {
      errorMessage.value = 'Không thể tải dữ liệu. Vui lòng thử lại!'
      state.value = 'error'
    }
  }

  const weatherInfo = () => (weather.value ? getWeatherInfo(weather.value.weatherCode) : null)

  return {
    state,
    currentLocation,
    weather,
    imageUrl,
    localTime,
    localDate,
    errorMessage,
    weatherInfo,
    teleport,
  }
}
