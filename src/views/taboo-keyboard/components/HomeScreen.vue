<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const emit = defineEmits<{
  (e: 'start', name: string): void
}>()

const STORAGE_KEY = 'taboo_keyboard_player_name'

const playerNameInput = ref('')
const nameError = ref('')

// Load saved name
const savedName = sessionStorage.getItem(STORAGE_KEY)
if (savedName) playerNameInput.value = savedName

function handleStartGame() {
  const trimmed = playerNameInput.value.trim()

  if (trimmed.length < 2) {
    nameError.value = 'Name must be at least 2 characters'
    return
  }
  if (trimmed.length > 16) {
    nameError.value = 'Name must be at most 16 characters'
    return
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    nameError.value = 'Only letters, numbers, and underscores'
    return
  }

  sessionStorage.setItem(STORAGE_KEY, trimmed)
  emit('start', trimmed)
}

function handleClearName() {
  playerNameInput.value = ''
  sessionStorage.removeItem(STORAGE_KEY)
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
    <!-- Back to home -->
    <RouterLink
      to="/"
      class="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up z-10"
    >
      &larr; Về trang chủ
    </RouterLink>

    <!-- Title -->
    <div class="text-center mb-10 animate-fade-up">
      <div class="inline-block mb-4">
        <span class="font-display text-xs tracking-[0.3em] text-accent-amber uppercase">
          // Word Game
        </span>
      </div>
      <h1 class="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
        <span class="text-accent-coral">Taboo</span>
        <br />
        <span class="text-text-primary">Keyboard</span>
      </h1>
      <p class="mt-4 text-text-secondary text-base md:text-lg max-w-md mx-auto leading-relaxed">
        Gõ từ tiếng Anh hợp lệ — né các chữ cái bị cấm trước khi hết giờ!
      </p>
    </div>

    <!-- How to play card -->
    <div
      class="border border-border-default bg-bg-surface p-5 md:p-6 mb-8 max-w-md w-full animate-fade-up animate-delay-2 relative overflow-hidden"
    >
      <span
        class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-coral/5 select-none pointer-events-none"
      >
        ?
      </span>
      <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
        Cách chơi
      </h2>
      <ul class="space-y-2.5 text-text-secondary text-sm leading-relaxed">
        <li class="flex gap-2">
          <span class="text-accent-coral font-semibold shrink-0">01.</span>
          Gõ các từ tiếng Anh hợp lệ trước khi hết giờ
        </li>
        <li class="flex gap-2">
          <span class="text-accent-coral font-semibold shrink-0">02.</span>
          Tránh sử dụng các chữ cái bị cấm được hiển thị mỗi vòng
        </li>
        <li class="flex gap-2">
          <span class="text-accent-coral font-semibold shrink-0">03.</span>
          Mỗi 5 vòng thêm 1 chữ bị cấm và cần thêm 1 từ để vượt qua
        </li>
        <li class="flex gap-2">
          <span class="text-accent-coral font-semibold shrink-0">04.</span>
          Mỗi 5 vòng thời gian tăng thêm 10 giây
        </li>
        <li class="flex gap-2">
          <span class="text-accent-coral font-semibold shrink-0">05.</span>
          Chinh phục càng nhiều vòng càng tốt!
        </li>
      </ul>
    </div>

    <!-- Start form -->
    <form
      class="flex flex-col gap-4 w-full max-w-sm animate-fade-up animate-delay-3"
      @submit.prevent="handleStartGame"
    >
      <label class="text-sm text-text-dim font-display tracking-wider uppercase">
        Nhập tên của bạn
      </label>
      <div class="relative">
        <input
          v-model="playerNameInput"
          type="text"
          placeholder="Tên người chơi"
          maxlength="16"
          autofocus
          class="w-full p-3.5 pr-10 text-lg border border-border-default bg-bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent-coral transition-colors font-body"
          @input="nameError = ''"
        />
        <button
          v-if="playerNameInput"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent-coral transition-colors text-xl leading-none"
          title="Xoá tên"
          @click="handleClearName"
        >
          ×
        </button>
      </div>
      <span v-if="nameError" class="text-accent-coral text-sm">{{ nameError }}</span>

      <button
        type="submit"
        class="py-3.5 px-6 text-lg font-display font-bold border-none bg-accent-coral text-bg-deep cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/20 active:translate-y-0 tracking-wide"
      >
        Bắt đầu chơi
      </button>
    </form>

    <p
      class="mt-10 text-text-dim text-xs font-display tracking-wider animate-fade-up animate-delay-5"
    >
      Words validated by Dictionary API · No cheating!
    </p>
  </div>
</template>
