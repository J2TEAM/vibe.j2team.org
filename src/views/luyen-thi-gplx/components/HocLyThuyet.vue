<script setup lang="ts">
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import otoQuestions from "../data/otoQuestions";
import motoQuestions from "../data/motoQuestions";
import { resolveImageUrl } from "../utils/urlUtil";

import type { Question } from "../types/QuestionType";

const props = defineProps<{
  vehicleType: "oto" | "xemay";
}>();

defineEmits<{
  (e: "back"): void;
}>();

const getChapters = (questions: Question[]) => {
  const map: Record<string, number> = {};
  for (const q of questions) {
    map[q.category] = (map[q.category] || 0) + 1;
  }

  const titles: Record<string, string> = {
    "khai-niem": "Khái niệm và quy tắc giao thông",
    "van-hoa": "Văn hóa và đạo đức lái xe",
    "ky-thuat": "Kỹ thuật lái xe",
    "cau-tao": "Cấu tạo và sửa chữa xe",
    "bien-bao": "Hệ thống biển báo giao thông",
    "tinh-huong": "Tình huống giao thông",
    "sa-hinh": "Giải các thế sa hình",
  };

  const chaptersList = Object.keys(map).map((key, index) => {
    return {
      id: String(index + 1),
      key: key,
      title: titles[key] || key,
      questions: map[key],
    };
  });

  return chaptersList;
};

const chapters = computed(() => {
  const qs = props.vehicleType === "oto" ? otoQuestions : motoQuestions;
  return getChapters(qs);
});

const activeChapter = ref<string | null>(null);

const activeQuestions = computed(() => {
  if (!activeChapter.value) return [];
  const qs = props.vehicleType === "oto" ? otoQuestions : motoQuestions;
  return qs.filter((q: Question) => q.category === activeChapter.value);
});

const activeChapterInfo = computed(() => {
  return chapters.value.find((c) => c.key === activeChapter.value);
});

// Practice State
const userAnswers = ref<Record<number, string>>({});

function selectAnswer(qId: number, text: string) {
  if (userAnswers.value[qId]) return;
  userAnswers.value[qId] = text;
}

