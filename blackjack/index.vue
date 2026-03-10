<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useBlackjack } from "./composables/useBlackjack";
import BlackjackTable from "./components/BlackjackTable.vue";
import BetControl from "./components/BetControl.vue";
import RulesModal from "./components/RulesModal.vue";

const {
  player,
  dealer,
  status,
  resultMessage,
  startNewGame,
  hit,
  stand,
  doubleDown,
  split,
  resetGame,
  canSplit,
  canDouble,
  getScoreDisplay,
  isSoundEnabled,
  toggleSound,
} = useBlackjack();

const isRulesOpen = ref(false);

onMounted(() => {
  document.body.style.overflow = "hidden";
});

onUnmounted(() => {
  document.body.style.overflow = "";
});

const handlePlaceBet = (amount: number) => {
  if (status.value === "ended") {
    resetGame();
  }
  startNewGame(amount);
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// --- IMPORT / EXPORT LOGIC ---
const SECRET_KEY = "j2team-blackjack-vibe-2026";

const generateMachineId = () => {
  const nav = window.navigator;
  const screen = window.screen;
  let guid = nav.mimeTypes.length.toString();
  guid += nav.userAgent.replace(/\D+/g, "");
  guid += nav.plugins.length.toString();
  guid += screen.height?.toString() || "";
  guid += screen.width?.toString() || "";
  guid += screen.pixelDepth?.toString() || "";
  return btoa(guid).substring(0, 16);
};

const encryptData = (data: object) => {
  const str = JSON.stringify(data);
  let result = "";
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return btoa(result);
};

interface DecryptedData {
  balance: number;
  mid: string;
  ts: number;
}

const decryptData = (encoded: string): DecryptedData | null => {
  try {
    const str = atob(encoded);
    let result = "";
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(
        str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length),
      );
    }
    return JSON.parse(result);
  } catch {
    return null;
  }
};

