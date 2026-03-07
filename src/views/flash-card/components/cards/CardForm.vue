<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Card } from '../../types'

const props = defineProps<{
  card?: Card
}>()

const emit = defineEmits<{
  save: [data: { front: string; back: string }]
  cancel: []
}>()

const front = ref(props.card?.front ?? '')
const back = ref(props.card?.back ?? '')

watch(
  () => props.card,
  (c) => {
    front.value = c?.front ?? ''
    back.value = c?.back ?? ''
  },
)

function handleSubmit() {
  if (!front.value.trim() || !back.value.trim()) return
  emit('save', { front: front.value.trim(), back: back.value.trim() })
  if (!props.card) {
    front.value = ''
    back.value = ''
  }
}
</script>

<template>
  <div class="border border-accent-coral/30 bg-bg-surface p-4">
    <h4 class="font-display text-sm font-semibold text-text-primary mb-3">
      {{ card ? 'Sửa thẻ' : 'Thêm thẻ mới' }}
    </h4>
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-text-dim mb-1">Mặt trước</label>
          <textarea
            v-model="front"
            rows="2"
            class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm focus:border-accent-coral focus:outline-none transition resize-none"
            placeholder="Thuật ngữ, từ vựng..."
            required
          />
        </div>
        <div>
          <label class="block text-xs text-text-dim mb-1">Mặt sau</label>
          <textarea
            v-model="back"
            rows="2"
            class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm focus:border-accent-coral focus:outline-none transition resize-none"
            placeholder="Định nghĩa, giải thích..."
            required
          />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-xs border border-border-default text-text-secondary hover:text-text-primary transition"
          @click="emit('cancel')"
        >
          Hủy
        </button>
        <button
          type="submit"
          class="px-3 py-1.5 text-xs bg-accent-coral text-bg-deep font-semibold hover:bg-accent-coral/90 transition"
          :disabled="!front.trim() || !back.trim()"
        >
          {{ card ? 'Cập nhật' : 'Thêm' }}
        </button>
      </div>
    </form>
  </div>
</template>
