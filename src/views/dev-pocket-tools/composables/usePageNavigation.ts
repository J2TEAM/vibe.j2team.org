import { computed, ref } from 'vue'

import type { ToolPageId } from '../types'

export function usePageNavigation() {
  const currentPage = ref<ToolPageId>('builders')

  const toolPages = [
    { id: 'builders', label: 'Builders', description: 'JWT, hash, case, type, UUID' },
    { id: 'data', label: 'Data & Text', description: 'JSON, Base64, URL, query, HTML' },
    { id: 'time', label: 'Time & Rules', description: 'Timestamp, relative, regex, cron, slug' },
    {
      id: 'inspect',
      label: 'Inspect & Convert',
      description: 'Diff, headers, CSV, color, number base',
    },
  ] satisfies Array<{ id: ToolPageId; label: string; description: string }>

  const defaultToolPage = toolPages[0]!
  const currentToolPage = computed(
    () => toolPages.find((page) => page.id === currentPage.value) ?? defaultToolPage,
  )

  return {
    currentPage,
    currentToolPage,
    toolPages,
  }
}
