<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const emit = defineEmits<{
  import: [cards: { front: string; back: string }[]]
  cancel: []
}>()

const rawText = ref('')
const showPreview = ref(true)

type TermSeparator = 'tab' | 'comma' | 'custom'
type CardSeparator = 'newline' | 'semicolon' | 'custom'

const termSep = ref<TermSeparator>('tab')
const cardSep = ref<CardSeparator>('newline')
const customTermSep = ref('')
const customCardSep = ref('')

function getTermDelimiter(): string {
  if (termSep.value === 'tab') return '\t'
  if (termSep.value === 'comma') return ','
  return customTermSep.value || '\t'
}

function getCardDelimiter(): string | RegExp {
  if (cardSep.value === 'newline') return '\n'
  if (cardSep.value === 'semicolon') return ';'
  return customCardSep.value || '\n'
}

const parsedCards = computed(() => {
  if (!rawText.value.trim()) return []
  const cardDelim = getCardDelimiter()
  const termDelim = getTermDelimiter()

  const lines =
    typeof cardDelim === 'string' ? rawText.value.split(cardDelim) : rawText.value.split(cardDelim)

  return lines
    .map((line) => {
      const parts = line.split(termDelim)
      const front = parts[0]?.trim() ?? ''
      const back = parts.slice(1).join(termDelim).trim()
      return { front, back }
    })
    .filter((c) => c.front && c.back)
})

function handleTab(e: KeyboardEvent) {
  const textarea = e.target as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  rawText.value = rawText.value.substring(0, start) + '\t' + rawText.value.substring(end)
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 1
  })
}

function handleImport() {
  if (parsedCards.value.length === 0) return
  emit('import', parsedCards.value)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-bg-deep/80" @click="emit('cancel')" />
      <div
        class="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border-default bg-bg-surface p-6 animate-fade-up"
        role="dialog"
        aria-label="Nhập dữ liệu hàng loạt"
      >
        <h3 class="font-display text-xl font-semibold text-text-primary mb-2">Nhập dữ liệu</h3>
        <p class="text-text-secondary text-sm mb-4">
          Chép và dán dữ liệu ở đây (từ Word, Excel, Google Docs, v.v.)
        </p>

        <!-- Textarea -->
        <textarea
          v-model="rawText"
          rows="8"
          class="w-full bg-bg-deep border border-border-default px-4 py-3 text-text-primary text-sm font-mono focus:border-accent-coral focus:outline-none transition resize-none"
          placeholder="Từ 1&#9;Định nghĩa 1&#10;Từ 2&#9;Định nghĩa 2&#10;Từ 3&#9;Định nghĩa 3"
          @keydown.tab.prevent="handleTab"
        />

        <!-- Delimiter config -->
        <div class="mt-4 grid grid-cols-2 gap-6">
          <!-- Term separator -->
          <div>
            <p class="font-display text-sm font-semibold text-text-primary mb-2">
              Giữa thuật ngữ và định nghĩa
            </p>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input v-model="termSep" type="radio" value="tab" class="accent-accent-coral" />
                Tab
              </label>
              <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input v-model="termSep" type="radio" value="comma" class="accent-accent-coral" />
                Phẩy
              </label>
              <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input v-model="termSep" type="radio" value="custom" class="accent-accent-coral" />
                <input
                  v-model="customTermSep"
                  type="text"
                  class="w-24 bg-bg-deep border border-border-default px-2 py-1 text-xs text-text-primary focus:border-accent-coral focus:outline-none transition"
                  placeholder="Tùy chỉnh"
                  @focus="termSep = 'custom'"
                />
              </label>
            </div>
          </div>

          <!-- Card separator -->
          <div>
            <p class="font-display text-sm font-semibold text-text-primary mb-2">Giữa các thẻ</p>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input v-model="cardSep" type="radio" value="newline" class="accent-accent-coral" />
                Dòng mới
              </label>
              <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  v-model="cardSep"
                  type="radio"
                  value="semicolon"
                  class="accent-accent-coral"
                />
                Chấm phẩy
              </label>
              <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input v-model="cardSep" type="radio" value="custom" class="accent-accent-coral" />
                <input
                  v-model="customCardSep"
                  type="text"
                  class="w-24 bg-bg-deep border border-border-default px-2 py-1 text-xs text-text-primary focus:border-accent-coral focus:outline-none transition"
                  placeholder="Tùy chỉnh"
                  @focus="cardSep = 'custom'"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="mt-5">
          <div class="flex items-center justify-between mb-2">
            <p class="font-display text-sm font-semibold text-text-primary">
              Xem trước <span class="text-accent-coral">{{ parsedCards.length }}</span> thẻ
            </p>
            <button
              class="text-xs text-text-dim hover:text-text-secondary transition-colors"
              @click="showPreview = !showPreview"
            >
              {{ showPreview ? 'Ẩn' : 'Hiện' }}
            </button>
          </div>
          <template v-if="showPreview">
            <div v-if="parsedCards.length === 0" class="text-text-dim text-sm">
              Không có nội dung để xem trước
            </div>
            <div v-else class="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
              <div
                v-for="(card, i) in parsedCards.slice(0, 10)"
                :key="i"
                class="flex gap-4 text-sm border border-border-default bg-bg-deep px-3 py-2"
              >
                <span class="text-text-dim w-6 shrink-0">{{ i + 1 }}</span>
                <span class="flex-1 text-text-primary truncate">{{ card.front }}</span>
                <span class="flex-1 text-text-secondary truncate">{{ card.back }}</span>
              </div>
              <p v-if="parsedCards.length > 10" class="text-text-dim text-xs text-center pt-1">
                ... và {{ parsedCards.length - 10 }} thẻ khác
              </p>
            </div>
          </template>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-4 py-2 text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-coral transition"
            @click="emit('cancel')"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 text-sm bg-accent-coral text-bg-deep font-semibold hover:bg-accent-coral/90 transition"
            :disabled="parsedCards.length === 0"
            @click="handleImport"
          >
            Nhập {{ parsedCards.length }} thẻ
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border-default);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-accent-coral);
}
</style>
