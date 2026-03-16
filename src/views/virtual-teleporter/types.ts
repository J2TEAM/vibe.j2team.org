export interface Location {
  id: string
  name: string
  country: string
  continent: string
  description: string
  lat: number
  lon: number
  timezone: string
  imageUrl: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  weatherCode: number
  windSpeed: number
}

export type TeleportState = 'idle' | 'loading' | 'ready' | 'error'

export interface WeatherInfo {
  icon: string
  label: string
  iconClass: string
}

export interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    weather_code: number
    wind_speed_10m: number
  }
}
