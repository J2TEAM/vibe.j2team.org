<script setup lang="ts">
import SoundSlider from './SoundSlider.vue'
import rainUrl from '../../assets/sounds/liecio-calming-rain-257596.mp3'
import birdsUrl from '../../assets/sounds/sspsurvival-the-voices-of-birds-in-the-forest-7715.mp3'
import keyboardUrl from '../../assets/sounds/mr_qualityz-keyboard-sound-200501.mp3'
import { useChillI18n } from '../../composables/useChillI18n'

const { t } = useChillI18n()
const soundUrls = {
  rain: [rainUrl],
  birds: [birdsUrl],
  keyboard: [keyboardUrl],
}
</script>

<template>
  <div
    class="border border-border-default bg-bg-surface p-4 transition-all duration-300 hover:border-accent-amber/50"
  >
    <p class="text-text-secondary text-sm mb-4">
      {{ t.soundsDescription }}
    </p>
    <div class="grid gap-3 sm:grid-cols-1">
      <SoundSlider :name="t.rain" :sources="soundUrls.rain" store-key="rain" />
      <SoundSlider :name="t.birds" :sources="soundUrls.birds" store-key="birds" />
      <SoundSlider :name="t.keyboard" :sources="soundUrls.keyboard" store-key="keyboard" />
    </div>
  </div>
</template>
