<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary p-4 md:p-8 font-sans selection:bg-accent-coral selection:text-text-primary flex flex-col items-center"
  >
    <!-- Header -->
    <header
      class="max-w-6xl w-full mx-auto mb-10 border-b border-border-default pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative"
    >
      <!-- Issue badge -->
      <div
        class="hidden md:block absolute -top-2 right-0 bg-accent-sky text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3"
      >
        HARD MODE
      </div>

      <div>
        <h1
          class="font-display text-4xl md:text-5xl font-bold tracking-tight text-text-primary -rotate-1"
        >
          the<span class="text-accent-coral">_</span>form<span class="text-accent-coral">_</span
          >game
        </h1>
        <p
          class="text-sm text-text-secondary mt-3 font-medium border-l-2 border-accent-coral pl-3 max-w-sm"
        >
          Nhập form đăng ký đi bạn ei. Chắc chắn là dễ ẹc 🤪
        </p>
      </div>
      <router-link
        to="/"
        class="group flex items-center gap-2 text-sm font-display font-semibold text-text-secondary hover:text-accent-coral transition-colors duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 transform group-hover:-translate-x-1 transition-transform"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
        Trở về sảnh chính
      </router-link>
    </header>

    <main
      class="max-w-6xl w-full mx-auto flex-1 pb-16 flex flex-col lg:flex-row gap-8 items-start justify-center"
    >
      <!-- Left Column (Form) -->
      <div class="w-full lg:w-1/2 flex flex-col items-center">
        <!-- Humor Message -->
        <div class="mb-8 w-full max-w-[550px] text-center">
          <p
            class="text-sm font-display font-bold text-accent-sky uppercase tracking-widest transition-all duration-300 border-b border-dashed border-accent-sky/30 pb-2 inline-block"
          >
            {{ playfulMessage }}
          </p>
        </div>

        <!-- Game Won State -->
        <div
          v-if="store.gameWon"
          class="w-full max-w-[550px] bg-bg-surface border border-accent-sky rounded-lg p-10 text-center shadow-[4px_4px_0_0_#38bdf8] mb-8 transform transition-all duration-500 scale-100"
        >
          <div
            class="w-16 h-16 bg-accent-sky/20 text-accent-sky rounded-none flex items-center justify-center mx-auto mb-6 transform rotate-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-display font-bold text-text-primary mb-2">
            Đăng ký thành công!
          </h2>

          <div v-if="!store.captchaRequested" class="mt-8 transition-all animate-fade-in-up">
            <p class="text-md mb-6 text-text-secondary">Chỉ còn một bước cuối cùng thôi...</p>
            <button
              @click="handleCaptchaTrigger"
              class="bg-accent-coral text-bg-deep px-6 py-3 font-display font-bold transition-all hover:bg-white hover:shadow-[4px_4px_0_0_#f43f5e] active:translate-y-1 active:shadow-none w-full sm:w-auto"
            >
              Xác nhận bạn là con người
            </button>
          </div>

          <div
            v-else
            class="mt-8 animate-bounce-in border border-dashed border-accent-sky p-4 bg-accent-sky/5"
          >
            <p class="text-accent-coral font-bold font-display text-xl uppercase tracking-wider">
              Đùa tí thôi. Bác Win rùi đó!
            </p>
            <p class="mt-2 text-text-secondary text-sm">Hẹn gặp ở bug sau.</p>
          </div>
        </div>

        <!-- Main Form -->
        <div
          v-else
          class="w-full max-w-[550px] bg-bg-surface rounded-none border border-border-default p-6 md:p-8 relative transition-all duration-300"
          :class="{
            'animate-shake border-accent-coral shadow-[4px_4px_0_0_#f43f5e]': isShaking,
            'animate-flash-green border-accent-sky shadow-[4px_4px_0_0_#38bdf8]': isFlashing,
            'shadow-[4px_4px_0_0_rgba(255,255,255,0.1)]': !isShaking && !isFlashing,
          }"
        >
          <div class="space-y-6">
            <!-- Username -->
            <div class="space-y-2 relative group">
              <label
                class="block text-sm font-display font-semibold text-text-primary uppercase tracking-wider"
                >Username</label
              >
              <input
                v-model="store.form.username"
                @input="onInput"
                type="text"
                class="w-full bg-bg-deep border rounded-none px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-0 focus:border-accent-sky transition-all font-mono"
                :class="
                  hasErrorFor('Username')
                    ? 'border-accent-coral bg-accent-coral/5'
                    : 'border-border-default'
                "
                placeholder="vd: sieucoder"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <!-- Password -->
            <div class="space-y-2 relative group pt-2">
              <label
                class="block text-sm font-display font-semibold text-text-primary uppercase tracking-wider"
                >Password</label
              >
              <input
                v-model="store.form.password"
                @input="onInput"
                type="text"
                class="w-full bg-bg-deep border rounded-none px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-0 focus:border-accent-sky transition-all font-mono"
                :class="
                  hasErrorFor('Mật khẩu') || hasErrorFor('Password')
                    ? 'border-accent-coral bg-accent-coral/5'
                    : 'border-border-default'
                "
                placeholder="••••••••"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <!-- Email -->
            <div class="space-y-2 relative group pt-2">
              <label
                class="block text-sm font-display font-semibold text-text-primary uppercase tracking-wider"
                >Email</label
              >
              <input
                v-model="store.form.email"
                @input="onInput"
                type="text"
                class="w-full bg-bg-deep border rounded-none px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-0 focus:border-accent-sky transition-all font-mono"
                :class="
                  hasErrorFor('Email')
                    ? 'border-accent-coral bg-accent-coral/5'
                    : 'border-border-default'
                "
                placeholder="dev@j2team.org"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <!-- Bio -->
            <div class="space-y-2 relative group pt-2">
              <label
                class="block text-sm font-display font-semibold text-text-primary uppercase tracking-wider flex items-center justify-between"
              >
                Bio
                <span
                  class="text-text-dim text-xs lowercase font-sans font-normal border border-border-default px-2 py-0.5 whitespace-nowrap"
                  >tuỳ tâm</span
                >
              </label>
              <textarea
                v-model="store.form.bio"
                @input="onInput"
                rows="3"
                class="w-full bg-bg-deep border rounded-none px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-0 focus:border-accent-sky transition-all resize-none font-mono leading-relaxed"
                :class="
                  hasErrorFor('Bio')
                    ? 'border-accent-coral bg-accent-coral/5'
                    : 'border-border-default'
                "
                placeholder="Mô tả xíu về bản thân mài..."
                spellcheck="false"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column (Rules List) -->
      <div
        class="w-full lg:w-1/2 mt-8 lg:mt-0 space-y-4 pb-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar"
        v-if="!store.gameWon"
      >
        <TransitionGroup name="rule-list">
          <div
            v-for="rule in pendingAndPassedRules"
            :key="rule.id"
            class="p-4 border transition-all duration-300 transform flex items-start gap-4"
            :class="[
              store.failedRules.includes(rule.id)
                ? 'bg-accent-coral/5 border-accent-coral'
                : 'bg-accent-sky/5 border-accent-sky',
            ]"
          >
            <div class="mt-0.5 flex-shrink-0">
              <div
                v-if="store.failedRules.includes(rule.id)"
                class="w-6 h-6 flex items-center justify-center text-bg-deep font-bold bg-accent-coral shadow-[2px_2px_0_0_#9f1239]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div
                v-else
                class="w-6 h-6 flex items-center justify-center text-bg-deep bg-accent-sky shadow-[2px_2px_0_0_#0284c7] scale-110 transition-transform"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3
                class="font-display font-bold text-sm mb-1 tracking-wider uppercase"
                :class="
                  store.failedRules.includes(rule.id) ? 'text-accent-coral' : 'text-accent-sky'
                "
              >
                Rule {{ rule.id }}
              </h3>
              <p
                class="text-sm leading-relaxed font-medium"
                :class="
                  store.failedRules.includes(rule.id) ? 'text-accent-coral/80' : 'text-text-primary'
                "
              >
                {{ rule.description }}
              </p>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </main>

    <!-- Footer Credit -->
    <footer
      class="w-full max-w-6xl mx-auto border-t border-border-default pt-6 pb-2 text-left flex justify-between items-center px-2"
    >
      <div class="text-sm font-display text-text-secondary tracking-wider">
        THE FORM GAME <span class="text-border-default opacity-50 mx-2">/</span> EST. 2026
      </div>
      <div class="text-sm text-text-dim">
        Built by
        <a
          href="https://github.com/h1n4mx0"
          target="_blank"
          rel="noopener noreferrer"
          class="font-bold text-accent-sky hover:underline transition-all"
        >
          h1n4mx0
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from './store'
import { rules } from './rules'

