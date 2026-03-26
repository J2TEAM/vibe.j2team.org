<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useSpotlightProduct } from '@/composables/useSpotlightProduct'

const { product, visible, dismiss } = useSpotlightProduct()
</script>

<template>
  <Transition name="spotlight">
    <div v-if="visible && product" class="fixed z-40 bottom-20 right-6 w-72 max-sm:hidden">
      <div
        class="relative border border-border-default bg-bg-surface p-4 shadow-lg transition-colors duration-300 hover:border-accent-coral/50"
      >
        <!-- Close button -->
        <button
          class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center border border-border-default bg-bg-elevated text-text-dim transition-colors hover:text-text-primary hover:bg-bg-surface cursor-pointer"
          aria-label="Đóng"
          @click.prevent="dismiss"
        >
          <Icon icon="lucide:x" class="w-3.5 h-3.5" />
        </button>

        <!-- Product link -->
        <a :href="product.url" target="_blank" rel="noopener noreferrer" class="block">
          <div class="flex items-center gap-3">
            <img
              :src="product.logo_url"
              :alt="product.name"
              loading="lazy"
              class="w-10 h-10 object-cover flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <span class="font-display font-semibold text-text-primary text-sm leading-tight">
                {{ product.name }}
              </span>
              <p class="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                {{ product.tagline }}
              </p>
            </div>
          </div>

          <!-- Footer: desktop only -->
          <div class="flex items-center justify-between mt-3 max-sm:hidden">
            <span class="flex items-center gap-1 text-xs text-text-dim">
              <Icon icon="lucide:chevrons-up" class="w-3.5 h-3.5" />
              {{ product.votes_count }}
            </span>
            <span class="text-xs text-accent-coral font-display font-semibold">
              Khám phá &rarr;
            </span>
          </div>
        </a>

        <!-- Powered by: desktop only -->
        <div
          class="text-[10px] text-text-dim mt-2 text-center border-t border-border-default pt-2 max-sm:hidden"
        >
          Powered by
          <a
            href="https://launch.j2team.dev?utm_source=vibe&utm_medium=spotlight"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-sky hover:underline"
          >
            J2TEAM Launch
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.spotlight-enter-active,
.spotlight-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.spotlight-enter-from,
.spotlight-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
