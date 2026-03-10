<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { STYLES, UI_TRANSLATIONS, SANITIZE_PROMPT } from './utils/prompts'
import { FALLBACK_TEMPLATES } from './utils/fallbacks'
import { useGemini } from './composables/useGemini'

const { apiKey, isLoading, saveApiKey, generate } = useGemini()

const lang = ref<'vi' | 'en'>('vi')
const taskDescription = ref('')
const selectedStyle = ref('chaotic')
const generatedMessage = ref('')
const showSettings = ref(false)
const tempApiKey = ref('')
const isSanitizing = ref(false)

const t = computed(() => UI_TRANSLATIONS[lang.value])

onMounted(() => {
  tempApiKey.value = apiKey.value
  // Default to chaotic if no API key since conventional is disabled
  if (!apiKey.value && selectedStyle.value === 'conventional') {
    selectedStyle.value = 'chaotic'
  }
})

// Watch for API key removal to auto-switch from conventional
watch(apiKey, (newVal) => {
  if (!newVal && selectedStyle.value === 'conventional') {
    selectedStyle.value = 'chaotic'
  }
})

const getRandomFallback = (style: string): string => {
  const templates =
    FALLBACK_TEMPLATES[style as keyof typeof FALLBACK_TEMPLATES] || FALLBACK_TEMPLATES.chaotic
  return templates[Math.floor(Math.random() * templates.length)] || ''
}

const handleGenerate = async () => {
  if (!taskDescription.value && !apiKey.value) {
    generatedMessage.value = getRandomFallback(selectedStyle.value)
    return
  }

  if (!taskDescription.value) return

  if (!apiKey.value) {
    generatedMessage.value = getRandomFallback(selectedStyle.value)
    return
  }

  const style = STYLES[selectedStyle.value as keyof typeof STYLES]
  const result = await generate(taskDescription.value, style.prompt)
  if (result) {
    generatedMessage.value = result
  }
}

const handleSanitize = async () => {
  if (!generatedMessage.value) return

  if (!apiKey.value) {
    generatedMessage.value = `feat: ${generatedMessage.value.toLowerCase().slice(0, 50)}...`
    selectedStyle.value = 'conventional'
    return
  }

  isSanitizing.value = true
  const result = await generate(generatedMessage.value, SANITIZE_PROMPT)
  if (result) {
    generatedMessage.value = result
    selectedStyle.value = 'conventional'
  }
  isSanitizing.value = false
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(generatedMessage.value)
}

