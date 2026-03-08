<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";

// Game state
const score = ref(0);
const bugsFixed = ref(0);
const bugsCreated = ref(0);
const isPlaying = ref(false);
const showFakeLoading = ref(false);
const loadingProgress = ref(0);
const showFailMessage = ref(false);
const failMessage = ref("");

// Bug position
const bugX = ref(50);
const bugY = ref(50);
const bugOpacity = ref(1);
const bugScale = ref(1);
const isJumping = ref(false);

// Cursor tracking
const cursorX = ref(0);
const cursorY = ref(0);

// VS Code simulation - LONG CODE for difficulty
const codeLines = ref<string[]>([
  'import { Bug, Developer, Coffee } from "./chaos";',
  'import { sleep } from "./utils";',
  "",
  "class BugFixer {",
  "  private bugs: Bug[] = [];",
  "  private sanity = 100;",
  "",
  "  constructor() {",
  "    this.bugs = this.loadBugs();",
  "  }",
  "",
  "  async fixBug(bug: Bug): Promise<boolean> {",
  '    console.log("Attempting to fix...");',
  "    await sleep(Infinity);",
  "    return this.createMoreBugs(bug);",
  "  }",
  "",
  "  private createMoreBugs(original: Bug): boolean {",
  "    const newBugs = [];",
  "    for (let i = 0; i < 1000; i++) {",
  "      newBugs.push(new Bug());",
  "    }",
  "    this.bugs.push(...newBugs);",
  "    return false; // Never fixed",
  "  }",
  "",
  "  private loadBugs(): Bug[] {",
  "    return Array.from({ length: 999 }, () => new Bug());",
  "  }",
  "",
  "  drinkCoffee(): void {",
  "    this.sanity = Math.max(0, this.sanity - 10);",
  "  }",
  "}",
  "",
  "const fixer = new BugFixer();",
  "fixer.drinkCoffee();",
  "",
  "// This code was written by a developer who is no longer here",
  "// They left behind only this comment and 157 bugs",
  "",
  "export default fixer;",
]);
const deletedLines = ref<number[]>([]);

// Gaslighting quotes
const gaslightQuotes = [
  "Code này copy trên StackOverflow đúng không?",
  "Máy tôi chạy bình thường mà?",
  "Junior mới vào làm à?",
  "Bug này là feature đấy bạn ơi!",
  "Lần trước chạy được mà...",
  "Bạn có chắc đã click đúng không?",
  "Đây là lỗi của browser thôi!",
  "Code clean lắm, không có bug đâu!",
  "Thằng dev trước viết thế mà!",
  "Tôi tưởng đã fix rồi?!",
  "Check lại Logic đi, có học căn bản không đấy?",
  "Chắc do ăn ở nên Bug nó mới nhảy...",
  "Lương nghìn đô mà fix con Bug này không xong?",
  "Đừng đập nữa, đập cũng có trúng đâu mà.",
  "Để tôi gọi Intern vào fix hộ cho nhé?",
  "Code như này mà cũng đòi qua vòng Review à?",
  "Thôi reset máy đi, hy vọng là nó hết.",
  "Nhìn bạn click mà tôi thấy tội cho con chuột.",
  "Bug này không khó, chỉ là bạn không đủ trình.",
  "Bạn có đang dùng đúng tay thuận không đấy?",
  "Clear Cache chưa? Hay là do... trình độ?",
  "Ủa, nãy giờ bạn đang thực sự cố gắng đấy à?",
  "Hay là chuyển sang làm Tester đi cho nhàn?",
  "Google không tính phí, sao không lên đó mà tìm?",
  "Code chạy bằng niềm tin à mà đòi fix?",
  "Mắt bạn có bị cận không? Nó nằm lù lù ra đó!",
  "Tắt máy đi ngủ đi, mai Bug nó tự hết (đùa đấy).",
  "Bạn mà fix được con này tôi đi bằng đầu!",
  "Càng fix càng hỏng, đúng là 'bàn tay vàng' trong làng tạo Bug.",
  "Bình tĩnh, hít thở sâu... rồi chấp nhận mình kém đi.",
];
// Fail message quotes - more roasting
const failQuotes = [
  "Chúc mừng! Bạn đã tạo thêm được một đống bug! 🎉",
  "Code của bạn đẹp lắm... đẹp như một đống hỗn độn!",
  "Feature mới của bạn đây - bug nè! 🐛",
  "Commit đi, PR đi, có bug thì người ta fix!",
  "Merge xong rồi, giờ thì enjoy cái bug của bạn nhé!",
  "Dev không có bug như pizza không có phô mai - không thể nào!",
  "Test ở đâu? Production chính là test environment!",
  "Code sạch sẽ như cuộc đời bạn vậy... à không, có bug đấy!",
  "Pull request: ❌, Bug report: ✅",
  "Fix một bug = Tạo hai bug mới. Toán học lừa đảo!",
];
const currentQuote = ref("");
const showQuote = ref(false);

