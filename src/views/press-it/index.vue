<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { RouterLink } from "vue-router";
import { useAudio } from "./composables/useAudio";
import { useRhythmEngine } from "./composables/useRhythmEngine";
import { useGameMode } from "./composables/useGameMode";
import { GAME_CONFIG } from "./assets/beatmap";
import type { GamePhase, HitResult, GameMode, KeyButton, BeatChallenge } from "./types";

// ─── Composables ─────────────────────────────────────────
const audio = useAudio();
const rhythm = useRhythmEngine();
const gameMode = useGameMode();

// ─── i18n ────────────────────────────────────────────────
type Lang = "vi" | "en";
const lang = ref<Lang>("vi");

interface ModeInfo {
  label: string;
  emoji: string;
  desc: string;
  details: string[];
}

interface Locale {
  homeLink: string;
  tagline: string;
  pauseBtn: string;
  resumeBtn: string;
  shortcutPause: string;
  shortcutClick: string;
  selectModeLabel: string;
  customTitle: string;
  customMouse: string;
  customKeys: string;
  customMaxKeys: (n: number) => string;
  customHold: string;
  customMaxHold: (s: string) => string;
  bestScoreLabel: (n: number) => string;
  btnTutorial: string;
  btnStart: string;
  layoutTitle: string;
  leftHand: string;
  rightHand: string;
  lmbHint: string;
  ruleTitle: string;
  perfectLabel: string;
  perfectDesc: string;
  goodLabel: string;
  goodDesc: string;
  missLabel: string;
  missDesc: string;
  beatCount: (beats: number, bpm: number) => string;
  btnBackMode: string;
  countdownHintBasic: string;
  countdownHintCombo: string;
  holdIndicator: (s: string) => string;
  tapHintBasic: string;
  tapHintCombo: string;
  feedbackPerfect: string;
  feedbackGood: string;
  feedbackMiss: string;
  pauseTitle: string;
  pauseSubtitle: string;
  livesLabel: string;
  currentScoreLabel: string;
  beatProgress: string;
  btnGiveUp: string;
  btnContinue: string;
  shortcutContinue: string;
  shortcutMouse: string;
  victoryIcon: string;
  victoryTitle: string;
  victoryDesc: (n: number) => string;
  gameOverIcon: string;
  gameOverTitle: string;
  statsScore: string;
  statsBest: string;
  statsPerfect: string;
  statsGood: string;
  statsMiss: string;
  statsAccuracy: string;
  statsCombo: string;
  btnChangeMode: string;
  btnRetry: string;
  btnReplay: string;
  getRating: (acc: number) => string;
  modes: Record<GameMode, ModeInfo>;
}

