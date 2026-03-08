<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string
  options: string[]
  placeholder?: string
  disabled?: boolean
  themeClass?: string // e.g. 'focus:border-accent-coral'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': []
}>()

const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)

// Normalize string for better matching
const normalize = (str: string) => str.toLowerCase().trim()

const filteredOptions = computed(() => {
  const query = normalize(props.modelValue)
  if (!query) return props.options.slice(0, 50) // Max 50 default options
  return props.options.filter(opt => normalize(opt).includes(query)).slice(0, 50)
})

const showDropdown = computed(() => {
  return isFocused.value && !props.disabled && filteredOptions.value.length > 0
})

const selectOption = (opt: string) => {
  emit('update:modelValue', opt)
  // Defer submission slightly to ensure model updates
  setTimeout(() => {
    emit('submit')
    isFocused.value = false
    inputRef.value?.blur()
  }, 50)
}

const handleClickOutside = (e: MouseEvent) => {
  if (
    inputRef.value && !inputRef.value.contains(e.target as Node) &&
    listRef.value && !listRef.value.contains(e.target as Node)
  ) {
    isFocused.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  isFocused.value = true
}

const onEnter = () => {
  emit('submit')
  isFocused.value = false
  inputRef.value?.blur()
}
</script>

<template>
  <div class="relative w-full">
    <input 
      ref="inputRef"
      :value="modelValue"
      @input="onInput"
      @keyup.enter="onEnter"
      @focus="isFocused = true"
      :disabled="disabled"
      :class="['w-full px-4 py-3 bg-bg-deep border border-border-default outline-none text-lg transition-colors text-text-primary placeholder:text-text-dim disabled:opacity-50', themeClass]"
      :placeholder="placeholder"
      autocomplete="off"
    >
    
    <Transition name="fade-down">
      <div 
        v-if="showDropdown" 
        ref="listRef"
        class="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-64 overflow-y-auto bg-bg-deep border border-border-default shadow-2xl custom-scrollbar"
      >
        <div 
          v-for="(opt, idx) in filteredOptions" 
          :key="idx"
          @mousedown.prevent="selectOption(opt)"
          class="px-4 py-3 cursor-pointer transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-surface border-b border-border-default last:border-0 truncate"
        >
          {{ opt }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--color-bg-deep); 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-default); 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-dim); 
}
</style>
