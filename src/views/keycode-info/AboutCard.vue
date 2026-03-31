<template>
  <Transition name="fade-slide" appear>
    <div
      class="group relative overflow-hidden bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-800 h-fit hover:border-accent-coral/50 hover:shadow-[0_0_40px_-10px_var(--tw-shadow-color)] hover:shadow-accent-coral/30 transition-all duration-500 bg-gradient-to-b from-slate-900 to-slate-950"
    >
      <div
        class="absolute -top-10 -left-10 w-32 h-32 bg-accent-coral/10 blur-[50px] rounded-full group-hover:bg-accent-coral/20 transition-colors duration-500"
      ></div>

      <div class="relative z-10">
        <h3 class="flex items-center gap-2.5 text-white font-semibold mb-3.5">
          <Icon
            icon="heroicons:information-circle"
            class="w-5 h-5 text-accent-coral drop-shadow-[0_0_8px_var(--tw-shadow-color)] shadow-accent-coral/50"
          />
          <span>
            <code
              class="text-accent-coral font-mono bg-accent-coral/10 px-2 py-0.5 rounded border border-accent-coral/20 mx-1"
            >
              KeyboardEvent
            </code>
          </span>
        </h3>

        <p class="text-sm text-slate-400 leading-relaxed mb-3.5">
          Công cụ này lắng nghe sự kiện
          <code
            class="text-accent-coral font-mono bg-accent-coral/10 px-1.5 py-0.5 rounded border border-accent-coral/20"
            >keydown</code
          >
          và bóc tách các thuộc tính hữu ích cho Developer:
        </p>

        <ul class="text-[13px] text-slate-400 space-y-2 font-mono">
          <li
            class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group/item cursor-default"
          >
            <span
              class="text-accent-coral font-bold bg-accent-coral/10 min-w-[32px] h-8 flex items-center justify-center rounded-lg border border-accent-coral/20 group-hover/item:scale-110 group-hover/item:shadow-[0_0_10px_var(--tw-shadow-color)] group-hover/item:shadow-accent-coral/30 transition-all duration-300"
            >
              K
            </span>
            <div class="flex flex-col gap-0.5">
              <span
                class="group-hover/item:text-slate-200 transition-colors font-bold leading-tight"
                >event.key</span
              >
              <span class="text-slate-500 text-[11px] font-sans"
                >Giá trị in ra thực tế (có phân biệt hoa/thường).</span
              >
            </div>
          </li>

          <li
            class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group/item cursor-default"
          >
            <span
              class="text-accent-coral font-bold bg-accent-coral/10 min-w-[32px] h-8 flex items-center justify-center rounded-lg border border-accent-coral/20 group-hover/item:scale-110 group-hover/item:shadow-[0_0_10px_var(--tw-shadow-color)] group-hover/item:shadow-accent-coral/30 transition-all duration-300"
            >
              #
            </span>
            <div class="flex flex-col gap-0.5">
              <span
                class="group-hover/item:text-slate-200 transition-colors font-bold leading-tight"
                >event.keyCode</span
              >
              <span class="text-slate-500 text-[11px] font-sans"
                >Mã số định danh của phím. <em class="text-rose-400/80">*Deprecated</em></span
              >
            </div>
          </li>

          <li
            class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group/item cursor-default"
          >
            <span
              class="text-accent-coral font-bold bg-accent-coral/10 min-w-[32px] h-8 flex items-center justify-center rounded-lg border border-accent-coral/20 group-hover/item:scale-110 group-hover/item:shadow-[0_0_10px_var(--tw-shadow-color)] group-hover/item:shadow-accent-coral/30 transition-all duration-300"
            >
              C
            </span>
            <div class="flex flex-col gap-0.5">
              <span
                class="group-hover/item:text-slate-200 transition-colors font-bold leading-tight"
                >event.code</span
              >
              <span class="text-slate-500 text-[11px] font-sans"
                >Tên vật lý của phím, không đổi theo ngôn ngữ.</span
              >
            </div>
          </li>
        </ul>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.6s ease-out,
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-enter-active {
  transition-delay: 150ms;
}
</style>
