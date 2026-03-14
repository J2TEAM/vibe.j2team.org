<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useClipboard, useLocalStorage } from '@vueuse/core'
import { CATEGORIES, REASONS, REASONS_EN, TEMPLATES, type CategoryId } from './constants'

// User persistent info
const userInfo = useLocalStorage('xin-nghi-hoc-user-info', {
  name: '',
  id: '',
})

// Form state
const subject = ref('')
const time = ref('')
const date = ref(new Date().toISOString().split('T')[0])
const selectedCategory = ref<CategoryId>('health')
const selectedReason = ref(REASONS.health[0])
const lang = ref<'vi' | 'en'>('vi')

// Sync reason when category changes
watch(selectedCategory, (newCat) => {
  const reasonList = lang.value === 'vi' ? REASONS[newCat] : REASONS_EN[newCat]
  selectedReason.value = reasonList[0] || ''
})

// Sync reason when language changes
watch(lang, (newLang) => {
  const reasonList =
    newLang === 'vi' ? REASONS[selectedCategory.value] : REASONS_EN[selectedCategory.value]
  // Find index of current reason in previous language to match if possible
  const prevList =
    newLang === 'vi' ? REASONS_EN[selectedCategory.value] : REASONS[selectedCategory.value]
  const idx = prevList.indexOf(selectedReason.value || '')
  if (idx !== -1 && reasonList[idx]) {
    selectedReason.value = reasonList[idx]
  } else {
    selectedReason.value = reasonList[0] || ''
  }
})

// Randomize logic
const randomizeReason = () => {
  const categories: CategoryId[] = ['health', 'work', 'family', 'accident']
  const randomCat = categories[Math.floor(Math.random() * categories.length)]!
  selectedCategory.value = randomCat
  const reasonList = lang.value === 'vi' ? REASONS[randomCat] : REASONS_EN[randomCat]
  const randomReason = reasonList[Math.floor(Math.random() * reasonList.length)]!
  selectedReason.value = randomReason
}

