import { ref } from "vue";

interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function useAudio() {
  let ctx: AudioContext | null = null;
  let musicEl: HTMLAudioElement | null = null;
  const isMuted = ref(false);

  const musicUrl = new URL("../assets/fun2rhyme.mp3", import.meta.url).href;

  function init() {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as WindowWithWebkit).webkitAudioContext!)();
    }
    if (ctx.state === "suspended") void ctx.resume();
  }

  function resume() {
    if (ctx?.state === "suspended") void ctx.resume();
  }

  function playTick() {
    if (!ctx || isMuted.value) return;
    resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "square";
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(1800, t);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.start(t);
    o.stop(t + 0.05);
  }

  function playJump() {
    if (!ctx || isMuted.value) return;
    resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "square";
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t);
    o.stop(t + 0.25);
  }

  function playDoubleJump() {
    if (!ctx || isMuted.value) return;
    resume();
    ([0, 0.12] as const).forEach((delay) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.connect(g);
      g.connect(ctx!.destination);
      o.type = "square";
      const t = ctx!.currentTime + delay;
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(700, t + 0.1);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t);
      o.stop(t + 0.15);
    });
  }

  function playDead() {
    if (!ctx || isMuted.value) return;
    resume();
    const freqs = [440, 350, 280, 220, 160, 100];
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.connect(g);
      g.connect(ctx!.destination);
      o.type = "square";
      const t = ctx!.currentTime + i * 0.1;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.start(t);
      o.stop(t + 0.12);
    });
  }

  function playFail() {
    if (!ctx || isMuted.value) return;
    resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sawtooth";
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(440, t);
    o.frequency.setValueAtTime(370, t + 0.1);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.35);
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.start(t);
    o.stop(t + 0.4);
  }

  function startMusic() {
    if (!musicEl) {
      musicEl = new Audio(musicUrl);
      musicEl.loop = true;
      musicEl.volume = 0.45;
    }
    musicEl.muted = isMuted.value;
    musicEl.currentTime = 0;
    void musicEl.play();
  }

  function stopMusic() {
    if (musicEl) {
      musicEl.pause();
      musicEl.currentTime = 0;
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value;
    if (musicEl) musicEl.muted = isMuted.value;
  }

  function getMusicElement() {
    return musicEl;
  }

  function destroy() {
    stopMusic();
    musicEl = null;
  }

  return {
    isMuted,
    init,
    playTick,
    playJump,
    playDoubleJump,
    playDead,
    playFail,
    startMusic,
    stopMusic,
    toggleMute,
    getMusicElement,
    destroy,
  };
}
