<script setup lang="ts">
import type { FilterTopology } from '../types'

interface Props {
  topology: FilterTopology
  title: string
  note: string
}

defineProps<Props>()
</script>

<template>
  <section class="border border-border-default bg-bg-surface p-5 animate-fade-up animate-delay-3">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="font-display text-xs tracking-widest text-accent-sky">// SCHEMATIC</div>
        <h2 class="mt-1 font-display text-xl font-semibold text-text-primary">Sơ đồ mạch</h2>
      </div>
      <div class="max-w-2xl text-sm text-text-secondary">
        <span class="text-text-primary">{{ title }}</span>
        <span class="mx-2 text-text-dim">/</span>
        {{ note }}
      </div>
    </div>

    <div class="overflow-x-auto border border-border-default bg-bg-deep p-4">
      <svg
        class="h-auto min-w-[700px]"
        viewBox="0 0 760 300"
        role="img"
        :aria-label="`${title} schematic`"
      >
        <defs>
          <linearGradient id="schematic-grid" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#1f3a52" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#0f1e2f" stop-opacity="0.25" />
          </linearGradient>
          <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" class="fill-border-default" opacity="0.55" />
          </pattern>
        </defs>

        <rect width="760" height="300" fill="url(#schematic-grid)" />
        <rect width="760" height="300" fill="url(#dot-grid)" />

        <g class="font-mono text-[14px]">
          <text x="36" y="58" class="fill-accent-sky">VIN</text>
          <text x="681" y="58" class="fill-accent-coral">VOUT</text>
          <circle cx="78" cy="120" r="6" class="fill-bg-deep stroke-accent-sky" stroke-width="3" />
          <circle
            cx="682"
            cy="120"
            r="6"
            class="fill-bg-deep stroke-accent-coral"
            stroke-width="3"
          />
        </g>

        <g
          v-if="topology === 'rc-lpf'"
          class="fill-none stroke-text-secondary"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M 84 120 H 190" stroke-width="3" />
          <polyline
            points="190,120 205,100 220,140 235,100 250,140 265,100 280,140 295,120"
            class="stroke-accent-coral"
            stroke-width="4"
          />
          <path d="M 295 120 H 682" stroke-width="3" />
          <path d="M 475 120 V 165" stroke-width="3" />
          <path d="M 448 165 H 502 M 448 184 H 502" class="stroke-accent-sky" stroke-width="4" />
          <path d="M 475 184 V 226" stroke-width="3" />
          <path d="M 440 226 H 510 M 452 240 H 498 M 464 254 H 486" stroke-width="3" />
          <text x="226" y="83" class="fill-accent-coral stroke-none font-mono text-[18px]">R</text>
          <text x="511" y="181" class="fill-accent-sky stroke-none font-mono text-[18px]">C</text>
          <text x="430" y="278" class="fill-text-dim stroke-none font-mono text-[13px]">GND</text>
        </g>

        <g
          v-else-if="topology === 'rc-hpf'"
          class="fill-none stroke-text-secondary"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M 84 120 H 210" stroke-width="3" />
          <path d="M 210 94 V 146 M 235 94 V 146" class="stroke-accent-sky" stroke-width="4" />
          <path d="M 235 120 H 682" stroke-width="3" />
          <path d="M 475 120 V 150" stroke-width="3" />
          <polyline
            points="475,150 455,163 495,176 455,189 495,202 455,215 475,228"
            class="stroke-accent-coral"
            stroke-width="4"
          />
          <path d="M 440 228 H 510 M 452 242 H 498 M 464 256 H 486" stroke-width="3" />
          <text x="203" y="83" class="fill-accent-sky stroke-none font-mono text-[18px]">C</text>
          <text x="510" y="194" class="fill-accent-coral stroke-none font-mono text-[18px]">R</text>
          <text x="430" y="278" class="fill-text-dim stroke-none font-mono text-[13px]">GND</text>
        </g>

        <g
          v-else-if="topology === 'rl-lpf'"
          class="fill-none stroke-text-secondary"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M 84 120 H 185" stroke-width="3" />
          <path
            d="M 185 120 C 196 92, 224 92, 235 120 C 246 92, 274 92, 285 120 C 296 92, 324 92, 335 120"
            class="stroke-accent-amber"
            stroke-width="4"
          />
          <path d="M 335 120 H 682" stroke-width="3" />
          <path d="M 500 120 V 150" stroke-width="3" />
          <polyline
            points="500,150 480,163 520,176 480,189 520,202 480,215 500,228"
            class="stroke-accent-coral"
            stroke-width="4"
          />
          <path d="M 465 228 H 535 M 477 242 H 523 M 489 256 H 511" stroke-width="3" />
          <text x="253" y="83" class="fill-accent-amber stroke-none font-mono text-[18px]">L</text>
          <text x="535" y="194" class="fill-accent-coral stroke-none font-mono text-[18px]">R</text>
          <text x="455" y="278" class="fill-text-dim stroke-none font-mono text-[13px]">GND</text>
        </g>

        <g
          v-else-if="topology === 'rl-hpf'"
          class="fill-none stroke-text-secondary"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M 84 120 H 190" stroke-width="3" />
          <polyline
            points="190,120 205,100 220,140 235,100 250,140 265,100 280,140 295,120"
            class="stroke-accent-coral"
            stroke-width="4"
          />
          <path d="M 295 120 H 682" stroke-width="3" />
          <path d="M 500 120 V 146" stroke-width="3" />
          <path
            d="M 500 146 C 472 154, 472 176, 500 184 C 472 192, 472 214, 500 222"
            class="stroke-accent-amber"
            stroke-width="4"
          />
          <path d="M 465 228 H 535 M 477 242 H 523 M 489 256 H 511" stroke-width="3" />
          <path d="M 500 222 V 228" stroke-width="3" />
          <text x="226" y="83" class="fill-accent-coral stroke-none font-mono text-[18px]">R</text>
          <text x="530" y="188" class="fill-accent-amber stroke-none font-mono text-[18px]">L</text>
          <text x="455" y="278" class="fill-text-dim stroke-none font-mono text-[13px]">GND</text>
        </g>

        <g
          v-else-if="topology === 'rlc-bp'"
          class="fill-none stroke-text-secondary"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M 84 120 H 155" stroke-width="3" />
          <circle
            cx="155"
            cy="120"
            r="5"
            class="fill-bg-deep stroke-accent-coral"
            stroke-width="3"
          />
          <polyline
            points="155,120 170,100 185,140 200,100 215,140 230,100 245,140 260,120"
            class="stroke-accent-coral"
            stroke-width="4"
          />
          <circle
            cx="260"
            cy="120"
            r="5"
            class="fill-bg-deep stroke-accent-coral"
            stroke-width="3"
          />
          <path
            d="M 260 120 C 271 92, 299 92, 310 120 C 321 92, 349 92, 360 120"
            class="stroke-accent-amber"
            stroke-width="4"
          />
          <path d="M 360 120 H 430" stroke-width="3" />
          <path d="M 430 94 V 146 M 455 94 V 146" class="stroke-accent-sky" stroke-width="4" />
          <path d="M 455 120 H 620 V 222" stroke-width="3" />
          <path d="M 585 222 H 655 M 597 236 H 643 M 609 250 H 631" stroke-width="3" />
          <path
            d="M 155 75 H 260"
            class="stroke-accent-coral"
            stroke-dasharray="6 8"
            stroke-width="3"
          />
          <text x="177" y="62" class="fill-accent-coral stroke-none font-mono text-[15px]">
            VOUT = V_R
          </text>
          <text x="202" y="83" class="fill-accent-coral stroke-none font-mono text-[18px]">R</text>
          <text x="303" y="83" class="fill-accent-amber stroke-none font-mono text-[18px]">L</text>
          <text x="425" y="83" class="fill-accent-sky stroke-none font-mono text-[18px]">C</text>
          <text x="584" y="274" class="fill-text-dim stroke-none font-mono text-[13px]">GND</text>
        </g>

        <g
          v-else
          class="fill-none stroke-text-secondary"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M 84 120 H 145" stroke-width="3" />
          <polyline
            points="145,120 158,101 171,139 184,101 197,139 210,101 223,139 236,120"
            class="stroke-accent-coral"
            stroke-width="4"
          />
          <path d="M 236 120 H 305" stroke-width="3" />
          <polyline
            points="305,120 318,101 331,139 344,101 357,139 370,101 383,139 396,120"
            class="stroke-accent-coral"
            stroke-width="4"
          />
          <path d="M 396 120 H 445" stroke-width="3" />
          <path d="M 260 120 V 165" stroke-width="3" />
          <path d="M 233 165 H 287 M 233 184 H 287" class="stroke-accent-sky" stroke-width="4" />
          <path d="M 260 184 V 226" stroke-width="3" />
          <path d="M 225 226 H 295 M 237 240 H 283 M 249 254 H 271" stroke-width="3" />
          <path d="M 410 120 V 165" stroke-width="3" />
          <path d="M 383 165 H 437 M 383 184 H 437" class="stroke-accent-sky" stroke-width="4" />
          <path d="M 410 184 V 226" stroke-width="3" />
          <path d="M 375 226 H 445 M 387 240 H 433 M 399 254 H 421" stroke-width="3" />
          <path d="M 445 82 L 445 182 L 555 132 Z" class="stroke-accent-sky" stroke-width="4" />
          <path d="M 555 132 H 682" stroke-width="3" />
          <path
            d="M 500 166 H 590 V 220 H 470 V 166"
            class="stroke-accent-amber"
            stroke-width="3"
            stroke-dasharray="6 8"
          />
          <path d="M 470 166 H 445" stroke-width="3" />
          <text x="430" y="118" class="fill-text-primary stroke-none font-mono text-[18px]">+</text>
          <text x="430" y="160" class="fill-text-primary stroke-none font-mono text-[18px]">-</text>
          <text x="177" y="83" class="fill-accent-coral stroke-none font-mono text-[16px]">R1</text>
          <text x="337" y="83" class="fill-accent-coral stroke-none font-mono text-[16px]">R2</text>
          <text x="292" y="181" class="fill-accent-sky stroke-none font-mono text-[16px]">C1</text>
          <text x="442" y="181" class="fill-accent-sky stroke-none font-mono text-[16px]">C2</text>
          <text x="514" y="238" class="fill-accent-amber stroke-none font-mono text-[15px]">
            K = 1 + Ra/Rb
          </text>
          <text x="214" y="278" class="fill-text-dim stroke-none font-mono text-[13px]">GND</text>
        </g>

        <g class="font-mono text-[12px]">
          <rect
            x="38"
            y="246"
            width="118"
            height="28"
            class="fill-bg-surface stroke-border-default"
          />
          <circle cx="54" cy="260" r="4" class="fill-accent-coral" />
          <text x="66" y="264" class="fill-text-secondary">R</text>
          <circle cx="94" cy="260" r="4" class="fill-accent-sky" />
          <text x="106" y="264" class="fill-text-secondary">C</text>
          <circle cx="134" cy="260" r="4" class="fill-accent-amber" />
          <text x="146" y="264" class="fill-text-secondary">L</text>
        </g>
      </svg>
    </div>
  </section>
</template>
