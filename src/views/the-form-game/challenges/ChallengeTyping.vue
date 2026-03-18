<template>
  <div class="flex flex-col items-center w-full">
    <p class="text-text-primary font-display font-medium text-lg mb-6 text-center">
      Nhập một câu tuỳ ý (phải giống con người nói).
    </p>

    <div class="w-full max-w-sm">
      <textarea
        v-model="input"
        rows="3"
        class="w-full bg-bg-deep border border-border-default rounded-none px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-0 focus:border-accent-sky transition-all resize-none font-sans"
        placeholder="vd: Mình rất ghét check captcha..."
        :disabled="state === 'success'"
        @input="checkInput"
      ></textarea>

      <p
        v-if="message"
        class="mt-2 text-sm font-medium"
        :class="state === 'success' ? 'text-accent-sky' : 'text-accent-coral'"
      >
        {{ message }}
      </p>

      <div class="mt-4 flex justify-between text-xs text-text-secondary">
        <span :class="{ 'text-accent-sky': lengthOk }">Dài > 10 ký tự</span>
        <span :class="{ 'text-accent-sky': spaceOk }">Có khoảng trắng</span>
        <span :class="{ 'text-accent-sky': notNumericOk }">Không chỉ là số</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits(['pass'])

type State = 'idle' | 'failed' | 'success'
const state = ref<State>('idle')
const input = ref('')
const message = ref('')

const lengthOk = computed(() => input.value.trim().length > 10)
const spaceOk = computed(() => input.value.includes(' '))
const notNumericOk = computed(() => {
  const t = input.value.trim()
  return t.length > 0 && isNaN(Number(t.replace(/\s/g, '')))
})

const checkInput = () => {
  if (lengthOk.value && spaceOk.value && notNumericOk.value) {
    state.value = 'success'
    message.value = 'Câu văn mượt đấy. Duyệt!'
    setTimeout(() => {
      emit('pass')
    }, 1000)
  } else {
    state.value = 'idle'
    message.value = ''
  }
}
</script>
