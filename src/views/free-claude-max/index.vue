<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

const isRevealed = ref(false)
const gifLoaded = ref(false)
const musicLoaded = ref(false)

const videoId = 'lYBUbBu4W08'
const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&t=2`
const gifUrl =
  'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjd2MWVlb3hyMmx4dWhhcGp5bmJmZmRzb2I2ZW0xdWYxbzhrZjJ4aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UeIMji8ti2zeoFI9Wg/giphy.gif'

const isReady = computed(() => gifLoaded.value && musicLoaded.value)

const revealRickroll = (): void => {
  isRevealed.value = true
  gifLoaded.value = false
  musicLoaded.value = false
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <header class="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:text-text-primary"
      >
        &larr; Back to home
      </RouterLink>
    </header>

    <main class="mx-auto w-full max-w-5xl px-6 pb-14">
      <section class="border border-border-default bg-bg-surface p-6 sm:p-8 animate-fade-up animate-delay-2">
        <h1 class="font-display text-4xl font-bold tracking-tight text-accent-coral sm:text-6xl">
          Free Account Claude Max
        </h1>
        <p class="mt-4 max-w-2xl text-sm text-text-secondary sm:text-base">
          One button, one promise, one legendary mistake.
        </p>

        <div v-if="!isRevealed" class="mt-8 animate-fade-up animate-delay-3">
          <button
            type="button"
            class="inline-flex items-center border border-accent-coral bg-accent-coral px-7 py-3 font-display text-sm font-bold tracking-wide text-bg-deep transition-all duration-300 hover:bg-accent-amber"
            @click="revealRickroll"
          >
            Claim
          </button>
        </div>

        <div v-else class="mt-8 animate-fade-up animate-delay-3">
          <div v-if="!isReady" class="border border-border-default bg-bg-deep p-6">
            <p class="font-display text-xl tracking-wide text-accent-amber">Claiming...</p>
            <p class="mt-2 text-sm text-text-secondary">Preparing your premium reward package.</p>
          </div>

          <div v-else class="space-y-5">
            <h2 class="flex items-center gap-3 font-display text-2xl font-semibold text-text-primary">
              <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
              You got rickrolled
            </h2>

            <div class="border border-border-default bg-bg-deep p-4">
              <img
                :src="gifUrl"
                alt="Rickroll dancing animation"
                class="mx-auto block w-full max-w-xl border border-border-default object-cover"
              >
            </div>
          </div>

          <div class="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
            <img :src="gifUrl" alt="" @load="gifLoaded = true">
            <iframe
              :src="embedUrl"
              title="Rickroll music preloader"
              allow="autoplay; encrypted-media; picture-in-picture"
              @load="musicLoaded = true"
            />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