// Template generation
const generatedEmail = computed(() => {
  const template = TEMPLATES[lang.value]
  const data = {
    Name: userInfo.value.name || '[Họ tên]',
    ID: userInfo.value.id || '[MSSV]',
    Subject: subject.value || '[Môn học]',
    Time: time.value || '[Giờ học]',
    Date: date.value || '[Ngày học]',
    Reason: selectedReason.value,
  }

  let body = template.body
  let subjectText = template.subject

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\[${key}\\]`, 'g')
    body = body.replace(regex, value ?? '')
    subjectText = subjectText.replace(regex, value ?? '')
  })

  return {
    subject: subjectText,
    body: body,
  }
})

// Combined text for clipboard
const fullText = computed(() => {
  return `Subject: ${generatedEmail.value.subject}\n\n${generatedEmail.value.body}`
})

const { copy, copied } = useClipboard({ source: fullText })
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body pb-20">
    <div class="max-w-5xl mx-auto px-6 pt-12">
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-up"
      >
        <div>
          <h1
            class="font-display text-5xl md:text-6xl font-bold text-text-primary mb-4 flex items-center gap-4 text-balance"
          >
            <span class="text-accent-coral font-display text-2xl tracking-widest">//</span>
            Email Xin Nghỉ Học
          </h1>
          <p class="text-text-secondary text-lg max-w-xl">
            Lập trình sẵn các lý do "hợp lệ" để anh em thoải mái nghỉ học mà không tốn công viết
            mail.
          </p>
        </div>

        <div
          class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 h-fit"
        >
          VOL.01 / 2024
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Input Form -->
        <div class="space-y-8 animate-fade-up animate-delay-1">
          <section>
            <h2
              class="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Thông tin cá nhân & Lớp học
            </h2>

            <div class="grid sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs text-text-dim font-display tracking-wide uppercase"
                  >Họ và tên</label
                >
                <input
                  v-model="userInfo.name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  class="w-full bg-bg-surface border border-border-default px-4 py-3 focus:border-accent-coral outline-none transition-colors"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs text-text-dim font-display tracking-wide uppercase"
                  >MSSV / ID</label
                >
                <input
                  v-model="userInfo.id"
                  type="text"
                  placeholder="240001"
                  class="w-full bg-bg-surface border border-border-default px-4 py-3 focus:border-accent-coral outline-none transition-colors"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs text-text-dim font-display tracking-wide uppercase"
                  >Môn học</label
                >
                <input
                  v-model="subject"
                  type="text"
                  placeholder="Lập trình Web"
                  class="w-full bg-bg-surface border border-border-default px-4 py-3 focus:border-accent-coral outline-none transition-colors"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs text-text-dim font-display tracking-wide uppercase"
                  >Thời gian / Tiết</label
                >
                <input
                  v-model="time"
                  type="text"
                  placeholder="Tiết 1-3 (7:30)"
                  class="w-full bg-bg-surface border border-border-default px-4 py-3 focus:border-accent-coral outline-none transition-colors"
                />
              </div>
              <div class="space-y-2 sm:col-span-2">
                <label class="text-xs text-text-dim font-display tracking-wide uppercase"
                  >Ngày nghỉ</label
                >
                <input
                  v-model="date"
                  type="date"
                  class="w-full bg-bg-surface border border-border-default px-4 py-3 focus:border-accent-coral outline-none transition-colors"
                />
              </div>
            </div>
          </section>

          <section>
            <h2
              class="font-display text-xl font-semibold text-text-primary mb-6 flex items-center gap-3"
            >
              <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
              Lý do chính đáng
            </h2>

            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="cat in CATEGORIES"
                  :key="cat.id"
                  @click="selectedCategory = cat.id"
                  class="flex items-center gap-2 px-4 py-2 border text-sm transition-all"
                  :class="
                    selectedCategory === cat.id
                      ? 'bg-accent-coral border-accent-coral text-bg-deep'
                      : 'bg-bg-surface border-border-default text-text-secondary hover:border-text-secondary'
                  "
                >
                  <Icon :icon="cat.icon" class="size-4" />
                  {{ cat.label }}
                </button>
              </div>

              <div class="relative group">
                <select
                  v-model="selectedReason"
                  class="w-full bg-bg-surface border border-border-default px-4 py-3 appearance-none focus:border-accent-coral outline-none transition-colors pr-10 cursor-pointer"
                >
                  <option
                    v-for="r in lang === 'vi'
                      ? REASONS[selectedCategory]
                      : REASONS_EN[selectedCategory]"
                    :key="r"
                    :value="r"
                  >
                    {{ r }}
                  </option>
                </select>
                <Icon
                  icon="lucide:chevron-down"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none group-hover:text-text-primary transition-colors"
                />
              </div>

              <button
                @click="randomizeReason"
                class="inline-flex items-center gap-2 text-accent-amber hover:text-accent-amber/80 transition-colors text-sm font-display tracking-wide uppercase"
              >
                <Icon icon="lucide:shuffle" class="size-4" />
                Randomize Lý Do Nghỉ
              </button>
            </div>
          </section>
        </div>

        <!-- Preview Area -->
        <div class="animate-fade-up animate-delay-2 lg:sticky lg:top-8 h-fit">
          <div class="flex items-center justify-between mb-6">
            <h2
              class="font-display text-xl font-semibold text-text-primary flex items-center gap-3"
            >
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Preview & Copy
            </h2>

            <div class="flex items-center bg-bg-surface border border-border-default p-1 shrink-0">
              <button
                @click="lang = 'vi'"
                class="px-3 py-1 text-xs font-display tracking-widest transition-colors uppercase"
                :class="
                  lang === 'vi'
                    ? 'bg-accent-coral text-bg-deep font-bold'
                    : 'text-text-dim hover:text-text-primary'
                "
              >
                VN
              </button>
              <button
                @click="lang = 'en'"
                class="px-3 py-1 text-xs font-display tracking-widest transition-colors uppercase"
                :class="
                  lang === 'en'
                    ? 'bg-accent-coral text-bg-deep font-bold'
                    : 'text-text-dim hover:text-text-primary'
                "
              >
                EN
              </button>
            </div>
          </div>

          <div
            class="relative border border-border-default bg-bg-surface p-6 md:p-8 min-h-[400px] flex flex-col group hover:border-accent-coral transition-all duration-300"
          >
            <span
              class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none"
            >
              {{ lang === 'vi' ? 'VN' : 'EN' }}
            </span>

            <div class="mb-6 space-y-1">
              <p class="text-xs text-text-dim font-display tracking-wide uppercase">
                Email Subject:
              </p>
              <p class="text-accent-amber font-semibold">{{ generatedEmail.subject }}</p>
            </div>

            <div
              class="flex-1 whitespace-pre-wrap text-text-primary leading-relaxed text-sm md:text-base border-t border-border-default/50 pt-6"
            >
              {{ generatedEmail.body }}
            </div>

            <div
              class="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-border-default/50"
            >
              <button
                @click="copy()"
                class="flex-1 inline-flex items-center justify-center gap-3 bg-accent-coral text-bg-deep font-display font-bold py-3 px-6 transition hover:brightness-110 active:scale-[0.98]"
              >
                <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-5" />
                {{ copied ? 'ĐÃ COPY XONG!' : 'COPY TO CLIPBOARD' }}
              </button>

              <RouterLink
                to="/"
                class="inline-flex items-center justify-center gap-2 border border-border-default px-6 py-3 text-text-secondary hover:text-text-primary hover:border-accent-amber transition-colors"
              >
                <Icon icon="lucide:home" class="size-4" />
                VỀ TRANG CHỦ
              </RouterLink>
            </div>
          </div>

          <p class="mt-4 text-xs text-text-dim text-center italic">
            * Nhớ check lại thông tin lần cuối trước khi gửi mail nha đồng chí!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom transitions/styles if needed */
input[type='date']::-webkit-calendar-picker-indicator {
  filter: invert(0.8) sepia(100%) saturate(1000%) hue-rotate(180deg);
  cursor: pointer;
}
</style>
