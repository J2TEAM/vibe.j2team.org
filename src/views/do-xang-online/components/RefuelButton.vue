<script setup lang="ts">
import StationButton from './ui/StationButton.vue'

defineProps<{
  disabled: boolean
}>()

const emit = defineEmits<{
  startRefuel: []
}>()
</script>

<template>
  <StationButton variant="primary" :disabled="disabled" @click="emit('startRefuel')">
    Đổ xăng
  </StationButton>
</template>
