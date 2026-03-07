<script setup lang="ts">
import BaseModal from './BaseModal.vue'

interface Props {
  open: boolean
  name: string
}

defineProps<Props>()

defineEmits<{
  close: []
  save: []
  'update:name': [value: string]
}>()
</script>

<template>
  <BaseModal :open="open" title="Luu di?m" @close="$emit('close')">
    <div class="grid gap-3">
      <label class="grid gap-1 text-sm">
        <span class="text-text-secondary">Tên ngu?i choi</span>
        <input
          type="text"
          class="border border-border-default bg-bg-deep px-3 py-2"
          :value="name"
          maxlength="24"
          placeholder="Nh?p tên c?a b?n"
          @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
        >
      </label>
      <button type="button" class="border border-accent-coral bg-bg-deep px-3 py-2 font-display text-sm transition hover:bg-bg-elevated" @click="$emit('save')">
        Luu di?m
      </button>
    </div>
  </BaseModal>
</template>

