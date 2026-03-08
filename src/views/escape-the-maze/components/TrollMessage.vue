<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'

defineProps<{
  visible: boolean
}>()

const { t } = useLanguage()
const currentMessage = ref('')

function getRandomMessage() {
  const messages = t.value.trollMessages
  const randomIndex = Math.floor(Math.random() * messages.length)
  currentMessage.value = messages[randomIndex] || ''
}

let messageInterval: number | null = null

onMounted(() => {
  getRandomMessage()
  messageInterval = window.setInterval(getRandomMessage, 5000)
})

onUnmounted(() => {
  if (messageInterval) {
    clearInterval(messageInterval)
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-500"
    enter-from-class="opacity-0 translate-y-4"
    leave-active-class="transition-all duration-300"
  >
    <div v-if="visible" class="bg-bg-elevated border border-accent-coral p-4 mt-6">
      <div class="flex items-center gap-3">
        <div class="text-4xl animate-bounce">🐔</div>
        <div class="flex-1">
          <p class="text-accent-coral font-display text-sm font-bold">{{ currentMessage }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>
