<script setup lang="ts">
import { ref } from 'vue'

import { Icon } from '@iconify/vue'
import type { Pattern } from '../types'

defineProps<{
  patterns: Pattern[]
  activePatternId: string
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'add'): void
  (e: 'duplicate', id: string): void
  (e: 'remove', id: string): void
  (e: 'rename', id: string, name: string): void
}>()

const editingId = ref<string | null>(null)
const editingName = ref('')

const startRename = (pat: Pattern) => {
  editingId.value = pat.id
  editingName.value = pat.name
}

const commitRename = () => {
  if (editingId.value && editingName.value.trim()) {
    emit('rename', editingId.value, editingName.value.trim())
  }
  editingId.value = null
}
</script>

<template>
  <div
    class="flex items-center gap-1 px-4 py-2 bg-bg-deep border-b border-border-default overflow-x-auto"
  >
    <button
      v-for="pat in patterns"
      :key="pat.id"
      class="group relative flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-display uppercase tracking-wider transition-all flex-shrink-0"
      :class="
        activePatternId === pat.id
          ? 'bg-accent-coral text-white'
          : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
      "
      @click="emit('select', pat.id)"
      @dblclick="startRename(pat)"
    >
      <input
        v-if="editingId === pat.id"
        v-model="editingName"
        class="bg-transparent outline-none w-20 text-white"
        @blur="commitRename"
        @keydown.enter="commitRename"
        @keydown.esc="editingId = null"
        @click.stop
        autofocus
      />
      <span v-else>{{ pat.name }}</span>

      <!-- Context buttons when active -->
      <div
        v-if="activePatternId === pat.id"
        class="flex items-center gap-1 ml-1 opacity-70 hover:opacity-100"
      >
        <button
          @click.stop="emit('duplicate', pat.id)"
          class="hover:text-yellow-200 transition-colors"
          title="Nhân đôi"
        >
          <Icon icon="lucide:copy" class="size-3" />
        </button>
        <button
          v-if="patterns.length > 1"
          @click.stop="emit('remove', pat.id)"
          class="hover:text-red-200 transition-colors"
          title="Xóa"
        >
          <Icon icon="lucide:trash-2" class="size-3" />
        </button>
      </div>
    </button>

    <!-- Add pattern -->
    <button
      @click="emit('add')"
      class="flex items-center gap-1 px-3 py-1.5 text-text-secondary hover:text-accent-coral transition-colors flex-shrink-0"
    >
      <Icon icon="lucide:plus" class="size-4" />
      <span class="text-[10px] font-display uppercase tracking-wider hidden sm:inline">Thêm</span>
    </button>
  </div>
</template>
