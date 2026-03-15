<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useDialog } from '../composables/useDialog'
import rawBienBaoData from '../data/bienBaoData'
import { resolveImageUrl } from '../utils/urlUtil'

import type { Sign } from '../types/SignType'

defineEmits<{
  (e: 'back'): void
}>()

const { showDialog } = useDialog()

const categoryNames: Record<string, string> = {
  'bien-cam': 'Biển cấm',
  'bien-canh-bao': 'Biển nguy hiểm',
  'bien-hieu-lenh': 'Biển hiệu lệnh',
  'bien-chi-dan': 'Biển chỉ dẫn',
  'bien-phu': 'Biển phụ',
  'bien-tren-cao-toc': 'Biển trên cao tốc',
}

const bienBaoGroups = computed(() => {
  const groups: Record<string, { slug: string; category: string; signs: Sign[] }> = {}
  const query = searchQuery.value.toLowerCase().trim()

  for (const sign of rawBienBaoData) {
    // Filter by category
    if (activeCategory.value !== 'all' && sign.category !== activeCategory.value) {
      continue
    }

    // Filter by search query (name or id)
    if (
      query &&
      !sign.name.toLowerCase().includes(query) &&
      !sign.id.toLowerCase().includes(query)
    ) {
      continue
    }

    let group = groups[sign.category]
    if (!group) {
      group = {
        slug: sign.category,
        category: categoryNames[sign.category] || sign.category,
        signs: [],
      }
      groups[sign.category] = group
    }
    group.signs.push(sign)
  }

  // Preserve category order based on categoryNames keys
  return Object.keys(categoryNames)
    .filter((key) => groups[key])
    .map((key) => groups[key] as { slug: string; category: string; signs: Sign[] })
})

const activeCategory = ref('all')
const searchQuery = ref('')

function setCategory(cat: string) {
  activeCategory.value = cat
}

function clearSearch() {
  searchQuery.value = ''
}

