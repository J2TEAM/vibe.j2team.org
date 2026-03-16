<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useTeleporter } from './composables/use-teleporter'

const {
  state,
  currentLocation,
  weather,
  imageUrl,
  localTime,
  localDate,
  errorMessage,
  weatherInfo,
  teleport,
} = useTeleporter()
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body overflow-hidden">
    <!-- ── IDLE & ERROR state ─────────────────────────────────── -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="state === 'idle' || state === 'error'"
        key="idle"
        class="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      >
        <!-- Section marker -->
        <p class="font-display text-sm tracking-widest text-accent-coral animate-fade-up">
          // DU LỊCH ẢO
        </p>

        <!-- Globe icon -->
        <div class="mt-6 mb-8 animate-fade-up animate-delay-1">
          <div
            class="inline-flex items-center justify-center w-24 h-24 border border-border-default bg-bg-surface"
          >
            <Icon icon="lucide:globe" class="text-accent-coral size-12" />
          </div>
        </div>

        <!-- Heading -->
        <h1
          class="font-display text-5xl sm:text-7xl font-bold tracking-tight text-text-primary leading-none animate-fade-up animate-delay-1"
        >
          DỊch chuyển<br />
          <span class="text-accent-coral">tức thì</span>
        </h1>

        <p class="mt-5 text-text-secondary text-lg max-w-sm animate-fade-up animate-delay-2">
          Nhấn nút để dịch chuyển đến một địa điểm ngẫu nhiên trên thế giới — với thời tiết và giờ
          địa phương thực tế.
        </p>

        <!-- Error message -->
        <p v-if="state === 'error'" class="mt-4 text-accent-coral text-sm animate-fade-up">
          <Icon icon="lucide:alert-circle" class="inline-block mr-1 size-4" />
          {{ errorMessage }}
        </p>

        <!-- CTA button -->
        <button
          class="mt-10 group inline-flex items-center gap-3 bg-accent-coral px-8 py-4 font-display font-bold text-bg-deep tracking-wide text-lg transition-all duration-300 hover:bg-accent-amber hover:shadow-lg hover:shadow-accent-coral/20 active:scale-95 animate-fade-up animate-delay-3"
          @click="teleport"
        >
          <Icon icon="lucide:zap" class="size-5 transition-transform group-hover:scale-125" />
          DỊCH CHUYỂN NGAY
        </button>

        <!-- Back link -->
        <RouterLink
          to="/"
          class="mt-8 inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary animate-fade-up animate-delay-4"
        >
          <Icon icon="lucide:arrow-left" class="size-4" />
          Về trang chủ
        </RouterLink>

        <!-- Dot decoration -->
        <div class="mt-12 flex gap-1.5 animate-fade-up animate-delay-5">
          <span v-for="n in 30" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
        </div>
      </div>

      <!-- ── LOADING state ──────────────────────────────────────── -->
      <div
        v-else-if="state === 'loading'"
        key="loading"
        class="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center"
      >
        <div class="relative">
          <div
            class="w-20 h-20 border-2 border-accent-coral/30 animate-spin"
            style="border-top-color: #ff6b4a"
          />
          <Icon icon="lucide:globe" class="absolute inset-0 m-auto size-8 text-accent-coral" />
        </div>
        <div>
          <p class="font-display text-2xl font-bold text-text-primary animate-pulse">
            Đang dịch chuyển...
          </p>
          <p class="mt-2 text-text-dim text-sm">Tải dữ liệu thời tiết và hình ảnh</p>
        </div>
      </div>

      <!-- ── READY state ────────────────────────────────────────── -->
      <div
        v-else-if="state === 'ready' && currentLocation"
        key="ready"
        class="min-h-screen flex flex-col"
      >
        <!-- Hero photo -->
        <div class="relative flex-1 min-h-[55vh]">
          <img
            :src="imageUrl"
            :alt="currentLocation.name"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <!-- Gradient overlay -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-transparent"
          />

          <!-- Top bar -->
          <div class="absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6">
            <RouterLink
              to="/"
              class="inline-flex items-center gap-2 border border-white/20 bg-bg-deep/60 backdrop-blur-sm px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            >
              <Icon icon="lucide:arrow-left" class="size-4" />
              Về trang chủ
            </RouterLink>

            <div
              class="bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-2"
            >
              ĐÃ DỊCH CHUYỂN
            </div>
          </div>

          <!-- Location name overlaid on image -->
          <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <p class="font-display text-sm tracking-widest text-accent-coral mb-2">// ĐIỂM ĐẾN</p>
            <h1
              class="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-none"
            >
              {{ currentLocation.name }}
            </h1>
            <p class="mt-2 font-display text-sm tracking-wide text-white/70">
              {{ currentLocation.country }} &nbsp;·&nbsp; {{ currentLocation.continent }}
            </p>
          </div>
        </div>

        <!-- Info panel -->
        <div class="bg-bg-deep border-t border-border-default px-4 sm:px-8 py-6 sm:py-8">
          <div class="max-w-5xl mx-auto">
            <!-- Description -->
            <p class="text-text-secondary text-base sm:text-lg max-w-2xl mb-6">
              {{ currentLocation.description }}
            </p>

            <!-- Data grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <!-- Temperature -->
              <div class="border border-border-default bg-bg-surface p-4">
                <div class="flex items-center gap-2 mb-1">
                  <Icon
                    v-if="weatherInfo()"
                    :icon="weatherInfo()!.icon"
                    class="size-5"
                    :class="weatherInfo()!.iconClass"
                  />
                  <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                    >Thời tiết</span
                  >
                </div>
                <p class="font-display text-2xl font-bold text-text-primary">
                  {{ weather?.temperature }}°C
                </p>
                <p class="text-xs text-text-secondary mt-1">
                  {{ weatherInfo()?.label }}
                </p>
              </div>

              <!-- Humidity -->
              <div class="border border-border-default bg-bg-surface p-4">
                <div class="flex items-center gap-2 mb-1">
                  <Icon icon="lucide:droplets" class="size-5 text-accent-sky" />
                  <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                    >Độ ẩm</span
                  >
                </div>
                <p class="font-display text-2xl font-bold text-text-primary">
                  {{ weather?.humidity }}%
                </p>
                <p class="text-xs text-text-secondary mt-1">Tương đối</p>
              </div>

              <!-- Wind -->
              <div class="border border-border-default bg-bg-surface p-4">
                <div class="flex items-center gap-2 mb-1">
                  <Icon icon="lucide:wind" class="size-5 text-accent-sky" />
                  <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                    >Gió</span
                  >
                </div>
                <p class="font-display text-2xl font-bold text-text-primary">
                  {{ weather?.windSpeed }}
                  <span class="text-sm font-normal text-text-secondary">km/h</span>
                </p>
                <p class="text-xs text-text-secondary mt-1">Tốc độ gió</p>
              </div>

              <!-- Local time -->
              <div class="border border-border-default bg-bg-surface p-4">
                <div class="flex items-center gap-2 mb-1">
                  <Icon icon="lucide:clock" class="size-5 text-accent-coral" />
                  <span class="text-xs text-text-dim font-display tracking-wide uppercase"
                    >Giờ địa phương</span
                  >
                </div>
                <p class="font-display text-2xl font-bold text-accent-coral tabular-nums">
                  {{ localTime }}
                </p>
                <p class="text-xs text-text-secondary mt-1 truncate">{{ localDate }}</p>
              </div>
            </div>

            <!-- Coordinates -->
            <div class="flex flex-wrap items-center gap-4 mb-8">
              <div class="flex items-center gap-2 text-xs text-text-dim font-display tracking-wide">
                <Icon icon="lucide:map-pin" class="size-3.5 text-accent-coral" />
                {{ currentLocation.lat.toFixed(4) }}°, {{ currentLocation.lon.toFixed(4) }}°
              </div>
              <div class="flex items-center gap-2 text-xs text-text-dim font-display tracking-wide">
                <Icon icon="lucide:timer" class="size-3.5" />
                {{ currentLocation.timezone }}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-4">
              <button
                class="group inline-flex items-center gap-3 bg-accent-coral px-7 py-3.5 font-display font-bold text-bg-deep tracking-wide transition-all duration-300 hover:bg-accent-amber hover:shadow-lg hover:shadow-accent-coral/20 active:scale-95"
                @click="teleport"
              >
                <Icon icon="lucide:zap" class="size-5 transition-transform group-hover:scale-125" />
                DỊCH CHUYỂN TIẾP
              </button>

              <RouterLink
                to="/"
                class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-6 py-3.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
              >
                <Icon icon="lucide:home" class="size-4" />
                Về trang chủ
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
