<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { RouterLink } from "vue-router";

interface Horse {
  id: number;
  name: string;
  color: string;
  progress: number;
  emoji: string;
  wpm: number;
}

type GameMode = "solo" | "race";
type GameState = "menu" | "countdown" | "playing" | "finished";

const gameState = ref<GameState>("menu");
const gameMode = ref<GameMode>("race");
const typedText = ref("");
const correctChars = ref(0);
const totalCorrectChars = ref(0);
const errors = ref(0);
const startTime = ref<number | null>(null);
const elapsedTime = ref(0);
const countdownTime = ref(10);
const raceDuration = ref(120);
const timerInterval = ref<number | null>(null);
const botIntervals = ref<number[]>([]);
const textCompletedCount = ref(0);

const sampleTexts = [
  "typing nhanh là một kỹ năng quan trọng trong thời đại công nghệ. hãy luyện tập mỗi ngày để cải thiện tốc độ gõ phím của bạn.",
  "j2team community là nơi tập hợp những người yêu thích lập trình và công nghệ. cùng nhau học hỏi và phát triển mỗi ngày.",
  "việt nam là đất nước xinh đẹp với văn hóa lâu đời. chúng ta tự hào về truyền thống và hướng tới tương lai tươi sáng.",
  "lập trình không chỉ là viết code mà còn là nghệ thuật giải quyết vấn đề. hãy sáng tạo và không ngừng học hỏi.",
];

const targetText = ref("");
const horses = ref<Horse[]>([]);
const customText = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

const initializeHorses = (): void => {
  if (gameMode.value === "solo") {
    horses.value = [
      { id: 1, name: "Bạn", color: "bg-accent-coral", progress: 0, emoji: "🏇", wpm: 0 },
    ];
  } else {
    horses.value = [
      { id: 1, name: "Bạn", color: "bg-accent-coral", progress: 0, emoji: "🏇", wpm: 0 },
      {
        id: 2,
        name: "Bot 1",
        color: "bg-accent-amber",
        progress: 0,
        emoji: "🐴",
        wpm: 45 + Math.random() * 10,
      },
      {
        id: 3,
        name: "Bot 2",
        color: "bg-accent-sky",
        progress: 0,
        emoji: "🐎",
        wpm: 50 + Math.random() * 10,
      },
      {
        id: 4,
        name: "Bot 3",
        color: "bg-text-secondary",
        progress: 0,
        emoji: "🦄",
        wpm: 55 + Math.random() * 10,
      },
      {
        id: 5,
        name: "Bot 4",
        color: "bg-text-dim",
        progress: 0,
        emoji: "🎠",
        wpm: 60 + Math.random() * 10,
      },
    ];
  }
};

const getRandomText = (): string => {
  const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  return text ?? sampleTexts[0] ?? "";
};

const selectMode = (mode: GameMode): void => {
  gameMode.value = mode;
};

const startCountdown = (): void => {
  if (customText.value.trim()) {
    targetText.value = customText.value.trim().toLowerCase();
  } else {
    targetText.value = getRandomText();
  }

  gameState.value = "countdown";
  countdownTime.value = 10;
  typedText.value = "";
  correctChars.value = 0;
  totalCorrectChars.value = 0;
  textCompletedCount.value = 0;
  errors.value = 0;
  elapsedTime.value = 0;
  initializeHorses();

  const countdownInterval = setInterval(() => {
    countdownTime.value--;
    if (countdownTime.value <= 0) {
      clearInterval(countdownInterval);
      startRace();
    }
  }, 1000);
};

const startRace = (): void => {
  gameState.value = "playing";
  startTime.value = Date.now();
  elapsedTime.value = 0;
  typedText.value = "";

  setTimeout(() => {
    inputRef.value?.focus();
    inputRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);

  timerInterval.value = window.setInterval(() => {
    if (startTime.value) {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
      if (elapsedTime.value >= raceDuration.value) {
        finishGame();
      }
    }
  }, 100);

  if (gameMode.value === "race") {
    startBotMovement();
  }
};

const resetGame = (): void => {
  gameState.value = "menu";
  typedText.value = "";
  correctChars.value = 0;
  totalCorrectChars.value = 0;
  textCompletedCount.value = 0;
  errors.value = 0;
  startTime.value = null;
  elapsedTime.value = 0;
  countdownTime.value = 10;
  customText.value = "";

  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }

  botIntervals.value.forEach((interval) => clearInterval(interval));
  botIntervals.value = [];

  initializeHorses();
};

