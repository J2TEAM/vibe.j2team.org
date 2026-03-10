<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'

interface Quote {
  id: string
  content: string
  author: string
  createdAt: number
  upvotes: number
  downvotes: number
}

// --- Banned words filter ---
const BANNED_WORDS: string[] = [
  'đụ',
  'địt',
  'lồn',
  'cặc',
  'đéo',
  'đĩ',
  'fuck',
  'shit',
  'bitch',
  'ass',
  'dick',
  'pussy',
  'nigger',
  'nigga',
  'damn',
  'cunt',
]

function containsBannedWord(text: string): boolean {
  const lower = text.toLowerCase()
  return BANNED_WORDS.some((w) => lower.includes(w))
}

// --- Default quotes ---
const DEFAULT_QUOTES: Quote[] = [
  {
    id: 'default-1',
    content:
      'Thế giới của anh giống như một trang giấy trắng, từng ngày cố gắng anh vẽ nên một bức tranh',
    author: '',
    createdAt: 0,
    upvotes: 0,
    downvotes: 0,
  },
]

// --- State ---
const quotes = useLocalStorage<Quote[]>('quotes-collection', DEFAULT_QUOTES)
const votes = useLocalStorage<Record<string, 'up' | 'down'>>('quotes-votes', {})

const newContent = ref('')
const newAuthor = ref('')
const formError = ref('')

type SortMode = 'newest' | 'most-upvoted'
const sortMode = ref<SortMode>('newest')

// Migrate old quotes missing upvotes/downvotes
for (const q of quotes.value) {
  if (q.upvotes === undefined) q.upvotes = 0
  if (q.downvotes === undefined) q.downvotes = 0
}

const sortedQuotes = computed(() => {
  const list = [...quotes.value]
  if (sortMode.value === 'most-upvoted') {
    return list.sort((a, b) => b.upvotes - a.upvotes || b.createdAt - a.createdAt)
  }
  return list.sort((a, b) => b.createdAt - a.createdAt)
})

// --- Actions ---
function addQuote() {
  formError.value = ''
  const content = newContent.value.trim()
  const author = newAuthor.value.trim()

  if (!content) return

  if (containsBannedWord(content) || containsBannedWord(author)) {
    formError.value = 'Nội dung chứa từ không phù hợp. Vui lòng chỉnh sửa lại.'
    return
  }

  quotes.value.push({
    id: crypto.randomUUID(),
    content,
    author,
    createdAt: Date.now(),
    upvotes: 0,
    downvotes: 0,
  })

  newContent.value = ''
  newAuthor.value = ''
}

function removeQuote(id: string) {
  quotes.value = quotes.value.filter((q) => q.id !== id)
  // Clean up vote tracking
  const updated = { ...votes.value }
  delete updated[id]
  votes.value = updated
}