function openSignDetails(sign: Sign) {
  showDialog({
    type: 'info',
    title: sign.name,
    message: sign.explanation,
    imageUrl:
      resolveImageUrl(sign.imageUrl) ||
      `https://placehold.co/150x150/1E2F42/FF6B4A?text=${sign.id}`,
    footer: `BIỂN SỐ ${sign.id}`,
  })
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
      <div class="text-center mb-10">
        <Icon icon="lucide:alert-triangle" class="size-16 mx-auto text-accent-sky/50 mb-4" />
        <h2 class="font-display text-2xl font-bold text-text-primary mb-2">Hệ thống biển báo</h2>
        <p class="text-text-secondary max-w-lg mx-auto">
          Tra cứu hình ảnh và ý nghĩa chuyên sâu của các nhóm biển báo đường bộ tại Việt Nam.
        </p>
      </div>

      <!-- Search and Filter Bar -->
      <div class="flex flex-col gap-8 mb-10">
        <!-- Search Input -->
        <div class="relative max-w-xl mx-auto w-full group">
          <div
            class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-dim group-focus-within:text-accent-sky transition-colors"
          >
            <Icon icon="lucide:search" class="size-5" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm theo tên biển báo hoặc mã số (vd: P.101)..."
            class="w-full bg-bg-deep border border-border-default py-4 pl-12 pr-12 text-text-primary focus:outline-none focus:border-accent-sky focus:ring-1 focus:ring-accent-sky/20 transition-all font-body text-base placeholder:text-text-dim/50"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute inset-y-0 right-0 pr-4 flex items-center text-text-dim hover:text-accent-coral transition-colors cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <Icon icon="lucide:x" class="size-5" />
          </button>
        </div>

        <!-- Category Tabs -->
        <div class="flex flex-wrap justify-center gap-2">
          <button
            class="px-5 py-2 font-display text-xs tracking-wider uppercase border transition-all cursor-pointer"
            :class="
              activeCategory === 'all'
                ? 'border-accent-sky bg-accent-sky text-bg-deep font-bold'
                : 'border-border-default text-text-secondary hover:border-accent-sky/50 hover:bg-bg-elevated'
            "
            @click="setCategory('all')"
          >
            Tất cả
          </button>
          <button
            v-for="group in Object.keys(categoryNames)"
            :key="group"
            class="px-4 py-2 font-display text-[10px] tracking-widest uppercase border transition-all cursor-pointer"
            :class="
              activeCategory === group
                ? 'border-accent-sky bg-accent-sky text-bg-deep font-bold'
                : 'border-border-default text-text-secondary hover:border-accent-sky/50 hover:bg-bg-elevated'
            "
            @click="setCategory(group)"
          >
            {{ categoryNames[group] }}
          </button>
        </div>
      </div>

      <!-- Signs List (Gallery mode) -->
      <div v-if="bienBaoGroups.length > 0" class="space-y-12">
        <template v-for="group in bienBaoGroups" :key="group.slug">
          <div class="animate-fade-up">
            <!-- Group Header -->
            <div class="mb-8 flex items-center gap-4">
              <div class="h-px flex-1 bg-border-default border-dashed opacity-50"></div>
              <h3
                class="font-display font-bold text-accent-sky text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 border border-border-default bg-bg-surface shadow-sm"
              >
                {{ group.category }}
              </h3>
              <div class="h-px flex-1 bg-border-default border-dashed opacity-50"></div>
            </div>

            <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <button
                v-for="sign in group.signs"
                :key="sign.id"
                class="border border-border-default bg-bg-deep hover:border-accent-sky p-4 flex flex-col items-center gap-4 transition-all group cursor-pointer text-center relative overflow-hidden active:scale-95"
                @click="openSignDetails(sign)"
              >
                <!-- Image Container -->
                <div
                  class="w-full aspect-square bg-white border border-border-default group-hover:border-accent-sky/50 flex flex-col items-center justify-center transition-colors relative overflow-hidden"
                >
                  <img
                    :src="
                      resolveImageUrl(sign.imageUrl) ||
                      `https://placehold.co/150x150/1E2F42/FF6B4A?text=${sign.id}`
                    "
                    :alt="sign.name"
                    class="max-w-[80%] max-h-[80%] object-contain transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <!-- Hover Overlay -->
                  <div
                    class="absolute inset-0 bg-accent-sky/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  ></div>
                </div>

                <!-- Info -->
                <div class="space-y-2">
                  <div
                    class="font-mono text-[10px] text-text-dim group-hover:text-accent-sky font-bold transition-colors"
                  >
                    {{ sign.id }}
                  </div>
                  <h4
                    class="font-display font-semibold text-text-primary text-sm group-hover:text-accent-sky transition-colors leading-snug line-clamp-2"
                  >
                    {{ sign.name }}
                  </h4>
                </div>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-else class="py-20 text-center animate-fade-up">
        <div
          class="inline-flex items-center justify-center size-20 rounded-full bg-bg-deep border border-border-default mb-6"
        >
          <Icon icon="lucide:search-x" class="size-10 text-text-dim" />
        </div>
        <h3 class="font-display text-xl font-bold text-text-primary mb-2">
          Không tìm thấy biển báo
        </h3>
        <p class="text-text-secondary mb-8">
          Chúng tôi không tìm thấy kết quả nào phù hợp với "{{ searchQuery }}"
        </p>
        <button
          @click="
            clearSearch()
            setCategory('all')
          "
          class="inline-flex items-center gap-2 px-6 py-3 bg-accent-sky text-bg-deep font-display font-bold text-sm tracking-widest uppercase hover:bg-white transition-colors cursor-pointer"
        >
          <Icon icon="lucide:refresh-cw" class="size-4" />
          Làm mới bộ lọc
        </button>
      </div>
    </div>
  </div>
</template>
