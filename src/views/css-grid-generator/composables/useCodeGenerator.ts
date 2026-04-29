import { computed, type Ref } from 'vue'
import type { GridConfig, GridItem } from '../types'

export function useCodeGenerator(config: GridConfig, items: Ref<GridItem[]>) {
  const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row
      return a.col - b.col
    })
  })

  const generatedHtml = computed(() => {
    if (sortedItems.value.length === 0) {
      return '<div class="parent">\n\n</div>'
    }

    const children = sortedItems.value
      .map((item) => `  <div class="div${item.id}">${item.id}</div>`)
      .join('\n')

    return `<div class="parent">\n${children}\n</div>`
  })

  const generatedCss = computed(() => {
    const lines: string[] = []

    lines.push('.parent {')
    lines.push('  display: grid;')
    lines.push(`  grid-template-columns: repeat(${config.columns}, 1fr);`)
    lines.push(`  grid-template-rows: repeat(${config.rows}, 1fr);`)
    if (config.gap > 0) {
      lines.push(`  gap: ${config.gap}px;`)
    }
    lines.push('}')

    sortedItems.value.forEach((item) => {
      const needsGridCol = item.colSpan > 1 || item.col > 1
      const needsGridRow = item.rowSpan > 1 || item.row > 1

      if (!needsGridCol && !needsGridRow) return

      lines.push('')
      lines.push(`.div${item.id} {`)

      if (item.colSpan > 1) {
        lines.push(`  grid-column: ${item.col} / span ${item.colSpan};`)
      } else if (item.col > 1) {
        lines.push(`  grid-column: ${item.col};`)
      }

      if (item.rowSpan > 1) {
        lines.push(`  grid-row: ${item.row} / span ${item.rowSpan};`)
      } else if (item.row > 1) {
        lines.push(`  grid-row: ${item.row};`)
      }

      lines.push('}')
    })

    return lines.join('\n')
  })

  return {
    generatedHtml,
    generatedCss,
  }
}
