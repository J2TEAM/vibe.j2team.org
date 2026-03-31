<template>
  <Transition name="fade-slide" appear>
    <div
      class="group relative overflow-hidden bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 h-fit hover:border-accent-coral/50 hover:shadow-[0_0_40px_-10px_var(--tw-shadow-color)] hover:shadow-accent-coral/30 transition-all duration-500 bg-gradient-to-b from-slate-900 to-slate-950"
    >
      <div
        class="absolute -top-10 -left-10 w-32 h-32 bg-accent-coral/10 blur-[50px] rounded-full group-hover:bg-accent-coral/20 transition-colors duration-500"
      ></div>

      <div class="relative z-10">
        <h3 class="flex items-center gap-2.5 text-white font-semibold mb-5">
          <Icon
            icon="heroicons:information-circle"
            class="w-5 h-5 text-accent-coral drop-shadow-[0_0_8px_var(--tw-shadow-color)] shadow-accent-coral/50"
          />
          <span>
            Công cụ tính toán
            <code
              class="text-accent-coral font-mono bg-accent-coral/10 px-2 py-0.5 rounded border border-accent-coral/20 mx-1"
              >chmod</code
            >
          </span>
        </h3>

        <p class="text-sm text-slate-400 leading-relaxed mb-5">
          Lệnh
          <code
            class="text-accent-coral font-mono bg-accent-coral/10 px-1.5 py-0.5 rounded border border-accent-coral/20"
            >chmod</code
          >
          dùng để thay đổi quyền truy cập. Các quyền được tính bằng tổng:
        </p>

        <ul class="text-sm text-slate-400 space-y-2.5 font-mono">
          <li
            class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group/item cursor-default"
          >
            <span
              class="text-accent-coral font-bold bg-accent-coral/10 w-8 h-8 flex items-center justify-center rounded-lg border border-accent-coral/20 group-hover/item:scale-110 group-hover/item:shadow-[0_0_10px_var(--tw-shadow-color)] group-hover/item:shadow-accent-coral/30 transition-all duration-300"
              >4</span
            >
            <span class="group-hover/item:text-slate-200 transition-colors">Read (Đọc)</span>
          </li>

          <li
            class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group/item cursor-default"
          >
            <span
              class="text-accent-coral font-bold bg-accent-coral/10 w-8 h-8 flex items-center justify-center rounded-lg border border-accent-coral/20 group-hover/item:scale-110 group-hover/item:shadow-[0_0_10px_var(--tw-shadow-color)] group-hover/item:shadow-accent-coral/30 transition-all duration-300"
              >2</span
            >
            <span class="group-hover/item:text-slate-200 transition-colors">Write (Ghi)</span>
          </li>

          <li
            class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group/item cursor-default"
          >
            <span
              class="text-accent-coral font-bold bg-accent-coral/10 w-8 h-8 flex items-center justify-center rounded-lg border border-accent-coral/20 group-hover/item:scale-110 group-hover/item:shadow-[0_0_10px_var(--tw-shadow-color)] group-hover/item:shadow-accent-coral/30 transition-all duration-300"
              >1</span
            >
            <span class="group-hover/item:text-slate-200 transition-colors"
              >Execute (Thực thi)</span
            >
          </li>

          <li
            class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group/item cursor-default"
          >
            <span
              class="text-slate-500 font-bold bg-slate-800 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 group-hover/item:scale-110 transition-all duration-300"
              >0</span
            >
            <span class="group-hover/item:text-slate-300 transition-colors">No Permission</span>
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
/* Định nghĩa Animation cho Vue Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.6s ease-out,
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px); /* Bắt đầu từ dưới dịch nhẹ lên */
}

/* Nếu bạn muốn áp dụng Delay để component này hiện ra SAU component Tác giả một chút */
/* .fade-slide-enter-active {
  transition-delay: 150ms; 
} 
*/
</style>
