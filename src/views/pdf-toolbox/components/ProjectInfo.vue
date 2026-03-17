<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineEmits<{
  (e: 'show-readme'): void
}>()
</script>

<template>
  <section
    class="grid grid-cols-1 lg:grid-cols-3 border border-border-default bg-bg-surface overflow-hidden mb-12 animate-fade-up"
  >
    <!-- Left: Info Section -->
    <div
      class="lg:col-span-2 p-8 lg:p-12 space-y-8 border-b lg:border-b-0 lg:border-r border-border-default relative overflow-hidden group"
    >
      <!-- Background Decoration -->
      <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon icon="lucide:file-terminal" class="size-32 -mr-8 -mt-8 rotate-12" />
      </div>

      <div class="space-y-4 relative z-10">
        <div
          class="flex items-center gap-2 text-accent-coral font-display text-[10px] font-black tracking-[0.3em] uppercase"
        >
          <span class="w-8 h-px bg-accent-coral/30"></span>
          Project Lab
        </div>

        <h2
          class="font-display text-4xl sm:text-5xl font-black tracking-tighter uppercase italic leading-none"
        >
          PDF <span class="text-accent-sky">Toolbox</span> Lab
        </h2>

        <p class="text-text-secondary text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
          Một không gian thí nghiệm xử lý tài liệu PDF tối ưu. Thay vì các công cụ trực tuyến cồng
          kềnh, môi trường này tập trung vào hiệu năng, bảo mật và sự tinh giản để bạn làm việc
          nhanh hơn và an toàn hơn.
        </p>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
        <div
          class="space-y-3 p-4 bg-bg-deep/40 border border-border-default hover:border-accent-sky/50 transition-colors"
        >
          <span
            class="text-[10px] font-display font-bold text-accent-sky uppercase tracking-widest block"
            >Chế độ xử lý</span
          >
          <h4 class="text-sm font-bold uppercase italic">Vibe PDF Engine</h4>
          <p class="text-[10px] text-text-dim leading-relaxed uppercase tracking-wider">
            Hợp nhất, Tách file, Trích xuất trang.
          </p>
        </div>

        <div
          class="space-y-3 p-4 bg-bg-deep/40 border border-border-default hover:border-accent-coral/50 transition-colors"
        >
          <span
            class="text-[10px] font-display font-bold text-accent-coral uppercase tracking-widest block"
            >Bảo mật</span
          >
          <h4 class="text-sm font-bold uppercase italic">Zero-Server</h4>
          <p class="text-[10px] text-text-dim leading-relaxed uppercase tracking-wider">
            Dữ liệu được xử lý 100% tại máy khách, không upload.
          </p>
        </div>

        <div
          class="space-y-3 p-4 bg-bg-deep/40 border border-border-default hover:border-text-primary/50 transition-colors"
        >
          <span
            class="text-[10px] font-display font-bold text-text-primary uppercase tracking-widest block"
            >Cấu trúc</span
          >
          <h4 class="text-sm font-bold uppercase italic">Anti-Monolith</h4>
          <p class="text-[10px] text-text-dim leading-relaxed uppercase tracking-wider">
            Module hóa hoàn toàn, hiệu năng cực cao.
          </p>
        </div>
      </div>

      <div class="pt-4 flex items-center gap-4 relative z-10">
        <button
          @click="$emit('show-readme')"
          class="flex items-center gap-2 px-6 py-3 bg-white text-bg-deep font-display font-bold text-xs uppercase tracking-widest hover:bg-accent-sky transition-all group"
        >
          <Icon icon="lucide:book-open" class="size-4 group-hover:scale-110 transition-transform" />
          Xem Spec & Kiến trúc
        </button>
        <div class="hidden sm:flex items-center gap-2 opacity-20">
          <span v-for="n in 5" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
        </div>
      </div>
    </div>

    <!-- Right: Quick Start -->
    <div
      class="p-8 lg:p-12 bg-bg-elevated/30 flex flex-col justify-center gap-8 border-t lg:border-t-0 border-border-default"
    >
      <div
        class="flex items-center gap-2 text-text-dim font-display text-[10px] font-bold tracking-[0.3em] uppercase"
      >
        <span class="w-4 h-px bg-border-default"></span>
        Quick Start
      </div>

      <div class="space-y-4">
        <div v-for="(step, idx) in steps" :key="idx" class="group">
          <div
            class="flex flex-col gap-1 p-4 bg-bg-deep/20 border border-border-default hover:border-accent-sky/30 transition-all"
          >
            <span
              class="text-[9px] font-display font-bold text-accent-sky uppercase tracking-[0.2em] opacity-50"
              >Step 0{{ idx + 1 }}</span
            >
            <p
              class="text-[11px] font-bold uppercase tracking-wide group-hover:text-text-primary transition-colors"
            >
              {{ step }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  data() {
    return {
      steps: [
        'Chọn tab chức năng phù hợp (Merge hoặc Split) ở bên dưới.',
        'Tải lên các tệp PDF cần xử lý vào vùng thả tệp.',
        'Tùy chỉnh (sắp xếp, chọn trang) và xuất kết quả trực tiếp.',
      ],
    }
  },
}
</script>
