<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  productCount: number
  categoryFilter: string
  authorFilter: string
  allCategories: string[]
  allAuthors: string[]
}>()

const emit = defineEmits<{
  close: []
  update: [productCount: number]
  updateCategory: [value: string]
  updateAuthor: [value: string]
  apply: []
  clear: []
}>()

const showAuthorDropdown = ref(false)
const authorInputRef = ref<HTMLInputElement | null>(null)

const filteredAuthors = computed(() => {
  if (!props.authorFilter) return props.allAuthors
  return props.allAuthors.filter((a: string) =>
    a.toLowerCase().includes(props.authorFilter.toLowerCase()),
  )
})

function onAuthorFocus() {
  showAuthorDropdown.value = true
}

function onAuthorInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('updateAuthor', value)
  showAuthorDropdown.value = true
}

function selectAuthor(author: string) {
  emit('updateAuthor', author)
  showAuthorDropdown.value = false
}

function clearAuthor() {
  emit('updateAuthor', '')
  showAuthorDropdown.value = false
  authorInputRef.value?.focus()
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.author-dropdown-container')) {
    showAuthorDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    v-if="show"
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 p-6 rounded-lg max-w-md"
    style="background-color: rgba(22, 34, 50, 0.95); border: 1px solid #253549"
    @click.stop
  >
    <button
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
      style="color: #8b9db5"
      @click="emit('close')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
    <h3 class="font-display text-lg font-semibold text-[#F0EDE6] mb-4 pr-6">Settings</h3>

    <div class="mb-3">
      <label class="block text-sm text-[#8B9DB5] mb-2">Category</label>
      <select
        :value="categoryFilter"
        class="w-full py-2 px-3 rounded text-base bg-[#1E2F42] border border-[#253549] text-[#F0EDE6] focus:outline-none focus:border-[#FF6B4A]"
        @change="emit('updateCategory', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">All Categories</option>
        <option v-for="cat in allCategories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <div class="mb-3 author-dropdown-container relative">
      <label class="block text-sm text-[#8B9DB5] mb-2">Author</label>
      <div class="relative">
        <div class="flex items-center">
          <input
            ref="authorInputRef"
            :value="authorFilter"
            type="text"
            placeholder="All Authors"
            class="flex-1 py-2 px-3 rounded-l text-base bg-[#1E2F42] border border-[#253549] text-[#F0EDE6] focus:outline-none focus:border-[#FF6B4A]"
            :class="{ 'border-[#FF6B4A]': showAuthorDropdown }"
            @focus="onAuthorFocus"
            @input="onAuthorInput"
          />
          <button
            v-if="authorFilter"
            type="button"
            class="px-3 py-2 rounded-r border border-l-0 text-base bg-[#1E2F42] border-[#253549] text-[#FF6B4A] hover:text-[#FF8A70]"
            @click="clearAuthor"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div
          v-if="showAuthorDropdown"
          class="absolute z-30 w-full mt-1 rounded-lg border overflow-hidden"
          style="background-color: #1e2f42; border-color: #253549"
        >
          <div class="overflow-y-auto" style="max-height: 200px">
            <button
              type="button"
              class="w-full px-3 py-2 text-left text-sm text-[#F0EDE6] hover:bg-[#253549]"
              @click="selectAuthor('')"
            >
              All Authors
            </button>
            <button
              v-for="author in filteredAuthors"
              :key="author"
              type="button"
              class="w-full px-3 py-2 text-left text-sm text-[#F0EDE6] hover:bg-[#253549]"
              @click="selectAuthor(author)"
            >
              {{ author }}
            </button>
            <div v-if="filteredAuthors.length === 0" class="px-3 py-2 text-sm text-[#8B9DB5]">
              No results found
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <label class="block text-sm text-[#8B9DB5] mb-2">Số lượng hiển thị</label>
      <input
        :value="productCount"
        type="number"
        min="0"
        max="141"
        class="w-full py-2 px-3 rounded text-base bg-[#1E2F42] border border-[#253549] text-[#F0EDE6] focus:outline-none focus:border-[#FF6B4A]"
        @input="emit('update', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="flex gap-2">
      <button
        class="flex-1 py-2 px-4 rounded text-sm font-display transition-colors border"
        style="border-color: #253549; color: #8b9db5"
        @click="emit('clear')"
      >
        Clear
      </button>
      <button
        class="flex-1 py-2 px-4 rounded text-sm font-display transition-colors"
        style="background-color: #ff6b4a; color: #0f1923"
        @click="emit('apply')"
      >
        Apply
      </button>
    </div>
  </div>
</template>

<style scoped>
input,
select {
  font-size: 16px;
}

.author-dropdown-container ::-webkit-scrollbar {
  width: 6px;
}
.author-dropdown-container ::-webkit-scrollbar-track {
  background: #1e2f42;
}
.author-dropdown-container ::-webkit-scrollbar-thumb {
  background: #ff6b4a;
  border-radius: 3px;
}
.author-dropdown-container ::-webkit-scrollbar-thumb:hover {
  background: #ff8a70;
}
</style>
