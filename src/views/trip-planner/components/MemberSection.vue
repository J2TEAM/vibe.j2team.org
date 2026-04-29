<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { Member } from '../types'

defineProps<{
  members: Member[]
}>()

const emit = defineEmits<{
  add: [name: string]
  remove: [id: string]
}>()

const newName = ref('')

function handleAdd() {
  if (!newName.value.trim()) return
  emit('add', newName.value)
  newName.value = ''
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-2">
      <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
      <h3 class="font-display text-lg font-semibold text-text-primary">Thành viên</h3>
      <span class="text-xs text-text-dim">({{ members.length }})</span>
    </div>

    <!-- Add member -->
    <div class="mb-4 flex gap-2">
      <input
        v-model="newName"
        type="text"
        placeholder="Thêm thành viên..."
        class="flex-1 border border-border-default bg-bg-deep px-4 py-2.5 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
        @keydown.enter="handleAdd"
      />
      <button
        class="inline-flex items-center gap-1.5 border border-accent-coral bg-accent-coral/10 px-4 py-2.5 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
        @click="handleAdd"
      >
        <Icon icon="lucide:user-plus" class="size-3.5" />
        Thêm
      </button>
    </div>

    <div v-if="members.length === 0" class="py-4 text-center text-sm text-text-dim">
      Chưa có thành viên nào
    </div>

    <div v-else class="flex flex-wrap gap-2">
      <div
        v-for="m in members"
        :key="m.id"
        class="group inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 transition hover:bg-bg-elevated"
      >
        <span class="text-base">{{ m.avatar }}</span>
        <span class="text-sm text-text-primary">{{ m.name }}</span>
        <button
          class="ml-1 text-text-dim opacity-0 transition hover:text-accent-coral group-hover:opacity-100"
          @click="emit('remove', m.id)"
        >
          <Icon icon="lucide:x" class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
