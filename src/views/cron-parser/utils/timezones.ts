export interface TimezoneOption {
  label: string
  value: string
}

const PRESET_TIMEZONES: TimezoneOption[] = [
  { label: 'Việt Nam (ICT)', value: 'Asia/Ho_Chi_Minh' },
  { label: 'UTC', value: 'UTC' },
  { label: 'New York (EST)', value: 'America/New_York' },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
]

export function getSystemTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function buildTimezoneOptions(selectedTimezone?: string) {
  const systemTimezone = getSystemTimezone()
  const options: TimezoneOption[] = []

  if (
    selectedTimezone &&
    selectedTimezone !== systemTimezone &&
    !PRESET_TIMEZONES.some((option) => option.value === selectedTimezone)
  ) {
    options.push({
      label: `Múi giờ tuỳ chỉnh (${selectedTimezone})`,
      value: selectedTimezone,
    })
  }

  options.push({
    label: `Mặc định hệ thống (${systemTimezone})`,
    value: systemTimezone,
  })

  for (const option of PRESET_TIMEZONES) {
    if (option.value !== systemTimezone) {
      options.push(option)
    }
  }

  return options
}

export function getPresetTimezones() {
  return PRESET_TIMEZONES
}