function scrollToQuestion(index: number) {
  const el = document.getElementById(`question-${index}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
</script>

<template>
  <div class="animate-fade-up">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button
        class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-amber transition-colors cursor-pointer"
        @click="activeChapter ? (activeChapter = null) : $emit('back')"
      >
        <Icon icon="lucide:arrow-left" class="size-5" />
        Quay lại
      </button>
      <div class="font-display text-text-dim text-sm tracking-widest uppercase">
        HỌC LÝ THUYẾT - {{ vehicleType === "oto" ? "Ô TÔ" : "XE MÁY" }}
      </div>
    </div>

    <!-- Content: Danh sách chương -->
    <div
      v-if="!activeChapter"
      class="border border-border-default bg-bg-surface p-8 text-center text-text-primary"
    >
      <Icon icon="lucide:book-open" class="size-16 mx-auto text-accent-amber/50 mb-4" />
      <h2 class="font-display text-2xl font-bold mb-2">Học lý thuyết</h2>
      <p class="text-text-secondary max-w-lg mx-auto mb-8">
        Hệ thống ôn tập đầy đủ
        {{ vehicleType === "oto" ? "600 câu hỏi ô tô" : "200 câu hỏi xe máy" }} phân loại theo từng
        phần chức năng.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
        <div
          v-for="chapter in chapters"
          :key="chapter.id"
          @click="activeChapter = chapter.key"
          class="flex flex-col border border-border-default p-5 hover:border-accent-amber hover:shadow-lg hover:shadow-accent-amber/5 bg-bg-deep cursor-pointer group transition-all"
        >
          <div
            class="font-display font-semibold text-accent-amber mb-2 group-hover:text-accent-coral transition-colors flex items-center justify-between"
          >
            <span>PHẦN {{ chapter.id }}</span>
            <Icon
              icon="lucide:chevron-right"
              class="size-4 text-text-dim group-hover:text-accent-coral transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 duration-300 transform"
            />
          </div>
          <div
            class="text-sm font-semibold flex-1 mb-4 leading-relaxed group-hover:text-text-primary"
          >
            {{ chapter.title }}
          </div>

          <div
            class="mt-auto flex items-center justify-between text-xs text-text-dim pt-4 border-t border-border-default border-dashed"
          >
            <span>Tổng số</span>
            <span class="font-mono text-accent-coral/80 font-bold"
              >{{ chapter.questions }} câu</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Content: Làm bài thực hành -->
    <div v-else class="flex flex-col lg:flex-row gap-8 items-start">
      <div class="flex-1 min-w-0">
        <div
          class="border border-border-default bg-bg-surface p-8 text-left mb-6 sticky top-4 z-10 lg:static lg:mb-8 shadow-xl lg:shadow-none transition-shadow"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <h2 class="font-display text-2xl font-bold text-text-primary uppercase tracking-tight">
              {{ activeChapterInfo?.title }}
            </h2>
          </div>
          <p class="text-text-secondary font-display text-sm tracking-wide ml-7">
            Đang luyện tập <span class="text-accent-amber font-bold">{{ activeQuestions.length }}</span> câu hỏi
          </p>
        </div>

        <div class="space-y-8">
          <div
            v-for="(q, index) in activeQuestions"
            :key="q.id"
            :id="`question-${index}`"
            class="border border-border-default bg-bg-surface p-8 relative overflow-hidden group scroll-mt-24 transition-all duration-300 hover:border-accent-coral/30"
          >
            <!-- Question Header -->
            <div class="mb-6">
              <div class="flex items-center justify-between gap-2 mb-4">
                <div class="flex items-center gap-3">
                  <span class="font-display text-accent-coral font-bold text-lg uppercase tracking-wider whitespace-nowrap">Câu {{ index + 1 }}:</span>
                  <div
                    v-if="q.isCritical"
                    class="bg-accent-coral/10 text-accent-coral border border-accent-coral/30 px-2 py-0.5 text-[10px] font-display font-black tracking-widest uppercase flex items-center gap-1 animate-pulse"
                  >
                    <Icon icon="lucide:alert-octagon" class="size-3" />
                    Câu điểm liệt
                  </div>
                </div>
                <div class="h-px flex-1 bg-border-default opacity-30"></div>
              </div>
              <h3 class="font-display text-xl sm:text-2xl font-semibold text-text-primary leading-snug">
                {{ q.text }}
              </h3>
            </div>

            <!-- Question Image -->
            <div v-if="q.imageUrl" class="mb-8 flex flex-col items-center border border-border-default bg-white p-4 shadow-inner w-full max-w-2xl mx-auto overflow-hidden">
              <img
                :src="resolveImageUrl(q.imageUrl)"
                class="max-w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                alt="Hình ảnh minh họa"
              />
            </div>

            <!-- Answer Options -->
            <div class="space-y-4">
              <div
                v-for="(ans, aIndex) in q.answers"
                :key="aIndex"
                @click="selectAnswer(q.id, ans.text)"
                class="flex items-start gap-4 p-4 border transition-all duration-200 cursor-pointer group/ans"
                :class="[
                  userAnswers[q.id] === ans.text && ans.correct
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : userAnswers[q.id] === ans.text && !ans.correct
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : userAnswers[q.id] && ans.correct
                        ? 'border-green-500/30 bg-green-500/5 text-green-400/80 italic'
                        : userAnswers[q.id]
                          ? 'border-border-default bg-bg-deep opacity-40 cursor-not-allowed scale-[0.98]'
                          : 'border-border-default bg-bg-deep hover:border-accent-amber hover:bg-bg-elevated hover:translate-x-1',
                ]"
              >
                <!-- Indicator Button -->
                <div
                  class="mt-0.5 shrink-0 flex items-center justify-center size-6 border font-display text-xs font-bold transition-all duration-300"
                  :class="[
                    userAnswers[q.id] === ans.text && ans.correct
                      ? 'border-green-500 bg-green-500 text-bg-deep scale-110'
                      : userAnswers[q.id] === ans.text && !ans.correct
                        ? 'border-red-500 bg-red-500 text-bg-deep scale-110'
                        : userAnswers[q.id] && ans.correct
                          ? 'border-green-500/50 text-green-500 animate-pulse'
                          : userAnswers[q.id]
                            ? 'border-border-default bg-bg-deep opacity-50'
                            : 'border-border-default bg-bg-surface group-hover/ans:border-accent-amber group-hover/ans:text-accent-amber',
                  ]"
                >
                  <template v-if="userAnswers[q.id] && ans.correct">
                    <Icon icon="lucide:check" class="size-4" />
                  </template>
                  <template v-else-if="userAnswers[q.id] === ans.text && !ans.correct">
                    <Icon icon="lucide:x" class="size-4" />
                  </template>
                  <template v-else>
                    {{ String.fromCharCode(65 + aIndex) }}
                  </template>
                </div>

                <span
                  class="text-base leading-relaxed flex-1"
                  :class="
                    userAnswers[q.id] && !ans.correct && userAnswers[q.id] !== ans.text
                      ? 'text-text-dim'
                      : 'text-text-primary'
                  "
                >
                  {{ ans.text }}
                </span>
              </div>
            </div>

            <!-- Explanation Panel -->
            <div
              v-if="userAnswers[q.id] && q.explanation"
              class="mt-8 p-6 border-l-4 border-accent-amber bg-bg-elevated animate-fade-up shadow-lg"
            >
              <div class="font-display font-bold text-accent-amber mb-2 flex items-center gap-2 uppercase tracking-tight">
                <Icon icon="lucide:info" class="size-5" /> 
                <span class="text-xs">// Giải thích đáp án</span>
              </div>
              <p class="text-text-secondary leading-relaxed sm:text-lg italic">
                {{ q.explanation }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Sidebar: Question List Nav -->
      <div class="w-full lg:w-80 shrink-0 sticky top-8 z-10 flex flex-col gap-6">
        <div class="border border-border-default bg-bg-surface p-6 shadow-2xl relative">
          <!-- Background Decoration -->
          <div class="absolute top-0 right-0 w-24 h-24 bg-accent-amber/5 -rotate-12 translate-x-8 -translate-y-8 select-none pointer-events-none font-display font-black text-8xl opacity-10">
            NAV
          </div>

          <h3 class="font-display font-bold text-text-primary mb-6 flex items-center gap-2 text-sm uppercase tracking-widest border-b border-border-default pb-4">
            <span class="text-accent-amber">//</span> DANH SÁCH CÂU HỎI
          </h3>

          <div class="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="(q, index) in activeQuestions"
                :key="q.id"
                @click="scrollToQuestion(index)"
                class="size-11 flex items-center justify-center font-display font-bold text-xs border transition-all duration-300 cursor-pointer"
                :class="[
                  userAnswers[q.id]
                    ? 'bg-accent-amber text-bg-deep border-accent-amber shadow-lg shadow-accent-amber/20'
                    : q.isCritical
                      ? 'bg-bg-deep border-accent-coral/50 text-accent-coral hover:bg-accent-coral hover:text-bg-deep'
                      : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-amber hover:text-accent-amber hover:scale-105',
                ]"
              >
                {{ index + 1 }}
              </button>
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-8 space-y-3 px-1 border-t border-border-default pt-6 border-dashed">
             <div class="flex items-center justify-between text-[10px] uppercase tracking-widest font-display font-bold">
                <span class="text-text-dim">Trạng thái ôn tập</span>
                <span class="text-accent-coral">{{ Math.round((Object.keys(userAnswers).filter(id => activeQuestions.some(q => q.id === Number(id))).length / activeQuestions.length) * 100) }}%</span>
             </div>
             <div class="h-1 bg-border-default w-full">
                <div 
                  class="h-full bg-accent-amber transition-all duration-1000" 
                  :style="{ width: `${(Object.keys(userAnswers).filter(id => activeQuestions.some(q => q.id === Number(id))).length / activeQuestions.length) * 100}%` }"
                ></div>
             </div>
            <div class="flex flex-col gap-2 text-[10px] text-text-dim font-display uppercase tracking-wider">
              <div class="flex justify-between w-full">
                <span class="flex items-center gap-1.5 font-bold">
                  <span class="size-2 bg-accent-amber"></span> Đã hoàn thành
                </span>
                <span class="flex items-center gap-1.5 font-bold">
                  <span class="size-2 border border-border-default bg-bg-deep"></span> Chưa trả lời
                </span>
              </div>
              <div class="flex items-center gap-1.5 font-bold text-accent-coral/80">
                <span class="size-2 border border-accent-coral bg-bg-deep"></span> Câu điểm liệt (QUAN TRỌNG)
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="mt-8 flex gap-3">
            <button
              @click="activeChapter = null"
              class="flex-1 border border-accent-coral bg-accent-coral/5 text-accent-coral py-3 font-display font-bold text-xs tracking-widest hover:bg-accent-coral hover:text-bg-deep transition-all cursor-pointer flex items-center justify-center gap-2 uppercase shadow-lg hover:shadow-accent-coral/20"
            >
              <Icon icon="lucide:book" class="size-4" />
              CHỌN PHẦN KHÁC
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