const store = useGameStore()
const router = useRouter()

const handleCaptchaTrigger = () => {
  store.triggerCaptcha()
  router.push('/human-verification')
}

// For animations
const isShaking = ref(false)
const isFlashing = ref(false)
const previousFailedCount = ref(0)
const previousRuleCount = ref(1)

// Reverse order to show newest rule on top
const pendingAndPassedRules = computed(() => {
  return [...store.activeRules].reverse()
})

const playfulMessage = computed(() => {
  const c = store.visibleRuleCount
  if (c === 1 && store.form.username === '' && store.form.password === '') {
    return 'Go ahead. Try to beat the form.'
  }
  if (c >= 15) {
    return 'You are either very smart or very stubborn.'
  }
  if (c >= 8) {
    return 'Things are getting complicated.'
  }
  if (c >= 4) {
    return 'It begins.'
  }
  return 'Solve to unlock the next rule.'
})

// Check if a specific keyword from rule description causes an error to link with the UI input fields.
const hasErrorFor = (keyword: string) => {
  return store.failedRules.some((id) => {
    const r = rules.find((rule) => rule.id === id)
    return r && r.description.toLowerCase().includes(keyword.toLowerCase())
  })
}

const triggerShake = () => {
  isShaking.value = false
  setTimeout(() => (isShaking.value = true), 10)
  setTimeout(() => (isShaking.value = false), 500)
}

const triggerFlash = () => {
  isFlashing.value = false
  setTimeout(() => (isFlashing.value = true), 10)
  setTimeout(() => (isFlashing.value = false), 600)
}

const onInput = () => {
  store.checkRules()
}

watch(
  () => store.failedRules.length,
  (newCount, oldCount) => {
    if (newCount > oldCount) {
      triggerShake()
    }
  },
)

watch(
  () => store.visibleRuleCount,
  (newCount, oldCount) => {
    if (newCount > oldCount) {
      triggerFlash()
    }
  },
)

onMounted(() => {
  store.checkRules()
  previousFailedCount.value = store.failedRules.length
  previousRuleCount.value = store.visibleRuleCount
})
</script>

<style scoped>
.rule-list-enter-active,
.rule-list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.rule-list-enter-from,
.rule-list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}
.rule-list-move {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animations */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes flash-green {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
  20% {
    box-shadow: 0 0 20px 5px rgba(16, 185, 129, 0.4);
    border-color: rgba(16, 185, 129, 0.6);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.animate-flash-green {
  animation: flash-green 0.6s ease-out both;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

/* Custom Scrollbar for Rules List */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border-default, #334155);
  border-radius: 10px;
}
</style>
