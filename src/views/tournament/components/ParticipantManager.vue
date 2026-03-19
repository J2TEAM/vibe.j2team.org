<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import type { Participant } from '../types'

defineProps<{
  participants: Participant[]
  isSetup: boolean
}>()

const emit = defineEmits<{
  add: [name: string]
  addBulk: [text: string]
  remove: [id: string]
  edit: [id: string, name: string]
}>()

const newName = ref('')
const bulkText = ref('')
const showBulk = ref(false)
const editingId = ref<string | null>(null)
const editingName = ref('')
const error = ref('')

function handleAdd() {
  error.value = ''
  if (!newName.value.trim()) {
    error.value = 'Tên không được để trống'
    return
  }
  emit('add', newName.value)
  newName.value = ''
}

function handleBulkAdd() {
  if (!bulkText.value.trim()) return
  emit('addBulk', bulkText.value)
  bulkText.value = ''
  showBulk.value = false
}

function startEdit(p: Participant) {
  editingId.value = p.id
  editingName.value = p.name
}

function confirmEdit() {
  if (editingId.value && editingName.value.trim()) {
    emit('edit', editingId.value, editingName.value)
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-display text-sm tracking-widest text-accent-amber">//</span>
        <h3 class="font-display text-lg font-semibold text-text-primary">Người tham gia</h3>
        <span class="text-xs text-text-dim">({{ participants.length }})</span>
      </div>
      <button
        v-if="isSetup"
        class="text-xs text-accent-sky transition hover:text-accent-sky/80"
        @click="showBulk = !showBulk"
      >
        {{ showBulk ? 'Nhập từng người' : 'Nhập nhanh nhiều người' }}
      </button>
    </div>

    <div v-if="isSetup" class="mb-4">
      <div v-if="showBulk">
        <textarea
          v-model="bulkText"
          rows="5"
          placeholder="Nhập mỗi dòng 1 tên..."
          class="w-full border border-border-default bg-bg-deep px-4 py-3 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
        />
        <button
          class="mt-2 inline-flex items-center gap-2 border border-accent-coral bg-accent-coral/10 px-4 py-2 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
          @click="handleBulkAdd"
        >
          <Icon icon="lucide:users" class="size-3.5" />
          Thêm tất cả
        </button>
      </div>
      <div v-else class="flex gap-2">
        <input
          v-model="newName"
          type="text"
          placeholder="Nhập tên..."
          class="flex-1 border border-border-default bg-bg-deep px-4 py-2.5 text-sm text-text-primary placeholder-text-dim outline-none transition focus:border-accent-coral"
          @keydown.enter="handleAdd"
        />
        <button
          class="inline-flex items-center gap-1.5 border border-accent-coral bg-accent-coral/10 px-4 py-2.5 text-xs font-semibold text-accent-coral transition hover:bg-accent-coral/20"
          @click="handleAdd"
        >
          <Icon icon="lucide:plus" class="size-3.5" />
          Thêm
        </button>
      </div>
      <p v-if="error" class="mt-1 text-xs text-accent-coral">
        {{ error }}
      </p>
    </div>

    <div
      v-if="participants.length === 0"
      class="border border-border-default bg-bg-surface p-6 text-center text-sm text-text-dim"
    >
      Chưa có người tham gia
    </div>

    <div v-else class="space-y-1">
      <div
        v-for="(p, i) in participants"
        :key="p.id"
        class="flex items-center gap-3 border border-border-default bg-bg-surface px-4 py-2.5 transition hover:bg-bg-elevated"
      >
        <span class="w-6 text-center text-xs text-text-dim">{{ i + 1 }}</span>
        <template v-if="editingId === p.id">
          <input
            v-model="editingName"
            class="flex-1 border border-accent-coral bg-bg-deep px-3 py-1 text-sm text-text-primary outline-none"
            @keydown.enter="confirmEdit"
            @keydown.escape="cancelEdit"
          />
          <button
            class="p-1 text-accent-sky transition hover:text-accent-sky/80"
            @click="confirmEdit"
          >
            <Icon icon="lucide:check" class="size-4" />
          </button>
          <button class="p-1 text-text-dim transition hover:text-text-primary" @click="cancelEdit">
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </template>
        <template v-else>
          <span class="flex-1 text-sm text-text-primary">{{ p.name }}</span>
          <template v-if="isSetup">
            <button
              class="p-1 text-text-dim transition hover:text-accent-sky"
              title="Sửa tên"
              @click="startEdit(p)"
            >
              <Icon icon="lucide:pencil" class="size-3.5" />
            </button>
            <button
              class="p-1 text-text-dim transition hover:text-accent-coral"
              title="Xóa"
              @click="emit('remove', p.id)"
            >
              <Icon icon="lucide:trash-2" class="size-3.5" />
            </button>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
