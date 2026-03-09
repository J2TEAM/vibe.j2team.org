<script setup lang="ts">
import { ref } from 'vue'
import type { Card, CardSet } from '../../types'

const props = defineProps<{
  set: CardSet
  cards: Card[]
}>()

const emit = defineEmits<{
  imported: [cards: { front: string; back: string }[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function handleExport() {
  const data = {
    set: { name: props.set.name, description: props.set.description },
    cards: props.cards.map((c) => ({ front: c.front, back: c.back, order: c.order })),
    exportedAt: new Date().toISOString(),
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.set.name.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string) as {
        cards?: { front?: string; back?: string }[]
      }
      if (!Array.isArray(data.cards)) return

      const validCards = data.cards
        .filter(
          (c): c is { front: string; back: string } =>
            typeof c.front === 'string' &&
            typeof c.back === 'string' &&
            c.front.trim() !== '' &&
            c.back.trim() !== '',
        )
        .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))

      if (validCards.length > 0) {
        emit('imported', validCards)
      }
    } catch {
      // Invalid JSON — silently ignore
    }
    input.value = ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      class="px-3 py-1.5 text-xs border border-border-default text-text-secondary hover:text-accent-amber hover:border-accent-amber transition"
      @click="handleExport"
    >
      Xuất JSON
    </button>
    <button
      class="px-3 py-1.5 text-xs border border-border-default text-text-secondary hover:text-accent-sky hover:border-accent-sky transition"
      @click="triggerImport"
    >
      Nhập JSON
    </button>
    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileChange" />
  </div>
</template>
