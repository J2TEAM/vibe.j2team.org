<template>
  <Transition name="fade-slide" appear>
    <div
      class="group relative overflow-hidden bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col justify-between h-fit hover:border-accent-coral/50 hover:shadow-[0_0_40px_-10px_var(--tw-shadow-color)] hover:shadow-accent-coral/30 transition-all duration-500 bg-gradient-to-b from-slate-900 to-slate-950"
      style="will-change: transform, opacity"
    >
      <div
        class="absolute -bottom-10 -right-10 w-32 h-32 bg-accent-coral/10 blur-[50px] rounded-full group-hover:bg-accent-coral/20 transition-colors duration-500"
      ></div>

      <div class="relative z-10">
        <h3
          class="flex items-center gap-2 text-slate-400 font-medium tracking-widest uppercase text-xs mb-8 font-mono"
        >
          <Icon
            icon="heroicons:code-bracket-square"
            class="w-5 h-5 text-accent-coral drop-shadow-[0_0_8px_var(--tw-shadow-color)] shadow-accent-coral/50"
          />
          Developed By
        </h3>

        <div class="relative pl-5 flex flex-col gap-2">
          <div class="absolute left-0 top-1 bottom-1 w-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              class="w-full h-1/3 bg-accent-coral shadow-[0_0_10px_var(--tw-shadow-color)] shadow-accent-coral/50 group-hover:h-full transition-all duration-700 ease-out"
            ></div>
          </div>

          <a
            :href="meta.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="group/name flex items-center gap-3 w-fit"
          >
            <span
              class="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 group-hover/name:from-accent-coral group-hover/name:to-orange-400 transition-all duration-500 drop-shadow-md group-hover/name:drop-shadow-[0_0_20px_rgba(255,127,80,0.6)]"
            >
              Nguyen Phi Khanh
            </span>

            <Icon
              icon="heroicons:arrow-top-right-on-square-20-solid"
              class="w-6 h-6 text-accent-coral opacity-0 -translate-x-4 translate-y-4 group-hover/name:opacity-100 group-hover/name:translate-x-0 group-hover/name:translate-y-0 transition-all duration-300 ease-out"
            />
          </a>

          <div class="flex items-center gap-3 mt-1">
            <div
              class="text-sm text-slate-500 font-mono transition-colors group-hover:text-slate-400"
            >
              @nguyenphiikhanh
            </div>
            <div
              class="text-[11px] font-medium text-accent-coral bg-accent-coral/10 px-2 py-0.5 rounded border border-accent-coral/20 shadow-sm animate-pulse"
            >
              Vibe Developer
            </div>
          </div>
        </div>
      </div>

      <div
        class="mt-12 relative z-10 flex flex-col items-center justify-center py-4 px-6 rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden group/vibe cursor-default hover:border-accent-coral/30 transition-colors duration-300"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-accent-coral/10 to-transparent -translate-x-[150%] group-hover/vibe:translate-x-[150%] transition-transform duration-1000 ease-in-out"
        ></div>

        <div class="flex items-center gap-3">
          <Icon
            icon="mdi:fire"
            class="w-5 h-5 text-accent-coral animate-pulse drop-shadow-[0_0_5px_var(--tw-shadow-color)] shadow-accent-coral/50"
          />

          <span
            class="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-coral to-orange-300 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,127,80,0.4)] group-hover/vibe:scale-105 transition-transform duration-300"
          >
            J2TEAM VIBE
          </span>

          <Icon
            icon="mdi:fire"
            class="w-5 h-5 text-accent-coral animate-pulse drop-shadow-[0_0_5px_var(--tw-shadow-color)] shadow-accent-coral/50"
          />
        </div>

        <div
          class="text-[10px] text-slate-500 font-mono mt-1.5 tracking-widest uppercase opacity-80 group-hover/vibe:opacity-100 transition-opacity"
        >
          <span class="text-accent-coral">>_</span> Community Spirit
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import meta from './meta'
</script>

<style scoped>
/* Định nghĩa Animation cho Vue Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.6s ease-out 150ms,
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 150ms;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
