<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CardSet } from '../../types'

const props = defineProps<{
  set?: CardSet
}>()

const emit = defineEmits<{
  save: [data: Pick<CardSet, 'name' | 'description'>]
  cancel: []
}>()

const name = ref(props.set?.name ?? '')
const description = ref(props.set?.description ?? '')

watch(
  () => props.set,
  (s) => {
    name.value = s?.name ?? ''
    description.value = s?.description ?? ''
  },
)

function handleSubmit() {
  if (!name.value.trim()) return
  emit('save', {
    name: name.value.trim(),
    description: description.value.trim(),
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-bg-deep/80" @click="emit('cancel')" />
      <div
        class="relative z-50 w-full max-w-md border border-border-default bg-bg-surface p-6 animate-fade-up"
        role="dialog"
        :aria-label="set ? 'Sửa bộ thẻ' : 'Tạo bộ thẻ'"
      >
        <h3 class="font-display text-xl font-semibold text-text-primary mb-6">
          {{ set ? 'Sửa bộ thẻ' : 'Tạo bộ thẻ mới' }}
        </h3>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Tên bộ thẻ</label>
            <input
              v-model="name"
              type="text"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm focus:border-accent-coral focus:outline-none transition"
              placeholder="VD: Từ vựng IELTS, Công thức Hóa..."
              required
            />
          </div>

          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Mô tả</label>
            <textarea
              v-model="description"
              rows="2"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm focus:border-accent-coral focus:outline-none transition resize-none"
              placeholder="Mô tả ngắn về bộ thẻ..."
            />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-coral transition"
              @click="emit('cancel')"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm bg-accent-coral text-bg-deep font-semibold hover:bg-accent-coral/90 transition"
              :disabled="!name.trim()"
            >
              {{ set ? 'Cập nhật' : 'Tạo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