const handleInput = (): void => {
  if (gameState.value !== "playing") return;

  const typed = typedText.value.toLowerCase();
  const target = targetText.value;

  let correct = 0;
  let totalErrors = 0;

  for (let i = 0; i < typed.length; i++) {
    if (i < target.length && typed[i] === target[i]) {
      correct++;
    } else {
      totalErrors++;
    }
  }

  const previousCorrect = correctChars.value;
  correctChars.value = correct;
  errors.value = totalErrors;

  totalCorrectChars.value = totalCorrectChars.value - previousCorrect + correct;

  updatePlayerProgress();

  // Khi gõ xong văn bản hiện tại, chuyển sang văn bản mới ngay lập tức
  if (correct === target.length && typed.length === target.length) {
    textCompletedCount.value++;

    // Chuyển sang văn bản mới để tiếp tục gõ
    if (customText.value.trim()) {
      targetText.value = customText.value.trim().toLowerCase();
    } else {
      targetText.value = getRandomText();
    }

    // Reset sau khi đã set văn bản mới
    typedText.value = "";
    correctChars.value = 0;
  }
};

const handleFocus = (): void => {
  if (gameState.value === "playing") {
    setTimeout(() => {
      inputRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }
};

const updatePlayerProgress = (): void => {
  if (elapsedTime.value === 0 || !horses.value[0]) return;

  // Tính progress dựa trên tốc độ gõ thực tế so với mục tiêu
  // Để thắng bot, cần gõ ~55 WPM (275 ký tự/phút = 4.58 ký tự/giây)
  const targetCharsPerSecond = (55 * 5) / 60; // 55 WPM = 4.58 chars/s
  const expectedTotalChars = targetCharsPerSecond * raceDuration.value;

  const progress = (totalCorrectChars.value / expectedTotalChars) * 100;
  horses.value[0].progress = Math.min(progress, 100);
};

const startBotMovement = (): void => {
  botIntervals.value = [];

  horses.value.slice(1).forEach((horse) => {
    // Bot progress dựa trên WPM của chúng
    // WPM -> chars/second -> progress/second
    const charsPerSecond = (horse.wpm * 5) / 60;
    const targetCharsPerSecond = (55 * 5) / 60; // Baseline 55 WPM

    // Progress bot tăng mỗi giây dựa trên tốc độ của chúng
    const progressPerSecond = (charsPerSecond / targetCharsPerSecond) * (100 / raceDuration.value);

    // Thêm yếu tố ngẫu nhiên nhẹ để bot không đều nhau
    const randomFactor = 0.95 + Math.random() * 0.1;
    const adjustedProgressPerSecond = progressPerSecond * randomFactor;

    const interval = window.setInterval(() => {
      if (gameState.value !== "playing") {
        clearInterval(interval);
        return;
      }

      horse.progress += adjustedProgressPerSecond * 0.1;

      if (horse.progress >= 100) {
        horse.progress = 100;
        clearInterval(interval);

        if (horses.value[0] && horses.value[0].progress < 100) {
          setTimeout(() => {
            if (gameState.value === "playing") {
              finishGame();
            }
          }, 500);
        }
      }
    }, 100);

    botIntervals.value.push(interval);
  });
};

const finishGame = (): void => {
  gameState.value = "finished";

  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }

  botIntervals.value.forEach((interval) => clearInterval(interval));
  botIntervals.value = [];

  horses.value.forEach((horse) => {
    if (horse.progress > 100) horse.progress = 100;
  });
};

const handleFileUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    if (text && text.trim()) {
      customText.value = text.trim();
    }
  };
  reader.readAsText(file);
};

const triggerFileInput = (): void => {
  fileInputRef.value?.click();
};

