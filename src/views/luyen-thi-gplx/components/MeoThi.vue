<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import meoThiData from "../data/meoThiData";

const props = defineProps<{
  vehicleType: "oto" | "xemay";
}>();

defineEmits<{
  (e: "back"): void;
}>();

const currentTips = computed(() => {
  const data = meoThiData.find((item) => item.vehicleType === props.vehicleType);
  return data ? data.tips : [];
});
</script>

<template>
  <div class="animate-fade-up">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button
        class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-coral transition-colors cursor-pointer"
        @click="$emit('back')"
      >
        <Icon icon="lucide:arrow-left" class="size-5" />
        Quay lại
      </button>
      <div class="font-display text-text-dim text-sm tracking-widest uppercase">
        MẸO THI LÝ THUYẾT - {{ vehicleType === "oto" ? "Ô TÔ" : "XE MÁY" }}
      </div>
    </div>

    <!-- Content -->
    <div class="border border-border-default bg-bg-surface p-6 sm:p-10">
      <div class="text-center mb-12">
        <Icon icon="lucide:lightbulb" class="size-16 mx-auto text-accent-coral/30 mb-4" />
        <h2 class="font-display text-3xl font-bold text-text-primary mb-3">Tổng hợp mẹo thi</h2>
        <p class="text-text-secondary max-w-xl mx-auto leading-relaxed">
          Các mẹo ghi nhớ nhanh để chọn ngay đáp án đúng trong bài thi tổng hợp, giúp bạn tự tin chốt
          chắc điểm và tiết kiệm thời gian.
        </p>
      </div>

      <div class="grid gap-6">
        <div
          v-for="(tip, index) in currentTips"
          :key="tip.id"
          class="p-6 bg-bg-deep border border-border-default group hover:border-accent-coral/50 transition-all duration-300 relative overflow-hidden"
        >
          <!-- Background Number -->
          <span
            class="absolute -top-4 -right-4 font-display text-9xl font-bold text-accent-coral/5 select-none pointer-events-none transition-all group-hover:text-accent-coral/10 group-hover:scale-110"
          >
            {{ String(index + 1).padStart(2, "0") }}
          </span>

          <div class="flex items-start gap-5 relative z-10">
            <div
              class="size-12 shrink-0 bg-accent-coral/10 border border-accent-coral/20 flex items-center justify-center text-accent-coral group-hover:bg-accent-coral group-hover:text-bg-deep transition-colors"
            >
              <Icon
                :icon="
                  tip.text.includes('liệt')
                    ? 'lucide:alert-octagon'
                    : tip.text.includes('biển')
                      ? 'lucide:signpost'
                      : tip.text.includes('sa hình')
                        ? 'lucide:map'
                        : 'lucide:zap'
                "
                class="size-6"
              />
            </div>
            <div class="flex-1">
              <h3
                class="font-display text-xl font-bold text-text-primary mb-4 group-hover:text-accent-coral transition-colors"
              >
                {{ tip.text }}
              </h3>
              <ul class="space-y-3">
                <li
                  v-for="(descItem, dIndex) in tip.desc"
                  :key="dIndex"
                  class="flex items-start gap-3 text-sm text-text-secondary leading-relaxed"
                >
                  <span class="size-1.5 mt-1.5 shrink-0 bg-accent-coral/40 rounded-full" />
                  {{ descItem }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