const handleExport = () => {
  const data = {
    balance: player.value.balance,
    mid: generateMachineId(),
    ts: Date.now(),
  };
  const encrypted = encryptData(data);
  const blob = new Blob([encrypted], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `player_${data.mid}.blackjack`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleImport = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".blackjack";
  input.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (res: ProgressEvent<FileReader>) => {
      const content = res.target?.result as string;
      const decrypted = decryptData(content);
      if (decrypted && decrypted.mid === generateMachineId()) {
        player.value.balance = decrypted.balance;
        alert("Nạp dữ liệu thành công!");
      } else {
        alert("File không hợp lệ hoặc ID máy không khớp!");
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
</script>

<template>
  <div
    class="h-screen bg-bg-deep text-text-primary font-body flex flex-col selection:bg-accent-coral/30 relative overflow-hidden"
  >
    <!-- Noise Overlay -->
    <div class="fixed inset-0 pointer-events-none opacity-[0.02] z-50 bg-noise"></div>

    <!-- Header -->
    <header class="z-50 bg-bg-deep/80 backdrop-blur-md border-b border-border-default shrink-0">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-4 sm:gap-6">
          <RouterLink to="/" class="flex items-center gap-1 group">
            <span
              class="font-display text-[11px] sm:text-[13px] font-black tracking-[0.2em] uppercase text-text-secondary group-hover:text-accent-coral"
              >HOME</span
            >
          </RouterLink>
        </div>

        <div class="flex items-center gap-4 sm:gap-10">
          <!-- Import / Export Controls -->
          <div class="flex items-center gap-4 border-r border-border-default pr-4 sm:pr-10">
            <button @click="handleImport" class="group flex flex-col items-end">
              <span
                class="font-display font-black text-[11px] sm:text-[12px] tracking-widest text-text-secondary group-hover:text-text-primary uppercase"
                >Deposit</span
              >
            </button>
            <div class="w-px h-6 bg-border-default opacity-30"></div>
            <button @click="handleExport" class="group flex flex-col items-end">
              <span
                class="font-display font-black text-[11px] sm:text-[12px] tracking-widest text-text-secondary group-hover:text-text-primary uppercase"
                >Withdraw</span
              >
            </button>
          </div>

          <div class="flex flex-col items-end">
            <span
              class="font-display font-black text-sm sm:text-lg tracking-tighter text-accent-amber"
            >
              ${{ player.balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Game Container (justify-start to anchor the top) -->
    <main
      class="grow flex flex-col items-center justify-start relative pt-4 sm:pt-8 pb-4 overflow-y-auto sm:overflow-hidden custom-scrollbar"
    >
      <!-- Unified Game Wrapper (Rigid structure to prevent jitter) -->
      <div class="w-full max-w-4xl px-4 sm:px-6 flex flex-col items-center shrink-0">
        <!-- Title Row -->
        <div class="w-full mb-2 flex items-center justify-between">
          <h1
            class="font-display text-lg sm:text-2xl font-bold text-text-primary tracking-tighter italic uppercase leading-none"
          >
            Black<span class="text-accent-coral">jack</span>
          </h1>
          <div
            class="bg-accent-coral text-bg-deep font-display font-black text-[11px] sm:text-[13px] tracking-widest px-4 py-1.5 rotate-6 shadow-xl border border-bg-deep/10"
          >
            Ngducnhatt
          </div>
        </div>

        <!-- Table Area -->
        <BlackjackTable
          :player="player"
          :dealer="dealer"
          :status="status"
          :message="resultMessage"
          :is-sound-enabled="isSoundEnabled"
          :get-score-display="getScoreDisplay"
          @toggle-sound="toggleSound"
        />

        <!-- Controls Area (Compact fixed height to prevent jitter) -->
        <div class="w-full h-32 sm:h-24 mt-6 relative overflow-hidden">
          <transition name="fade-scale" mode="out-in">
            <!-- Betting/Ended State -->
            <div
              v-if="status === 'betting' || status === 'ended'"
              key="betting"
              class="w-full h-full flex items-center justify-center"
            >
              <BetControl
                :balance="player.balance"
                :disabled="false"
                @place-bet="handlePlaceBet"
              />
            </div>

            <!-- Playing State -->
            <div
              v-else-if="status === 'playing'"
              key="playing"
              class="w-full h-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-stretch"
            >
              <button
                @click="hit"
                class="group flex flex-col items-center justify-center bg-bg-surface border-2 border-border-default hover:border-accent-coral transition-all shadow-lg active:scale-95"
              >
                <span
                  class="font-display text-sm sm:text-base font-black text-text-primary uppercase group-hover:text-accent-coral tracking-tight"
                  >Rút</span
                >
              </button>

              <button
                @click="stand"
                class="group flex flex-col items-center justify-center bg-bg-surface border-2 border-border-default hover:border-accent-coral transition-all shadow-lg active:scale-95"
              >
                <span
                  class="font-display text-sm sm:text-base font-black text-text-primary uppercase group-hover:text-accent-coral tracking-tight"
                  >Dừng</span
                >
              </button>

              <button
                @click="split"
                :disabled="!canSplit"
                :class="{ 'opacity-20 grayscale pointer-events-none': !canSplit }"
                class="group flex flex-col items-center justify-center bg-bg-surface border-2 border-border-default hover:border-accent-coral transition-all shadow-lg active:scale-95"
              >
                <span
                  class="font-display text-sm sm:text-base font-black text-text-primary uppercase group-hover:text-accent-coral tracking-tight"
                  >Tách</span
                >
              </button>

              <button
                @click="doubleDown"
                :disabled="!canDouble"
                :class="{ 'opacity-20 grayscale pointer-events-none': !canDouble }"
                class="group flex flex-col items-center justify-center bg-bg-surface border-2 border-border-default hover:border-accent-coral transition-all shadow-lg active:scale-95"
              >
                <span
                  class="font-display text-sm sm:text-base font-black text-text-primary uppercase group-hover:text-accent-coral tracking-tight"
                  >Gấp đôi (x2)</span
                >
              </button>
            </div>

            <!-- Dealer Turn State -->
            <div v-else key="waiting" class="w-full h-full flex items-center justify-center">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-8 h-8 border-2 border-accent-coral border-t-transparent animate-spin"
                ></div>
                <div
                  class="font-display text-[12px] font-black text-text-dim tracking-[0.3em] uppercase animate-pulse"
                >
                  Dealer đang rút bài...
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Back to top button for mobile -->
      <button
        @click="scrollToTop"
        class="sm:hidden mt-8 mb-4 flex items-center gap-2 text-text-dim font-display text-[12px] uppercase tracking-widest font-black opacity-50 hover:opacity-100 transition-opacity"
      >
        <span>↑ Lên đầu trang</span>
      </button>
    </main>

    <!-- Footer -->
    <footer class="py-3 border-t border-border-default bg-bg-surface/30 shrink-0">
      <div
        class="max-w-4xl mx-auto px-4 flex items-center justify-between text-[10px] sm:text-[11px] uppercase tracking-widest font-display text-text-dim"
      >
        <div class="flex gap-6 sm:gap-10">
          <button
            @click="isRulesOpen = true"
            class="hover:text-accent-coral transition-colors uppercase font-black"
          >
            Luật chơi
          </button>
        </div>
      </div>
    </footer>

    <!-- Rules Modal -->
    <RulesModal :is-open="isRulesOpen" @close="isRulesOpen = false" />
  </div>
</template>

<style>
.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.99);
}
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.01);
}
</style>
