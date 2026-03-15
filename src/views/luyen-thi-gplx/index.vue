<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import "./assets/css/style.css";

// Components
import ThiThu from "./components/ThiThu.vue";
import HocLyThuyet from "./components/HocLyThuyet.vue";
import BienBao from "./components/BienBao.vue";
import MeoThi from "./components/MeoThi.vue";
import AppDialog from "./components/AppDialog.vue";

const activeTab = ref<"oto" | "xemay">("oto");
const currentView = ref<"home" | "thi-thu" | "hoc-ly-thuyet" | "bien-bao" | "meo-thi">("home");

const categories = [
  {
    id: "thi-thu" as const,
    name: "Thi thử",
    icon: "lucide:file-text",
    desc: "Làm bài thi đầy đủ với thời gian thực",
  },
  {
    id: "hoc-ly-thuyet" as const,
    name: "Học lý thuyết",
    icon: "lucide:book-open",
    desc: "Hệ thống hàng trăm câu hỏi phân loại",
  },
  {
    id: "bien-bao" as const,
    name: "Biển báo",
    icon: "lucide:alert-triangle",
    desc: "Danh sách các loại biển báo giao thông",
  },
  {
    id: "meo-thi" as const,
    name: "Mẹo thi",
    icon: "lucide:lightbulb",
    desc: "Tổng hợp mẹo ghi nhớ nhanh để chọn đáp án",
  },
];
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-12 px-4 sm:px-6"
  >
    <div class="w-full max-w-5xl">
      <!-- Hero -->
      <header class="mb-12 text-center">
        <h1
          class="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-accent-coral animate-fade-up"
        >
          Luyện thi GPLX
        </h1>
        <p
          class="mt-4 text-text-secondary text-lg max-w-2xl mx-auto animate-fade-up animate-delay-2"
        >
          Ứng dụng ôn tập sát hạch lý thuyết lái xe.
        </p>
      </header>

      <div v-if="currentView === 'home'">
        <!-- Tabs -->
        <div class="flex justify-center mb-12 animate-fade-up animate-delay-3">
          <div class="inline-flex border border-border-default bg-bg-surface p-1">
            <button
              class="px-6 py-2.5 font-display text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              :class="
                activeTab === 'oto'
                  ? 'bg-accent-coral text-bg-deep'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              "
              @click="activeTab = 'oto'"
            >
              <Icon icon="lucide:car" class="size-5" />
              Ô TÔ (B, C1, C)
            </button>
            <button
              class="px-6 py-2.5 font-display text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
              :class="
                activeTab === 'xemay'
                  ? 'bg-accent-coral text-bg-deep'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              "
              @click="activeTab = 'xemay'"
            >
              <Icon icon="lucide:bike" class="size-5" />
              XE MÁY (A1, A)
            </button>
          </div>
        </div>

        <!-- Categories Grid -->
        <section class="mb-16 animate-fade-up animate-delay-4">
          <h2 class="font-display text-2xl font-semibold flex items-center gap-3 mb-8">
            <span class="text-accent-coral text-sm tracking-widest font-display">//</span>
            CHỌN CHẾ ĐỘ - TÀI LIỆU {{ activeTab === "oto" ? "Ô TÔ" : "XE MÁY" }}
          </h2>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="group text-left border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated hover:shadow-lg hover:shadow-accent-coral/5 flex flex-col gap-4 relative overflow-hidden cursor-pointer"
              @click="currentView = cat.id"
            >
              <div
                class="p-3 bg-bg-deep inline-flex gap-2 border border-border-default group-hover:border-accent-coral transition-colors"
              >
                <Icon :icon="cat.icon" class="size-6 text-accent-coral" />
                <h3
                  class="font-display text-lg font-semibold text-text-primary group-hover:text-accent-coral transition-colors"
                >
                  {{ cat.name }}
                </h3>
              </div>
              <div>
                <p class="mt-2 text-sm text-text-secondary">
                  {{ cat.desc }}
                </p>
              </div>
              <!-- Decorative icon in the background -->
              <Icon
                :icon="cat.icon"
                class="absolute -bottom-4 -right-4 size-24 text-bg-deep opacity-50 pointer-events-none group-hover:text-accent-coral/5 transition-colors duration-500"
              />
            </button>
          </div>
        </section>
      </div>

      <!-- Detail Views -->
      <div v-else>
        <ThiThu
          v-if="currentView === 'thi-thu'"
          :vehicle-type="activeTab"
          @back="currentView = 'home'"
        />
        <HocLyThuyet
          v-else-if="currentView === 'hoc-ly-thuyet'"
          :vehicle-type="activeTab"
          @back="currentView = 'home'"
        />
        <BienBao v-else-if="currentView === 'bien-bao'" @back="currentView = 'home'" />
        <MeoThi
          v-else-if="currentView === 'meo-thi'"
          :vehicle-type="activeTab"
          @back="currentView = 'home'"
        />
      </div>
    </div>

    <AppDialog />
  </div>
</template>
