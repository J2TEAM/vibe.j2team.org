<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useIntervalFn } from "@vueuse/core";
import { useDialog } from "../composables/useDialog";
import otoQuestions from "../data/otoQuestions";
import motoQuestions from "../data/motoQuestions";
import { resolveImageUrl } from "../utils/urlUtil";

type Question = {
  id: number;
  text: string;
  category: string;
  answers: { text: string; correct: boolean }[];
  explanation: string | null;
  imageUrl: string | null;
  isCritical?: boolean;
};

const props = defineProps<{
  vehicleType: "oto" | "xemay";
}>();

const emit = defineEmits<{
  (e: "back"): void;
}>();

const isExamStarted = ref(false);
const examQuestions = ref<Question[]>([]);
const selectedLicense = ref<LicenseClass>(props.vehicleType === "oto" ? "b" : "a1");
const isExamFinished = ref(false);
const examResult = ref<{
  score: number;
  total: number;
  passed: boolean;
  failedOnCritical: boolean;
  lowScore: boolean;
} | null>(null);

type LicenseClass = "a1" | "a" | "b" | "c" | "c1";

const examConfig: Record<
  LicenseClass,
  { count: number; timeMinutes: number; passThreshold: number }
> = {
  a1: { count: 25, timeMinutes: 19, passThreshold: 21 },
  a: { count: 25, timeMinutes: 19, passThreshold: 23 },
  b: { count: 35, timeMinutes: 22, passThreshold: 32 },
  c: { count: 40, timeMinutes: 24, passThreshold: 36 },
  c1: { count: 40, timeMinutes: 24, passThreshold: 36 },
};

const remainingSeconds = ref(0);

const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
});

const { pause, resume } = useIntervalFn(
  () => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      pause();
      showDialog({
        type: "alert",
        title: "HẾT GiỜ!",
        message: "Hết thời gian làm bài! Hệ thống tự động nộp bài.",
        onConfirm: () => {
          submitExam(true);
        },
      });
    }
  },
  1000,
  { immediate: false },
);

function startRandomExam() {
  const config = examConfig[selectedLicense.value];
  const sourceQuestions = selectedLicense.value.startsWith("a") ? motoQuestions : otoQuestions;

  // Question Pickers
  const pickedIds = new Set<number>();
  const pick = (list: Question[], count: number) => {
    const available = list.filter((q) => !pickedIds.has(q.id));
    const result = [...available].sort(() => 0.5 - Math.random()).slice(0, count);
    result.forEach((q) => pickedIds.add(q.id));
    return result;
  };

  const selected: Question[] = [];

  // 1. Always pick exactly 1 critical question
  const critical = pick(sourceQuestions.filter(q => q.isCritical), 1);
  selected.push(...critical);

  // 2. Pick categories based on license type
  if (selectedLicense.value.startsWith("a")) {
    // A1/A: Rules(10), Signs(5), Situations(5), Others(4)
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && q.category === "khai-niem"), 10));
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && q.category === "bien-bao"), 5));
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && q.category === "tinh-huong"), 5));
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && (q.category === "khai-niem" || q.category === "van-hoa")), 4));
  } else {
    // Car: Rules(12/14), Signs(6/7), Situations(8/9), Techniques(5/6), Culture(3)
    const isBigCar = selectedLicense.value === "c" || selectedLicense.value === "c1";
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && q.category === "khai-niem"), isBigCar ? 14 : 12));
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && q.category === "bien-bao"), isBigCar ? 7 : 6));
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && q.category === "tinh-huong"), isBigCar ? 9 : 8));
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && (q.category === "ky-thuat" || q.category === "cau-tao")), isBigCar ? 6 : 5));
    selected.push(...pick(sourceQuestions.filter(q => !q.isCritical && q.category === "van-hoa"), 3));
  }

  // 3. Dynamic filler: if still under count due to missing categories, fill from all remaining questions
  if (selected.length < config.count) {
    const remaining = config.count - selected.length;
    const filler = pick(sourceQuestions.filter(q => !q.isCritical), remaining);
    selected.push(...filler);
  }

  // 4. Final safety: Shuffle and trim and set to examQuestions
  examQuestions.value = selected.slice(0, config.count).sort(() => 0.5 - Math.random());

  // Reset state
  userAnswers.value = {};
  remainingSeconds.value = config.timeMinutes * 60;
  isExamFinished.value = false;
  examResult.value = null;
  resume();
  isExamStarted.value = true;
}

