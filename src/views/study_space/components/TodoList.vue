<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { Icon } from '@iconify/vue'

interface TodoItem {
  id: number
  text: string
  done: boolean
}

const isExpanded = ref(false)
const newTodoText = ref('')
const todos = useLocalStorage<TodoItem[]>('study-space-todos', [])

const completedCount = computed(() => todos.value.filter((t) => t.done).length)
const totalCount = computed(() => todos.value.length)

function addTodo() {
  const text = newTodoText.value.trim()
  if (!text) return
  todos.value.push({
    id: Date.now(),
    text,
    done: false,
  })
  newTodoText.value = ''
}

function toggleTodo(id: number) {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) {
    todo.done = !todo.done
  }
}

function removeTodo(id: number) {
  todos.value = todos.value.filter((t) => t.id !== id)
}

function clearCompleted() {
  todos.value = todos.value.filter((t) => !t.done)
}
</script>

<template>
  <!-- Mini Toggle -->
  <div class="fixed bottom-4 left-4 z-50">
    <button
      v-if="!isExpanded"
      class="flex items-center gap-2 border border-white/20 bg-black/50 px-4 py-2.5 text-white/80 backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/60 hover:text-white"
      @click="isExpanded = true"
    >
      <Icon icon="lucide:list-todo" class="size-5" />
      <span class="text-sm">
        <span v-if="totalCount > 0">{{ completedCount }}/{{ totalCount }}</span>
        <span v-else class="hidden sm:inline">Việc cần làm</span>
      </span>
    </button>

    <!-- Expanded Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isExpanded"
        class="w-72 border border-white/20 bg-black/70 backdrop-blur-xl sm:w-80"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 class="font-display text-sm font-semibold tracking-wide text-white">
            <Icon icon="lucide:list-todo" class="mr-1.5 inline size-4" />
            Việc cần làm
            <span v-if="totalCount > 0" class="ml-1 text-white/40"
              >({{ completedCount }}/{{ totalCount }})</span
            >
          </h3>
          <button class="text-white/50 transition hover:text-white" @click="isExpanded = false">
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </div>

        <!-- Add Todo -->
        <div class="border-b border-white/10 p-3">
          <form class="flex gap-2" @submit.prevent="addTodo">
            <input
              v-model="newTodoText"
              type="text"
              placeholder="Thêm việc mới..."
              class="flex-1 border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-accent-sky"
            />
            <button
              type="submit"
              class="border border-white/20 bg-white/5 px-3 py-2 text-white/60 transition hover:border-accent-sky hover:bg-accent-sky/20 hover:text-white"
            >
              <Icon icon="lucide:plus" class="size-4" />
            </button>
          </form>
        </div>

        <!-- Todo List -->
        <div class="max-h-64 overflow-y-auto">
          <div v-if="todos.length === 0" class="px-4 py-8 text-center text-sm text-white/30">
            <Icon icon="lucide:inbox" class="mx-auto mb-2 size-8" />
            <p>Chưa có việc nào</p>
          </div>

          <TransitionGroup
            tag="ul"
            enter-active-class="transition duration-200"
            enter-from-class="opacity-0 -translate-x-4"
            leave-active-class="transition duration-150"
            leave-to-class="opacity-0 translate-x-4"
          >
            <li
              v-for="todo in todos"
              :key="todo.id"
              class="group flex items-center gap-3 border-b border-white/5 px-4 py-2.5 transition hover:bg-white/5"
            >
              <button
                class="flex size-5 shrink-0 items-center justify-center border transition"
                :class="
                  todo.done
                    ? 'border-accent-sky bg-accent-sky/20 text-accent-sky'
                    : 'border-white/20 text-transparent hover:border-white/40'
                "
                @click="toggleTodo(todo.id)"
              >
                <Icon v-if="todo.done" icon="lucide:check" class="size-3" />
              </button>
              <span
                class="flex-1 text-sm transition"
                :class="todo.done ? 'text-white/30 line-through' : 'text-white/80'"
              >
                {{ todo.text }}
              </span>
              <button
                class="text-white/0 transition group-hover:text-white/40 group-hover:hover:text-red-400"
                @click="removeTodo(todo.id)"
              >
                <Icon icon="lucide:trash-2" class="size-3.5" />
              </button>
            </li>
          </TransitionGroup>
        </div>

        <!-- Footer -->
        <div v-if="completedCount > 0" class="border-t border-white/10 px-4 py-2">
          <button
            class="text-xs text-white/30 transition hover:text-white/60"
            @click="clearCompleted"
          >
            Xoá {{ completedCount }} việc đã xong
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