const i18n: Record<Lang, Locale> = {
  vi: {
    homeLink: "← Về trang chủ",
    tagline: "Trust your guts. Choose your hell.",
    pauseBtn: "⏸ TẠM DỪNG",
    resumeBtn: "▶ TIẾP",
    shortcutPause: "dừng",
    shortcutClick: "click",
    selectModeLabel: "Chọn chế độ chơi",
    customTitle: "Tùy chỉnh",
    customMouse: "Bật chuột",
    customKeys: "Bật phím A/W/S/D",
    customMaxKeys: (n) => `Số phím tối đa: ${n}`,
    customHold: "Bật cơ chế giữ phím",
    customMaxHold: (s) => `Giữ tối đa: ${s}s`,
    bestScoreLabel: (n) => `Kỷ lục: ${n} điểm`,
    btnTutorial: "HƯỚNG DẪN",
    btnStart: "BẮT ĐẦU",
    layoutTitle: "Bố cục phím",
    leftHand: "Tay trái",
    rightHand: "Tay phải",
    lmbHint: "LMB / Space",
    ruleTitle: "Luật chơi",
    perfectLabel: "PERFECT",
    perfectDesc: "±350ms — Senior LGTM: +2 điểm",
    goodLabel: "GOOD",
    goodDesc: "±500ms — CI passed barely: +1 điểm",
    missLabel: "MISS",
    missDesc: "Lệch nhịp / sai nút — git blame trỏ về bạn ♥",
    beatCount: (beats, bpm) => `${beats} beats • ${bpm} BPM`,
    btnBackMode: "← CHỌN ĐỘ KHÓ",
    countdownHintBasic: "Tap khi từ xuất hiện đúng nhịp.\nTheo dõi rhythm bar phía dưới!",
    countdownHintCombo: "Nhấn đúng combo khi từ xuất hiện.\nXem phím yêu cầu ở dưới!",
    holdIndicator: (s) => `⏳ GIỮ ${s}s`,
    tapHintBasic: "— TAP NGAY KHI TỪ XUẤT HIỆN —",
    tapHintCombo: "— NHẤN ĐÚNG COMBO KHI TỪ XUẤT HIỆN —",
    feedbackPerfect: "LGTM! 🎯",
    feedbackGood: "CI PASSED 👍",
    feedbackMiss: "500 ERROR 💀",
    pauseTitle: "TẠM DỪNG",
    pauseSubtitle: "Nhấn P hoặc nút TIẾP để tiếp tục",
    livesLabel: "Mạng còn",
    currentScoreLabel: "Điểm hiện tại",
    beatProgress: "Beat",
    btnGiveUp: "BỎ CUỘC",
    btnContinue: "▶ TIẾP TỤC",
    shortcutContinue: "tiếp tục",
    shortcutMouse: "click chuột",
    victoryIcon: "🏆",
    victoryTitle: "10X DEV CONFIRMED",
    victoryDesc: (n) => `git push origin main: ${n} beats. Không một revert nào.`,
    gameOverIcon: "💀",
    gameOverTitle: "SEGMENTATION FAULT",
    statsScore: "Điểm",
    statsBest: "Kỷ lục",
    statsPerfect: "Perfect",
    statsGood: "Good",
    statsMiss: "Miss",
    statsAccuracy: "Accuracy",
    statsCombo: "Longest Combo",
    btnChangeMode: "ĐỔI MODE",
    btnRetry: "THỬ LẠI",
    btnReplay: "CHƠI LẠI",
    getRating: (acc) => {
      if (acc >= 95) return "S rank — SENIOR DEVGOD. Đòi tăng lương đi. 🏆";
      if (acc >= 85) return "A rank — FLOW STATE ĐẠT. PR được merge không comment. 🔥";
      if (acc >= 70) return "B rank — CI PASSED WITH WARNINGS. Cần thêm unit test. 👍";
      if (acc >= 50) return "C rank — NEEDS REVIEW. Code review còn nhiều TODO. 😐";
      return "D rank — 0 STARS, WOULD NOT FORK. Nghỉ ngơi đi rồi code lại. 💀";
    },
    modes: {
      basic: {
        label: "BASIC",
        emoji: "🖱️",
        desc: "Chỉ chuột. Như debug production bằng console.log",
        details: [
          "Nhấp chuột (hoặc chạm) theo đúng nhịp",
          "PERFECT ±350ms — Senior nói LGTM: +2 điểm",
          "GOOD ±500ms — Intern approve qua loa: +1 điểm",
          "MISS — git blame trỏ thẳng về bạn ♥",
        ],
      },
      medium: {
        label: "MEDIUM",
        emoji: "⌨️",
        desc: "1 phím + chuột. Đủ để tạo 1 merge conflict",
        details: [
          "Mỗi beat: 1 trong 4 phím A/W/S/D + chuột",
          "Nhấn đủ combo trong window ±500ms là được",
          "Bấm sai phím = push nhầm thẳng lên branch main",
          "Tốc độ phản xạ như trả lời câu hỏi standup",
        ],
      },
      hard: {
        label: "HARD",
        emoji: "🔥",
        desc: "1-2 phím ± chuột. Resolve conflict giữa buổi demo",
        details: [
          "Mỗi beat: 1-2 phím A/W/S/D, chuột có hoặc không",
          "Phải nhấn đúng và đủ combo hiển thị",
          "Nhấn thừa/thiếu = deploy thiếu env var lên prod",
          "Đọc combo nhanh như đọc stack trace lúc 3h sáng",
        ],
      },
      asian: {
        label: "ASIAN",
        emoji: "🀄",
        desc: "2-3 phím + giữ. Người dùng là tester",
        details: [
          "Mỗi beat: 2-3 phím A/W/S/D, có thể có chuột",
          "Một số beat yêu cầu GIỮ phím (biểu tượng ⏳)",
          "Thả sớm = tech debt; giữ đủ = refactor hoàn hảo",
          "Nếu thấy dễ, có thể bạn đang dùng AI để cheat",
        ],
      },
      customized: {
        label: "CUSTOM",
        emoji: "⚙️",
        desc: "Tự config như setup .vimrc của senior",
        details: [
          "Bật/tắt cơ chế chuột (feature ai cũng muốn toggle)",
          "Bật/tắt phím A/W/S/D, chọn số phím tối đa",
          "Bật/tắt giữ phím và thời gian giữ tối đa",
          "Bấm sai vẫn mất mạng — không có hotpatch ở đây",
        ],
      },
    },
  },

  en: {
    homeLink: "← Back home",
    tagline: "Trust your guts. Ship the beat or get paged at 3am.",
    pauseBtn: "⏸ PAUSE",
    resumeBtn: "▶ RESUME",
    shortcutPause: "pause",
    shortcutClick: "click",
    selectModeLabel: "Select difficulty",
    customTitle: "Custom config",
    customMouse: "Enable mouse",
    customKeys: "Enable A/W/S/D keys",
    customMaxKeys: (n) => `Max keys: ${n}`,
    customHold: "Enable hold mechanic",
    customMaxHold: (s) => `Max hold: ${s}s`,
    bestScoreLabel: (n) => `Personal best: ${n} pts`,
    btnTutorial: "HOW TO PLAY",
    btnStart: "START",
    layoutTitle: "Key layout",
    leftHand: "Left hand",
    rightHand: "Right hand",
    lmbHint: "LMB / Space",
    ruleTitle: "Rules",
    perfectLabel: "PERFECT",
    perfectDesc: "±350ms — Senior LGTM: +2 pts",
    goodLabel: "GOOD",
    goodDesc: "±500ms — CI barely passed: +1 pt",
    missLabel: "MISS",
    missDesc: "Off-beat / wrong key — git blame is you ♥",
    beatCount: (beats, bpm) => `${beats} beats • ${bpm} BPM`,
    btnBackMode: "← CHANGE MODE",
    countdownHintBasic: "Tap on the beat.\nWatch the rhythm bar below!",
    countdownHintCombo: "Hit the correct combo on the beat.\nCheck the key display below!",
    holdIndicator: (s) => `⏳ HOLD ${s}s`,
    tapHintBasic: "— TAP ON THE BEAT —",
    tapHintCombo: "— HIT THE CORRECT COMBO —",
    feedbackPerfect: "LGTM! 🎯",
    feedbackGood: "CI PASSED 👍",
    feedbackMiss: "500 ERROR 💀",
    pauseTitle: "PAUSED",
    pauseSubtitle: "Press P or click RESUME to continue",
    livesLabel: "Lives left",
    currentScoreLabel: "Current score",
    beatProgress: "Beat",
    btnGiveUp: "GIVE UP",
    btnContinue: "▶ RESUME",
    shortcutContinue: "resume",
    shortcutMouse: "click",
    victoryIcon: "🏆",
    victoryTitle: "10X DEV CONFIRMED",
    victoryDesc: (n) => `git push origin main: ${n} beats. Zero reverts.`,
    gameOverIcon: "💀",
    gameOverTitle: "SEGMENTATION FAULT",
    statsScore: "Score",
    statsBest: "Best",
    statsPerfect: "Perfect",
    statsGood: "Good",
    statsMiss: "Miss",
    statsAccuracy: "Accuracy",
    statsCombo: "Longest Combo",
    btnChangeMode: "CHANGE MODE",
    btnRetry: "RETRY",
    btnReplay: "REPLAY",
    getRating: (acc) => {
      if (acc >= 95) return "S rank — DEVGOD. Time to ask for that raise. 🏆";
      if (acc >= 85) return "A rank — IN THE ZONE. PR merged, zero comments. 🔥";
      if (acc >= 70) return "B rank — LGTM WITH NITS. Needs more unit tests. 👍";
      if (acc >= 50) return "C rank — NEEDS REVIEW. Several TODO comments remain. 😐";
      return "D rank — 0 STARS, WOULD NOT FORK. Touch grass first. 💀";
    },
    modes: {
      basic: {
        label: "BASIC",
        emoji: "🖱️",
        desc: "Just click. Like debug production with console.log",
        details: [
          "Click (or tap) on every beat",
          "PERFECT ±350ms — LGTM approved: +2 pts",
          "GOOD ±500ms — Intern barely approved: +1 pt",
          "MISS — git blame points directly at you ♥",
        ],
      },
      medium: {
        label: "MEDIUM",
        emoji: "⌨️",
        desc: "1 key + click. Like a 2-commit PR with conflicts",
        details: [
          "Each beat: 1 of A/W/S/D + mouse click",
          "Hit the full combo within ±500ms window",
          "Wrong key = accidentally pushed to main",
          "Reaction speed required: standup-answer velocity",
        ],
      },
      hard: {
        label: "HARD",
        emoji: "🔥",
        desc: "1-2 keys ± click. Resolving conflicts mid-demo",
        details: [
          "Each beat: 1-2 keys, mouse optional",
          "Hit the exact displayed combo",
          "Wrong/missing input = missing env var on prod",
          "Read combos as fast as you read stack traces at 3am",
        ],
      },
      asian: {
        label: "ASIAN",
        emoji: "🀄",
        desc: "2-3 keys + hold. Your users, our testers",
        details: [
          "Each beat: 2-3 keys, sometimes with mouse",
          "Some beats require HOLDING (⏳)",
          "Early release = tech debt; full hold = clean refactor",
          "If this feels easy, you might be using AI to cheat",
        ],
      },
      customized: {
        label: "CUSTOM",
        emoji: "⚙️",
        desc: "Configure it yourself. Like setting up .vimrc.",
        details: [
          "Toggle mouse input (the feature everyone wants to disable)",
          "Toggle A/W/S/D keys, set max simultaneous keys",
          "Toggle hold mechanic and max hold duration",
          "Wrong inputs still cost lives — no hotpatch available",
        ],
      },
    },
  },
};

