<script setup lang="ts">
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useDialog } from "../composables/useDialog";
import rawBienBaoData from "../data/bienBaoData";
import { resolveImageUrl } from "../utils/urlUtil";

import type { Sign } from "../types/SignType";

defineEmits<{
  (e: "back"): void;
}>();

const { showDialog } = useDialog();

const categoryNames: Record<string, string> = {
  "bien-cam": "Biển cấm",
  "bien-canh-bao": "Biển nguy hiểm",
  "bien-hieu-lenh": "Biển hiệu lệnh",
  "bien-chi-dan": "Biển chỉ dẫn",
  "bien-phu": "Biển phụ",
  "bien-tren-cao-toc": "Biển trên cao tốc",
};

const bienBaoGroups = computed(() => {
  const groups: Record<string, { slug: string; category: string; signs: Sign[] }> = {};

  for (const sign of rawBienBaoData) {
    let group = groups[sign.category];
    if (!group) {
      group = {
        slug: sign.category,
        category: categoryNames[sign.category] || sign.category,
        signs: [],
      };
      groups[sign.category] = group;
    }
    group.signs.push(sign);
  }

  return Object.values(groups);
});

const activeCategory = ref("all");

function setCategory(cat: string) {
  activeCategory.value = cat;
}

function openSignDetails(sign: Sign) {
  showDialog({
    type: "info",
    title: sign.name,
    message: sign.explanation,
    imageUrl:
      resolveImageUrl(sign.imageUrl) ||
      `https://placehold.co/150x150/1E2F42/FF6B4A?text=${sign.id}`,
    footer: `BIỂN SỐ ${sign.id}`,
  });
}
</script>

<template>
  <div class="animate-fade-up">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <button
        class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-sky transition-colors cursor-pointer"
        @click="$emit('back')"
      >
        <Icon icon="lucide:arrow-left" class="size-5" />
        Quay lại
      </button>
      <div class="font-display text-text-dim text-sm tracking-widest uppercase">
        BIỂN BÁO GIAO THÔNG
      </div>
    </div>

    <!-- Content -->
    <div class="border border-border-default bg-bg-surface p-8">
      <div class="text-center mb-8">
        <Icon icon="lucide:alert-triangle" class="size-16 mx-auto text-accent-sky/50 mb-4" />
        <h2 class="font-display text-2xl font-bold text-text-primary mb-2">Hệ thống biển báo</h2>
        <p class="text-text-secondary max-w-lg mx-auto">
          Tra cứu hình ảnh và ý nghĩa chuyên sâu của các nhóm biển báo đường bộ tại Việt Nam.
        </p>
      </div>

      <!-- Category Tabs -->
      <div class="flex flex-wrap justify-center gap-3 mb-10">
        <button
          class="px-5 py-2 font-display text-sm border transition-colors cursor-pointer"
          :class="
            activeCategory === 'all'
              ? 'border-accent-sky bg-accent-sky text-bg-deep font-semibold'
              : 'border-border-default text-text-primary hover:border-accent-sky/50 hover:bg-bg-elevated'
          "
          @click="setCategory('all')"
        >
          Tất cả
        </button>
        <button
          v-for="group in bienBaoGroups"
          :key="group.slug"
          class="px-5 py-2 font-display text-sm border transition-colors cursor-pointer"
          :class="
            activeCategory === group.slug
              ? 'border-accent-sky bg-accent-sky text-bg-deep font-semibold'
              : 'border-border-default text-text-primary hover:border-accent-sky/50 hover:bg-bg-elevated'
          "
          @click="setCategory(group.slug)"
        >
          {{ group.category }}
        </button>
      </div>

      <!-- Signs List (Gallery mode) -->
      <div class="space-y-12">
        <template v-for="group in bienBaoGroups" :key="group.slug">
          <div
            v-if="activeCategory === 'all' || activeCategory === group.slug"
            class="animate-fade-up"
          >
            <!-- Group Header (only in 'all' mode) -->
            <div v-if="activeCategory === 'all'" class="mb-8 flex items-center gap-4">
              <div class="h-px flex-1 bg-border-default border-dashed"></div>
              <h3
                class="font-display font-bold text-accent-sky text-xs tracking-[0.2em] uppercase px-4 py-1.5 border border-border-default bg-bg-surface shadow-sm"
              >
                {{ group.category }}
              </h3>
              <div class="h-px flex-1 bg-border-default border-dashed"></div>
            </div>

            <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <button
                v-for="sign in group.signs"
                :key="sign.id"
                class="border border-border-default bg-bg-deep hover:border-accent-sky p-4 flex flex-col items-center gap-3 transition-colors group cursor-pointer text-center relative overflow-hidden"
                @click="openSignDetails(sign)"
              >
                <div
                  class="w-full h-32 bg-bg-surface border border-dashed border-border-default group-hover:border-accent-sky/50 flex flex-col items-center justify-center transition-colors relative"
                >
                  <!-- Dùng ảnh placeholder vuông có mã biển số -->
                  <img
                    :src="
                      resolveImageUrl(sign.imageUrl) ||
                      `https://placehold.co/150x150/1E2F42/FF6B4A?text=${sign.id}`
                    "
                    :alt="sign.name"
                    class="max-w-full max-h-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h4
                  class="font-display font-semibold text-text-primary text-sm group-hover:text-accent-sky transition-colors leading-tight line-clamp-2"
                >
                  {{ sign.name }}
                </h4>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