// Audio
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
  }
};

const playEvilLaugh = () => {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();

  const now = audioCtx.currentTime;
  // Laughing pattern: ha-ha-ha
  const laughFreqs = [300, 280, 320, 260, 340];
  laughFreqs.forEach((freq, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.connect(gain);
    gain.connect(audioCtx!.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now + i * 0.15);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + i * 0.15 + 0.1);
    gain.gain.setValueAtTime(0.08, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.15);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.15);
  });
};

const playSuccessSound = () => {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(523, now);
  osc.frequency.setValueAtTime(659, now + 0.1);
  osc.frequency.setValueAtTime(784, now + 0.2);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.start(now);
  osc.stop(now + 0.3);
};

// Cursor tracking
const handleMouseMove = (e: MouseEvent) => {
  cursorX.value = e.clientX;
  cursorY.value = e.clientY;

  if (isPlaying.value && !showFakeLoading.value) {
    updateBugPosition();
  }
};

// Calculate bug escape - only jump when cursor is close
const updateBugPosition = () => {
  // If bug is currently jumping, don't jump again
  if (isJumping.value) return;

  // Get viewport dimensions
  const maxX = window.innerWidth - 80;
  const maxY = window.innerHeight - 80;

  // Calculate distance to cursor
  const dx = bugX.value - cursorX.value;
  const dy = bugY.value - cursorY.value;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // If cursor is extremely close (50px), trigger invisibility and teleport
  if (distance < 50) {
    triggerInvisibility();
    return;
  }

  // Only jump when cursor is close (within 150px) - 90% evasion rate
  if (distance < 150 && Math.random() > 0.1) {
    // Start jump cooldown
    isJumping.value = true;

    // Jump to completely random position
    bugX.value = Math.random() * maxX + 20;
    bugY.value = Math.random() * maxY + 20;

    // Cooldown - bug stays still for 100ms after jumping
    setTimeout(() => {
      isJumping.value = false;
    }, 400);
  }
  // If cursor is far (>150px) or 10% "lag" chance, bug stays still
};

// Invisibility skill - teleport to random position
const triggerInvisibility = () => {
  bugOpacity.value = 0;

  setTimeout(() => {
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;
    bugX.value = Math.random() * maxX + 20;
    bugY.value = Math.random() * maxY + 20;

    setTimeout(() => {
      bugOpacity.value = 1;
    }, 100);
  }, 200);
};

// Click handling
const handleClick = (e: MouseEvent) => {
  if (!isPlaying.value || showFakeLoading.value) return;

  initAudio();

  // Check if click hit the bug (within 40px radius)
  const dx = bugX.value + 40 - e.clientX;
  const dy = bugY.value + 40 - e.clientY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 40) {
    // Hit the bug!
    handleBugHit();
  } else {
    // Missed!
    handleMiss();
  }
};