const t = computed(() => i18n[lang.value]);

// ─── Game State ──────────────────────────────────────────
const phase = ref<GamePhase>("idle");
const lives = ref(3);
const countdownNum = ref(3);
const isVictory = ref(false);

// Hit feedback
const hitFeedback = ref<HitResult | null>(null);
const showFeedback = ref(false);

// Stats
const perfectHits = ref(0);
const goodHits = ref(0);
const missCount = ref(0);
const bestScore = ref(0);

// Per-beat input tracking (accumulates presses, resets on new beat)
const currentBeatKeys = ref<Set<KeyButton>>(new Set());
const currentBeatMouse = ref(false);
const currentBeatSolved = ref(false);

// Hold mechanic state
const isHolding = ref(false);
const holdStartTime = ref(0);
const holdRequired = ref(0);
const holdChallenge = ref<BeatChallenge | null>(null);

// Combo tracking
const currentCombo = ref(0);
const longestCombo = ref(0);

// ─── Computed ─────────────────────────────────────────────
const score = computed(() => perfectHits.value * 2 + goodHits.value);
const accuracy = computed(() => {
  const total = perfectHits.value + goodHits.value + missCount.value;
  if (total === 0) return 100;
  return Math.round(((perfectHits.value * 2 + goodHits.value) / (total * 2)) * 100);
});
const progressPct = computed(() =>
  Math.round((rhythm.currentBeatIndex.value / GAME_CONFIG.totalBeats) * 100),
);

const currentChallenge = computed<BeatChallenge | null>(() =>
  gameMode.getChallengeAt(rhythm.currentBeatIndex.value),
);

// ─── Animation Frame ─────────────────────────────────────
let rafId = 0;

function gameLoop() {
  if (phase.value !== "playing") return;
  const audioEl = audio.getMusicElement();
  if (audioEl) rhythm.update(audioEl.currentTime);
  if (rhythm.isComplete.value) {
    endGame(true);
    return;
  }
  rafId = requestAnimationFrame(gameLoop);
}

// Reset per-beat state when beat advances
watch(
  () => rhythm.currentBeatIndex.value,
  () => {
    currentBeatKeys.value = new Set();
    currentBeatMouse.value = false;
    currentBeatSolved.value = false;
  },
);

// ─── Auto-miss callback ───────────────────────────────────
function handleAutoMiss() {
  if (isHolding.value) return;
  if (currentBeatSolved.value) return;
  missCount.value++;
  currentCombo.value = 0;
  audio.playFail();
  lives.value--;
  currentBeatSolved.value = true;
  if (lives.value <= 0) {
    endGame(false);
    return;
  }
  showHitFeedback("miss");
}

// ─── Game Flow ────────────────────────────────────────────
async function startGame() {
  if (phase.value !== "idle" && phase.value !== "dead") return;
  audio.init();
  lives.value = 3;
  perfectHits.value = 0;
  goodHits.value = 0;
  missCount.value = 0;
  hitFeedback.value = null;
  showFeedback.value = false;
  isVictory.value = false;
  isHolding.value = false;
  currentBeatKeys.value = new Set();
  currentBeatMouse.value = false;
  currentBeatSolved.value = false;
  currentCombo.value = 0;
  longestCombo.value = 0;
  rhythm.reset();
  gameMode.generateChallenges();

  phase.value = "countdown";
  for (let i = 3; i >= 1; i--) {
    if (phase.value !== "countdown") return;
    countdownNum.value = i;
    audio.playTick();
    await sleep(700);
  }

  phase.value = "playing";
  audio.startMusic();
  rhythm.start();
  rhythm.setAutoMissCallback(handleAutoMiss);
  rafId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (phase.value === "playing") {
    phase.value = "paused";
    cancelAnimationFrame(rafId);
    audio.pauseMusic();
    rhythm.stop();
  } else if (phase.value === "paused") {
    phase.value = "playing";
    audio.resumeMusic();
    rhythm.resume();
    rhythm.setAutoMissCallback(handleAutoMiss);
    rafId = requestAnimationFrame(gameLoop);
  }
}

