<script setup lang="ts">
defineProps<{
  outerStyle: Record<string, string | number>
  innerClass: string
  showGrayCoil: boolean
  walking: boolean
}>()
</script>

<template>
  <div
    class="attendantOuter sceneSeqLayer absolute z-[4] bottom-5 right-[14%] sm:right-[16%] will-change-transform pointer-events-none"
    :style="outerStyle"
    aria-hidden="true"
  >
    <div class="attendantInner origin-bottom" :class="innerClass">
      <svg
        class="block text-text-primary overflow-visible"
        width="64"
        height="76"
        viewBox="0 0 64 76"
        aria-hidden="true"
      >
        <path
          v-if="showGrayCoil"
          d="M56 46 C52 45 48 44 42 44 C36 44 30 44 24 45"
          stroke="rgba(56,56,56,.55)"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
        />
        <ellipse cx="32" cy="18" rx="11" ry="11" fill="#253549" />
        <ellipse
          cx="32"
          cy="14"
          rx="12"
          ry="5"
          fill="#162232"
          stroke="rgba(255,184,48,.35)"
          stroke-width="0.75"
        />
        <rect x="21" y="26" width="22" height="24" fill="#FFB830" opacity=".92" />
        <rect x="25" y="30" width="14" height="16" fill="#FF6B4A" opacity=".88" />
        <rect x="23" y="33" width="18" height="2.2" fill="rgba(232,244,255,.92)" opacity=".95" />
        <rect x="23" y="39" width="18" height="1.8" fill="rgba(232,244,255,.55)" opacity=".9" />
        <path stroke="currentColor" stroke-opacity=".25" stroke-width="1" d="M16 32h7M41 32h7" />
        <rect x="23" y="50" width="7" height="21" fill="#253549" />
        <rect x="34" y="50" width="7" height="21" fill="#253549" />
        <path
          d="M22 44 C17 46 14 48 10 50"
          stroke="rgba(255,184,48,.88)"
          stroke-width="3.2"
          fill="none"
          stroke-linecap="round"
        />
        <path
          v-if="walking"
          d="M10 50 C2 47.8 -5 45.5 -13 43"
          stroke="rgba(255,184,48,.82)"
          stroke-width="2.9"
          fill="none"
          stroke-linecap="round"
        />
        <circle
          cx="10"
          cy="50"
          r="4.2"
          fill="#162232"
          stroke="rgba(255,184,48,.85)"
          stroke-width="1.2"
        />
      </svg>
    </div>
  </div>
</template>