const saveSettings = () => {
  saveApiKey(tempApiKey.value)
  showSettings.value = false
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary p-4 md:p-8 font-body overflow-x-hidden selection:bg-accent-coral selection:text-bg-deep"
  >
    <!-- Header -->
    <header class="max-w-4xl mx-auto flex justify-between items-center mb-12">
      <router-link
        to="/"
        class="flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral/50 rounded touch-manipulation"
      >
        <Icon
          icon="fluent:arrow-left-24-filled"
          class="group-hover:-translate-x-1 transition-transform"
        />
        <span class="font-display uppercase tracking-widest text-[10px]">{{ t.back }}</span>
      </router-link>

      <div class="flex items-center gap-3">
        <!-- Language Switcher -->
        <button
          @click="lang = lang === 'vi' ? 'en' : 'vi'"
          class="border border-border-default px-2 py-1 text-[10px] font-display tracking-widest uppercase hover:border-accent-coral transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral/50 touch-manipulation"
        >
          {{ lang === 'vi' ? 'EN' : 'VI' }}
        </button>

        <div
          :class="[
            'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border animate-pulse',
            apiKey
              ? 'bg-accent-coral/10 border-accent-coral text-accent-coral'
              : 'bg-text-dim/10 border-text-dim text-text-dim',
          ]"
        >
          {{ apiKey ? t.ai_active : t.local_mode }}
        </div>
        <button
          @click="showSettings = true"
          class="p-2 rounded-xl bg-bg-surface border border-border-default hover:border-accent-coral transition-all hover:rotate-90 duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral/50 touch-manipulation"
        >
          <Icon icon="fluent:settings-24-filled" class="text-xl" />
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto space-y-12">
      <!-- Title Section -->
      <section class="text-center space-y-4 animate-fade-up">
        <div
          class="inline-block bg-accent-amber text-bg-deep font-display font-bold text-[10px] tracking-[0.3em] px-3 py-1 mb-4 rotate-1"
        >
          {{ t.title_top }}
        </div>
        <h1
          class="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter leading-none"
        >
          {{ t.title }}<br /><span class="text-accent-coral">{{ t.subtitle }}</span>
        </h1>
        <p class="text-text-secondary max-w-lg mx-auto text-sm md:text-base font-medium opacity-80">
          {{ t.desc }}
        </p>
      </section>

      <!-- Main Interaction Card -->
      <div
        class="bg-bg-surface border border-border-default rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden animate-fade-up animate-delay-1"
      >
        <!-- Decoration -->
        <div
          class="absolute top-0 right-0 w-32 h-32 bg-accent-coral/5 blur-3xl rounded-full -mr-16 -mt-16"
        ></div>

        <div class="space-y-8 relative z-10">
          <!-- Input Area -->
          <div class="space-y-4">
            <div class="flex justify-between items-end px-2">
              <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">
                {{ t.label_input }}
              </label>
              <span class="text-[10px] font-mono text-text-dim"
                >{{ taskDescription.length }} chrs</span
              >
            </div>
            <textarea
              v-model="taskDescription"
              :placeholder="t.placeholder_input"
              class="w-full h-32 bg-bg-deep border border-border-default rounded-2xl p-5 text-text-primary outline-none focus-visible:border-accent-coral focus-visible:ring-1 focus-visible:ring-accent-coral/20 transition-all resize-none font-medium placeholder:text-text-dim/50"
            ></textarea>
          </div>

          <!-- Style Selector -->
          <div class="space-y-4">
            <label
              class="block text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim px-2"
            >
              {{ t.label_mood }}
            </label>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                v-for="(style, slug) in STYLES"
                :key="slug"
                @click="!apiKey && slug === 'conventional' ? null : (selectedStyle = slug)"
                :disabled="!apiKey && slug === 'conventional'"
                :class="[
                  'flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral/50 touch-manipulation',
                  selectedStyle === slug
                    ? 'bg-accent-coral border-accent-coral text-bg-deep shadow-lg shadow-accent-coral/20 scale-[1.02]'
                    : 'bg-bg-deep border-border-default hover:border-text-dim text-text-secondary',
                  !apiKey && slug === 'conventional'
                    ? 'opacity-30 cursor-not-allowed grayscale'
                    : '',
                ]"
              >
                <!-- Tooltip Description -->
                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 bg-bg-elevated border border-border-default rounded-xl text-[10px] font-body text-text-secondary opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 shadow-xl leading-relaxed"
                >
                  <span class="block font-bold text-text-primary mb-1 uppercase tracking-tighter">{{
                    style.name[lang]
                  }}</span>
                  {{ style.description[lang] }}
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-bg-elevated"
                  ></div>
                </div>

                <Icon :icon="style.icon" class="text-2xl" />
                <span class="text-[10px] font-black uppercase tracking-tight">{{
                  style.name[lang]
                }}</span>

                <Icon
                  v-if="!apiKey && slug === 'conventional'"
                  icon="fluent:lock-closed-24-filled"
                  class="absolute top-2 right-2 text-[10px]"
                />
              </button>
            </div>
          </div>

          <!-- Action Button -->
          <div class="pt-4">
            <button
              @click="handleGenerate"
              :disabled="isLoading"
              class="w-full py-5 rounded-2xl bg-text-primary text-bg-deep font-display font-black uppercase tracking-widest text-sm hover:bg-accent-coral hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral/50 touch-manipulation"
            >
              <Icon
                v-if="isLoading"
                icon="fluent:spinner-ios-24-filled"
                class="animate-spin text-xl"
              />
              <Icon v-else icon="fluent:flash-24-filled" class="text-xl" />
              <span>{{
                isLoading ? t.btn_loading : apiKey ? t.btn_generate_ai : t.btn_generate_local
              }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Result Area -->
      <section v-if="generatedMessage" class="space-y-4 animate-fade-up">
        <div class="flex justify-between items-center px-4">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-accent-coral animate-pulse"></span>
            <label class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">
              {{ t.label_result }}
            </label>
          </div>
          <button
            @click="handleSanitize"
            v-if="selectedStyle !== 'conventional'"
            :disabled="isSanitizing"
            class="group flex items-center gap-1.5 text-[10px] font-bold text-accent-sky hover:text-white transition-colors uppercase tracking-widest px-1 py-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky/50 touch-manipulation"
          >
            <Icon icon="fluent:shield-checkmark-24-filled" class="text-sm" />
            <span>{{ t.btn_sanitize }}</span>
          </button>
        </div>

        <div
          class="group bg-bg-surface border border-border-default rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl"
        >
          <p class="text-2xl md:text-3xl font-display font-medium leading-snug text-text-primary">
            {{ generatedMessage }}
          </p>

          <div
            class="mt-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-border-default pt-8"
          >
            <span class="text-[10px] text-text-dim font-mono uppercase"
              >Vibe: {{ selectedStyle }}</span
            >
            <button
              @click="copyToClipboard"
              class="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-accent-coral/10 hover:bg-accent-coral text-accent-coral hover:text-white transition-all text-xs font-bold uppercase tracking-widest border border-accent-coral/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral/50 touch-manipulation"
            >
              <Icon icon="fluent:copy-24-filled" />
              <span>{{ t.btn_copy }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Info/Warning Box -->
      <div
        v-if="!apiKey"
        class="bg-accent-amber/5 border border-accent-amber/20 p-6 rounded-2xl flex gap-4 animate-fade-up animate-delay-2"
      >
        <Icon icon="fluent:lightbulb-24-filled" class="text-2xl text-accent-amber shrink-0" />
        <div class="space-y-1 text-xs text-text-secondary leading-relaxed">
          <h4 class="font-bold text-accent-amber uppercase tracking-widest">{{ t.tip_title }}</h4>
          <p>
            {{ t.tip_desc }}
            <button @click="showSettings = true" class="text-accent-sky font-bold hover:underline">
              {{ t.tip_key }}</button
            >.
          </p>
        </div>
      </div>
    </main>

    <!-- Settings Modal -->
    <Transition name="fade">
      <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          class="absolute inset-0 bg-bg-deep/90 backdrop-blur-md"
          @click="showSettings = false"
        ></div>
        <div
          class="relative bg-bg-surface border border-border-default w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
        >
          <div class="flex justify-between items-start mb-8">
            <h2 class="text-2xl font-display font-bold flex items-center gap-3">
              <Icon icon="fluent:settings-24-filled" class="text-accent-coral" />
              {{ t.settings_title }}
            </h2>
            <button
              @click="showSettings = false"
              class="text-text-dim hover:text-white transition-colors"
            >
              <Icon icon="fluent:dismiss-24-filled" class="text-2xl" />
            </button>
          </div>

          <div class="space-y-6">
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em]">{{
                t.settings_label
              }}</label>
              <div class="relative">
                <input
                  v-model="tempApiKey"
                  type="password"
                  autocomplete="off"
                  spellcheck="false"
                  :placeholder="t.settings_placeholder"
                  class="w-full bg-bg-deep border border-border-default rounded-xl p-4 pr-12 outline-none focus-visible:border-accent-coral focus-visible:ring-1 focus-visible:ring-accent-coral/20 transition-all font-mono"
                />
                <Icon
                  icon="fluent:key-24-filled"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim"
                />
              </div>
              <p class="text-[10px] text-text-dim leading-relaxed px-1">
                {{ t.settings_desc }}
              </p>
            </div>

            <button
              @click="saveSettings"
              class="w-full py-4 rounded-xl bg-accent-coral text-bg-deep font-display font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent-coral/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral/50 touch-manipulation"
            >
              {{ t.settings_save }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Project Footer -->
    <footer
      class="mt-32 border-t border-border-default py-12 text-center space-y-4 animate-fade-up animate-delay-3 font-display"
    >
      <div class="flex justify-center gap-4 opacity-30 italic text-xs">
        <span>{{ t.footer_art }}</span>
        <span>{{ t.footer_code }}</span>
      </div>
      <p class="text-text-dim text-[10px] tracking-widest uppercase">
        Vibe check: <span class="text-text-primary">PASS</span> / Build:
        <span class="text-text-primary">2026</span>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

textarea::placeholder {
  font-family: var(--font-body);
}

/* Custom scrollbar for better look */
textarea::-webkit-scrollbar {
  width: 4px;
}
textarea::-webkit-scrollbar-track {
  background: transparent;
}
textarea::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: 10px;
}
</style>
