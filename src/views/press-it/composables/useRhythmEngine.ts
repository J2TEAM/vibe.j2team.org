import { ref, computed } from "vue";
import { beatMap, GAME_CONFIG, type BeatMapItem } from "../assets/beatmap";

export function useRhythmEngine() {
  const startTime = ref(0);
  const currentTime = ref(0);
  const isPlaying = ref(false);
  const currentBeatIndex = ref(0);
  const hasAutoMissed = ref(false);

  // Callback để game gọi khi auto-miss
  let onAutoMissCallback: (() => void) | null = null;

  const currentBeat = computed<BeatMapItem | null>(() => {
    return beatMap[currentBeatIndex.value] ?? null;
  });

  const nextBeat = computed<BeatMapItem | null>(() => {
    return beatMap[currentBeatIndex.value + 1] ?? null;
  });

  const visibleLyrics = computed<BeatMapItem[]>(() => {
    const start = Math.max(0, currentBeatIndex.value - 1);
    const end = Math.min(beatMap.length, currentBeatIndex.value + 4);
    return beatMap.slice(start, end);
  });

  const progress = computed(() => {
    if (!currentBeat.value || !nextBeat.value) return 0;

    const elapsed = Math.max(0, currentTime.value - currentBeat.value.time);
    const duration = nextBeat.value.time - currentBeat.value.time;

    return Math.min(1, Math.max(0, elapsed / duration));
  });

  const isComplete = computed(() => {
    return currentBeatIndex.value >= beatMap.length;
  });

  function start() {
    startTime.value = performance.now() / 1000;
    currentTime.value = 0;
    currentBeatIndex.value = 0;
    hasAutoMissed.value = false;
    isPlaying.value = true;
  }

  function update(audioTime: number) {
    if (!isPlaying.value) return;

    currentTime.value = audioTime;

    const beat = beatMap[currentBeatIndex.value];
    const nextBeat = beatMap[currentBeatIndex.value + 1];

    if (!beat) return;

    // Debug log
    if (Math.floor(audioTime * 10) % 10 === 0) {
      console.log(
        `[RhythmEngine] audioTime: ${audioTime.toFixed(2)}s, beat: ${currentBeatIndex.value}/${beatMap.length}, progress: ${progress.value.toFixed(2)}`,
      );
    }

    // AUTO MISS CHECK - trước khi chuyển beat
    if (nextBeat && audioTime >= nextBeat.time && !hasAutoMissed.value) {
      console.log(`[RhythmEngine] AUTO MISS: ${beat.text} at ${audioTime.toFixed(2)}s`);
      hasAutoMissed.value = true;

      // Trigger callback nếu có
      if (onAutoMissCallback) {
        onAutoMissCallback();
      }
    }

    // BEAT ADVANCE - sau khi check auto miss
    if (nextBeat && audioTime >= nextBeat.time) {
      console.log(
        `[RhythmEngine] Beat changed: ${currentBeatIndex.value} → ${currentBeatIndex.value + 1} (${nextBeat.text})`,
      );
      currentBeatIndex.value++;
      hasAutoMissed.value = false; // Reset cho beat mới
    }
  }

  function setAutoMissCallback(callback: () => void) {
    onAutoMissCallback = callback;
  }

  function evaluateTap(tapTime: number): "perfect" | "good" | "miss" {
    if (!currentBeat.value) return "miss";

    const targetTime = currentBeat.value.time;
    const delta = Math.abs(tapTime - targetTime);

    if (delta <= GAME_CONFIG.perfectWindow) {
      return "perfect";
    } else if (delta <= GAME_CONFIG.goodWindow) {
      return "good";
    } else {
      return "miss";
    }
  }

  function advanceBeat() {
    currentBeatIndex.value++;
    hasAutoMissed.value = false;
  }

  function stop() {
    isPlaying.value = false;
  }

  function reset() {
    startTime.value = 0;
    currentTime.value = 0;
    currentBeatIndex.value = 0;
    hasAutoMissed.value = false;
    isPlaying.value = false;
    onAutoMissCallback = null;
  }

  return {
    currentTime,
    currentBeat,
    nextBeat,
    visibleLyrics,
    progress,
    isPlaying,
    isComplete,
    currentBeatIndex,
    start,
    update,
    setAutoMissCallback,
    evaluateTap,
    advanceBeat,
    stop,
    reset,
  };
}