function handleVote(quoteId: string, type: 'up' | 'down') {
  const quote = quotes.value.find((q) => q.id === quoteId)
  if (!quote) return

  const currentVote = votes.value[quoteId]

  if (currentVote === type) {
    // Toggle off — same button clicked again
    if (type === 'up') quote.upvotes = Math.max(0, quote.upvotes - 1)
    else quote.downvotes = Math.max(0, quote.downvotes - 1)
    const updated = { ...votes.value }
    delete updated[quoteId]
    votes.value = updated
  } else {
    // Reverse previous vote if exists
    if (currentVote === 'up') quote.upvotes = Math.max(0, quote.upvotes - 1)
    if (currentVote === 'down') quote.downvotes = Math.max(0, quote.downvotes - 1)

    // Apply new vote
    if (type === 'up') quote.upvotes++
    else quote.downvotes++
    votes.value = { ...votes.value, [quoteId]: type }
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-2xl px-6 py-12">
      <!-- Header -->
      <header class="mb-10 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent-coral"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Trang chủ
        </RouterLink>

        <h1 class="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          <span class="text-accent-coral">//</span> Quotes
        </h1>
        <p class="mt-2 text-text-secondary">Lưu giữ những câu nói yêu thích của bạn</p>
      </header>

      <!-- Add form -->
      <form
        class="mb-10 animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-5"
        @submit.prevent="addQuote"
      >
        <textarea
          v-model="newContent"
          placeholder="Nhập câu quote..."
          rows="3"
          class="w-full resize-none border border-border-default bg-bg-deep px-4 py-3 text-text-primary placeholder-text-dim outline-none transition-colors focus:border-accent-coral"
        />
        <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            v-model="newAuthor"
            type="text"
            placeholder="Tác giả (tuỳ chọn)"
            class="flex-1 border border-border-default bg-bg-deep px-4 py-2.5 text-text-primary placeholder-text-dim outline-none transition-colors focus:border-accent-coral"
          />
          <button
            type="submit"
            :disabled="!newContent.trim()"
            class="inline-flex items-center justify-center gap-2 bg-accent-coral px-5 py-2.5 font-display text-sm font-semibold tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon icon="lucide:plus" class="size-4" />
            Thêm
          </button>
        </div>

        <!-- Error message -->
        <p v-if="formError" class="mt-3 text-sm text-red-400">
          <Icon icon="lucide:alert-triangle" class="mr-1 inline size-4 align-text-bottom" />
          {{ formError }}
        </p>
      </form>

      <!-- Sort + count bar -->
      <div
        v-if="sortedQuotes.length > 0"
        class="mb-4 flex items-center justify-between animate-fade-up animate-delay-2"
      >
        <p class="text-xs text-text-dim font-display tracking-wide">
          {{ sortedQuotes.length }} quote{{ sortedQuotes.length > 1 ? 's' : '' }}
        </p>

        <div class="flex items-center gap-1">
          <button
            :class="[
              'px-2.5 py-1 text-xs font-display tracking-wide transition-colors',
              sortMode === 'newest'
                ? 'bg-accent-coral text-white'
                : 'text-text-secondary hover:text-text-primary',
            ]"
            @click="sortMode = 'newest'"
          >
            Mới nhất
          </button>
          <button
            :class="[
              'px-2.5 py-1 text-xs font-display tracking-wide transition-colors',
              sortMode === 'most-upvoted'
                ? 'bg-accent-coral text-white'
                : 'text-text-secondary hover:text-text-primary',
            ]"
            @click="sortMode = 'most-upvoted'"
          >
            Nhiều vote nhất
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="sortedQuotes.length === 0"
        class="animate-fade-up animate-delay-2 flex flex-col items-center py-20 text-center"
      >
        <Icon icon="lucide:quote" class="mb-4 size-12 text-text-dim" />
        <p class="text-lg text-text-secondary">Chưa có quote nào</p>
        <p class="mt-1 text-sm text-text-dim">Thêm câu nói yêu thích đầu tiên của bạn ở trên</p>
      </div>

      <!-- Quotes list -->
      <ul v-else class="space-y-4">
        <li
          v-for="quote in sortedQuotes"
          :key="quote.id"
          class="animate-fade-up border border-border-default bg-bg-surface p-5 transition-colors hover:border-border-hover"
        >
          <div class="flex items-start gap-3">
            <span class="mt-0.5 font-display text-2xl leading-none text-accent-coral select-none"
              >&ldquo;</span
            >
            <div class="min-w-0 flex-1">
              <p class="text-lg leading-relaxed">{{ quote.content }}</p>
              <p v-if="quote.author" class="mt-2 text-sm text-text-secondary">
                — {{ quote.author }}
              </p>

              <!-- Vote buttons -->
              <div class="mt-3 flex items-center gap-4">
                <button
                  class="inline-flex items-center gap-1.5 text-sm transition-colors"
                  :class="
                    votes[quote.id] === 'up'
                      ? 'text-accent-coral'
                      : 'text-text-dim hover:text-text-secondary'
                  "
                  :title="votes[quote.id] === 'up' ? 'Bỏ upvote' : 'Upvote'"
                  @click="handleVote(quote.id, 'up')"
                >
                  <Icon
                    :icon="votes[quote.id] === 'up' ? 'lucide:thumbs-up' : 'lucide:thumbs-up'"
                    class="size-4"
                  />
                  <span class="font-display text-xs tabular-nums">{{ quote.upvotes }}</span>
                </button>
                <button
                  class="inline-flex items-center gap-1.5 text-sm transition-colors"
                  :class="
                    votes[quote.id] === 'down'
                      ? 'text-red-400'
                      : 'text-text-dim hover:text-text-secondary'
                  "
                  :title="votes[quote.id] === 'down' ? 'Bỏ downvote' : 'Downvote'"
                  @click="handleVote(quote.id, 'down')"
                >
                  <Icon
                    :icon="votes[quote.id] === 'down' ? 'lucide:thumbs-down' : 'lucide:thumbs-down'"
                    class="size-4"
                  />
                  <span class="font-display text-xs tabular-nums">{{ quote.downvotes }}</span>
                </button>
              </div>
            </div>
            <button
              class="shrink-0 p-1 text-text-dim transition-colors hover:text-accent-coral"
              title="Xoá quote"
              @click="removeQuote(quote.id)"
            >
              <Icon icon="lucide:x" class="size-4" />
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