const userAnswers = ref<Record<number, string>>({});

function scrollToQuestion(index: number) {
  const el = document.getElementById(`question-${index}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

const { showDialog } = useDialog();

function handleBack() {
  if (isExamStarted.value) {
    showDialog({
      type: "confirm",
      title: "XÁC NHẬN THOÁT",
      message:
        "Bạn có chắc chắn muốn thoát khi đang làm bài thi? Tiến độ của bạn sẽ không được lưu.",
      onConfirm: () => {
        pause();
        isExamStarted.value = false;
      },
    });
  } else {
    emit("back");
  }
}

function submitExam(e?: Event | boolean) {
  const isAuto = typeof e === "boolean" ? e : false;

  if (!isAuto) {
    const answeredCount = Object.keys(userAnswers.value).length;
    const totalCount = examQuestions.value.length;
    const unansweredCount = totalCount - answeredCount;

    showDialog({
      type: "confirm",
      title: "NỘP BÀI THI?",
      message:
        unansweredCount > 0
          ? `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn chắc chắn muốn nộp bài?`
          : "Bạn đã hoàn thiện bài thi. Bạn chắc chắn muốn nộp bài chứ?",
      onConfirm: finishSubmit,
    });
  } else {
    finishSubmit();
  }
}

function finishSubmit() {
  pause();

  let score = 0;
  let failedOnCritical = false;

  examQuestions.value.forEach((q) => {
    const userAnswerValue = userAnswers.value[q.id];
    const correctAnswerValue = q.answers.find((ans) => ans.correct)?.text;

    if (userAnswerValue === correctAnswerValue) {
      score++;
    } else if (q.isCritical) {
      // Sai câu điểm liệt (bao gồm cả không làm) -> Trượt
      failedOnCritical = true;
    }
  });

  const config = examConfig[selectedLicense.value];
  const passed = !failedOnCritical && score >= config.passThreshold;

  examResult.value = {
    score,
    total: examQuestions.value.length,
    passed,
    failedOnCritical,
    lowScore: score < config.passThreshold
  };

  isExamStarted.value = false;
  isExamFinished.value = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <div class="animate-fade-up">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button
        class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors cursor-pointer"
        @click="handleBack"
      >
        <Icon icon="lucide:arrow-left" class="size-5" />
        Quay lại
      </button>
      <div class="font-display text-text-dim text-sm tracking-widest uppercase">
        THI THỬ - {{ vehicleType === "oto" ? "Ô TÔ" : "XE MÁY" }}
      </div>
    </div>

    <!-- Layout trước khi thi -->
    <div v-if="!isExamStarted && !isExamFinished" class="max-w-4xl mx-auto py-12 px-4">
      <div class="bg-bg-surface border border-border-default p-8 text-center animate-fade-up">
        <div
          class="size-20 bg-accent-coral/10 text-accent-coral rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Icon icon="lucide:clipboard-check" class="size-10" />
        </div>
        <h2 class="font-display text-3xl font-bold text-text-primary mb-4 uppercase tracking-wider">
          Thi Thử Lý Thuyết
        </h2>

        <!-- License Class Selection -->
        <div class="max-w-md mx-auto mb-8 text-left">
          <p
            class="text-text-secondary text-sm mb-3 font-medium uppercase tracking-widest text-center"
          >
            Chọn hạng bằng lái
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <template v-if="vehicleType === 'xemay'">
              <button
                @click="selectedLicense = 'a1'"
                class="px-4 py-3 border text-sm font-bold transition-all cursor-pointer"
                :class="
                  selectedLicense === 'a1'
                    ? 'bg-accent-coral text-bg-deep border-accent-coral'
                    : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-coral/50'
                "
              >
                Hạng A1
              </button>
              <button
                @click="selectedLicense = 'a'"
                class="px-4 py-3 border text-sm font-bold transition-all cursor-pointer"
                :class="
                  selectedLicense === 'a'
                    ? 'bg-accent-coral text-bg-deep border-accent-coral'
                    : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-coral/50'
                "
              >
                Hạng A
              </button>
            </template>
            <template v-else>
              <button
                @click="selectedLicense = 'b'"
                class="px-4 py-3 border text-sm font-bold transition-all cursor-pointer"
                :class="
                  selectedLicense === 'b'
                    ? 'bg-accent-coral text-bg-deep border-accent-coral'
                    : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-coral/50'
                "
              >
                Hạng B
              </button>
              <button
                @click="selectedLicense = 'c1'"
                class="px-4 py-3 border text-sm font-bold transition-all cursor-pointer"
                :class="
                  selectedLicense === 'c1'
                    ? 'bg-accent-coral text-bg-deep border-accent-coral'
                    : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-coral/50'
                "
              >
                Hạng C1
              </button>
              <button
                @click="selectedLicense = 'c'"
                class="px-4 py-3 border text-sm font-bold transition-all cursor-pointer"
                :class="
                  selectedLicense === 'c'
                    ? 'bg-accent-coral text-bg-deep border-accent-coral'
                    : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-coral/50'
                "
              >
                Hạng C
              </button>
            </template>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="startRandomExam"
            class="px-8 py-4 bg-accent-coral text-bg-deep font-display font-black uppercase tracking-widest hover:bg-accent-coral/90 transition-all shadow-lg shadow-accent-coral/20 cursor-pointer"
          >
            Bắt đầu thi
          </button>
          <button
            @click="emit('back')"
            class="px-8 py-4 bg-bg-deep border border-border-default text-text-primary font-display font-black uppercase tracking-widest hover:border-accent-coral transition-all cursor-pointer"
          >
            Thoát
          </button>
        </div>
      </div>
    </div>

    <!-- Layout sau khi thi (Kết quả) -->
    <div
      v-else-if="isExamFinished && examResult"
      class="max-w-4xl mx-auto py-12 px-4 animate-fade-up"
    >
      <div
        class="bg-bg-surface border border-border-default p-8 text-center mb-8 relative overflow-hidden"
      >
        <!-- Background Accent -->
        <div
          class="absolute top-0 left-0 w-full h-1"
          :class="examResult.passed ? 'bg-accent-sky' : 'bg-accent-coral'"
        ></div>

        <div
          class="size-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-700"
          :class="
            examResult.passed
              ? 'bg-accent-sky/10 text-accent-sky shadow-lg shadow-accent-sky/20'
              : 'bg-accent-coral/10 text-accent-coral shadow-lg shadow-accent-coral/20'
          "
        >
          <Icon :icon="examResult.passed ? 'lucide:award' : 'lucide:frown'" class="size-12" />
        </div>

        <h2
          class="font-display text-4xl font-black mb-2 uppercase tracking-tighter"
          :class="examResult.passed ? 'text-accent-sky' : 'text-accent-coral'"
        >
          {{ examResult.passed ? "ĐẠT" : "TRƯỢT" }}
        </h2>

        <p class="text-text-primary text-xl font-bold mb-6">
          Kết quả: {{ examResult.score }}/{{ examResult.total }} câu đúng
        </p>

        <div
          v-if="!examResult.passed"
          class="bg-accent-coral/10 border border-accent-coral/30 p-4 mb-8 text-accent-coral text-sm font-medium animate-pulse"
        >
          <Icon icon="lucide:alert-triangle" class="inline-block size-4 mr-2 mb-0.5" />
          <span v-if="examResult.lowScore">
            Bạn KHÔNG ĐẠT do chưa đủ số câu điểm ({{ examResult.score }}/{{ examConfig[selectedLicense].passThreshold }})
          </span>
          <span v-else-if="examResult.failedOnCritical">
            Bạn đã trả lời sai câu hỏi ĐIỂM LIỆT!
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <button
            @click="startRandomExam"
            class="px-6 py-4 bg-accent-coral text-bg-deep font-display font-black uppercase tracking-widest hover:bg-accent-coral/90 transition-all shadow-lg shadow-accent-coral/20 cursor-pointer"
          >
            Làm đề khác
          </button>
          <button
            @click="
              isExamFinished = false;
              isExamStarted = false;
            "
            class="px-6 py-4 bg-bg-deep border border-border-default text-text-primary font-display font-black uppercase tracking-widest hover:border-accent-coral transition-all cursor-pointer"
          >
            Trang chủ
          </button>
        </div>
      </div>

      <!-- Detailed Review -->
      <div class="space-y-6">
        <h3 class="font-display text-xl font-bold text-text-primary flex items-center gap-2">
          <Icon icon="lucide:list-checks" class="text-accent-coral" />
          Xem lại đáp án
        </h3>

        <div
          v-for="(q, index) in examQuestions"
          :key="q.id"
          class="bg-bg-surface border border-border-default p-6 transition-all"
          :class="{
            'border-accent-coral/50': userAnswers[q.id] !== q.answers.find((a) => a.correct)?.text,
          }"
        >
          <div class="flex items-start justify-between gap-4 mb-4">
            <h4 class="font-display font-bold text-text-primary">
              <span class="text-accent-coral">Câu {{ index + 1 }}:</span>
              {{ q.text }}
              <span
                v-if="q.isCritical"
                class="ml-2 text-[10px] bg-accent-coral text-bg-deep px-2 py-0.5 uppercase tracking-widest"
                >Điểm liệt</span
              >
            </h4>
            <div v-if="userAnswers[q.id] !== undefined">
              <Icon
                :icon="
                  userAnswers[q.id] === q.answers.find((a) => a.correct)?.text
                    ? 'lucide:check-circle-2'
                    : 'lucide:x-circle'
                "
                class="size-6 shrink-0"
                :class="
                  userAnswers[q.id] === q.answers.find((a) => a.correct)?.text
                    ? 'text-accent-sky'
                    : 'text-accent-coral'
                "
              />
            </div>
            <div v-else>
              <Icon icon="lucide:minus-circle" class="size-6 text-text-dim shrink-0" />
            </div>
          </div>

          <div v-if="q.imageUrl" class="mb-4 max-w-md mx-auto">
            <img
              :src="resolveImageUrl(q.imageUrl)"
              class="max-w-full border border-border-default bg-white p-2"
            />
          </div>

          <div class="space-y-2">
            <div
              v-for="ans in q.answers"
              :key="ans.text"
              class="p-3 text-sm flex items-center gap-3 transition-colors"
              :class="[
                ans.correct
                  ? 'bg-accent-sky/10 text-accent-sky border-l-4 border-accent-sky'
                  : userAnswers[q.id] === ans.text
                    ? 'bg-accent-coral/10 text-accent-coral border-l-4 border-accent-coral'
                    : 'bg-bg-deep text-text-dim',
              ]"
            >
              <Icon
                :icon="
                  ans.correct
                    ? 'lucide:check'
                    : userAnswers[q.id] === ans.text
                      ? 'lucide:x'
                      : 'lucide:circle'
                "
                class="size-4 shrink-0"
              />
              {{ ans.text }}
            </div>
          </div>

          <div
            v-if="q.explanation"
            class="mt-4 p-4 bg-accent-amber/5 border border-accent-amber/20 text-text-secondary text-xs italic"
          >
            <strong class="text-accent-amber not-italic uppercase tracking-widest mr-2"
              >Giải thích:</strong
            >
            {{ q.explanation }}
          </div>
        </div>
      </div>
    </div>

    <!-- Layout trong khi thi -->
    <div v-else class="flex flex-col lg:flex-row gap-8 items-start">
      <div class="flex-1 min-w-0">
        <div
          class="flex items-center justify-between bg-bg-surface border border-border-default p-4 mb-6 transition-shadow shadow-md lg:hidden sticky top-4 z-10"
        >
          <div class="font-display font-semibold text-text-primary">Đang làm bài thi</div>
          <div class="font-mono text-xl text-accent-amber font-bold flex items-center gap-2">
            <Icon icon="lucide:clock" class="size-5" />
            {{ formattedTime }}
          </div>
        </div>

        <div class="space-y-6">
          <div
            v-for="(q, index) in examQuestions"
            :key="q.id"
            :id="`question-${index}`"
            class="border border-border-default bg-bg-surface p-6 relative overflow-hidden group scroll-mt-24"
          >
            <div class="flex items-center gap-3 mb-6">
              <h3 class="font-display text-xl font-bold text-text-primary leading-tight">
                <span class="text-accent-coral">Câu {{ index + 1 }}:</span>
                <span class="ml-2 font-medium">{{ q.text }}</span>
              </h3>
            </div>
            <!-- Question Image -->
            <div
              v-if="q.imageUrl"
              class="mb-8 flex flex-col items-center border border-border-default bg-white p-4 shadow-inner w-full max-w-2xl mx-auto overflow-hidden"
            >
              <img
                :src="resolveImageUrl(q.imageUrl)"
                class="max-w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                alt="Hình ảnh minh họa"
              />
            </div>
            <div class="space-y-2">
              <label
                v-for="(ans, aIndex) in q.answers"
                :key="aIndex"
                class="flex items-center gap-4 p-4 border border-border-default/50 hover:border-accent-coral/50 transition-all cursor-pointer bg-[#0c111c] group/ans relative overflow-hidden"
                :class="{ 'border-accent-coral bg-accent-coral/5': userAnswers[q.id] === ans.text }"
              >
                <!-- Radio Indicator -->
                <div class="relative flex items-center justify-center size-5 shrink-0">
                  <input
                    type="radio"
                    :name="`question-${q.id}`"
                    :value="ans.text"
                    v-model="userAnswers[q.id]"
                    class="sr-only"
                  />
                  <div
                    class="size-5 rounded-full border-2 border-border-default transition-all duration-300 flex items-center justify-center"
                    :class="[
                      userAnswers[q.id] === ans.text
                        ? 'border-accent-coral bg-accent-coral scale-110'
                        : 'group-hover/ans:border-accent-coral/70',
                    ]"
                  >
                    <div
                      v-if="userAnswers[q.id] === ans.text"
                      class="size-2 bg-white rounded-full"
                    ></div>
                  </div>
                </div>

                <span
                  class="text-text-secondary text-sm font-medium leading-relaxed group-hover/ans:text-text-primary transition-colors"
                >
                  {{ ans.text }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-8 text-center lg:hidden">
          <button
            @click="submitExam"
            class="border border-accent-coral bg-accent-coral text-bg-deep px-8 py-3 font-display font-bold hover:bg-opacity-90 transition-opacity cursor-pointer w-full max-w-xs"
          >
            NỘP BÀI
          </button>
        </div>
      </div>

      <!-- Right Side Sidebar -->
      <div class="w-full lg:w-80 shrink-0 lg:sticky lg:top-4 z-10 flex flex-col gap-6 font-display">
        <div class="border border-border-default bg-bg-surface p-6 shadow-sm">
          <div
            class="flex items-center justify-between mb-6 pb-6 border-b border-border-default border-dashed"
          >
            <div class="text-xs uppercase tracking-widest font-bold text-text-dim">Thời gian</div>
            <div class="font-mono text-2xl text-accent-amber font-bold flex items-center gap-2">
              <Icon icon="lucide:clock" class="size-5" />
              {{ formattedTime }}
            </div>
          </div>
          <h3
            class="font-bold mb-6 text-center text-sm tracking-widest uppercase w-full text-text-dim"
          >
            TIẾN ĐỘ LÀM BÀI
          </h3>
          <div class="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            <div class="grid grid-cols-5 gap-2 w-full">
              <button
                v-for="(q, index) in examQuestions"
                :key="q.id"
                @click="scrollToQuestion(index)"
                class="size-10 flex items-center justify-center font-mono font-bold text-sm border transition-colors cursor-pointer"
                :class="[
                  userAnswers[q.id]
                    ? 'bg-accent-coral text-bg-deep border-accent-coral shadow-lg shadow-accent-coral/20'
                    : 'bg-bg-deep border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral',
                ]"
              >
                {{ index + 1 }}
              </button>
            </div>
          </div>
          <div
            class="mt-6 flex justify-between text-[10px] text-text-secondary px-2 uppercase tracking-wider font-bold"
          >
            <span class="flex items-center gap-2">
              <span class="size-3 bg-accent-coral"></span> Đã làm
            </span>
            <span class="flex items-center gap-2">
              <span class="size-3 bg-bg-deep border border-border-default"></span> Chưa làm
            </span>
          </div>

          <div
            class="mt-8 flex gap-3 justify-center pt-6 border-t border-border-default border-dashed"
          >
            <button
              @click="submitExam"
              class="flex-1 border border-accent-coral bg-accent-coral text-bg-deep py-2.5 font-display font-bold hover:bg-opacity-90 transition-opacity cursor-pointer text-sm"
            >
              NỘP BÀI
            </button>
            <button
              @click="handleBack"
              class="flex-1 border border-border-default text-text-secondary py-2.5 font-display font-bold hover:bg-bg-elevated hover:text-text-primary transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Icon icon="lucide:log-out" class="size-4" />
              THOÁT
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
