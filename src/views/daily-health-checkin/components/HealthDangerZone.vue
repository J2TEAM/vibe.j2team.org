<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  totalEntries: number
}>()

const emit = defineEmits<{
  clearAll: []
}>()

const confirming = ref(false)

function startConfirm(): void {
  confirming.value = true
}

function cancelConfirm(): void {
  confirming.value = false
}

function submitClear(): void {
  emit('clearAll')
  confirming.value = false
}
</script>

<template>
  <article class="border border-border-default bg-bg-surface p-5 sm:p-6">
    <h2 class="mb-3 flex items-center gap-3 font-display text-xl font-semibold">
      <span class="font-display text-xs tracking-widest text-accent-coral">//</span>
      Quản lý dữ liệu
    </h2>

    <p class="text-sm text-text-secondary">
      Tổng bản ghi đang lưu local:
      <span class="font-display text-accent-amber">{{ props.totalEntries }}</span>
    </p>

    <div
      class="mt-4 border border-accent-coral/60 bg-accent-coral/10 p-3 text-xs text-text-secondary"
    >
      Xóa toàn bộ sẽ mất lịch sử check-in trên trình duyệt hiện tại. Không thể hoàn tác.
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-if="!confirming"
        type="button"
        class="inline-flex items-center gap-2 border border-accent-coral px-4 py-2 text-sm text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep"
        @click="startConfirm"
      >
        <Icon icon="lucide:trash-2" class="size-4" />
        Xóa toàn bộ dữ liệu
      </button>

      <template v-else>
        <button
          type="button"
          class="inline-flex items-center gap-2 border border-accent-coral bg-accent-coral px-4 py-2 text-sm text-bg-deep"
          @click="submitClear"
        >
          <Icon icon="lucide:alert-triangle" class="size-4" />
          Xác nhận xóa hết
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition hover:border-accent-amber hover:text-accent-amber"
          @click="cancelConfirm"
        >
          Hủy
        </button>
      </template>
    </div>
  </article>
</template>