function showHitFeedback(result: HitResult) {
  hitFeedback.value = result;
  showFeedback.value = true;
  setTimeout(() => {
    showFeedback.value = false;
  }, 400);
}

function endGame(victory: boolean) {
  isVictory.value = victory;
  phase.value = "dead";
  cancelAnimationFrame(rafId);
  rhythm.stop();
  audio.stopMusic();
  isHolding.value = false;
  currentBeatKeys.value = new Set();
  currentBeatMouse.value = false;
  currentBeatSolved.value = false;
  const s = score.value;
  if (s > bestScore.value) {
    bestScore.value = s;
    localStorage.setItem("press-it-best", s.toString());
  }
}

// ─── Input handling ───────────────────────────────────────
function isInBeatWindow(): boolean {
  const audioEl = audio.getMusicElement();
  if (!audioEl || !rhythm.currentBeat.value) return false;
  const delta = Math.abs(audioEl.currentTime - rhythm.currentBeat.value.time);
  return delta <= GAME_CONFIG.goodWindow;
}

function getAudioTime(): number {
  return audio.getMusicElement()?.currentTime ?? 0;
}

function recordHit(result: "perfect" | "good") {
  currentCombo.value++;
  if (currentCombo.value > longestCombo.value) longestCombo.value = currentCombo.value;
  if (result === "perfect") {
    perfectHits.value++;
    audio.playDoubleJump();
    showHitFeedback("perfect");
  } else {
    goodHits.value++;
    audio.playJump();
    showHitFeedback("good");
  }
}

function tryEvaluateCombo() {
  const challenge = currentChallenge.value;
  if (!challenge || phase.value !== "playing" || currentBeatSolved.value) return;

  const allKeysDown = challenge.keys.every((k) => currentBeatKeys.value.has(k));
  const mouseOk = !challenge.mouse || currentBeatMouse.value;

  if (allKeysDown && mouseOk) {
    const tapTime = getAudioTime();
    const result = rhythm.evaluateTap(tapTime);

    if (result === "miss") {
      currentBeatSolved.value = true;
      missCount.value++;
      currentCombo.value = 0;
      audio.playFail();
      lives.value--;
      if (lives.value <= 0) {
        endGame(false);
        return;
      }
      showHitFeedback("miss");
      return;
    }

    currentBeatSolved.value = true;
    if (challenge.holdDuration > 0) {
      isHolding.value = true;
      holdStartTime.value = performance.now() / 1000;
      holdRequired.value = challenge.holdDuration;
      holdChallenge.value = challenge;
    } else {
      recordHit(result);
      rhythm.advanceBeat();
    }
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.repeat) return;

  if (e.key.toLowerCase() === "p" && (phase.value === "playing" || phase.value === "paused")) {
    e.preventDefault();
    togglePause();
    return;
  }

  if (e.code === "Space" && phase.value === "playing") {
    e.preventDefault();
    handleMouseInput();
    return;
  }

  if (phase.value !== "playing") return;

  const keyMap: Record<string, KeyButton> = {
    a: "A",
    w: "W",
    s: "S",
    d: "D",
    A: "A",
    W: "W",
    S: "S",
    D: "D",
  };
  const key = keyMap[e.key];
  if (!key) return;

  e.preventDefault();

  const challenge = currentChallenge.value;
  if (!challenge) return;

  if (!challenge.keys.includes(key)) {
    if (isInBeatWindow() && !currentBeatSolved.value) {
      currentBeatSolved.value = true;
      missCount.value++;
      currentCombo.value = 0;
      audio.playFail();
      lives.value--;
      if (lives.value <= 0) {
        endGame(false);
        return;
      }
      showHitFeedback("miss");
    }
    return;
  }

  currentBeatKeys.value = new Set([...currentBeatKeys.value, key]);
  tryEvaluateCombo();
}

function handleKeyUp(e: KeyboardEvent) {
  const keyMap: Record<string, KeyButton> = {
    a: "A",
    w: "W",
    s: "S",
    d: "D",
    A: "A",
    W: "W",
    S: "S",
    D: "D",
  };
  const key = keyMap[e.key];
  if (!key) return;
  if (isHolding.value) resolveHold();
}

function handleMouseInput() {
  if (phase.value !== "playing") return;

  const challenge = currentChallenge.value;
  if (!challenge) return;

  if (gameMode.selectedMode.value === "basic") {
    if (currentBeatSolved.value) return;
    currentBeatSolved.value = true;
    const tapTime = getAudioTime();
    const result = rhythm.evaluateTap(tapTime);
    if (result === "perfect" || result === "good") {
      recordHit(result);
    } else {
      missCount.value++;
      currentCombo.value = 0;
      audio.playFail();
      lives.value--;
      if (lives.value <= 0) {
        endGame(false);
        return;
      }
      showHitFeedback("miss");
    }
    rhythm.advanceBeat();
    return;
  }

  if (!challenge.mouse) {
    if (isInBeatWindow() && !currentBeatSolved.value) {
      currentBeatSolved.value = true;
      missCount.value++;
      currentCombo.value = 0;
      audio.playFail();
      lives.value--;
      if (lives.value <= 0) {
        endGame(false);
        return;
      }
      showHitFeedback("miss");
    }
    return;
  }

  currentBeatMouse.value = true;
  tryEvaluateCombo();
}

function handleMouseUp() {
  if (isHolding.value) resolveHold();
}

