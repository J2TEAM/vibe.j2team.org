<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

const password = ref('')

const score = computed(() => {
  let s = 0

  if (password.value.length >= 8) s++
  if (/[A-Z]/.test(password.value)) s++
  if (/[0-9]/.test(password.value)) s++
  if (/[^A-Za-z0-9]/.test(password.value)) s++

  return s
})

const percent = computed(() => score.value * 25)

const label = computed(() => {
  if (score.value <= 1) return 'Yếu'
  if (score.value == 2) return 'Trung bình'
  if (score.value == 3) return 'Mạnh'
  return 'Rất mạnh'
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4"
  >
    <h1 class="font-display text-4xl sm:text-6xl font-bold text-accent-coral animate-fade-up">
      Kiểm tra độ mạnh mật khẩu
    </h1>

    <p
      class="mt-4 text-text-secondary text-lg text-center max-w-md animate-fade-up animate-delay-2"
    >
      Nhập mật khẩu để kiểm tra mức độ an toàn.
    </p>

    <div
      class="mt-8 w-full max-w-md bg-bg-surface border border-border-default p-6 animate-fade-up animate-delay-3"
    >
      <input
        v-model="password"
        placeholder="Nhập mật khẩu..."
        class="w-full p-2 bg-bg-deep border border-border-default"
      />

      <div v-if="password" class="mt-4">
        <div class="bg-bg-deep border border-border-default h-3">
          <div
            class="bg-accent-coral h-full transition-all duration-300"
            :style="{ width: percent + '%' }"
          />
        </div>

        <p class="text-center mt-2 text-sm">
          Độ mạnh: <span class="text-accent-coral">{{ label }}</span>
        </p>
      </div>
    </div>

    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
    >
      ← Về trang chủ
    </RouterLink>
  </div>
</template>