const handleBugHit = () => {
  score.value++;
  bugsFixed.value++;
  playSuccessSound();

  // Trigger fake loading
  showFakeLoading.value = true;
  loadingProgress.value = 0;

  // Fake loading progress
  const loadingInterval = setInterval(() => {
    loadingProgress.value += Math.random() * 15;

    if (loadingProgress.value >= 99) {
      loadingProgress.value = 99;
      clearInterval(loadingInterval);

      // Show fail message after "completing"
      setTimeout(() => {
        showFailMessage.value = true;
        failMessage.value = failQuotes[Math.floor(Math.random() * failQuotes.length)] ?? "";
        bugsCreated.value += Math.floor(Math.random() * 50) + 100;

        // Delete a random line from the fake code
        const availableLines = codeLines.value
          .map((_, i) => i)
          .filter((i) => !deletedLines.value.includes(i) && codeLines.value[i]?.trim() !== "");
        if (availableLines.length > 0) {
          const lineToDelete = availableLines[Math.floor(Math.random() * availableLines.length)];
          if (lineToDelete !== undefined) {
            deletedLines.value.push(lineToDelete);
          }
        }

        playEvilLaugh();

        // Reset after showing message
        setTimeout(() => {
          showFakeLoading.value = false;
          showFailMessage.value = false;
          loadingProgress.value = 0;

          // Move bug to new position
          const maxX = window.innerWidth - 80;
          const maxY = window.innerHeight - 80;
          bugX.value = Math.random() * maxX + 20;
          bugY.value = Math.random() * maxY + 20;
        }, 2500);
      }, 500);
    }
  }, 100);
};

const handleMiss = () => {
  playEvilLaugh();

  // Show random gaslighting quote
  currentQuote.value = gaslightQuotes[Math.floor(Math.random() * gaslightQuotes.length)] ?? "";
  showQuote.value = true;

  setTimeout(() => {
    showQuote.value = false;
  }, 2000);
};

// Start game
const startGame = () => {
  initAudio();
  score.value = 0;
  bugsFixed.value = 0;
  bugsCreated.value = 0;
  deletedLines.value = [];
  codeLines.value = [
    'import { Bug, Developer, Coffee } from "./chaos";',
    'import { sleep } from "./utils";',
    "",
    "class BugFixer {",
    "  private bugs: Bug[] = [];",
    "  private sanity = 100;",
    "",
    "  constructor() {",
    "    this.bugs = this.loadBugs();",
    "  }",
    "",
    "  async fixBug(bug: Bug): Promise<boolean> {",
    '    console.log("Attempting to fix...");',
    "    await sleep(Infinity);",
    "    return this.createMoreBugs(bug);",
    "  }",
    "",
    "  private createMoreBugs(original: Bug): boolean {",
    "    const newBugs = [];",
    "    for (let i = 0; i < 1000; i++) {",
    "      newBugs.push(new Bug());",
    "    }",
    "    this.bugs.push(...newBugs);",
    "    return false; // Never fixed",
    "  }",
    "",
    "  private loadBugs(): Bug[] {",
    "    return Array.from({ length: 999 }, () => new Bug());",
    "  }",
    "",
    "  drinkCoffee(): void {",
    "    this.sanity = Math.max(0, this.sanity - 10);",
    "  }",
    "}",
    "",
    "const fixer = new BugFixer();",
    "fixer.drinkCoffee();",
    "",
    "// This code was written by a developer who is no longer here",
    "// They left behind only this comment and 157 bugs",
    "",
    "export default fixer;",
  ];
  isPlaying.value = true;

  // Initial bug position
  bugX.value = window.innerWidth / 2 - 40;
  bugY.value = window.innerHeight / 2 - 40;

  // Show initial quote
  currentQuote.value = gaslightQuotes[Math.floor(Math.random() * gaslightQuotes.length)] ?? "";
  showQuote.value = true;
  setTimeout(() => {
    showQuote.value = false;
  }, 3000);
};