function resolveHold() {
  if (!isHolding.value) return;
  const held = performance.now() / 1000 - holdStartTime.value;
  isHolding.value = false;
  holdChallenge.value = null;
  recordHit(held >= holdRequired.value ? "perfect" : "good");
  rhythm.advanceBeat();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

onMounted(() => {
  const saved = localStorage.getItem("press-it-best");
  if (saved) bestScore.value = parseInt(saved, 10);
  const savedLang = localStorage.getItem("press-it-lang");
  if (savedLang === "vi" || savedLang === "en") lang.value = savedLang;
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  audio.destroy();
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});

function toggleLang() {
  lang.value = lang.value === "vi" ? "en" : "vi";
  localStorage.setItem("press-it-lang", lang.value);
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary flex flex-col font-body select-none overflow-hidden"
  >
    <!-- Header -->
    <header
      class="flex items-center justify-between px-4 py-3 border-b border-border-subtle z-10 shrink-0"
    >
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @pointerdown.stop
      >
        {{ t.homeLink }}
      </RouterLink>
      <h1 class="font-display text-base"><span class="text-accent-coral">//</span> PRESS IT</h1>
      <div class="flex items-center gap-2">
        <!-- Keyboard shortcuts hint (only during playing/paused) -->
        <div
          v-if="phase === 'playing' || phase === 'paused'"
          class="hidden sm:flex items-center gap-2 text-[10px] text-text-tertiary font-mono"
        >
          <span class="border border-border-subtle px-1">P</span> {{ t.shortcutPause }}
          <span class="border border-border-subtle px-1">Space</span> {{ t.shortcutClick }}
        </div>
        <!-- Pause button -->
        <button
          v-if="phase === 'playing' || phase === 'paused'"
          class="border border-border-subtle bg-bg-surface px-3 py-1.5 text-xs text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
          @click.stop="togglePause"
          @pointerdown.stop
        >
          {{ phase === "paused" ? t.resumeBtn : t.pauseBtn }}
        </button>
        <!-- Lang toggle -->
        <button
          class="border border-border-subtle bg-bg-surface px-2 py-1.5 text-[10px] font-mono text-text-tertiary transition hover:border-accent-coral hover:text-text-primary"
          @click="toggleLang"
          @pointerdown.stop
        >
          {{ lang === "vi" ? "EN" : "VI" }}
        </button>
        <button
          class="text-text-secondary hover:text-text-primary transition-colors text-lg px-1"
          @pointerdown.stop
          @click="audio.toggleMute()"
        >
          {{ audio.isMuted.value ? "🔇" : "🔊" }}
        </button>
      </div>
    </header>

    <!-- ── IDLE / MODE SELECT SCREEN ────────────────────── -->
    <div
      v-if="phase === 'idle'"
      class="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6 animate-fade-up overflow-y-auto"
    >
      <div class="text-center space-y-1">
        <div class="text-5xl mb-2">🎵</div>
        <h2 class="font-display text-3xl sm:text-4xl">
          <span class="text-accent-coral">//</span> PRESS IT
        </h2>
        <p class="text-text-tertiary text-xs">{{ t.tagline }}</p>
      </div>

      <!-- Mode selector -->
      <div class="w-full max-w-sm space-y-2">
        <p class="text-text-tertiary text-[10px] uppercase tracking-widest text-center mb-3">
          {{ t.selectModeLabel }}
        </p>
        <button
          v-for="(info, mode) in t.modes"
          :key="mode"
          class="w-full flex items-center gap-3 p-3 border transition-all text-left"
          :class="
            gameMode.selectedMode.value === mode
              ? 'border-accent-coral bg-accent-coral/10 text-text-primary'
              : 'border-border-subtle bg-bg-surface text-text-secondary hover:border-border-medium hover:text-text-primary'
          "
          @click="gameMode.selectedMode.value = mode as GameMode"
        >
          <span class="text-xl w-7 text-center shrink-0">{{ info.emoji }}</span>
          <div class="flex-1 min-w-0">
            <span class="font-display text-sm block">{{ info.label }}</span>
            <span class="text-xs text-text-tertiary block truncate">{{ info.desc }}</span>
          </div>
          <span
            v-if="gameMode.selectedMode.value === mode"
            class="text-accent-coral text-xs shrink-0"
            >✓</span
          >
        </button>
      </div>

      <!-- Custom config -->
      <div
        v-if="gameMode.selectedMode.value === 'customized'"
        class="w-full max-w-sm bg-bg-surface border border-border-subtle p-4 space-y-3"
      >
        <p class="text-text-tertiary text-[10px] uppercase tracking-widest">{{ t.customTitle }}</p>
        <label class="flex items-center justify-between gap-2 text-sm">
          <span>{{ t.customMouse }}</span>
          <input
            type="checkbox"
            v-model="gameMode.customConfig.value.useMouse"
            class="accent-[#ff6b6b]"
          />
        </label>
        <label class="flex items-center justify-between gap-2 text-sm">
          <span>{{ t.customKeys }}</span>
          <input
            type="checkbox"
            v-model="gameMode.customConfig.value.useKeys"
            class="accent-[#ff6b6b]"
          />
        </label>
        <label
          v-if="gameMode.customConfig.value.useKeys"
          class="flex items-center justify-between gap-2 text-sm"
        >
          <span>{{ t.customMaxKeys(gameMode.customConfig.value.maxKeys) }}</span>
          <input
            type="range"
            min="1"
            max="4"
            v-model.number="gameMode.customConfig.value.maxKeys"
            class="w-24 accent-[#ff6b6b]"
          />
        </label>
        <label class="flex items-center justify-between gap-2 text-sm">
          <span>{{ t.customHold }}</span>
          <input
            type="checkbox"
            v-model="gameMode.customConfig.value.useHold"
            class="accent-[#ff6b6b]"
          />
        </label>
        <label
          v-if="gameMode.customConfig.value.useHold"
          class="flex items-center justify-between gap-2 text-sm"
        >
          <span>{{ t.customMaxHold(gameMode.customConfig.value.maxHoldTime.toFixed(1)) }}</span>
          <input
            type="range"
            min="0.3"
            max="2.5"
            step="0.1"
            v-model.number="gameMode.customConfig.value.maxHoldTime"
            class="w-24 accent-[#ff6b6b]"
          />
        </label>
      </div>

      <div v-if="bestScore > 0" class="text-text-tertiary text-xs text-center">
        <span class="text-accent-amber font-bold">{{ t.bestScoreLabel(bestScore) }}</span>
      </div>

      <div class="w-full max-w-sm flex gap-2">
        <button
          class="flex-1 py-3 border border-border-subtle bg-bg-surface text-text-secondary font-display text-sm hover:border-accent-coral hover:text-text-primary transition-colors"
          @click="phase = 'tutorial'"
        >
          {{ t.btnTutorial }}
        </button>
        <button
          class="flex-1 py-4 bg-accent-coral text-bg-deep font-display text-lg hover:bg-accent-amber transition-colors active:scale-95"
          @click="startGame"
        >
          {{ t.btnStart }}
        </button>
      </div>
    </div>

    <!-- ── TUTORIAL SCREEN ───────────────────────────────── -->
    <div
      v-else-if="phase === 'tutorial'"
      class="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-6 animate-fade-up overflow-y-auto"
    >
      <div class="text-center">
        <div class="text-4xl mb-1">{{ t.modes[gameMode.selectedMode.value].emoji }}</div>
        <h2 class="font-display text-2xl sm:text-3xl">
          <span class="text-accent-coral">//</span>
          {{ t.modes[gameMode.selectedMode.value].label }}
        </h2>
        <p class="text-text-tertiary text-sm mt-1">
          {{ t.modes[gameMode.selectedMode.value].desc }}
        </p>
      </div>

      <!-- Mode details -->
      <div class="w-full max-w-sm bg-bg-surface border border-border-subtle p-4 space-y-2">
        <p class="text-text-tertiary text-[10px] uppercase tracking-widest mb-3">
          {{ t.ruleTitle }}
        </p>
        <div
          v-for="(detail, i) in t.modes[gameMode.selectedMode.value].details"
          :key="i"
          class="flex items-start gap-2 text-sm text-text-secondary"
        >
          <span class="text-accent-coral shrink-0 font-display text-xs mt-0.5">{{
            String(i + 1).padStart(2, "0")
          }}</span>
          <span>{{ detail }}</span>
        </div>
      </div>

      <!-- Key layout preview -->
      <div v-if="gameMode.selectedMode.value !== 'basic'" class="w-full max-w-sm">
        <p class="text-text-tertiary text-[10px] uppercase tracking-widest mb-3 text-center">
          {{ t.layoutTitle }}
        </p>
        <div class="flex items-center justify-center gap-6">
          <div class="space-y-1 text-center">
            <p class="text-text-tertiary text-[10px]">{{ t.leftHand }}</p>
            <div class="flex gap-1 justify-center">
              <div
                class="w-9 h-9 border border-border-medium bg-bg-elevated flex items-center justify-center font-mono text-sm font-bold text-text-secondary"
              >
                W
              </div>
            </div>
            <div class="flex gap-1">
              <div
                v-for="k in ['A', 'S', 'D']"
                :key="k"
                class="w-9 h-9 border border-border-medium bg-bg-elevated flex items-center justify-center font-mono text-sm font-bold text-text-secondary"
              >
                {{ k }}
              </div>
            </div>
          </div>
          <div class="text-text-tertiary text-2xl">+</div>
          <div class="space-y-1 text-center">
            <p class="text-text-tertiary text-[10px]">{{ t.rightHand }}</p>
            <div
              class="w-16 h-12 border border-border-medium bg-bg-elevated flex items-center justify-center text-2xl"
            >
              🖱️
            </div>
            <p class="text-text-tertiary text-[10px]">{{ t.lmbHint }}</p>
          </div>
        </div>
      </div>

      <!-- Timing info -->
      <div class="w-full max-w-sm space-y-1.5 text-xs text-text-tertiary">
        <div class="flex items-center gap-3 bg-bg-surface border border-border-subtle p-2.5">
          <span class="text-accent-coral font-display text-xs w-16 shrink-0">{{
            t.perfectLabel
          }}</span>
          <span>{{ t.perfectDesc }}</span>
        </div>
        <div class="flex items-center gap-3 bg-bg-surface border border-border-subtle p-2.5">
          <span class="text-accent-amber font-display text-xs w-16 shrink-0">{{
            t.goodLabel
          }}</span>
          <span>{{ t.goodDesc }}</span>
        </div>
        <div class="flex items-center gap-3 bg-bg-surface border border-border-subtle p-2.5">
          <span class="text-red-400 font-display text-xs w-16 shrink-0">{{ t.missLabel }}</span>
          <span>{{ t.missDesc }}</span>
        </div>
      </div>

      <p class="text-text-tertiary text-[10px] text-center">
        {{ t.beatCount(GAME_CONFIG.totalBeats, GAME_CONFIG.BPM) }}
      </p>

      <div class="w-full max-w-sm flex gap-2">
        <button
          class="flex-1 py-3 border border-border-subtle bg-bg-surface text-text-secondary font-display text-sm hover:border-accent-coral hover:text-text-primary transition-colors"
          @click="phase = 'idle'"
        >
          {{ t.btnBackMode }}
        </button>
        <button
          class="flex-1 py-4 bg-accent-coral text-bg-deep font-display text-lg hover:bg-accent-amber transition-colors active:scale-95"
          @click="startGame"
        >
          {{ t.btnStart }}
        </button>
      </div>
    </div>

    <!-- ── COUNTDOWN SCREEN ──────────────────────────────── -->
    <div
      v-else-if="phase === 'countdown'"
      class="flex-1 flex flex-col items-center justify-center gap-8 px-6"
    >
      <div
        class="font-display text-[120px] leading-none text-accent-coral drop-shadow-[0_0_40px_rgba(255,107,107,0.6)] animate-bounce"
      >
        {{ countdownNum }}
      </div>
      <p class="text-text-secondary text-center text-sm max-w-xs whitespace-pre-line">
        <template v-if="gameMode.selectedMode.value === 'basic'">{{
          t.countdownHintBasic
        }}</template>
        <template v-else>{{ t.countdownHintCombo }}</template>
      </p>
    </div>

    <!-- ── PLAYING SCREEN ────────────────────────────────── -->
    <div
      v-else-if="phase === 'playing'"
      class="flex-1 flex flex-col touch-none"
      @pointerdown.prevent="
        gameMode.selectedMode.value === 'basic' ? handleMouseInput() : undefined
      "
    >
      <!-- HUD -->
      <div
        class="flex items-center justify-between px-4 py-2 border-b border-border-subtle shrink-0"
      >
        <div class="flex gap-1 text-lg">
          <span
            v-for="n in 3"
            :key="n"
            :class="n <= lives ? 'opacity-100 text-accent-coral' : 'opacity-20'"
            >♥</span
          >
        </div>
        <div class="text-xs text-text-tertiary font-mono">
          {{ rhythm.currentBeatIndex.value + 1 }}/{{ GAME_CONFIG.totalBeats }}
        </div>
        <div class="flex gap-3 text-xs text-text-tertiary font-mono">
          <span v-if="currentCombo >= 2" class="text-accent-amber">🔥{{ currentCombo }}</span>
          <span>⚡{{ perfectHits }}</span>
          <span>✓{{ goodHits }}</span>
        </div>
      </div>

      <!-- Hit Feedback -->
      <div class="h-10 flex items-center justify-center shrink-0">
        <Transition name="feedback">
          <span
            v-if="showFeedback"
            key="fb"
            class="font-display text-2xl sm:text-3xl drop-shadow"
            :class="{
              'text-accent-coral': hitFeedback === 'perfect',
              'text-accent-amber': hitFeedback === 'good',
              'text-red-400': hitFeedback === 'miss',
            }"
          >
            <template v-if="hitFeedback === 'perfect'">{{ t.feedbackPerfect }}</template>
            <template v-else-if="hitFeedback === 'good'">{{ t.feedbackGood }}</template>
            <template v-else>{{ t.feedbackMiss }}</template>
          </span>
        </Transition>
      </div>

      <!-- Lyrics Display -->
      <div class="flex-1 flex flex-col items-center justify-center px-4 gap-4 min-h-0">
        <div v-if="rhythm.currentBeat.value" class="text-center space-y-1">
          <div
            class="font-display text-5xl sm:text-6xl text-accent-coral drop-shadow-[0_0_20px_rgba(255,107,107,0.5)] animate-pulse"
          >
            {{ rhythm.currentBeat.value.text }}
          </div>
          <div
            v-if="currentChallenge?.holdDuration && currentChallenge.holdDuration > 0"
            class="text-accent-amber text-xs font-mono"
          >
            {{ t.holdIndicator(currentChallenge.holdDuration.toFixed(1)) }}
          </div>
        </div>

        <div class="flex gap-3 text-text-tertiary flex-wrap justify-center">
          <span
            v-for="item in rhythm.visibleLyrics.value.slice(1, 4)"
            :key="item.id"
            class="opacity-60 text-xs"
          >
            {{ item.text }}
          </span>
        </div>
      </div>

      <!-- Key + Mouse Input Display (non-basic modes) -->
      <div
        v-if="gameMode.selectedMode.value !== 'basic'"
        class="px-4 py-3 border-t border-border-subtle shrink-0"
      >
        <div class="flex items-center justify-center gap-6 sm:gap-10">
          <!-- Left hand: AWSD -->
          <div class="space-y-1">
            <p class="text-text-tertiary text-[9px] uppercase tracking-widest text-center mb-1">
              {{ t.leftHand }}
            </p>
            <div class="flex justify-center">
              <div
                class="w-9 h-9 border flex items-center justify-center font-mono text-sm font-bold transition-all"
                :class="
                  currentChallenge?.keys.includes('W')
                    ? currentBeatKeys.has('W')
                      ? 'border-accent-coral bg-accent-coral text-bg-deep scale-95'
                      : 'border-accent-coral text-accent-coral bg-accent-coral/20 animate-pulse'
                    : 'border-border-subtle text-text-tertiary bg-bg-elevated opacity-40'
                "
              >
                W
              </div>
            </div>
            <div class="flex gap-1">
              <div
                v-for="key in ['A', 'S', 'D'] as KeyButton[]"
                :key="key"
                class="w-9 h-9 border flex items-center justify-center font-mono text-sm font-bold transition-all"
                :class="
                  currentChallenge?.keys.includes(key)
                    ? currentBeatKeys.has(key)
                      ? 'border-accent-coral bg-accent-coral text-bg-deep scale-95'
                      : 'border-accent-coral text-accent-coral bg-accent-coral/20 animate-pulse'
                    : 'border-border-subtle text-text-tertiary bg-bg-elevated opacity-40'
                "
              >
                {{ key }}
              </div>
            </div>
          </div>

          <!-- Right hand: Mouse -->
          <div class="space-y-1 text-center">
            <p class="text-text-tertiary text-[9px] uppercase tracking-widest mb-1">
              {{ t.rightHand }}
            </p>
            <button
              class="w-16 h-12 border flex items-center justify-center text-2xl transition-all"
              :class="
                currentChallenge?.mouse
                  ? currentBeatMouse
                    ? 'border-accent-coral bg-accent-coral scale-95'
                    : 'border-accent-coral bg-accent-coral/20 animate-pulse'
                  : 'border-border-subtle bg-bg-elevated opacity-40'
              "
              @pointerdown.stop.prevent="handleMouseInput"
              @pointerup.stop="handleMouseUp"
            >
              🖱️
            </button>
            <p class="text-text-tertiary text-[9px]">{{ t.lmbHint }}</p>
          </div>
        </div>
      </div>

      <!-- Rhythm Bar -->
      <div class="px-4 pb-4 space-y-2 border-t border-border-subtle pt-3 shrink-0">
        <div class="h-1 w-full bg-bg-elevated overflow-hidden">
          <div
            class="h-full bg-accent-coral/60 transition-all duration-100"
            :style="{ width: progressPct + '%' }"
          ></div>
        </div>
        <div
          class="relative w-full h-10 bg-bg-elevated border border-border-subtle overflow-hidden"
        >
          <div
            class="absolute inset-y-0 bg-accent-amber/10 border-x border-accent-amber/20"
            style="left: 0%; width: 50%"
          ></div>
          <div
            class="absolute inset-y-0 bg-accent-coral/20 border-x border-accent-coral/30"
            style="left: 0%; width: 35%"
          ></div>
          <div class="absolute inset-y-0 left-[17.5%] w-px bg-accent-coral"></div>
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-75"
            :style="{ left: rhythm.progress.value * 100 + '%' }"
          ></div>
        </div>
        <p class="text-center text-text-tertiary text-[10px] tracking-widest uppercase">
          <template v-if="gameMode.selectedMode.value === 'basic'">{{ t.tapHintBasic }}</template>
          <template v-else>{{ t.tapHintCombo }}</template>
        </p>
      </div>
    </div>

    <!-- ── PAUSED OVERLAY ─────────────────────────────────── -->
    <div
      v-else-if="phase === 'paused'"
      class="flex-1 flex flex-col items-center justify-center gap-6 px-6 animate-fade-up"
    >
      <div class="text-center space-y-2">
        <div class="text-5xl">⏸</div>
        <h2 class="font-display text-4xl text-text-primary">{{ t.pauseTitle }}</h2>
        <p class="text-text-tertiary text-sm">{{ t.pauseSubtitle }}</p>
      </div>

      <div class="w-full max-w-xs space-y-2 text-xs text-text-secondary">
        <div class="flex justify-between bg-bg-surface border border-border-subtle p-2.5">
          <span class="text-text-tertiary">{{ t.livesLabel }}</span>
          <span class="text-accent-coral">{{ lives }} ♥</span>
        </div>
        <div class="flex justify-between bg-bg-surface border border-border-subtle p-2.5">
          <span class="text-text-tertiary">{{ t.currentScoreLabel }}</span>
          <span class="text-accent-amber font-bold">{{ score }}</span>
        </div>
        <div class="flex justify-between bg-bg-surface border border-border-subtle p-2.5">
          <span class="text-text-tertiary">{{ t.beatProgress }}</span>
          <span>{{ rhythm.currentBeatIndex.value + 1 }}/{{ GAME_CONFIG.totalBeats }}</span>
        </div>
      </div>

      <div class="w-full max-w-xs flex gap-2">
        <button
          class="flex-1 py-3 border border-border-subtle bg-bg-surface text-text-secondary font-display text-sm hover:border-red-400 hover:text-red-400 transition-colors"
          @click="endGame(false)"
        >
          {{ t.btnGiveUp }}
        </button>
        <button
          class="flex-1 py-4 bg-accent-coral text-bg-deep font-display text-lg hover:bg-accent-amber transition-colors active:scale-95"
          @click="togglePause"
        >
          {{ t.btnContinue }}
        </button>
      </div>

      <div class="flex gap-4 text-[10px] text-text-tertiary font-mono">
        <span
          ><span class="border border-border-subtle px-1">P</span> {{ t.shortcutContinue }}</span
        >
        <span
          ><span class="border border-border-subtle px-1">Space</span> {{ t.shortcutMouse }}</span
        >
      </div>
    </div>

    <!-- ── GAME OVER / VICTORY SCREEN ───────────────────── -->
    <div
      v-else-if="phase === 'dead'"
      class="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8 animate-fade-up overflow-y-auto"
    >
      <div v-if="isVictory" class="text-center space-y-1">
        <div class="text-6xl mb-2">{{ t.victoryIcon }}</div>
        <p class="font-display text-3xl text-accent-amber">{{ t.victoryTitle }}</p>
        <p class="text-text-secondary text-sm">{{ t.victoryDesc(GAME_CONFIG.totalBeats) }}</p>
      </div>
      <div v-else class="text-center space-y-1">
        <div class="text-5xl mb-2">{{ t.gameOverIcon }}</div>
        <p class="font-display text-3xl text-red-400">{{ t.gameOverTitle }}</p>
        <p class="text-text-secondary text-sm">{{ t.getRating(accuracy) }}</p>
      </div>

      <!-- Stats -->
      <div class="w-full max-w-xs grid grid-cols-2 gap-2">
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">
            {{ t.statsScore }}
          </p>
          <p class="font-display text-3xl text-accent-coral">{{ score }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">
            {{ t.statsBest }}
          </p>
          <p class="font-display text-3xl text-accent-amber">{{ bestScore }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">
            {{ t.statsPerfect }}
          </p>
          <p class="font-display text-2xl text-accent-coral">{{ perfectHits }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">
            {{ t.statsGood }}
          </p>
          <p class="font-display text-2xl text-accent-amber">{{ goodHits }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">
            {{ t.statsMiss }}
          </p>
          <p class="font-display text-2xl text-red-400">{{ missCount }}</p>
        </div>
        <div class="bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">
            {{ t.statsAccuracy }}
          </p>
          <p class="font-display text-2xl text-accent-sky">{{ accuracy }}%</p>
        </div>
        <div class="col-span-2 bg-bg-surface border border-border-subtle p-3 text-center">
          <p class="text-text-tertiary text-[10px] uppercase tracking-wider mb-0.5">
            {{ t.statsCombo }}
          </p>
          <p class="font-display text-2xl text-accent-amber">🔥 {{ longestCombo }}</p>
        </div>
      </div>

      <div class="w-full max-w-xs flex gap-2">
        <button
          class="flex-1 py-3 border border-border-subtle bg-bg-surface text-text-secondary font-display text-sm hover:border-accent-coral hover:text-text-primary transition-colors"
          @click="phase = 'idle'"
        >
          {{ t.btnChangeMode }}
        </button>
        <button
          class="flex-1 py-4 bg-accent-coral text-bg-deep font-display text-lg hover:bg-accent-amber transition-colors active:scale-95"
          @click="startGame"
        >
          {{ isVictory ? t.btnReplay : t.btnRetry }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-enter-active {
  animation: feedback-pop 0.2s ease-out;
}
.feedback-leave-active {
  transition: opacity 0.2s ease-in;
}
.feedback-leave-to {
  opacity: 0;
}

@keyframes feedback-pop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
