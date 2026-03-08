<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

const password = ref('')
const length = ref(12)

const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const lower = 'abcdefghijklmnopqrstuvwxyz'
const num = '0123456789'
const sym = '!@#$%^&*()_+-=[]{}'

const includeUpper = ref(true)
const includeLower = ref(true)
const includeNum = ref(true)
const includeSym = ref(false)

function generate() {
  let chars = ''

  if (includeUpper.value) chars += upper
  if (includeLower.value) chars += lower
  if (includeNum.value) chars += num
  if (includeSym.value) chars += sym

  if (chars.length === 0) {
    alert('Hãy chọn ít nhất 1 loại ký tự')
    return
  }

  let result = ''

  for (let i = 0; i < length.value; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  password.value = result
}

function copy() {
  navigator.clipboard.writeText(password.value)
  alert('Đã copy mật khẩu!')
}

const strength = computed(() => {
  let score = 0

  if (password.value.length >= 8) score++
  if (/[A-Z]/.test(password.value)) score++
  if (/[0-9]/.test(password.value)) score++
  if (/[^A-Za-z0-9]/.test(password.value)) score++

  return score
})

const percent = computed(() => strength.value * 25)

const label = computed(() => {
  if (strength.value <= 1) return 'Yếu'
  if (strength.value == 2) return 'Trung bình'
  if (strength.value == 3) return 'Mạnh'
  return 'Rất mạnh'
})
</script>
<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center px-4"
  >
    <h1 class="font-display text-4xl sm:text-6xl font-bold text-accent-coral animate-fade-up">
      Tạo mật khẩu ngẫu nhiên
    </h1>

    <p
      class="mt-4 text-text-secondary text-lg text-center max-w-md animate-fade-up animate-delay-2"
    >
      Tạo mật khẩu mạnh giúp bảo vệ tài khoản của bạn tốt hơn.
    </p>

    <div
      class="mt-8 w-full max-w-md bg-bg-surface border border-border-default p-6 space-y-4 animate-fade-up animate-delay-3"
    >
      <input
        v-model="password"
        readonly
        class="w-full p-2 bg-bg-deep border border-border-default text-center font-mono"
      />

      <div class="w-full bg-bg-deep border border-border-default h-3">
        <div
          class="bg-accent-coral h-full transition-all duration-300"
          :style="{ width: percent + '%' }"
        />
      </div>

      <p class="text-center text-sm">
        Độ mạnh: <span class="text-accent-coral">{{ label }}</span>
      </p>

      <input type="range" min="6" max="40" v-model="length" class="w-full" />

      <div class="grid grid-cols-2 gap-2 text-sm">
        <label><input type="checkbox" v-model="includeUpper" /> Chữ hoa</label>
        <label><input type="checkbox" v-model="includeLower" /> Chữ thường</label>
        <label><input type="checkbox" v-model="includeNum" /> Số</label>
        <label><input type="checkbox" v-model="includeSym" /> Ký tự đặc biệt</label>
      </div>

      <button
        @click="generate"
        class="w-full bg-accent-coral py-2 transition hover:opacity-90 active:scale-95"
      >
        Tạo mật khẩu
      </button>

      <button
        v-if="password"
        @click="copy"
        class="w-full border border-border-default py-2 hover:border-accent-coral"
      >
        Copy mật khẩu
      </button>
    </div>

    <RouterLink
      to="/"
      class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-3"
    >
      ← Về trang chủ
    </RouterLink>
  </div>
</template>