// Computed
const bugStyle = computed(() => ({
  left: `${bugX.value}px`,
  top: `${bugY.value}px`,
  opacity: bugOpacity.value,
  transform: `scale(${bugScale.value})`,
  transition: "left 0.08s linear, top 0.08s linear, opacity 0.15s ease",
}));

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});
</script>

<template>
  <div
    class="min-h-screen bg-[#0d0d0d] text-[#d4d4d4] font-mono overflow-y-auto relative selection:bg-blue-500/30"
    @click="handleClick"
  >
    <div class="flex justify-center items-start p-4 md:p-10 min-h-full">
      <div
        class="relative bg-[#1e1e1e] shadow-[0_0_60px_rgba(88,166,255,0.15)] w-full max-w-3xl flex flex-col h-fit mb-20 border border-[#3c3c3c]"
      >
        <div
          class="h-9 sticky top-0 z-20 bg-[#252526] flex items-center px-4 gap-4 border-b border-[#3c3c3c] select-none"
        >
          <div class="flex gap-2">
            <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div class="flex-1 text-center text-xs text-[#858585]">fix_bug.ts — J2TEAM Editor</div>
        </div>

        <div class="flex py-4 relative select-none min-h-[400px]">
          <div
            class="w-10 flex-shrink-0 flex flex-col items-end pr-3 border-r border-[#2a2a2a] text-[#6e7681] text-xs leading-6"
          >
            <div v-for="(_, index) in codeLines" :key="index">{{ index + 1 }}</div>
          </div>

          <div class="flex-1 pl-4 overflow-x-auto leading-6 text-sm md:text-base">
            <div
              v-for="(line, index) in codeLines"
              :key="index"
              :class="[
                'whitespace-nowrap',
                deletedLines.includes(index) ? 'text-[#ff5f56] line-through opacity-50' : '',
              ]"
            >
              <span v-if="line.includes('import')" class="text-[#569cd6]">{{ line }}</span>
              <span v-else-if="line.includes('class')" class="text-[#4ec9b0]">{{ line }}</span>
              <span
                v-else-if="line.includes('private') || line.includes('public')"
                class="text-[#9cdcfe]"
                >{{ line }}</span
              >
              <span
                v-else-if="line.includes('const') || line.includes('let')"
                class="text-[#9cdcfe]"
                >{{ line }}</span
              >
              <span
                v-else-if="line.includes('function') || line.includes('async')"
                class="text-[#569cd6]"
                >{{ line }}</span
              >
              <span v-else-if="line.includes('return')" class="text-[#c586c0]">{{ line }}</span>
              <span v-else-if="line.includes('//')" class="text-[#6a9955] italic">{{ line }}</span>
              <span v-else-if="line.includes('for')" class="text-[#dcdcaa]">{{ line }}</span>
              <span v-else-if="line.includes('new')" class="text-[#4ec9b0]">{{ line }}</span>
              <span v-else>{{ line }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Overlay -->
    <div
      class="fixed top-12 right-4 z-30 bg-bg-surface/90 backdrop-blur-sm border border-border-default p-4"
    >
      <div class="space-y-1 text-sm">
        <p>
          Đã "fix": <span class="text-accent-amber font-bold">{{ bugsFixed }}</span>
        </p>
        <p>
          Bug mới: <span class="text-red-500 font-bold">{{ bugsCreated }}</span>
        </p>
        <p class="text-text-dim text-xs">Code xóa: {{ deletedLines.length }}</p>
      </div>
    </div>

    <!-- Gaslighting Quote -->
    <Transition name="quote">
      <div
        v-if="showQuote"
        class="fixed bottom-8 right-8 z-50 bg-bg-surface border border-accent-amber p-4 max-w-sm"
      >
        <p class="text-text-secondary italic text-sm">"{{ currentQuote }}"</p>
      </div>
    </Transition>

    <!-- The Bug -->
    <div
      v-if="isPlaying && !showFakeLoading"
      class="fixed w-20 h-20 flex items-center justify-center text-5xl cursor-crosshair z-40 select-none"
      :style="bugStyle"
    >
      🐛
      <div class="absolute -bottom-2 w-8 h-2 bg-black/50 blur-sm rounded-[50%]"></div>
    </div>

    <!-- Fake Loading Screen -->
    <Transition name="loading">
      <div
        v-if="showFakeLoading"
        class="fixed inset-0 z-50 bg-bg-deep/95 flex flex-col items-center justify-center"
      >
        <div class="text-6xl mb-8 animate-pulse">🐛</div>

        <!-- Progress Bar -->
        <div
          class="w-80 h-8 bg-bg-surface border border-border-default relative overflow-hidden shadow-[0_0_20px_rgba(255,107,74,0.3)]"
        >
          <div
            class="h-full bg-gradient-to-r from-accent-coral to-accent-amber transition-all duration-100"
            :style="{ width: `${loadingProgress}%` }"
          ></div>
          <div class="absolute inset-0 flex items-center justify-center text-sm font-mono">
            Fixing bug... {{ Math.floor(loadingProgress) }}%
          </div>
        </div>

        <!-- Fail Message -->
        <Transition name="fail">
          <div v-if="showFailMessage" class="mt-8 text-center">
            <p class="text-3xl font-display font-bold text-red-500 mb-2 animate-pulse">
              ✨ New {{ bugsCreated }} bugs created!
            </p>
            <p class="text-text-secondary">{{ failMessage }}</p>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Start Screen -->
    <div
      v-if="!isPlaying"
      class="fixed inset-0 z-50 bg-bg-deep/90 flex flex-col items-center justify-center"
    >
      <h1 class="font-display text-5xl font-bold text-accent-coral mb-4 animate-fade-up">
        Cũng là fix bug mà lạ lắm
      </h1>

      <p
        class="text-text-secondary text-lg text-center max-w-md mb-8 animate-fade-up animate-delay-2"
      >
        Thử thử đập con bug này xem nào!<br />
        <span class="text-accent-amber">Có vẻ dễ đấy...</span>
      </p>

      <div class="space-y-3 text-sm text-text-dim mb-8 animate-fade-up animate-delay-3">
        <p>🎯 <span class="text-text-secondary">Click để đập bug</span></p>
        <p>⚡ <span class="text-text-secondary">Nhanh lên, không có gì khó đâu!</span></p>
      </div>

      <button
        @click.stop="startGame"
        class="px-8 py-4 bg-accent-coral text-white font-display font-bold text-xl border-2 border-accent-coral hover:bg-transparent hover:text-accent-coral transition-all animate-fade-up animate-delay-4"
      >
        BẮT ĐẦU
      </button>

      <p class="mt-4 text-xs text-text-dim animate-fade-up animate-delay-5">
        Chơi đi, có gì đâu mà sợ 🐛
      </p>
    </div>

    <!-- Back to Home -->
    <router-link
      to="/"
      class="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 text-text-dim hover:text-text-primary text-sm font-bold transition-colors"
    >
      <span>←</span> Về trang chủ
    </router-link>
  </div>
</template>

<style scoped>
.quote-enter-active,
.quote-leave-active {
  transition: all 0.5s ease;
}
.quote-enter-from,
.quote-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.loading-enter-active,
.loading-leave-active {
  transition: all 0.3s ease;
}
.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}

.fail-enter-active {
  animation: fail-in 0.5s ease-out;
}
.fail-leave-active {
  transition: opacity 0.3s;
}
.fail-leave-to {
  opacity: 0;
}

@keyframes fail-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.line-through {
  text-decoration: line-through;
}

/* Custom scrollbar for code */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #1a1a1a;
}
::-webkit-scrollbar-thumb {
  background: #3c3c3c;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4c4c4c;
}
</style>