const clearCustomText = (): void => {
  customText.value = "";
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const accuracy = computed(() => {
  const total = totalCorrectChars.value + errors.value;
  if (total === 0) return 100;
  return Math.round((totalCorrectChars.value / total) * 100);
});

const wpm = computed(() => {
  if (elapsedTime.value === 0) return 0;
  const minutes = elapsedTime.value / 60;
  const words = totalCorrectChars.value / 5;
  return Math.round(words / minutes);
});

const remainingTime = computed(() => {
  return Math.max(0, raceDuration.value - elapsedTime.value);
});

const winner = computed(() => {
  if (gameState.value !== "finished") return null;
  const sorted = [...horses.value].sort((a, b) => b.progress - a.progress);
  return sorted[0];
});

const playerRank = computed(() => {
  if (gameState.value !== "finished") return 0;
  const sorted = [...horses.value].sort((a, b) => b.progress - a.progress);
  return sorted.findIndex((h) => h.id === 1) + 1;
});

watch(
  () => horses.value[0]?.progress,
  (newProgress) => {
    if (gameState.value === "playing" && newProgress !== undefined && newProgress >= 100) {
      finishGame();
    }
  },
);

onMounted(() => {
  initializeHorses();
});

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value);
  botIntervals.value.forEach((interval) => clearInterval(interval));
});
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body py-8 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-8 animate-fade-up">
        <h1 class="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-accent-coral mb-3">
          🏇 Đua Ngựa Typing
        </h1>
        <p class="text-text-secondary text-base sm:text-lg">
          Gõ phím nhanh để điều khiển ngựa của bạn về đích!
        </p>
      </div>

      <div v-if="gameState === 'menu'" class="space-y-6 animate-fade-up animate-delay-2">
        <div class="bg-bg-surface border border-border-default p-6">
          <h2
            class="font-display text-xl font-semibold text-text-primary mb-4 flex items-center gap-3"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            CHỌN CHẾ ĐỘ
          </h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <button
              @click="selectMode('race')"
              :class="[
                'border p-4 text-left transition-all',
                gameMode === 'race'
                  ? 'border-accent-coral bg-bg-elevated'
                  : 'border-border-default hover:border-accent-coral',
              ]"
            >
              <div class="text-2xl mb-2">🏁</div>
              <div class="font-display font-semibold text-text-primary mb-1">Đua với Bot</div>
              <div class="text-sm text-text-secondary">
                Thi đấu với 4 bot AI (cần ~55 WPM để thắng)
              </div>
            </button>
            <button
              @click="selectMode('solo')"
              :class="[
                'border p-4 text-left transition-all',
                gameMode === 'solo'
                  ? 'border-accent-coral bg-bg-elevated'
                  : 'border-border-default hover:border-accent-coral',
              ]"
            >
              <div class="text-2xl mb-2">⏱️</div>
              <div class="font-display font-semibold text-text-primary mb-1">Luyện Tập</div>
              <div class="text-sm text-text-secondary">Chơi một mình, không có bot</div>
            </button>
          </div>
        </div>

        <div class="bg-bg-surface border border-border-default p-6">
          <h2
            class="font-display text-xl font-semibold text-text-primary mb-4 flex items-center gap-3"
          >
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
            THỜI GIAN ĐUA
          </h2>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <button
              v-for="duration in [60, 120, 180, 240, 300]"
              :key="duration"
              @click="raceDuration = duration"
              :class="[
                'border p-3 text-center transition-all',
                raceDuration === duration
                  ? 'border-accent-sky bg-bg-elevated'
                  : 'border-border-default hover:border-accent-sky',
              ]"
            >
              <div class="font-display font-semibold text-text-primary">{{ duration / 60 }}p</div>
            </button>
          </div>
        </div>

        <div class="bg-bg-surface border border-border-default p-6">
          <h2
            class="font-display text-xl font-semibold text-text-primary mb-4 flex items-center gap-3"
          >
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            NỘI DUNG
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-text-secondary mb-2">
                Nhập văn bản tùy chỉnh (hoặc để trống để dùng văn bản mẫu)
              </label>
              <textarea
                v-model="customText"
                placeholder="Nhập văn bản của bạn tại đây..."
                class="w-full bg-bg-deep border border-border-default text-text-primary p-3 text-sm font-body min-h-[120px] focus:outline-none focus:border-accent-coral transition"
              ></textarea>
            </div>
            <div class="flex gap-3">
              <button
                @click="triggerFileInput"
                class="flex-1 border border-border-default bg-bg-deep px-4 py-2.5 text-sm text-text-secondary transition hover:border-accent-sky hover:text-text-primary"
              >
                📁 Import file .txt
              </button>
              <button
                v-if="customText"
                @click="clearCustomText"
                class="border border-border-default bg-bg-deep px-4 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              >
                ✕ Xóa
              </button>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept=".txt"
              @change="handleFileUpload"
              class="hidden"
            />
            <div v-if="customText" class="text-xs text-text-dim">
              Độ dài: {{ customText.length }} ký tự
            </div>
          </div>
        </div>

        <div class="text-center">
          <button
            @click="startCountdown"
            class="bg-accent-coral text-bg-deep font-display font-bold text-sm tracking-wide px-8 py-3 transition hover:bg-accent-amber"
          >
            BẮT ĐẦU CUỘC ĐUA
          </button>
        </div>
      </div>

      <div v-if="gameState === 'countdown'" class="space-y-6 animate-fade-up">
        <div class="text-center bg-bg-surface border-2 border-accent-amber p-8">
          <div class="text-text-secondary text-lg mb-2">Chuẩn bị...</div>
          <div class="text-7xl font-display font-bold text-accent-amber mb-2">
            {{ countdownTime }}
          </div>
          <div class="text-text-secondary text-sm">Đặt tay lên bàn phím và sẵn sàng!</div>
        </div>

        <div class="bg-bg-surface border border-border-default p-4 sm:p-6">
          <div class="space-y-4">
            <div v-for="horse in horses" :key="horse.id" class="relative">
              <div class="flex items-center justify-between mb-2">
                <span
                  class="font-display text-sm font-semibold"
                  :class="horse.id === 1 ? 'text-accent-coral' : 'text-text-secondary'"
                >
                  {{ horse.name }}
                  <span v-if="horse.id > 1" class="text-text-dim text-xs ml-1"
                    >({{ Math.round(horse.wpm) }} WPM)</span
                  >
                </span>
                <span class="text-text-dim text-xs font-display">0%</span>
              </div>
              <div class="relative h-8 bg-bg-deep border border-border-default overflow-hidden">
                <div class="absolute right-0 top-0 bottom-0 w-1 bg-accent-amber"></div>
                <div
                  class="absolute top-0 bottom-0 flex items-center justify-center text-2xl left-0 transform -translate-x-1/2"
                >
                  {{ horse.emoji }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-bg-surface border border-border-default p-4 sm:p-6">
          <div class="text-text-dim text-xs mb-3 font-display tracking-wide">VĂN BẢN SẼ GÕ:</div>
          <div
            class="font-body text-base sm:text-lg leading-relaxed break-words text-text-secondary"
          >
            {{ targetText }}
          </div>
        </div>
      </div>

      <div
        v-if="gameState === 'playing'"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up animate-delay-1"
      >
        <div class="bg-bg-surface border border-border-default p-3 text-center">
          <div class="text-text-dim text-xs font-display tracking-wide mb-1">THỜI GIAN CÒN LẠI</div>
          <div class="text-accent-amber text-xl font-display font-bold">{{ remainingTime }}s</div>
        </div>
        <div class="bg-bg-surface border border-border-default p-3 text-center">
          <div class="text-text-dim text-xs font-display tracking-wide mb-1">TỐC ĐỘ</div>
          <div class="text-accent-sky text-xl font-display font-bold">{{ wpm }} WPM</div>
        </div>
        <div class="bg-bg-surface border border-border-default p-3 text-center">
          <div class="text-text-dim text-xs font-display tracking-wide mb-1">ĐỘ CHÍNH XÁC</div>
          <div class="text-accent-coral text-xl font-display font-bold">{{ accuracy }}%</div>
        </div>
        <div class="bg-bg-surface border border-border-default p-3 text-center">
          <div class="text-text-dim text-xs font-display tracking-wide mb-1">KÝ TỰ ĐÚNG</div>
          <div class="text-text-secondary text-xl font-display font-bold">
            {{ totalCorrectChars }}
          </div>
        </div>
      </div>

      <div
        v-if="gameState === 'playing' || gameState === 'finished'"
        class="bg-bg-surface border border-border-default p-4 sm:p-6 mb-6 animate-fade-up animate-delay-2"
      >
        <div class="space-y-4">
          <div v-for="horse in horses" :key="horse.id" class="relative">
            <div class="flex items-center justify-between mb-2">
              <span
                class="font-display text-sm font-semibold"
                :class="horse.id === 1 ? 'text-accent-coral' : 'text-text-secondary'"
              >
                {{ horse.name }}
                <span v-if="horse.id > 1" class="text-text-dim text-xs ml-1"
                  >({{ Math.round(horse.wpm) }} WPM)</span
                >
              </span>
              <span class="text-text-dim text-xs font-display"
                >{{ Math.round(horse.progress) }}%</span
              >
            </div>
            <div class="relative h-8 bg-bg-deep border border-border-default overflow-hidden">
              <div class="absolute right-0 top-0 bottom-0 w-1 bg-accent-amber"></div>
              <div
                class="absolute top-0 bottom-0 flex items-center justify-center text-2xl transition-all duration-300"
                :style="{
                  left: `${Math.min(horse.progress, 100)}%`,
                  transform: 'translateX(-50%)',
                }"
              >
                {{ horse.emoji }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="gameState === 'playing'"
        class="bg-bg-surface border border-border-default p-4 sm:p-6 mb-6 animate-fade-up animate-delay-3"
      >
        <div class="text-text-dim text-xs mb-3 font-display tracking-wide">VĂN BẢN CẦN GÕ:</div>
        <div
          class="font-body text-base sm:text-lg leading-relaxed break-words mb-4 p-3 bg-bg-deep border border-border-default"
        >
          <span
            v-for="(char, index) in targetText"
            :key="index"
            :class="{
              'text-accent-sky':
                index < typedText.length && typedText.toLowerCase()[index] === char,
              'text-red-500': index < typedText.length && typedText.toLowerCase()[index] !== char,
              'bg-accent-coral text-bg-deep px-0.5': index === typedText.length,
              'text-text-secondary': index > typedText.length,
            }"
            >{{ char }}</span
          >
        </div>
        <div class="text-text-dim text-xs mb-2 font-display tracking-wide">GÕ VÀO ĐÂY:</div>
        <textarea
          ref="inputRef"
          v-model="typedText"
          @input="handleInput"
          @focus="handleFocus"
          class="w-full bg-bg-deep border-2 border-accent-coral text-text-primary p-3 text-base sm:text-lg font-body focus:outline-none focus:border-accent-amber transition min-h-[120px] resize-none"
          placeholder="Nhấn vào đây và bắt đầu gõ..."
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          inputmode="text"
        ></textarea>
        <div class="text-text-dim text-xs mt-2 text-center">
          💡 Tip: Trên mobile, nhấn vào ô nhập để hiện bàn phím
        </div>
      </div>

      <div
        v-if="gameState === 'finished'"
        class="text-center space-y-4 animate-fade-up animate-delay-4"
      >
        <div class="bg-bg-surface border-2 border-accent-coral p-6 mb-4">
          <div class="text-accent-amber text-sm font-display tracking-widest mb-2">KẾT QUẢ</div>
          <div
            v-if="gameMode === 'race'"
            class="text-3xl font-display font-bold text-accent-coral mb-2"
          >
            {{ winner?.emoji }} {{ winner?.name }} Chiến Thắng!
          </div>
          <div v-else class="text-3xl font-display font-bold text-accent-coral mb-2">
            🎉 Hoàn Thành!
          </div>
          <div v-if="gameMode === 'race'" class="text-text-secondary text-lg mb-4">
            Bạn về hạng {{ playerRank }} / 5
          </div>
          <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div class="text-text-dim">Ký tự đúng</div>
              <div class="text-text-primary font-display font-semibold">
                {{ totalCorrectChars }}
              </div>
            </div>
            <div>
              <div class="text-text-dim">Tốc độ</div>
              <div class="text-text-primary font-display font-semibold">{{ wpm }} WPM</div>
            </div>
            <div>
              <div class="text-text-dim">Độ chính xác</div>
              <div class="text-text-primary font-display font-semibold">{{ accuracy }}%</div>
            </div>
          </div>
        </div>
        <button
          @click="resetGame"
          class="bg-accent-sky text-bg-deep font-display font-bold text-sm tracking-wide px-8 py-3 transition hover:bg-accent-amber"
        >
          CHƠI LẠI
        </button>
      </div>

      <div class="text-center mt-8 animate-fade-up animate-delay-5">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
