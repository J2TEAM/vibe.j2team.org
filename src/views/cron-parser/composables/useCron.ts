import { computed, ref, watch } from 'vue'
import { useNow, useUrlSearchParams } from '@vueuse/core'

import type { CronFormat } from '../types'
import {
  analyzeCronExpression,
  buildFallbackDescription,
  formatDateTimeInTimeZone,
  formatRelativeTime,
} from '../utils/cron'
import { generateNextRuns, parseCronExpression } from '../utils/cron-scheduler'

export function useCron() {
  const params = useUrlSearchParams('history')
  const cronExpression = ref((params.expr as string) || '*/5 * * * *')
  const format = ref<CronFormat>((params.format as CronFormat) || 'linux')
  const timezone = ref((params.tz as string) || Intl.DateTimeFormat().resolvedOptions().timeZone)

  const humanReadable = ref(buildFallbackDescription(cronExpression.value))
  const nextRuns = ref<Date[]>([])
  const error = ref<string | null>(null)
  const now = useNow({ interval: 1000 })

  const analysis = computed(() => analyzeCronExpression(cronExpression.value, format.value))
  const shareLink = computed(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    const url = new URL(window.location.href)
    url.searchParams.set('expr', cronExpression.value)
    url.searchParams.set('format', format.value)
    url.searchParams.set('tz', timezone.value)
    return url.toString()
  })

  const formattedNextRuns = computed(() =>
    nextRuns.value.map((date) =>
      formatDateTimeInTimeZone(date, timezone.value, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
    ),
  )

  const nextRunCountdown = computed(() => {
    const nextRun = nextRuns.value[0]

    if (!nextRun) {
      return ''
    }

    return formatRelativeTime(nextRun.getTime() - now.value.getTime())
  })

  const refreshResults = () => {
    const parsed = parseCronExpression(cronExpression.value)
    humanReadable.value = buildFallbackDescription(cronExpression.value)

    if (!parsed.ok) {
      nextRuns.value = []
      error.value = parsed.error
      return
    }

    nextRuns.value = generateNextRuns(cronExpression.value, timezone.value, 5, now.value)
    error.value = null
  }

  const updateExpression = (newExpr: string) => {
    cronExpression.value = newExpr
    params.expr = newExpr
  }

  const updateFormat = (newFormat: CronFormat) => {
    format.value = newFormat
    params.format = newFormat
  }

  const updateTimezone = (newTz: string) => {
    timezone.value = newTz
    params.tz = newTz
  }

  watch([cronExpression, timezone, format, now], refreshResults, { immediate: true })

  return {
    analysis,
    cronExpression,
    format,
    formattedNextRuns,
    nextRunCountdown,
    timezone,
    humanReadable,
    nextRuns,
    error,
    shareLink,
    updateExpression,
    updateFormat,
    updateTimezone,
  }
}
