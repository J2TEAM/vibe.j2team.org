<script setup lang="ts">
import StationButton from './ui/StationButton.vue'

defineProps<{
  disabled: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  park: []
}>()
</script>

<template>
  <StationButton variant="primary" :disabled="disabled" :aria-busy="busy" @click="emit('park')">
    Đậu xe
  </StationButton>
</template>
