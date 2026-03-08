<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmLabel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-bg-deep/80" @click="emit('cancel')" />
      <div
        class="relative z-50 w-full max-w-md border border-border-default bg-bg-surface p-6 animate-fade-up"
        role="dialog"
        :aria-label="title"
      >
        <h3 class="font-display text-lg font-semibold text-text-primary mb-3">{{ title }}</h3>
        <p class="text-text-secondary text-sm mb-6">{{ message }}</p>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-coral transition"
            @click="emit('cancel')"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 text-sm bg-accent-coral text-bg-deep font-semibold hover:bg-accent-coral/90 transition"
            @click="emit('confirm')"
          >
            {{ confirmLabel ?? 'Xác nhận' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
